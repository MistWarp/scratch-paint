import bindAll from 'lodash.bindall';
import classNames from 'classnames';
import Popover from 'react-popover';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './dropdown.css';

import DropdownIcon from './dropdown-caret.jsx';

const NATIVE_CONTROLS = 'button, a[href], input, select, textarea';
const MENU_ITEMS = `[role="button"], ${NATIVE_CONTROLS}`;
const MOVE_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
const OPEN_KEYS = ['Enter', ' ', 'ArrowDown'];

const isEnabled = item => !item.disabled && item.getAttribute('aria-disabled') !== 'true';

const pickItem = (items, current, key) => {
    const enabled = items.filter(isEnabled);
    if (key === 'Home' || (current < 0 && key === 'ArrowDown')) return enabled[0] || null;
    if (key === 'End' || current < 0) return enabled[enabled.length - 1] || null;
    const step = key === 'ArrowDown' ? 1 : -1;
    for (let offset = 1; offset <= items.length; offset++) {
        const index = (((current + (step * offset)) % items.length) + items.length) % items.length;
        if (isEnabled(items[index])) return items[index];
    }
    return null;
};

class Dropdown extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClosePopover',
            'handleKeyDown',
            'handleMenuKeyDown',
            'handleToggleOpenState',
            'isOpen',
            'setPopover',
            'setTrigger'
        ]);
        this.state = {
            isOpen: false
        };
    }
    componentDidUpdate (prevProps, prevState) {
        if (this.state.isOpen === prevState.isOpen) return;
        if (this.state.isOpen) {
            document.addEventListener('keydown', this.handleMenuKeyDown, true);
        } else {
            this.stopMenuKeys();
            const menu = this.getMenu();
            if (menu && menu.contains(document.activeElement)) this.trigger.focus({preventScroll: true});
        }
    }
    componentWillUnmount () {
        this.stopMenuKeys();
    }
    stopMenuKeys () {
        clearTimeout(this.focusTimer);
        document.removeEventListener('keydown', this.handleMenuKeyDown, true);
    }
    getMenu () {
        return this.popover ? this.popover.containerEl : null;
    }
    moveFocus (key) {
        const menu = this.getMenu();
        if (!menu) return;
        const items = Array.from(menu.querySelectorAll(MENU_ITEMS));
        const item = pickItem(items, items.indexOf(document.activeElement), key);
        if (item) item.focus({preventScroll: true});
    }
    dismiss (event) {
        if (this.props.onOuterAction) {
            this.props.onOuterAction(event);
        } else {
            this.handleClosePopover();
        }
    }
    handleClosePopover () {
        this.setState({
            isOpen: false
        });
    }
    handleToggleOpenState () {
        const newState = !this.state.isOpen;
        this.setState({
            isOpen: newState
        });
        if (newState && this.props.onOpen) {
            this.props.onOpen();
        }
    }
    handleKeyDown (event) {
        if (this.state.isOpen || event.target !== event.currentTarget) return;
        if (!OPEN_KEYS.includes(event.key)) return;
        event.preventDefault();
        this.handleToggleOpenState();
        this.focusTimer = setTimeout(() => this.moveFocus('Home'), 0);
    }
    handleMenuKeyDown (event) {
        const menu = this.getMenu();
        const active = document.activeElement;
        const inMenu = Boolean(menu && menu.contains(active));
        const onTrigger = active === this.trigger;
        if (!inMenu && !onTrigger && active && active !== document.body) return;
        if (event.key === 'Tab') {
            this.dismiss(event);
            if (!onTrigger) this.trigger.focus({preventScroll: true});
            return;
        }
        const activates = event.key === 'Enter' || event.key === ' ';
        if (activates && inMenu && active.matches(NATIVE_CONTROLS)) return;
        if (event.key !== 'Escape' && !activates && !MOVE_KEYS.includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        if (MOVE_KEYS.includes(event.key)) {
            this.moveFocus(event.key);
        } else if (activates && inMenu) {
            if (isEnabled(active)) active.click();
        } else {
            this.dismiss(event);
            this.trigger.focus({preventScroll: true});
        }
    }
    isOpen () {
        return this.state.isOpen;
    }
    setPopover (popover) {
        this.popover = popover;
    }
    setTrigger (trigger) {
        this.trigger = trigger;
    }
    render () {
        return (
            <Popover
                body={this.props.popoverContent}
                isOpen={this.state.isOpen}
                preferPlace="below"
                ref={this.setPopover}
                onOuterAction={this.props.onOuterAction ?
                    this.props.onOuterAction : this.handleClosePopover}
                {...this.props}
            >
                <div
                    aria-expanded={this.state.isOpen}
                    aria-haspopup="true"
                    className={classNames(styles.dropdown, this.props.className, {
                        [styles.modOpen]: this.state.isOpen,
                        [styles.modClosed]: !this.state.isOpen
                    })}
                    ref={this.setTrigger}
                    role="button"
                    tabIndex={0}
                    onClick={this.handleToggleOpenState}
                    onKeyDown={this.handleKeyDown}
                >
                    {this.props.children}
                    <DropdownIcon
                        className={classNames(styles.dropdownIcon, {
                            [styles.modCaretUp]: this.state.isOpen
                        })}
                        draggable={false}
                    />
                </div>
            </Popover>
        );
    }
}

Dropdown.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onOpen: PropTypes.func,
    onOuterAction: PropTypes.func,
    popoverContent: PropTypes.node.isRequired
};

export default Dropdown;
