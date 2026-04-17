import React from 'react';
import styles from './upload-code-toolbar.css';
import classNames from 'classnames';
import { connect } from 'react-redux';
import runIcon from './run-icon.svg'; // 运行图片
import downIcon from './down-icon.svg'; // 下载图片
import codeModule from '../../../../../utils/global.js'


import fullStageIcon from '!../../lib/tw-recolor/build!./icon--full-stage.svg';
import smallStageIcon from '!../../lib/tw-recolor/build!./icon--small-stage.svg';
import modelFullStageIcon from '!../../lib/tw-recolor/build!./icon--model-stage.svg';


const UploadCodeToolbar = ({ generatedCode,device,layout, onChangeLayout }) => {

    //下载
    const handleDownload = async () => {
        if(device == "Microbit"){
            let import_code = 'from microbit import *\nfrom s4s import *\n';
            let finalCode = import_code + generatedCode;

            //let packageList = parsePythonImports(finalCode)
            
            //console.log(packageList)

            const result = await window.EditorPreload.usbdownloadCode( finalCode);
            console.log(result) 
        }else if(device == "ESP32"){
         
        }else if(device == "Arduino"){
            let import_code='#include "Arduino.h"\nvoid setup(){\n  pinMode(A0 , OUTPUT);\n}\nvoid loop(){\ndigitalWrite(A0,HIGH);\ndelay(1000);\ndigitalWrite(A0,LOW);\ndelay(1000);\n}\n';
            const result = await window.EditorPreload.download_ArduinoCode(import_code);
            console.log(result)
        }else{
  
        }
    };

    //运行(不持久化)
    const handleRun = async () => {
        if(device == "Microbit"){
            let import_code='from microbit import *\nfrom s4s import *\n';
            const result = await window.EditorPreload.mBUsbRunCode(import_code + generatedCode);
            console.log(result) 
        }else if(device == "ESP32"){
         
        }else if(device == "Arduino"){
           
        }else{
  
        }
    };

    

    return (
        <div className={styles.toolbar}>
            {device && device !== "Arduino" && (
                <button
                    className={styles.iconButton}
                    onClick={handleRun}
                >
                    <img 
                        src={runIcon} 
                        className={styles.iconImage}
                    />
                </button>
            )}

            {device && (
                <button
                    className={styles.iconButton}
                    onClick={handleDownload}
                >
                    <img 
                        src={downIcon} 
                        className={styles.iconImage}
                    />
                </button>
            )}

            <div className={styles.rightButtons}>
                <button
                    className={classNames(styles.iconButton1, styles.bt0)}
                    onClick={() => {
                        onChangeLayout('model');
                        setTimeout(() => {
                            window.dispatchEvent(new Event('resize'));
                        }, 0);
                    }}
                    data-active={layout === 'model'}
                >
                    <img
                        className={classNames(styles.stageIcon, layout !== 'model' && styles.iconGray)}
                        src={modelFullStageIcon()}
                        draggable={false}
                    />
                </button>
                <button
                    className={classNames(styles.iconButton1, styles.bt1)}
                    onClick={() => {
                        onChangeLayout('split');
                        setTimeout(() => {
                            window.dispatchEvent(new Event('resize'));
                        }, 0);
                    }}
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


const mapStateToProps = state => ({
    generatedCode: state.scratchGui.sun.generatedCode
});
export default connect(
    mapStateToProps
)(UploadCodeToolbar);
//export default UploadCodeToolbar;
