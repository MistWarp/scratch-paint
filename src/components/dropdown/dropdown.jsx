import bindAll from 'lodash.bindall';
import classNames from 'classnames';
import Popover from 'react-popover';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './dropdown.css';

import DropdownIcon from './dropdown-caret.jsx';

const NATIVE_CONTROLS = 'button, a[href], input, select, textarea';
const MENU_ITEMS = `[role="button"], ${NATIVE_CONTROLS}`;
const MOVE_KEYS = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
const OPEN_KEYS = ['Enter', ' ', 'ArrowDown'];

const isEnabled = item => !item.disabled && item.getAttribute('aria-disabled') !== 'true';

const isPlainKey = event => !(event.ctrlKey || event.metaKey || event.altKey || event.isComposing);

const moveFor = (key, rtl) => {
    if (key === 'Home') return 'first';
    if (key === 'End') return 'last';
    if (key === 'ArrowDown') return 1;
    if (key === 'ArrowUp') return -1;
    return (key === 'ArrowRight') === rtl ? -1 : 1;
};

const pickItem = (items, current, move) => {
    const enabled = items.filter(isEnabled);
    if (move === 'first' || (current < 0 && move === 1)) return enabled[0] || null;
    if (move === 'last' || current < 0) return enabled[enabled.length - 1] || null;
    for (let offset = 1; offset <= items.length; offset++) {
        const index = (((current + (move * offset)) % items.length) + items.length) % items.length;
        if (isEnabled(items[index])) return items[index];
    }
    return null;
};

class Dropdown extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClick',
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
            if (this.usingKeys) document.addEventListener('keydown', this.handleMenuKeyDown, true);
            return;
        }
        this.stopMenuKeys();
        this.usingKeys = false;
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
        if (!items.length) return;
        const rtl = getComputedStyle(items[0]).direction === 'rtl';
        const item = pickItem(items, items.indexOf(document.activeElement), moveFor(key, rtl));
        if (item) item.focus({preventScroll: true});
    }
    openWithKeys () {
        this.usingKeys = true;
        this.afterOpeningKey = true;
        this.handleToggleOpenState();
        this.focusTimer = setTimeout(() => this.moveFocus('Home'), 0);
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
    handleClick (event) {
        if (event.detail > 0) {
            this.usingKeys = false;
            this.handleToggleOpenState();
            this.trigger.blur();
        } else if (this.state.isOpen) {
            this.handleToggleOpenState();
        } else {
            this.openWithKeys();
        }
    }
    handleKeyDown (event) {
        if (this.state.isOpen || event.target !== event.currentTarget) return;
        if (!isPlainKey(event) || !OPEN_KEYS.includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) this.openWithKeys();
    }
    handleMenuKeyDown (event) {
        const menu = this.getMenu();
        const active = document.activeElement;
        const inMenu = Boolean(menu && menu.contains(active));
        const onTrigger = active === this.trigger;
        if (!inMenu && !onTrigger && active && active !== document.body) return;
        if (!isPlainKey(event)) return;
        if (!event.repeat) this.afterOpeningKey = false;
        if (event.key === 'Tab') {
            this.dismiss(event);
            if (!onTrigger) this.trigger.focus({preventScroll: true});
            return;
        }
        const activates = event.key === 'Enter' || event.key === ' ';
        const moves = MOVE_KEYS.includes(event.key);
        if (event.key !== 'Escape' && !activates && !moves) return;
        event.stopPropagation();
        const held = event.repeat && (activates || this.afterOpeningKey);
        if (activates && inMenu && active.matches(NATIVE_CONTROLS) && !held) return;
        event.preventDefault();
        if (held) return;
        if (moves) {
            this.moveFocus(event.key);
        } else if (activates && inMenu) {
            if (isEnabled(active)) active.click();
            if (!this.state.isOpen) this.trigger.focus({preventScroll: true});
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
        if (this.trigger) this.trigger.removeEventListener('keydown', this.handleKeyDown);
        this.trigger = trigger;
        if (trigger) trigger.addEventListener('keydown', this.handleKeyDown);
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
                    onClick={this.handleClick}
                >
                    {this.props.children}
                    <DropdownIcon
                        aria-hidden="true"
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
