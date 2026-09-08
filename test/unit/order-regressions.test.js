import {bringForward, sendBackward, shouldShowBringForward, shouldShowSendBackward} from '../../src/helper/order';
import {getSelectedRootItems} from '../../src/helper/selection';
jest.mock('../../src/helper/selection', () => ({getSelectedRootItems: jest.fn()}));

test('layer navigation skips helper art and preserves the artwork target', () => {
    const front = {};
    const back = {};
    const item = {nextSibling: {guide: true, nextSibling: front},
        previousSibling: {data: {isHelperItem: true}, previousSibling: back},
        insertAbove: jest.fn(), insertBelow: jest.fn()};
    getSelectedRootItems.mockReturnValue([item]);
    const update = jest.fn();
    bringForward(update);
    sendBackward(update);
    expect(item.insertAbove).toHaveBeenCalledWith(front);
    expect(item.insertBelow).toHaveBeenCalledWith(back);
    item.nextSibling.nextSibling = null;
    item.previousSibling.previousSibling = null;
    expect(shouldShowBringForward()).toBe(false);
    expect(shouldShowSendBackward()).toBe(false);
});
