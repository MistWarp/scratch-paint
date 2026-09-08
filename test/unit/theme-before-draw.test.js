import paper from '@turbowarp/paper';
import {setupLayers, updateTheme, getBackgroundGuideLayer} from '../../src/helper/layer';
import Formats from '../../src/lib/format';

test('theme can change repeatedly before the first canvas draw', () => {
    paper.setup(document.createElement('canvas'));
    try {
        setupLayers(Formats.VECTOR);
        // Do not read fillColor first: Paper converts strings lazily on reads.
        updateTheme('dark');
        updateTheme('light');
        updateTheme('dark');
        expect(getBackgroundGuideLayer().bitmapBackground.children[0].fillColor)
            .toBeInstanceOf(paper.Color);
    } finally {
        paper.project.remove();
    }
});
