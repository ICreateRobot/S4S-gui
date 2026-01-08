/*标签切换（下载，串口监视器） */
import {FormattedMessage} from 'react-intl';
import ProgramDownload from './ProgramDownload.jsx';
import SerialMonitor from './SerialMonitor.jsx';
import React, { useState} from 'react';
import styles from './TabSwitcher.css';

/* 只保留串口监视器，下载更换位置 */

// 主组件
const TabSwitcher = ({ device}) => {
  const [activeTab, setActiveTab] = useState('monitor');
  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          // { key: 'download', label: '下载' },
          { key: 'monitor', label: '串口监视器' },
        ].map(({ key, label }) => (
          <div
            key={key}
            onClick={() => setActiveTab(key)}
            className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
          >
            <FormattedMessage
                defaultMessage={label}
                id={key}
            />
          </div>
        ))}
      </div>

      {/* 内容区域 */}
      <div className={styles.content}>
        {activeTab === 'download' && <ProgramDownload  device ={device } />}
        {activeTab === 'monitor' && <SerialMonitor device={device} />}
      </div>
    </div>
  );
};

export default TabSwitcher;
