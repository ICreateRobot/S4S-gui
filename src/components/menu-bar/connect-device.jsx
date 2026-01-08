import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
import {MenuItem} from '../menu/menu.jsx';
import styles from './settings-menu.css';

import connectImg from './images/connect.svg';

const ConnectDevice = props => (
    <MenuItem onClick={props.onClick}>
        <div className={styles.option}>
            {/* <FormattedMessage
                defaultMessage='连接'
                description="Button in menu bar under settings to open desktop app settings"
                id="connectDevice"
            /> */}
            <img 
                src={connectImg} 
                // alt="连接设备"
                className={styles.icon}
                //title="连接设备" // 添加悬停提示
            />
        </div>
    </MenuItem>
);

ConnectDevice.propTypes = {
    onClick: PropTypes.func
};

export default ConnectDevice;
