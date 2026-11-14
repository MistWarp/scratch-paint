/* eslint-env jest, browser */
import React from 'react'; // eslint-disable-line no-unused-vars
import {mount} from 'enzyme';

import Button from '../../../src/components/button/button.jsx'; // eslint-disable-line no-unused-vars
import Dropdown from '../../../src/components/dropdown/dropdown.jsx'; // eslint-disable-line no-unused-vars

const press = key => {
    const event = new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true});
    (document.activeElement || document.body).dispatchEvent(event);
    return event;
};

describe('Dropdown keyboard use', () => {
    let host;
    let wrapper;
    let handlers;

    const mountMenu = props => {
        handlers = {first: jest.fn(), second: jest.fn(), third: jest.fn()};
        wrapper = mount(
            <Dropdown
                enterExitTransitionDurationMs={0}
                popoverContent={
                    <div>
                        <Button onClick={handlers.first}>{'First'}</Button>
                        <Button
                            disabled
                            onClick={handlers.second}
                        >{'Second'}</Button>
                        <Button onClick={handlers.third}>{'Third'}</Button>
                    </div>
                }
                {...props}
            >
                {'Arrange'}
            </Dropdown>,
            {attachTo: host}
        );
    };

    const trigger = () => host.querySelector('[aria-haspopup]');
    const focusedText = () => document.activeElement.textContent;

    const openWithKey = key => {
        trigger().focus();
        const event = press(key);
        jest.runOnlyPendingTimers();
        wrapper.update();
        return event;
    };

    beforeEach(() => {
        jest.useFakeTimers();
        host = document.createElement('div');
        document.body.appendChild(host);
    });

    afterEach(() => {
        wrapper.unmount();
        host.remove();
        jest.useRealTimers();
    });

    test('the trigger is a button that says whether its menu is open', () => {
        mountMenu();
        expect(trigger().getAttribute('role')).toBe('button');
        expect(trigger().tabIndex).toBe(0);
        expect(trigger().getAttribute('aria-expanded')).toBe('false');
        openWithKey('Enter');
        expect(trigger().getAttribute('aria-expanded')).toBe('true');
    });

    test('Enter, Space and the down arrow open the menu on its first item', () => {
        ['Enter', ' ', 'ArrowDown'].forEach(key => {
            mountMenu();
            openWithKey(key);
            expect(focusedText()).toBe('First');
            wrapper.unmount();
        });
        mountMenu();
    });

    test('other keys leave the menu closed', () => {
        mountMenu();
        openWithKey('a');
        expect(trigger().getAttribute('aria-expanded')).toBe('false');
    });

    test('the key that opens the menu does not reach the canvas', () => {
        mountMenu();
        const onDocumentKey = jest.fn();
        document.addEventListener('keydown', onDocumentKey);
        const event = openWithKey('ArrowDown');
        expect(event.defaultPrevented).toBe(true);
        expect(onDocumentKey).not.toHaveBeenCalled();
        trigger().blur();
        press('Escape');
        openWithKey('a');
        expect(onDocumentKey).toHaveBeenCalledTimes(1);
        document.removeEventListener('keydown', onDocumentKey);
    });

    test('arrow keys move between the items that can be used', () => {
        mountMenu();
        openWithKey('Enter');
        press('ArrowDown');
        expect(focusedText()).toBe('Third');
        press('ArrowDown');
        expect(focusedText()).toBe('First');
        press('ArrowUp');
        expect(focusedText()).toBe('Third');
        press('Home');
        expect(focusedText()).toBe('First');
        press('End');
        expect(focusedText()).toBe('Third');
    });

    test('Enter and Space run the focused item and keep the keys away from the canvas', () => {
        mountMenu();
        const onDocumentKey = jest.fn();
        document.addEventListener('keydown', onDocumentKey);
        openWithKey('Enter');
        const enter = press('Enter');
        expect(handlers.first).toHaveBeenCalledTimes(1);
        expect(enter.defaultPrevented).toBe(true);
        press('ArrowDown');
        press(' ');
        expect(handlers.third).toHaveBeenCalledTimes(1);
        expect(handlers.second).not.toHaveBeenCalled();
        expect(onDocumentKey).not.toHaveBeenCalled();
        document.removeEventListener('keydown', onDocumentKey);
    });

    test('Escape closes the menu and puts focus back on the trigger', () => {
        mountMenu();
        openWithKey('Enter');
        press('Escape');
        wrapper.update();
        expect(trigger().getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(trigger());
    });

    test('Tab closes the menu and leaves from the trigger', () => {
        mountMenu();
        openWithKey('Enter');
        const tab = press('Tab');
        wrapper.update();
        expect(tab.defaultPrevented).toBe(false);
        expect(trigger().getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(trigger());
    });

    test('a menu with its own close handling is asked to close', () => {
        const onOuterAction = jest.fn();
        mountMenu({onOuterAction});
        openWithKey('Enter');
        press('Escape');
        expect(onOuterAction).toHaveBeenCalledTimes(1);
    });

    test('keys typed elsewhere on the page are left alone while the menu is open', () => {
        mountMenu();
        const field = document.createElement('input');
        document.body.appendChild(field);
        wrapper.find('[aria-haspopup]').simulate('click');
        field.focus();
        const event = press('ArrowDown');
        expect(event.defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(field);
        field.remove();
    });
});
