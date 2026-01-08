//* 固件升级窗口 */
import React, { useState, useEffect } from 'react';
import { FormattedMessage,injectIntl } from "react-intl";
import { connect } from 'react-redux';
import styles from './FirmwareModal.css';


const firmwareList = {
    Microbit: [ { id: 'Microbit_LinkBot', name: 'Microbit_LinkBot', version: 'V1.0.0' } ],
    Arduino: [],
    ESP32: []
}

const FirmwareModal = ({ intl,onRequestClose, modeValue, extensionName,deviceConnection }) => {
  const [selectedFirmware, setSelectedFirmware] = useState(null);// 当前选中的固件
  const [selectedPort, setSelectedPort] = useState('');// 当前选中的串口
  const [upgrading, setUpgrading] = useState(false);// 升级状态
  const [serialPorts, setSerialPorts] = useState([]);//串口列表

  const [progress, setProgress] = useState(0);     // 进度
  const [errorMsg, setErrorMsg] = useState(null);  // 错误信息
  const [done, setDone] = useState(false);         // 是否完成


  useEffect(() => {
    const init = async () => {
     console.log(deviceConnection)
      // 已有设备连接  锁定串口
      if (deviceConnection?.connected) {
        const portInfo = deviceConnection.info;
        //setSerialPorts(portInfo ? [portInfo] : []);
        setSelectedPort(portInfo?.comPort || portInfo?.path || '');
        //return;
      }
  
      //没有连接  扫描所有串口
      const result = await window.EditorPreload.serialScan(extensionName);
  
      if (result?.success) {
        setSerialPorts(result.devices || []);
      }
    };
  
    init();
  }, [deviceConnection]);


  useEffect(() => {
    // 进度
    const offProgress = window.EditorPreload.onFlashFirmwareProgress((percent) => {
      setProgress(percent);
    });
  
    // 完成
    const offDone = window.EditorPreload.onFlashFirmwareDone(() => {
      setDone(true);
      setUpgrading(false);
    });
  
    // 错误
    const offError = window.EditorPreload.onFlashFirmwareError((error) => {
      setErrorMsg(error);
      setUpgrading(false);
    });
  
    // 移除监听
    return () => {
      offProgress?.();
      offDone?.();
      offError?.();
    };
  }, []);
  
  
  // 执行烧录
  const handleUpgrade = async () => {
    if (!selectedFirmware || !selectedPort) return;

    // 清空上一次状态
    setProgress(0);
    setErrorMsg(null);
    setDone(false);

    //执行
    setUpgrading(true);
    try {
      await window.EditorPreload.flashFirmwareAll(extensionName,selectedFirmware.id+"_"+selectedFirmware.version,selectedPort)
    } finally {
      //setUpgrading(false);//不需要了，根据监听直接决定最终状态
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

          {/* 固件选择 */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
                <FormattedMessage
                    description="select firmware"
                    id="gui.uploadFirmware.choiceFirmware"
                />
            </div>
            <div className={styles.firmwareList}>
              {firmwareList[extensionName].map(fw => (
                <div
                  key={fw.id}
                  className={`${styles.firmwareItem} ${
                    selectedFirmware?.id === fw.id ? styles.active : ''
                  }`}
                  onClick={() => setSelectedFirmware(fw)}
                >
                  <div>{fw.name}</div>
                  <div className={styles.version}>{fw.version}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 串口选择 */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
                <FormattedMessage
                    description="select serial port"
                    id="gui.uploadFirmware.choiceSerial"
                />
            </div>
            <select
              className={styles.select}
              value={selectedPort}
              onChange={e => setSelectedPort(e.target.value)}
            >
              <option value="">
               { intl.formatMessage({
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
          </div>
        </div>


        {errorMsg && (
        <div className={styles.error}>
            <FormattedMessage
                description="upgrade failed"
                id="gui.uploadFirmware.failed"
            /> 
            ：{errorMsg}
        </div>
        )}

        {done && (
        <div className={styles.success}>
            <FormattedMessage
                description="upgrade completed"
                id="gui.uploadFirmware.success"
            /> 
        </div>
        )}

        <div className={styles.footer}>
        <button
            className={`${styles.serialBtn} ${styles.scanBtn}`}
            disabled={!selectedFirmware || !selectedPort || upgrading}
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

        {upgrading && (
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

