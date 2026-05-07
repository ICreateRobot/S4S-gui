import React, { useEffect, useState } from 'react';
import styles from './flash-modal.css';

const FlashModal = () => {

    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {

        // 进度
        const updateFlashProgress = (p) => {
            setVisible(true);
            setError('');
            setProgress(p);
        };

        // 错误
        const showFlashError = (msg) => {
            setVisible(true);
            setError(msg);
        };

        // 完成
        const hideFlashModal = () => {
            setTimeout(() => {
                setVisible(false);
                setProgress(0);
                setError('');
            }, 500);
        };

        window.EditorPreload.onFlashProgress(updateFlashProgress);
        window.EditorPreload.onFlashError(showFlashError);
        window.EditorPreload.onFlashDone(hideFlashModal);

    }, []);

    if (!visible) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.box}>

                <div className={styles.title}>
                    {error ? 'ERROR' : 'Downloading Firmware...'}
                </div>

                <div className={styles.progressBg}>
                    <div
                        className={styles.progressBar}
                        style={{
                            width: `${progress}%`,
                            background: error ? '#ff3333' : undefined
                        }}
                    />
                </div>

                <div className={styles.percent}>
                    {progress}%
                </div>

                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                {error && (
                    <button
                        className={styles.closeBtn}
                        onClick={() => setVisible(false)}
                    >
                        Close
                    </button>
                )}

            </div>
        </div>
    );
};

export default FlashModal;