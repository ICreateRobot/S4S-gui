import React, { useEffect, useRef, useState } from 'react';
import styles from './SerialMonitor.module.css';
import {FormattedMessage,injectIntl} from 'react-intl';
import { connect } from 'react-redux';

import * as serial from '../connect-modal/serial.js';
import { setSerialToolConnection } from '../../reducers/device-connection'; 

const MAX_LINES = 800;

const SerialMonitor = ({ device, intl , deviceConnection,serialToolConnection, dispatch}) => {
  const scrollRef = useRef(null);
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState('');

  // 串口
  const [ports,setPorts]=useState([]);
  const [port,setPort]=useState('');
  // const [connected,setConnected]=useState(false);

  const [serialEnabled, setSerialEnabled] = useState(false);
  const connected =
    device === 'ESP32'
        ? (
            deviceConnection.connected &&
            deviceConnection.mode === 'serial'
                ? true
                : serialToolConnection.connected
          )
        : (
            deviceConnection.connected &&
            deviceConnection.mode === 'serial'
          );
  const canChangeBaudRate = connected;
  const canSend = connected;

  // 参数
  const [baudRate,setBaudRate]=useState("115200");
  const [lineEnding,setLineEnding]=useState("CRLF");
  const [autoScroll,setAutoScroll]=useState(true);
  
  /* ================= 串口数据接收 ================= */
  useEffect(() => {
    if (!window.EditorPreload?.onSerialReturn) return;

    const unsubscribe = window.EditorPreload.onSerialReturn(text => {
        setLines(prev => {
            // 当前收到的数据直接加入
            const next = [...prev];

            // 按换行拆开
            const arr = text.split(/\r\n|\n|\r/);

            arr.forEach((item, index) => {
                if (index === 0) {
                    // 第一段追加到当前最后一行
                    if (next.length > 0) {
                        next[next.length - 1] += item;
                    } else {
                        next.push(item);
                    }
                } else {
                    next.push(item);// 遇到换行，新建一行
                }
            });

            return next.length > MAX_LINES
                ? next.slice(next.length - MAX_LINES)
                : next;
        });
    });

    return () => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    };
  }, []);

  //自动换行的方案（直接使用接收数据切换换行）
  // useEffect(() => {
  //   if (!window.EditorPreload?.onSerialReturn) return;

  //   const unsubscribe = window.EditorPreload.onSerialReturn(text => {
  //     setLines(prev => {
  //       const next = [...prev, text];
  //       return next.length > MAX_LINES
  //         ? next.slice(next.length - MAX_LINES)
  //         : next;
  //     });
  //   });

  //   // 卸载
  //   return () => {
  //     if (typeof unsubscribe === 'function') {
  //       unsubscribe();
  //     }
  //   };
  // }, []);

  /* ================= 根据设备决定是否允许连接串口 ================= */
  useEffect(() => {
    if (!connected) {//重置
        setBaudRate("115200");
    }

    let enable = false;
    
     // ESP32只有非串口连接时才允许串口工具
    if (device === 'ESP32') {
        if( deviceConnection.connected && deviceConnection.mode === 'serial' ){
            enable = false;
        }else{
            enable = true;
        }
    }

    setSerialEnabled(enable);

    // Arduino Microbit
    if(device !== 'ESP32'){
      if ( deviceConnection.connected && deviceConnection.mode === 'serial' ) {
          const comPort = deviceConnection.info?.comPort || '';
          //setPorts([comPort]);
          setPorts([
              {
                  comPort: comPort,
                  name: comPort
              }
          ]);
          setPort(comPort);
      } else {
          setPorts([]);
          setPort('');
      }
      return;
    }

     // ESP32
    if(enable){
        // 从串口工具状态恢复
        if(serialToolConnection.connected){
            const comPort =serialToolConnection.info?.comPort || '';
            setPorts([
                {
                    comPort,
                    name:comPort
                }
            ]);
            setPort(comPort);
        }
    }else{
        setPorts([]);
        setPort('');
    }
  }, [device, deviceConnection,serialToolConnection]);


  /* ================= 自动滚动 ================= */
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines,autoScroll]);


  /* ================= 点击下拉扫描 ================= */
  const handlePortFocus = async()=>{
    if(!serialEnabled) return;

    try {
        const list = await serial.scan("ESP32");
        //console.log("扫描结果", list);
        setPorts(list || []);
    } catch(err){
        console.error("串口扫描失败",err);
        setPorts([]);
    }
  };

  /* ================= 连接 ================= */
  const handleConnect = async()=>{
    if(!serialEnabled) return;

    //断开串口
    if(connected){
        try {
          await serial.disconnect_silent?.();
        } catch(err){
          console.error("串口断开失败",err);
        }
        dispatch(setSerialToolConnection({
            connected:false,
            info:null
        }));
        return;
    }

    //未选择
    if(!port){
        return;
    }

    const target = ports.find(
        item=>item.comPort === port
    );

    const info = await serial.connect(target,"ESP32","upload");

    // 保存到全局 Redux
    dispatch(setSerialToolConnection({
      connected: true, 
      info
    }));
    
  }; 


  /* ================= 发送 ================= */
  const handleSend = () => {
    if (!input.trim()) return;

    const ending = getLineEnding();
    //window.EditorPreload?.sendSerialCommand?.(input + '\n',device);
    console.log(device)
    window.EditorPreload?.sendSerialCommand?.(input + ending,device);

    setLines(prev => {
        return [
            ...prev,
            `> ${input}`,
            ''
        ];
    });

    setInput('');
  };

  /* ================= 清空 ================= */
  const handleClear = () => {
    setLines([]);
  };

  /* ================= 切换波特率 ================= */
  const handleBaudRateChange = async (rate) => {
    if (!connected) return;
    setBaudRate(rate);

    await window.EditorPreload.sendBaudRateChange(rate);
  };

  /* ================= 获取行结束符 ================= */
  const getLineEnding = () => {
    switch(lineEnding) {
        case 'LF':
            return '\n';
        case 'CR':
            return '\r';
        case 'CRLF':
            return '\r\n';
        case 'None':
        default:
            return '';
    }
  };

  return (
    <div className={styles.wrapper}>

      {/* 参数区域 */}
      <div className={styles.toolbar}>
        <div className={styles.leftTools}>

            {/* <span className={styles.label}>串口</span> */}
            <select
                className={styles.select}
                value={port}
                disabled={!serialEnabled || connected}
                onClick={handlePortFocus}
                onChange={e => setPort(e.target.value)}
            >
                <option value="">
                    {intl.formatMessage({
                        id: 'gui.serial.PleaseSelect',
                        defaultMessage: 'Select'
                    })}
                </option>
                {ports.map(p => (
                    <option
                        key={p.comPort}
                        value={p.comPort}
                    >
                        {p.name}
                    </option>
                ))}
            </select>

            <button
                className={connected ? styles.disconnect : styles.connect}
                onClick={handleConnect}
                disabled={!serialEnabled}
            >
                {/* {connected ? '断开' : '连接'} */}
                <FormattedMessage
                    id={connected ? "gui.connectModal.disconnect" : "gui.connectModal.connect"}
                    defaultMessage={connected ? "Disconnect" : "Connect"}
                />
            </button>

            {/* <span className={styles.label}>波特率</span> */}
            <select
                className={styles.smallSelect}
                value={baudRate}
                disabled={!canChangeBaudRate}
                onChange={e => handleBaudRateChange(e.target.value)}
            >
                {[9600,14400,19200,28800,31250,57600,115200]
                    .map(v => (
                        <option key={v}>{v}</option>
                    ))
                }
            </select>
        </div>

        <div className={styles.rightTools}>
            <label className={styles.checkItem}>
                <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={e => setAutoScroll(e.target.checked)}
                />
                <FormattedMessage
                    id="gui.serial.autoScroll"
                    defaultMessage="Auto Scroll"
                />
            </label>
            <button
                className={styles.clearBtn}
                onClick={handleClear}
                // title="清空"
            />
        </div>
      </div>


      {/* 输出区 */}
      <div ref={scrollRef} className={styles.output}>
        {/* {lines.length === 0 && (
          <div className={styles.placeholder}>暂无串口数据</div>
        )} */}

        {lines.map((line, i) => (
          <div
            key={i}
            className={
              line.startsWith('>')
                ? styles.tx
                : styles.rx
            }
          >
            {line}
          </div>
        ))}
      </div>

      {/* 输入区 */}
      <div className={styles.inputBar}>
          <input
              className={styles.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={intl.formatMessage({
                  id: 'gui.serial.input',
                  defaultMessage: 'please input'
              })}
          />

          <select
              className={styles.endingSelect}
              value={lineEnding}
              onChange={e => setLineEnding(e.target.value)}
          >
              <option value="None">None</option>
              <option value="LF">\n</option>
              <option value="CR">\r</option>
              <option value="CRLF">\r\n</option>
          </select>

          <button
              className={styles.sendBtn}
              disabled={!canSend}
              onClick={handleSend}
          >
              <FormattedMessage
                  defaultMessage="Send"
                  id="sendMonitior"
              />
          </button>

      </div>
    </div>
  );
};



// Redux 连接
const mapStateToProps = (state) => ({
  deviceConnection: state.scratchGui.deviceConnectionState.device,
  serialToolConnection: state.scratchGui.deviceConnectionState.serialTool
});

export default connect(mapStateToProps)(injectIntl(SerialMonitor));



