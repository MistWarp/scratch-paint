/* eslint-env jest */
import React from 'react'; // eslint-disable-line no-unused-vars
import {mount} from 'enzyme';
import {IntlProvider} from 'react-intl'; // eslint-disable-line no-unused-vars

import Stepper, {stepValue} from '../../../src/components/stepper/stepper.jsx'; // eslint-disable-line no-unused-vars

const mountStepper = props => mount(
    <IntlProvider locale="en">
        <Stepper
            name="Size"
            {...props}
        />
    </IntlProvider>
);

const press = button => button.simulate('pointerdown', {pointerType: 'mouse', button: 0});

class Field extends React.Component {
    constructor (props) {
        super(props);
        this.state = {value: props.value, disabled: false};
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleSubmit (value) {
        this.props.onSubmit(value);
        this.setState({value});
    }
    render () {
        return (
            <IntlProvider locale="en">
                <Stepper
                    disabled={this.state.disabled}
                    max={100}
                    min={1}
                    name="Size"
                    value={this.state.value}
                    onSubmit={this.handleSubmit}
                />
            </IntlProvider>
        );
    }
}

describe('stepValue', () => {
    test('moves by one step in either direction', () => {
        expect(stepValue(10, 1, {step: 1})).toBe(11);
        expect(stepValue(10, -1, {step: 1})).toBe(9);
    });

    test('stays inside the limits', () => {
        expect(stepValue(100, 1, {min: 1, max: 100, step: 1})).toBe(100);
        expect(stepValue(1, -1, {min: 1, max: 100, step: 1})).toBe(1);
        expect(stepValue(250, 1, {min: 1, max: 100, step: 1})).toBe(100);
    });

    test('keeps decimal steps exact', () => {
        expect(stepValue(0.1, 1, {step: 0.1})).toBe(0.2);
        expect(stepValue(0.3, -1, {step: 0.1})).toBe(0.2);
    });

    test('lands on the nearest step when the value sits between two', () => {
        expect(stepValue(3.78, 1, {step: 1})).toBe(4);
        expect(stepValue(3.78, -1, {step: 1})).toBe(3);
        expect(stepValue(2.5, 1, {step: 1})).toBe(3);
        expect(stepValue(2.5, -1, {step: 1})).toBe(2);
        expect(stepValue(0.01, 1, {min: 0.01, step: 0.1})).toBe(0.1);
        expect(stepValue(0.1, -1, {min: 0.01, step: 0.1})).toBe(0.01);
    });

    test('goes to the minimum when the field holds no number', () => {
        expect(stepValue('', 1, {min: 4, step: 1})).toBe(4);
        expect(stepValue(null, -1, {min: 4, step: 1})).toBe(4);
        expect(stepValue('abc', 1, {step: 1})).toBe(0);
    });
});

describe('Stepper', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('labels the group and the number field with the name, and the buttons with what they do', () => {
        const wrapper = mountStepper({value: 10, onSubmit: jest.fn()});
        expect(wrapper.find('input').prop('aria-label')).toBe('Size');
        expect(wrapper.find('[role="group"]').prop('aria-label')).toBe('Size');
        expect(wrapper.find('button').at(0)
            .prop('aria-label')).toBe('Decrease');
        expect(wrapper.find('button').at(1)
            .prop('aria-label')).toBe('Increase');
    });

    test('a press after typing shows the stepped number, not the typed one', () => {
        const onSubmit = jest.fn();
        const wrapper = mount(
            <Field
                value={10}
                onSubmit={onSubmit}
            />
        );
        wrapper.find('input').simulate('change', {target: {value: '5'}});
        expect(wrapper.find('input').prop('value')).toBe('5');
        press(wrapper.find('button').at(1));
        wrapper.find('button').at(1)
            .simulate('pointerup');
        wrapper.update();
        expect(onSubmit).toHaveBeenLastCalledWith(6);
        expect(wrapper.find('input').prop('value')).toBe(6);
    });

    test('a held button stops when the field is switched off', () => {
        const onSubmit = jest.fn();
        const wrapper = mount(
            <Field
                value={10}
                onSubmit={onSubmit}
            />
        );
        press(wrapper.find('button').at(1));
        jest.advanceTimersByTime(400 + 60);
        const calls = onSubmit.mock.calls.length;
        expect(calls).toBeGreaterThan(1);
        wrapper.setState({disabled: true});
        jest.advanceTimersByTime(2000);
        expect(onSubmit).toHaveBeenCalledTimes(calls);
    });

    test('a held button stops when the window loses focus', () => {
        const onSubmit = jest.fn();
        const wrapper = mountStepper({value: 10, onSubmit});
        press(wrapper.find('button').at(1));
        window.dispatchEvent(new Event('blur'));
        jest.advanceTimersByTime(2000);
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    test('a press changes the value by one step', () => {
        const onSubmit = jest.fn();
        const wrapper = mountStepper({value: 10, min: 1, max: 100, onSubmit});
        press(wrapper.find('button').at(1));
        wrapper.find('button').at(1)
            .simulate('pointerup');
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith(11);
        press(wrapper.find('button').at(0));
        wrapper.find('button').at(0)
            .simulate('pointerup');
        expect(onSubmit).toHaveBeenLastCalledWith(9);
    });

    test('holding a button keeps stepping until it is released', () => {
        const onSubmit = jest.fn();
        const wrapper = mountStepper({value: 10, min: 1, max: 100, onSubmit});
        const plus = wrapper.find('button').at(1);
        press(plus);
        expect(onSubmit).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(399);
        expect(onSubmit).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(1 + (60 * 3));
        expect(onSubmit).toHaveBeenCalledTimes(5);
        plus.simulate('pointerup');
        jest.advanceTimersByTime(1000);
        expect(onSubmit).toHaveBeenCalledTimes(5);
    });

    test('a secondary mouse button does nothing', () => {
        const onSubmit = jest.fn();
        const wrapper = mountStepper({value: 10, onSubmit});
        wrapper.find('button').at(1)
            .simulate('pointerdown', {pointerType: 'mouse', button: 2});
        expect(onSubmit).not.toHaveBeenCalled();
    });

    test('a keyboard activation steps once and a pointer click does not step twice', () => {
        const onSubmit = jest.fn();
        const wrapper = mountStepper({value: 10, onSubmit});
        wrapper.find('button').at(1)
            .simulate('click', {detail: 0});
        expect(onSubmit).toHaveBeenCalledTimes(1);
        wrapper.find('button').at(1)
            .simulate('click', {detail: 1});
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    test('the buttons switch off at the limits and when disabled', () => {
        const atMin = mountStepper({value: 1, min: 1, max: 100, onSubmit: jest.fn()});
        expect(atMin.find('button').at(0)
            .prop('disabled')).toBe(true);
        expect(atMin.find('button').at(1)
            .prop('disabled')).toBe(false);
        const atMax = mountStepper({value: 100, min: 1, max: 100, onSubmit: jest.fn()});
        expect(atMax.find('button').at(1)
            .prop('disabled')).toBe(true);
        const disabled = mountStepper({value: 10, disabled: true, onSubmit: jest.fn()});
        expect(disabled.find('button').at(0)
            .prop('disabled')).toBe(true);
        expect(disabled.find('button').at(1)
            .prop('disabled')).toBe(true);
        expect(disabled.find('input').prop('disabled')).toBe(true);
    });

    test('unmounting stops a held button', () => {
        const onSubmit = jest.fn();
        const wrapper = mountStepper({value: 10, onSubmit});
        press(wrapper.find('button').at(1));
        wrapper.unmount();
        jest.advanceTimersByTime(2000);
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });
});
