import React from 'react';
import {FormattedMessage} from 'react-intl';
import {MenuItem} from '../menu/menu.jsx';
import styles from './settings-menu.css';

import connectImg from './images/connect.svg';//连接图标
import disconnectImg from './images/disconnect.svg';//断开图标

import { connect } from 'react-redux';

const ConnectDevice = props => {
    const { deviceConnection, onClick } = props;
    const isConnected = deviceConnection?.connected;

    return (
        <MenuItem onClick={onClick}>
            <div className={styles.option}>
                <img
                    src={isConnected ? connectImg : disconnectImg }
                    className={styles.icon}
                    // alt="连接设备"
                    //title="连接设备" // 添加悬停提示
                />
            </div>
        </MenuItem>
    );
};

const mapStateToProps = state => ({
    deviceConnection: state.scratchGui.deviceConnectionState
});

export default connect(mapStateToProps)(ConnectDevice);
