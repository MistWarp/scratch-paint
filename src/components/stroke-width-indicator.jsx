import React from 'react';
import PropTypes from 'prop-types';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import Input from './forms/input.jsx';
import InputGroup from './input-group/input-group.jsx';
import LiveInputHOC from './forms/live-input-hoc.jsx';
import Stepper from './stepper/stepper.jsx';

import {MAX_STROKE_WIDTH} from '../reducers/stroke-width';

const messages = defineMessages({
    outlineWidth: {
        defaultMessage: 'Outline width',
        description: 'Name of the number field that sets how thick the outline of a shape is',
        id: 'paint.paintEditor.outlineWidth'
    }
});

const LiveInput = LiveInputHOC(Input);
const StrokeWidthIndicatorComponent = props => (
    <InputGroup disabled={props.disabled && !props.stepper}>
        {props.stepper ? (
            <Stepper
                disabled={props.disabled}
                max={MAX_STROKE_WIDTH}
                min={0}
                name={props.intl.formatMessage(messages.outlineWidth)}
                value={props.strokeWidth ? props.strokeWidth : 0}
                onSubmit={props.onChangeStrokeWidth}
            />
        ) : (
            <LiveInput
                range
                small
                disabled={props.disabled}
                max={MAX_STROKE_WIDTH}
                min="0"
                type="number"
                value={props.strokeWidth ? props.strokeWidth : 0}
                onSubmit={props.onChangeStrokeWidth}
            />
        )}
    </InputGroup>
);

StrokeWidthIndicatorComponent.propTypes = {
    disabled: PropTypes.bool.isRequired,
    intl: intlShape.isRequired,
    onChangeStrokeWidth: PropTypes.func.isRequired,
    stepper: PropTypes.bool,
    strokeWidth: PropTypes.number
};

StrokeWidthIndicatorComponent.defaultProps = {
    stepper: false
};

export default injectIntl(StrokeWidthIndicatorComponent);
