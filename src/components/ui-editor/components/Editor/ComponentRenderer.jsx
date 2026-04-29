import React from 'react';
import styles from './Editor.css';

const ComponentRenderer = ({ component }) => {
    if (!component) {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ff4757',
                color: 'white',
                fontSize: '12px',
                border: '2px dashed #ff0000'
            }}>
                组件数据错误
            </div>
        );
    }

    const renderComponent = () => {
        const baseStyle = {};

        if (!component.type) {
            return (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ff4757',
                    color: 'white',
                    fontSize: '12px',
                    ...baseStyle
                }}>
                    未知组件类型
                </div>
            );
        }

        switch (component.type) {
            case 'title':
                return (
                    <div
                        className={styles.componentTitle}
                        style={{
                            fontSize: `${component.fontSize || 14}px`,
                            color: component.colorTransparent ? 'transparent' : (component.color || '#ffffff'),
                            backgroundColor: component.backgroundColorTransparent ? 'transparent' : (component.backgroundColor || '#000000'),
                            fontWeight: component.fontWeight || 'bold',
                            textAlign: component.textAlign || 'center',
                            ...baseStyle
                        }}
                    >
                        {component.text || '标题'}
                    </div>
                );

            case 'label':
                return (
                    <div
                        className={styles.componentLabel}
                        style={{
                            fontSize: `${component.fontSize || 12}px`,
                            color: component.colorTransparent ? 'transparent' : (component.color || '#ffffff'),
                            backgroundColor: component.backgroundColorTransparent ? 'transparent' : (component.backgroundColor || '#000000'),
                            fontWeight: component.fontWeight || 'normal',
                            ...baseStyle
                        }}
                    >
                        {component.text || '标签'}
                    </div>
                );

            case 'rectangle':
                return (
                    <div
                        className={styles.componentRectangle}
                        style={{
                            backgroundColor: component.backgroundColorTransparent
                                ? 'transparent'
                                : (component.backgroundColor || '#3498db'),
                            border: component.borderColorTransparent
                                ? '2px solid transparent'
                                : `2px solid ${component.borderColor || '#2980b9'}`,
                            ...baseStyle
                        }}
                    />
                );

            case 'circle':
                const currentWidth = component.w || 60;
                const currentHeight = component.h || 60;
                const circleSize = Math.max(10, Math.min(currentWidth, currentHeight) - 4);
                const containerSize = Math.min(currentWidth, currentHeight);

                return (
                    <div
                        className={styles.componentCircle}
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'transparent',
                            ...baseStyle
                        }}
                    >
                        <div
                            style={{
                                width: `${containerSize}px`,
                                height: `${containerSize}px`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                backgroundColor: component.backgroundColorTransparent
                                    ? 'transparent'
                                    : (component.backgroundColor || '#e74c3c'),
                                border: component.borderColorTransparent
                                    ? '2px solid transparent'
                                    : `2px solid ${component.borderColor || '#c0392b'}`,
                            }}
                        >
                            <div
                                style={{
                                    width: `${circleSize}px`,
                                    height: `${circleSize}px`,
                                    backgroundColor: component.backgroundColorTransparent
                                        ? 'transparent'
                                        : (component.backgroundColor || '#e74c3c'),
                                    borderRadius: '50%',
                                    border: component.borderColorTransparent
                                        ? '1px solid transparent'
                                        : `1px solid ${component.borderColor || '#c0392b'}`,
                                }}
                            />
                        </div>
                    </div>
                );

            case 'line':
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

                const viewBoxX = minX;
                const viewBoxY = minY;
                const viewBoxWidth = Math.max(1, maxX - minX);
                const viewBoxHeight = Math.max(1, maxY - minY);

                return (
                    <div
                        className={styles.componentLineContainer}
                        style={{
                            ...baseStyle,
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                            pointerEvents: 'none',
                            overflow: 'visible',
                        }}
                    >
                        <svg
                            width="100%"
                            height="100%"
                            viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
                            preserveAspectRatio="none"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                pointerEvents: 'none'
                            }}
                        >
                            <line
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={component.strokeColorTransparent
                                    ? 'transparent'
                                    : (component.strokeColor || '#ffffff')}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                );

            case 'triangle':
                const triangleSize = component.w || 80;

                const point1X = component.point1X !== undefined ? component.point1X : 50;
                const point1Y = component.point1Y !== undefined ? component.point1Y : 10;
                const point2X = component.point2X !== undefined ? component.point2X : 90;
                const point2Y = component.point2Y !== undefined ? component.point2Y : 90;
                const point3X = component.point3X !== undefined ? component.point3X : 10;
                const point3Y = component.point3Y !== undefined ? component.point3Y : 90;

                const pointsStr = `${point1X},${point1Y} ${point2X},${point2Y} ${point3X},${point3Y}`;

                return (
                    <div
                        className={styles.componentTriangle}
                        style={{
                            width: '100%',
                            height: '100%',
                            display: flex,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'transparent',
                            ...baseStyle
                        }}
                    >
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="xMidYMid meet"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%'
                            }}
                        >
                            <polygon
                                points={pointsStr}
                                fill={component.backgroundColorTransparent
                                    ? 'transparent'
                                    : (component.fillColor || component.backgroundColor || '#9b59b6')}
                                stroke={component.borderColorTransparent
                                    ? 'transparent'
                                    : (component.borderColor || '#8e44ad')}
                                strokeWidth={component.borderWidth || 2}
                            />
                        </svg>
                    </div>
                );

            case 'image':
                return component.src ? (
                    <img
                        src={component.src}
                        alt="组件图片"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            ...baseStyle
                        }}
                    />
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#7f8c8d',
                        color: 'white',
                        fontSize: '10px',
                        ...baseStyle
                    }}>
                        image
                    </div>
                );

            case 'text':
                return (
                    <div
                        className={styles.componentText}
                        style={{
                            fontSize: `${component.fontSize || 12}px`,
                            color: component.colorTransparent ? 'transparent' : (component.color || '#ffffff'),
                            backgroundColor: component.backgroundColorTransparent ? 'transparent' : (component.backgroundColor || '#000000'),
                            fontWeight: component.fontWeight || 'normal',
                            ...baseStyle
                        }}
                    >
                        {component.text || '文本'}
                    </div>
                );

            case 'button':
                return (
                    <button
                        className={`${styles.componentButton} ${component.pressed ? styles.pressed : ''}`}
                        style={{
                            fontSize: `${component.fontSize || 12}px`,
                            color: component.colorTransparent ? 'transparent' : (component.color || '#ffffff'),
                            backgroundColor: component.backgroundColorTransparent ? 'transparent' : (component.backgroundColor || '#27ae60'),
                            ...baseStyle
                        }}
                    >
                        {component.text || '按钮'}
                    </button>
                );

            case 'switch':
                const isOn = component.value;
                const bgColor = isOn
                    ? (component.onColorTransparent ? 'transparent' : (component.onColor || '#4CAF50'))
                    : (component.backgroundColorTransparent ? 'transparent' : (component.backgroundColor || '#9E9E9E'));

                return (
                    <div
                        className={`${styles.componentSwitch} ${isOn ? styles.on : styles.off}`}
                        style={{
                            ...baseStyle,
                            backgroundColor: bgColor,
                            cursor: 'pointer',
                            position: 'relative',
                            borderRadius: '20px',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <div
                            style={{
                                width: 'calc(50% - 4px)',
                                height: 'calc(100% - 4px)',
                                backgroundColor: '#ffffff',
                                borderRadius: '50%',
                                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isOn ? 'translateX(calc(100% + 4px))' : 'translateX(0)',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                position: 'absolute',
                                left: '2px'
                            }}
                        />
                    </div>
                );

            case 'slider':
                return (
                    <div className={styles.componentSlider} style={baseStyle}>
                        <input
                            type="range"
                            min={component.min || 0}
                            max={component.max || 100}
                            value={component.value || 0}
                            style={{
                                width: '100%',
                                accentColor: component.fillColorTransparent
                                    ? 'transparent'
                                    : (component.fillColor || '#34495e')
                            }}
                            readOnly
                        />
                        <div style={{
                            textAlign: 'center',
                            color: '#fff',
                            fontSize: '10px',
                            marginTop: '4px'
                        }}>
                            {component.value || 0}
                        </div>
                    </div>
                );

            default:
                return (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: center,
                        backgroundColor: '#95a5a6',
                        color: 'white',
                        fontSize: '10px',
                        ...baseStyle
                    }}>
                        未知组件: {component.type}
                    </div>
                );
        }
    };

    return (
        <div className={styles.componentRenderer}>
            {renderComponent()}
        </div>
    );
};

export default ComponentRenderer;