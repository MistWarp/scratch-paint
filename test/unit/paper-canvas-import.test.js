/* eslint-env jest, browser */
import paper from '@turbowarp/paper';
import PaperCanvas from '../../src/containers/paper-canvas.jsx';
import {setupLayers} from '../../src/helper/layer';
import Formats from '../../src/lib/format';

const makeCanvas = () => {
    const canvas = new PaperCanvas.WrappedComponent({
        changeFormat: jest.fn(),
        undoSnapshot: jest.fn()
    });
    canvas.recalibrateSize = jest.fn();
    return canvas;
};

const brokenArc = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
    '<path d="M0 0 A1e200 1e200 0 0 1 10 10" fill="#ff0000"/></svg>';

describe('PaperCanvas SVG import', () => {
    beforeEach(() => {
        paper.setup(document.createElement('canvas'));
        setupLayers(Formats.VECTOR);
    });
    afterEach(() => paper.project.remove());

    test('an SVG that paper cannot import leaves an empty vector canvas and working paper settings', () => {
        const canvas = makeCanvas();
        const leftover = new paper.Path.Circle(new paper.Point(20, 20), 10);
        expect(leftover.isInserted()).toBe(true);

        expect(() => canvas.importSvg(brokenArc)).not.toThrow();

        expect(paper.settings.insertItems).toBe(true);
        expect(paper.settings.applyMatrix).toBe(true);
        expect(leftover.isInserted()).toBe(false);
        expect(canvas.recalibrateSize).not.toHaveBeenCalled();
        expect(canvas.props.changeFormat).toHaveBeenLastCalledWith(Formats.VECTOR_SKIP_CONVERT);
        expect(canvas.props.undoSnapshot).toHaveBeenCalledTimes(1);

        paper.setup(document.createElement('canvas'));
        expect(() => setupLayers(Formats.VECTOR)).not.toThrow();
    });

    test('an SVG whose gradient inherits from a later gradient imports', () => {
        const canvas = makeCanvas();
        canvas.importSvg('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
            'width="100" height="100"><defs><linearGradient id="b" xlink:href="#a"/><linearGradient id="a">' +
            '<stop offset="0" stop-color="#ff0000"/><stop offset="1" stop-color="#0000ff"/></linearGradient></defs>' +
            '<rect width="10" height="10" fill="url(#b)"/></svg>');
        expect(canvas.recalibrateSize).toHaveBeenCalledTimes(1);
        expect(canvas.props.undoSnapshot).not.toHaveBeenCalled();
    });
});
