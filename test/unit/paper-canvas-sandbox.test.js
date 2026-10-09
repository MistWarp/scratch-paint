/* eslint-env jest, browser */
import paper from '@turbowarp/paper';
import PaperCanvas from '../../src/containers/paper-canvas.jsx';
import {setupLayers} from '../../src/helper/layer';
import Formats from '../../src/lib/format';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
    '<rect width="10" height="10" fill="#ff0000"/></svg>';

describe('PaperCanvas SVG import without a sandbox document', () => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentDocument');

    beforeEach(() => {
        paper.setup(document.createElement('canvas'));
        setupLayers(Formats.VECTOR);
        Object.defineProperty(HTMLIFrameElement.prototype, 'contentDocument', {
            configurable: true,
            get: () => null
        });
    });
    afterEach(() => {
        Object.defineProperty(HTMLIFrameElement.prototype, 'contentDocument', descriptor);
        paper.project.remove();
    });

    test('a costume opened while paper cannot create its sandbox does not crash the paint editor', () => {
        const canvas = new PaperCanvas.WrappedComponent({
            changeFormat: jest.fn(),
            undoSnapshot: jest.fn()
        });
        canvas.recalibrateSize = jest.fn();

        expect(() => canvas.importSvg(svg)).not.toThrow();
        expect(() => canvas.importSvg(svg)).not.toThrow();

        expect(paper.settings.insertItems).toBe(true);
        expect(paper.settings.applyMatrix).toBe(true);
        expect(canvas.recalibrateSize).not.toHaveBeenCalled();
        expect(canvas.props.changeFormat).toHaveBeenLastCalledWith(Formats.VECTOR_SKIP_CONVERT);
        expect(canvas.props.undoSnapshot).toHaveBeenCalledTimes(2);
    });
});
