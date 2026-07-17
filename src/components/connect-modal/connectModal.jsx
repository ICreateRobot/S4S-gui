//连接窗口
import React, { useState, useEffect } from "react";
import styles from "./connectModal.css";
import { connect } from 'react-redux';
import { setDeviceConnection, clearDeviceConnection } from '../../reducers/device-connection'; 
import { FormattedMessage } from "react-intl";

import * as serial from './serial.js';
import * as bluetooth from './bluetooth.js';
import * as wifi from './wifi.js';

import ConnectContent from "./ConnectContent.jsx";


// 设备连接模式配置
const DEVICE_CONNECTION_MODES = {
  Microbit: ['serial'],
  Arduino: ['serial'],
  ESP32: ['wifi']//,'serial', 'bluetooth'
};

//调用模块集合
const MODE_HANDLERS = {
  serial,
  bluetooth,
  wifi
};

const ConnectTabs = ({ onRequestClose,modeValue,extensionName, handleConnectData, deviceConnection, dispatch}) => {
  const [currentDevice, setCurrentDevice] = useState(null);//当前选择的主控设备
  const [availableModes, setAvailableModes] = useState(["serial"]);//当前设备支持的连接模式
  const [activeTab, setActiveTab] = useState("serial"); //当前使用的连接模式
  const [devices, setDevices] = useState([]); // 扫描到的设备列表
  const [selectedIndex, setSelectedIndex] = useState(null); // 列表中被选中的模式索引
  const [portConnected, setPortConnected] = useState(false);//是否已连接（任意一种连接）
  const [portInfo, setPortInfo] = useState(null);//当前连接的设备信息
  const [loading, setLoading] = useState(false); // 扫描或连接的 loading 状态
  const [actionLoading, setActionLoading] = useState(false); // 正在连接/断开

  // 获取历史记录
  const historyCodes = JSON.parse(
    localStorage.getItem("wifi_history") || "[]"
  );
  const [wifiCode, setWifiCode] = useState(historyCodes[0] || "");// wifi连接码输入状态

  
  useEffect(() => { 
    let isMounted = true;
    if (isMounted) {
    //获取当前选中的主控
      const selectedDevice = extensionName;
      // console.log("当前选中的设备：", selectedDevice);
      setCurrentDevice(selectedDevice || null);

      // 如果已选择设备，初始化允许的连接模式
      if (selectedDevice) {
        const allowedModes = DEVICE_CONNECTION_MODES[selectedDevice];
        setAvailableModes(allowedModes);

        //console.log(deviceConnection);

        //已有连接
        if (deviceConnection && deviceConnection.connected && allowedModes.includes(deviceConnection.mode)) {// 如果有已连接设备，并且模式匹配，直接恢复连接状态
          setActiveTab(deviceConnection.mode);
          setPortConnected(true);
          setPortInfo(deviceConnection.info);

          // 只有 serial 才自动扫描
          if (deviceConnection.mode === 'serial') {
            handleScan(deviceConnection.mode,selectedDevice,deviceConnection.info);
          }
        } else {//无连接设备，直接扫描
          setActiveTab(allowedModes[0]);
          if (allowedModes[0] === 'serial') {
            handleScan(allowedModes[0],selectedDevice);//开扫
          }
        }
      } 
    }
    return () => {
      isMounted = false;  // 标记组件已卸载
    };
  }, []);// deviceConnection//根据连接状态会触发重复执行的bug,先不根据连接状态刷新了，应该没有什么影响
  

  //只执行一次的，监听断开
  useEffect(() => {
      const off = window.EditorPreload?.onSerialDisconnected?.(() => {
          setPortConnected(false);
          setPortInfo(null);
          dispatch(clearDeviceConnection());
      }); 

      return () => {
          if (typeof off === "function") {
              off();
          }
      };
  }, []);

  
  // 切换连接模式
  const handleTabSwitch = async (mode) => {
    if (!availableModes.includes(mode)) return ;//正常情况完全用不到此判断（保险）
    if (portConnected) return //showToast("请先断开当前连接");

    setActiveTab(mode);
    if (mode !== 'wifi') {
      await handleScan(mode,currentDevice);//执行扫描
    }
  };

  // 扫描设备（将来这里可能都要改，先这样吧）
  const handleScan = async (mode,deviceTYpe, connectedInfo = null) => {
    // 蓝牙 + 已连接：只显示当前设备，不扫描
    if (mode === 'bluetooth' && connectedInfo && connectedInfo.type === 'bluetooth') {
      setDevices([connectedInfo]);
      setSelectedIndex(0);
      return;
    }

    setLoading(true);
    setDevices([]);//清空设备列表
    try {
      const list = await MODE_HANDLERS[mode].scan(deviceTYpe);

      let finalList = list;
      // 如果已有连接设备 放在最前面
       console.log(connectedInfo,mode)
      if (connectedInfo && connectedInfo.type === mode) {
        // 过滤掉扫描列表中和已连接设备重复的
        finalList = [
          connectedInfo,
          ...list.filter(d => d.comPort !== connectedInfo.comPort)
        ];
        setSelectedIndex(0); // 已连接设备默认第一个
      } else {
        setSelectedIndex(null);
      }

      setDevices(finalList);
    } catch (err) {
      console.log(err.message);

      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };


  //点击设备列表执行连接
  const handleSelectOrConnect = async (device, index) => {
    setSelectedIndex(index);
    setActionLoading(true);
    try {
      const info = await MODE_HANDLERS[activeTab].connect(device,currentDevice,modeValue);
      setPortConnected(true);
      setPortInfo(info);

      // 保存到全局 Redux
      dispatch(setDeviceConnection({
        mode: activeTab,
        isSerialTool: false,
        info
      }));

      handleConnectData?.({ type: "isOpenPort", data: { message: true } });//执行连接的某些操作
      //showToast("连接成功");

      setTimeout(() => {
        onRequestClose(); // 关闭当前窗口
      }, 500);
    } catch (err) {
      showToast(err.message);
    } finally {
      setActionLoading(false);
    }
  };


  // 断开
  const handleFooterAction = async () => {
    if (portConnected) {
      setActionLoading(true);
      try {
        await MODE_HANDLERS[activeTab].disconnect();
        setPortConnected(false);
        setPortInfo(null);
        setDevices([]);          
        setSelectedIndex(null);

        dispatch(clearDeviceConnection()); // 清空全局连接状态

        handleConnectData?.({ type: "isOpenPort", data: { message: false } });
        //showToast("已断开连接");
      } catch (err) {
        showToast(err.message);
      } finally {
        setActionLoading(false);
      }
    } else {
      await handleScan(activeTab,currentDevice);
    }
  };

  // wifi连接
  const handleWifiConnect = async () => {
    if(actionLoading) return;//正在连接中，避免重复点击
    setActionLoading(true);

    // 检查链接码
    if (wifiCode.length !== 8  ){
      vm.runtime.ioDevices.toast.guiToast("","请检查Connection Key","error",3000);
      return;
    } 
    
    try {
      // 获取设备信息
      const info = await MODE_HANDLERS.wifi.connect(wifiCode);

      //console.log("设备信息:", info);
      if(info.code === 201){
        vm.runtime.ioDevices.toast.guiToast("200", "设备连接成功", "info", 2000 );

        /* 将数据保存，各个地方应用 */
        // 保存到全局 Redux
        dispatch(setDeviceConnection({
          mode: "wifi",
          info: {
            ...info.data,
            connKey: wifiCode
          }
        }));
        // 保存历史
        saveHistory(wifiCode);
        vm.runtime.connKey = wifiCode; // 通知扩展
        setPortConnected(true);
        setPortInfo(info.data);

        setTimeout(() => {
          onRequestClose(); // 关闭当前窗口
        }, 500);

      }else{//其他所有情况都按照此种情况处理，如果想要更细致，根据文档再扩展
        vm.runtime.ioDevices.toast.guiToast("002", "请检测链接码是否正确或设备已离线", "error", 3000 );
        dispatch(clearDeviceConnection()); // 清空全局连接状态
        vm.runtime.connKey = ""; // 通知扩展
        setPortConnected(false);
      }

    } catch (err) {
      //console.log(err);
      vm.runtime.ioDevices.toast.guiToast( "",  "连接失败", "error",  3000 );
      dispatch(clearDeviceConnection()); // 清空全局连接状态
      vm.runtime.connKey = ""; // 通知扩展
      setPortConnected(false);
    }finally {
      setActionLoading(false);
    }
  }

  // 保存历史记录
  const saveHistory = (newCode) => {
    const oldList = JSON.parse(
      localStorage.getItem("wifi_history") || "[]"
    );

    // 去重 + 最新放最前
    const newList = [
      newCode,
      ...oldList.filter(item => item !== newCode)
    ];

    // 最多保存10条
    localStorage.setItem(
      "wifi_history",
      JSON.stringify(newList.slice(0, 10))
    );
  };


  // 警告窗口
  const showToast = (msg) => {
    const t = document.createElement("div");
    Object.assign(t.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "#333",
      color: "#fff",
      padding: "8px 14px",
      borderRadius: "6px",
      zIndex: 9999,
    });
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.connectContainer}>
        <div className={styles.headerRow}>
          <h2>
            <FormattedMessage
                defaultMessage="Connecting Device"
                id="gui.connectingDevice"
              />
          </h2>
          <button className={styles.closeButton} onClick={onRequestClose}>
            &times;
          </button>
        </div>
        <hr />

        <div className={styles.tabBar}>
          {availableModes.map((mode) => (
            <div
              key={mode}
              className={`${styles.tab} ${activeTab === mode ? styles.active : ""}`}
              onClick={() => handleTabSwitch(mode)}
            >
              {mode === "serial" ?
                <FormattedMessage id="gui.connectModal.serial" defaultMessage="Serial" />
                : mode === "bluetooth" ?
                <FormattedMessage id="gui.connectModal.bluetooth" defaultMessage="Bluetooth" />
                : "WiFi"
              }
            </div>
          ))}
        </div>


        <div className={styles.content}>

          {/* 选择列表 */}
          <ConnectContent
            mode={activeTab}
            loading={loading}
            devices={devices}
            selectedIndex={selectedIndex}
            portConnected={portConnected}
            portInfo={portInfo}
            actionLoading={actionLoading}
            onConnect={handleSelectOrConnect}
            code={wifiCode}
            setCode={setWifiCode}
            historyCodes={historyCodes}
          />

          {/* 底部固定按钮 */}
          {/* 非wifi模式 扫描与断开 */}
          {activeTab !== 'wifi' && (
            <div className={styles.footer}>
              {!portConnected ? (
                <button
                  className={`${styles.serialBtn} ${styles.scanBtn}`}
                  onClick={() => handleFooterAction()}
                  disabled={loading || actionLoading}
                >
                  {loading ?
                    <FormattedMessage id="gui.connectModal.scanning" defaultMessage="Scanning..." />
                    : 
                    <FormattedMessage id="gui.connectModal.scan" defaultMessage="Scan Devices" />
                  }
                </button>
              ) : (
                <button
                  className={`${styles.serialBtn} ${styles.disconnectBtn}`}
                  onClick={() => handleFooterAction()}
                  disabled={actionLoading}
                >
                  {actionLoading ? 
                    <FormattedMessage id="gui.connectModal.disconnecting" defaultMessage="Disconnecting..." />
                    : 
                    <FormattedMessage id="gui.connectModal.disconnect" defaultMessage="Disconnect" />
                  }
                </button>
              )}
            </div>
          )}

          {/* wifi模式 连接 */}
          {activeTab === 'wifi' && (
            <div className={styles.footer}>
              <button
                className={`${styles.serialBtn} ${styles.scanBtn}`}
                // disabled={wifiCode.length !== 8 || actionLoading}
                onClick={handleWifiConnect}
              >
                <FormattedMessage
                  id="gui.connectModal.connect"
                  defaultMessage="Connect"
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// Redux 连接
const mapStateToProps = (state) => ({
  deviceConnection: state.scratchGui.deviceConnectionState.device
});

export default connect(mapStateToProps)(ConnectTabs);
