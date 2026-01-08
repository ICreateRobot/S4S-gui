import React from 'react';
import {MenuItem} from '../menu/menu.jsx';
import styles from './settings-menu.css';
import loginImg from './images/login.svg';



const ExampleCode = props => {
    return (
        <MenuItem onClick={props.onClick}>
            <div className={styles.option}>
                <img
                    src={loginImg}
                    className={styles.icon}
                />
            </div>
        </MenuItem>
)};

export default ExampleCode;





