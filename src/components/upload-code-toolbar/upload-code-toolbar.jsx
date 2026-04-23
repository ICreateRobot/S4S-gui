import React from 'react';
import styles from './upload-code-toolbar.css';
import classNames from 'classnames';
import { connect } from 'react-redux';
import runIcon from './run-icon.svg'; // 运行图片
import downIcon from './down-icon.svg'; // 下载图片

import lockIcon from './padlock.svg'; // 锁定图片
import unlockIcon from './padlock-unlock.svg'; // 解锁图片

import exportIcon from './export.svg'; // 导出图片

import formatMessage  from 'format-message';


import codeModule from '../../../../../utils/global.js'


import fullStageIcon from '!../../lib/tw-recolor/build!./icon--full-stage.svg';
import smallStageIcon from '!../../lib/tw-recolor/build!./icon--small-stage.svg';
import modelFullStageIcon from '!../../lib/tw-recolor/build!./icon--model-stage.svg';


const UploadCodeToolbar = ({ generatedCode,device,layout,onChangeLayout,isLocked,onToggleLock,vm }) => {

    //下载
    const handleDownload = async () => {
        if(device == "Microbit"){
            //let packageList = parsePythonImports(finalCode)
            //console.log(packageList)

            const result = await window.EditorPreload.usbdownloadCode( generatedCode);
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
            const result = await window.EditorPreload.mBUsbRunCode( generatedCode);
            console.log(result) 
        }else if(device == "ESP32"){
         
        }else if(device == "Arduino"){
           
        }else{
  
        }
    };

    //锁定/解锁
    const handleLock = async () => {
        if(isLocked && device){
            const result = confirm(formatMessage({
                id: 'gui.alert.confirmUnlock',
                defaultMessage: 'Unlocking will discard unsaved code. Continue?',//"解除锁定将丢失未保存代码，是否继续？"
            }));

            if (!result) return;

            //模拟一次事件，强制更新代码
            window.forceGenerateCode?.();

            // 用户确认后再提示是否保存
            // const needSave = confirm("是否需要先导出代码？");

            // if (needSave) {
            //     handleExport();
            // }
        }
        onToggleLock();
    };

    //导出
    const handleExport = async () => {
        if (!device)  return; // 没有选中设备时不导出

        let code = generatedCode || "";
        let fileName = "";

        // 根据设备处理代码
        if (device === "Microbit" || device === "ESP32") {
            fileName = device+".py";
        } else if (device === "Arduino") {
            fileName = device+".ino";
        }

        // 创建文件
        const blob = new Blob([code], { type: "text/plain;charset=utf-8;" });

        // 创建下载链接
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        //showToast("导出成功:"+fileName);//突然不想加这个提示功能了，麻烦
    };


    // 警告窗口（未来有时间统一）
    const showToast = (msg) => {
        const t = document.createElement("div");
        Object.assign(t.style, {
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#333",
        color: "#fff",
        padding: "8px 14px",
        borderRadius: "6px",
        zIndex: 9999,
        });
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    };
    

    return (
        <div className={styles.toolbar}>

            {/* 运行与下载 */}
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

                {/* 锁定按钮 */}
                <button
                    className={classNames(styles.iconButton1, styles.lockBtn)}
                    onClick={handleLock}
                    data-active={isLocked}
                >
                    <img
                        className={styles.stageIcon_lock}
                        src={isLocked ? lockIcon : unlockIcon}
                        draggable={false}
                    />
                </button>

                {/* 导出按钮 */}
                <button
                    className={classNames(styles.iconButton1, styles.lockBtn)}
                    onClick={handleExport}
                >
                    <img
                        className={styles.stageIcon_export}
                        src={exportIcon}
                        draggable={false}
                    />
                </button>

                {/* 布局模式按钮 */}
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
