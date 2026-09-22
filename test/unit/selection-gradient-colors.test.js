/* eslint-env jest */
import paper from '@turbowarp/paper';
import fillColorReducer from '../../src/reducers/fill-style';
import strokeColorReducer from '../../src/reducers/stroke-style';
import {setSelectedItems} from '../../src/reducers/selected-items';
import {getColorsFromSelection} from '../../src/helper/style-path';
import GradientTypes from '../../src/lib/gradient-types';

let initialState;

const gradient = (origin, destination) => new paper.Color({
    gradient: {stops: ['#ff0000', '#0000ff'], radial: false},
    origin,
    destination
});

const item = ({fillColor = null, strokeColor = null, strokeWidth = 0}) => ({
    fillColor: fillColor && new paper.Color(fillColor),
    strokeColor: strokeColor && new paper.Color(strokeColor),
    strokeWidth,
    parent: {className: 'Layer'},
    data: {}
});

test('bitmap item with a gradient fill and a solid outline does not throw', () => {
    const selected = [item({
        fillColor: gradient([0, 0], [10, 0]),
        strokeColor: '#00ff00',
        strokeWidth: 4
    })];

    expect(() => getColorsFromSelection(selected, true)).not.toThrow();
    expect(() => fillColorReducer(initialState, setSelectedItems(selected, true))).not.toThrow();
    expect(fillColorReducer(initialState, setSelectedItems(selected, true))).toMatchObject({
        primary: 'rgb(0,255,0)',
        gradientType: GradientTypes.SOLID
    });
});

test('bitmap outline gradients still report their direction', () => {
    const selected = [item({
        fillColor: '#00ff00',
        strokeColor: gradient([0, 0], [0, 10]),
        strokeWidth: 4
    })];

    expect(getColorsFromSelection(selected, true).fillGradientType).toBe(GradientTypes.VERTICAL);
});

test('vector gradients keep horizontal and vertical detection', () => {
    const horizontal = [item({fillColor: gradient([0, 0], [10, 0])})];
    const vertical = [item({
        fillColor: gradient([0, 0], [0, 10]),
        strokeColor: gradient([0, 10], [0, 0]),
        strokeWidth: 2
    })];

    expect(fillColorReducer(initialState, setSelectedItems(horizontal, false)).gradientType)
        .toBe(GradientTypes.HORIZONTAL);
    expect(fillColorReducer(initialState, setSelectedItems(vertical, false)).gradientType)
        .toBe(GradientTypes.VERTICAL);
    expect(strokeColorReducer(initialState, setSelectedItems(vertical, false)).gradientType)
        .toBe(GradientTypes.VERTICAL);
});

test('a group listed before a gradient item does not throw', () => {
    const group = {...item({fillColor: '#00ff00'}), className: 'Group'};
    const selected = [group, item({fillColor: gradient([0, 0], [0, 10])})];

    expect(() => getColorsFromSelection(selected, false)).not.toThrow();
    expect(getColorsFromSelection(selected, false).fillGradientType).toBe(GradientTypes.VERTICAL);
});
