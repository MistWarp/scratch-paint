import paper from '@turbowarp/paper';

for (const name of ['FillColor', 'StrokeColor', 'ShadowColor', 'SelectedColor']) {
    const getColor = paper.Style.prototype[`get${name}`];
    const setColor = paper.Style.prototype[`set${name}`];
    paper.Style.prototype[`set${name}`] = function (value) {
        getColor.call(this, true);
        setColor.call(this, value);
    };
}
