/* eslint-disable no-case-declarations */
import classNames from 'classnames';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';

import Dropdown from '../dropdown/dropdown.jsx';
import Button from '../button/button.jsx';

import {changeBrushSize, changeSimplifySize, setBrushType} from '../../reducers/brush-mode';
import {
    changeBrushSize as changeEraserSize,
    changeSimplifySize as changeEraserSimplifySize
} from '../../reducers/eraser-mode';
import {changeSimplifySize as changePenSimplifySize} from '../../reducers/pen-mode';
import {changeRoundedRectCornerSize} from '../../reducers/rounded-rect-mode';
import {changeRoundedCornerSize} from '../../reducers/rect-mode';
import {changeTrianglePolyCount, changeTrianglePointCount} from '../../reducers/triangle-mode';
import {changeCurrentlySelectedShape} from '../../reducers/sussy-mode';
import {changeBitBrushSize} from '../../reducers/bit-brush-size';
import {changeBitEraserSize} from '../../reducers/bit-eraser-size';
import {setShapesFilled} from '../../reducers/fill-bitmap-shapes';
import {setTextAlignment} from '../../reducers/text-alignment';

import FontDropdown from '../../containers/font-dropdown.jsx';
import LiveInputHOC from '../forms/live-input-hoc.jsx';
import Label from '../forms/label.jsx';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import Input from '../forms/input.jsx';
import InputGroup from '../input-group/input-group.jsx';
import BrushTypes, {messages as brushTypeMessages} from './brushTypes.jsx';
import LabeledIconButton from '../labeled-icon-button/labeled-icon-button.jsx';
import Stepper from '../stepper/stepper.jsx';
import {ToolbarButton, ToolbarField, ToolbarGroup, ToolbarHint} from '../toolbar/toolbar.jsx';
import Modes from '../../lib/modes';
import Formats, {isBitmap, isVector} from '../../lib/format';
import {hideLabel} from '../../lib/hide-label';
import styles from './mode-tools.css';
import {MAX_STROKE_WIDTH} from '../../reducers/stroke-width';
import {
    selectableShapes as sussyToolShapes,
    categories as sussyToolCategories,
    generateShapeSVG as generateSussyShapeSVG,
    categorizeShapes as categorizeSussyShapes
} from '../../helper/selectable-shapes.js';

import {
    ClipboardCopy, Scissors, ClipboardPaste,
    Trash, FlipHorizontal2, FlipVertical2,
    Plus, TextAlignStart, TextAlignCenter,
    TextAlignEnd, Circle, Square,
    SquaresIntersect, SquaresUnite, SquaresSubtract, SquaresExclude
} from 'lucide-react';

import RoundLine from './icons/round-line.jsx';
import SquareLine from './icons/square-line.jsx';
import MiterLineJoin from './icons/miter-line-join.jsx';
import RoundLineJoin from './icons/round-line-join.jsx';
import BevelLineJoin from './icons/bevel-line-join.jsx';
import bitBrushIcon from '../bit-brush-mode/brush.svg';
import bitEraserIcon from '../bit-eraser-mode/eraser.svg';
import bitLineIcon from '../bit-line-mode/line.svg';
import brushIcon from '../brush-mode/brush.svg';
import CurvedPointIcon from './icons/curved-point.jsx';
import eraserIcon from '../eraser-mode/eraser.svg';
import roundedRectIcon from '../rounded-rect-mode/rounded-rectangle.svg';
import triangleIcon from '../triangle-mode/triangle.svg';
import triangleSpikeRatioIcon from './icons/triangle-spike-ratio.svg';
import StraightPointIcon from './icons/straight-point.jsx';
import bitOvalIcon from '../bit-oval-mode/oval.svg';
import bitRectIcon from '../bit-rect-mode/rectangle.svg';
import bitOvalOutlinedIcon from '../bit-oval-mode/oval-outlined.svg';
import bitRectOutlinedIcon from '../bit-rect-mode/rectangle-outlined.svg';

const LiveInput = LiveInputHOC(Input);

const messages = defineMessages({
    brushSize: {
        defaultMessage: 'Size',
        description: 'Label for the brush size input',
        id: 'paint.modeTools.brushSize'
    },
    brushSimplify: {
        defaultMessage: 'Smoothing',
        description: 'Label for the brush smoothing input, higher numbers control how much the drawn line will be corrected',
        id: 'paint.modeTools.brushSimplify'
    },
    eraserSize: {
        defaultMessage: 'Eraser size',
        description: 'Label for the eraser size input',
        id: 'paint.modeTools.eraserSize'
    },
    eraserSimplify: {
        defaultMessage: 'Smoothing',
        description: 'Label for the eraser smoothing input, higher numbers control how much the drawn line will be corrected',
        id: 'paint.modeTools.eraserSimplify'
    },
    roundedCornerSize: {
        defaultMessage: 'Rounded corner size',
        description: 'Label for the Rounded corner size input',
        id: 'paint.modeTools.roundedCornerSize'
    },
    currentSideCount: {
        defaultMessage: 'Polygon side count',
        description: 'Label for the Polygon side count input',
        id: 'paint.modeTools.currentSideCount'
    },
    spokeRatio: {
        defaultMessage: 'Star spoke ratio',
        description: 'Label for the Star spoke ratio input, controls the size of the spokes on a star',
        id: 'paint.modeTools.spikeRatio'
    },
    penSimplify: {
        defaultMessage: 'Smoothing',
        description: 'Label for the pen smoothing input, higher numbers control how much the drawn line will be corrected',
        id: 'paint.modeTools.penSimplify'
    },
    copy: {
        defaultMessage: 'Copy',
        description: 'Label for the copy button',
        id: 'paint.modeTools.copy'
    },
    cut: {
        defaultMessage: 'Cut',
        description: 'Label for the cut button',
        id: 'paint.modeTools.cut'
    },
    paste: {
        defaultMessage: 'Paste',
        description: 'Label for the paste button',
        id: 'paint.modeTools.paste'
    },
    delete: {
        defaultMessage: 'Delete',
        description: 'Label for the delete button',
        id: 'paint.modeTools.delete'
    },
    curved: {
        defaultMessage: 'Curved',
        description: 'Label for the button that converts selected points to curves',
        id: 'paint.modeTools.curved'
    },
    pointed: {
        defaultMessage: 'Pointed',
        description: 'Label for the button that converts selected points to sharp points',
        id: 'paint.modeTools.pointed'
    },
    thickness: {
        defaultMessage: 'Thickness',
        description: 'Label for the number input to choose the line thickness',
        id: 'paint.modeTools.thickness'
    },
    flipHorizontal: {
        defaultMessage: 'Flip Horizontal',
        description: 'Label for the button to flip the image horizontally',
        id: 'paint.modeTools.flipHorizontal'
    },
    flipVertical: {
        defaultMessage: 'Flip Vertical',
        description: 'Label for the button to flip the image vertically',
        id: 'paint.modeTools.flipVertical'
    },
    filled: {
        defaultMessage: 'Filled',
        description: 'Label for the button that sets the bitmap rectangle/oval mode to draw outlines',
        id: 'paint.modeTools.filled'
    },
    outlined: {
        defaultMessage: 'Outlined',
        description: 'Label for the button that sets the bitmap rectangle/oval mode to draw filled-in shapes',
        id: 'paint.modeTools.outlined'
    },
    movementCenter: {
        defaultMessage: 'Center',
        description: 'Label for the button that moves the selected objects to the center of the canvas',
        id: 'paint.modeTools.movementCenter'
    },
    joinSpiked: {
        defaultMessage: 'Spiked',
        description: 'Label for the button that sets the line join to miter',
        id: 'pm.paint.modeTools.joinSpiked'
    },
    joinRounded: {
        defaultMessage: 'Rounded',
        description: 'Label for the button that sets the line join to round',
        id: 'pm.paint.modeTools.joinRounded'
    },
    joinBeveled: {
        defaultMessage: 'Beveled',
        description: 'Label for the button that sets the line join to bevel',
        id: 'pm.paint.modeTools.joinBeveled'
    },
    endRounded: {
        defaultMessage: 'Rounded',
        description: 'Label for the button that sets the line cap to round',
        id: 'pm.paint.modeTools.endRounded'
    },
    endSquared: {
        defaultMessage: 'Squared',
        description: 'Label for the button that sets the line cap to square',
        id: 'pm.paint.modeTools.endSquared'
    },
    merge: {
        defaultMessage: 'Merge',
        description: 'Label for the button that merges two selected objects together',
        id: 'pm.paint.modeTools.merge'
    },
    subtract: {
        defaultMessage: 'Subtract',
        description: 'Label for the button that subtracts selected objects from eachother',
        id: 'pm.paint.modeTools.subtract'
    },
    mask: {
        defaultMessage: 'Mask',
        description: 'Label for the button that ands two selected objects together',
        id: 'pm.paint.modeTools.mask'
    },
    filter: {
        defaultMessage: 'Exclude',
        description: 'Label for the button that xors two selected objects together',
        id: 'pm.paint.modeTools.filter'
    },
    leftAlign: {
        defaultMessage: 'Left Align',
        description: 'Label for the button that sets text alignment to the left',
        id: 'pm.paint.modeTools.leftAlign'
    },
    rightAlign: {
        defaultMessage: 'Right Align',
        description: 'Label for the button that sets text alignment to the right',
        id: 'pm.paint.modeTools.rightAlign'
    },
    centerAlign: {
        defaultMessage: 'Center Align',
        description: 'Label for the button that sets text alignment to the center',
        id: 'pm.paint.modeTools.centerAlign'
    },
    arrowTip: {
        defaultMessage: 'Hold Alt + Shift to resize arrow tip',
        description: 'Hint shown while the arrow tool is selected',
        id: 'paint.modeTools.arrowTip'
    },
    pointOptions: {
        defaultMessage: 'Point options',
        description: 'Label for the phone menu that holds line join and delete actions for selected points',
        id: 'paint.modeTools.pointOptions'
    },
    edit: {
        defaultMessage: 'Edit',
        description: 'Label for the phone menu that holds copy, paste, flip and combine actions',
        id: 'paint.modeTools.edit'
    }
});

const PhoneModeTools = props => {
    switch (props.mode) {
    case Modes.BRUSH:
        /* falls through */
    case Modes.BIT_BRUSH:
        /* falls through */
    case Modes.BIT_LINE:
    {
        const currentIcon = isVector(props.format) ? brushIcon :
            props.mode === Modes.BIT_LINE ? bitLineIcon : bitBrushIcon;
        const currentBrushValue = isBitmap(props.format) ? props.bitBrushSize : props.brushValue;
        const currentSimplifyValue = props.simplifyValue;
        const changeFunction = isBitmap(props.format) ? props.onBitBrushSliderChange : props.onBrushSliderChange;
        const changeFunctionSimplify = props.onSimplifySliderChange;
        const currentMessage = props.mode === Modes.BIT_LINE ? messages.thickness : messages.brushSize;
        const hasSimplifyOption = props.mode === Modes.BRUSH;
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <div>
                    <img
                        alt={props.intl.formatMessage(currentMessage)}
                        title={props.intl.formatMessage(currentMessage)}
                        className={styles.modeToolsIcon}
                        draggable={false}
                        src={currentIcon}
                    />
                </div>
                <LiveInput
                    range
                    small
                    max={MAX_STROKE_WIDTH}
                    min="1"
                    type="number"
                    value={currentBrushValue}
                    onSubmit={changeFunction}
                />
                        
                {hasSimplifyOption && (
                    <Label
                        text={props.intl.formatMessage(messages.brushSimplify)}
                        style={{marginLeft: 'calc(2 * .25rem)'}}
                    >
                        <LiveInput
                            range
                            small
                            max={1000}
                            min="0"
                            type="number"
                            value={currentSimplifyValue}
                            onSubmit={changeFunctionSimplify}
                        />
                    </Label>
                )}

                {/* TODO replace this with a dropdown when we add more brush shapes */}
                {hasSimplifyOption && (
                    <BrushTypes
                        onBrushChange={props.onBrushChange}
                    />
                )}
            </div>
        );
    }
    case Modes.BIT_ERASER:
        /* falls through */
    case Modes.ERASER:
    {
        const currentIcon = isVector(props.format) ? eraserIcon : bitEraserIcon;
        const currentEraserValue = isBitmap(props.format) ? props.bitEraserSize : props.eraserValue;
        const currentEraserSimplifyValue = props.eraserSimplifyValue;
        const changeFunction = isBitmap(props.format) ? props.onBitEraserSliderChange : props.onEraserSliderChange;
        const changeFunctionSimplify = props.onEraserSimplifySliderChange;
        const hasSimplifyOption = props.mode === Modes.ERASER;
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <div>
                    <img
                        alt={props.intl.formatMessage(messages.eraserSize)}
                        title={props.intl.formatMessage(messages.eraserSize)}
                        className={styles.modeToolsIcon}
                        draggable={false}
                        src={currentIcon}
                    />
                </div>
                <LiveInput
                    range
                    small
                    max={MAX_STROKE_WIDTH}
                    min="1"
                    type="number"
                    value={currentEraserValue}
                    onSubmit={changeFunction}
                />

                {hasSimplifyOption && (
                    <Label
                        text={props.intl.formatMessage(messages.eraserSimplify)}
                        style={{marginLeft: 'calc(2 * .25rem)'}}
                    >
                        <LiveInput
                            range
                            small
                            max={1000}
                            min="0"
                            type="number"
                            value={currentEraserSimplifyValue}
                            onSubmit={changeFunctionSimplify}
                        />
                    </Label>
                )}

                {/* TODO replace this with a dropdown when we add more brush shapes */}
                {hasSimplifyOption && (
                    <BrushTypes
                        onBrushChange={props.onBrushChange}
                    />
                )}
            </div>
        );
    }
    case Modes.ROUNDED_RECT:
        /* falls through */
    case Modes.RECT:
    {
        // NOTE: BIT_RECT doesnt use Path, so this can't be added there the same way as RECT has it.
        const currentCornerValue = props.mode === Modes.ROUNDED_RECT ? props.roundedRectCornerValue : props.roundedCornerValue;
        const changeFunction = props.mode === Modes.ROUNDED_RECT ? props.onRoundedRectCornerSliderChange : props.onRoundedCornerSliderChange;
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <div>
                    <img
                        alt={props.intl.formatMessage(messages.roundedCornerSize)}
                        title={props.intl.formatMessage(messages.roundedCornerSize)}
                        className={styles.modeToolsIcon}
                        draggable={false}
                        src={roundedRectIcon}
                    />
                </div>
                <LiveInput
                    range
                    small
                    min={0}
                    max={1000}
                    type="number"
                    value={currentCornerValue}
                    onSubmit={changeFunction}
                />
            </div>
        );
    }
    case Modes.TRIANGLE:
    {
        const currentSideValue = props.trianglePolyValue;
        const currentPointValue = props.trianglePointValue;
        const changeFunction = props.onPolyCountSliderChange;
        const changeFunctionPoint = props.onPointCountSliderChange;
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <div>
                    <img
                        alt={props.intl.formatMessage(messages.currentSideCount)}
                        title={props.intl.formatMessage(messages.currentSideCount)}
                        className={styles.modeToolsIcon}
                        draggable={false}
                        src={triangleIcon}
                    />
                </div>
                <LiveInput
                    range
                    small
                    max={1000}
                    min="3"
                    type="number"
                    value={currentSideValue}
                    onSubmit={changeFunction}
                />
                <div>
                    <img
                        alt={props.intl.formatMessage(messages.spokeRatio)}
                        title={props.intl.formatMessage(messages.spokeRatio)}
                        className={styles.modeToolsIcon}
                        draggable={false}
                        src={triangleSpikeRatioIcon}
                    />
                </div>
                <LiveInput
                    range
                    small
                    max={1000}
                    min="0" // Spike ratio is limited to 0.01, but setting that here makes the number input arrows work really ugly
                    step="0.1"
                    type="number"
                    value={currentPointValue}
                    onSubmit={changeFunctionPoint}
                />
            </div>
        );
    }
    case Modes.SUSSY:
    {
        const currentlySelectedShape = props.currentlySelectedShape;
        const changeFunction = props.onCurrentlySelectedShapeChange;
        const selectedShapeObject = sussyToolShapes
            .filter(shape => shape.id === currentlySelectedShape)[0];
        const categorizedShapes = categorizeSussyShapes(sussyToolShapes);
        const selectableShapesList = (
            <InputGroup
                className={classNames(
                    styles.modDashedBorder,
                    styles.dropItemShapeToolMenu,
                    styles.dropdownMaxItemList
                )}
            >
                {Object.keys(categorizedShapes).map(categoryId => categorizedShapes[categoryId].length === 0 ?
                    (<React.Fragment key={categoryId} />) : (<React.Fragment key={categoryId}>
                        <p className={classNames(styles.dropItemShapeToolLabel)}>
                            {sussyToolCategories[categoryId]}
                        </p>
                        {categorizedShapes[categoryId].map(shape => (
                            <LabeledIconButton
                                key={shape.id}
                                className={classNames(styles.dropItemShapeTool)}
                                hideLabel={hideLabel(props.intl.locale)}
                                imgSrc={`data:image/svg+xml,${encodeURIComponent(generateSussyShapeSVG(shape))}`}
                                title={shape.name}
                                onClick={() => changeFunction(shape.id)}
                            />
                        ))}
                    </React.Fragment>))}
            </InputGroup>
        );
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <Dropdown
                    className={styles.modUnselect}
                    enterExitTransitionDurationMs={20}
                    popoverContent={
                        <InputGroup
                            className={styles.modContextMenu}
                            rtl={props.rtl}
                        >
                            {selectableShapesList}
                        </InputGroup>
                    }
                    tipSize={.01}
                >
                    <img
                        src={`data:image/svg+xml,${encodeURIComponent(generateSussyShapeSVG(selectedShapeObject))}`}
                        alt={selectedShapeObject.name}
                        title={selectedShapeObject.name}
                        height={16}
                    />
                </Dropdown>
            </div>
        );
    }
    case Modes.PEN:
    {
        const currentPenSimplifyValue = props.penSimplifyValue;
        const changeFunctionSimplify = props.onPenSimplifySliderChange;
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <Label
                    text={props.intl.formatMessage(messages.eraserSimplify)}
                    style={{marginLeft: 'calc(2 * .25rem)'}}
                >
                    <LiveInput
                        range
                        small
                        max={1000}
                        min="0"
                        type="number"
                        value={currentPenSimplifyValue}
                        onSubmit={changeFunctionSimplify}
                    />
                </Label>
            </div>
        );
    }
    case Modes.RESHAPE:
        const lineJoinReshape = (
            <InputGroup className={classNames(styles.modDashedBorder, styles.modLabeledIconHeight)}>
                <LabeledIconButton
                    disabled={props.hasSelectedMiterLineJoin}
                    hideLabel={hideLabel(props.intl.locale)}
                    icon={MiterLineJoin}
                    title={props.intl.formatMessage(messages.joinSpiked)}
                    onClick={props.onMiterLineJoin}
                />
                <LabeledIconButton
                    disabled={props.hasSelectedRoundLineJoin}
                    hideLabel={hideLabel(props.intl.locale)}
                    icon={RoundLineJoin}
                    title={props.intl.formatMessage(messages.joinRounded)}
                    onClick={props.onRoundLineJoin}
                />
                <LabeledIconButton
                    disabled={props.hasSelectedBevelLineJoin}
                    hideLabel={hideLabel(props.intl.locale)}
                    icon={BevelLineJoin}
                    title={props.intl.formatMessage(messages.joinBeveled)}
                    onClick={props.onBevelLineJoin}
                />
            </InputGroup>
        );
        const deleteSelectedNodes = (
            <InputGroup className={classNames(styles.modLabeledIconHeight)}>
                <LabeledIconButton
                    hideLabel={hideLabel(props.intl.locale)}
                    icon={Trash}
                    title={props.intl.formatMessage(messages.delete)}
                    onClick={props.onDelete}
                />
            </InputGroup>
        );
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <InputGroup className={classNames(styles.modDashedBorder, styles.modLabeledIconHeight)}>
                    <LabeledIconButton
                        disabled={!props.hasSelectedUncurvedPoints}
                        hideLabel={hideLabel(props.intl.locale)}
                        icon={CurvedPointIcon}
                        title={props.intl.formatMessage(messages.curved)}
                        onClick={props.onCurvePoints}
                    />
                    <LabeledIconButton
                        disabled={!props.hasSelectedUnpointedPoints}
                        hideLabel={hideLabel(props.intl.locale)}
                        icon={StraightPointIcon}
                        title={props.intl.formatMessage(messages.pointed)}
                        onClick={props.onPointPoints}
                    />
                </InputGroup>
                <InputGroup className={classNames(styles.modDashedBorder, styles.modLabeledIconHeight)}>
                    <LabeledIconButton
                        disabled={props.hasSelectedRoundEnds}
                        hideLabel={hideLabel(props.intl.locale)}
                        icon={RoundLine}
                        title={props.intl.formatMessage(messages.endRounded)}
                        onClick={props.onRoundEnds}
                    />
                    <LabeledIconButton
                        disabled={props.hasSelectedSquareEnds}
                        hideLabel={hideLabel(props.intl.locale)}
                        icon={SquareLine}
                        title={props.intl.formatMessage(messages.endSquared)}
                        onClick={props.onSquareEnds}
                    />
                </InputGroup>
                <InputGroup className={classNames(styles.modDashedBorder, styles.modLabeledIconHeight)}>
                    <Dropdown
                        className={styles.modUnselect}
                        enterExitTransitionDurationMs={20}
                        popoverContent={
                            <InputGroup
                                className={styles.modContextMenu}
                                rtl={props.rtl}
                            >
                                {lineJoinReshape}
                                {deleteSelectedNodes}
                            </InputGroup>
                        }
                        tipSize={.01}
                    >
                        {props.intl.formatMessage(messages.pointOptions)}
                    </Dropdown>
                </InputGroup>
            </div>
        );
    case Modes.BIT_SELECT:
        /* falls through */
    case Modes.SELECT:
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <InputGroup className={styles.modLabeledIconHeight}>
                    <Dropdown
                        className={styles.modUnselect}
                        enterExitTransitionDurationMs={20}
                        popoverContent={
                            <InputGroup
                                className={styles.modContextMenu}
                                rtl={props.rtl}
                            >
                                <Button
                                    className={styles.modMenuItem}
                                    onClick={props.onCopyToClipboard}
                                >
                                    <ClipboardCopy className={styles.menuItemIcon} />
                                    <span>{props.intl.formatMessage(messages.copy)}</span>
                                </Button>
                                <Button
                                    className={classNames(styles.modMenuItem, {
                                        [styles.modDisabled]: !(props.clipboardItems.length > 0)
                                    })}
                                    disabled={!(props.clipboardItems.length > 0)}
                                    onClick={props.onPasteFromClipboard}
                                >
                                    <ClipboardPaste className={styles.menuItemIcon} />
                                    <span>{props.intl.formatMessage(messages.paste)}</span>
                                </Button>
                                <Button
                                    className={styles.modMenuItem}
                                    onClick={props.onCutToClipboard}
                                >
                                    <Scissors className={styles.menuItemIcon} />
                                    <span>{props.intl.formatMessage(messages.cut)}</span>
                                </Button>
                                <Button
                                    className={styles.modMenuItem}
                                    onClick={props.onDelete}
                                >
                                    <Trash className={styles.menuItemIcon} />
                                    <span>{props.intl.formatMessage(messages.delete)}</span>
                                </Button>
                                <Button
                                    className={classNames(styles.modMenuItem, styles.modTopDivider)}
                                    onClick={props.onFlipHorizontal}
                                >
                                    <FlipHorizontal2 className={styles.menuItemIcon} />
                                    <span>{props.intl.formatMessage(messages.flipHorizontal)}</span>
                                </Button>
                                <Button
                                    className={styles.modMenuItem}
                                    onClick={props.onFlipVertical}
                                >
                                    <FlipVertical2 className={styles.menuItemIcon} />
                                    <span>{props.intl.formatMessage(messages.flipVertical)}</span>
                                </Button>
                                <Button
                                    className={styles.modMenuItem}
                                    onClick={props.onCenterSelection}
                                >
                                    <Plus className={styles.menuItemIcon} />
                                    <span>{props.intl.formatMessage(messages.movementCenter)}</span>
                                </Button>
                                {props.mode === Modes.SELECT && !isBitmap(props.format) ? (
                                    <React.Fragment>
                                        <Button
                                            className={classNames(styles.modMenuItem, styles.modTopDivider)}
                                            onClick={props.onMergeShape}
                                        >
                                            <SquaresUnite className={styles.menuItemIcon} />
                                            <span>{props.intl.formatMessage(messages.merge)}</span>
                                        </Button>
                                        <Button
                                            className={styles.modMenuItem}
                                            onClick={props.onMaskShape}
                                        >
                                            <SquaresIntersect className={styles.menuItemIcon} />
                                            <span>{props.intl.formatMessage(messages.mask)}</span>
                                        </Button>
                                        <Button
                                            className={styles.modMenuItem}
                                            onClick={props.onSubtractShape}
                                        >
                                            <SquaresSubtract className={styles.menuItemIcon} />
                                            <span>{props.intl.formatMessage(messages.subtract)}</span>
                                        </Button>
                                        <Button
                                            className={styles.modMenuItem}
                                            onClick={props.onExcludeShape}
                                        >
                                            <SquaresExclude className={styles.menuItemIcon} />
                                            <span>{props.intl.formatMessage(messages.filter)}</span>
                                        </Button>
                                    </React.Fragment>
                                ) : null}
                            </InputGroup>
                        }
                        tipSize={.01}
                    >
                        {props.intl.formatMessage(messages.edit)}
                    </Dropdown>
                </InputGroup>
            </div>
        );
    case Modes.BIT_TEXT:
        /* falls through */
    case Modes.TEXT:
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <InputGroup className={classNames(styles.modDashedBorder)}>
                    <FontDropdown
                        onUpdateImage={props.onUpdateImage}
                        onManageFonts={props.onManageFonts}
                    />
                </InputGroup>
                <InputGroup className={classNames(styles.modDashedBorder, styles.modLabeledIconHeight)}>
                    <LabeledIconButton
                        hideLabel
                        icon={TextAlignStart}
                        title={props.intl.formatMessage(messages.leftAlign)}
                        onClick={props.onTextAlignLeft}
                    />
                    <LabeledIconButton
                        hideLabel
                        icon={TextAlignCenter}
                        title={props.intl.formatMessage(messages.centerAlign)}
                        onClick={props.onTextAlignCenter}
                    />
                    <LabeledIconButton
                        hideLabel
                        icon={TextAlignEnd}
                        title={props.intl.formatMessage(messages.rightAlign)}
                        onClick={props.onTextAlignRight}
                    />
                </InputGroup>
            </div>
        );
    case Modes.BIT_RECT:
        /* falls through */
    case Modes.BIT_OVAL:
    {
        const fillIcon = props.mode === Modes.BIT_RECT ? bitRectIcon : bitOvalIcon;
        const outlineIcon = props.mode === Modes.BIT_RECT ? bitRectOutlinedIcon : bitOvalOutlinedIcon;
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <InputGroup>
                    <LabeledIconButton
                        highlighted={props.fillBitmapShapes}
                        imgSrc={fillIcon}
                        title={props.intl.formatMessage(messages.filled)}
                        onClick={props.onFillShapes}
                    />
                </InputGroup>
                <InputGroup>
                    <LabeledIconButton
                        highlighted={!props.fillBitmapShapes}
                        imgSrc={outlineIcon}
                        title={props.intl.formatMessage(messages.outlined)}
                        onClick={props.onOutlineShapes}
                    />
                </InputGroup>
                {props.fillBitmapShapes ? null : (
                    <InputGroup>
                        <Label text={props.intl.formatMessage(messages.thickness)}>
                            <LiveInput
                                range
                                small
                                max={MAX_STROKE_WIDTH}
                                min="1"
                                type="number"
                                value={props.bitBrushSize}
                                onSubmit={props.onBitBrushSliderChange}
                            />
                        </Label>
                    </InputGroup>)
                }
            </div>
        );
    }
    case Modes.ARROW:
    {
        return (
            <div className={classNames(props.className, styles.modeTools)}>
                <span>{props.intl.formatMessage(messages.arrowTip)}</span>
            </div>
        );
    }
    default:
        // Leave empty for now, if mode not supported
        return (
            <div className={classNames(props.className, styles.modeTools)} />
        );
    }
};

const sussyShapePreview = shape => `data:image/svg+xml,${encodeURIComponent(generateSussyShapeSVG(shape))}`;

const DesktopModeTools = props => {
    const text = message => props.intl.formatMessage(message);
    const stepper = (message, value, onSubmit, limits) => (
        <ToolbarField label={text(message)}>
            <Stepper
                max={limits.max}
                min={limits.min}
                name={text(message)}
                step={limits.step}
                value={value}
                onSubmit={onSubmit}
            />
        </ToolbarField>
    );
    const strokeLimits = {min: 1, max: MAX_STROKE_WIDTH, step: 1};
    const smoothingLimits = {min: 0, max: 1000, step: 1};
    const brushShapes = (
        <ToolbarGroup>
            <ToolbarButton
                active={props.brushType === 'CIRCLE'}
                icon={Circle}
                title={text(brushTypeMessages.brushCircle)}
                onClick={props.onCircleBrush}
            />
            <ToolbarButton
                active={props.brushType === 'SQUARE'}
                icon={Square}
                title={text(brushTypeMessages.brushSquare)}
                onClick={props.onSquareBrush}
            />
        </ToolbarGroup>
    );
    const clipboard = (
        <ToolbarGroup>
            <ToolbarButton
                icon={ClipboardCopy}
                title={text(messages.copy)}
                onClick={props.onCopyToClipboard}
            />
            <ToolbarButton
                disabled={!(props.clipboardItems.length > 0)}
                icon={ClipboardPaste}
                title={text(messages.paste)}
                onClick={props.onPasteFromClipboard}
            />
            <ToolbarButton
                icon={Scissors}
                title={text(messages.cut)}
                onClick={props.onCutToClipboard}
            />
            <ToolbarButton
                icon={Trash}
                title={text(messages.delete)}
                onClick={props.onDelete}
            />
        </ToolbarGroup>
    );
    const flip = (
        <ToolbarGroup>
            <ToolbarButton
                icon={FlipHorizontal2}
                title={text(messages.flipHorizontal)}
                onClick={props.onFlipHorizontal}
            />
            <ToolbarButton
                icon={FlipVertical2}
                title={text(messages.flipVertical)}
                onClick={props.onFlipVertical}
            />
            <ToolbarButton
                icon={Plus}
                title={text(messages.movementCenter)}
                onClick={props.onCenterSelection}
            />
        </ToolbarGroup>
    );
    const toolsClassName = classNames(props.className, styles.modeTools, styles.desktopTools);
    const tools = children => (
        <div className={toolsClassName}>
            {children}
        </div>
    );

    switch (props.mode) {
    case Modes.BRUSH:
        return tools(
            <React.Fragment>
                {stepper(messages.brushSize, props.brushValue, props.onBrushSliderChange, strokeLimits)}
                {stepper(messages.brushSimplify, props.simplifyValue, props.onSimplifySliderChange, smoothingLimits)}
                {brushShapes}
            </React.Fragment>
        );
    case Modes.BIT_BRUSH:
        return tools(stepper(messages.brushSize, props.bitBrushSize, props.onBitBrushSliderChange, strokeLimits));
    case Modes.BIT_LINE:
        return tools(stepper(messages.thickness, props.bitBrushSize, props.onBitBrushSliderChange, strokeLimits));
    case Modes.ERASER:
        return tools(
            <React.Fragment>
                {stepper(messages.eraserSize, props.eraserValue, props.onEraserSliderChange, strokeLimits)}
                {stepper(
                    messages.eraserSimplify,
                    props.eraserSimplifyValue,
                    props.onEraserSimplifySliderChange,
                    smoothingLimits
                )}
                {brushShapes}
            </React.Fragment>
        );
    case Modes.BIT_ERASER:
        return tools(stepper(messages.eraserSize, props.bitEraserSize, props.onBitEraserSliderChange, strokeLimits));
    case Modes.RECT:
        return tools(stepper(
            messages.roundedCornerSize,
            props.roundedCornerValue,
            props.onRoundedCornerSliderChange,
            {min: 0, max: 1000, step: 1}
        ));
    case Modes.ROUNDED_RECT:
        return tools(stepper(
            messages.roundedCornerSize,
            props.roundedRectCornerValue,
            props.onRoundedRectCornerSliderChange,
            {min: 0, max: 1000, step: 1}
        ));
    case Modes.TRIANGLE:
        return tools(
            <React.Fragment>
                {stepper(
                    messages.currentSideCount,
                    props.trianglePolyValue,
                    props.onPolyCountSliderChange,
                    {min: 3, max: 1000, step: 1}
                )}
                {stepper(
                    messages.spokeRatio,
                    props.trianglePointValue,
                    props.onPointCountSliderChange,
                    {min: 0, max: 1000, step: 0.1}
                )}
            </React.Fragment>
        );
    case Modes.SUSSY:
    {
        const selectedShape = sussyToolShapes.find(shape => shape.id === props.currentlySelectedShape);
        const categorizedShapes = categorizeSussyShapes(sussyToolShapes);
        return tools(
            <Dropdown
                className={classNames(styles.modUnselect, styles.shapeDropdown)}
                enterExitTransitionDurationMs={20}
                popoverContent={
                    <InputGroup
                        className={classNames(styles.modContextMenu, styles.dropItemShapeToolMenu)}
                        rtl={props.rtl}
                    >
                        {Object.keys(categorizedShapes)
                            .filter(categoryId => categorizedShapes[categoryId].length > 0)
                            .map(categoryId => (
                                <React.Fragment key={categoryId}>
                                    <p className={styles.dropItemShapeToolLabel}>
                                        {sussyToolCategories[categoryId]}
                                    </p>
                                    <div className={styles.shapeGrid}>
                                        {categorizedShapes[categoryId].map(shape => (
                                            <ToolbarButton
                                                active={shape.id === props.currentlySelectedShape}
                                                data-shape={shape.id}
                                                imgSrc={sussyShapePreview(shape)}
                                                key={shape.id}
                                                title={shape.name}
                                                onClick={props.onChooseShape}
                                            />
                                        ))}
                                    </div>
                                </React.Fragment>
                            ))}
                    </InputGroup>
                }
                tipSize={.01}
            >
                <img
                    alt={selectedShape.name}
                    height={16}
                    src={sussyShapePreview(selectedShape)}
                    title={selectedShape.name}
                />
            </Dropdown>
        );
    }
    case Modes.PEN:
        return tools(stepper(
            messages.eraserSimplify,
            props.penSimplifyValue,
            props.onPenSimplifySliderChange,
            smoothingLimits
        ));
    case Modes.RESHAPE:
        return tools(
            <React.Fragment>
                <ToolbarGroup>
                    <ToolbarButton
                        disabled={!props.hasSelectedUncurvedPoints}
                        icon={CurvedPointIcon}
                        title={text(messages.curved)}
                        onClick={props.onCurvePoints}
                    />
                    <ToolbarButton
                        disabled={!props.hasSelectedUnpointedPoints}
                        icon={StraightPointIcon}
                        title={text(messages.pointed)}
                        onClick={props.onPointPoints}
                    />
                </ToolbarGroup>
                <ToolbarGroup>
                    <ToolbarButton
                        disabled={props.hasSelectedRoundEnds}
                        icon={RoundLine}
                        title={text(messages.endRounded)}
                        onClick={props.onRoundEnds}
                    />
                    <ToolbarButton
                        disabled={props.hasSelectedSquareEnds}
                        icon={SquareLine}
                        title={text(messages.endSquared)}
                        onClick={props.onSquareEnds}
                    />
                </ToolbarGroup>
                <ToolbarGroup>
                    <ToolbarButton
                        disabled={props.hasSelectedMiterLineJoin}
                        icon={MiterLineJoin}
                        title={text(messages.joinSpiked)}
                        onClick={props.onMiterLineJoin}
                    />
                    <ToolbarButton
                        disabled={props.hasSelectedRoundLineJoin}
                        icon={RoundLineJoin}
                        title={text(messages.joinRounded)}
                        onClick={props.onRoundLineJoin}
                    />
                    <ToolbarButton
                        disabled={props.hasSelectedBevelLineJoin}
                        icon={BevelLineJoin}
                        title={text(messages.joinBeveled)}
                        onClick={props.onBevelLineJoin}
                    />
                </ToolbarGroup>
                <ToolbarGroup>
                    <ToolbarButton
                        icon={Trash}
                        title={text(messages.delete)}
                        onClick={props.onDelete}
                    />
                </ToolbarGroup>
            </React.Fragment>
        );
    case Modes.SELECT:
        return tools(
            <React.Fragment>
                {clipboard}
                {flip}
                <ToolbarGroup>
                    <ToolbarButton
                        icon={SquaresUnite}
                        title={text(messages.merge)}
                        onClick={props.onMergeShape}
                    />
                    <ToolbarButton
                        icon={SquaresIntersect}
                        title={text(messages.mask)}
                        onClick={props.onMaskShape}
                    />
                    <ToolbarButton
                        icon={SquaresSubtract}
                        title={text(messages.subtract)}
                        onClick={props.onSubtractShape}
                    />
                    <ToolbarButton
                        icon={SquaresExclude}
                        title={text(messages.filter)}
                        onClick={props.onExcludeShape}
                    />
                </ToolbarGroup>
            </React.Fragment>
        );
    case Modes.BIT_SELECT:
        return tools(
            <React.Fragment>
                {clipboard}
                {flip}
            </React.Fragment>
        );
    case Modes.BIT_TEXT:
    case Modes.TEXT:
        return tools(
            <React.Fragment>
                <FontDropdown
                    onManageFonts={props.onManageFonts}
                    onUpdateImage={props.onUpdateImage}
                />
                <ToolbarGroup>
                    <ToolbarButton
                        active={props.textAlignment === 'left'}
                        icon={TextAlignStart}
                        title={text(messages.leftAlign)}
                        onClick={props.onTextAlignLeft}
                    />
                    <ToolbarButton
                        active={props.textAlignment === 'center'}
                        icon={TextAlignCenter}
                        title={text(messages.centerAlign)}
                        onClick={props.onTextAlignCenter}
                    />
                    <ToolbarButton
                        active={props.textAlignment === 'right'}
                        icon={TextAlignEnd}
                        title={text(messages.rightAlign)}
                        onClick={props.onTextAlignRight}
                    />
                </ToolbarGroup>
            </React.Fragment>
        );
    case Modes.BIT_RECT:
    case Modes.BIT_OVAL:
    {
        const isRect = props.mode === Modes.BIT_RECT;
        return tools(
            <React.Fragment>
                <ToolbarGroup>
                    <ToolbarButton
                        active={props.fillBitmapShapes}
                        imgSrc={isRect ? bitRectIcon : bitOvalIcon}
                        title={text(messages.filled)}
                        onClick={props.onFillShapes}
                    />
                    <ToolbarButton
                        active={!props.fillBitmapShapes}
                        imgSrc={isRect ? bitRectOutlinedIcon : bitOvalOutlinedIcon}
                        title={text(messages.outlined)}
                        onClick={props.onOutlineShapes}
                    />
                </ToolbarGroup>
                {props.fillBitmapShapes ? null : stepper(
                    messages.thickness,
                    props.bitBrushSize,
                    props.onBitBrushSliderChange,
                    strokeLimits
                )}
            </React.Fragment>
        );
    }
    case Modes.ARROW:
        return tools(<ToolbarHint>{text(messages.arrowTip)}</ToolbarHint>);
    default:
        return tools(null);
    }
};

const ModeToolsComponent = props => {
    if (props.phone) return <PhoneModeTools {...props} />;
    return <DesktopModeTools {...props} />;
};

ModeToolsComponent.propTypes = {
    bitBrushSize: PropTypes.number,
    bitEraserSize: PropTypes.number,
    brushValue: PropTypes.number,
    simplifyValue: PropTypes.number,
    className: PropTypes.string,
    clipboardItems: PropTypes.arrayOf(PropTypes.array),
    eraserValue: PropTypes.number,
    eraserSimplifyValue: PropTypes.number,
    brushType: PropTypes.string,
    penSimplifyValue: PropTypes.number,
    roundedCornerValue: PropTypes.number,
    roundedRectCornerValue: PropTypes.number,
    trianglePolyValue: PropTypes.number,
    trianglePointValue: PropTypes.number,
    currentlySelectedShape: PropTypes.string,
    fillBitmapShapes: PropTypes.bool,
    format: PropTypes.oneOf(Object.keys(Formats)),
    hasSelectedUncurvedPoints: PropTypes.bool,
    hasSelectedUnpointedPoints: PropTypes.bool,
    intl: intlShape.isRequired,
    mode: PropTypes.string.isRequired,
    phone: PropTypes.bool,
    rtl: PropTypes.bool,
    textAlignment: PropTypes.string,
    onChooseShape: PropTypes.func,
    onCircleBrush: PropTypes.func,
    onSquareBrush: PropTypes.func,
    onBitBrushSliderChange: PropTypes.func.isRequired,
    onBitEraserSliderChange: PropTypes.func.isRequired,
    onBrushSliderChange: PropTypes.func.isRequired,
    onSimplifySliderChange: PropTypes.func.isRequired,
    onCopyToClipboard: PropTypes.func.isRequired,
    onCutToClipboard: PropTypes.func.isRequired,
    onCurvePoints: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onEraserSliderChange: PropTypes.func,
    onBrushChange: PropTypes.func,
    onEraserSimplifySliderChange: PropTypes.func,
    onPenSimplifySliderChange: PropTypes.func,
    onFillShapes: PropTypes.func.isRequired,
    onFlipHorizontal: PropTypes.func.isRequired,
    onFlipVertical: PropTypes.func.isRequired,
    onCenterSelection: PropTypes.func.isRequired,
    onManageFonts: PropTypes.func,
    onOutlineShapes: PropTypes.func.isRequired,
    onPasteFromClipboard: PropTypes.func.isRequired,
    onPointPoints: PropTypes.func.isRequired,
    onUpdateImage: PropTypes.func.isRequired,

    onMergeShape: PropTypes.func.isRequired,
    onMaskShape: PropTypes.func.isRequired,
    onSubtractShape: PropTypes.func.isRequired,
    onExcludeShape: PropTypes.func.isRequired
};

PhoneModeTools.propTypes = ModeToolsComponent.propTypes;
DesktopModeTools.propTypes = ModeToolsComponent.propTypes;

const mapStateToProps = state => ({
    mode: state.scratchPaint.mode,
    format: state.scratchPaint.format,
    fillBitmapShapes: state.scratchPaint.fillBitmapShapes,
    bitBrushSize: state.scratchPaint.bitBrushSize,
    bitEraserSize: state.scratchPaint.bitEraserSize,
    brushValue: state.scratchPaint.brushMode.brushSize,
    simplifyValue: state.scratchPaint.brushMode.simplifySize,
    clipboardItems: state.scratchPaint.clipboard.items,
    eraserValue: state.scratchPaint.eraserMode.brushSize,
    eraserSimplifyValue: state.scratchPaint.eraserMode.simplifySize,
    brushType: state.scratchPaint.brushMode.brushType,
    rtl: state.scratchPaint.layout.rtl,
    textAlignment: state.scratchPaint.textAlignment.alignment,
    penSimplifyValue: state.scratchPaint.penMode.simplifySize,
    roundedRectCornerValue: state.scratchPaint.roundedRectMode.roundedCornerSize,
    roundedCornerValue: state.scratchPaint.rectMode.roundedCornerSize,
    trianglePolyValue: state.scratchPaint.triangleMode.trianglePolyCount,
    trianglePointValue: state.scratchPaint.triangleMode.trianglePointCount,
    currentlySelectedShape: state.scratchPaint.sussyMode.shape
});
const mapDispatchToProps = dispatch => ({
    onBrushSliderChange: brushSize => {
        dispatch(changeBrushSize(brushSize));
    },
    onSimplifySliderChange: brushSize => {
        dispatch(changeSimplifySize(brushSize));
    },
    onRoundedRectCornerSliderChange: roundedCornerSize => {
        dispatch(changeRoundedRectCornerSize(roundedCornerSize));
    },
    onRoundedCornerSliderChange: roundedCornerSize => {
        dispatch(changeRoundedCornerSize(roundedCornerSize));
    },
    onPolyCountSliderChange: polyCount => {
        dispatch(changeTrianglePolyCount(polyCount));
    },
    onPointCountSliderChange: polyCount => {
        dispatch(changeTrianglePointCount(polyCount));
    },
    onCurrentlySelectedShapeChange: shape => {
        dispatch(changeCurrentlySelectedShape(shape));
    },
    onBitBrushSliderChange: bitBrushSize => {
        dispatch(changeBitBrushSize(bitBrushSize));
    },
    onBitEraserSliderChange: eraserSize => {
        dispatch(changeBitEraserSize(eraserSize));
    },
    onEraserSliderChange: eraserSize => {
        dispatch(changeEraserSize(eraserSize));
    },
    onEraserSimplifySliderChange: eraserSize => {
        dispatch(changeEraserSimplifySize(eraserSize));
    },
    onBrushChange: type => {
        dispatch(setBrushType(type));
    },
    onCircleBrush: () => {
        dispatch(setBrushType('CIRCLE'));
    },
    onSquareBrush: () => {
        dispatch(setBrushType('SQUARE'));
    },
    onChooseShape: event => {
        dispatch(changeCurrentlySelectedShape(event.currentTarget.dataset.shape));
    },
    onPenSimplifySliderChange: eraserSize => {
        dispatch(changePenSimplifySize(eraserSize));
    },
    onFillShapes: () => {
        dispatch(setShapesFilled(true));
    },
    onOutlineShapes: () => {
        dispatch(setShapesFilled(false));
    },
    onTextAlignLeft: () => {
        dispatch(setTextAlignment('left'));
    },
    onTextAlignRight: () => {
        dispatch(setTextAlignment('right'));
    },
    onTextAlignCenter: () => {
        dispatch(setTextAlignment('center'));
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(injectIntl(ModeToolsComponent));
