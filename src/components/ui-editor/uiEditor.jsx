// UI编辑器
import React from 'react';
import {FormattedMessage, injectIntl} from 'react-intl';//勿删，国际化用
import styles from './uiEditor.css';

import Component from './components/ComponentPanel/ComponentPanel.jsx'//组件面板
import Editor from './components/Editor/Editor.jsx'//编辑区
import Property from './components/PropertyPanel/PropertyPanel.jsx'//属性面板

const UiEditor = ({intl}) => {
    return (
        <div className={styles.kk}>
            <Component></Component>
            <Editor></Editor>
            <Property></Property>
        </div>
    );
};

export default injectIntl(UiEditor);



