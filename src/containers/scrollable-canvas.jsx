import paper from '@turbowarp/paper';
import PropTypes from 'prop-types';

import React from 'react';
import {connect} from 'react-redux';
import ScrollableCanvasComponent from '../components/scrollable-canvas/scrollable-canvas.jsx';

import {clampViewBounds, pan, zoomOnFixedPoint, getWorkspaceBounds} from '../helper/view';
import {updateViewBounds} from '../reducers/view-bounds';
import {redrawSelectionBox} from '../reducers/selected-items';

import {getEventXY} from '../lib/touch-utils';
import bindAll from 'lodash.bindall';

const MAX_GESTURE_ZOOM = 16;

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
            'handleGestureEnd'
        ]);
        this.gesture = null;
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
    }
    removeCanvasListeners (canvas) {
        canvas.removeEventListener('wheel', this.handleWheel);
        canvas.removeEventListener('mousedown', this.handleMouseDown);
        canvas.removeEventListener('touchstart', this.handleTouchStart, {capture: true});
    }
    handleTouchStart (event) {
        if (!this.gesture && event.touches.length < 2) {
            this.undoPointerAtTouch = this.props.undoPointer;
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!this.gesture) {
            this.cancelStroke(event);
            window.addEventListener('touchmove', this.handleGestureMove, {capture: true, passive: false});
            window.addEventListener('touchend', this.handleGestureEnd, {capture: true});
            window.addEventListener('touchcancel', this.handleGestureEnd, {capture: true});
        }
        this.anchorGesture(event.touches);
    }
    cancelStroke (event) {
        const ended = new Event('touchcancel', {bubbles: true});
        Object.defineProperties(ended, {
            touches: {value: []},
            targetTouches: {value: []},
            changedTouches: {value: [event.touches[0]]}
        });
        document.dispatchEvent(ended);
        const pointer = this.undoPointerAtTouch;
        setTimeout(() => {
            if (typeof pointer === 'number' && this.props.undoPointer > pointer && this.props.onUndo) {
                this.props.onUndo();
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
    gestureSpread (touches) {
        if (touches.length < 2) return 0;
        return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    }
    anchorGesture (touches) {
        this.gesture = {
            anchor: paper.view.viewToProject(this.gestureCenter(touches)),
            spread: this.gestureSpread(touches),
            zoom: paper.view.zoom
        };
    }
    handleGestureMove (event) {
        if (!this.gesture) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const touches = event.touches;
        if (!touches.length) return;
        const center = this.gestureCenter(touches);
        const spread = this.gestureSpread(touches);
        if (spread && this.gesture.spread) {
            const zoom = Math.min(MAX_GESTURE_ZOOM, this.gesture.zoom * (spread / this.gesture.spread));
            zoomOnFixedPoint(zoom - paper.view.zoom, paper.view.viewToProject(center));
        }
        const current = paper.view.viewToProject(center);
        pan(this.gesture.anchor.x - current.x, this.gesture.anchor.y - current.y);
        if (!this.gestureFrame) {
            this.gestureFrame = requestAnimationFrame(() => {
                this.gestureFrame = null;
                this.props.updateViewBounds(paper.view.matrix);
                this.props.redrawSelectionBox();
            });
        }
    }
    handleGestureEnd (event) {
        if (!this.gesture) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.touches.length) {
            this.anchorGesture(event.touches);
            return;
        }
        this.stopGesture();
        this.props.updateViewBounds(paper.view.matrix);
        this.props.redrawSelectionBox();
    }
    stopGesture () {
        this.gesture = null;
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
        } else if (event.shiftKey && event.deltaX === 0) {
            // Scroll horizontally (based on vertical scroll delta)
            // This is needed as for some browser/system combinations which do not set deltaX.
            // See #156.
            const dx = deltaY / paper.view.zoom;
            pan(dx, 0);
            this.props.updateViewBounds(paper.view.matrix);
        } else {
            const dx = deltaX / paper.view.zoom;
            const dy = deltaY / paper.view.zoom;
            pan(dx, dy);
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
                hideScrollbars={this.props.hideScrollbars}
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
    onUndo: PropTypes.func,
    redrawSelectionBox: PropTypes.func.isRequired,
    style: PropTypes.string,
    undoPointer: PropTypes.number,
    updateViewBounds: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    undoPointer: state.scratchPaint.undo.pointer,
    viewBounds: state.scratchPaint.viewBounds
});
const mapDispatchToProps = dispatch => ({
    redrawSelectionBox: () => {
        dispatch(redrawSelectionBox());
    },
    updateViewBounds: matrix => {
        dispatch(updateViewBounds(matrix));
    }
});


export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ScrollableCanvas);
