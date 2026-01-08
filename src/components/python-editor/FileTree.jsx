import React, { useState, useEffect, useCallback } from "react";
import styles from "./python-ide.css";
import {FormattedMessage} from 'react-intl';

const FileTree = ({
    tree,
    expanded,
    activeFile,
    toggleFolder,
    handleSelectFile,
    handleNewFile,
    handleNewFolder,
    handleRename,
    handleDelete,
    handleShowInFolder,
    handleUpload
}) => {

    const [openMenuPath, setOpenMenuPath] = useState(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (e.target.closest(`.${styles.moreMenuWrapper}`)) return;
            setOpenMenuPath(null);
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const toggleMenu = useCallback((path) => {
        setOpenMenuPath(prev => (prev === path ? null : path));
    }, []);

    const renderTree = (nodes, parentPath = "") => {
        return nodes.map(node => {
            const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;

            const isFolder = node.type === "folder";
            const isPyFile = node.type === "file";
            const isOther = node.type === "other";

            const isMenuOpen = openMenuPath === fullPath;

            return (
                <div key={fullPath} className={styles.nodeWrapper}>
                    <div
                        className={`${styles.fileItem} ${activeFile === fullPath ? styles.active : ""}`}
                        onClick={(e) => {
                            if (e.target.closest(`.${styles.moreMenuWrapper}`)) return;

                            if (isFolder) {
                                toggleFolder(fullPath);
                            } else if (isPyFile) {
                                handleSelectFile(fullPath, true);
                            }
                        }}
                    >
                        <div className={styles.fileItemTop}>
                            <div className={styles.fileName}>
                                {isFolder ? (expanded[fullPath] ? "📂" : "📁")
                                    : isPyFile ? "📄"
                                    : "📘"}{" "}
                                {node.name}
                            </div>

                            {/* {(isFolder || isPyFile) && ( */}
                                <div className={styles.moreMenuWrapper}>
                                    <button
                                        className={styles.moreButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleMenu(fullPath);
                                        }}
                                    >
                                        ⋮
                                    </button>

                                    {isMenuOpen && (
                                        <div className={styles.moreMenu}>
                                            {isFolder ? (
                                                <>
                                                    <div onClick={() => handleNewFile(fullPath)}> <FormattedMessage defaultMessage="New File" id="python.editor.Tree.createFile" /> </div>
                                                    <div onClick={() => handleNewFolder(fullPath)}><FormattedMessage defaultMessage="New Folder" id="python.editor.Tree.createFolder" /></div>
                                                    <div onClick={() => handleUpload(fullPath)}><FormattedMessage defaultMessage="Upload" id="python.editor.Tree.upload" /></div>
                                                    <div onClick={() => handleRename(fullPath, "folder")}><FormattedMessage defaultMessage="Rename" id="python.editor.Tree.rename" /></div>
                                                    <div onClick={() => handleDelete(fullPath, "folder")}><FormattedMessage defaultMessage="Delete" id="python.editor.Tree.delete" /></div>
                                                </>
                                            ) : (
                                                <>
                                                    {isPyFile && (
                                                        <div onClick={() => handleRename(fullPath, "file")}><FormattedMessage defaultMessage="Rename" id="python.editor.Tree.rename" /></div>
                                                    )}
                                                    {/* 所有文件类型都有选项 */}
                                                    <div onClick={() => handleDelete(fullPath, node.type)}><FormattedMessage defaultMessage="Delete" id="python.editor.Tree.delete" /></div>
                                                    <div onClick={() => handleShowInFolder(fullPath)}><FormattedMessage defaultMessage="Open File Location" id="python.editor.Tree.open" /></div>

                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            {/* )} */}
                        </div>
                    </div>

                    {isFolder && expanded[fullPath] && (
                        <div className={styles.childList}>
                            {renderTree(node.children, fullPath)}
                        </div>
                    )}
                </div>
            );
        });
    };

    return <div className={styles.fileList}>{renderTree(tree)}</div>;
};

export default FileTree;
