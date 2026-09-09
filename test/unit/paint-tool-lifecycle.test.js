import paper from '@turbowarp/paper';
import FillTool from '../../src/helper/tools/fill-tool';
import PenTool from '../../src/helper/tools/pen-tool';
import OvalTool from '../../src/helper/tools/oval-tool';
import GradientTypes from '../../src/lib/gradient-types';

describe('paint tool lifecycle', () => {
    beforeEach(() => paper.setup(document.createElement('canvas')));
    afterEach(() => paper.project.remove());

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
});
