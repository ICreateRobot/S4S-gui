import React from 'react';
import { connect,useDispatch } from 'react-redux';

import { setSelectedDevice } from '../../reducers/sun';
import { FormattedMessage } from "react-intl";


import styles from './MasterModal.css';
import arduinoImg from './images/ARDUINO.svg';
import esp32Img from './images/ESP32.svg';
import microbitImg from './images/Microbit.svg';



const devices = [
  { showName: 'Micro:bit', name: 'Microbit', img: microbitImg },
  { showName: 'Arduino', name: 'Arduino', img: arduinoImg },
  { showName: 'ESP32', name: 'ESP32', img: esp32Img },
];


const categoryMap = {
  Arduino: [
      'ArduinoS4S'
  ],
  ESP32: [
      'robotmove'
  ],
  Microbit: [
      'MicrobitIcreate'
  ]
};


class MasterModal extends React.Component {
  constructor(props) {
    super(props);
    //指向组件实例
    this.selectDevice = this.selectDevice.bind(this);
    this.deselectDevice = this.deselectDevice.bind(this);
    this.handledata = this.handledata.bind(this);
    this.addExtensions = this.addExtensions.bind(this);
    this.removeExtensions = this.removeExtensions.bind(this);
  }

  // 选择设备
  async selectDevice(index) {
    const deviceName = devices[index].name;
    // if (deviceName == 'ESP32'){
    //   alert("暂不支持")
    //   return
    // }
    if(this.props.selectedDevice === deviceName) return
    console.log("当前",this.props.selectedDevice,"点击",deviceName)

    await this.handledata('open', deviceName);
    this.props.setSelectedDevice(deviceName)

    vm.runtime.currentDevice = deviceName; // 通知扩展
    //vm.runtime.emit('DEVICE_CHANGED', deviceName);

    this.props.onRequestClose();//关闭当前窗口
    //打开新窗口(功能待定)
  }

  // 取消选择设备
  async deselectDevice(index, e) {
    e.stopPropagation();
    const deviceName = devices[index].name;

    await this.handledata('close', deviceName);
    this.props.setSelectedDevice(null);

    vm.runtime.currentDevice = "";// 通知扩展
    //vm.runtime.emit('DEVICE_CHANGED', ""); 
  }

  // 处理操作
  async handledata(type,devices){
    vm.stopAll();//停止所有
    this.props.setIsLoading(true);//出现加载页面

    //根据打开或者关闭进行扩展操作
    if(type == 'open'){
      if(this.props.selectedDevice){//有老设备先进行移除
          await this.removeExtensions(this.props.selectedDevice)
      }
      await new Promise(r => setTimeout(r, 500));//加钱就删的延时
      await this.addExtensions(devices)
    }else if(type='close'){
        await this.removeExtensions(devices)
        vm.emit('workspaceUpdate');//直接通知刷新
    }
    await new Promise(r => setTimeout(r, 1000));//加钱就删的延时
    this.props.setIsLoading(false);//退出加载页面
  }

  // 添加扩展（根据设备）
  async addExtensions(devices) {
    let Exts = categoryMap[devices];
    for (const id of Exts) {
        try {
            if (!vm.extensionManager.isExtensionLoaded(id)) {//验重
                await vm.extensionManager.loadExtensionIdSync(id);
            }
        } catch (e) {
            console.warn('扩展加载失败：', id, e);
        }
    }

    //调整顺序，让扩展永远在最前
    const blockInfo = vm.runtime._blockInfo;

    // 找出要置顶的模块
    const pinned = blockInfo.filter(b => Exts.includes(b.id));
    const rest = blockInfo.filter(b => !Exts.includes(b.id));

    // 重新排列--置顶
    vm.runtime._blockInfo = [
        ...pinned,
        ...rest
    ];

    vm.emit('workspaceUpdate');
  }

  //移除扩展（根据设备）
  async removeExtensions(devices) {
      /* 先不去除 */
      // // 已加载扩展
      // const loadedExts = Array.from(vm.extensionManager._loadedExtensions.keys());
      // //console.log('已加载扩展',loadedExts)

      // // 要移除的扩展
      // let removeExts = [];
      // const Exts = categoryMap[devices];
      // if (Exts) removeExts.push(...Exts);
  
      // // 保留的扩展
      // const keepExts = loadedExts.filter(id => !removeExts.includes(id));

      // // 清空所有扩展
      // vm.runtime._blockInfo = [];
      // await vm.extensionManager._loadedExtensions.clear();
  
      // // 重新加载保留的扩展
      // for (const id of keepExts) {
      //     try {
      //         await vm.extensionManager.loadExtensionIdSync(id);
      //     } catch (e) {
      //         console.warn('扩展重新加载失败：', id, e);
      //     }
      // }
      const Exts = categoryMap[devices];
      // 清除积木定义
      vm.runtime._blockInfo = vm.runtime._blockInfo.filter(block => !Exts.includes(block.id));
      // 卸载扩展
      for (const id of Array.from(vm.extensionManager._loadedExtensions.keys())) {
          if (Exts.includes(id)) {
              vm.extensionManager._loadedExtensions.delete(id);
          }
      }
  }

  render() {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2>
              <FormattedMessage
                defaultMessage="Select Device"
                description="Select Device"
                id="selectDevice"
              />
            </h2>
            <button className={styles.closeButton} onClick={this.props.onRequestClose}>
              &times;
            </button>
          </div>
          <hr />

          <table>
            <tbody>
              <tr>
                {devices.map((dev, index) => (
                  <td key={dev.name}>
                    <div
                      className={styles.cellContent}
                      onClick={() => this.selectDevice(index)}
                    >
                      {/* 遮罩层 */}
                      {this.props.selectedDevice === dev.name && <div className={styles.overlay}></div>}

                      {/* 红色减号按钮 */}
                      {this.props.selectedDevice === dev.name && (
                        <div
                          className={styles.closeBtn}
                          onClick={(e) => this.deselectDevice(index, e)}
                        >
                          -
                        </div>
                      )}

                      <p>{dev.showName}</p>
                      <img src={dev.img} alt={dev.name} />
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
 
// 从 Redux 获取状态
const mapStateToProps = (state) => ({
    selectedDevice: state.scratchGui.sun.selectedDevice//统一管理的设备
});

// 派发 Redux Action
const mapDispatchToProps = (dispatch) => ({
    setSelectedDevice: (deviceName) => dispatch(setSelectedDevice(deviceName))
});

export default connect(mapStateToProps, mapDispatchToProps)(MasterModal);
