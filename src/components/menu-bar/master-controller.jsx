import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
import {MenuItem} from '../menu/menu.jsx';
//import icon from './tw-desktop-icon.svg';
// import logo from './logo.png'
import styles from './settings-menu.css';

import microbitImg from './images/Microbit.svg';
import arduinoImg from './images/ARDUINO.svg';
import esp32Img from './images/ESP32.svg';
import defaultImg from './images/default.svg'; //默认

// 根据 value 映射图片
const getDeviceIcon = (value) => {
    switch (value) {
        case 'Microbit':
            return microbitImg;
        case 'Arduino':
            return arduinoImg;
        case 'ESP32':
            return esp32Img;
        default:
            return defaultImg; // 默认显示“选择设备”图标
    }
};

const MasterController = props => {
    let icon = getDeviceIcon(props.value);
    return (
        <MenuItem onClick={props.onClick}>
            <div className={styles.option}>
                <img
                    src={icon}
                    className={styles.icon}
                    alt={props.value}
                />
    
            </div>
        </MenuItem>
)};

MasterController.propTypes = {
    onClick: PropTypes.func
};

export default MasterController;





