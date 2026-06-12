import React, { useState } from 'react';
import useStore from '../../stores/useStore.js';
import styles from './PropertyPanel.css';

import deleteIcon from '../../assets/delete.svg';

const PropertyPanel = () => {
    const selectedComponent = useStore(state => state.selectedComponent);
    const updateComponent = useStore(state => state.updateComponent);
    const screenBackgroundColor = useStore(state => state.screenBackgroundColor);
    const updateScreenBackgroundColor = useStore(state => state.updateScreenBackgroundColor);
    //const bringToFront = useStore(state => state.bringToFront);

    const deleteComponent = useStore(state => state.deleteComponent);

    const [showDataEditor, setShowDataEditor] = useState(false);
    const [editingData, setEditingData] = useState([]);

    //处置属性变化
    const handlePropertyChange = (property, value) => {
        if (selectedComponent && selectedComponent.id === 'screen') {
            if (property === 'backgroundColor') {
                updateScreenBackgroundColor(value);
            }
            return;
        }

        // Handle transparent toggle
        if (property.endsWith('Transparent')) {
            const colorProp = property.replace('Transparent', '');
            updateComponent(selectedComponent.id, {
                [property]: value
            });
            return;
        }

        // If it's a color property and currently in transparent state, only update value without changing transparent state
        const colorProps = ['backgroundColor', 'borderColor', 'color', 'fillColor', 'strokeColor', 'onColor'];
        if (colorProps.includes(property)) {
            const transparentKey = `${property}Transparent`;
            if (selectedComponent[transparentKey]) {
                // If currently transparent, cancel transparency first then update color
                updateComponent(selectedComponent.id, {
                    [transparentKey]: false,
                    [property]: value
                });
                return;
            }
        }

        // 处理数字类型
        if (property === 'fontSize' || property === 'index' || property === 'radius' ||
            property === 'strokeWidth' || property === 'min' || property === 'max' || property === 'value' ||
            property === 'x' || property === 'y' || property === 'w' || property === 'h' ||
            property === 'barSize' || property === 'barRadius' ||
            property === 'strokeWidth' || property === 'innerRadius' || property === 'arcWidth' ||
            property === 'startAngle' || property === 'endAngle' ||
            property === 'xMin' || property === 'xMax' || property === 'yMin' || property === 'yMax' ||
            property === 'xValue' || property === 'yValue' ) {
            value = value === '' ? 0 : Number(value);
        }

        if (property === 'radius' && selectedComponent.type === 'circle') {
            const radius = value === '' ? 0 : Number(value);
            const diameter = radius * 2;
            updateComponent(selectedComponent.id, {
                w: diameter,
                h: diameter,
                radius: radius
            });
            return;
        }

        if ((property === 'w' || property === 'h') && selectedComponent.type === 'circle') {
            const size = value === '' ? 0 : Number(value);
            const radius = Math.round(size / 2);
            updateComponent(selectedComponent.id, {
                w: size,
                h: size,
                radius: radius
            });
            return;
        }

        if (property === 'showGrid' || property === 'showXAxis' || property === 'showYAxis' ||
            property === 'showTooltip' || property === 'showLine' || property === 'showPoints' ||
            property === 'showLabel' || property === 'showPercentage' || property === 'showValue' ||
            property === 'showRange' || property === 'showValues' || property === 'returnToCenter') {
            value = Boolean(value);
        }

        updateComponent(selectedComponent.id, { [property]: value });
    };

    // 移除焦点校验值
    const handlePropertyBlur = (property, value) => {
        if (property === 'interval') {
            let num = Number(value);

            if (isNaN(num)) num = 3000;
            if (num < 3000) num = 3000;

            updateComponent(selectedComponent.id, {
                [property]: num
            });
        }
    };

    const handleScreenBackgroundChange = (color) => {
        updateScreenBackgroundColor(color);
    };

    // const handleBringToFront = () => {
    //     bringToFront(selectedComponent.id);
    // };

    // 生成颜色输入组件
    const renderColorInput = (field, component) => {
        const isTransparent = component[`${field.key}Transparent`] || false;
        const currentColor = component[field.key] || getDefaultColor(field.key);

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
                {/* 设置透明 */}
                {/* <button
                    type="button"
                    className={`transparentBtn ${isTransparent ? 'active' : ''}`}
                    onClick={() => handlePropertyChange(`${field.key}Transparent`, !isTransparent)}
                    title={isTransparent ? "Cancel transparent" : "Set as transparent"}
                >
                    {isTransparent ? 'Cancel Transparent' : 'Transparent'}
                </button> */}
            </div>
        );
    };

    // 获取默认颜色
    const getDefaultColor = (colorProp) => {
        const defaults = {
            color: '#ffffff',
            backgroundColor: '#000000',
            borderColor: '#2980b9',
            strokeColor: '#ffffff',
            fillColor: '#3498db',
            onColor: '#4CAF50'
        };
        console.log(defaults[colorProp]);
        return defaults[colorProp] || '#000000';
    };

    // Handle editing chart data
    const handleEditChartData = () => {
        const currentData = selectedComponent.data || [
            { name: 'A', value: 40 },
            { name: 'B', value: 60 },
            { name: 'C', value: 80 }
        ];
        setEditingData([...currentData]);
        setShowDataEditor(true);
    };

    const handleSaveChartData = () => {
        updateComponent(selectedComponent.id, { data: editingData });
        setShowDataEditor(false);
    };

    const handleAddDataRow = () => {
        setEditingData([...editingData, { name: `Data${editingData.length + 1}`, value: 50 }]);
    };

    const handleDeleteDataRow = (index) => {
        const newData = editingData.filter((_, i) => i !== index);
        setEditingData(newData);
    };

    const handleUpdateDataRow = (index, field, value) => {
        const newData = [...editingData];
        newData[index] = { ...newData[index], [field]: value };
        setEditingData(newData);
    };

    //移除组件
    const handleDeleteClick = (e, componentId) => {
        e.stopPropagation();
        if (componentId === 'screen') {
            alert('Screen component cannot be deleted');
            return;
        }
        if (window.confirm('Are you sure you want to delete this component?')) {
            deleteComponent(componentId);
        }
    };

    // Render screen background settings interface
    const renderScreenBackgroundSettings = () => {
        return (
            <div className={styles.propertyPanel}>
                {/* 类型区域 */}
                <div className={styles.panelHeader}>
                    screen
                </div>
                {/*属性区域 */}
                <div className={styles.propertyContent}>
                    <div className={styles.propertyField}>
                        <label>Background:</label>
                        <div className={styles.colorInputWrapper}>
                            <input
                                type="color"
                                value={screenBackgroundColor || '#000000'}
                                onChange={(e) => handleScreenBackgroundChange(e.target.value)}
                            />
                            {/* <button
                                type="button"
                                className={styles.transparentBtn"
                                onClick={() => handleScreenBackgroundChange('#000000')}
                                title="Set to black"
                            >
                                Black
                            </button> */}
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
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'index', label: 'Layer', type: 'number' }
        ];
        // if (selectedComponent.type !== 'title') {
        //     commonFields.push(
        //         { key: 'x', label: 'X Position', type: 'number', min: 0, max: 460, step: 1 },
        //         { key: 'y', label: 'Y Position', type: 'number', min: 0, max: 345, step: 1 }
        //     );

        //     if (selectedComponent.type !== 'circle') {
        //         commonFields.push(
        //             { key: 'w', label: 'Width', type: 'number', min: 1, max: 460, step: 1 },
        //             { key: 'h', label: 'Height', type: 'number', min: 1, max: 345, step: 1 }
        //         );
        //     }
        // }
        return commonFields;
    };

    const typeSpecificFields = {
        title: [
            { key: 'text', label: 'Text', type: 'text' },
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'backgroundColor', label: 'Background', type: 'color' },
            { key: 'fontSize', label: 'Font Size', type: 'number' },
            // { key: 'fontWeight', label: 'Font Weight', type: 'select', options: ['normal', 'bold'] }
        ],
        label: [
            { key: 'text', label: 'Text', type: 'text' },
            { key: 'color', label: 'Color', type: 'color' },
            // { key: 'backgroundColor', label: 'Background', type: 'color' },
            { key: 'fontSize', label: 'Font Size', type: 'number' },
            { key: 'interval', label: 'Interval(ms)', type: 'number',min: 3000},

            // { key: 'fontWeight', label: 'Font Weight', type: 'select', options: ['normal', 'bold'] }
        ],
        rectangle: [
            { key: 'backgroundColor', label: 'Background', type: 'color' },
            { key: 'borderColor', label: 'Border Color', type: 'color' }
        ],
        circle: [
            { key: 'radius', label: 'Radius', type: 'number' },
            { key: 'backgroundColor', label: 'Background', type: 'color' },
            { key: 'borderColor', label: 'Border Color', type: 'color' }
        ],
        line: [
            { key: 'strokeColor', label: 'Line Color', type: 'color' },
            { key: 'strokeWidth', label: 'Line Width', type: 'number' }
        ],
        image: [
            { key: 'src', label: 'URL', type: 'text' }
        ],
        text: [
            { key: 'text', label: 'Text', type: 'text' },
            { key: 'color', label: 'Color', type: 'color' },
            // { key: 'backgroundColor', label: 'Background', type: 'color' },
            { key: 'fontSize', label: 'Font Size', type: 'number' },
            // { key: 'fontWeight', label: 'Font Weight', type: 'select', options: ['normal', 'bold'] }
        ],
        button: [
            { key: 'text', label: 'Text', type: 'text' },
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'backgroundColor', label: 'Background', type: 'color' },
            { key: 'fontSize', label: 'Font Size', type: 'number' },
        ],
        switch: [
            { key: 'backgroundColor', label: 'Background', type: 'color' },
            { key: 'onColor', label: 'On Color', type: 'color' }
        ],
        slider: [
            { key: 'min', label: 'Min', type: 'number' },
            { key: 'max', label: 'Max', type: 'number' },
            { key: 'value', label: 'Value', type: 'number' },
            { key: 'fillColor', label: 'Color', type: 'color' }
        ],
        barChart: [
            { key: 'color', label: 'Bar Color', type: 'color' },
            { key: 'barSize', label: 'Bar Width', type: 'number', min: 10, max: 100 },
            { key: 'barRadius', label: 'Bar Radius', type: 'number', min: 0, max: 20 },
            { key: 'xAxisName', label: 'X Axis Name', type: 'text' },
            { key: 'yAxisName', label: 'Y Axis Name', type: 'text' },
            { key: 'showGrid', label: 'Show Grid', type: 'checkbox' },
            { key: 'showXAxis', label: 'Show X Axis', type: 'checkbox' },
            { key: 'showYAxis', label: 'Show Y Axis', type: 'checkbox' }
        ],
        lineChart: [
            { key: 'color', label: 'Line Color', type: 'color' },
            { key: 'strokeWidth', label: 'Line Width', type: 'number', min: 1, max: 10 },
            { key: 'xAxisName', label: 'X Axis Name', type: 'text' },
            { key: 'yAxisName', label: 'Y Axis Name', type: 'text' },
            { key: 'showGrid', label: 'Show Grid', type: 'checkbox' },
            { key: 'showXAxis', label: 'Show X Axis', type: 'checkbox' },
            { key: 'showYAxis', label: 'Show Y Axis', type: 'checkbox' },
            { key: 'showTooltip', label: 'Show Tooltip', type: 'checkbox' },
            { key: 'showLine', label: 'Show Line', type: 'checkbox' },
            { key: 'showPoints', label: 'Show Points', type: 'checkbox' },
            { key: 'lineType', label: 'Line Type', type: 'select', options: ['monotone', 'linear', 'step'] }
        ],
        pieChart: [
            { key: 'showLabel', label: 'Show Label', type: 'checkbox' },
            { key: 'showPercentage', label: 'Show Percentage', type: 'checkbox' },
            { key: 'innerRadius', label: 'Inner Radius (0-80)', type: 'number', min: 0, max: 80 },
            { key: 'outerRadius', label: 'Outer Radius (%)', type: 'text' },
            { key: 'showTooltip', label: 'Show Tooltip', type: 'checkbox' }
        ],
        gauge: [
            { key: 'value', label: 'Value', type: 'number' },
            { key: 'min', label: 'Min Value', type: 'number' },
            { key: 'max', label: 'Max Value', type: 'number' },
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'label', label: 'Text', type: 'text' },
            // { key: 'showValue', label: 'Show Value', type: 'checkbox' },
            // { key: 'showRange', label: 'Show Range', type: 'checkbox' }
        ],
        joystick: [
            { key: 'xMin', label: 'X Min', type: 'number' },
            { key: 'xMax', label: 'X Max', type: 'number' },
            { key: 'yMin', label: 'Y Min', type: 'number' },
            { key: 'yMax', label: 'Y Max', type: 'number' },
            { key: 'color', label: 'Color', type: 'color' },
            // { key: 'returnToCenter', label: 'Auto Return to Center', type: 'checkbox' }
        ]
    };

    const getInputValue = (component, key, defaultValue = '') => {
        if (key === 'radius' && component.type === 'circle') {
            const radius = Math.round((component.w || 0) / 2);
            return radius === 0 ? '' : radius;
        }

        const value = component[key];
        if (value === 0 || value === '0') {
            return '';
        }
        return value !== undefined && value !== null ? value : defaultValue;
    };

    const renderPropertyFields = () => {
        const commonFields = getCommonFields();
        const specificFields = typeSpecificFields[selectedComponent.type] || [];

        const fields = [...commonFields];

        fields.push(...specificFields);

        return fields.map(field => {
            if ((selectedComponent.type === 'barChart' ||
                selectedComponent.type === 'lineChart' ||
                selectedComponent.type === 'pieChart') && field.key === 'data') {
                return (
                    <div key={field.key} className={styles.propertyField}>
                        <label>{field.label}:</label>
                        <div className={styles.chartDataEditor}>
                            <button
                                type="button"
                                className={styles.dataEditBtn}
                                onClick={() => handleEditChartData()}
                            >
                                Edit Data
                            </button>
                        </div>
                    </div>
                );
            }

            if (field.type === 'color') {
                return (
                    <div key={field.key} className={styles.propertyField}>
                        <label>{field.label}:</label>
                        {renderColorInput(field, selectedComponent)}
                    </div>
                );
            }

            return (
                <div key={field.key} className={styles.propertyField}>
                    <label>{field.label}:</label>
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
                            onBlur={(e) => handlePropertyBlur(field.key, e.target.value)}
                            placeholder="0"
                            min={field.min}
                            max={field.max}
                            step={field.step || 1}
                        />
                    )}
                    {field.type === 'select' && (
                        <select
                            value={selectedComponent[field.key] || ''}
                            onChange={(e) => handlePropertyChange(field.key, e.target.value)}
                        >
                            {field.options.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    )}
                    {field.type === 'checkbox' && (
                        <input
                            type="checkbox"
                            checked={selectedComponent[field.key] !== false}
                            onChange={(e) => handlePropertyChange(field.key, e.target.checked)}
                        />
                    )}
                </div>
            );
        });
    };

    return (
        <div className={styles.propertyPanel}>
            {/* 类型区域 */}
            <div className={styles.panelHeader}>
                {selectedComponent.type}
            </div>
            {/*属性区域 */}
            <div className={styles.propertyContent}>
                {(selectedComponent.type === 'barChart' ||
                    selectedComponent.type === 'lineChart' ||
                    selectedComponent.type === 'pieChart') && (
                        <div className={styles.propertyField}>
                            <label>Chart Data:</label>
                            <div className={styles.chartDataEditor}>
                                <button
                                    type="button"
                                    className={styles.dataEditBtn}
                                    onClick={handleEditChartData}
                                >
                                    Edit Data
                                </button>
                            </div>
                        </div>
                    )}

                {/* 置顶按钮 */}
                {/* {selectedComponent.type !== 'title' && (
                    <div className={styles.layerControls}>
                        <h4>Layer Controls</h4>
                        <div className={styles.layerButtons}>
                            <button
                               className={`${styles['layerBtn']} ${styles['frontBtn']}`}
                                onClick={handleBringToFront}
                            >
                                Bring to Front
                            </button>
                        </div>
                    </div>
                )} */}

                {renderPropertyFields()}
            </div>

            {showDataEditor && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Edit Chart Data</h3>
                        <div className={styles.dataEditor}>
                            <div className={styles.dataHeader}>
                                <span>Name</span>
                                <span>Value</span>
                                <span>Action</span>
                            </div>
                            {editingData.map((item, index) => (
                                <div key={index} className={styles.dataRow}>
                                    <input
                                        type="text"
                                        value={item.name || ''}
                                        onChange={(e) => handleUpdateDataRow(index, 'name', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        value={item.value || 0}
                                        onChange={(e) => handleUpdateDataRow(index, 'value', Number(e.target.value))}
                                    />
                                    <button
                                        type="button"
                                        className={styles.deleteRowBtn}
                                        onClick={() => handleDeleteDataRow(index)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className={styles.addRowBtn}
                                onClick={handleAddDataRow}
                            >
                                Add Data Row
                            </button>
                        </div>
                        <div className={styles.modalActions}>
                            <button onClick={handleSaveChartData}>Save</button>
                            <button onClick={() => setShowDataEditor(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 删除按钮 */}
            <div className={styles.panelFooter}>
                <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteClick(e, selectedComponent.id)}
                >
                    <img
                        src={deleteIcon}
                        className={styles.deleteIcon}
                    />
                    <span>delete</span>
                </button>
            </div>
        </div>
    );
};

export default PropertyPanel;