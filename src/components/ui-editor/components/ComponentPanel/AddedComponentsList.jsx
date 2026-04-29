import React from 'react';
import useStore from '../../stores/useStore.js';
import styles from './AddedComponentsList.css';

import screenIcon from '../../assets/icons/screen.svg';
import titleIcon from '../../assets/icons/title.svg';
import labelIcon from '../../assets/icons/label.svg';
import rectangleIcon from '../../assets/icons/rectangle.svg';
import circleIcon from '../../assets/icons/circle.svg';
import lineIcon from '../../assets/icons/line.svg';
import imageIcon from '../../assets/icons/image1.svg';
import textIcon from '../../assets/icons/text.svg';
import buttonIcon from '../../assets/icons/button.svg';
import switchIcon from '../../assets/icons/switch.svg';
import sliderIcon from '../../assets/icons/slider.svg';
import deleteIcon from '../../assets/icons/delete.svg';
import triangleIcon from '../../assets/icons/triangle.svg';

const AddedComponentsList = () => {
    const components = useStore(state => state.components);
    const selectedComponent = useStore(state => state.selectedComponent);
    const selectComponent = useStore(state => state.selectComponent);
    const deleteComponent = useStore(state => state.deleteComponent);

    const componentIcons = {
        screen: screenIcon,
        title: titleIcon,
        label: labelIcon,
        rectangle: rectangleIcon,
        circle: circleIcon,
        triangle: triangleIcon,
        line: lineIcon,
        image: imageIcon,
        text: textIcon,
        button: buttonIcon,
        switch: switchIcon,
        slider: sliderIcon
    };

    const componentNames = {
        screen: '屏幕',
        title: '标题',
        label: '标签',
        rectangle: '方形',
        circle: '圆形',
        triangle: '三角形',
        line: '直线',
        image: '图像',
        text: '文本',
        button: '按钮',
        switch: '开关',
        slider: '滑块'
    };

    const handleComponentClick = (component) => {
        selectComponent(component.id);
    };

    const handleDeleteClick = (e, componentId) => {
        e.stopPropagation();
        if (componentId === 'screen') {
            alert('屏幕组件不可删除');
            return;
        }
        if (window.confirm('确定要删除这个组件吗？')) {
            deleteComponent(componentId);
        }
    };

    const getComponentDisplayName = (component) => {
        if (component.name?.trim()) return component.name;
        if (component.text?.trim()) {
            return component.text.length > 10
                ? component.text.slice(0, 10) + '...'
                : component.text;
        }
        return componentNames[component.type] || component.type;
    };

    const screenComponent = {
        id: 'screen',
        type: 'screen',
        name: '屏幕'
    };

    const allComponents = [screenComponent, ...components];

    return (
        <div className={styles.addedComponentsList}>
            <div className={styles.componentsContainer}>
                {allComponents.map(component => {
                    const isSelected = selectedComponent?.id === component.id;
                    const isScreen = component.type === 'screen';

                    return (
                        <div
                            key={component.id}
                            className={[
                                styles.componentItem,
                                isSelected && styles.componentItemSelected,
                                isScreen && styles.screenComponent,
                                isScreen && isSelected && styles.screenComponentSelected
                            ].filter(Boolean).join(' ')}
                            onClick={() => handleComponentClick(component)}
                        >
                            <div className={styles.componentInfo}>
                                <img
                                    src={componentIcons[component.type]}
                                    alt={componentNames[component.type]}
                                    className={styles.componentSvgIcon}
                                />
                                <div className={styles.componentDetails}>
                                    <div className={styles.componentName}>
                                        {isScreen
                                            ? 'screen'
                                            : getComponentDisplayName(component)}
                                    </div>
                                </div>
                            </div>

                            {!isScreen && (
                                <button
                                    className={styles.deleteBtn}
                                    onClick={(e) =>
                                        handleDeleteClick(e, component.id)
                                    }
                                >
                                    <img
                                        src={deleteIcon}
                                        alt="删除"
                                        className={styles.deleteIcon}
                                    />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AddedComponentsList;
