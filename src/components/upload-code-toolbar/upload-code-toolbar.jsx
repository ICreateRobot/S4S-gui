import React , { useState } from 'react';
import {FormattedMessage, injectIntl} from 'react-intl';
import styles from './upload-code-toolbar.css';
import classNames from 'classnames';
import { connect } from 'react-redux';
import runIcon from './run-icon.svg'; // 运行图片
import downIcon from './down-icon.svg'; // 下载图片
import stopIcon from './icon--stop-all.svg'; // 停止图片

import lockIcon from './padlock.svg'; // 锁定图片
import unlockIcon from './padlock-unlock.svg'; // 解锁图片

import exportIcon from './export.svg'; // 导出图片

import formatMessage  from 'format-message';

import codeModule from '../../../../../utils/global.js'

import fullStageIcon from '!../../lib/tw-recolor/build!./icon--full-stage.svg';
import smallStageIcon from '!../../lib/tw-recolor/build!./icon--small-stage.svg';
import modelFullStageIcon from '!../../lib/tw-recolor/build!./icon--model-stage.svg';

import { run, upload } from "../connect-modal/wifi.js"


const UploadCodeToolbar = ({ generatedCode,device,layout,onChangeLayout,isLocked,onToggleLock,vm,intl}) => {
    const [isRunning, setIsRunning] = useState(false);//运行状态
    const [runLoading, setRunLoading] = useState(false);//esp32运行时需要禁止重复操一会，给与开关机的时间

    const [slot, setSlot] = useState(1);//坑位
    const [projectName, setProjectName] = useState("Project");//项目

    function transformPythonCode(pythonCode) {
        const lines = pythonCode.split(/\r?\n/);
    
        const result = [];
    
        // 保存 import
        const importLines = [];
    
        // 保存顶层变量定义
        const variableLines = [];
    
        // 保存顶层函数定义及完整函数体
        const functionBlocks = [];
    
        // 保存需要移动到 main 的代码
        const mainLines = [];
    
        // 所有顶层变量名
        const variableNames = new Set();
    
        /**
         * 获取一行的缩进空格数
         */
        function getIndent(line) {
            const match = line.match(/^[ \t]*/);
            if (!match) return 0;
    
            // 一个 tab 按 4 个空格计算
            return match[0].replace(/\t/g, '    ').length;
        }
    
        /**
         * 判断是否是 import
         */
        function isImportLine(line) {
            const trimmed = line.trim();
    
            return (
                trimmed.startsWith('import ') ||
                trimmed.startsWith('from ')
            );
        }
    
        /**
         * 判断是否是函数定义
         */
        function isFunctionDefinition(line) {
            const trimmed = line.trim();
    
            return (
                trimmed.startsWith('def ') ||
                trimmed.startsWith('async def ')
            );
        }
    
        /**
         * 判断是否是顶层变量定义
         *
         * 这里只判断最简单的：
         *
         * a = 1
         * a = xxx()
         * a += 1
         *
         * 不处理函数内部变量，因为这里只在顶层调用。
         */
        function isVariableDefinition(line) {
            const trimmed = line.trim();
    
            if (!trimmed) {
                return false;
            }
    
            if (trimmed.startsWith('#')) {
                return false;
            }
    
            if (
                trimmed.startsWith('import ') ||
                trimmed.startsWith('from ') ||
                trimmed.startsWith('def ') ||
                trimmed.startsWith('async def ') ||
                trimmed.startsWith('class ')
            ) {
                return false;
            }
    
            /*
             * 匹配：
             *
             * a = ...
             * a += ...
             * a -= ...
             * a *= ...
             * a /= ...
             * a %= ...
             *
             * 以及：
             *
             * a, b = ...
             */
            return /^[A-Za-z_][A-Za-z0-9_]*(?:\s*,\s*[A-Za-z_][A-Za-z0-9_]*)*\s*(?:=|\+=|-=|\*=|\/=|%=)(?!=)/.test(trimmed);
        }
    
        /**
         * 从变量定义中提取变量名
         *
         * 例如：
         *
         * a = 1
         *
         * => ["a"]
         *
         * a, b = 1, 2
         *
         * => ["a", "b"]
         */
        function extractVariableNames(line) {
            const trimmed = line.trim();
    
            const match = trimmed.match(
                /^([A-Za-z_][A-Za-z0-9_]*(?:\s*,\s*[A-Za-z_][A-Za-z0-9_]*)*)\s*(?:=|\+=|-=|\*=|\/=|%=)/
            );
    
            if (!match) {
                return [];
            }
    
            return match[1]
                .split(',')
                .map(name => name.trim())
                .filter(Boolean);
        }
    
        /**
         * 获取完整的函数定义
         *
         * 例如：
         *
         * def test():
         *     a = 1
         *     if a:
         *         print(a)
         *
         * 会完整保留下来。
         */
        function collectFunctionBlock(startIndex) {
            const block = [];
    
            const firstLine = lines[startIndex];
            const baseIndent = getIndent(firstLine);
    
            block.push(firstLine);
    
            let i = startIndex + 1;
    
            while (i < lines.length) {
                const line = lines[i];
    
                // 函数中的空行也属于函数
                if (line.trim() === '') {
                    block.push(line);
                    i++;
                    continue;
                }
    
                const currentIndent = getIndent(line);
    
                /*
                 * 当前行缩进 <= def 的缩进
                 * 说明函数已经结束
                 */
                if (currentIndent <= baseIndent) {
                    break;
                }
    
                block.push(line);
                i++;
            }
    
            return {
                block,
                nextIndex: i
            };
        }
    
        /*
         * 开始逐行处理
         */
        let i = 0;
    
        while (i < lines.length) {
            const line = lines[i];
    
            /*
             * 空行
             *
             * 空行这里暂时也放入 main。
             * 后面可以根据需要进一步优化。
             */
            if (line.trim() === '') {
                mainLines.push('');
                i++;
                continue;
            }
    
            /*
             * 只处理顶层内容
             *
             * 有缩进的代码不应该被当成变量/import/函数。
             */
            const indent = getIndent(line);
    
            /*
             * import
             */
            if (indent === 0 && isImportLine(line)) {
                importLines.push(line);
                i++;
                continue;
            }
    
            /*
             * 顶层函数
             */
            if (indent === 0 && isFunctionDefinition(line)) {
                const functionResult = collectFunctionBlock(i);
    
                functionBlocks.push(functionResult.block);
    
                i = functionResult.nextIndex;
                continue;
            }
    
            /*
             * 顶层变量定义
             *
             * 注意：
             * 这里变量定义不会进入 main。
             *
             * 例如：
             *
             * my_variable = 0
             *
             * 仍然留在原位置。
             */
            if (indent === 0 && isVariableDefinition(line)) {
                variableLines.push(line);
    
                const names = extractVariableNames(line);
    
                for (const name of names) {
                    variableNames.add(name);
                }
    
                i++;
                continue;
            }
    
            /*
             * 其他所有代码进入 main
             *
             * 原来的缩进完全保留，
             * 只在最前面增加 4 个空格。
             */
            mainLines.push('    ' + line);
    
            i++;
        }
    
        /*
         * =====================================================
         * 开始重新组合
         * =====================================================
         */
    
        /*
         * 1. import
         */
        result.push(...importLines);
    
        if (importLines.length > 0) {
            result.push('');
        }
    
        /*
         * 2. 顶层变量定义
         *
         * 注意：
         * 变量定义仍然在 main 外面。
         */
        result.push(...variableLines);
    
        if (variableLines.length > 0) {
            result.push('');
        }
    
        /*
         * 3. 顶层函数定义
         */
        for (let i = 0; i < functionBlocks.length; i++) {
            result.push(...functionBlocks[i]);
    
            if (i < functionBlocks.length - 1) {
                result.push('');
            }
        }
    
        if (functionBlocks.length > 0) {
            result.push('');
        }
    
        /*
         * 4. main
         */
        result.push('async def main():');
    
        /*
         * global 必须放在 main 的最前面。
         *
         * 但是变量本身的定义不移动。
         */
        if (variableNames.size > 0) {
            result.push(
                '    global ' + Array.from(variableNames).join(', ')
            );
        }
    
        /*
         * main 里的实际代码
         */
        if (mainLines.length > 0) {
            result.push('');
    
            result.push(...mainLines);
        }
    
        /*
         * 注意：
         *
         * 这里故意没有：
         *
         * asyncio.run(main())
         *
         * 因为你的运行环境会自己调用 main。
         */
    
        return result.join('\n');
    }
    //下载
    const handleDownload = async () => {
        if(device == "Microbit"){
            //let packageList = parsePythonImports(finalCode)
            //console.log(packageList)

            const result = await window.EditorPreload.usbdownloadCode( generatedCode,device);
            console.log(result) 
        }else if(device == "ESP32"){
            //console.log(slot,projectName+".py")
            if (!vm.runtime.connKey) {
                vm.runtime.ioDevices.toast.guiToast("001", "请连接设备", 'error', 2000);
                return;
            }
            // 正在执行，直接忽略
            if (runLoading) return;
            setRunLoading(true);
            try {

                const code = transformPythonCode(generatedCode)
                const result = await upload(vm.runtime.connKey, code, slot, projectName+".py");//

                // 正常(设备会重启，所以直接断开)
                if (result.code === 203) {
                    vm.runtime.ioDevices.toast.guiToast("201", "", 'success', 2000);
                    // 通知 GUI 清除连接
                    //vm.runtime.emit("WIFI_DEVICE_DISCONNECTED");
                }else{//其他异常一并处理
                    vm.runtime.ioDevices.toast.guiToast("002", "请检测设备是否在线，链接码是否正确", 'error', 2000);

                    // 通知 GUI 清除连接
                    vm.runtime.emit("WIFI_DEVICE_DISCONNECTED");

                    return;
                }
            } finally {
                // 5秒后允许再次点击
                setTimeout(() => {
                    setRunLoading(false);
                }, 5000);
            }
        }else if(device == "Arduino"){
            //let import_code='#include "TinkerCode.h"\nvoid app_setup(){\n  pinMode(A0 , OUTPUT);\n}\nvoid app_loop(){\ndigitalWrite(A0,HIGH);\ndelay(1000);\ndigitalWrite(A0,LOW);\ndelay(1000);\n}\n';//
            const result = await window.EditorPreload.download_ArduinoCode(generatedCode);
            console.log(result)
        }
    };


    //运行(不持久化)
    const handleRun = async () => {
        // 当前是运行状态 -> 点击停止
        if (isRunning) {
            if (device === "Microbit") {
                await window.EditorPreload.mBUsbRunCode("");
                setIsRunning(false);
            }else if(device == "ESP32"){
                setIsRunning(false);
                return
                if (!vm.runtime.connKey) {
                    vm.runtime.ioDevices.toast.guiToast("001", "请连接设备", 'error', 2000);
                    return;
                }
                const result = await run(vm.runtime.connKey, " ");
                console.log(result)

                // 正常
                if (result.code === 202) {
                    
                }else{//其他异常一并处理
                    vm.runtime.ioDevices.toast.guiToast("002", "请检测设备是否在线，链接码是否正确", 'error', 2000);

                    // 通知 GUI 清除连接
                    vm.runtime.emit("WIFI_DEVICE_DISCONNECTED");

                    return;
                }
            }
        }else{
            if(device == "Microbit"){
                const result = await window.EditorPreload.mBUsbRunCode( generatedCode);
                //console.log(result) 
                setIsRunning(true);
            }else if(device == "ESP32"){
                if (!vm.runtime.connKey) {
                    vm.runtime.ioDevices.toast.guiToast("001", "请连接设备", 'error', 2000);
                    return;
                }
                // 正在执行，直接忽略
                if (runLoading) return;
                setRunLoading(true);
                try {
                    const code = transformPythonCode(generatedCode)
                    const result = await run(vm.runtime.connKey, code);
                    //console.log(result)
                    // 正常
                    if (result.code === 202) {
                        vm.runtime.ioDevices.toast.guiToast("201", "", 'success', 2000);
                    }else{//其他异常一并处理
                        vm.runtime.ioDevices.toast.guiToast("002", "请检测设备是否在线，链接码是否正确", 'error', 2000);

                        // 通知 GUI 清除连接
                        vm.runtime.emit("WIFI_DEVICE_DISCONNECTED");
                        return;
                    }
                } finally {
                    // 5秒后允许再次点击
                    setTimeout(() => {
                        setRunLoading(false);
                    }, 5000);
                }
            }   
        } 
    };

    //锁定/解锁
    const handleLock = async () => {
        if(isLocked && device){
            const result = confirm(
                intl.formatMessage({
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

    };

    return (
        <div className={styles.toolbar}>

            {/* 运行与下载 */}
            {device && device !== "Arduino" && (
                <button
                    className={styles.iconButton}
                    onClick={handleRun}
                    disabled={runLoading}
                >
                    <img 
                        src={isRunning ? stopIcon : runIcon}
                        className={styles.iconImage}
                    />
                </button>
            )}

            {device && (
                <button
                    className={styles.iconButton}
                    onClick={handleDownload}
                    disabled={runLoading}
                >
                    <img 
                        src={downIcon} 
                        className={styles.iconImage}
                    />
                </button>
            )}

             {/* 程序信息 坑位 */}
            {device === "ESP32" && (
                <div className={styles.programGroup}>
                    <select
                        className={styles.programSelect}
                        value={slot}
                        onChange={e => setSlot(Number(e.target.value))}
                    >
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <option key={i} value={i}>
                                {i}
                            </option>
                        ))}
                    </select>

                    <input
                        className={styles.projectInput}
                        value={projectName}
                        onChange={e => setProjectName(e.target.value)}
                        placeholder={intl.formatMessage({
                            id: 'developers.projectsTitle',
                            defaultMessage: 'Project'
                        })}
                    />
                </div>
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
export default injectIntl(connect(
    mapStateToProps
)(UploadCodeToolbar));


//export default UploadCodeToolbar;
