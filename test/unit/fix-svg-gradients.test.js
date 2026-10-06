/* eslint-env jest, browser */
import paper from '@turbowarp/paper';
import fixSvgGradients from '../../src/lib/fix-svg-gradients';

const wrap = body => '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
    `width="100" height="100">${body}</svg>`;
const twoStops = '<stop offset="0" stop-color="#ff0000"/><stop offset="1" stop-color="#0000ff"/>';
const square = '<rect width="10" height="10" fill="url(#b)"/>';

const importFixed = svg => {
    const svgDom = new DOMParser().parseFromString(svg, 'text/xml');
    const changed = fixSvgGradients(svgDom);
    paper.setup(new paper.Size(480, 360));
    let imported = null;
    paper.project.importSVG(svgDom, {
        insert: false,
        onLoad: item => {
            imported = item;
        }
    });
    return {changed, svgDom, imported};
};

const fillOf = item => item.children[item.children.length - 1].fillColor;

test('a gradient that inherits stops from one defined later imports with those stops', () => {
    const {changed, svgDom, imported} = importFixed(wrap(
        '<defs><linearGradient id="b" xlink:href="#a"/>' +
        `<linearGradient id="a">${twoStops}</linearGradient></defs>${square}`
    ));
    expect(changed).toBe(true);
    expect(svgDom.querySelectorAll('[href]')).toHaveLength(0);
    expect(svgDom.getElementById('b').hasAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe(false);
    expect(fillOf(imported).gradient.stops.map(stop => stop.color.toCSS(true))).toEqual(['#ff0000', '#0000ff']);
});

test('a gradient chain and a plain href are both resolved', () => {
    const {imported} = importFixed(wrap(
        '<defs><radialGradient id="b" href="#c"/><linearGradient id="c" xlink:href="#a"/>' +
        `<linearGradient id="a">${twoStops}</linearGradient></defs>${square}`
    ));
    const fill = fillOf(imported);
    expect(fill.gradient.radial).toBe(true);
    expect(fill.gradient.stops).toHaveLength(2);
});

test('gradients pointing at missing ids, cycles or no stops import without throwing', () => {
    for (const defs of [
        '<linearGradient id="b" xlink:href="#missing"/>',
        '<linearGradient id="b" xlink:href="#c"/><linearGradient id="c" xlink:href="#b"/>',
        '<linearGradient id="b"/>'
    ]) {
        const {imported} = importFixed(wrap(`<defs>${defs}</defs>${square}`));
        expect(imported).not.toBeNull();
        expect(paper.settings.insertItems).toBe(true);
    }
});

test('a gradient with one stop becomes a solid color', () => {
    const {imported} = importFixed(wrap(
        `<defs><linearGradient id="b"><stop offset="0.3" stop-color="#00ff00"/></linearGradient></defs>${square}`
    ));
    const stops = fillOf(imported).gradient.stops;
    expect(stops.map(stop => stop.color.toCSS(true))).toEqual(['#00ff00', '#00ff00']);
});

test('valid gradients are left alone', () => {
    const svgDom = new DOMParser().parseFromString(
        wrap(`<defs><linearGradient id="b">${twoStops}</linearGradient></defs>${square}`), 'text/xml');
    expect(fixSvgGradients(svgDom)).toBe(false);
});
