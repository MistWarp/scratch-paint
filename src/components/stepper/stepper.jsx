import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {Minus, Plus} from 'lucide-react';

import Input from '../forms/input.jsx';
import LiveInputHOC from '../forms/live-input-hoc.jsx';
import styles from './stepper.css';

const LiveInput = LiveInputHOC(Input);

const messages = defineMessages({
    decrease: {
        defaultMessage: 'Decrease',
        description: 'Label for the minus button beside a number field, such as brush size',
        id: 'paint.stepper.decrease'
    },
    increase: {
        defaultMessage: 'Increase',
        description: 'Label for the plus button beside a number field, such as brush size',
        id: 'paint.stepper.increase'
    }
});

const HOLD_DELAY_MS = 400;
const REPEAT_DELAY_MS = 60;

const decimalsOf = step => {
    const text = String(step);
    const point = text.indexOf('.');
    return point === -1 ? 0 : text.length - point - 1;
};

const stepValue = (value, direction, {min, max, step}) => {
    const lower = typeof min === 'undefined' ? -Infinity : Number(min);
    const upper = typeof max === 'undefined' ? Infinity : Number(max);
    const clamp = number => Math.min(Math.max(number, lower), upper);
    const current = value === '' || value === null ? NaN : Number(value);
    if (isNaN(current)) return clamp(0);
    const steps = Number((current / step).toFixed(6));
    const target = direction > 0 ? Math.floor(steps) + 1 : Math.ceil(steps) - 1;
    return clamp(Number((target * step).toFixed(decimalsOf(step))));
};

class Stepper extends React.Component {
    constructor (props) {
        super(props);
        this.handleStop = this.handleStop.bind(this);
        this.setInput = this.setInput.bind(this);
        this.handleDecreaseDown = this.handlePointerDown.bind(this, -1);
        this.handleIncreaseDown = this.handlePointerDown.bind(this, 1);
        this.handleDecreaseClick = this.handleClick.bind(this, -1);
        this.handleIncreaseClick = this.handleClick.bind(this, 1);
        this.timer = null;
        this.input = null;
    }
    componentDidUpdate (prevProps) {
        if (this.props.disabled && !prevProps.disabled) this.handleStop();
    }
    componentWillUnmount () {
        this.handleStop();
    }
    setInput (input) {
        this.input = input;
    }
    nudge (direction) {
        if (this.props.disabled) {
            this.handleStop();
            return;
        }
        if (this.input) this.input.handleFlush();
        const next = stepValue(this.props.value, direction, this.props);
        if (next === Number(this.props.value)) {
            this.handleStop();
            return;
        }
        this.props.onSubmit(next);
    }
    handlePointerDown (direction, event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        this.handleStop();
        window.addEventListener('blur', this.handleStop);
        this.nudge(direction);
        const repeat = delay => {
            this.timer = setTimeout(() => {
                this.nudge(direction);
                if (this.timer !== null) repeat(REPEAT_DELAY_MS);
            }, delay);
        };
        repeat(HOLD_DELAY_MS);
    }
    handleClick (direction, event) {
        if (event.detail === 0) this.nudge(direction);
    }
    handleStop () {
        window.removeEventListener('blur', this.handleStop);
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    render () {
        const {className, disabled, intl, max, min, name, step, value, wide, onSubmit} = this.props;
        const current = Number(value);
        const atMin = typeof min !== 'undefined' && current <= Number(min);
        const atMax = typeof max !== 'undefined' && current >= Number(max);
        return (
            <span
                aria-label={name}
                className={classNames(styles.stepper, className, {
                    [styles.isDisabled]: disabled
                })}
                role="group"
            >
                <button
                    aria-label={intl.formatMessage(messages.decrease)}
                    className={styles.step}
                    disabled={disabled || atMin}
                    tabIndex={-1}
                    title={intl.formatMessage(messages.decrease)}
                    type="button"
                    onClick={this.handleDecreaseClick}
                    onPointerCancel={this.handleStop}
                    onPointerDown={this.handleDecreaseDown}
                    onPointerLeave={this.handleStop}
                    onPointerUp={this.handleStop}
                >
                    <Minus
                        aria-hidden
                        className={styles.stepIcon}
                    />
                </button>
                <LiveInput
                    range
                    small
                    aria-label={name}
                    className={classNames(styles.input, {
                        [styles.isWide]: wide
                    })}
                    disabled={disabled}
                    max={max}
                    min={min}
                    ref={this.setInput}
                    step={step}
                    type="number"
                    value={value}
                    onSubmit={onSubmit}
                />
                <button
                    aria-label={intl.formatMessage(messages.increase)}
                    className={styles.step}
                    disabled={disabled || atMax}
                    tabIndex={-1}
                    title={intl.formatMessage(messages.increase)}
                    type="button"
                    onClick={this.handleIncreaseClick}
                    onPointerCancel={this.handleStop}
                    onPointerDown={this.handleIncreaseDown}
                    onPointerLeave={this.handleStop}
                    onPointerUp={this.handleStop}
                >
                    <Plus
                        aria-hidden
                        className={styles.stepIcon}
                    />
                </button>
            </span>
        );
    }
}

Stepper.propTypes = {
    className: PropTypes.string,
    disabled: PropTypes.bool,
    intl: intlShape.isRequired,
    max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    step: PropTypes.number,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    wide: PropTypes.bool
};

Stepper.defaultProps = {
    disabled: false,
    step: 1,
    wide: false
};

export {stepValue};
export default injectIntl(Stepper);
