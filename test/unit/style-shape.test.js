/* eslint-env jest */
import paper from '@turbowarp/paper';
import {styleShape} from '../../src/helper/style-path';
import GradientTypes from '../../src/lib/gradient-types';

const solid = primary => ({primary, secondary: null, gradientType: GradientTypes.SOLID});

test('styleShape stores solid colors as Color instances so paper can clear their canvas style', () => {
    paper.setup(new paper.Size(480, 360));
    const shape = new paper.Shape.Ellipse({point: [0, 0], size: [10, 10]});

    styleShape(shape, {fillColor: null, strokeColor: solid('#9966ff'), strokeWidth: 2});
    expect(shape._style._values.strokeColor).toBeInstanceOf(paper.Color);
    expect(shape._style._values.fillColor).toBeNull();

    styleShape(shape, {fillColor: solid('#ff0000'), strokeColor: solid('#000000'), strokeWidth: 2});
    expect(shape.strokeColor.toCSS(true)).toBe('#000000');
    expect(shape.fillColor.toCSS(true)).toBe('#ff0000');
    expect(shape.strokeWidth).toBe(2);
});
