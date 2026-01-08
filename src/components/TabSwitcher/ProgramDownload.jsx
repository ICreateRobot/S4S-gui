import React, {useEffect} from 'react';
import styles from './ProgramDownload.module.css'; 

import down from './down.svg'
import downRun from './downRun.svg'
import downIcon from '!../../lib/tw-recolor/build!./icon--down.svg';//

import MicrobitIMG from './Microbit.svg'
import ESP32IMG from './ESP32.svg'
import ARDUINOIMG from './ARDUINO.svg'
import defaultIMG from './default.svg'

import codeModule from '../../../../../utils/global.js'

const getDeviceImage = (device) => {
    switch (device) {
        case 'Microbit':
            return MicrobitIMG;
        case 'ESP32':
            return ESP32IMG;
        case 'Arduino':
            return ARDUINOIMG;
        default:
            return defaultIMG;
    }
};

// 程序下载页面
const ProgramDownload = ({device}) => {
    let deviceImage = getDeviceImage(device);
    
    useEffect(() => {
    
    }, []);
    
    const postDataToParent = async() =>{
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
    }

    return (
      <div className={styles.container}>
        <img draggable={false} className={styles.microbitImage} src={deviceImage}></img>

          {/* 下载 & 运行按钮 */}
          <div className={styles.buttonContainer}>
            <button
              className={styles.downloadButton}
              onClick={postDataToParent}
            >
              <img draggable={false} src={downIcon()}></img>
            </button>
          </div>
      </div>
    );
};

export default ProgramDownload;