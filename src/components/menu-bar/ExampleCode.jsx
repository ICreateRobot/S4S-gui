import React from 'react';
import PropTypes from 'prop-types';
import {MenuItem} from '../menu/menu.jsx';

import styles from './settings-menu.css';

import exampleImg from './images/example.svg';



const ExampleCode = props => {
    return (
        <MenuItem onClick={props.onClick}>
            <div className={styles.option}>
                <img
                    src={exampleImg}
                    className={styles.icon}
                />
            </div>
        </MenuItem>
)};

export default ExampleCode;





