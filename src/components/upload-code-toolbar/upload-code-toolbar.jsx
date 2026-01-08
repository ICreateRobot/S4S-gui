import React from 'react';
import styles from './upload-code-toolbar.css';
import classNames from 'classnames';
import runIcon from './run-icon.svg'; // 引入图片

import codeModule from '../../../../../utils/global.js'


import fullStageIcon from '!../../lib/tw-recolor/build!./icon--full-stage.svg';
import smallStageIcon from '!../../lib/tw-recolor/build!./icon--small-stage.svg';


const UploadCodeToolbar = ({ device,layout, onChangeLayout }) => {

    //下载
    const handleDownload = async () => {
        if(device == "Microbit"){
            let import_code='from microbit import *\nfrom s4s import *\n';
            //console.log(import_code+codeModule.getCode())
            const result = await window.EditorPreload.usbdownloadCode(import_code+codeModule.getCode());
            console.log(result) 
        }else if(device == "ESP32"){
         
        }else if(device == "Arduino"){
            let import_code='#include "Arduino.h"\nvoid setup(){\n  pinMode(A0 , OUTPUT);\n}\nvoid loop(){\ndigitalWrite(A0,HIGH);\ndelay(1000);\ndigitalWrite(A0,LOW);\ndelay(1000);\n}\n';
            const result = await window.EditorPreload.download_ArduinoCode(import_code);
            console.log(result)
        }else{
  
        }
    };

    return (
        <div className={styles.toolbar}>
            <button
                className={styles.iconButton}
                onClick={handleDownload}
            >
                <img 
                    src={runIcon} 
                    className={styles.iconImage}
                />
            </button>

            <div className={styles.rightButtons}>
                <button
                    className={classNames(styles.iconButton1, styles.bt1)}
                    onClick={() => onChangeLayout('split')}
                    data-active={layout === 'split'}
                >
                    <img
                        className={classNames(styles.stageIcon, layout !== 'split' && styles.iconGray)}
                        src={smallStageIcon()}
                        draggable={false}
                    />
                </button>

                <button
                    className={classNames(styles.iconButton1, styles.bt2)}
                    onClick={() => onChangeLayout('full')}
                    data-active={layout === 'full'}
                >
                    <img
                        className={classNames(styles.stageIcon, layout !== 'full' && styles.iconGray)}
                        src={fullStageIcon() }
                        draggable={false}
                    />
                </button>
            </div>
        </div>
    );
};

export default UploadCodeToolbar;
