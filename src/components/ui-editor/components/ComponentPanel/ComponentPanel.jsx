import React from 'react';
import useStore from '../../stores/useStore.js';
import AddedComponentsList from './AddedComponentsList.jsx';
import styles from './ComponentPanel.css';

// SVG 图标
import titleIcon from '../../assets/icons/title.svg';
import labelIcon from '../../assets/icons/label.svg';
import rectangleIcon from '../../assets/icons/rectangle.svg';
import circleIcon from '../../assets/icons/circle.svg';
import lineIcon from '../../assets/icons/line.svg';
import imageIcon from '../../assets/icons/image.svg';
import textIcon from '../../assets/icons/text.svg';
import buttonIcon from '../../assets/icons/button.svg';
import switchIcon from '../../assets/icons/switch.svg';
import sliderIcon from '../../assets/icons/slider.svg';

import {FormattedMessage, injectIntl} from 'react-intl';

const componentTypes = [
    { type: 'title', name: 'title', icon: titleIcon, nameId: 'uieditor.component.title',defaultLabel: 'title' },
    { type: 'label', name: 'label', icon: labelIcon, nameId: 'uieditor.component.label',defaultLabel: 'label' },
    { type: 'rectangle', name: 'rectangle', icon: rectangleIcon, nameId: 'uieditor.component.rectangle',defaultLabel: 'rectangle' },
    { type: 'circle', name: 'circle', icon: circleIcon, nameId: 'uieditor.component.circle',defaultLabel: 'circle' },
    { type: 'line', name: 'line', icon: lineIcon, nameId: 'uieditor.component.line',defaultLabel: 'line' },
    { type: 'image', name: 'image', icon: imageIcon, nameId: 'uieditor.component.image',defaultLabel: 'image' },
    // { type: 'text', name: 'text', icon: textIcon },
    { type: 'button', name: 'button', icon: buttonIcon, nameId: 'uieditor.component.button',defaultLabel: 'button' },
    { type: 'switch', name: 'switch', icon: switchIcon , nameId: 'uieditor.component.switch',defaultLabel: 'switch'},
    { type: 'slider', name: 'slider', icon: sliderIcon, nameId: 'uieditor.component.slider',defaultLabel: 'slider' },
];

const ComponentPanel = () => {
    const addComponent = useStore(state => state.addComponent);

    const handleDragStart = (e, type) => {
        e.dataTransfer.setData('componentType', type);
    };

    const handleClick = (type) => {
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
                            onDragStart={(e) => handleDragStart(e, comp.type)}
                            onClick={() => handleClick(comp.type)}
                        >
                            <img
                                src={comp.icon}
                                alt={comp.name}
                                className={styles.componentSvgIcon}
                            />
                            <span className={styles.componentName}>
                                <FormattedMessage
                                    id={comp.nameId}
                                    defaultMessage={comp.defaultLabel}
                                />
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            {/* <AddedComponentsList /> */}
        </div>
    );
};

export default ComponentPanel;
