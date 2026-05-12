// 下载进度窗口
import React, { useEffect, useState } from 'react';
import styles from './flash-modal.css';
import {FormattedMessage, injectIntl} from 'react-intl';

const FlashModal = () => {
    const [visible, setVisible] = useState(false);

    // 当前位于的阶段（未来arduino可扩展）
    const [stage, setStage] = useState('flashing');
    const [progress, setProgress] = useState(0);
    
    const [error, setError] = useState(null);// 错误对象
    const [copied, setCopied] = useState(false);// 复制状态

    useEffect(() => {
        // 进度更新
        const updateFlashProgress = (p) => {
            setVisible(true);
            setStage('flashing');
            setError(null);
            setProgress(p);
        };

        // 错误
        const showFlashError = (result) => {
            //console.log(result)
            if (result.type === "toast") {
                vm.runtime.ioDevices.toast.guiToast(
                    result.id,
                    result.error,
                    "error",
                    2500
                );
            }else{
                setVisible(true);
                setError(result.error);
            }
        };

        // 完成
        const hideFlashModal = () => {
            setTimeout(() => {
                setVisible(false);
                setProgress(0);
                setError(null);
                setCopied(false);
            }, 600);
        };


        const removeProgress = window.EditorPreload.onFlashProgress(updateFlashProgress);//进度
        const removeError = window.EditorPreload.onFlashError(showFlashError);//错误
        const removeDone = window.EditorPreload.onFlashDone(hideFlashModal);//结束

        return () => {
            removeProgress?.();
            removeError?.();
            removeDone?.();
        };
    }, []);

    // 复制错误
    const handleCopy = async () => {
        if (!error) return;
        try {
            await navigator.clipboard.writeText(
                `${error.id}\n${error.message}`
            );
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
            }, 1500);
        } catch (e) {
            console.error(e);
        }
    };

    if (!visible) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>

                {/* 顶部 */}
                <div className={styles.header}>
                    <div className={styles.left}>
                        <div className={styles.statusDot} />
                        <div className={styles.titleGroup}>
                            <div className={styles.title}>
                                {/* 共用的，后面如果修改此处的名称，直接新建不要修改原有的 */}
                                <FormattedMessage
                                    defaultMessage="Upload"
                                    id="python.editor.Tree.upload"
                                />
                            </div>
                            <div className={styles.subTitle}>
                                {stage === 'flashing' ? (
                                    <FormattedMessage
                                        id="upload.flash.uploading"
                                        defaultMessage="upload code..."
                                    />
                                ) : (
                                    <FormattedMessage
                                        id="upload.flash.compiling"
                                        defaultMessage="compiling..."
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.percentTop}>
                        {progress}%
                    </div>
                </div>

                {/* 主体 */}
                <div className={styles.body}>

                    {/* 进度条 */}
                    <div className={styles.progressWrapper}>
                        <div className={styles.progressBg}>
                            <div
                                className={styles.progressBar}
                                style={{
                                    width: `${progress}%`
                                }}
                            />
                        </div>
                    </div>

                    {/* 阶段 */}
                    {/* <div className={styles.stageText}>
                        {stage === 'flashing' &&
                            'Writing firmware to device'}
                    </div> */}

                </div>

                {/* 底部 */}
                <div className={styles.footer}>

                    {!error && (
                        <div className={styles.waitText}>
                            <FormattedMessage
                                defaultMessage="Please do not disconnect the device."
                                id="upload.flash.not-disconnect"
                            />
                            
                        </div>
                    )}

                    {error && (
                        <div className={styles.errorBox}>
                            <div className={styles.errorHeader}>
                                <div className={styles.errorTitle}>
                                    Error:
                                </div>

                                <button
                                    className={styles.copyBtn}
                                    onClick={handleCopy}
                                >
                                     {copied ? (
                                        <FormattedMessage
                                            id="upload.flash.copied"
                                            defaultMessage="Copied"
                                        />
                                    ) : (
                                        <FormattedMessage
                                            id="upload.flash.copy"
                                            defaultMessage="Copy"
                                        />
                                    )}
                                </button>
                            </div>

                            <div className={styles.errorContent}>
                                {error}
                            </div>
                        </div>
                        
                    )}
                    {error && (
                        <button
                            className={styles.closeBtn}
                            onClick={() => {
                                setVisible(false);
                                setProgress(0);
                                setError(null);
                            }}
                        >
                            Close
                        </button>
                     )}
                </div>
            </div>
        </div>
    );
};

export default FlashModal;