import React from 'react';
import useStore from '../../stores/useStore';
import styles from './Preview.css';

const Preview = () => {
    const {
        qrCodeUrl,
        serverUrl,
        isRunning,
        stopPreview
    } = useStore();

    if (!isRunning) {
        return null;
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(serverUrl);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={styles.qrPopup}>
            <button
                className={styles.closeBtn}
                onClick={stopPreview}
            >
                ×
            </button>

            <div className={styles.qrContainer}>
                {qrCodeUrl && (
                    <img
                        src={qrCodeUrl}
                        alt="QR"
                        className={styles.qrCode}
                    />
                )}
            </div>

            <button
                className={styles.copyBtn}
                onClick={handleCopy}
            >
                Copy URL
            </button>
        </div>
    );
};

export default Preview;