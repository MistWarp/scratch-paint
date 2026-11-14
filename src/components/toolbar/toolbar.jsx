import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './toolbar.css';

const renderIcon = icon => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
        return React.cloneElement(icon, {
            'aria-hidden': true,
            'className': classNames(styles.icon, icon.props.className)
        });
    }
    return React.createElement(icon, {
        'aria-hidden': true,
        'className': styles.icon
    });
};

const ToolbarGroup = props => (
    <div
        aria-label={props.label}
        className={classNames(styles.group, props.className)}
        role={props.label ? 'group' : null}
    >
        {props.children}
    </div>
);

ToolbarGroup.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    label: PropTypes.string
};

const ToolbarButton = ({
    active,
    children,
    className,
    icon,
    imgSrc,
    mirrorInRtl,
    title,
    ...buttonProps
}) => (
    <button
        aria-label={title}
        aria-pressed={typeof active === 'boolean' ? active : null}
        className={classNames(styles.button, className, {
            [styles.isActive]: active,
            [styles.hasText]: Boolean(children),
            [styles.mirrorInRtl]: mirrorInRtl
        })}
        title={title}
        type="button"
        {...buttonProps}
    >
        {imgSrc ? (
            <img
                alt=""
                className={styles.icon}
                draggable={false}
                src={imgSrc}
            />
        ) : renderIcon(icon)}
        {children}
    </button>
);

ToolbarButton.propTypes = {
    active: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    icon: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.object,
        PropTypes.node
    ]),
    imgSrc: PropTypes.string,
    mirrorInRtl: PropTypes.bool,
    onClick: PropTypes.func,
    title: PropTypes.string.isRequired
};

const ToolbarField = props => (
    <span className={classNames(styles.field, props.className)}>
        <span className={styles.fieldLabel}>{props.label}</span>
        {props.children}
    </span>
);

ToolbarField.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    label: PropTypes.string.isRequired
};

const ToolbarHint = props => (
    <span className={styles.hint}>{props.children}</span>
);

ToolbarHint.propTypes = {
    children: PropTypes.node
};

export {
    ToolbarButton,
    ToolbarField,
    ToolbarGroup,
    ToolbarHint
};
