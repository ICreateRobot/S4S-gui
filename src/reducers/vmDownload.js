/* 下载模式专用vm */
import VM from 'scratch-vm';
import storage from '../lib/storage';

const defaultDownloadVM = new VM();
defaultDownloadVM.setCompatibilityMode(true);
// 云变量关闭
defaultDownloadVM.runtime.cloudOptions.limit = 0;
defaultDownloadVM.attachStorage(storage);

const initialState = defaultDownloadVM;

const SET_DOWNLOAD_VM = 'scratch-gui/vmDownload/SET_DOWNLOAD_VM';

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_DOWNLOAD_VM:
        return action.vm;
    default:
        return state;
    }
};

const setDownloadVM = function (vm) {
    return {
        type: SET_DOWNLOAD_VM,
        vm: vm
    };
};

export {
    reducer as default,
    initialState as vmInitialState,
    setDownloadVM
};
