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

    test('starts from the minimum when the field holds no number', () => {
        expect(stepValue('', 1, {min: 4, step: 1})).toBe(5);
        expect(stepValue(null, -1, {min: 4, step: 1})).toBe(4);
        expect(stepValue('abc', 1, {step: 1})).toBe(1);
    });
});

describe('Stepper', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('labels the number field with its name', () => {
        const wrapper = mountStepper({value: 10, onSubmit: jest.fn()});
        expect(wrapper.find('input').prop('aria-label')).toBe('Size');
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
