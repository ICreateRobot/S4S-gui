// Tooltip.jsx
import React, { useState } from 'react';
import styles from './Tooltip.css';

const Tooltip = ({ children, text, position = 'bottom' }) => {
    const [visible, setVisible] = useState(false);

    return (
        <div 
            className={styles.tooltipContainer}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children}
            {visible && (
                <div className={`${styles.tooltip} ${styles[position]}`}>
                    {text}
                </div>
            )}
        </div>
    );
};

export default Tooltip;