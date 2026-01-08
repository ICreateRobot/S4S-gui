// python 编辑器
import React, { useState,useEffect,useRef } from 'react';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';//暗色，未来会用
import styles from './python-ide.css';
import { EditorView } from '@codemirror/view';
import pythonIcon from '!../../lib/tw-recolor/build!./icon--python.svg';//python图标
// import addFileIcon from '!../../lib/tw-recolor/build!./icon--addFile.svg';//添加图标
import pyIcon from './pyFile.svg';
import fileIcon from './file.svg';

import FileTree from "./FileTree.jsx";



const MAX_TERMINAL_LEN = 100_000;

const PythonEditor = ({intl,theme}) => {
    const [activeFile, setActiveFile] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [code, setCode] = useState('');
    
    const terminalRef = useRef(null);
    const [terminalContent, setTerminalContent] = useState('');
    const [isComposing, setIsComposing] = useState(false); // 处理中文输入法
    const [pendingInput, setPendingInput] = useState(''); // 等待输入的内容
    
    const [tree, setTree] = useState([]);// 文件树（包含文件夹和文件）
    const [expanded, setExpanded] = useState({});// 记录哪些文件夹当前处于展开状态

    
    let editorTheme = "light";
    if (theme.gui === "dark"){
        editorTheme = oneDark;
    }
    

    useEffect(() => {
        loadTree();

        // 监听主进程
        const offLog = window.EditorPreload.onPythonLog((data) => {
            setPendingInput(data)
            appendColoredOutput(data, 'log');
            
        });

        const offErr = window.EditorPreload.onPythonError((data) => {
            appendColoredOutput(data, 'error');
        });

        const offExit = window.EditorPreload.onPythonExit((code) => {
            appendColoredOutput('>>>\n', 'bg');
            setIsRunning(false);
        });

        return () => {
            offLog();
            offErr();
            offExit();
        };
    }, []);

    // 切换文件夹展开/收起
    const toggleFolder = (path) => {
        setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
    };

    // 加载文件树（支持多级目录）(禁用部分为首次打开自动加载第一个文件)
    const loadTree = async () => {
        const list = await window.EditorPreload.listPythonTree();  
        setTree(list);

        // 如果没有文件则不加载
        // if (list.length === 0) return;

        // // 默认打开第一个文件
        // const firstFile = findFirstFile(list);
        // if (firstFile) {
        //     const content = await window.EditorPreload.readPythonFile(firstFile);
        //     setActiveFile(firstFile);
        //     setCode(content);
        // }
    };

    // 递归查找第一个文件
    // const findFirstFile = (nodes, parent="") => {
    //     for (let n of nodes) {
    //         const full = parent ? `${parent}/${n.name}` : n.name;
    //         if (n.type === "file") return full;
    //         if (n.children) {
    //             const f = findFirstFile(n.children, full);
    //             if (f) return f;
    //         }
    //     }
    //     return null;
    // };


    // 递归函数：检查某个节点下是否已存在同名文件或文件夹（ai写的，没研究）
    const existsInTree = (nodes, targetPath, parent = "") => {
        for (let item of nodes) {
            // 为每个节点生成虚拟 fullPath（用 / 作为分隔符）
            const nodeFull = parent ? `${parent}/${item.name}` : item.name;

            // 如果是文件，用 nodeFull 或者 item.path（绝对）都可比较，但我们用 nodeFull
            if (nodeFull === targetPath) return true;

            // 递归检查子节点（文件夹）
            if (item.children && item.children.length) {
                if (existsInTree(item.children, targetPath, nodeFull)) return true;
            }
        }
        return false;
    };


    //更新展开文件路径
    const updateExpandedPaths = (expanded, oldPath, newPath) => {
        const newExpanded = {};
    
        Object.keys(expanded).forEach(key => {
            if (key === oldPath || key.startsWith(oldPath + "/")) {
                const replaced = key.replace(oldPath, newPath);
                newExpanded[replaced] = expanded[key];
            } else {
                newExpanded[key] = expanded[key];
            }
        });
    
        return newExpanded;
    };
    


    //加载指定文件
    const handleSelectFile = async (name,save) => {
        console.log("upload",name,save)
        if(save){
            await handleSave();
        }

        if(name){//有名字（未来得改成只有py文件）
            const content = await window.EditorPreload.readPythonFile(name);
            setCode(content);
        }else{
            setCode("");
        }
        setActiveFile(name);
    };


    //创建新文件
    const handleNewFile = async (folderPath = "") => {
        let fileName = await prompt(intl.formatMessage({
            id: 'python.editor.createFileName',
            defaultMessage: 'New File Name'
        }));
        if (!fileName) return; // 输入为空
        fileName = fileName.trim();

        // 自动补 .py 后缀
        if (!fileName.toLowerCase().endsWith(".py")) {
            fileName = fileName + ".py";
        }

        const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;

        // 检查是否已存在
        if (existsInTree(tree, fullPath)) {
            alert(intl.formatMessage({
                id: 'python.editor.createFileName.err',
                defaultMessage: 'Creation failed: A file with the same name already exists!'
            }));
            return;
        }

        try {
            await window.EditorPreload.newPythonFile(fullPath);
        } catch (err) {
            alert("创建文件失败");
            return;
        }

        // 展开父文件夹 
        if (folderPath) {
            setExpanded(prev => ({
                ...prev,
                [folderPath]: true
            }));
        }

        // 刷新树并打开新创建的文件
        await loadTree();
        await handleSelectFile(fullPath,true);
    };

    //新文件夹
    const handleNewFolder = async (folderPath) => {
        let fileName = await prompt(intl.formatMessage({
            id: 'python.editor.createFolderName',
            defaultMessage: 'New Folder Name'
        }));
        if (!fileName) return; // 输入为空
        fileName = fileName.trim();

        const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;

        // 检查是否已存在
        if (existsInTree(tree, fullPath)) {
            alert(intl.formatMessage({
                id: 'python.editor.createFolderName.err',
                defaultMessage: 'Creation failed: A folder with the same name already exists!'
            }));
            return;
        }

        await window.EditorPreload.newPythonFolder(fullPath);
        loadTree();
    };

    //删除
    const handleDelete = async (name, type) => {
        if (
            activeFile === name ||
            activeFile.startsWith(name + "/")
        ) {
            await handleSelectFile("", false);
        }
    
        if (type === "folder") {
            setExpanded(prev => {
                const next = {};
                Object.keys(prev).forEach(key => {
                    if (key !== name && !key.startsWith(name + "/")) {
                        next[key] = prev[key];
                    }
                });
                return next;
            });
        }
    
        await window.EditorPreload.deletePythonFile(name);
        await loadTree();
    };
    
    //重命名
    const handleRename = async (oldFullPath, type) => {
        let newName  = await prompt(intl.formatMessage({
            id: 'python.editor.rename',
            defaultMessage: 'New Name'
        }));
        if (!newName ) return;
        newName = newName.trim();

        // 文件必须加 .py
        if (type === "file" ) {
            if(!newName.toLowerCase().endsWith(".py")){
                newName = newName + ".py";
            }
            await handleSave()
        }

        const pathParts = oldFullPath.split("/");
        pathParts.pop(); // 去掉旧名字
        const newFullPath = [...pathParts, newName].join("/");
        // 查重
        if (existsInTree(tree, newFullPath)) {
            alert(intl.formatMessage({
                id: 'python.editor.rename.err',
                defaultMessage: 'Rename failed: Name already exists!'
            }));
            return;
        }

        await window.EditorPreload.renamePythonItem(oldFullPath, newFullPath, type);

        //重新打开
        if (type === "file") {
            if (activeFile === oldFullPath) {
                //setActiveFile(newFullPath);
                handleSelectFile(newFullPath,false)
            }
        } else if (type === "folder") {
            await setExpanded(prev => updateExpandedPaths(prev, oldFullPath, newFullPath));//新增，修正展开状态

            if (activeFile.startsWith(oldFullPath + "/")) {
                const updated = activeFile.replace(oldFullPath + "/", newFullPath + "/");
                //setActiveFile(updated);
                handleSelectFile(updated,false)
            }
        }
    
        await loadTree();
    };

    //保存文件
    const handleSave = async () => {
        console.log("want save",activeFile)
        if (activeFile) {
            console.log("saveing……")
            await window.EditorPreload.savePythonFile(activeFile, code);
        }
    };


    // //上传
    const handleUpload = async (targetDir = "") => {
        const input = document.createElement("input");
        input.type = "file";
        //input.webkitdirectory = true;//选择一个文件夹
        input.multiple = true;//可多文件
 
        input.onchange = async (event) => {
            try{
                const files = Array.from(event.target.files);  // 拷贝出来避免事件回收
                if (files.length === 0) return;

                console.log(`开始上传 ${files.length} 个文件`);
            
                for (const f of files) {
                    const relativePath = f.webkitRelativePath || f.name;
                    console.log(`上传: ${relativePath} (${f.size} bytes)`);

                    const arrayBuffer = await f.arrayBuffer();

                    await window.EditorPreload.uploadPythonFile(
                        targetDir,
                        relativePath,
                        arrayBuffer
                    );
                }

                await loadTree();
            }catch(e){
                console.log(e)
            }
            
        };        
    
        input.click();
    };
    
    //打开位置
    const handleShowInFolder = async (relativePath) => {
        await window.EditorPreload.showInFolder(relativePath);
    };
    


    

 
    
    

    

    /* -----------------------------运行相关 */
    //运行
    const handleRun = async () => {
        await handleSave();//先保存
        setIsRunning(true);
        try {
            setPendingInput('');
            appendColoredOutput('= RESTART: ' + activeFile + '\n', 'bg');
            await window.EditorPreload.runPython(activeFile);
        } catch (error) {
            //setTerminalOutput(`错误: ${error.message}`);
            setIsRunning(false);
        }
    };

    //停止
    const handleStop = async () => {
        try {
            await window.EditorPreload.stopPython();
            appendColoredOutput('\n[Process stopped]\n', 'exit');
        } catch (e) {
            console.error(e);
        } finally {
            setIsRunning(false);
        }
    };
    


    /* ------------------控制台相关 */
    // 添加带颜色的输出
    const appendColoredOutput = (text, type) => {
        const colorClass = getColorClass(type);
        const coloredText = `<span class="${colorClass}">${escapeHtml(text)}</span>`;
        
        setTerminalContent(prev => {
            const next = prev + coloredText;
            if (next.length > MAX_TERMINAL_LEN) {
                return next.slice(-MAX_TERMINAL_LEN);
            }
            return next;
        });
        
        setTimeout(() => {
            scrollToBottom();
            focusAtEnd();
        }, 10);
    };

    // HTML 转义
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // 获取颜色类名
    const getColorClass = (type) => {
        switch (type) {
            case 'error': return styles.errorText;
            case 'log': return styles.logText;
            case 'exit': return styles.exitText;
            case 'bg': return styles.bgText;
            default: return styles.logText;
        }
    };

    // 输入事件
    const handleKeyDown = (e) => {
        if (isComposing) return;

        if (e.key === 'Enter') {
            e.preventDefault();

            // 获取当前输入内容
            const el = terminalRef.current;
            const lines = el.innerText.split('\n');
            const lastLine = lines[lines.length - 1]; // 最后一行内容

            let inputText = lastLine;
            if (pendingInput && lastLine.startsWith(pendingInput)) {
                inputText = lastLine.slice(pendingInput.length);
            }
            inputText = inputText.trim();

            
            appendColoredOutput(inputText+'\n', 'log');
            window.EditorPreload.sendPythonInput(inputText + '\n');

            setPendingInput('');
            focusAtEnd();
        }
    };



    // 处理输入法状态
    const handleCompositionStart = () => setIsComposing(true);
    const handleCompositionEnd = () => setIsComposing(false);


    //清空
    const handleClearTerminal = () => {
        setTerminalContent('');
        setPendingInput('');
        setTimeout(() => {
            scrollToBottom();
            focusAtEnd();
        }, 10);
    };
    

    // 滚动到底部
    const scrollToBottom = () => {
        if (!terminalRef.current) return;
    
        // 终端外层容器
        const scrollContainer = terminalRef.current.closest(`.${styles.terminalContent1}`);
    
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    };
    

    // 聚焦到内容末尾
    const focusAtEnd = () => {
        const el = terminalRef.current;
        if (!el) return;
    
        el.focus();
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false); // 光标移到内容末尾
        selection.removeAllRanges();
        selection.addRange(range);
    };
    

    return (
        <div className={styles.editorWrapper}>
            {/* 左侧文件与代码编辑区整体 */}
            <div className={styles.leftPanel}>
                <div className={styles.fileEditorContainer}>
                    <div className={styles.fileSidebar}>
                        <div className={styles.fileHeader}>
                            <img src={fileIcon} className={styles.fileIcon} />
                            <h3>&nbsp;File</h3>
                            {/* <button onClick={handleNewFile}>＋</button> */}
                        </div>
                        <div className={styles.fileHandle}>
                            <button onClick={() => handleNewFile("")} className={styles.addButton}></button>
                            <button onClick={() => handleNewFolder("")} className={styles.addFolderButton} > </button>
                            <button onClick={() => handleUpload("")} className={styles.uploadButton}></button>
                        </div>

                        {/* 文件树显示 */}
                        <FileTree
                            tree={tree}
                            expanded={expanded}
                            activeFile={activeFile}
                            toggleFolder={toggleFolder}
                            handleSelectFile={handleSelectFile}
                            handleNewFile={handleNewFile}
                            handleNewFolder={handleNewFolder}
                            handleRename={handleRename}
                            handleDelete={handleDelete}
                            handleShowInFolder = {handleShowInFolder}
                            handleUpload={handleUpload}
                        />
                    </div>

                    <div className={styles.codeArea}>
                        <div className={styles.codeHeader}>
                            <div className={styles.codeHeaderName}>
                                <img
                                    draggable={false}
                                    src={pythonIcon()}
                                />
                                <div>{activeFile ? ' '+activeFile : '' }</div>
                            </div>
                            <button
                                onClick={isRunning ? handleStop : handleRun}
                                className={`${styles.runButton} ${isRunning ? styles.stopButton : ''}`}
                            >
                                {isRunning ? '⏹ STOP' : '▶ RUN'}
                            </button>

                        </div>
                        {activeFile ? (
                            <CodeMirror
                                value={code}
                                height="100%"
                                extensions={[python()]}
                                 theme={editorTheme}
                                onChange={setCode}
                                className={styles.codeMirror}
                            />
                        ) : (
                            <div className={styles.emptyEditor}>
                                {/*  */}
                                <FormattedMessage
                                    defaultMessage="Please select a file to start editing."
                                    id="python.editor.selectFile"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 右侧控制台 */}
            <div className={styles.rightPanel}>
                <div className={styles.terminalBox}>
                    <div className={styles.terminalHeader}>
                        <div className={styles.terminalTitle}>Terminal</div>
                        <button className={styles.clearButton} onClick={handleClearTerminal} > </button>
                    </div>
                    <div className={styles.terminalContent}>
                         <div 
                            ref={terminalRef}
                            className={styles.terminalContent1}
                            contentEditable="true"
                            dangerouslySetInnerHTML={{ __html: terminalContent }}
                            onKeyDown={handleKeyDown}
                            onCompositionStart={handleCompositionStart}
                            onCompositionEnd={handleCompositionEnd}
                            spellCheck="false"
                            suppressContentEditableWarning={true}
                        />
   
                    </div>
                </div>
            </div>
        </div>
    );
};

export default injectIntl(PythonEditor);



