/* eslint-env jest, browser */
import paper from '@turbowarp/paper';
import {commitOvalToBitmap, getBrushMark} from '../../src/helper/bitmap';
import {createCanvas} from '../../src/helper/layer';

test('brush marks thinner than a pixel still draw one pixel', () => {
    for (const size of [0.4, 0, -2, NaN]) {
        const mark = getBrushMark(size, '#000000');
        expect(mark.width).toBeGreaterThan(0);
        expect(mark.height).toBeGreaterThan(0);
    }
});

test('committing an oval outline thinner than a pixel does not draw a zero-size brush', () => {
    paper.setup(new paper.Size(480, 360));
    const oval = new paper.Shape.Ellipse({point: [10, 10], size: [40, 30]});
    oval.strokeColor = new paper.Color('#9966ff');
    oval.strokeWidth = 0.5;
    const raster = new paper.Raster(createCanvas());
    const createElement = document.createElement.bind(document);
    const canvases = [];
    const spy = jest.spyOn(document, 'createElement').mockImplementation(tag => {
        const element = createElement(tag);
        if (tag === 'canvas') canvases.push(element);
        return element;
    });

    expect(commitOvalToBitmap(oval, raster)).toBe(true);
    spy.mockRestore();
    expect(canvases.length).toBeGreaterThan(0);
    for (const canvas of canvases) {
        expect(canvas.width * canvas.height).toBeGreaterThan(0);
    }
});
