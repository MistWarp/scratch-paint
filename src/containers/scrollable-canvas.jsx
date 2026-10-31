import paper from '@turbowarp/paper';
import PropTypes from 'prop-types';

import React from 'react';
import {connect} from 'react-redux';
import ScrollableCanvasComponent from '../components/scrollable-canvas/scrollable-canvas.jsx';

import {
    clampViewBounds, pan, getWorkspaceBounds, isViewRotated, OUTERMOST_ZOOM_LEVEL, resizeCrosshair, setWorkspaceBounds,
    zoomOnFixedPoint
} from '../helper/view';
import {updateViewBounds} from '../reducers/view-bounds';
import {redrawSelectionBox} from '../reducers/selected-items';
import {restoreUndoState} from '../reducers/undo';

import {getEventXY} from '../lib/touch-utils';
import Modes from '../lib/modes';
import bindAll from 'lodash.bindall';

const MAX_GESTURE_ZOOM = 16;
const ROTATION_SNAP = 4;
const TAP_TIME = 260;
const TAP_SLOP = 12;
const COMMIT_ON_PRESS_MODES = [Modes.BIT_FILL];

class ScrollableCanvas extends React.Component {
    static get ZOOM_INCREMENT () {
        return 0.5;
    }
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleMouseDown',
            'handleDragMove',
            'handleDragEnd',
            'handleHorizontalScrollbarMouseDown',
            'handleHorizontalScrollbarMouseMove',
            'handleHorizontalScrollbarMouseUp',
            'handleVerticalScrollbarMouseDown',
            'handleVerticalScrollbarMouseMove',
            'handleVerticalScrollbarMouseUp',
            'handleWheel',
            'handleTouchStart',
            'handleGestureMove',
            'handleGestureEnd',
            'handleStrokeStarted',
            'handleStrokeEnded',
            'handleTrackpadStart',
            'handleTrackpadChange',
            'handleTrackpadEnd'
        ]);
        this.gesture = null;
        this.stroke = null;
        this.strokePending = false;
        this.canvasTouches = new Set();
    }
    componentDidMount () {
        if (this.props.canvas) this.addCanvasListeners(this.props.canvas);
    }
    componentWillReceiveProps (nextProps) {
        if (nextProps.canvas !== this.props.canvas) {
            if (this.props.canvas) this.removeCanvasListeners(this.props.canvas);
            if (nextProps.canvas) this.addCanvasListeners(nextProps.canvas);
        }
    }
    componentWillUnmount () {
        if (this.props.canvas) this.removeCanvasListeners(this.props.canvas);
        this.stopGesture();
        const event = {preventDefault: () => {}};
        this.handleDragEnd(event);
        this.handleHorizontalScrollbarMouseUp(event);
        this.handleVerticalScrollbarMouseUp(event);
    }
    addCanvasListeners (canvas) {
        canvas.addEventListener('wheel', this.handleWheel);
        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('touchstart', this.handleTouchStart, {capture: true, passive: false});
        canvas.addEventListener('touchstart', this.handleStrokeStarted);
        canvas.addEventListener('touchend', this.handleStrokeEnded);
        canvas.addEventListener('touchcancel', this.handleStrokeEnded);
        canvas.addEventListener('gesturestart', this.handleTrackpadStart);
        canvas.addEventListener('gesturechange', this.handleTrackpadChange);
        canvas.addEventListener('gestureend', this.handleTrackpadEnd);
    }
    removeCanvasListeners (canvas) {
        canvas.removeEventListener('wheel', this.handleWheel);
        canvas.removeEventListener('mousedown', this.handleMouseDown);
        canvas.removeEventListener('touchstart', this.handleTouchStart, {capture: true});
        canvas.removeEventListener('touchstart', this.handleStrokeStarted);
        canvas.removeEventListener('touchend', this.handleStrokeEnded);
        canvas.removeEventListener('touchcancel', this.handleStrokeEnded);
        canvas.removeEventListener('gesturestart', this.handleTrackpadStart);
        canvas.removeEventListener('gesturechange', this.handleTrackpadChange);
        canvas.removeEventListener('gestureend', this.handleTrackpadEnd);
    }
    undoTop () {
        const undoState = this.props.undoState;
        return undoState ? undoState.stack[undoState.pointer] : null;
    }
    ownTouches (touches) {
        return Array.prototype.filter.call(touches, touch => this.canvasTouches.has(touch.identifier));
    }
    ownsAny (touches) {
        return Array.prototype.some.call(touches, touch => this.canvasTouches.has(touch.identifier));
    }
    handleTouchStart (event) {
        Array.prototype.forEach.call(event.changedTouches, touch => this.canvasTouches.add(touch.identifier));
        const own = this.ownTouches(event.touches);
        if (!this.gesture && own.length < 2) {
            this.strokePending = !this.stroke;
            if (this.strokePending) this.undoBeforeStroke = this.props.undoState;
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!this.gesture) {
            this.strokePending = false;
            if (this.stroke) this.cancelStroke(own[0]);
            window.addEventListener('touchmove', this.handleGestureMove, {capture: true, passive: false});
            window.addEventListener('touchend', this.handleGestureEnd, {capture: true});
            window.addEventListener('touchcancel', this.handleGestureEnd, {capture: true});
        }
        this.anchorGesture(own);
    }
    handleStrokeStarted () {
        if (!this.strokePending) return;
        this.strokePending = false;
        const saved = COMMIT_ON_PRESS_MODES.indexOf(this.props.mode) === -1 ?
            this.props.undoState : this.undoBeforeStroke;
        this.stroke = {
            saved,
            top: saved ? saved.stack[saved.pointer] : null
        };
    }
    handleStrokeEnded (event) {
        Array.prototype.forEach.call(event.changedTouches, touch => this.canvasTouches.delete(touch.identifier));
        if (!this.ownTouches(event.touches).length) {
            this.stroke = null;
            this.strokePending = false;
        }
    }
    cancelStroke (touch) {
        const stroke = this.stroke;
        this.stroke = null;
        const ended = new Event('touchcancel', {bubbles: true});
        Object.defineProperties(ended, {
            touches: {value: []},
            targetTouches: {value: []},
            changedTouches: {value: [touch]}
        });
        document.dispatchEvent(ended);
        setTimeout(() => {
            if (this.undoTop() !== stroke.top && this.props.onUndo) {
                this.props.onUndo();
                if (stroke.saved) this.props.restoreUndoState(stroke.saved);
            }
        });
    }
    gestureCenter (touches) {
        const rect = this.props.canvas.getBoundingClientRect();
        let x = 0;
        let y = 0;
        for (let i = 0; i < touches.length; i++) {
            x += touches[i].clientX;
            y += touches[i].clientY;
        }
        return new paper.Point((x / touches.length) - rect.left, (y / touches.length) - rect.top);
    }
    placeView (center, anchor, zoom, rotation) {
        const matrix = new paper.Matrix();
        matrix.translate(center);
        matrix.rotate(rotation);
        matrix.scale(Math.max(OUTERMOST_ZOOM_LEVEL, Math.min(MAX_GESTURE_ZOOM, zoom)));
        matrix.translate(anchor.negate());
        paper.view.matrix = matrix;
        setWorkspaceBounds(true);
        clampViewBounds();
        resizeCrosshair();
    }
    snapRotation (rotation) {
        const normalized = ((rotation + 540) % 360) - 180;
        return Math.abs(normalized) < ROTATION_SNAP ? 0 : normalized;
    }
    viewChanged () {
        this.props.updateViewBounds(paper.view.matrix);
        this.props.redrawSelectionBox();
    }
    canvasPoint (clientX, clientY) {
        const rect = this.props.canvas.getBoundingClientRect();
        return new paper.Point(clientX - rect.left, clientY - rect.top);
    }
    handleTrackpadStart (event) {
        event.preventDefault();
        if (this.gesture) return;
        const center = this.canvasPoint(event.clientX, event.clientY);
        this.trackpad = {
            anchor: paper.view.viewToProject(center),
            rotation: paper.view.rotation || 0,
            zoom: paper.view.zoom
        };
    }
    handleTrackpadChange (event) {
        event.preventDefault();
        if (this.gesture || !this.trackpad) return;
        const center = this.canvasPoint(event.clientX, event.clientY);
        this.placeView(center, this.trackpad.anchor, this.trackpad.zoom * event.scale,
            this.snapRotation(this.trackpad.rotation + event.rotation));
        this.viewChanged();
    }
    handleTrackpadEnd (event) {
        event.preventDefault();
        this.trackpad = null;
    }
    rotateAround (degrees, center) {
        const now = Date.now();
        if (!this.wheelRotation || now - this.wheelRotation.at > 400) {
            this.wheelRotation = {target: paper.view.rotation || 0};
        }
        this.wheelRotation.at = now;
        this.wheelRotation.target += degrees;
        const anchor = paper.view.viewToProject(center);
        this.placeView(center, anchor, paper.view.zoom, this.snapRotation(this.wheelRotation.target));
        this.viewChanged();
    }
    gestureSpread (touches) {
        if (touches.length < 2) return 0;
        return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    }
    gestureAngle (touches) {
        if (touches.length < 2) return null;
        return Math.atan2(touches[1].clientY - touches[0].clientY, touches[1].clientX - touches[0].clientX) *
            180 / Math.PI;
    }
    anchorGesture (touches) {
        const center = this.gestureCenter(touches);
        const previous = this.gesture;
        this.gesture = {
            anchor: paper.view.viewToProject(center),
            angle: this.gestureAngle(touches),
            center,
            maxTouches: Math.max(touches.length, previous ? previous.maxTouches : 0),
            moved: previous ? previous.moved : false,
            rotation: paper.view.rotation || 0,
            spread: this.gestureSpread(touches),
            startedAt: previous ? previous.startedAt : Date.now(),
            zoom: paper.view.zoom
        };
    }
    handleGestureMove (event) {
        if (!this.gesture || !this.ownsAny(event.changedTouches)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const touches = this.ownTouches(event.touches);
        if (!touches.length) return;
        const gesture = this.gesture;
        const center = this.gestureCenter(touches);
        const spread = this.gestureSpread(touches);
        const angle = this.gestureAngle(touches);
        if (!gesture.moved && (center.getDistance(gesture.center) > TAP_SLOP ||
                (spread && gesture.spread && Math.abs(spread - gesture.spread) > TAP_SLOP) ||
                (angle !== null && gesture.angle !== null && Math.abs(angle - gesture.angle) > ROTATION_SNAP))) {
            gesture.moved = true;
        }
        let zoom = gesture.zoom;
        if (spread && gesture.spread) {
            zoom = gesture.zoom * (spread / gesture.spread);
        }
        let rotation = gesture.rotation;
        if (angle !== null && gesture.angle !== null) {
            rotation = this.snapRotation(gesture.rotation + angle - gesture.angle);
        }
        this.placeView(center, gesture.anchor, zoom, rotation);
        if (!this.gestureFrame) {
            this.gestureFrame = requestAnimationFrame(() => {
                this.gestureFrame = null;
                this.viewChanged();
            });
        }
    }
    handleGestureEnd (event) {
        if (!this.gesture || !this.ownsAny(event.changedTouches)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        Array.prototype.forEach.call(event.changedTouches, touch => this.canvasTouches.delete(touch.identifier));
        const remaining = this.ownTouches(event.touches);
        if (remaining.length) {
            this.anchorGesture(remaining);
            return;
        }
        const gesture = this.gesture;
        const tapped = !gesture.moved && Date.now() - gesture.startedAt < TAP_TIME;
        this.stopGesture();
        this.viewChanged();
        if (tapped) {
            const action = {2: this.props.onUndo, 3: this.props.onRedo}[gesture.maxTouches];
            if (action) setTimeout(action);
        }
    }
    stopGesture () {
        this.gesture = null;
        this.stroke = null;
        this.strokePending = false;
        this.canvasTouches.clear();
        if (this.gestureFrame) {
            cancelAnimationFrame(this.gestureFrame);
            this.gestureFrame = null;
        }
        window.removeEventListener('touchmove', this.handleGestureMove, {capture: true});
        window.removeEventListener('touchend', this.handleGestureEnd, {capture: true});
        window.removeEventListener('touchcancel', this.handleGestureEnd, {capture: true});
    }
    handleMouseDown (event) {
        if (event.button === 1) {
            event.preventDefault();
            const {x, y} = getEventXY(event);
            this.initialMouseX = x;
            this.initialMouseY = y;
            this.initialScreenX = paper.view.matrix.tx;
            this.initialScreenY = paper.view.matrix.ty;
            this.initialCursor = this.props.canvas.style.cursor;
            this.props.canvas.style.cursor = 'move';
            window.addEventListener('mousemove', this.handleDragMove);
            window.addEventListener('mouseup', this.handleDragEnd);
        }
    }
    handleDragMove (event) {
        event.preventDefault();
        const {x, y} = getEventXY(event);
        paper.view.matrix.ty = this.initialScreenY - (this.initialMouseY - y);
        paper.view.matrix.tx = this.initialScreenX - (this.initialMouseX - x);
        clampViewBounds();
        this.props.updateViewBounds(paper.view.matrix);
        if (this.props.canvas) {
            this.props.canvas.style.cursor = 'move';
        }
    }
    handleDragEnd (event) {
        event.preventDefault();
        window.removeEventListener('mousemove', this.handleDragMove);
        window.removeEventListener('mouseup', this.handleDragEnd);
        if (this.props.canvas) {
            this.props.canvas.style.cursor = this.initialCursor;
        }
    }
    handleHorizontalScrollbarMouseDown (event) {
        this.initialMouseX = getEventXY(event).x;
        this.initialScreenX = paper.view.matrix.tx;
        window.addEventListener('mousemove', this.handleHorizontalScrollbarMouseMove);
        window.addEventListener('touchmove', this.handleHorizontalScrollbarMouseMove, {passive: false});
        window.addEventListener('mouseup', this.handleHorizontalScrollbarMouseUp);
        window.addEventListener('touchend', this.handleHorizontalScrollbarMouseUp);
        event.preventDefault();
    }
    handleHorizontalScrollbarMouseMove (event) {
        const dx = this.initialMouseX - getEventXY(event).x;
        paper.view.matrix.tx = this.initialScreenX + (dx * paper.view.zoom * 2);
        clampViewBounds();
        this.props.updateViewBounds(paper.view.matrix);
        event.preventDefault();
    }
    handleHorizontalScrollbarMouseUp (event) {
        window.removeEventListener('mousemove', this.handleHorizontalScrollbarMouseMove);
        window.removeEventListener('touchmove', this.handleHorizontalScrollbarMouseMove, {passive: false});
        window.removeEventListener('mouseup', this.handleHorizontalScrollbarMouseUp);
        window.removeEventListener('touchend', this.handleHorizontalScrollbarMouseUp);
        this.initialMouseX = null;
        this.initialScreenX = null;
        event.preventDefault();
    }
    handleVerticalScrollbarMouseDown (event) {
        this.initialMouseY = getEventXY(event).y;
        this.initialScreenY = paper.view.matrix.ty;
        window.addEventListener('mousemove', this.handleVerticalScrollbarMouseMove);
        window.addEventListener('touchmove', this.handleVerticalScrollbarMouseMove, {passive: false});
        window.addEventListener('mouseup', this.handleVerticalScrollbarMouseUp);
        window.addEventListener('touchend', this.handleVerticalScrollbarMouseUp);
        event.preventDefault();
    }
    handleVerticalScrollbarMouseMove (event) {
        const dy = this.initialMouseY - getEventXY(event).y;
        paper.view.matrix.ty = this.initialScreenY + (dy * paper.view.zoom * 2);
        clampViewBounds();
        this.props.updateViewBounds(paper.view.matrix);
        event.preventDefault();
    }
    handleVerticalScrollbarMouseUp (event) {
        window.removeEventListener('mousemove', this.handleVerticalScrollbarMouseMove);
        window.removeEventListener('touchmove', this.handleVerticalScrollbarMouseMove, {passive: false});
        window.removeEventListener('mouseup', this.handleVerticalScrollbarMouseUp);
        window.removeEventListener('touchend', this.handleVerticalScrollbarMouseUp);
        this.initialMouseY = null;
        this.initialScreenY = null;
        event.preventDefault();
    }
    screenToProjectDelta (dx, dy) {
        return paper.view.viewToProject(new paper.Point(dx, dy))
            .subtract(paper.view.viewToProject(new paper.Point(0, 0)));
    }
    handleWheel (event) {
        // Multiplier variable, so that non-pixel-deltaModes are supported. Needed for Firefox.
        // See #529 (or LLK/scratch-blocks#1190).
        const multiplier = event.deltaMode === 0x1 ? 15 : 1;
        const deltaX = event.deltaX * multiplier;
        const deltaY = event.deltaY * multiplier;
        const canvasRect = this.props.canvas.getBoundingClientRect();
        const offsetX = event.clientX - canvasRect.left;
        const offsetY = event.clientY - canvasRect.top;
        const fixedPoint = paper.view.viewToProject(
            new paper.Point(offsetX, offsetY)
        );
        if (event.metaKey || event.ctrlKey) {
            // Zoom keeping mouse location fixed
            zoomOnFixedPoint(-deltaY / 500, fixedPoint);
            this.props.updateViewBounds(paper.view.matrix);
            this.props.redrawSelectionBox(); // Selection handles need to be resized after zoom
        } else if (event.altKey) {
            this.rotateAround((deltaY || deltaX) / 4, new paper.Point(offsetX, offsetY));
        } else if (event.shiftKey && event.deltaX === 0) {
            // Scroll horizontally (based on vertical scroll delta)
            // This is needed as for some browser/system combinations which do not set deltaX.
            // See #156.
            const delta = this.screenToProjectDelta(deltaY, 0);
            pan(delta.x, delta.y);
            this.props.updateViewBounds(paper.view.matrix);
        } else {
            const delta = this.screenToProjectDelta(deltaX, deltaY);
            pan(delta.x, delta.y);
            this.props.updateViewBounds(paper.view.matrix);
            if (paper.tool) {
                paper.tool.view._handleMouseEvent('mousemove', event, fixedPoint);
            }
        }
        event.preventDefault();
    }
    render () {
        let widthPercent = 0;
        let heightPercent = 0;
        let topPercent = 0;
        let leftPercent = 0;
        if (paper.project) {
            const bounds = getWorkspaceBounds();
            const {x, y, width, height} = paper.view.bounds;
            widthPercent = Math.min(100, 100 * width / bounds.width);
            heightPercent = Math.min(100, 100 * height / bounds.height);
            const centerX = (x + (width / 2) - bounds.x) / bounds.width;
            const centerY = (y + (height / 2) - bounds.y) / bounds.height;
            topPercent = Math.max(0, (100 * centerY) - (heightPercent / 2));
            leftPercent = Math.max(0, (100 * centerX) - (widthPercent / 2));
        }
        return (
            <ScrollableCanvasComponent
                hideScrollbars={this.props.hideScrollbars || (paper.project ? isViewRotated() : false)}
                horizontalScrollLengthPercent={widthPercent}
                horizontalScrollStartPercent={leftPercent}
                style={this.props.style}
                verticalScrollLengthPercent={heightPercent}
                verticalScrollStartPercent={topPercent}
                onHorizontalScrollbarMouseDown={this.handleHorizontalScrollbarMouseDown}
                onVerticalScrollbarMouseDown={this.handleVerticalScrollbarMouseDown}
            >
                {this.props.children}
            </ScrollableCanvasComponent>
        );
    }
}

ScrollableCanvas.propTypes = {
    canvas: PropTypes.instanceOf(Element),
    children: PropTypes.node.isRequired,
    hideScrollbars: PropTypes.bool,
    mode: PropTypes.string,
    onRedo: PropTypes.func,
    onUndo: PropTypes.func,
    redrawSelectionBox: PropTypes.func.isRequired,
    restoreUndoState: PropTypes.func.isRequired,
    style: PropTypes.string,
    undoState: PropTypes.shape({
        pointer: PropTypes.number,
        stack: PropTypes.arrayOf(PropTypes.object)
    }),
    updateViewBounds: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    mode: state.scratchPaint.mode,
    undoState: state.scratchPaint.undo,
    viewBounds: state.scratchPaint.viewBounds
});
const mapDispatchToProps = dispatch => ({
    redrawSelectionBox: () => {
        dispatch(redrawSelectionBox());
    },
    restoreUndoState: state => {
        dispatch(restoreUndoState(state));
    },
    updateViewBounds: matrix => {
        dispatch(updateViewBounds(matrix));
    }
});


export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ScrollableCanvas);
