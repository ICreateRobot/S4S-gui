import React, { useState } from 'react';
import useStore from '../../stores/useStore';

import size1Img from '../../assets/screen1.svg';
import size2Img from '../../assets/screen2.svg';
import size3Img from '../../assets/screen3.svg';
import size4Img from '../../assets/screen4.svg';
import clearImg from '../../assets/clear.svg';
import QRImg from '../../assets/QR.svg';

import styles from './Header.css';

function Header() {
    const { 
        updateScreenSize,
        selectedComponent, //当前选中的组件
        clearComponents, //清理组件

    } = useStore();

    const [customWidth, setCustomWidth] = useState('640');
    const [customHeight, setCustomHeight] = useState('480');

    const [selectedMode, setSelectedMode] = useState('Medium');
    
    
    //设置尺寸
    const handlePresetSelect = (width, height, name) => {
        setSelectedMode(name);

        updateScreenSize({
            width,
            height,
            name
        });
    };

    //自定义值修改
    const handleCustomChange = (type, value) => {
        const num = clamp(Number(value));

        if (type === 'width') {
            setCustomWidth(num);
            applySize(num, customHeight);
        } else {
            setCustomHeight(num);
            applySize(customWidth, num);
        }
    };

    const applySize = (w, h) => {
        updateScreenSize({
            width: Number(w),
            height: Number(h),
            name: `Custom (${w}x${h})`
        });
    };

    //限制输入范围
    const clamp = (val) => {
        const num = Number(val);
        if (Number.isNaN(num)) return '';
        return Math.min(2000, Math.max(0, num)); // 顺便限制最小100
    };

    const handleCustomApply = () => {
        updateScreenSize({
            width: Number(customWidth),
            height: Number(customHeight),
            name: `Custom (${customWidth}x${customHeight})`
        });
    };
    
    //清理
    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear all components?')) {
            clearComponents();
        }
    };

    return (
        <div className={styles.header}>
            {/* 左侧 */}
            <div className={styles.leftTools}>
                <button
                    className={`${styles.iconBtn} ${
                        selectedMode === 'Large' ? styles.active : ''
                    }`}
                    onClick={() =>
                        handlePresetSelect(1024, 768, 'Large')
                    }
                >
                    <img src={size1Img} alt="" />
                </button>

                <button
                    className={`${styles.iconBtn} ${
                        selectedMode === 'Medium' ? styles.active : ''
                    }`}
                    onClick={() =>
                        handlePresetSelect(640, 480, 'Medium')
                    }
                >
                    <img src={size2Img} alt="" />
                </button>

                <button
                    className={`${styles.iconBtn} ${
                        selectedMode === 'Small' ? styles.active : ''
                    }`}
                    onClick={() =>
                        handlePresetSelect(375, 667, 'Small')
                    }
                >
                    <img src={size3Img} alt="" />
                </button>

                <button
                    className={`${styles.iconBtn} ${
                        selectedMode === 'Custom' ? styles.active : ''
                    }`}
                    onClick={() => {
                        setSelectedMode('Custom');
                        handleCustomApply();
                    }}
                >
                    <img src={size4Img} alt="" />
                </button>

                {selectedMode === 'Custom' && (
                    <div className={styles.customPanel}>
                        <input
                            className={styles.customInput}
                            type="number"
                            value={customWidth}
                            onChange={e => handleCustomChange('width', e.target.value)}
                            max={2000}
                            min={0}
                        />

                        <span>×</span>

                        <input
                            className={styles.customInput}
                            type="number"
                            value={customHeight}
                            onChange={e => handleCustomChange('height', e.target.value)}
                            max={2000}
                            min={0}
                        />

                        {/* <button 
                            className={styles.applyBtn}
                            onClick={handleCustomApply}
                            disabled={!customWidth || !customHeight}
                        >
                        应用
                        </button> */}
                    </div>
                )}
            </div>

            {/* 右侧 */}
            <div className={styles.rightTools}>
                {/* <button className={styles.placeholderBtn}></button>
                <button className={styles.placeholderBtn}></button>
                <button className={styles.placeholderBtn}></button>
                <button className={styles.placeholderBtn}></button>
                <button className={styles.placeholderBtn}></button> */}

                <button
                    className={styles.qrBtn}
                    onClick={() => useStore.getState().generatePreview(true) }
                >
                    <img src={QRImg} alt="" />
                </button>
                <button
                    className={styles.runBtn}
                    onClick={() => useStore.getState().generatePreview(false) }
                >
                    ▶
                </button>
                <button
                    className={styles.clearBtn}
                    onClick={() => handleClear()}
                >
                    <img src={clearImg} alt="" />
                </button>
            </div>
        </div>
    );
}

export default Header;