import React, { useState,useEffect } from 'react';
import styles from './FirmwareModal.css';
import { FormattedMessage } from "react-intl";


const WifiConfigModal = ({ onClose, selectedPort,setSelectedPort,serialPorts, scanPorts, intl }) => {

  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [writing, setWriting] = useState(false);


  // 写入 WiFi 
  const handleWrite = async () => {
    if (!ssid || !password || !selectedPort) return;

    setWriting(true);

    try {
        await window.EditorPreload.writeEspWiFi(ssid, password, selectedPort);
        // 成功后自动关闭弹窗
        onClose();
    } catch (e) {
        console.error('写入失败:', e);

    } finally {
      setWriting(false);
    }
  };

  return (
    <div className={styles.wifiOverlay}>
      <div className={styles.wifiModal}>

        {/* header */}
        <div className={styles.wifiHeader}>
            <h3>
                <FormattedMessage
                    description="Settings"
                    id="gui.tooltip.settings"
                />
            </h3>
            <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* body */}
        <div className={styles.wifiBody}>
            {/* ===== SSID ===== */}
            <input
                className={styles.input}
                placeholder="WiFi SSID"
                value={ssid}
                onChange={e => setSsid(e.target.value)}
            />

            {/* ===== Password ===== */}
            <input
                className={styles.input}
                // type="password"
                placeholder="WiFi Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />

            {/* ===== 串口选择 ===== */}
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
                            id: "gui.uploadFirmware.choiceSerial_p",
                            defaultMessage: "please select a serial port"
                        })}
                    </option>

                    {serialPorts.map(p => (
                        <option key={p.comPort} value={p.comPort}>
                        {p.comPort}
                        </option>
                    ))}
                    </select>

                    <div className={styles.selectArrow}>▼</div>
                </div>
            </div>

            {/* ===== 写入按钮 ===== */}
            <button
                className={styles.wifiBtn}
                disabled={!ssid || !password || !selectedPort || writing}
                onClick={handleWrite}
            >
                {writing ? 
                    intl.formatMessage({
                        id: "gui.uploadFirmware.Writing",
                        defaultMessage: "Writing…"
                    })
                    :
                    intl.formatMessage({
                        id: "gui.uploadFirmware.Write",
                        defaultMessage: "Write"
                    })
                }
            </button>
        </div>
      </div>

        {writing && (
            <div className={styles.loadingOverlay}>
                <div className={styles.spinner}></div>
            </div>
        )}
    </div>
  );
};

export default WifiConfigModal;