import {openMasterModal,closeMasterModal, openConnectModal,closeConnectModal,openFirmwareModal,closeFirmwareModal} from '../reducers/modals';
import {activateTab,activateTabUpload} from '../reducers/editor-tab';

let dispatchRef = null;
const DesktopAPI = {
    

    registerDispatch(dispatch) {
        dispatchRef = dispatch; 
        // console.log("tab全部置顶")
        dispatchRef( activateTab(0));
        dispatchRef( activateTabUpload(0));
    },



    onClickMaster() {//主控选择弹窗--开
        dispatchRef(openMasterModal());
    },

    onCloseMasterModal() {//主控选择弹窗--关
        dispatchRef(closeMasterModal());
    },

    onConnectModal(selectedState) {// 打开连接弹窗,
        // console.log(selectedState)
        const hasSelectedDevice = ['Microbit', 'Arduino', 'ESP32'].includes(selectedState);
        if (!hasSelectedDevice) {
            dispatchRef(openMasterModal());
            return;
        }
        dispatchRef(openConnectModal());
    },

    onCloseConnectModal() {//连接弹窗--关
        dispatchRef(closeConnectModal());
    },

    onClickFirmware(selectedState) {//固件弹窗--开
        const hasSelectedDevice = ['Microbit', 'Arduino', 'ESP32'].includes(selectedState);
        if (!hasSelectedDevice) {
            dispatchRef(openMasterModal());
            return;
        }
        dispatchRef(openFirmwareModal());
    },

    onCloseFirmwareModal() {//固件弹窗--关
        dispatchRef(closeFirmwareModal());
    },




    //注册全局监听用
    initListeners() {
        // 串口断开事件监听（从 preload 注入）目前有问题，没有卸载
        window.EditorPreload?.onSerialDisconnected?.(() => {
            console.log('[DesktopAPI] 串口断开');
            dispatchRef({ type: 'CLEAR_DEVICE_CONNECTION' });
        });
    },

    showGlobalToast(msg, time = 2000) {//公共弹窗（未来需要全局统一）
        const t = document.createElement('div');
        Object.assign(t.style, {
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#333',
          color: '#fff',
          padding: '8px 14px',
          borderRadius: '6px',
          zIndex: 9999,
        });
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), time);
    }

    
};

export default DesktopAPI;