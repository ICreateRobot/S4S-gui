//警告窗口
import React, { useEffect, useState, useRef } from 'react';
import styles from './toast.css';
import formatMessage from 'format-message';

const Toast = () => {

    const [toast, setToast] = useState(null);

    // 是否正在显示
    const showingRef = useRef(false);

    useEffect(() => {

        const handleToast = (e) => {

            // 已有 toast 显示中
            if (showingRef.current) return;

            showingRef.current = true;

            const {
                id,
                message,
                type = 'info',
                time = 2000
            } = e.detail;

            // 优先使用国际化 id
            let text = message || '';
            if (id === '001') {//请连接设备
                text = formatMessage({
                    id: 'gui.toast.error.001',
                    default: "unconnected device"
                });
            }else if (id === '002') {//设备不在线，无法执行操作
                text = formatMessage({
                    id: 'gui.toast.error.002',
                    default: "Device is offline, unable to perform the operation."
                });
            }
            setToast({ text, type });

            setTimeout(() => {
                setToast(null);
                showingRef.current = false;
            }, time);
        };

        window.addEventListener(
            'gui-toast',
            handleToast
        );

        return () => {
            window.removeEventListener(
                'gui-toast',
                handleToast
            );
        };

    }, []);

    if (!toast) return null;

    return (
        <div className={styles.wrapper}>
            <div
                className={`${styles.toast} ${styles[toast.type]}`}
            >
                {toast.text}
            </div>
        </div>
    );
};

export default Toast;