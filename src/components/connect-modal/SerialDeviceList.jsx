import React from "react";
import { FormattedMessage } from "react-intl";
import styles from "./connectModal.css";

const SerialDeviceList = ({
  loading,
  devices,
  selectedIndex,
  portConnected,
  portInfo,
  actionLoading,
  onConnect
}) => {
  return (
    <div className={styles.deviceList}>
      {loading && (
        <div className={styles.emptyTip}>
          <FormattedMessage id="gui.connectModal.scanning" defaultMessage="Scanning..." />
        </div>
      )}

      {!loading && (!devices || devices.length === 0) && (
        <div className={styles.deviceItem}>
          <FormattedMessage id="gui.connectModal.noDevices" defaultMessage="No device found" />
        </div>
      )}

      {!loading && devices.map((device, idx) => {
        const isSelected = selectedIndex === idx;

        return (
          <div
            key={idx}
            className={`${styles.deviceItem} ${isSelected ? styles.deviceItemActive : ""}`}
          >
            <div>
              <div className={styles.deviceName}>{device.name}</div>
            </div>

            <div>
              {portConnected && portInfo?.comPort === device.comPort ? (
                <span style={{ color: "#4caf50", fontWeight: 600 }}>
                  <FormattedMessage id="gui.connectModal.connected" defaultMessage="Connected" />
                </span>
              ) : (
                <button
                  className={styles.connectBtn}
                  disabled={actionLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    onConnect(device, idx);
                  }}
                >
                  <FormattedMessage id="gui.connectModal.connect" defaultMessage="Connect" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SerialDeviceList;
