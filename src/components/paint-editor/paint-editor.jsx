import paper from '@turbowarp/paper';
import classNames from 'classnames';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import React from 'react';
import PropTypes from 'prop-types';
import MediaQuery from 'react-responsive';

import PaperCanvas from '../../containers/paper-canvas.jsx';
import ScrollableCanvas from '../../containers/scrollable-canvas.jsx';

import BitBrushMode from '../../containers/bit-brush-mode.jsx';
import BitLineMode from '../../containers/bit-line-mode.jsx';
import BitOvalMode from '../../containers/bit-oval-mode.jsx';
import BitRectMode from '../../containers/bit-rect-mode.jsx';
import BitFillMode from '../../containers/bit-fill-mode.jsx';
import BitEraserMode from '../../containers/bit-eraser-mode.jsx';
import BitSelectMode from '../../containers/bit-select-mode.jsx';
import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import ButtonGroup from '../button-group/button-group.jsx';
import BrushMode from '../../containers/brush-mode.jsx';
import EraserMode from '../../containers/eraser-mode.jsx';
import FillColorIndicatorComponent from '../../containers/fill-color-indicator.jsx';
import FillMode from '../../containers/fill-mode.jsx';
import InputGroup from '../input-group/input-group.jsx';
import LineMode from '../../containers/line-mode.jsx';
import Loupe from '../loupe/loupe.jsx';
import FixedToolsContainer from '../../containers/fixed-tools.jsx';
import ModeToolsContainer from '../../containers/mode-tools.jsx';
import OvalMode from '../../containers/oval-mode.jsx';
import PenMode from '../../containers/pen-mode.jsx';
import RectMode from '../../containers/rect-mode.jsx';
import RoundedRectMode from '../../containers/rounded-rect-mode.jsx';
import SussyMode from '../../containers/sussy-mode.jsx';
import TriangleMode from '../../containers/triangle-mode.jsx';
import ArrowMode from '../../containers/arrow-mode.jsx';
import ReshapeMode from '../../containers/reshape-mode.jsx';
import SelectMode from '../../containers/select-mode.jsx';
import StrokeColorIndicatorComponent from '../../containers/stroke-color-indicator.jsx';
import StrokeWidthIndicatorComponent from '../../containers/stroke-width-indicator.jsx';
import TextMode from '../../containers/text-mode.jsx';


import Formats, {isBitmap, isVector} from '../../lib/format';
import Modes from '../../lib/modes';
import styles from './paint-editor.css';

import {
    Image, ZoomIn, ZoomOut, Scan, Palette, Shapes, TriangleAlert, X
} from 'lucide-react';

const messages = defineMessages({
    bitmap: {
        defaultMessage: 'Convert to Bitmap',
        description: 'Label for button that converts the paint editor to bitmap mode',
        id: 'paint.paintEditor.bitmap'
    },
    vector: {
        defaultMessage: 'Convert to Vector',
        description: 'Label for button that converts the paint editor to vector mode',
        id: 'paint.paintEditor.vector'
    },
    bitmapHelp: {
        defaultMessage: 'Convert this costume to bitmap. Converting it back will not restore editable vector shapes.',
        description: 'Tooltip explaining the effect of converting a vector costume to bitmap',
        id: 'paint.paintEditor.bitmapHelp'
    },
    vectorHelp: {
        defaultMessage: 'Convert this costume to vector. The bitmap artwork will remain a pixel image.',
        description: 'Tooltip explaining the effect of converting a bitmap costume to vector',
        id: 'paint.paintEditor.vectorHelp'
    },
    canvasNoise: {
        // eslint-disable-next-line max-len
        defaultMessage: 'Your browser\'s fingerprinting protection adds noise to canvas images, so bitmap costumes can slowly turn grainy. To keep them clean, turn off fingerprinting protection for this site in the site settings next to the address bar.',
        description: 'Notice shown in bitmap mode when the browser adds noise to canvas pixel reads',
        id: 'paint.paintEditor.canvasNoise'
    },
    dismissCanvasNoise: {
        defaultMessage: 'Dismiss',
        description: 'Label for the button that hides the canvas noise notice',
        id: 'paint.paintEditor.dismissCanvasNoise'
    },
    shapes: {
        defaultMessage: 'Shapes',
        description: 'Label for the phone toolbar button that opens the shape tools',
        id: 'paint.paintEditor.shapes'
    },
    moreShapes: {
        defaultMessage: 'More shapes',
        description: 'Label for the toolbar button that opens the less common shape tools',
        id: 'paint.paintEditor.moreShapes'
    },
    formatVector: {
        defaultMessage: 'Vector',
        description: 'Label for the vector half of the switch between vector and bitmap costumes',
        id: 'paint.paintEditor.formatVector'
    },
    formatBitmap: {
        defaultMessage: 'Bitmap',
        description: 'Label for the bitmap half of the switch between vector and bitmap costumes',
        id: 'paint.paintEditor.formatBitmap'
    },
    format: {
        defaultMessage: 'Costume format',
        description: 'Name of the switch between vector and bitmap costumes, read by screen readers',
        id: 'paint.paintEditor.format'
    },
    zoomActual: {
        defaultMessage: 'Zoom to 100%',
        description: 'Tooltip for the zoom percentage button, which resets the zoom to actual size',
        id: 'paint.paintEditor.zoomActual'
    },
    zoomActualFrom: {
        defaultMessage: 'Zoom is {percent}%. Zoom to 100%',
        description: 'Screen reader label for the zoom percentage button, which resets the zoom to actual size',
        id: 'paint.paintEditor.zoomActualFrom'
    },
    zoomIn: {
        defaultMessage: 'Zoom in',
        description: 'Label for the button that zooms the canvas in',
        id: 'paint.paintEditor.zoomIn'
    },
    zoomOut: {
        defaultMessage: 'Zoom out',
        description: 'Label for the button that zooms the canvas out',
        id: 'paint.paintEditor.zoomOut'
    },
    fitArtwork: {
        defaultMessage: 'Fit artwork',
        description: 'Label for the button that zooms the canvas so the whole drawing is visible',
        id: 'paint.paintEditor.fitArtwork'
    },
    canvasTheme: {
        defaultMessage: 'Canvas theme',
        description: 'Label for the button that switches the canvas between light and dark backgrounds',
        id: 'paint.paintEditor.canvasTheme'
    }
});

const PHONE_QUERY = {maxWidth: 600};

const PHONE_SHAPE_MODES = [
    Modes.LINE, Modes.OVAL, Modes.RECT, Modes.ROUNDED_RECT, Modes.TRIANGLE, Modes.SUSSY, Modes.ARROW,
    Modes.BIT_LINE, Modes.BIT_OVAL, Modes.BIT_RECT
];

const MORE_SHAPE_MODES = [Modes.ROUNDED_RECT, Modes.TRIANGLE, Modes.SUSSY, Modes.ARROW];

const ResponsiveToolStrip = props => (
    <div className={styles.toolStripPanel}>
        <div className={styles.modeSelector}>
            {props.children}
        </div>
    </div>
);

ResponsiveToolStrip.propTypes = {
    children: PropTypes.node.isRequired
};

const ShapeToolGroup = props => {
    const [open, setOpen] = React.useState(false);
    const group = React.useRef(null);
    React.useEffect(() => {
        if (!open) return;
        const close = event => {
            if (group.current && !group.current.contains(event.target)) setOpen(false);
        };
        const closeOnEscape = event => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', close);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', close);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);
    const active = props.modes.indexOf(props.mode) !== -1;
    const label = props.intl.formatMessage(props.label);
    return (
        <div
            className={styles.shapeGroup}
            ref={group}
        >
            <button
                aria-expanded={open}
                aria-label={label}
                className={classNames(styles.shapeGroupButton, {
                    [styles.isActive]: active
                })}
                title={label}
                type="button"
                onClick={() => setOpen(!open)} // eslint-disable-line react/jsx-no-bind
            >
                <Shapes
                    aria-hidden="true"
                    size={24}
                />
            </button>
            <div
                className={classNames(styles.shapePopover, {
                    [styles.isOpen]: open
                })}
                onClick={() => setOpen(false)} // eslint-disable-line react/jsx-no-bind
            >
                {props.children}
            </div>
        </div>
    );
};

ShapeToolGroup.propTypes = {
    children: PropTypes.node.isRequired,
    intl: intlShape,
    label: PropTypes.shape({
        defaultMessage: PropTypes.string,
        id: PropTypes.string
    }).isRequired,
    mode: PropTypes.string,
    modes: PropTypes.arrayOf(PropTypes.string).isRequired
};

const shapeGroup = (editor, shapes) => (
    <ShapeToolGroup
        intl={editor.intl}
        key="shapes"
        label={editor.phone ? messages.shapes : messages.moreShapes}
        mode={editor.mode}
        modes={editor.phone ? PHONE_SHAPE_MODES : MORE_SHAPE_MODES}
    >
        {shapes}
    </ShapeToolGroup>
);

const VectorTools = props => {
    const commonShapes = [
        <LineMode
            key="line"
            onUpdateImage={props.onUpdateImage}
        />,
        <OvalMode
            key="oval"
            onUpdateImage={props.onUpdateImage}
        />,
        <RectMode
            key="rect"
            onUpdateImage={props.onUpdateImage}
        />
    ];
    const moreShapes = [
        props.showRoundedRectMode ? (
            <RoundedRectMode
                key="rounded-rect"
                onUpdateImage={props.onUpdateImage}
            />
        ) : null,
        <TriangleMode
            key="triangle"
            onUpdateImage={props.onUpdateImage}
        />,
        <SussyMode
            key="sussy"
            onUpdateImage={props.onUpdateImage}
        />,
        <ArrowMode
            key="arrow"
            onUpdateImage={props.onUpdateImage}
        />
    ];
    const tools = [
        <SelectMode
            key="select"
            onUpdateImage={props.onUpdateImage}
        />,
        <ReshapeMode
            key="reshape"
            onUpdateImage={props.onUpdateImage}
        />,
        <BrushMode
            key="brush"
            onUpdateImage={props.onUpdateImage}
        />,
        <EraserMode
            key="eraser"
            onUpdateImage={props.onUpdateImage}
        />,
        <PenMode
            key="pen"
            onUpdateSvg={props.onUpdateImage}
        />,
        <FillMode
            key="fill"
            onUpdateImage={props.onUpdateImage}
        />,
        <TextMode
            key="text"
            textArea={props.textArea}
            onUpdateImage={props.onUpdateImage}
        />
    ].concat(props.phone ?
        [shapeGroup(props, commonShapes.concat(moreShapes))] :
        commonShapes.concat([shapeGroup(props, moreShapes)]));
    return (
        <ResponsiveToolStrip>
            {tools}
        </ResponsiveToolStrip>
    );
};

const BitmapTools = props => {
    const shapes = [
        <BitLineMode
            key="line"
            onUpdateImage={props.onUpdateImage}
        />,
        <BitOvalMode
            key="oval"
            onUpdateImage={props.onUpdateImage}
        />,
        <BitRectMode
            key="rect"
            onUpdateImage={props.onUpdateImage}
        />
    ];
    const tools = [
        <BitBrushMode
            key="brush"
            onUpdateImage={props.onUpdateImage}
        />
    ].concat(props.phone ? [] : shapes, [
        <TextMode
            isBitmap
            key="text"
            textArea={props.textArea}
            onUpdateImage={props.onUpdateImage}
        />,
        <BitFillMode
            key="fill"
            onUpdateImage={props.onUpdateImage}
        />,
        <BitEraserMode
            key="eraser"
            onUpdateImage={props.onUpdateImage}
        />,
        <BitSelectMode
            key="select"
            onUpdateImage={props.onUpdateImage}
        />
    ], props.phone ? [shapeGroup(props, shapes)] : []);
    return (
        <ResponsiveToolStrip>
            {tools}
        </ResponsiveToolStrip>
    );
};

const FixedTools = props => (
    <FixedToolsContainer
        canRedo={props.canRedo}
        canUndo={props.canUndo}
        name={props.name}
        onRedo={props.onRedo}
        onUndo={props.onUndo}
        onUpdateImage={props.onUpdateImage}
        onUpdateName={props.onUpdateName}
        phone={props.phone}
        section={props.section}
    />
);

const ModeTools = props => (
    <InputGroup className={props.groupClassName}>
        <ModeToolsContainer
            onUpdateImage={props.onUpdateImage}
            width={props.width}
            height={props.height}
            phone={props.phone}
            onManageFonts={props.onManageFonts}
        />
    </InputGroup>
);

const DesktopTop = props => (
    <div className={styles.editorContainerTop}>
        <div className={styles.headerMain}>
            <FixedTools {...props} />
            <div className={styles.headerColors}>
                <FillColorIndicatorComponent
                    onUpdateImage={props.onUpdateImage}
                />
                {isVector(props.format) ? (
                    <StrokeColorIndicatorComponent
                        onUpdateImage={props.onUpdateImage}
                    />
                ) : null}
                {isVector(props.format) ? (
                    <StrokeWidthIndicatorComponent
                        stepper
                        onUpdateImage={props.onUpdateImage}
                    />
                ) : null}
            </div>
        </div>
        <div className={styles.headerContext}>
            {isVector(props.format) ? (
                <FixedTools
                    {...props}
                    section="arrange"
                />
            ) : null}
            <ModeTools {...props} />
        </div>
    </div>
);

const FormatSwitch = props => {
    const vector = isVector(props.format);
    const bitmap = isBitmap(props.format);
    if (!vector && !bitmap) return null;
    return (
        <div
            aria-label={props.intl.formatMessage(messages.format)}
            className={styles.formatSwitch}
            role="group"
        >
            <button
                aria-pressed={vector}
                className={classNames(styles.formatOption, {
                    [styles.isSelected]: vector
                })}
                title={vector ? null : props.intl.formatMessage(messages.vectorHelp)}
                type="button"
                onClick={vector ? null : props.onSwitchToVector}
            >
                {props.intl.formatMessage(messages.formatVector)}
            </button>
            <button
                aria-pressed={bitmap}
                className={classNames(styles.formatOption, {
                    [styles.isSelected]: bitmap
                })}
                title={bitmap ? null : props.intl.formatMessage(messages.bitmapHelp)}
                type="button"
                onClick={bitmap ? null : props.onSwitchToBitmap}
            >
                {props.intl.formatMessage(messages.formatBitmap)}
            </button>
        </div>
    );
};

const ConvertButton = props => {
    if (isVector(props.format)) {
        return (
            <Button
                aria-label={props.intl.formatMessage(messages.bitmapHelp)}
                className={styles.bitmapButton}
                title={props.intl.formatMessage(messages.bitmapHelp)}
                onClick={props.onSwitchToBitmap}
            >
                <Image
                    className={styles.bitmapButtonIcon}
                    draggable={false}
                />
                <span className={styles.buttonText}>
                    {props.intl.formatMessage(messages.bitmap)}
                </span>
            </Button>
        );
    }
    if (isBitmap(props.format)) {
        return (
            <Button
                aria-label={props.intl.formatMessage(messages.vectorHelp)}
                className={styles.bitmapButton}
                title={props.intl.formatMessage(messages.vectorHelp)}
                onClick={props.onSwitchToVector}
            >
                <Image
                    className={styles.bitmapButtonIcon}
                    draggable={false}
                />
                <span className={styles.buttonText}>
                    {props.intl.formatMessage(messages.vector)}
                </span>
            </Button>
        );
    }
    return null;
};

const PhoneTop = props => (
    <div className={styles.phoneBar}>
        <FixedTools {...props} />
        <div className={styles.phoneColors}>
            <FillColorIndicatorComponent
                compact
                onUpdateImage={props.onUpdateImage}
            />
            {isVector(props.format) ? (
                <StrokeColorIndicatorComponent
                    compact
                    onUpdateImage={props.onUpdateImage}
                />
            ) : null}
        </div>
    </div>
);

const STROKELESS_MODES = [Modes.BRUSH, Modes.TEXT, Modes.FILL];

const PhoneContextBar = props => (
    <div className={styles.phoneContext}>
        {isVector(props.format) && STROKELESS_MODES.indexOf(props.mode) === -1 ? (
            <StrokeWidthIndicatorComponent
                onUpdateImage={props.onUpdateImage}
            />
        ) : null}
        <ModeTools
            {...props}
            groupClassName={styles.phoneModeTools}
        />
    </div>
);

const ZoomControls = props => {
    const text = (message, values) => props.intl.formatMessage(message, values);
    const fit = (
        <Button
            aria-label={text(messages.fitArtwork)}
            className={styles.buttonGroupButton}
            title={text(messages.fitArtwork)}
            onClick={props.onZoomReset}
        >
            <Scan
                className={styles.buttonGroupButtonIcon}
                draggable={false}
            />
        </Button>
    );
    return (
        <InputGroup className={styles.zoomControls}>
            <ButtonGroup className={styles.viewportControls}>
                <Button
                    aria-label={text(messages.canvasTheme)}
                    className={styles.buttonGroupButton}
                    title={text(messages.canvasTheme)}
                    onClick={props.onChangeTheme}
                >
                    <Palette
                        aria-hidden
                        className={styles.buttonGroupButtonIcon}
                        draggable={false}
                    />
                </Button>
                <Button
                    aria-label={text(messages.zoomOut)}
                    className={classNames(styles.buttonGroupButton, styles.zoomStepButton)}
                    title={text(messages.zoomOut)}
                    onClick={props.onZoomOut}
                >
                    <ZoomOut
                        aria-hidden
                        className={styles.buttonGroupButtonIcon}
                        draggable={false}
                    />
                </Button>
                {props.phone ? fit : (
                    <Button
                        aria-label={text(messages.zoomActualFrom, {percent: props.zoomPercent})}
                        className={classNames(styles.buttonGroupButton, styles.zoomReadout)}
                        title={text(messages.zoomActual)}
                        onClick={props.onZoomActual}
                    >
                        {`${props.zoomPercent}%`}
                    </Button>
                )}
                <Button
                    aria-label={text(messages.zoomIn)}
                    className={classNames(styles.buttonGroupButton, styles.zoomStepButton)}
                    title={text(messages.zoomIn)}
                    onClick={props.onZoomIn}
                >
                    <ZoomIn
                        aria-hidden
                        className={styles.buttonGroupButtonIcon}
                        draggable={false}
                    />
                </Button>
                {props.phone ? null : fit}
            </ButtonGroup>
        </InputGroup>
    );
};

const PaintEditorLayout = props => (
    <div
        className={classNames(styles.editorContainer, {
            [styles.phoneLayout]: props.phone,
            [styles.desktopLayout]: !props.phone
        })}
        dir={props.rtl ? 'rtl' : 'ltr'}
        data-paint-theme={props.theme}
        data-ui-theme={props.uiTheme}
    >
        {props.canvas !== null ? ( // eslint-disable-line no-negated-condition
            props.phone ? <PhoneTop {...props} /> : <DesktopTop {...props} />
        ) : null}

        <div className={styles.topAlignRow}>
            {props.canvas !== null && isVector(props.format) ? // eslint-disable-line no-negated-condition
                <VectorTools {...props} /> : null}

            {props.canvas !== null && isBitmap(props.format) ? // eslint-disable-line no-negated-condition
                <BitmapTools {...props} /> : null}

            <div className={styles.controlsContainer}>
                {/* Canvas */}
                <ScrollableCanvas
                    canvas={props.canvas}
                    hideScrollbars={props.isEyeDropping}
                    style={styles.canvasContainer}
                    onRedo={props.onRedo}
                    onRestoreUndo={props.onRestoreUndo}
                    onUndo={props.onUndo}
                >
                    <PaperCanvas
                        canvasRef={props.setCanvas}
                        image={props.image}
                        imageFormat={props.imageFormat}
                        imageId={props.imageId}
                        rotationCenterX={props.rotationCenterX}
                        rotationCenterY={props.rotationCenterY}
                        theme={props.theme}
                        zoomLevelId={props.zoomLevelId}
                        onUpdateImage={props.onUpdateImage}
                    />
                    <textarea
                        className={styles.textArea}
                        ref={props.setTextArea}
                        spellCheck={false}
                    />
                    {props.isEyeDropping &&
                        props.colorInfo !== null &&
                        !props.colorInfo.hideLoupe ? (
                            <Box className={styles.colorPickerWrapper}>
                                <Loupe
                                    colorInfo={props.colorInfo}
                                    pixelRatio={paper.project.view.pixelRatio}
                                    theme={props.theme}
                                />
                            </Box>
                        ) : null
                    }
                    {props.showNoiseNotice && isBitmap(props.format) ? (
                        <div
                            className={styles.noiseNotice}
                            role="status"
                        >
                            <TriangleAlert
                                aria-hidden="true"
                                className={styles.noiseNoticeIcon}
                                size={16}
                            />
                            <span className={styles.noiseNoticeText}>
                                {props.intl.formatMessage(messages.canvasNoise)}
                            </span>
                            <button
                                aria-label={props.intl.formatMessage(messages.dismissCanvasNoise)}
                                className={styles.noiseNoticeDismiss}
                                title={props.intl.formatMessage(messages.dismissCanvasNoise)}
                                type="button"
                                onClick={props.onDismissNoiseNotice}
                            >
                                <X
                                    aria-hidden="true"
                                    size={14}
                                />
                            </button>
                        </div>
                    ) : null}
                </ScrollableCanvas>
                {props.phone && props.canvas !== null ? <PhoneContextBar {...props} /> : null}
                <div className={styles.canvasControls}>
                    {props.phone ? <ConvertButton {...props} /> : <FormatSwitch {...props} />}
                    <ZoomControls {...props} />
                </div>
            </div>
        </div>
    </div>
);


const PaintEditorComponent = props => (
    <MediaQuery {...PHONE_QUERY}>
        {phone => (
            <PaintEditorLayout
                {...props}
                phone={phone}
            />
        )}
    </MediaQuery>
);

/* eslint-disable react/no-unused-prop-types */
const editorPropTypes = {
    canRedo: PropTypes.func.isRequired,
    canUndo: PropTypes.func.isRequired,
    canvas: PropTypes.instanceOf(Element),
    colorInfo: Loupe.propTypes.colorInfo,
    format: PropTypes.oneOf(Object.keys(Formats)),
    groupClassName: PropTypes.string,
    image: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(HTMLImageElement)
    ]),
    imageFormat: PropTypes.string,
    imageId: PropTypes.string,
    intl: intlShape,
    isEyeDropping: PropTypes.bool,
    mode: PropTypes.string,
    name: PropTypes.string,
    onChangeTheme: PropTypes.func.isRequired,
    onDismissNoiseNotice: PropTypes.func,
    onManageFonts: PropTypes.func,
    onRedo: PropTypes.func.isRequired,
    onRestoreUndo: PropTypes.func,
    onSwitchToBitmap: PropTypes.func.isRequired,
    onSwitchToVector: PropTypes.func.isRequired,
    onUndo: PropTypes.func.isRequired,
    onUpdateImage: PropTypes.func.isRequired,
    onUpdateName: PropTypes.func.isRequired,
    onZoomActual: PropTypes.func,
    onZoomIn: PropTypes.func.isRequired,
    onZoomOut: PropTypes.func.isRequired,
    onZoomReset: PropTypes.func.isRequired,
    phone: PropTypes.bool,
    rotationCenterX: PropTypes.number,
    rotationCenterY: PropTypes.number,
    rtl: PropTypes.bool,
    section: PropTypes.string,
    setCanvas: PropTypes.func.isRequired,
    showNoiseNotice: PropTypes.bool,
    setTextArea: PropTypes.func.isRequired,
    showRoundedRectMode: PropTypes.bool,
    textArea: PropTypes.instanceOf(Element),
    theme: PropTypes.string,
    uiTheme: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    zoomLevelId: PropTypes.string,
    zoomPercent: PropTypes.number
};

PaintEditorComponent.propTypes = editorPropTypes;
PaintEditorLayout.propTypes = editorPropTypes;
DesktopTop.propTypes = editorPropTypes;
FormatSwitch.propTypes = editorPropTypes;
ConvertButton.propTypes = editorPropTypes;
ZoomControls.propTypes = editorPropTypes;
PhoneTop.propTypes = editorPropTypes;
PhoneContextBar.propTypes = editorPropTypes;
VectorTools.propTypes = editorPropTypes;
BitmapTools.propTypes = editorPropTypes;
FixedTools.propTypes = editorPropTypes;
ModeTools.propTypes = editorPropTypes;
/* eslint-enable react/no-unused-prop-types */

const mapStateToProps = state => ({
    mode: state.scratchPaint.mode,
    showRoundedRectMode: state.scratchPaint.addonUtil.showRoundedRectMode
});

export default connect(
    mapStateToProps,
)(injectIntl(PaintEditorComponent));
