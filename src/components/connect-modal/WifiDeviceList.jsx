import React, { useState } from "react";
import { FormattedMessage } from "react-intl";
import styles from "./connectModal.css";

import wifiImg from './wifi-connect.png';

const MAX_LENGTH = 8;

const WifiDeviceList = ({ code, setCode,historyCodes, portConnected, portInfo}) => {
  console.log(portConnected)
  console.log(portInfo)
  // 输入是否合法
  const isValid = code.length === MAX_LENGTH;

  // 输入处理
  const handleChange = (e) => {
    let value = e.target.value.toUpperCase();
    // 仅允许数字和字母
    value = value.replace(/[^A-Z0-9]/g, "");
    // 长度限制
    value = value.slice(0, MAX_LENGTH);
    setCode(value);
  };


  return (
    <div className={styles.deviceList}>

      {/* 标题 + 输入框 */}
      <div className={styles.wifiRow}>

        {/* 标题 */}
        <div className={styles.wifiLabel}>
          <FormattedMessage
            id="gui.connectModal.wifiTip"
            defaultMessage="Connection Key"
          />
        </div>

        {/* 输入区域 */}
        <div className={styles.wifiInputWrapper}>

          {/* 输入框 */}
          <input
            list="wifi-history"
            value={code}
            onChange={handleChange}
            placeholder="XXXXXXXX"
            autoComplete="off"
            spellCheck={false}
            className={`${styles.wifiInput} ${
              code.length === 0
                ? ""
                : isValid
                ? styles.wifiInputValid
                : styles.wifiInputInvalid
            }`}
          />

          {/* 历史下拉 */}
          <datalist id="wifi-history">
            {historyCodes.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>

          {/* 字数统计 */}
          <div
            className={`${styles.wifiCount} ${
              isValid
                ? styles.wifiCountValid
                : styles.wifiCountInvalid
            }`}
          >
            {code.length}/{MAX_LENGTH}
          </div>
        </div>
      </div>

      {/* 图片 */}
      <div className={styles.wifiImageWrapper}>
        <img
          src={wifiImg}
          className={styles.wifiImage}
        />
      </div>
      {/* 已连接状态 */}
      {portConnected && (
        <div className={styles.wifiConnectedInfo}>

          {/* 绿色圆点 */}
          <div className={styles.wifiConnectedDot}></div>

          {/* 版本号 */}
          {portInfo?.version && (
            <div className={styles.wifiVersion}>
              V{portInfo.version}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WifiDeviceList;