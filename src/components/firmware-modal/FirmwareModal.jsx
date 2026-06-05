//* 固件升级窗口 */
import React, { useState, useEffect } from 'react';
import { FormattedMessage,injectIntl } from "react-intl";
import { connect } from 'react-redux';
import styles from './FirmwareModal.css';

import arduinoImg from '../master-modal/images/ARDUINO.png';
import esp32Img from '../master-modal/images/ESP32.png';
import microbitImg from '../master-modal/images/Microbit.png';

import WifiConfigModal from './WifiConfigModal.jsx';

const deviceInfoMap = {
  Microbit: {
    name: 'Micro:bit',
    image: microbitImg
  },
  Arduino: {
    name: 'Arduino',
    image: arduinoImg
  },
  ESP32: {
    name: 'ESP32',
    image: esp32Img
  }
};

const firmwareList = {
    Microbit: [ { id: 'Microbit_LinkBot', name: 'Microbit_LinkBot', version: 'V1.0.0' } ],
    Arduino: [],
    ESP32: []
}


const FirmwareModal = ({ intl,onRequestClose, modeValue, extensionName,deviceConnection }) => {
  //const [selectedFirmware, setSelectedFirmware] = useState(null);// 当前选中的固件
  const [selectedPort, setSelectedPort] = useState('');// 当前选中的串口
  const [upgrading, setUpgrading] = useState(false);// 升级状态
  const [serialPorts, setSerialPorts] = useState([]);//串口列表

  const [progress, setProgress] = useState(0);     // 进度
  const [errorMsg, setErrorMsg] = useState(null);  // 错误信息(用不到了)
  const [done, setDone] = useState(false);         // 是否完成(用不到了)

  const [showWifiPanel, setShowWifiPanel] = useState(false);//wifi设置面板


  // useEffect(() => {
  //   const init = async () => {
  //     //console.log(deviceConnection)
  //     // 已有设备连接  锁定串口
  //     if (deviceConnection?.connected) {
  //       const portInfo = deviceConnection.info;
  //       setSelectedPort(portInfo?.comPort || portInfo?.path || '');
  //     }
  
  //     //没有连接  扫描所有串口
  //     await scanPorts();
  //   };
  
  //   init();
  // }, [deviceConnection]);


  useEffect(() => {
    // 进度
    const offProgress = window.EditorPreload.onFlashFirmwareProgress((percent) => {
      setProgress(percent);
    });
  
    // 完成
    const offDone = window.EditorPreload.onFlashFirmwareDone(() => {
      vm.runtime.ioDevices.toast.guiToast("", 
        intl.formatMessage({
            id: "gui.uploadFirmware.success",
            defaultMessage: "upgrade completed"
        }), 'success', 3000);
      setUpgrading(false);
    });
  
    // 错误
    const offError = window.EditorPreload.onFlashFirmwareError((error) => {
      vm.runtime.ioDevices.toast.guiToast("", 
        intl.formatMessage({
            id: "gui.uploadFirmware.failed",
            defaultMessage: "upgrade failed"
        }), 'error', 3000);
      setUpgrading(false);
    });
  
    // 移除监听/
    return () => {
      offProgress?.();
      offDone?.();
      offError?.();
    };
  }, []);
  
  
  // 执行烧录
  const handleUpgrade = async () => {
    if ( !selectedPort) return;

    // 清空上一次状态
    setProgress(0);

    //执行
    setUpgrading(true);
    try {
      console.log(extensionName);
      await window.EditorPreload.flashFirmwareAll(extensionName,selectedPort)
    } finally {
      //setUpgrading(false);//不需要了，根据监听直接决定最终状态
    }
  };

  // 重新刷新串口
  const scanPorts = async () => {
    const result = await window.EditorPreload.serialScan(extensionName);

    if (result?.success) {
      const devices = result.devices || [];
      setSerialPorts(devices);

      // ❗关键：如果当前 selectedPort 不在设备列表中，清掉
      const exists = devices.some(p => p.comPort === selectedPort);

      if (!exists) {
        setSelectedPort('');
      }
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>
            <FormattedMessage
              description="Upload Firmware"
              id="gui.tooltip.uploadFirmware"
            />
          </h2>
          <button className={styles.closeButton} onClick={onRequestClose}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* 设备信息 */}
          <div className={styles.deviceCard}>
              <img
                  src={deviceInfoMap[extensionName]?.image}
                  className={styles.deviceImage}
              />

              {extensionName === 'ESP32' && (
                <button
                  className={styles.settingBtn}
                  onClick={() => setShowWifiPanel(true)}
                >
                  ⚙
                </button>
              )}

              <div className={styles.deviceName}>
                  {deviceInfoMap[extensionName]?.name}
              </div>

              <div className={styles.deviceDesc}>
                  <FormattedMessage
                      id="gui.uploadFirmware.deviceDesc"
                      defaultMessage="Firmware upgrade for connected device"
                  />
              </div>
          </div>

          {/* 串口选择 */}
          <div className={styles.serialCard}>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={selectedPort}
                onChange={e => setSelectedPort(e.target.value)}
                onClick={scanPorts}
              >
                <option value="">
                  {intl.formatMessage({
                    description:"please select a serial port",
                    id:"gui.uploadFirmware.choiceSerial_p"
                  })}
                </option>

                {serialPorts.map(p => (
                  <option key={p.comPort} value={p.comPort}>
                    {p.comPort}
                  </option>
                ))}
              </select>

              <div className={styles.selectArrow}>
                ▼
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
        <button
            className={`${styles.serialBtn} ${styles.scanBtn}`}
            disabled={!selectedPort || upgrading}
            onClick={handleUpgrade}
        >
            {upgrading
                ? intl.formatMessage({
                    id: 'gui.uploadFirmware.upgrading',
                    defaultMessage: 'upgrading...'
                })
                : intl.formatMessage({
                    id: 'gui.uploadFirmware.start',
                    defaultMessage: 'start upgrade'
                })
            }
        </button>
        </div>

        {/* {upgrading && (
          <div className={styles.blockingOverlay}>
            <div className={styles.blockingContent}>
              <div className={styles.blockingTitle}>
                  <FormattedMessage
                      description="upgrading firmware"
                      id="gui.uploadFirmware.uploading"
                  /> 
              </div>

              <div className={styles.progressText}>
                  {progress}%
              </div>

              <div className={styles.progressBar}>
                  <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                  />
              </div>

              <div className={styles.blockingTip}>
                  <FormattedMessage
                      description="do not disconnect the device or close the window"
                      id="gui.uploadFirmware.uploading_inf"
                  /> 
              </div>
            </div>
          </div>
        )} */}
        {upgrading && (
  <div className={styles.blockingOverlay}>
    <div className={styles.blockingContent}>
      
      <div className={styles.loadingRow}>
        <span className={styles.blockingTitle}>
          Flashing firmware...
        </span>
      </div>

      <div className={styles.progressText}>{progress}%</div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={styles.blockingTip}>
        <FormattedMessage
          description="do not disconnect the device or close the window"
          id="gui.uploadFirmware.uploading_inf"
        />
      </div>

    </div>
  </div>
)}

        {extensionName === 'ESP32' && showWifiPanel && (
          <WifiConfigModal
            onClose={() => setShowWifiPanel(false)}
            selectedPort={selectedPort}
            setSelectedPort={setSelectedPort}
            serialPorts={serialPorts}
            scanPorts={scanPorts}
            intl={intl}
          />
        )}
      </div>
    </div>
  );
};



// Redux 连接
const mapStateToProps = (state) => ({
    deviceConnection: state.scratchGui.deviceConnectionState
});

export default connect(mapStateToProps)(injectIntl(FirmwareModal));

