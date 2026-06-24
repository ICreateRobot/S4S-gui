import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import useStore from '../../stores/useStore.js';
import ComponentRenderer from './ComponentRenderer.jsx';
import AddedComponentsList from '../ComponentPanel/AddedComponentsList.jsx';
import styles from './Editor.css';

import gridIcon from '../../assets/icons/grid.svg';
import clearIcon from '../../assets/icons/clear.svg';
import alignLeftIcon from '../../assets/icons/align-left.svg';
import alignCenterIcon from '../../assets/icons/align-center.svg';
import alignRightIcon from '../../assets/icons/align-right.svg';
import alignTopIcon from '../../assets/icons/align-top.svg';
import alignMiddleIcon from '../../assets/icons/align-middle.svg';
import alignBottomIcon from '../../assets/icons/align-bottom.svg';
import guideHorizontalIcon from '../../assets/icons/guide-horizontal.svg';
import guideVerticalIcon from '../../assets/icons/guide-vertical.svg';
import lockIcon from '../../assets/icons/lock.svg';
import unlockIcon from '../../assets/icons/unlock.svg';
import deleteGuideIcon from '../../assets/icons/delete-guide.svg';
import runButton from '../../assets/icons/run.svg';

import { run } from "../../../connect-modal/wifi.js"

import {FormattedMessage, injectIntl} from 'react-intl';

const ResponsiveGridLayout = WidthProvider(Responsive);

const Editor = ({intl}) => {
    const {
        components,
        selectedComponent,
        showGrid,
        screenBackgroundColor,
        addComponent,
        updateComponent,
        selectComponent,
        clearComponents,
        alignComponentLeft,
        alignComponentCenter,
        alignComponentRight,
        alignComponentTop,
        alignComponentMiddle,
        alignComponentBottom,
        showGuides,
        guides,
        activeGuide,
        guidePosition,
        allGuidesFixed,
        toggleGuides,
        addGuide,
        removeGuide,
        removeAllGuides,
        updateGuidePosition,
        toggleFixAllGuides,
        toggleFixGuide,
        setActiveGuide,
        clearActiveGuide,
        getStateForSave,
        loadSavedState,
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
        generatePythonCode
    } = useStore();

    const GRID_COLS = SCREEN_WIDTH;
    const GRID_ROWS = SCREEN_HEIGHT;

    const [guideDropdownOpen, setGuideDropdownOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPosRef = useRef({ x: 0, y: 0 });
    const fileInputRef = useRef(null);
    const phoneScreenRef = useRef(null);
    const phoneImageRef = useRef(null);

    //运行按钮点击事件
    const handleRunClick = async() => {
        const pythonCode = generatePythonCode();
        if (!vm.runtime.connKey) {
            vm.runtime.ioDevices.toast.guiToast("001", "请连接设备", 'error', 2000);
            return;
        }
        const result = await run(vm.runtime.connKey, 'from Screen import *\nfrom s4s import *\n' + pythonCode);
        // 正常
        if (result.code === 202) {
            
        }else{//其他异常一并处理
            vm.runtime.ioDevices.toast.guiToast("002", "请检测设备是否在线，链接码是否正确", 'error', 2000);
            // 通知 GUI 清除连接
            vm.runtime.emit("WIFI_DEVICE_DISCONNECTED");
            return;
        }
    };

    const handleDrop = useCallback((layout, layoutItem, _event) => {
        const type = _event.dataTransfer.getData('componentType');
        if (type) {
            const defaultSizes = {
                title: { w: SCREEN_WIDTH, h: 30, x: 0, y: 0 },
                label: { w: 80, h: 40, x: 10, y: 50 },
                text: { w: 80, h: 40, x: 10, y: 90 },
                button: { w: 80, h: 40, x: 10, y: 160 },
                switch: { w: 80, h: 40, x: 10, y: 210 },
                slider: { w: 100, h: 40, x: 10, y: 260 },
                rectangle: { w: 40, h: 40, x: 10, y: 320 },
                circle: { w: 40, h: 40, x: 10, y: 410 },
                triangle: { w: 40, h: 40, x: 10, y: 480, points: "50,10 90,90 10,90" },
                line: {
                    w: 100,
                    h: 100,
                    x: 10,
                    y: 500,
                    x1: 100,
                    y1: 100,
                    x2: 0,
                    y2: 0
                },
                image: { w: 70, h: 70, x: 10, y: 530 }
            };

            const dropProps = type === 'title' ? defaultSizes[type] : {
                x: layoutItem.x,
                y: layoutItem.y,
                w: defaultSizes[type]?.w || 100,
                h: defaultSizes[type]?.h || 50
            };

            if (type === 'line') {
                dropProps.x1 = dropProps.x + dropProps.w;
                dropProps.y1 = dropProps.y;
                dropProps.x2 = dropProps.x;
                dropProps.y2 = dropProps.y;
            }
            if (type === 'triangle') {
                dropProps.w = 80;
                dropProps.h = 80;
                dropProps.point1X = 50;
                dropProps.point1Y = 10;
                dropProps.point2X = 90;
                dropProps.point2Y = 90;
                dropProps.point3X = 10;
                dropProps.point3Y = 90;
            }

            addComponent(type, dropProps);
        }
    }, [addComponent, SCREEN_WIDTH]);

    const onDragStart = useCallback((layout, oldItem) => {
        setIsDragging(true);
        dragStartPosRef.current = { x: oldItem.x, y: oldItem.y };
    }, []);

    const onDragStop = useCallback((layout, oldItem, newItem) => {
        const component = components.find(comp => comp.id === newItem.i);

        if (component && component.type === 'title') {
            updateComponent(component.id, {
                x: dragStartPosRef.current.x,
                y: dragStartPosRef.current.y
            });
            setIsDragging(false);
            return;
        }

        const moved = oldItem.x !== newItem.x || oldItem.y !== newItem.y;

        if (!moved) {
            selectComponent(newItem.i);
            setIsDragging(false);
            return;
        }

        if (component && component.type === 'line') {
            const dx = newItem.x - oldItem.x;
            const dy = newItem.y - oldItem.y;

            updateComponent(component.id, {
                x: newItem.x,
                y: newItem.y,
                x1: (component.x1 || 100) + dx,
                y1: (component.y1 || 100) + dy,
                x2: (component.x2 || 0) + dx,
                y2: (component.y2 || 0) + dy
            });
        } else {
            updateComponent(newItem.i, {
                x: newItem.x,
                y: newItem.y
            });
        }
        setIsDragging(false);
    }, [updateComponent, selectComponent, components]);

    const onResize = useCallback((layout, oldItem, newItem) => {
        const component = components.find(comp => comp.id === newItem.i);

        if (component && component.type === 'circle') {
            const side = Math.min(newItem.w, newItem.h);
            updateComponent(newItem.i, {
                w: side,
                h: side,
                radius: side / 2
            });
            return {
                ...newItem,
                w: side,
                h: side
            };
        }
        if (component && component.type === 'triangle') {
            const side = Math.min(newItem.w, newItem.h);
            updateComponent(newItem.i, {
                w: side,
                h: side,
                sideLength: side
            });
            return {
                ...newItem,
                w: side,
                h: side
            };
        }
        if (component && component.type === 'line') {
            const dw = newItem.w - oldItem.w;
            const dh = newItem.h - oldItem.h;
            updateComponent(newItem.i, {
                w: newItem.w,
                h: newItem.h,
                x1: (component.x1 || 100) + dw,
                y1: (component.y1 || 100) + dh
            });
        }

        const moved = oldItem.w !== newItem.w || oldItem.h !== newItem.h;
        if (moved && component && component.type !== 'title' && component.type !== 'line') {
            updateComponent(newItem.i, {
                w: newItem.w,
                h: newItem.h
            });
        }

        return newItem;
    }, [updateComponent, components]);

    const onResizeStop = useCallback((layout, oldItem, newItem) => {
        const component = components.find(comp => comp.id === newItem.i);
        if (component && component.type === 'title') {
            return;
        }

        let newW = newItem.w;
        let newH = newItem.h;

        if (component && component.type === 'circle') {
            const side = Math.min(newW, newH);
            newW = side;
            newH = side;
            updateComponent(newItem.i, {
                w: newW,
                h: newH,
                radius: side / 2
            });
        }
        else if (component && component.type === 'line') {
            const dw = newW - (component.w || 100);
            const dh = newH - (component.h || 100);
            updateComponent(newItem.i, {
                w: newW,
                h: newH,
                x1: (component.x1 || 100) + dw,
                y1: (component.y1 || 100) + dh
            });
        }
        else if (component && component.type !== 'title') {
            updateComponent(newItem.i, {
                w: newW,
                h: newH
            });
        }
        else if (component && component.type === 'triangle') {
            const side = Math.min(newW, newH);
            updateComponent(newItem.i, {
                w: side,
                h: side,
                sideLength: side
            });
        }
    }, [updateComponent, components]);

    const getLineGridLayout = (component) => {
        if (!component || component.type !== 'line') {
            return component;
        }

        const x1 = component.x1 || 0;
        const y1 = component.y1 || 0;
        const x2 = component.x2 || 0;
        const y2 = component.y2 || 0;
        const strokeWidth = component.strokeWidth || 2;
        const padding = strokeWidth / 2;

        const minX = Math.min(x1, x2) - padding;
        const maxX = Math.max(x1, x2) + padding;
        const minY = Math.min(y1, y2) - padding;
        const maxY = Math.max(y1, y2) + padding;

        const minSize = 2;
        const calculatedWidth = maxX - minX;
        const calculatedHeight = maxY - minY;

        let adjustedMinX = minX;
        let adjustedMaxX = maxX;
        if (calculatedWidth < minSize) {
            const centerX = (minX + maxX) / 2;
            adjustedMinX = centerX - minSize / 2;
            adjustedMaxX = centerX + minSize / 2;
        }

        let adjustedMinY = minY;
        let adjustedMaxY = maxY;
        if (calculatedHeight < minSize) {
            const centerY = (minY + maxY) / 2;
            adjustedMinY = centerY - minSize / 2;
            adjustedMaxY = centerY + minSize / 2;
        }

        return {
            ...component,
            x: Math.max(0, Math.floor(adjustedMinX)),
            y: Math.max(0, Math.floor(adjustedMinY)),
            w: Math.max(1, Math.ceil(adjustedMaxX - adjustedMinX)),
            h: Math.max(1, Math.ceil(adjustedMaxY - adjustedMinY))
        };
    };

    const handleComponentClick = (e, componentId) => {
        e.stopPropagation();
        selectComponent(componentId);
    };

    const handleEditorClick = (e) => {
        if (e.target === e.currentTarget ||
            e.target === phoneScreenRef.current ||
            e.target === phoneImageRef.current ||
            e.target.classList.contains('layout')) {
            selectComponent('screen');
        }
    };

    const handleScreenClick = (e) => {
        e.stopPropagation();
        selectComponent('screen');
    };

    const handleClear = () => {
        //弹出是否丢弃项目内容的确认逻辑
        const result =  window.confirm(intl.formatMessage({
            id: `uieditor.delete.allConfirm`,
            defaultMessage: 'Confirm delete all component?'
        }))
               
        if (result) {
            clearComponents();
        }
    };

    const handleAlignLeft = () => {
        if (selectedComponent && selectedComponent.id !== 'screen') {
            alignComponentLeft(selectedComponent.id);
        }
    };

    const handleAlignCenter = () => {
        if (selectedComponent && selectedComponent.id !== 'screen') {
            alignComponentCenter(selectedComponent.id);
        }
    };

    const handleAlignRight = () => {
        if (selectedComponent && selectedComponent.id !== 'screen') {
            alignComponentRight(selectedComponent.id);
        }
    };

    const handleAlignTop = () => {
        if (selectedComponent && selectedComponent.id !== 'screen') {
            alignComponentTop(selectedComponent.id);
        }
    };

    const handleAlignMiddle = () => {
        if (selectedComponent && selectedComponent.id !== 'screen') {
            alignComponentMiddle(selectedComponent.id);
        }
    };

    const handleAlignBottom = () => {
        if (selectedComponent && selectedComponent.id !== 'screen') {
            alignComponentBottom(selectedComponent.id);
        }
    };

    const handleToggleGuides = () => {
        toggleGuides();
        setGuideDropdownOpen(false);
    };

    const handleAddVerticalGuide = () => {
        addGuide('vertical');
        setGuideDropdownOpen(false);
    };

    const handleAddHorizontalGuide = () => {
        addGuide('horizontal');
        setGuideDropdownOpen(false);
    };

    const handleRemoveAllGuides = () => {
        if (guides.length > 0 && window.confirm('确定要删除所有辅助线吗？')) {
            removeAllGuides();
        }
        setGuideDropdownOpen(false);
    };

    const handleToggleFixAllGuides = () => {
        toggleFixAllGuides();
        setGuideDropdownOpen(false);
    };

    const handleToggleFixGuide = (guideId, e) => {
        e.stopPropagation();
        toggleFixGuide(guideId);
    };

    const handleGuideMouseDown = (e, guide) => {
        e.stopPropagation();
        if (allGuidesFixed || guide.fixed) return;
        setActiveGuide(guide.id);
    };

    const handlePhoneScreenMouseMove = (e) => {
        if (!activeGuide || !showGuides) return;

        const phoneScreen = e.currentTarget;
        const rect = phoneScreen.getBoundingClientRect();

        const guide = guides.find(g => g.id === activeGuide);
        if (!guide || allGuidesFixed || guide.fixed) return;

        if (guide.type === 'vertical') {
            const x = (e.clientX - rect.left) / rect.width * SCREEN_WIDTH;
            const clampedX = Math.max(0, Math.min(SCREEN_WIDTH, x));
            updateGuidePosition(activeGuide, clampedX);
        } else {
            const y = (e.clientY - rect.top) / rect.height * SCREEN_HEIGHT;
            const clampedY = Math.max(0, Math.min(SCREEN_HEIGHT, y));
            updateGuidePosition(activeGuide, clampedY);
        }
    };

    const handlePhoneScreenMouseUp = () => {
        if (activeGuide) {
            clearActiveGuide();
        }
    };

    const getGuideDisplayText = (guide) => {
        return guide.type === 'vertical'
            ? `X: ${Math.round(guide.position)}px`
            : `Y: ${Math.round(guide.position)}px`;
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const saveData = JSON.parse(content);

                if (!saveData.version || saveData.version !== '1.0') {
                    alert('文件版本不兼容，请使用最新版本保存的文件。');
                    return;
                }

                if (components.length > 0) {
                    const confirmOverwrite = window.confirm(
                        '打开文件将会覆盖当前的所有组件，是否继续？'
                    );
                    if (!confirmOverwrite) {
                        return;
                    }
                }

                loadSavedState(saveData);
                alert('文件加载成功！');
            } catch (error) {
                console.error('文件解析失败:', error);
                alert('文件格式错误，无法加载。请确保选择的是有效的保存文件。');
            }
        };

        reader.readAsText(file);
        event.target.value = '';
    };

    const validComponents = Array.isArray(components) ? components.filter(comp => comp && comp.id) : [];

    return (
        <div className={styles.editor}>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleFileSelect}
            />

            <div className={styles.editorLeftPanel}>
                <AddedComponentsList />
            </div>

            <div className={styles.editorRightPanel}>
                <div
                    className={styles.editorContent}
                    onClick={handleEditorClick}
                >
                    <div className={styles.phoneContainer}>
                        <div
                            ref={phoneImageRef}
                            className={styles.phoneImage}
                        />

                        <div
                            ref={phoneScreenRef}
                            className={`${styles.phoneScreen} ${showGrid ? styles.showGrid : ''} ${selectedComponent?.id === 'screen' ? styles.selected : ''}`}
                            style={{ backgroundColor: screenBackgroundColor }}
                            onClick={handleScreenClick}
                            onMouseMove={handlePhoneScreenMouseMove}
                            onMouseUp={handlePhoneScreenMouseUp}
                            onMouseLeave={handlePhoneScreenMouseUp}
                        >
                            {guidePosition && (guidePosition.x !== null || guidePosition.y !== null) && (
                                <div className={styles.guidePositionDisplay}>
                                    {guidePosition.x !== null && `X: ${Math.round(guidePosition.x)}px`}
                                    {guidePosition.x !== null && guidePosition.y !== null && ' | '}
                                    {guidePosition.y !== null && `Y: ${Math.round(guidePosition.y)}px`}
                                </div>
                            )}

                            {showGuides && guides.map(guide => (
                                <div
                                    key={guide.id}
                                    className={`${styles.guide} ${styles[guide.type]} ${activeGuide === guide.id ? styles.active : ''} ${guide.fixed ? styles.fixed : ''}`}
                                    style={{
                                        [guide.type === 'vertical' ? 'left' : 'top']: `${(guide.position / (guide.type === 'vertical' ? SCREEN_WIDTH : SCREEN_HEIGHT)) * 100}%`
                                    }}
                                    onMouseDown={(e) => handleGuideMouseDown(e, guide)}
                                    onDoubleClick={() => removeGuide(guide.id)}
                                    title={`${getGuideDisplayText(guide)} - ${guide.fixed ? 'Fixed' : 'Movable'} - Double-click to delete, right-click for menu`}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleToggleFixGuide(guide.id, e);
                                    }}
                                >
                                    <div className={styles.guideLabel}>
                                        {getGuideDisplayText(guide)}
                                        {guide.fixed && ' 🔒'}
                                    </div>
                                </div>
                            ))}

                            <ResponsiveGridLayout
                                className="layout"
                                layouts={{
                                    lg: validComponents.map(comp => {
                                        const gridItem = comp.type === 'line'
                                            ? getLineGridLayout(comp)
                                            : comp;

                                        return {
                                            i: gridItem.id,
                                            x: gridItem.x || 0,
                                            y: gridItem.y || 0,
                                            w: gridItem.w || 100,
                                            h: gridItem.h || 50,
                                            isDraggable: gridItem.type !== 'title',
                                            isResizable: gridItem.type !== 'title' && gridItem.type !== 'line'&& gridItem.type !== 'image',
                                            minW: gridItem.type === 'title' ? SCREEN_WIDTH : (gridItem.type === 'circle' ? 20 : 1),
                                            minH: gridItem.type === 'title' ? 30 : (gridItem.type === 'circle' ? 20 : 1),
                                            maxW: gridItem.type === 'title' ? SCREEN_WIDTH : SCREEN_WIDTH,
                                            maxH: gridItem.type === 'title' ? 60 : SCREEN_HEIGHT,
                                        };
                                    })
                                }}
                                breakpoints={{ lg: 675 }}
                                cols={{ lg: GRID_COLS }}
                                rowHeight={1}
                                onDrop={handleDrop}
                                onDragStart={onDragStart}
                                onDragStop={onDragStop}
                                onResize={onResize}
                                onResizeStop={onResizeStop}
                                preventCollision={false}
                                compactType={null}
                                verticalCompact={false}
                                allowOverlap={true}
                                isDroppable={true}
                                isResizable={true}
                                isDraggable={true}
                                margin={[0, 0]}
                                containerPadding={[0, 0]}
                                useCSSTransforms={true}
                                draggableHandle=".grid-item"
                            >
                                {validComponents.map(component => (
                                    <div
                                        key={component.id}
                                        className={`${styles.gridItem} ${component.type === 'title' ? styles.titleStatic : ''} ${component.type === 'circle' ? styles.circleConstraint : ''} ${component.type === 'line' ? styles.lineComponent : ''} ${selectedComponent?.id === component.id ? styles.selected : ''}`}
                                        onClick={(e) => handleComponentClick(e, component.id)}
                                        style={{
                                            zIndex: component.index || 0
                                        }}
                                    >
                                        <ComponentRenderer component={component} />
                                    </div>
                                ))}
                            </ResponsiveGridLayout>
                        </div>
                    </div>
                </div>

                <div className={styles.editorToolbar1}>
                    <div className={styles.runBox}>
                        <button
                            className={styles.toolbarBtn1}
                            onClick={handleRunClick}
                            // title="Generate and view Python code"
                        >
                            <img src={runButton} alt="Run" className={styles.runButton1} />
                        </button>
                    </div>

                    <div className={styles.editorToolbar}>
                        <div className={styles.alignmentButtons}>
                            <button
                                onClick={handleAlignBottom}
                                disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title'}
                                // title="Align Bottom"
                                className={styles.toolbarBtn}
                            >
                                <img
                                    src={alignBottomIcon}
                                    className={styles.toolbarIcon}
                                />
                            </button>
                            <button
                                onClick={handleAlignMiddle}
                                disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title'}
                                // title="Align Middle"
                                className={styles.toolbarBtn}
                            >
                                <img
                                    src={alignMiddleIcon}
                                    className={styles.toolbarIcon}
                                />
                            </button>
                            <button
                                onClick={handleAlignTop}
                                disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title'}
                                // title="Align Top"
                                className={styles.toolbarBtn}
                            >
                                <img
                                    src={alignTopIcon}
                                    className={styles.toolbarIcon}
                                />
                            </button>
                            <button
                                onClick={handleAlignLeft}
                                disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title'}
                                // title="Align Left"
                                className={styles.toolbarBtn}
                            >
                                <img
                                    src={alignLeftIcon}
                                    className={styles.toolbarIcon}
                                />
                            </button>
                            <button
                                onClick={handleAlignRight}
                                disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title'}
                                // title="Align Right"
                                className={styles.toolbarBtn}
                            >
                                <img
                                    src={alignRightIcon}
                                    className={styles.toolbarIcon}
                                />
                            </button>
                            <button
                                onClick={handleAlignCenter}
                                disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title'}
                                // title="Align Center"
                                className={styles.toolbarBtn}
                            >
                                <img
                                    src={alignCenterIcon}
                                    className={styles.toolbarIcon}
                                />
                            </button>
                        </div>

                        <div className={styles.guideControls}>
                            <button
                                className={styles.toolbarBtn}
                                onClick={handleAddVerticalGuide}
                                // title="Add Horizontal Guide"
                            >
                                <img
                                    src={guideHorizontalIcon}
                                    className={styles.toolbarIcon}
                                />
                            </button>

                            <button
                                className={styles.toolbarBtn}
                                onClick={handleAddHorizontalGuide}
                                // title="Add Vertical Guide"
                            >
                                <img
                                    src={guideVerticalIcon}
                                    className={styles.toolbarIcon}
                                />
                            </button>

                            <button
                                className={styles.toolbarBtn}
                                onClick={handleToggleFixAllGuides}
                                disabled={guides.length === 0}
                                // title={allGuidesFixed ? "Unlock All Guides" : "Lock All Guides"}
                            >
                                <img
                                    src={allGuidesFixed ? unlockIcon : lockIcon}
                                    className={styles.toolbarIcon}
                                />
                            </button>

                            <button
                                className={styles.toolbarBtn}
                                onClick={handleRemoveAllGuides}
                                disabled={guides.length === 0}
                                // title="Remove All Guides"
                            >
                                <img
                                    src={deleteGuideIcon}
                                    className={styles.toolbarIcon}
                                />
                            </button>
                        </div>
                        <div className={styles.clearButton1}>
                            <button
                                onClick={() => useStore.getState().toggleGrid()}
                                // title={showGrid ? "Hide Grid" : "Show Grid"}
                                className={styles.toolbarBtn}
                            >
                                <img
                                    src={gridIcon}
                                    className={styles.toolbarIcon}
                                />
                            </button>
                            <button
                                onClick={handleClear}
                                // title="Clear All Components"
                                className={styles.toolbarBtn}
                            >
                                <img
                                    src={clearIcon}
                                    className={styles.toolbarIcon}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default injectIntl(Editor);