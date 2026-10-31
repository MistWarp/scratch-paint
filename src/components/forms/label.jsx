/* DO NOT EDIT
@todo This file is copied from GUI and should be pulled out into a shared library.
See https://github.com/LLK/scratch-paint/issues/13 */

import PropTypes from 'prop-types';
import React from 'react';

import styles from './label.css';

const Label = props => (
    <label className={props.inline ? `${styles.inputGroup} ${styles.modInline}` : styles.inputGroup}>
        <span
            className={props.secondary ? styles.inputLabelSecondary : styles.inputLabel}
            style={props.style}
        >
            {props.text}
        </span>
        {props.children}
    </label>
);

Label.propTypes = {
    children: PropTypes.node,
    inline: PropTypes.bool,
    secondary: PropTypes.bool,
    text: PropTypes.string.isRequired,
    style: PropTypes.shape({})
};

Label.defaultProps = {
    inline: false,
    secondary: false
};

export default Label;
