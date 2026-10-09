/* eslint-env jest, browser */
import paper from '@turbowarp/paper';
import FillTool from '../../src/helper/tools/fill-tool';
import PenTool from '../../src/helper/tools/pen-tool';
import OvalTool from '../../src/helper/tools/oval-tool';
import {styleCursorPreview} from '../../src/helper/style-path';
import GradientTypes from '../../src/lib/gradient-types';
import {LineMode} from '../../src/containers/line-mode.jsx';
import {setupLayers} from '../../src/helper/layer';
import Formats from '../../src/lib/format';

describe('paint tool lifecycle', () => {
    beforeEach(() => paper.setup(document.createElement('canvas')));
    afterEach(() => paper.project.remove());

    test('changes cursor colors repeatedly before Paper draws', () => {
        const path = new paper.Path.Circle(new paper.Point(20, 20), 10);
        styleCursorPreview(path, {fillColor: 'rgb(0,0,0)'});
        styleCursorPreview(path, {fillColor: '#9966ff'});
        styleCursorPreview(path, {isEraser: true});
        styleCursorPreview(path, {isEraser: true});
        styleCursorPreview(path, {fillColor: '#ffffff'});
        expect(path.fillColor.toCSS(true)).toBe('#ffffff');
    });

    test('restores fill preview before Paper has drawn the preview color', () => {
        const item = new paper.Path.Circle(new paper.Point(20, 20), 10);
        const original = new paper.Color(0, 0, 1);
        item.fillColor = original;
        const tool = new FillTool(jest.fn(), jest.fn(), jest.fn());
        tool.fillItem = item;
        tool.fillProperty = 'fill';
        tool.fillItemOrigColor = original;
        tool._setFillItemColor('rgb(244,181,255)', null, GradientTypes.SOLID);
        tool.deactivateTool();
        expect(item.fillColor.toCSS(true)).toBe('#0000ff');
    });

    test('ignores pen drag and release events without a stroke', () => {
        const tool = new PenTool(jest.fn(), jest.fn());
        const event = {event: {button: 0}};
        expect(() => tool.handleMouseDrag(event)).not.toThrow();
        expect(() => tool.handleMouseUp(event)).not.toThrow();
        expect(tool.onUpdateSvg).not.toHaveBeenCalled();
    });

    test('a short pen stroke ending on another line joins it', () => {
        setupLayers(Formats.VECTOR);
        const other = new paper.Path([new paper.Point(100, 100), new paper.Point(200, 100)]);
        const tool = new PenTool(jest.fn(), jest.fn());
        tool.setColorState({
            strokeColor: {primary: '#000000', secondary: null, gradientType: GradientTypes.SOLID},
            strokeWidth: 1
        });
        tool.setSimplifySize(0);
        const penEvent = (x, y) => ({event: {button: 0}, point: new paper.Point(x, y)});
        tool.handleMouseDown(penEvent(100, 94));
        tool.handleMouseDrag(penEvent(100, 94.3));
        tool.handleMouseDrag(penEvent(100, 94.6));
        tool.handleMouseDrag(penEvent(100, 95.1));
        expect(() => tool.handleMouseUp(penEvent(100, 95.1))).not.toThrow();
        expect(tool.onUpdateSvg).toHaveBeenCalledTimes(1);
        expect(other.isInserted()).toBe(false);
        const joined = paper.project.activeLayer.children;
        expect(joined).toHaveLength(1);
        expect(joined[0].segments.map(segment => [segment.index, segment.point.x, segment.point.y])).toEqual([
            [0, 100, 94], [1, 100, 94.3], [2, 100, 94.6], [3, 100, 100], [4, 200, 100]
        ]);
    });

    test('ends bounding-box gestures before subsequent oval drag events', () => {
        const tool = new OvalTool(jest.fn(), jest.fn(), jest.fn(), jest.fn());
        tool.active = true;
        tool.isBoundingBoxMode = true;
        tool.boundingBoxTool.onMouseUp = jest.fn();
        const event = {event: {button: 0}};
        tool.handleMouseUp(event);
        expect(tool.active).toBe(false);
        expect(() => tool.handleMouseDrag(event)).not.toThrow();
    });

    const lineEvent = (x, y) => ({
        event: {button: 0}, modifiers: {shift: false}, point: new paper.Point(x, y)
    });
    const makeLineMode = () => new LineMode({
        colorState: {strokeColor: {primary: '#000000', secondary: null, gradientType: GradientTypes.SOLID},
            strokeWidth: 1},
        onUpdateImage: jest.fn()
    });

    test('a cancelled short line ignores late events and can start a new line', () => {
        const mode = makeLineMode();
        mode.onMouseDown(lineEvent(20, 20));
        mode.onMouseUp(lineEvent(20, 20));
        expect(mode.path).toBeNull();
        expect(mode.active).toBe(false);
        expect(() => mode.onMouseDrag(lineEvent(30, 30))).not.toThrow();
        expect(() => mode.onMouseUp(lineEvent(30, 30))).not.toThrow();
        expect(mode.props.onUpdateImage).not.toHaveBeenCalled();

        mode.onMouseDown(lineEvent(20, 20));
        mode.onMouseDrag(lineEvent(60, 60));
        mode.onMouseUp(lineEvent(60, 60));
        expect(mode.props.onUpdateImage).toHaveBeenCalledTimes(1);
    });

    test('a short extension preserves the existing line and ends its gesture', () => {
        const path = new paper.Path([new paper.Point(20, 20), new paper.Point(60, 60)]);
        const mode = makeLineMode();
        mode.onMouseDown(lineEvent(60, 60));
        mode.onMouseDrag(lineEvent(61, 61));
        mode.onMouseUp(lineEvent(61, 61));
        expect(path.segments).toHaveLength(2);
        expect(mode.active).toBe(false);
        expect(() => mode.onMouseDrag(lineEvent(80, 80))).not.toThrow();
        expect(mode.props.onUpdateImage).not.toHaveBeenCalled();
    });
});
