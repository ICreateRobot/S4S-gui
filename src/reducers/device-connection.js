/* 设备连接状态 */

// 初始状态
const initialState = {
    connected: false,       // 是否连接成功
    mode: null,             // 当前连接模式 serial/bluetooth/wifi
    info: null              // 设备信息，如 { comPort: 'COM3', name: 'micro:bit' }
};

const SET_DEVICE_CONNECTION = 'SET_DEVICE_CONNECTION';
const CLEAR_DEVICE_CONNECTION = 'CLEAR_DEVICE_CONNECTION';

// reducer
export default function deviceConnectionReducer(state = initialState, action) {
    switch (action.type) {
        case SET_DEVICE_CONNECTION:
        return { ...state, connected: true, ...action.payload };
        case CLEAR_DEVICE_CONNECTION:
        return { ...initialState };
        default:
        return state;
    }
}

export const setDeviceConnection = (payload) => ({
    type: SET_DEVICE_CONNECTION,
    payload
});

export const clearDeviceConnection = () => ({
    type: CLEAR_DEVICE_CONNECTION
});
