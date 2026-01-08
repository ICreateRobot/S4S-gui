// 搜索模块
import React from 'react';
import PropTypes from 'prop-types';
import styles from './ToolboxSearchButton.module.css';
import { FormattedMessage,injectIntl } from "react-intl";

const ToolboxSearchButton = ({intl, isActive = false, onClick,handleInputChange }) => {
    return (
        <div className={styles.container}>
            <div
                className={`${styles.button} ${isActive ? styles.active : ''}`}
                onClick={onClick}
                role="button"
            >
                <svg
                    className={styles.icon}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <path
                        d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z"
                        fill={ 'var(--motion-primary)'}
                    />
                </svg>
                <span className={styles.label}>
                <FormattedMessage
                        description="Search"
                        id="gui.searchbutton.search"
                    /> 
                </span>
            </div>
            { isActive && (
                <div className = {styles.searchBox}>
                    <input
                        type="text"
                        onChange={handleInputChange}
                        placeholder={intl.formatMessage({
                            id: 'gui.searchbutton.input',
                            defaultMessage: "Search Blocks..."
                        })}
                        className={styles.input}
                    />
                </div>
            )}  
        </div>
    );
};

ToolboxSearchButton.propTypes = {
    isActive: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    handleInputChange: PropTypes.func.isRequired
};

export default injectIntl(ToolboxSearchButton);
