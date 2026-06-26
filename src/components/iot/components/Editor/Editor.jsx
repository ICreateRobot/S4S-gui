import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import useStore from '../../stores/useStore.js';
import ComponentRenderer from './ComponentRenderer.jsx';
import styles from './Editor.css';


const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * Editor Component - Main visual editor component
 * Provides component drag-and-drop, alignment, guide lines, and other features
 */
const Editor = () => {
    // Get state and methods from store
    const {
        components,              // Component list
        selectedComponent,       // Currently selected component
        showGrid,                // Whether to show grid
        screenBackgroundColor,   // Screen area background color
        screenSize,              // Screen area dimensions
        addComponent,            // Add component method
        updateComponent,         // Update component method
        selectComponent,         // Select component method
        clearComponents,         // Clear all components method
        // Alignment-related methods
        alignComponentLeft,      // Align left
        alignComponentCenter,    // Align center horizontally
        alignComponentRight,     // Align right
        alignComponentTop,       // Align top
        alignComponentMiddle,    // Align middle vertically
        alignComponentBottom,    // Align bottom
        // Guide lines-related methods
        showGuides,             // Whether to show guide lines
        guides,                 // Guide lines list
        activeGuide,            // Currently active guide line
        guidePosition,          // Guide line position
        allGuidesFixed,         // Whether all guide lines are fixed
        toggleGuides,           // Toggle guide lines display
        addGuide,               // Add guide line
        removeGuide,            // Remove guide line
        removeAllGuides,        // Remove all guide lines
        updateGuidePosition,    // Update guide line position
        toggleFixAllGuides,     // Toggle fix all guide lines
        toggleFixGuide,         // Toggle fix single guide line
        setActiveGuide,         // Set active guide line
        clearActiveGuide,       // Clear active guide line
    } = useStore();

    // Guide line dropdown menu state
    //const [guideDropdownOpen, setGuideDropdownOpen] = useState(false);

    // References and state
    const editorContentRef = useRef(null);      // Editor content area reference
    const gridContainerRef = useRef(null);      // Grid container reference
    const [editorSize, setEditorSize] = useState({ width: 2100, height: 2100 }); // Editor dimensions
    const [isDragging, setIsDragging] = useState(false); // 当前是否进行拖拽动作
    const dragStartPosRef = useRef({ x: 0, y: 0 }); // Drag start position

    // 偏移量
    const SCREEN_AREA_OFFSET = { x: 30, y: 30 };

    useEffect(() => {
        const updateEditorSize = () => {
            if (editorContentRef.current) {
                // Set sufficiently large editing area
                const width = 2100; // Fixed width
                const height = 2100; // Fixed height
                setEditorSize({ width, height });
            }
        };

        updateEditorSize();

        const resizeObserver = new ResizeObserver(updateEditorSize);
        if (editorContentRef.current) {
            resizeObserver.observe(editorContentRef.current);
        }

        window.addEventListener('resize', updateEditorSize);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateEditorSize);
        };
    }, []);

    // Calculate grid columns (fixed to editor width)
    const cols = editorSize.width;
    const handleDrop = useCallback((layout, layoutItem, _event) => {

        const type = _event.dataTransfer.getData('componentType');
        if (type) {

            if (type === 'title') {
                const dropProps = {
                    x: SCREEN_AREA_OFFSET.x, // Fixed at screen area x coordinate
                    y: SCREEN_AREA_OFFSET.y, // Fixed at screen area y coordinate
                    w: screenSize.width, // Width matches screen width
                    h: 40 // Fixed height 40 pixels
                };

                addComponent(type, dropProps);
                return;
            }
            // Use actual drop position instead of fixed position
            const dropProps = {
                x: layoutItem.x,
                y: layoutItem.y,
                w: layoutItem.w,
                h: layoutItem.h
            };

            // Set default dimensions based on component type
            let defaultWidth, defaultHeight;
            switch (type) {
                case 'label':
                case 'text':
                case 'button':
                    defaultWidth = 120;
                    defaultHeight = 40;
                    break;
                case 'switch':
                    defaultWidth = 80;
                    defaultHeight = 40;
                    break;
                case 'rectangle':
                    defaultWidth = 100;
                    defaultHeight = 60;
                    break;
                case 'circle':
                    defaultWidth = 80;
                    defaultHeight = 80;
                    break;
                case 'line':
                    defaultWidth = 120;
                    defaultHeight = 2;
                    break;
                case 'image':
                    defaultWidth = 100;
                    defaultHeight = 100;
                    break;
                case 'slider':
                    defaultWidth = 200;
                    defaultHeight = 60;
                    break;
                case 'barChart':
                case 'lineChart':
                case 'pieChart':
                    defaultWidth = 250;
                    defaultHeight = 182;
                    break;
                case 'gauge':
                    defaultWidth = 144;
                    defaultHeight = 150;
                    break;
                case 'joystick':
                    defaultWidth = 150;
                    defaultHeight = 150;
                    break;
                case 'title':
                    defaultWidth = 200;
                    defaultHeight = 40;
                    break;
                default:
                    defaultWidth = 100;
                    defaultHeight = 100;
            }

            // If no dimensions specified during drag, use default dimensions
            if (!dropProps.w || dropProps.w < 20) dropProps.w = defaultWidth;
            if (!dropProps.h || dropProps.h < 20) dropProps.h = defaultHeight;

            // Ensure position doesn't exceed editing area
            const editorWidth = editorSize.width;
            const editorHeight = editorSize.height;

            dropProps.x = Math.max(0, Math.min(dropProps.x, editorWidth - dropProps.w));
            dropProps.y = Math.max(0, Math.min(dropProps.y, editorHeight - dropProps.h));

            addComponent(type, dropProps);
        }
    }, [addComponent, editorSize.width, editorSize.height, screenSize]);

    const onDragStart = useCallback((layout, oldItem) => {
        setIsDragging(true);
        dragStartPosRef.current = { x: oldItem.x, y: oldItem.y };
    }, []);

    const onDragStop = useCallback((layout, oldItem, newItem) => {
        const component = components.find(comp => comp.id === newItem.i);

        // Check if it's actual dragging (position changed)
        const moved = oldItem.x !== newItem.x || oldItem.y !== newItem.y;

        // If not actual dragging, just click selection
        if (!moved) {
            selectComponent(newItem.i);
            setIsDragging(false);
            return;
        }

        //let isShow = isComponentInScreenArea(newItem)

        // 拖动更新位置
        updateComponent(newItem.i, {
            x: newItem.x,
            y: newItem.y,
            //show: isShow
        });
        setIsDragging(false);
    }, [updateComponent, selectComponent, components]);

    const onResizeStop = useCallback((layout, oldItem, newItem) => {
        const component = components.find(comp => comp.id === newItem.i);

        //let isShow = isComponentInScreenArea(newItem)
 
        if (component) {
            updateComponent(newItem.i, {
                w: newItem.w,
                h: newItem.h,
                //show: isShow
            });
        }
    }, [updateComponent, components]);

    const handleComponentClick = (e, componentId) => {
        e.stopPropagation();
        e.preventDefault();
        selectComponent(componentId);
    };

    const handleEditorClick = (e) => {
        // Only select screen when clicking on blank area
        selectComponent('screen');
    };

    // const handleClear = () => {
    //     if (window.confirm('Are you sure you want to clear all components?')) {
    //         clearComponents();
    //     }
    // };

    // // Alignment function handlers - modified to only align components inside screen area
    // const handleAlignLeft = () => {
    //     if (selectedComponent && selectedComponent.id !== 'screen') {
    //         alignComponentLeft(selectedComponent.id);
    //     }
    // };

    // const handleAlignCenter = () => {
    //     if (selectedComponent && selectedComponent.id !== 'screen') {
    //         alignComponentCenter(selectedComponent.id);
    //     }
    // };

    // const handleAlignRight = () => {
    //     if (selectedComponent && selectedComponent.id !== 'screen') {
    //         alignComponentRight(selectedComponent.id);
    //     }
    // };

    // const handleAlignTop = () => {
    //     if (selectedComponent && selectedComponent.id !== 'screen') {
    //         alignComponentTop(selectedComponent.id);
    //     }
    // };

    // const handleAlignMiddle = () => {
    //     if (selectedComponent && selectedComponent.id !== 'screen') {
    //         alignComponentMiddle(selectedComponent.id);
    //     }
    // };

    // const handleAlignBottom = () => {
    //     if (selectedComponent && selectedComponent.id !== 'screen') {
    //         alignComponentBottom(selectedComponent.id);
    //     }
    // };

    // Guide line handling methods
    // const handleToggleGuides = () => {
    //     toggleGuides();
    //     setGuideDropdownOpen(false);
    // };

    // const handleAddVerticalGuide = () => {
    //     addGuide('vertical');
    //     setGuideDropdownOpen(false);
    // };

    // const handleAddHorizontalGuide = () => {
    //     addGuide('horizontal');
    //     setGuideDropdownOpen(false);
    // };

    // const handleRemoveAllGuides = () => {
    //     if (guides.length > 0 && window.confirm('你确定要删除所有参考线吗?')) {
    //         removeAllGuides();
    //     }
    //     setGuideDropdownOpen(false);
    // };

    // const handleToggleFixAllGuides = () => {
    //     toggleFixAllGuides();
    //     setGuideDropdownOpen(false);
    // };

    const handleToggleFixGuide = (guideId, e) => {
        e.stopPropagation();
        toggleFixGuide(guideId);
    };

    // Guide line dragging handling
    const handleGuideMouseDown = (e, guide) => {
        e.stopPropagation();
        if (allGuidesFixed || guide.fixed) return;
        setActiveGuide(guide.id);
    };

    const handleGridMouseMove = (e) => {
        if (!activeGuide || !showGuides) return;

        const gridContainer = e.currentTarget;
        const rect = gridContainer.getBoundingClientRect();

        const guide = guides.find(g => g.id === activeGuide);
        if (!guide || allGuidesFixed || guide.fixed) return;

        if (guide.type === 'vertical') {
            const x = e.clientX - rect.left;
            const clampedX = Math.max(0, Math.min(editorSize.width, x));
            updateGuidePosition(activeGuide, clampedX);
        } else {
            const y = e.clientY - rect.top;
            const clampedY = Math.max(0, Math.min(editorSize.height, y));
            updateGuidePosition(activeGuide, clampedY);
        }
    };

    const handleGridMouseUp = () => {
        if (activeGuide) {
            clearActiveGuide();
        }
    };

    const getGuideDisplayText = (guide) => {
        if (guide.type === 'vertical') {
            return `X: ${Math.round(guide.position)}px`;
        } else {
            return `Y: ${Math.round(guide.position)}px`;
        }
    };

    const validComponents = Array.isArray(components) ? components.filter(comp => comp && comp.id) : [];

    const onResize = useCallback((layout, oldItem, newItem) => {
        const component = components.find(comp => comp.id === newItem.i);

        // 对于圆形组件，保持宽度和高度相等（呈正方形）
        if (component && component.type === 'circle') {
            const size = Math.min(newItem.w, newItem.h);
            newItem.w = size;
            newItem.h = size;

            updateComponent(component.id, {
                w: size,
                h: size
            });

            return newItem;
        }

        return newItem;
    }, [components, updateComponent]);

    // 检查组件是否位于屏幕区域
    const isComponentInScreenArea = (component) => {
        const screenX = SCREEN_AREA_OFFSET.x;
        const screenY = SCREEN_AREA_OFFSET.y;
        const screenWidth = screenSize.width;
        const screenHeight = screenSize.height;

        const componentX = component.x || 0;
        const componentY = component.y || 0;
        const componentWidth = component.w || 0;
        const componentHeight = component.h || 0;

        return (
            componentX >= screenX &&
            componentY >= screenY &&
            componentX + componentWidth <= screenX + screenWidth &&
            componentY + componentHeight <= screenY + screenHeight
        );
    };

    return (
        <div className={styles.editor}>
            {/* <div className={styles.editorToolbar}>
                <button onClick={() => useStore.getState().toggleGrid()}>
                    📐 Grid {showGrid ? 'On' : 'Off'}
                </button>
                <button onClick={handleClear}>
                    Clear
                </button>

                <div className={styles.alignmentButtons}>
                    <button
                        onClick={handleAlignLeft}
                        disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title' || !isComponentInScreenArea(selectedComponent)}
                        title="Align Left"
                    >
                        ◀️ Left
                    </button>
                    <button
                        onClick={handleAlignCenter}
                        disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title' || !isComponentInScreenArea(selectedComponent)}
                        title="Align Center Horizontally"
                    >
                        ⬤ Center
                    </button>
                    <button
                        onClick={handleAlignRight}
                        disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title' || !isComponentInScreenArea(selectedComponent)}
                        title="Align Right"
                    >
                        ▶️ Right
                    </button>
                    <button
                        onClick={handleAlignTop}
                        disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title' || !isComponentInScreenArea(selectedComponent)}
                        title="Align Top"
                    >
                        ▲ Top
                    </button>
                    <button
                        onClick={handleAlignMiddle}
                        disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title' || !isComponentInScreenArea(selectedComponent)}
                        title="Align Middle Vertically"
                    >
                        ⬤ Middle
                    </button>
                    <button
                        onClick={handleAlignBottom}
                        disabled={!selectedComponent || selectedComponent.id === 'screen' || selectedComponent.type === 'title' || !isComponentInScreenArea(selectedComponent)}
                        title="Align Bottom"
                    >
                        ▼ Bottom
                    </button>
                </div>

                <div className={styles.guideControls}>
                    <button
                        className={`${styles.guideToggle} ${showGuides ? styles.active : ''}`}
                        onClick={handleToggleGuides}
                        title="Show/Hide Guide Lines"
                    >
                        📏 Guides {showGuides ? 'On' : 'Off'}
                    </button>

                    {showGuides && (
                        <>
                            <button
                                className={styles.guideActionBtn}
                                onClick={handleToggleFixAllGuides}
                                disabled={guides.length === 0}
                                title={allGuidesFixed ? "Unlock Guide Lines" : "Lock All Guide Lines"}
                            >
                                {allGuidesFixed ? "🔓 Unlock" : "🔒 Lock"}
                            </button>

                            <button
                                className={styles.guideActionBtn}
                                onClick={handleRemoveAllGuides}
                                disabled={guides.length === 0}
                                title="Delete All Guide Lines"
                            >
                                🗑️ Delete
                            </button>

                            <div className={styles.guideDropdown}>
                                <button
                                    className={styles.guideDropdownToggle}
                                    onClick={() => setGuideDropdownOpen(!guideDropdownOpen)}
                                >
                                    ⚙️
                                </button>

                                {guideDropdownOpen && (
                                    <div className={styles.guideDropdownMenu}>
                                        <button onClick={handleAddVerticalGuide}>
                                            ➕ Add Vertical Line
                                        </button>
                                        <button onClick={handleAddHorizontalGuide}>
                                            ➕ Add Horizontal Line
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div> */}

            {/* 编辑区域 */}
            <div
                className={styles.editorContent}
                onClick={handleEditorClick}
                ref={editorContentRef}
            >
                <div
                    className={styles.gridBackground}
                    style={{
                        width: `${editorSize.width}px`,
                        height: `${editorSize.height}px`,
                         position: "absolute",
                        top: 0,
                        left: 0,
                        backgroundImage: showGrid
                            ? 'linear-gradient(rgba(52, 152, 219, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 152, 219, 0.1) 1px, transparent 1px)'
                            : 'none',
                        backgroundSize: '20px 20px'
                    }}
                    ref={gridContainerRef}
                    onMouseMove={handleGridMouseMove}
                    onMouseUp={handleGridMouseUp}
                    onMouseLeave={handleGridMouseUp}
                >
                    {/* 屏幕区域网格 */}
                    <div
                        className={styles.screenAreaOutline}
                        style={{
                            position: 'absolute',
                            left: `${SCREEN_AREA_OFFSET.x}px`,
                            top: `${SCREEN_AREA_OFFSET.y}px`,

                            width: `${screenSize.width}px`,
                            height: `${screenSize.height}px`,

                            backgroundColor: screenBackgroundColor,
                            pointerEvents: 'none',

                        }}
                    >
                        {/* Screen area label */}
                        <div style={{
                            position: 'absolute',
                            top: '-25px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#3498db',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            whiteSpace: 'nowrap'
                        }}>
                            {screenSize.width} × {screenSize.height}
                        </div>
                    </div>

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
                            className={`${styles.guide} ${
                                styles[guide.type]
                            } ${
                                activeGuide === guide.id ? styles.active : ''
                            } ${
                                guide.fixed ? styles.fixed : ''
                            }`}
                            style={{
                                [guide.type === 'vertical' ? 'left' : 'top']: `${guide.position}px`
                            }}
                            onMouseDown={(e) => handleGuideMouseDown(e, guide)}
                            onDoubleClick={() => removeGuide(guide.id)}
                            title={`${getGuideDisplayText(guide)} - ${guide.fixed ? 'Fixed' : 'Movable'} - Double click to delete, Right-click menu`}
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
                        className={styles.layout}
                        layouts={{
                            lg: validComponents.map(comp => ({
                                i: comp.id,
                                x: comp.x || 0,
                                y: comp.y || 0,
                                w: comp.type === 'title' ? screenSize.width : comp.w || 100,
                                h: comp.h || 100,
                                isDraggable: comp.type !== 'title',
                                isResizable: comp.type !== 'title',
                                minW: 20,
                                minH: 20,
                                preserveAspectRatio: comp.type === 'circle'
                            }))
                        }}
                        breakpoints={{ lg: 1200 }}
                        cols={{ lg: cols }}
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
                        //draggableHandle=".gridItem"
                        draggableHandle="[data-grid-handle='true']"
                    >
                        {validComponents.map(component => (
                            <div
                                key={component.id}
                                className={`${styles.gridItem} ${
                                    selectedComponent?.id === component.id ? styles.selected : ''
                                } ${
                                    !isComponentInScreenArea(component) ? styles.outsideScreen : ''
                                }`}
                                data-grid-handle="true"
                                onClick={(e) => handleComponentClick(e, component.id)}
                                style={{
                                    zIndex: component.index || 0
                                }}
                                title={!isComponentInScreenArea(component) ? "This component is not in the preview area" : ""}
                            >
                                <ComponentRenderer component={component} />
                                {!isComponentInScreenArea(component) && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                        pointerEvents: 'none',
                                        border: '1px dashed red'
                                    }} />
                                )}
                            </div>
                        ))}
                    </ResponsiveGridLayout>
                </div>
            </div>
        </div>
    );
};

export default Editor;