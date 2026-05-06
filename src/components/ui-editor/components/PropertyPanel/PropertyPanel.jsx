import React, { useState, useEffect } from 'react';
import useStore from '../../stores/useStore.js';
//import CodeGenerator from '../CodeGenerator/CodeGenerator.jsx';
import styles from './PropertyPanel.css';

const PropertyPanel = () => {
    const selectedComponent = useStore(state => state.selectedComponent);
    const updateComponent = useStore(state => state.updateComponent);
    const screenBackgroundColor = useStore(state => state.screenBackgroundColor);
    const updateScreenBackgroundColor = useStore(state => state.updateScreenBackgroundColor);
    const bringToFront = useStore(state => state.bringToFront);

    const [transparentStates, setTransparentStates] = useState({});

    useEffect(() => {
        if (selectedComponent && selectedComponent.id !== 'screen') {
            const colorProps = ['backgroundColor', 'borderColor', 'color', 'fillColor', 'strokeColor', 'onColor'];
            const newStates = {};

            colorProps.forEach(prop => {
                const transparentKey = `${prop}Transparent`;
                if (selectedComponent[transparentKey] !== undefined) {
                    newStates[prop] = selectedComponent[transparentKey];
                } else {
                    newStates[prop] = false;
                }
            });

            setTransparentStates(newStates);
        }
    }, [selectedComponent]);

    const handlePropertyChange = (property, value) => {
        if (selectedComponent && selectedComponent.id === 'screen') {
            if (property === 'backgroundColor') {
                updateScreenBackgroundColor(value);
            }
            return;
        }

        if (property === 'fontSize' || property === 'index' || property === 'radius' ||
            property === 'strokeWidth' || property === 'min' || property === 'max' || property === 'value' ||
            property === 'x' || property === 'y' || property === 'w' || property === 'h' ||
            property === 'x1' || property === 'y1' || property === 'x2' || property === 'y2') {
            value = value === '' ? 0 : Number(value);
        }

        if (property.endsWith('Transparent')) {
            const colorProp = property.replace('Transparent', '');
            updateComponent(selectedComponent.id, {
                [property]: value
            });
            setTransparentStates(prev => ({
                ...prev,
                [colorProp]: value
            }));
            return;
        }

        const colorProps = ['backgroundColor', 'borderColor', 'color', 'fillColor', 'strokeColor', 'onColor'];
        if (colorProps.includes(property) && transparentStates[property]) {
            updateComponent(selectedComponent.id, {
                [property]: value
            });
            return;
        }

        if (selectedComponent.type === 'triangle') {
            if (property === 'sideLength') {
                const side = Math.max(20, Math.min(300, Number(value) || 0));
                updateComponent(selectedComponent.id, {
                    w: side,
                    h: side,
                    sideLength: side,
                });
                return;
            }

            const pointKeys = ['point1X', 'point1Y', 'point2X', 'point2Y', 'point3X', 'point3Y'];
            if (pointKeys.includes(property)) {
                const newValue = value === '' ? 0 : Number(value);
                const clampedValue = Math.max(0, Math.min(100, newValue));
                updateComponent(selectedComponent.id, {
                    [property]: clampedValue
                });
                return;
            }
        }

        if (selectedComponent.type === 'line' &&
            (property === 'x1' || property === 'y1' || property === 'x2' || property === 'y2')) {

            const component = selectedComponent;
            const newX1 = property === 'x1' ? value : component.x1 || 0;
            const newY1 = property === 'y1' ? value : component.y1 || 0;
            const newX2 = property === 'x2' ? value : component.x2 || 0;
            const newY2 = property === 'y2' ? value : component.y2 || 0;

            const minX = Math.min(newX1, newX2);
            const maxX = Math.max(newX1, newX2);
            const minY = Math.min(newY1, newY2);
            const maxY = Math.max(newY1, newY2);

            updateComponent(selectedComponent.id, {
                [property]: value,
                x: minX,
                y: minY,
                w: Math.max(1, maxX - minX),
                h: Math.max(1, maxY - minY)
            });
            return;
        }

        if (selectedComponent.type === 'circle' && property === 'radius') {
            const diameter = Math.max(20, value * 2);
            updateComponent(selectedComponent.id, {
                [property]: value,
                w: diameter,
                h: diameter
            });
            return;
        }

        if (property === 'showGrid' || property === 'showXAxis' || property === 'showYAxis' || property === 'showTooltip') {
            value = Boolean(value);
        }

        updateComponent(selectedComponent.id, { [property]: value });
    };

    const handleScreenBackgroundChange = (color) => {
        updateScreenBackgroundColor(color);
    };

    const handleBringToFront = () => {
        bringToFront(selectedComponent.id);
    };

    const renderColorInput = (field, component) => {
        const isTransparent = transparentStates[field.key] || false;
        const currentColor = component[field.key] || (field.key === 'color' ? '#ffffff' : '#000000');

        return (
            <div className={styles.colorInputWrapper}>
                <input
                    type="color"
                    value={isTransparent ? '#000000' : currentColor}
                    onChange={(e) => handlePropertyChange(field.key, e.target.value)}
                    disabled={isTransparent}
                    style={{
                        opacity: isTransparent ? 0.5 : 1,
                        cursor: isTransparent ? 'not-allowed' : 'pointer'
                    }}
                    title={isTransparent ? "Color picker disabled in transparent mode" : "Select color"}
                />
            </div>
        );
    };

    const renderScreenBackgroundSettings = () => {
        return (
            <div className={styles.propertyPanel}>
                <div className={styles.header}>Property</div>

                <div className={styles.propertyContent}>
                    <div className={styles.propertyField}>
                        <label>Background:</label>
                        <div className={styles.colorInputWrapper}>
                            <input
                                type="color"
                                value={screenBackgroundColor || '#000000'}
                                onChange={(e) => handleScreenBackgroundChange(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (selectedComponent && selectedComponent.id === 'screen') {
        return renderScreenBackgroundSettings();
    }

    if (!selectedComponent) {
        return renderScreenBackgroundSettings();
    }

    const getCommonFields = () => {
        const commonFields = [
            { key: 'name', label: 'Name', type: 'text' }
        ];

        if (selectedComponent.type !== 'title') {
            commonFields.push({
                key: 'index',
                label: 'Layer',
                type: 'number',
                min: 0,
                hasBringToFront: true
            });
        } else {
            commonFields.push({ key: 'index', label: 'Layer', type: 'number' });
        }

        if (selectedComponent.type !== 'title' &&
            selectedComponent.type !== 'circle' &&
            selectedComponent.type !== 'line' &&
            selectedComponent.type !== 'triangle') {
            commonFields.push(
                { key: 'x', label: 'X', type: 'number', min: 0, max: 320, step: 1 },
                { key: 'y', label: 'Y', type: 'number', min: 0, max: 240, step: 1 },
                { key: 'w', label: 'Width', type: 'number', min: 20, max: 320, step: 1 },
                { key: 'h', label: 'Height', type: 'number', min: 20, max: 240, step: 1 }
            );
        }

        if (selectedComponent.type === 'circle' || selectedComponent.type === 'triangle') {
            commonFields.push(
                { key: 'x', label: 'X', type: 'number', min: 0, max: 320, step: 1 },
                { key: 'y', label: 'Y', type: 'number', min: 0, max: 240, step: 1 }
            );
        }
        return commonFields;
    };

    const typeSpecificFields = {
        title: [
            { key: 'text', label: 'Text', type: 'text' },
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'backgroundColor', label: 'Background', type: 'color' },
            {
                key: 'fontSize', label: 'Font Size', type: 'select', options: [
                    { value: 12, label: 'Small' },
                    { value: 14, label: 'Medium' },
                    { value: 16, label: 'Large' }
                ], defaultValue: 16
            },
        ],
        label: [
            { key: 'text', label: 'Text', type: 'text' },
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'backgroundColor', label: 'Background', type: 'color' },
            {
                key: 'fontSize', label: 'Font Size', type: 'select', options: [
                    { value: 12, label: 'Small' },
                    { value: 14, label: 'Medium' },
                    { value: 16, label: 'Large' }
                ], defaultValue: 14
            },
        ],
        rectangle: [
            { key: 'backgroundColor', label: 'Background', type: 'color' },
            { key: 'borderColor', label: 'Border', type: 'color' }
        ],
        circle: [
            { key: 'radius', label: 'Radius', type: 'number', min: 10, max: 120, step: 1 },
            { key: 'backgroundColor', label: 'Background', type: 'color' },
            { key: 'borderColor', label: 'Border', type: 'color' },
        ],
        line: [
            { key: 'x2', label: 'x1', type: 'number', min: 0, max: 320, step: 1 },
            { key: 'y2', label: 'y1', type: 'number', min: 0, max: 240, step: 1 },
            { key: 'x1', label: 'x2', type: 'number', min: 0, max: 320, step: 1 },
            { key: 'y1', label: 'y2', type: 'number', min: 0, max: 240, step: 1 },
            { key: 'strokeColor', label: 'Color', type: 'color' },
        ],
        triangle: [
            { key: 'sideLength', label: 'Side Length', type: 'number', min: 20, max: 300, step: 1 },
            { key: 'point1X', label: 'Point 1 X', type: 'number', min: 0, max: 100, step: 1, placeholder: '0-100' },
            { key: 'point1Y', label: 'Point 1 Y', type: 'number', min: 0, max: 100, step: 1, placeholder: '0-100' },
            { key: 'point2X', label: 'Point 2 X', type: 'number', min: 0, max: 100, step: 1, placeholder: '0-100' },
            { key: 'point2Y', label: 'Point 2 Y', type: 'number', min: 0, max: 100, step: 1, placeholder: '0-100' },
            { key: 'point3X', label: 'Point 3 X', type: 'number', min: 0, max: 100, step: 1, placeholder: '0-100' },
            { key: 'point3Y', label: 'Point 3 Y', type: 'number', min: 0, max: 100, step: 1, placeholder: '0-100' },
            { key: 'fillColor', label: 'Fill Color', type: 'color' },
            { key: 'borderColor', label: 'Border Color', type: 'color' },
            { key: 'borderWidth', label: 'Border Width', type: 'number', min: 0, max: 20 }
        ],
        image: [
            { key: 'src', label: 'Path', type: 'text' }
        ],
        // text: [
        //     { key: 'text', label: 'Text Content', type: 'text' },
        //     {
        //         key: 'fontSize', label: 'FontSize', type: 'select', options: [
        //             { value: 12, label: 'Small' },
        //             { value: 14, label: 'Medium' },
        //             { value: 16, label: 'Large' }
        //         ], defaultValue: 14
        //     },
        //     { key: 'color', label: 'Color', type: 'color' },
        //     { key: 'backgroundColor', label: 'Background', type: 'color' },
        // ],
        button: [
            { key: 'text', label: 'Text', type: 'text' },
            {
                key: 'fontSize', label: 'Font Size', type: 'select', options: [
                    { value: 12, label: 'Small' },
                    { value: 14, label: 'Medium' },
                    { value: 16, label: 'Large' }
                ], defaultValue: 14
            },
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'backgroundColor', label: 'Background', type: 'color' }
        ],
        switch: [
            { key: 'backgroundColor', label: 'Background', type: 'color' },
            { key: 'onColor', label: 'On Color', type: 'color' }
        ],
        slider: [
            { key: 'min', label: 'Min', type: 'number', min: 0 },
            { key: 'max', label: 'Max', type: 'number' },
            { key: 'value', label: 'Value', type: 'number', min: 0 },
            { key: 'fillColor', label: 'Color', type: 'color' }
        ]
    };

    const getInputValue = (component, key, defaultValue = '') => {
        const value = component[key];

        if (key === 'w' && component.type === 'triangle') {
            return component.sideLength !== undefined ? component.sideLength : defaultValue;
        }

        if (value === 0 || value === '0') {
            return '';
        }

        return value !== undefined && value !== null ? value : defaultValue;
    };

    const renderPropertyFields = () => {
        const commonFields = getCommonFields();
        const specificFields = typeSpecificFields[selectedComponent.type] || [];
        const fields = [...commonFields, ...specificFields];

        return fields.map(field => {
            if (field.type === 'color') {
                return (
                    <div key={field.key} className={styles.propertyField}>
                        <label>{field.label}:</label>
                        {renderColorInput(field, selectedComponent)}
                    </div>
                );
            }

            if (field.type === 'select') {
                const currentValue = selectedComponent[field.key] !== undefined
                    ? selectedComponent[field.key]
                    : field.defaultValue || '';

                return (
                    <div key={field.key} className={styles.propertyField}>
                        <label>{field.label}:</label>
                        <select
                            value={currentValue}
                            onChange={(e) => handlePropertyChange(field.key, e.target.value)}
                        >
                            {field.options.map(option => {
                                if (typeof option === 'object') {
                                    return (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    );
                                }
                                return (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                );
            }

            return (
                <div key={field.key} className={styles.propertyField}>
                    <label>{field.label}:</label>
                    {/* <div className={`${styles.inputGroup} ${field.key === 'index' ? styles.indexInputGroup : ''}`}> */}
                    <div className={styles.inputGroup}>
                        {field.type === 'text' && (
                            <input
                                type="text"
                                value={getInputValue(selectedComponent, field.key, '')}
                                onChange={(e) => handlePropertyChange(field.key, e.target.value)}
                            />
                        )}
                        {field.type === 'number' && (
                            <input
                                type="number"
                                value={getInputValue(selectedComponent, field.key, '')}
                                onChange={(e) => handlePropertyChange(field.key, e.target.value)}
                                placeholder="0"
                                min={field.min}
                                max={field.max}
                                step={field.step || 1}
                                onWheel={(e) => e.target.blur()}
                            />
                        )}
                        {field.type === 'checkbox' && (
                            <input
                                type="checkbox"
                                checked={selectedComponent[field.key] !== false}
                                onChange={(e) => handlePropertyChange(field.key, e.target.checked)}
                            />
                        )}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className={styles.propertyPanel}>
            <div className={styles.header}>Property</div>
            
            <div className={styles.propertyContent}>
                {/* <div className={styles.componentInfo}>
                    <strong>Type:</strong> {selectedComponent.type}
                    {selectedComponent.type === 'title' && (
                        <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                            (This component is fixed and cannot be moved)
                        </div>
                    )}
                    {selectedComponent.type === 'line' && (
                        <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                            (x1,y1: right/bottom border, x2,y2: left/top border)
                        </div>
                    )}
                </div> */}

                {renderPropertyFields()}
            </div>
        </div>
    );
};

export default PropertyPanel;