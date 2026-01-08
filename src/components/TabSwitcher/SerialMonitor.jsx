import React, { useEffect, useRef, useState } from 'react';
import styles from './SerialMonitor.module.css';
import {FormattedMessage,injectIntl} from 'react-intl';

const MAX_LINES = 800;

const SerialMonitor = ({ device, intl }) => {
  const scrollRef = useRef(null);
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState('');

  /* ================= 串口数据接收 ================= */
  useEffect(() => {
    if (!window.EditorPreload?.onSerialReturn) return;

    const unsubscribe = window.EditorPreload.onSerialReturn(text => {
      setLines(prev => {
        const next = [...prev, text];
        return next.length > MAX_LINES
          ? next.slice(next.length - MAX_LINES)
          : next;
      });
    });

    // 卸载
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  /* ================= 自动滚动 ================= */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  /* ================= 发送 ================= */
  const handleSend = () => {
    if (!input.trim()) return;

    window.EditorPreload?.sendSerialCommand?.(input + '\n',"Microbit");

    setLines(prev => [...prev, `> ${input}`]);
    setInput('');
  };

  /* ================= 清空 ================= */
  const handleClear = () => {
    setLines([]);
  };

  return (
    <div className={styles.wrapper}>
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
          placeholder={intl.formatMessage({ id: 'gui.serial.input', defaultMessage: 'please input' })}//"请输入"
        />

        <button className={styles.sendBtn} onClick={handleSend}>
          
            <FormattedMessage
                defaultMessage="send"
                id="sendMonitior"
            />
        </button>

        <button className={styles.clearBtn} onClick={handleClear}>
        </button>
      </div>
    </div>
  );
};

export default injectIntl(SerialMonitor);
