/* eslint-env jest, browser */
import React from 'react'; // eslint-disable-line no-unused-vars
import {mount} from 'enzyme';

import Button from '../../../src/components/button/button.jsx'; // eslint-disable-line no-unused-vars
import Dropdown from '../../../src/components/dropdown/dropdown.jsx'; // eslint-disable-line no-unused-vars

const press = (key, init) => {
    const event = new KeyboardEvent('keydown', Object.assign({key, bubbles: true, cancelable: true}, init));
    (document.activeElement || document.body).dispatchEvent(event);
    return event;
};

describe('Dropdown', () => {
    let host;
    let wrapper;
    let handlers;
    let onDocumentKey;

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
    const isOpen = () => trigger().getAttribute('aria-expanded') === 'true';
    const focusedText = () => document.activeElement.textContent;
    const settle = () => {
        jest.runOnlyPendingTimers();
        wrapper.update();
    };

    const openWithKey = (key, init) => {
        trigger().focus();
        const event = press(key, init);
        settle();
        return event;
    };

    const openWithPointer = () => {
        trigger().focus();
        wrapper.find('[aria-haspopup]').simulate('click', {detail: 1});
        settle();
    };

    beforeEach(() => {
        jest.useFakeTimers();
        host = document.createElement('div');
        document.body.appendChild(host);
        onDocumentKey = jest.fn();
        document.addEventListener('keydown', onDocumentKey);
    });

    afterEach(() => {
        document.removeEventListener('keydown', onDocumentKey);
        if (wrapper.exists()) wrapper.unmount();
        host.remove();
        jest.useRealTimers();
    });

    describe('opened from the keyboard', () => {
        test('the trigger is a button that says whether its menu is open', () => {
            mountMenu();
            expect(trigger().getAttribute('role')).toBe('button');
            expect(trigger().tabIndex).toBe(0);
            expect(isOpen()).toBe(false);
            openWithKey('Enter');
            expect(isOpen()).toBe(true);
        });

        test('Enter, Space and the down arrow open the menu on its first item', () => {
            ['Enter', ' ', 'ArrowDown'].forEach(key => {
                mountMenu();
                const event = openWithKey(key);
                expect(isOpen()).toBe(true);
                expect(focusedText()).toBe('First');
                expect(event.defaultPrevented).toBe(true);
                wrapper.unmount();
            });
            expect(onDocumentKey).not.toHaveBeenCalled();
        });

        test('other keys, shortcuts and held keys leave the menu closed', () => {
            mountMenu();
            openWithKey('a');
            openWithKey('Enter', {ctrlKey: true});
            expect(onDocumentKey).toHaveBeenCalledTimes(2);
            openWithKey('Enter', {repeat: true});
            expect(isOpen()).toBe(false);
            expect(document.activeElement).toBe(trigger());
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
            press('ArrowLeft');
            expect(focusedText()).toBe('First');
            press('ArrowRight');
            expect(focusedText()).toBe('Third');
            expect(onDocumentKey).not.toHaveBeenCalled();
        });

        test('Enter and Space run the focused item', () => {
            mountMenu();
            openWithKey('Enter');
            const enter = press('Enter');
            expect(handlers.first).toHaveBeenCalledTimes(1);
            expect(enter.defaultPrevented).toBe(true);
            press('ArrowDown');
            press(' ');
            expect(handlers.third).toHaveBeenCalledTimes(1);
            expect(handlers.second).not.toHaveBeenCalled();
            expect(isOpen()).toBe(true);
            expect(onDocumentKey).not.toHaveBeenCalled();
        });

        test('a key held down to open the menu does not run or pass its first item', () => {
            mountMenu();
            openWithKey('Enter');
            press('Enter', {repeat: true});
            press(' ', {repeat: true});
            expect(handlers.first).not.toHaveBeenCalled();
            wrapper.unmount();
            mountMenu();
            openWithKey('ArrowDown');
            press('ArrowDown', {repeat: true});
            expect(focusedText()).toBe('First');
            press('ArrowDown');
            press('ArrowDown', {repeat: true});
            expect(focusedText()).toBe('First');
            expect(onDocumentKey).not.toHaveBeenCalled();
        });

        test('an item that closes the menu hands focus back to the trigger', () => {
            mountMenu();
            handlers.first.mockImplementation(() => wrapper.instance().handleClosePopover());
            openWithKey('Enter');
            press('Enter');
            settle();
            expect(isOpen()).toBe(false);
            expect(document.activeElement).toBe(trigger());
            press('Enter', {repeat: true});
            settle();
            expect(isOpen()).toBe(false);
        });

        test('Escape closes the menu and puts focus back on the trigger', () => {
            mountMenu();
            openWithKey('Enter');
            expect(isOpen()).toBe(true);
            press('Escape');
            settle();
            expect(isOpen()).toBe(false);
            expect(document.activeElement).toBe(trigger());
        });

        test('Tab closes the menu and leaves from the trigger', () => {
            mountMenu();
            openWithKey('Enter');
            expect(isOpen()).toBe(true);
            const tab = press('Tab');
            settle();
            expect(tab.defaultPrevented).toBe(false);
            expect(isOpen()).toBe(false);
            expect(document.activeElement).toBe(trigger());
        });

        test('a menu with its own close handling is asked to close', () => {
            const onOuterAction = jest.fn();
            mountMenu({onOuterAction});
            openWithKey('Enter');
            press('Escape');
            expect(onOuterAction).toHaveBeenCalledTimes(1);
        });

        test('keys typed in a field elsewhere are left alone while the menu is open', () => {
            mountMenu();
            const field = document.createElement('input');
            document.body.appendChild(field);
            openWithKey('Enter');
            expect(isOpen()).toBe(true);
            field.focus();
            const event = press('ArrowDown');
            expect(event.defaultPrevented).toBe(false);
            expect(document.activeElement).toBe(field);
            expect(onDocumentKey).toHaveBeenCalledTimes(1);
            field.remove();
        });

        test('shortcuts pass through an open menu', () => {
            mountMenu();
            openWithKey('Enter');
            const event = press('z', {ctrlKey: true});
            expect(event.defaultPrevented).toBe(false);
            expect(onDocumentKey).toHaveBeenCalledTimes(1);
        });

        test('unmounting an open menu stops it listening for keys', () => {
            mountMenu();
            openWithKey('Enter');
            expect(isOpen()).toBe(true);
            wrapper.unmount();
            const event = press('ArrowDown');
            expect(event.defaultPrevented).toBe(false);
            expect(onDocumentKey).toHaveBeenCalledTimes(1);
        });
    });

    describe('opened with a pointer', () => {
        test('the trigger does not keep focus, so keys still reach the canvas', () => {
            mountMenu();
            openWithPointer();
            expect(isOpen()).toBe(true);
            expect(document.activeElement).not.toBe(trigger());
            const down = press('ArrowDown');
            const escape = press('Escape');
            expect(down.defaultPrevented).toBe(false);
            expect(escape.defaultPrevented).toBe(false);
            expect(onDocumentKey).toHaveBeenCalledTimes(2);
            expect(isOpen()).toBe(true);
            expect(document.activeElement).not.toBe(trigger());
        });

        test('closing leaves focus off the trigger', () => {
            mountMenu();
            openWithPointer();
            document.querySelector('.Popover [role="button"]').focus();
            wrapper.instance().handleClosePopover();
            settle();
            expect(isOpen()).toBe(false);
            expect(document.activeElement).not.toBe(trigger());
            const down = press('ArrowDown');
            expect(down.defaultPrevented).toBe(false);
            expect(isOpen()).toBe(false);
        });

        test('a second click closes the menu', () => {
            mountMenu();
            openWithPointer();
            openWithPointer();
            expect(isOpen()).toBe(false);
            expect(document.activeElement).not.toBe(trigger());
        });
    });
});
