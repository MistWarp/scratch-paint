import classNames from 'classnames';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';

import {shouldShowGroup, shouldShowUngroup} from '../../helper/group';
import {shouldShowBringForward, shouldShowSendBackward} from '../../helper/order';

import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';
import Button from '../button/button.jsx';
import ButtonGroup from '../button-group/button-group.jsx';
import Dropdown from '../dropdown/dropdown.jsx';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import Formats, {isVector} from '../../lib/format';
import Input from '../forms/input.jsx';
import InputGroup from '../input-group/input-group.jsx';
import {ToolbarButton, ToolbarGroup} from '../toolbar/toolbar.jsx';
import styles from './fixed-tools.css';

import {Group, Ungroup, Redo, Undo, BringToFront, SendToBack, ArrowUp, ArrowDown} from 'lucide-react';

const BufferedInput = BufferedInputHOC(Input);
const messages = defineMessages({
    costume: {
        id: 'paint.paintEditor.costume',
        description: 'Label for the name of a costume',
        defaultMessage: 'Costume'
    },
    group: {
        defaultMessage: 'Group',
        description: 'Label for the button to group shapes',
        id: 'paint.paintEditor.group'
    },
    ungroup: {
        defaultMessage: 'Ungroup',
        description: 'Label for the button to ungroup shapes',
        id: 'paint.paintEditor.ungroup'
    },
    undo: {
        defaultMessage: 'Undo',
        description: 'Alt to image for the button to undo an action',
        id: 'paint.paintEditor.undo'
    },
    redo: {
        defaultMessage: 'Redo',
        description: 'Alt to image for the button to redo an action',
        id: 'paint.paintEditor.redo'
    },
    forward: {
        defaultMessage: 'Forward',
        description: 'Label for the `Send forward on canvas` button',
        id: 'paint.paintEditor.forward'
    },
    backward: {
        defaultMessage: 'Backward',
        description: 'Label for the `Send backward on canvas` button',
        id: 'paint.paintEditor.backward'
    },
    front: {
        defaultMessage: 'Front',
        description: 'Label for the `Send to front of canvas` button',
        id: 'paint.paintEditor.front'
    },
    back: {
        defaultMessage: 'Back',
        description: 'Label for the `Send to back of canvas` button',
        id: 'paint.paintEditor.back'
    },
    arrange: {
        defaultMessage: 'Arrange',
        description: 'Label for dropdown containing grouping and layer order actions',
        id: 'paint.fixedTools.arrange'
    }
});

const UndoRedoPhone = props => {
    const redoDisabled = !props.canRedo();
    const undoDisabled = !props.canUndo();
    return (
        <InputGroup>
            <ButtonGroup>
                <Button
                    aria-label={props.intl.formatMessage(messages.undo)}
                    className={
                        classNames(
                            styles.buttonGroupButton,
                            {
                                [styles.modNoEndBorder]: !redoDisabled
                            }
                        )
                    }
                    disabled={undoDisabled}
                    title={props.intl.formatMessage(messages.undo)}
                    onClick={props.onUndo}
                >
                    <Undo
                        alt={props.intl.formatMessage(messages.undo)}
                        className={classNames(
                            styles.buttonGroupButtonIcon,
                            styles.undoIcon
                        )}
                        draggable={false}
                    />
                </Button>
                <Button
                    aria-label={props.intl.formatMessage(messages.redo)}
                    className={
                        classNames(
                            styles.buttonGroupButton,
                            {
                                [styles.modStartBorder]: !redoDisabled
                            }
                        )
                    }
                    disabled={redoDisabled}
                    title={props.intl.formatMessage(messages.redo)}
                    onClick={props.onRedo}
                >
                    <Redo
                        alt={props.intl.formatMessage(messages.redo)}
                        className={classNames(
                            styles.buttonGroupButtonIcon,
                            styles.undoIcon
                        )}
                        draggable={false}
                    />
                </Button>
            </ButtonGroup>
        </InputGroup>
    );
};

const arrangeActions = props => [
    {key: 'group', icon: Group, message: messages.group, enabled: shouldShowGroup(), handleClick: props.onGroup},
    {
        key: 'ungroup',
        icon: Ungroup,
        message: messages.ungroup,
        enabled: shouldShowUngroup(),
        handleClick: props.onUngroup
    },
    {
        key: 'forward',
        icon: ArrowUp,
        message: messages.forward,
        enabled: shouldShowBringForward(),
        handleClick: props.onSendForward
    },
    {
        key: 'backward',
        icon: ArrowDown,
        message: messages.backward,
        enabled: shouldShowSendBackward(),
        handleClick: props.onSendBackward
    },
    {
        key: 'front',
        icon: BringToFront,
        message: messages.front,
        enabled: shouldShowBringForward(),
        handleClick: props.onSendToFront
    },
    {
        key: 'back',
        icon: SendToBack,
        message: messages.back,
        enabled: shouldShowSendBackward(),
        handleClick: props.onSendToBack
    }
];

const ArrangeMenu = props => (
    <Dropdown
        className={styles.modUnselect}
        enterExitTransitionDurationMs={20}
        popoverContent={
            <InputGroup
                className={styles.modContextMenu}
                rtl={props.rtl}
            >
                {arrangeActions(props).map(action => (
                    <Button
                        className={classNames(styles.modMenuItem, {
                            [styles.mobileMenuDivider]: action.key === 'front',
                            [styles.modDisabled]: !action.enabled
                        })}
                        disabled={!action.enabled}
                        key={action.key}
                        onClick={action.handleClick}
                    >
                        <action.icon
                            className={styles.menuItemIcon}
                            draggable={false}
                        />
                        <span>{props.intl.formatMessage(action.message)}</span>
                    </Button>
                ))}
            </InputGroup>
        }
        tipSize={.01}
    >
        {props.intl.formatMessage(messages.arrange)}
    </Dropdown>
);

const PhoneFixedTools = props => (
    <div className={styles.row}>
        <InputGroup>
            <BufferedInput
                className={styles.costumeInput}
                type="text"
                value={props.name}
                onSubmit={props.onUpdateName}
            />
        </InputGroup>
        <UndoRedoPhone {...props} />
        {isVector(props.format) ? (
            <InputGroup>
                <ArrangeMenu {...props} />
            </InputGroup>
        ) : null}
    </div>
);

const DocumentTools = props => (
    <div className={styles.documentTools}>
        <label className={styles.nameField}>
            <span className={styles.nameLabel}>{props.intl.formatMessage(messages.costume)}</span>
            <BufferedInput
                className={styles.costumeInput}
                type="text"
                value={props.name}
                onSubmit={props.onUpdateName}
            />
        </label>
        <ToolbarGroup>
            <ToolbarButton
                mirrorInRtl
                disabled={!props.canUndo()}
                icon={Undo}
                title={props.intl.formatMessage(messages.undo)}
                onClick={props.onUndo}
            />
            <ToolbarButton
                mirrorInRtl
                disabled={!props.canRedo()}
                icon={Redo}
                title={props.intl.formatMessage(messages.redo)}
                onClick={props.onRedo}
            />
        </ToolbarGroup>
    </div>
);

const arrangeButton = (intl, action) => (
    <ToolbarButton
        disabled={!action.enabled}
        icon={action.icon}
        key={action.key}
        title={intl.formatMessage(action.message)}
        onClick={action.handleClick}
    />
);

const ArrangeTools = props => {
    if (!isVector(props.format)) return null;
    const buttons = arrangeActions(props).map(action => arrangeButton(props.intl, action));
    return (
        <React.Fragment>
            <div className={styles.arrangeButtons}>
                <ToolbarGroup>{buttons.slice(0, 2)}</ToolbarGroup>
                <ToolbarGroup>{buttons.slice(2)}</ToolbarGroup>
            </div>
            <div className={styles.arrangeMenu}>
                <ArrangeMenu {...props} />
            </div>
        </React.Fragment>
    );
};

const NarrowArrangeMenu = props => {
    if (!isVector(props.format)) return null;
    return (
        <div className={styles.arrangeMenuNarrow}>
            <ArrangeMenu {...props} />
        </div>
    );
};

const FixedToolsComponent = props => {
    if (props.phone) return <PhoneFixedTools {...props} />;
    if (props.section === 'arrange') return <ArrangeTools {...props} />;
    if (props.section === 'arrangeNarrow') return <NarrowArrangeMenu {...props} />;
    return <DocumentTools {...props} />;
};

FixedToolsComponent.propTypes = {
    canRedo: PropTypes.func.isRequired,
    canUndo: PropTypes.func.isRequired,
    format: PropTypes.oneOf(Object.keys(Formats)),
    intl: intlShape,
    name: PropTypes.string,
    onGroup: PropTypes.func.isRequired,
    onRedo: PropTypes.func.isRequired,
    onSendBackward: PropTypes.func.isRequired,
    onSendForward: PropTypes.func.isRequired,
    onSendToBack: PropTypes.func.isRequired,
    onSendToFront: PropTypes.func.isRequired,
    onUndo: PropTypes.func.isRequired,
    onUngroup: PropTypes.func.isRequired,
    onUpdateName: PropTypes.func.isRequired,
    phone: PropTypes.bool,
    rtl: PropTypes.bool.isRequired,
    section: PropTypes.oneOf(['document', 'arrange', 'arrangeNarrow'])
};

FixedToolsComponent.defaultProps = {
    phone: false,
    section: 'document'
};

UndoRedoPhone.propTypes = FixedToolsComponent.propTypes;
PhoneFixedTools.propTypes = FixedToolsComponent.propTypes;
DocumentTools.propTypes = FixedToolsComponent.propTypes;
ArrangeTools.propTypes = FixedToolsComponent.propTypes;
ArrangeMenu.propTypes = FixedToolsComponent.propTypes;
NarrowArrangeMenu.propTypes = FixedToolsComponent.propTypes;

const mapStateToProps = state => ({
    format: state.scratchPaint.format,
    rtl: state.scratchPaint.layout.rtl,
    selectedItems: state.scratchPaint.selectedItems,
    undoState: state.scratchPaint.undo
});

export default connect(
    mapStateToProps
)(injectIntl(FixedToolsComponent));
