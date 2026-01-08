// 选择的设备
const SET_SELECTED_DEVICE = 'scratch-gui/sun/SET_SELECTED_DEVICE';
//选择的模式
const SET_SELECTED_MODE = 'scratch-gui/sun/SET_MODE';
// 生成的代码
const SET_CODE = 'scratch-gui/sun/SET_CODE';

const initialState = {
    selectedDevice: null, //当前选择的设备
    selectedmode: 'interactive',//当前选择的模式
    generatedCode: ''
};

export default function reducer(state = initialState, action) {
    switch (action.type) {
        case SET_SELECTED_DEVICE:
            return {
                ...state,
                selectedDevice: action.device
            };
        case SET_SELECTED_MODE:
            return {
                ...state,
                selectedmode: action.mode
            };
        case SET_CODE:
            return {
                ...state,
                generatedCode: action.code
            };
        default:
            return state;
    }
}

export const setSelectedDevice = (device) => ({
    type: SET_SELECTED_DEVICE,
    device
});

export const setSelectedMode = (mode) => ({
    type: SET_SELECTED_MODE,
    mode
});

export const setGeneratedCode = code => ({
    type: SET_CODE,
    code
});

