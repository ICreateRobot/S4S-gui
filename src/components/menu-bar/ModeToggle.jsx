import React, { useState } from 'react';
// import {FormattedMessage} from 'react-intl';
import formatMessage  from 'format-message';

import { connect} from 'react-redux';
import { setSelectedMode } from '../../reducers/sun';


import interactiveImg from './images/interactive.svg';
import uploadImg from './images/upload.svg';
import pythonImg from './images/python.svg';
import { injectIntl } from 'react-intl';

import Tooltip from './Tooltip.jsx';//悬浮窗

const ModeToggle = ({ value, setIsLoading,device,setSelectedMode,newfile,deviceConnection,intl }) => {
    const modes = [
        { id: 'interactive', icon: interactiveImg, label:'互动' },
        { id: 'upload', icon: uploadImg,label:'下载'},
        { id: 'python', icon: pythonImg,label:'Python'}
    ];

    const getLeftPosition = () => {
        if (value === 'interactive') return '3px';
        if (value === 'upload') return 'calc(33.33% + 3px)';
        if (value === 'python') return 'calc(66.66% + 3px)';
    };

    const handleClick =  async (newMode)=> {
        console.log(deviceConnection,device)
        if ( newMode == value) return//同模式不切换

        vm.stopAll() //停止正在执行的所有脚本

        // if (value != "python"){//闪出确认弹窗
        //     let result = confirm( formatMessage({
        //         id: 'gui.alert.confirmchangemode',
        //         default: 'This operation will clear the workspace. Continue?',
        //         description: 'gui.alert.confirmchangemode'
        //     }));
    
        //     if (!result) return
        // }

        //arduino连接状态需要断开连接重新
        if (device == "Arduino" && deviceConnection.connected && newMode == "upload"){
            console.log("执行断开")
            // 创建全屏遮罩
            const loadingOverlay = createLoadingOverlay( formatMessage({
                id: 'gui.alert.changeModeDisSerial',
                default: "Please wait while switching mode. This will disconnect the board. So, please reconnect after switching.",
                description: 'gui.alert.changeModeDisSerial'
            }) );
            try{
                const result = await window.EditorPreload.serialDisconnect();
                if (!result || !result.success) {
                    throw new Error(result?.message || result?.error || "断开失败");
                }
                console.log("断开成功")
            }catch(e){

            }
            // 等待2秒后移除遮罩
            setTimeout(() => {
                loadingOverlay.remove();
            }, 2000);
        }

        setIsLoading(true);//出现加载页面

        await newfile(false)//直接走新建文件，清除不知名错误
        setSelectedMode(newMode);//更新模式
        
        await new Promise(r => setTimeout(r, 1000));//加钱就删的延时

        setIsLoading(false);
            
        if (newMode === 'python') return//下面的与python无关了

        if (newMode === 'interactive'){//切换到互动模式
            if(device === 'Microbit'){//应该还会判断是否连接，但是不管了,放主进程了
                window.EditorPreload.enterReplMode();//进入repl
            }
        }else  if (newMode === 'upload'){//切换到互动模式
            if(device === 'Microbit'){//
                window.EditorPreload.exitReplMode();//退出repl
            }
        }
    };


    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '150px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--ic-main-light-very)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                }}
            >
                {/* 滑块高亮背景 */}
                <div
                    style={{
                        position: 'absolute',
                        top: '3px',
                        left: getLeftPosition(),
                        width: 'calc(33.33% - 6px)',
                        height: '26px',
                        backgroundColor: 'var(--ic-main)',
                        borderRadius: '6px',
                        transition: 'all 0.3s ease',
                        zIndex: 1,
                    }}
                />

                {modes.map((mode) => (
                    <div
                        key={mode.id}
                        onClick={() => handleClick(mode.id)}
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            zIndex: 2,
                            color: value === mode.id ? '#000' : '#eee',
                            transition: 'color 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* {mode.label} */}
                        <Tooltip
                            text={intl.formatMessage({
                                id: `gui.tooltip.mode.${mode.id}`,
                                defaultMessage: mode.id === 'interactive' ? 'Interactive mode'
                                    : mode.id === 'upload' ? 'Upload mode'
                                    : 'Python Enviroment'
                            })}
                        >
                            <img
                                src={mode.icon}
                                // alt={mode.label}
                                style={{
                                    width: 20,
                                    height: 20,
                                    filter: value === mode.id ? 'none' : 'brightness(0.6)',
                                    transition: 'filter .2s',
                                }}
                            />
                        </Tooltip>
                    </div>
                   
                ))}
            </div>
        </div>
    );
};

// 从 Redux 获取状态
const mapStateToProps = (state) => ({
    selectedmode: state.scratchGui.sun.selectedmode,//统一管理的模式
    deviceConnection: state.scratchGui.deviceConnectionState
});

// 派发 Redux Action
const mapDispatchToProps = (dispatch) => ({
    setSelectedMode: (modeName) => dispatch(setSelectedMode(modeName))
});

// export default connect(mapStateToProps, mapDispatchToProps)(ModeToggle);
export default injectIntl(
  connect(mapStateToProps, mapDispatchToProps)(ModeToggle)
);




// Toast 提示组件(暂不使用，看看是否有需求提示断开)
const showToast = (msg) => {
    const t = document.createElement("div");
    Object.assign(t.style, {
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: "6px",
        zIndex: 9999,
        fontSize: "14px",
        fontWeight: "500",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        maxWidth: "400px",
        textAlign: "center",
        animation: "toastFadeIn 0.3s ease-out"
    });
    
    // 添加动画样式
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes toastFadeIn {
                from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    t.textContent = msg;
    document.body.appendChild(t);
    
    // 移除时添加淡出动画
    setTimeout(() => {
        t.style.transition = 'opacity 0.3s ease-out';
        t.style.opacity = '0';
        setTimeout(() => t.remove(), 300);
    }, 2000);
};

// 创建全屏遮罩
const createLoadingOverlay = (message) => {
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9998,
        backdropFilter: "blur(2px)"
    });
    
    const content = document.createElement("div");
    Object.assign(content.style, {
        backgroundColor: "#fff",
        padding: "30px 40px",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "200px",
        minHeight: "200px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
    });
    
    const spinner = document.createElement("div");
    Object.assign(spinner.style, {
        width: "40px",
        height: "40px",
        border: "4px solid #e0e0e0",
        borderTopColor: "#4D97FF",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "20px"
    });
    
    // 添加旋转动画
    if (!document.querySelector('#spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'spinner-styles';
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    const text = document.createElement("p");
    Object.assign(text.style, {
        margin: 0,
        color: "#333",
        fontSize: "16px",
        fontWeight: 500,
        textAlign: "center",
        lineHeight: 1.5
    });
    text.textContent = message;
    
    content.appendChild(spinner);
    content.appendChild(text);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    return overlay;
};