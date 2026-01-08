const ACTIVATE_TAB = 'scratch-gui/navigation/ACTIVATE_TAB';

const ACTIVATE_TAB_upload = 'scratch-gui/navigation/ACTIVATE_TAB_UPLOAD';
const ACTIVATE_TAB_python = 'scratch-gui/navigation/ACTIVATE_TAB_PYTHON';

// Constants use numbers to make it easier to work with react-tabs
const BLOCKS_TAB_INDEX = 0;
const COSTUMES_TAB_INDEX = 1;
const SOUNDS_TAB_INDEX = 2;

const initialState = {
    activeTabIndex: BLOCKS_TAB_INDEX,
    activeTabIndexUpload:BLOCKS_TAB_INDEX,
    activeTabIndexPython:BLOCKS_TAB_INDEX,
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case ACTIVATE_TAB:
        return Object.assign({}, state, {
            activeTabIndex: action.activeTabIndex
        });
    case ACTIVATE_TAB_upload:
        return Object.assign({}, state, {
            activeTabIndexUpload: action.activeTabIndex
        });
    case ACTIVATE_TAB_python:
        return Object.assign({}, state, {
            activeTabIndexPython: action.activeTabIndex
        });
    default:
        return state;
    }
};

const activateTab = function (tab) {
    return {
        type: ACTIVATE_TAB,
        activeTabIndex: tab
    };
};
const activateTabUpload = function (tab) {
    return {
        type: ACTIVATE_TAB_upload,
        activeTabIndex: tab
    };
};
const activateTabPython = function (tab) {
    return {
        type: ACTIVATE_TAB_python,
        activeTabIndex: tab
    };
};

export {
    reducer as default,
    initialState as editorTabInitialState,
    activateTab,
    activateTabUpload,
    activateTabPython,
    BLOCKS_TAB_INDEX,
    COSTUMES_TAB_INDEX,
    SOUNDS_TAB_INDEX
};
