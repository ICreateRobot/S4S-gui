/* 设备连接状态 */

// 初始状态
const initialState = {
    connected: false,       // 是否连接成功
    mode: null,             // 当前连接模式 serial/bluetooth/wifi
    info: null,             // 设备信息，如 { comPort: 'COM3', name: 'micro:bit' }
};

// 串口工具状态
const serialToolState = {
    connected: false,       // 是否连接成功
    info: null             // 设备信息，如 { comPort: 'COM3', name: 'micro:bit' }
};

const SET_DEVICE_CONNECTION = 'SET_DEVICE_CONNECTION';
const CLEAR_DEVICE_CONNECTION = 'CLEAR_DEVICE_CONNECTION';

const SET_SERIAL_TOOL_CONNECTION = 'SET_SERIAL_TOOL_CONNECTION';
const CLEAR_SERIAL_TOOL_CONNECTION = 'CLEAR_SERIAL_TOOL_CONNECTION';

// reducer
export default function deviceConnectionReducer(
    state = {
        device: initialState,
        serialTool: serialToolState
    },
    action
) {

    switch (action.type) {
        // 主设备连接
        case SET_DEVICE_CONNECTION:
            return {
                ...state,
                device: {
                    ...state.device,
                    connected: true,
                    ...action.payload
                }
            };
        case CLEAR_DEVICE_CONNECTION:
            return {
                ...state,
                device: {
                    ...initialState
                }
            };

        // 串口工具连接
        case SET_SERIAL_TOOL_CONNECTION:
            return {
                ...state,
                serialTool: {
                    ...state.serialTool,
                    connected: true,
                    ...action.payload
                }
            };
        case CLEAR_SERIAL_TOOL_CONNECTION:
            return {
                ...state,
                serialTool: {
                    ...serialToolState
                }
            };

        default:
            return state;
    }
}


// 设置设备连接
export const setDeviceConnection = (payload) => ({
    type: SET_DEVICE_CONNECTION,
    payload
});


// 清除设备连接
export const clearDeviceConnection = () => ({
    type: CLEAR_DEVICE_CONNECTION
});


// 设置串口工具连接
export const setSerialToolConnection = (payload) => ({
    type: SET_SERIAL_TOOL_CONNECTION,
    payload
});


// 清除串口工具连接
export const clearSerialToolConnection = () => ({
    type: CLEAR_SERIAL_TOOL_CONNECTION
});
