/* eslint-env jest, browser */
import paper from '@turbowarp/paper';
import PaperCanvas from '../../src/containers/paper-canvas.jsx';
import {setupLayers} from '../../src/helper/layer';
import {CENTER, resetZoom} from '../../src/helper/view';
import Formats from '../../src/lib/format';

const makeCanvas = () => new PaperCanvas.WrappedComponent({
    changeFormat: jest.fn(),
    undoSnapshot: jest.fn(),
    updateViewBounds: jest.fn()
});

const setViewSize = (width, height) => {
    paper.view.viewSize = new paper.Size(width, height);
};

describe('PaperCanvas sizing', () => {
    beforeEach(() => {
        paper.setup(document.createElement('canvas'));
        setupLayers(Formats.VECTOR);
    });
    afterEach(() => {
        jest.restoreAllMocks();
        paper.project.remove();
    });

    test('a zoom level saved at a smaller canvas size is centered on a bigger canvas', () => {
        setViewSize(480, 360);
        resetZoom();
        const saved = paper.view.matrix.clone();
        expect(paper.view.center.x).toBeCloseTo(CENTER.x);
        expect(paper.view.center.y).toBeCloseTo(CENTER.y);

        setViewSize(1200, 800);
        paper.view.matrix = new paper.Matrix();
        const canvas = makeCanvas();
        canvas.shouldZoomToFit = saved;
        canvas.maybeZoomToFit();

        expect(paper.view.zoom).toBeCloseTo(0.5);
        expect(paper.view.center.x).toBeCloseTo(CENTER.x);
        expect(paper.view.center.y).toBeCloseTo(CENTER.y);
        expect(canvas.shouldZoomToFit).toBe(false);
        expect(canvas.props.updateViewBounds).toHaveBeenCalled();
    });

    test('a zoom level restored at the same canvas size keeps the saved view', () => {
        setViewSize(800, 600);
        resetZoom();
        paper.view.zoom = 2;
        paper.view.center = new paper.Point(300, 250);
        const saved = paper.view.matrix.clone();

        paper.view.matrix = new paper.Matrix();
        const canvas = makeCanvas();
        canvas.shouldZoomToFit = saved;
        canvas.maybeZoomToFit();

        expect(paper.view.zoom).toBeCloseTo(2);
        expect(paper.view.center.x).toBeCloseTo(300);
        expect(paper.view.center.y).toBeCloseTo(250);
    });

    test('recalibrating a hidden canvas keeps the last visible view size', () => {
        jest.useFakeTimers();
        setViewSize(640, 480);
        jest.spyOn(paper.DomElement, 'getSize').mockReturnValue(new paper.Size(0, 0));
        const callback = jest.fn();

        makeCanvas().recalibrateSize(callback);
        jest.runAllTimers();
        jest.useRealTimers();

        expect(paper.view.viewSize.width).toBe(640);
        expect(paper.view.viewSize.height).toBe(480);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('recalibrating a resized canvas updates the view size', () => {
        jest.useFakeTimers();
        setViewSize(640, 480);
        jest.spyOn(paper.DomElement, 'getSize').mockReturnValue(new paper.Size(900.6, 700.2));

        makeCanvas().onCanvasResize();
        jest.runAllTimers();
        jest.useRealTimers();

        expect(paper.view.viewSize.width).toBe(901);
        expect(paper.view.viewSize.height).toBe(700);
    });

    test('a canvas that shrinks keeps the art centered', () => {
        jest.useFakeTimers();
        setViewSize(400, 700);
        resetZoom();
        paper.view.zoom = 1;
        paper.view.center = new paper.Point(CENTER.x, CENTER.y);
        jest.spyOn(paper.DomElement, 'getSize').mockReturnValue(new paper.Size(400, 300));

        makeCanvas().onCanvasResize();
        jest.runAllTimers();
        jest.useRealTimers();

        expect(paper.view.viewSize.height).toBe(300);
        expect(paper.view.center.x).toBeCloseTo(CENTER.x);
        expect(paper.view.center.y).toBeCloseTo(CENTER.y);
    });
});
