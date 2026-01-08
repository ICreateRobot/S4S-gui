// 代码编辑器（互动模式）
import React, { useRef } from 'react';

import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { EditorView } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import { oneDark } from '@codemirror/theme-one-dark';

import { connect } from 'react-redux';
import { setGeneratedCode } from 'scratch-gui/src/reducers/sun';


const CodeMirrorComponent = ({ generatedCode,onCodeChange ,theme }) => {
    const codeMirrorRef = useRef(null);
    
    // 是否暗色
    let editorTheme = "light";
    if (theme.gui === "dark"){
        editorTheme = oneDark;
    }

    // 创建移除焦点轮廓的扩展
    const noFocusOutline = EditorView.theme({
        '&.cm-focused': {
            outline: 'none !important',
            boxShadow: 'none !important',
            border: 'none !important'
        },
        '&': {
            border: 'none !important'
        }
    });

    const handleChange = value => {
        onCodeChange(value);   
    };

    return (
        <div style={{ 
            border: '1px solid var(--ui-black-transparent)', 
            backgroundColor: 'var(--editor-bg)', 
            padding: '10px',
            width:'100%',
            borderRadius: '10px',
            height: '60vh',
            overflow: 'hidden' // 添加 防止内容溢出
        }}>
            <CodeMirror
                ref={codeMirrorRef}
                value={generatedCode}
                height="50vh"
                width="100%"
                extensions={[
                    python(),
                    autocompletion(),
                    EditorView.lineWrapping,
                    noFocusOutline // 添加 移除焦点样式的扩展
                ]}
                theme = {editorTheme}
                onChange = {handleChange}
                basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: true,
                    foldGutter: true,
                    autocompletion: true,
                    syntaxHighlighting: true,
                }}
                style={{
                    borderRadius: '10px',
                    outline: 'none',
                    border: 'none'
                }}
            />
        </div>  
    );
};



const mapStateToProps = state => ({
    generatedCode: state.scratchGui.sun.generatedCode
});
const mapDispatchToProps = dispatch => ({
    onCodeChange: code => dispatch(setGeneratedCode(code))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CodeMirrorComponent);
