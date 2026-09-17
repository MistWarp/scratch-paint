/* eslint-env jest */
import {selectAllSegments} from '../../src/helper/selection';
import paper from '@turbowarp/paper';

jest.mock('@turbowarp/paper', () => ({
    Layer: class {},
    project: {layers: []}
}));

const layerWith = children => {
    paper.project.layers = [{children}];
};

test('select all reaches every segment of a path', () => {
    const segments = [{selected: false}, {selected: false}];
    layerWith([{data: {}, segments}]);

    expect(selectAllSegments()).toBe(true);
    expect(segments.every(segment => segment.selected)).toBe(true);
});

test('select all does not choke on items that have no segments (rasters, text)', () => {
    const raster = {data: {}, selected: false};

    layerWith([raster]);
    expect(() => selectAllSegments()).not.toThrow();
    expect(raster.selected).toBe(true);
});

test('select all still selects the other items alongside a segment-less one', () => {
    const segments = [{selected: false}];
    const raster = {data: {}, selected: false};
    layerWith([raster, {data: {}, segments}]);

    expect(() => selectAllSegments()).not.toThrow();
    expect(raster.selected).toBe(true);
    expect(segments[0].selected).toBe(true);
});
