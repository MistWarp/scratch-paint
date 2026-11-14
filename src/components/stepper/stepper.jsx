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
        defaultMessage: 'Decrease {name}',
        description: 'Label for the minus button beside a number field, such as brush size',
        id: 'paint.stepper.decrease'
    },
    increase: {
        defaultMessage: 'Increase {name}',
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
    const current = value === '' || value === null ? NaN : Number(value);
    const start = isNaN(current) ? Number(min) || 0 : current;
    let next = Number((start + (direction * step)).toFixed(decimalsOf(step)));
    if (typeof max !== 'undefined' && next > Number(max)) next = Number(max);
    if (typeof min !== 'undefined' && next < Number(min)) next = Number(min);
    return next;
};

class Stepper extends React.Component {
    constructor (props) {
        super(props);
        this.handleStop = this.handleStop.bind(this);
        this.handleDecreaseDown = this.handlePointerDown.bind(this, -1);
        this.handleIncreaseDown = this.handlePointerDown.bind(this, 1);
        this.handleDecreaseClick = this.handleClick.bind(this, -1);
        this.handleIncreaseClick = this.handleClick.bind(this, 1);
        this.timer = null;
    }
    componentWillUnmount () {
        this.handleStop();
    }
    nudge (direction) {
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
                className={classNames(styles.stepper, className, {
                    [styles.isDisabled]: disabled
                })}
            >
                <button
                    aria-label={intl.formatMessage(messages.decrease, {name})}
                    className={styles.step}
                    disabled={disabled || atMin}
                    tabIndex={-1}
                    title={intl.formatMessage(messages.decrease, {name})}
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
                    step={step}
                    type="number"
                    value={value}
                    onSubmit={onSubmit}
                />
                <button
                    aria-label={intl.formatMessage(messages.increase, {name})}
                    className={styles.step}
                    disabled={disabled || atMax}
                    tabIndex={-1}
                    title={intl.formatMessage(messages.increase, {name})}
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
