import React from 'react';
import useStore from '../../stores/useStore.js';
import styles from './AddedComponentsList.css';

const AddedComponentsList = () => {
    const {
        components,
        selectedComponent,
        selectComponent,
        deleteComponent
    } = useStore();

    const componentIcons = {
        screen: '🖥️',
        title: 'T',
        label: 'L',
        rectangle: '□',
        circle: '○',
        line: '—',
        image: '🖼',
        text: '📝',
        button: '🔘',
        switch: '⚡',
        slider: '🎚',
        barChart: '📊',
        // New component icons
        lineChart: '📈',
        pieChart: '🥧',
        gauge: '🎛️',
        joystick: '🕹️'
    };

    const componentNames = {
        screen: 'Screen',
        title: 'Title',
        label: 'Label',
        rectangle: 'Rectangle',
        circle: 'Circle',
        line: 'Line',
        image: 'Image',
        text: 'Text',
        button: 'Button',
        switch: 'Switch',
        slider: 'Slider',
        barChart: 'Bar Chart',
        // New component names
        lineChart: 'Line Chart',
        pieChart: 'Pie Chart',
        gauge: 'Gauge',
        joystick: 'Joystick'
    };

    const handleComponentClick = (component) => {
        selectComponent(component.id);
    };

    const handleDeleteClick = (e, componentId) => {
        e.stopPropagation();
        // Screen component cannot be deleted
        if (componentId === 'screen') {
            alert('Screen component cannot be deleted');
            return;
        }
        if (window.confirm('Are you sure you want to delete this component?')) {
            deleteComponent(componentId);
        }
    };

    const getComponentDisplayName = (component) => {
        if (component.name && component.name.trim() !== '') {
            return component.name;
        }

        // If there is text content, use it as display name
        if (component.text && component.text.trim() !== '') {
            return component.text.length > 10
                ? component.text.substring(0, 10) + '...'
                : component.text;
        }

        // Otherwise use component type name
        return componentNames[component.type] || component.type;
    };

    // Create screen component object - ensure correct type
    const screenComponent = {
        id: 'screen',
        type: 'screen', // Ensure type is 'screen'
        name: 'Screen'
    };

    // Combine screen component with other components
    const allComponents = [screenComponent, ...components];

    return (
        <div className={styles.addedComponentsList}>
            {/* <h3>Added Components ({allComponents.length})</h3> */}
            <div className={styles.componentsContainer}>
                {allComponents.map(component => (
                    <div
                        key={component.id}
                        className={[
                            styles.componentItem,
                            selectedComponent?.id === component.id && styles.selected,
                            component.type === 'screen' && styles.screenComponent
                        ].filter(Boolean).join(' ')}
                        onClick={() => handleComponentClick(component)}
                    >
                        <div className={styles.componentInfo}>
                            <div className={styles.componentIcon}>
                                {componentIcons[component.type] || '?'}
                            </div>
                            <div className={styles.componentDetails}>
                                <div className={styles.componentName}>
                                    {component.type === 'screen' ? 'Screen' : getComponentDisplayName(component)}
                                </div>
                                <div className={styles.componentType}>
                                    {componentNames[component.type] || component.type}
                                </div>
                            </div>
                        </div>
                        {/* Screen component does not show delete button */}
                        {component.type !== 'screen' && (
                            <button
                                className={styles.deleteBtn}
                                onClick={(e) => handleDeleteClick(e, component.id)}
                                title="Delete component"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AddedComponentsList;