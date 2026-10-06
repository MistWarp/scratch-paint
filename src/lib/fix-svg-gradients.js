const XLINK_NS = 'http://www.w3.org/1999/xlink';

const getHref = element => element.getAttributeNS(XLINK_NS, 'href') || element.getAttribute('href');

const getOwnStops = gradient => Array.prototype.filter.call(gradient.childNodes, node => node.localName === 'stop');

const fixSvgGradients = function (svgDom) {
    if (svgDom.getElementsByTagName('parsererror').length) return false;
    const gradients = Array.from(svgDom.querySelectorAll('linearGradient, radialGradient'));
    const byId = new Map();
    for (const gradient of gradients) {
        if (gradient.id && !byId.has(gradient.id)) byId.set(gradient.id, gradient);
    }
    const resolveStops = gradient => {
        const visited = new Set();
        let current = gradient;
        while (current && !visited.has(current)) {
            const stops = getOwnStops(current);
            if (stops.length) return stops;
            visited.add(current);
            current = byId.get((getHref(current) || '').slice(1));
        }
        return [];
    };
    const resolved = gradients.map(gradient => [gradient, resolveStops(gradient)]);

    let changed = false;
    for (const [gradient, stops] of resolved) {
        if (gradient.hasAttributeNS(XLINK_NS, 'href') || gradient.hasAttribute('href')) {
            gradient.removeAttributeNS(XLINK_NS, 'href');
            gradient.removeAttribute('href');
            changed = true;
        }
        if (!getOwnStops(gradient).length) {
            for (const stop of stops) gradient.appendChild(stop.cloneNode(true));
            changed = true;
        }
        const ownStops = getOwnStops(gradient);
        if (ownStops.length === 0) {
            gradient.parentNode.removeChild(gradient);
            changed = true;
        } else if (ownStops.length === 1) {
            const end = ownStops[0].cloneNode(true);
            end.setAttribute('offset', '1');
            gradient.appendChild(end);
            changed = true;
        }
    }
    return changed;
};

export default fixSvgGradients;
