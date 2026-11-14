/* eslint-env jest */
import React from 'react'; // eslint-disable-line no-unused-vars
import {mount} from 'enzyme';
import {IntlProvider} from 'react-intl'; // eslint-disable-line no-unused-vars
import {Provider} from 'react-redux'; // eslint-disable-line no-unused-vars
import configureStore from 'redux-mock-store';

import FixedTools from '../../../src/components/fixed-tools/fixed-tools.jsx'; // eslint-disable-line no-unused-vars
import Dropdown from '../../../src/components/dropdown/dropdown.jsx';
import {ToolbarButton} from '../../../src/components/toolbar/toolbar.jsx';

jest.mock('../../../src/helper/selection', () => ({getSelectedRootItems: jest.fn(() => [])}));

const handlers = () => ({
    canRedo: () => false,
    canUndo: () => false,
    onGroup: jest.fn(),
    onRedo: jest.fn(),
    onSendBackward: jest.fn(),
    onSendForward: jest.fn(),
    onSendToBack: jest.fn(),
    onSendToFront: jest.fn(),
    onUndo: jest.fn(),
    onUngroup: jest.fn(),
    onUpdateName: jest.fn()
});

const mountTools = (props, format = 'VECTOR') => mount(
    <Provider
        store={configureStore()({
            scratchPaint: {format, layout: {rtl: false}, selectedItems: [], undo: {stack: [], pointer: -1}}
        })}
    >
        <IntlProvider locale="en">
            <FixedTools
                name="costume1"
                {...handlers()}
                {...props}
            />
        </IntlProvider>
    </Provider>
);

const titles = wrapper => wrapper.find(ToolbarButton).map(button => button.prop('title'));

describe('arrange controls in the desktop header', () => {
    test('the arrange section offers every action as a button and as a menu', () => {
        const wrapper = mountTools({section: 'arrange'});
        expect(titles(wrapper)).toEqual(['Group', 'Ungroup', 'Forward', 'Backward', 'Front', 'Back']);
        expect(wrapper.find(Dropdown)).toHaveLength(1);
        expect(wrapper.find(Dropdown).text()).toContain('Arrange');
    });

    test('the narrow section is the menu on its own', () => {
        const wrapper = mountTools({section: 'arrangeNarrow'});
        expect(titles(wrapper)).toEqual([]);
        expect(wrapper.find(Dropdown)).toHaveLength(1);
    });

    test('bitmap costumes have no arrange controls', () => {
        ['arrange', 'arrangeNarrow'].forEach(section => {
            const wrapper = mountTools({section}, 'BITMAP');
            expect(wrapper.find(ToolbarButton)).toHaveLength(0);
            expect(wrapper.find(Dropdown)).toHaveLength(0);
        });
    });

    test('the document section holds the name, undo and redo only', () => {
        const wrapper = mountTools({});
        expect(titles(wrapper)).toEqual(['Undo', 'Redo']);
        expect(wrapper.find(Dropdown)).toHaveLength(0);
        expect(wrapper.find('input').prop('value')).toBe('costume1');
    });

    test('the phone header keeps one arrange menu', () => {
        const wrapper = mountTools({phone: true});
        expect(wrapper.find(Dropdown)).toHaveLength(1);
        expect(wrapper.find(ToolbarButton)).toHaveLength(0);
    });
});
