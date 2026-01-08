//下载专用vm
import VM from 'scratch-vm';
import storage from './storage';

class DownloadVMHolder {
    constructor () {
        this.vm = new VM();
        this.vm.setCompatibilityMode(true);
        this.vm.runtime.cloudOptions.limit = 0;
        this.vm.attachStorage(storage);

    }

    getVM () {
        return this.vm;
    }
}

const downloadVMHolder = new DownloadVMHolder();
export default downloadVMHolder;
