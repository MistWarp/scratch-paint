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

import {Image, ZoomIn, ZoomOut, Scan, Palette, Shapes, TriangleAlert, X} from 'lucide-react';

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
    }
});

const PHONE_QUERY = {maxWidth: 600};

const SHAPE_MODES = [
    Modes.LINE, Modes.OVAL, Modes.RECT, Modes.ROUNDED_RECT, Modes.TRIANGLE, Modes.SUSSY, Modes.ARROW,
    Modes.BIT_LINE, Modes.BIT_OVAL, Modes.BIT_RECT
];

const ResponsiveToolStrip = props => (
    <div className={styles.toolStripPanel}>
        <div className={classNames(styles.modeSelector, props.modeSelectorClassName)}>
            {props.children}
        </div>
    </div>
);

ResponsiveToolStrip.propTypes = {
    children: PropTypes.node.isRequired,
    modeSelectorClassName: PropTypes.string.isRequired
};

const ShapeToolGroup = props => {
    const [open, setOpen] = React.useState(false);
    const group = React.useRef(null);
    React.useEffect(() => {
        if (!open) return;
        const close = event => {
            if (group.current && !group.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener('pointerdown', close);
        return () => document.removeEventListener('pointerdown', close);
    }, [open]);
    const active = SHAPE_MODES.indexOf(props.mode) !== -1;
    const label = props.intl.formatMessage(messages.shapes);
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
    mode: PropTypes.string
};

const shapeGroup = (intl, mode, shapes) => (
    <ShapeToolGroup
        intl={intl}
        key="shapes"
        mode={mode}
    >
        {shapes}
    </ShapeToolGroup>
);

const VectorTools = props => {
    const shapes = [
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
        />,
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
    ].concat(props.phone ? [shapeGroup(props.intl, props.mode, shapes)] : shapes);
    return (
        <ResponsiveToolStrip modeSelectorClassName={styles.vectorModeSelector}>
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
    ], props.phone ? [shapeGroup(props.intl, props.mode, shapes)] : []);
    return (
        <ResponsiveToolStrip modeSelectorClassName={styles.bitmapModeSelector}>
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
        width={props.width}
    />
);

const ModeTools = props => (
    <InputGroup className={props.groupClassName}>
        <ModeToolsContainer
            onUpdateImage={props.onUpdateImage}
            width={props.width}
            height={props.height}
            onManageFonts={props.onManageFonts}
        />
    </InputGroup>
);

const DesktopTop = props => (
    <div className={styles.editorContainerTop}>
        <div className={styles.row}>
            <FixedTools {...props} />
        </div>
        {isVector(props.format) ?
            <div className={styles.row}>
                <InputGroup
                    className={classNames(
                        styles.row,
                        styles.modDashedBorder,
                        styles.modLabeledIconHeight
                    )}
                >
                    <FillColorIndicatorComponent
                        className={styles.modMarginAfter}
                        onUpdateImage={props.onUpdateImage}
                    />
                    <StrokeColorIndicatorComponent
                        onUpdateImage={props.onUpdateImage}
                    />
                    <StrokeWidthIndicatorComponent
                        onUpdateImage={props.onUpdateImage}
                    />
                </InputGroup>
                <ModeTools
                    {...props}
                    groupClassName={styles.modModeTools}
                />
            </div> :
            isBitmap(props.format) ?
                <div className={styles.row}>
                    <InputGroup
                        className={classNames(
                            styles.row,
                            styles.modDashedBorder,
                            styles.modLabeledIconHeight
                        )}
                    >
                        <FillColorIndicatorComponent
                            className={styles.modMarginAfter}
                            onUpdateImage={props.onUpdateImage}
                        />
                    </InputGroup>
                    <ModeTools
                        {...props}
                        groupClassName={styles.modModeTools}
                    />
                </div> : null
        }
    </div>
);

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

const PaintEditorLayout = props => (
    <div
        className={classNames(styles.editorContainer, {
            [styles.phoneLayout]: props.phone
        })}
        dir={props.rtl ? 'rtl' : 'ltr'}
        data-paint-theme={props.theme}
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
                    {isVector(props.format) ?
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
                        </Button> :
                        isBitmap(props.format) ?
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
                            </Button> : null
                    }
                    {/* Zoom controls */}
                    <InputGroup className={styles.zoomControls}>
                        <ButtonGroup className={styles.viewportControls}>
                            <Button
                                aria-label="Canvas theme"
                                className={styles.buttonGroupButton}
                                title="Canvas theme"
                                onClick={props.onChangeTheme}
                            >
                                <Palette
                                    alt="Change theme"
                                    className={styles.buttonGroupButtonIcon}
                                    draggable={false}
                                />
                            </Button>
                            <Button
                                aria-label="Zoom out"
                                className={classNames(styles.buttonGroupButton, styles.zoomStepButton)}
                                title="Zoom out"
                                onClick={props.onZoomOut}
                            >
                                <ZoomOut
                                    alt="Zoom Out"
                                    className={styles.buttonGroupButtonIcon}
                                    draggable={false}
                                />
                            </Button>
                            <Button
                                aria-label="Fit artwork"
                                className={styles.buttonGroupButton}
                                title="Fit artwork"
                                onClick={props.onZoomReset}
                            >
                                <Scan
                                    className={styles.buttonGroupButtonIcon}
                                    draggable={false}
                                />
                            </Button>
                            <Button
                                aria-label="Zoom in"
                                className={classNames(styles.buttonGroupButton, styles.zoomStepButton)}
                                title="Zoom in"
                                onClick={props.onZoomIn}
                            >
                                <ZoomIn
                                    alt="Zoom In"
                                    className={styles.buttonGroupButtonIcon}
                                    draggable={false}
                                />
                            </Button>
                        </ButtonGroup>
                    </InputGroup>
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
    onSwitchToBitmap: PropTypes.func.isRequired,
    onSwitchToVector: PropTypes.func.isRequired,
    onUndo: PropTypes.func.isRequired,
    onUpdateImage: PropTypes.func.isRequired,
    onUpdateName: PropTypes.func.isRequired,
    onZoomIn: PropTypes.func.isRequired,
    onZoomOut: PropTypes.func.isRequired,
    onZoomReset: PropTypes.func.isRequired,
    phone: PropTypes.bool,
    rotationCenterX: PropTypes.number,
    rotationCenterY: PropTypes.number,
    rtl: PropTypes.bool,
    setCanvas: PropTypes.func.isRequired,
    showNoiseNotice: PropTypes.bool,
    setTextArea: PropTypes.func.isRequired,
    showRoundedRectMode: PropTypes.bool,
    textArea: PropTypes.instanceOf(Element),
    theme: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    zoomLevelId: PropTypes.string
};

PaintEditorComponent.propTypes = editorPropTypes;
PaintEditorLayout.propTypes = editorPropTypes;
DesktopTop.propTypes = editorPropTypes;
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
