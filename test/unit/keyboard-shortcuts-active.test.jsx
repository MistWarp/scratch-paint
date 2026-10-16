/* eslint-env jest */
import React from 'react'; // eslint-disable-line no-unused-vars
import {mount} from 'enzyme';
import {Provider} from 'react-redux'; // eslint-disable-line no-unused-vars
import {combineReducers, createStore} from 'redux';

import KeyboardShortcutsHOC from '../../src/hocs/keyboard-shortcuts-hoc.jsx';
import ScratchPaintReducer from '../../src/reducers/scratch-paint-reducer';
import Modes from '../../src/lib/modes';
import Formats from '../../src/lib/format';
import {changeFormat} from '../../src/reducers/format';

const Stub = () => null;
const Wrapped = KeyboardShortcutsHOC(Stub); // eslint-disable-line no-unused-vars

const renderWith = extraProps => {
    const store = createStore(combineReducers({scratchPaint: ScratchPaintReducer}));
    store.dispatch(changeFormat(Formats.VECTOR));
    const wrapper = mount(
        <Provider store={store}>
            <Wrapped
                {...extraProps}
                onRedo={jest.fn()}
                onUndo={jest.fn()}
                onUpdateImage={jest.fn()}
            />
        </Provider>
    );
    const onKeyPress = wrapper.find(Stub).prop('onKeyPress');
    return {store, onKeyPress, wrapper};
};

const keyEvent = key => ({
    key,
    target: {},
    preventDefault: jest.fn()
});

describe('KeyboardShortcutsHOC isActive', () => {
    test('handles keys when the editor is active', () => {
        const {store, onKeyPress} = renderWith({isActive: () => true});
        onKeyPress(keyEvent('r'));
        expect(store.getState().scratchPaint.mode).toBe(Modes.RECT);
    });

    test('ignores keys when the editor is not active', () => {
        const {store, onKeyPress} = renderWith({isActive: () => false});
        const before = store.getState().scratchPaint.mode;
        const event = keyEvent('r');
        onKeyPress(event);
        expect(store.getState().scratchPaint.mode).toBe(before);
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    test('defaults to active and keeps isActive off the wrapped component', () => {
        const {store, onKeyPress, wrapper} = renderWith({});
        onKeyPress(keyEvent('r'));
        expect(store.getState().scratchPaint.mode).toBe(Modes.RECT);
        expect(wrapper.find(Stub).prop('isActive')).toBeUndefined();
    });
});
