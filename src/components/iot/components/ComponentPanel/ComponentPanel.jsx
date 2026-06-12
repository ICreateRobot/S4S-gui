import React from 'react';
import useStore from '../../stores/useStore.js';
// import AddedComponentsList from './AddedComponentsList.jsx';
import styles from './ComponentPanel.css'


import titleIcon from '../../assets/components/title.svg';
import labelIcon from '../../assets/components/label.svg';
import imageIcon from '../../assets/components/image.svg';
import textIcon from '../../assets/components/text.svg';
import buttonIcon from '../../assets/components/button.svg';
import switchIcon from '../../assets/components/switch.svg';
import sliderIcon from '../../assets/components/slider.svg';
import barChartIcon from '../../assets/components/bar-chart.svg';
import lineChartIcon from '../../assets/components/line-chart.svg';
import pieChartIcon from '../../assets/components/pie-chart.svg';
import gaugeIcon from '../../assets/components/gauge.svg';
import joystickIcon from '../../assets/components/joystick.svg';

const componentTypes = [
    { type: 'title', name: 'Title', icon: titleIcon },
    { type: 'label', name: 'Label', icon: labelIcon },
    { type: 'image', name: 'Image', icon: imageIcon },
    { type: 'text', name: 'Text', icon: textIcon },
    { type: 'button', name: 'Button', icon: buttonIcon },
    { type: 'switch', name: 'Switch', icon: switchIcon },
    { type: 'slider', name: 'Slider', icon: sliderIcon },
    // { type: 'barChart', name: 'Bar Chart', icon: barChartIcon },
    // { type: 'lineChart', name: 'Line Chart', icon: lineChartIcon },
    // { type: 'pieChart', name: 'Pie Chart', icon: pieChartIcon },
    { type: 'gauge', name: 'Gauge', icon: gaugeIcon },
    { type: 'joystick', name: 'Joystick', icon: joystickIcon }
];
// { type: 'rectangle', name: 'Rectangle', icon: '□' },
// { type: 'circle', name: 'Circle', icon: '○' },

/**
 * 组件面板
 */
const ComponentPanel = () => {
    // Get the addComponent method from global state management
    const addComponent = useStore(state => state.addComponent);

    /**
     * 处理拖动开始事件
     */
    const handleDragStart = (e, type) => {
        e.dataTransfer.setData('componentType', type);

        //e.currentTarget.classList.add(styles.dragging);
    };

    /**
     * 处理组件点击事件
     * @param {string} type - Component type
     */
    const handleClick = (type) => {
        // Call the addComponent method from global state management
        addComponent(type);
    };

    return (
        <div className={styles.componentPanelContainer}>
            <div className={styles.componentLibrary}>
                <div className={styles.componentList}>
                    {componentTypes.map(comp => (
                        <div
                            key={comp.type}
                            className={styles.componentItem}
                            draggable
                            onDragStart={(e) => handleDragStart(e, comp.type)} // 绑定
                            onClick={() => handleClick(comp.type)} // 绑定
                        >
                            {/* <div className={styles.componentIcon}>{comp.icon}</div>
                            <span className={styles.componentName}>{comp.name}</span> */}
                            <img
                                src={comp.icon}
                                // alt={comp.name}
                                className={styles.componentIcon}
                            />
                        </div>
                    ))}
                </div>
            </div>
            {/* <AddedComponentsList />  */}
        </div>
    );
};

export default ComponentPanel;