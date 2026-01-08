// 包管理页面
import React, { useState, useEffect,useRef } from 'react';
import styles from './python-install.css';


// 推荐包数据
const samplePackages = [
    {
        id: 1,
        name: 'uJson',
        pkg:"ujson",//真正的包名
        description: '438274893274893274893274892847389.',
        category: 'data',
        installed: false,
        version: ''
    },
    {
        id: 2,
        name: 'NumPy',
        pkg:"",
        description: '11111111111111111111111111111111.',
        category: 'data',
        installed: false,
        version: ''
    },
    {
        id: 3,
        name: 'Pandas',
        description: 'Powerful data manipulation and analysis library. Provides data structures and operations for manipulating numerical tables and time series.',
        category: 'data',
        installed: false,
        version: ''
    },
    {
        id: 4,
        name: 'Matplotlib',
        description: 'Comprehensive library for creating static, animated, and interactive visualizations in Python.',
        category: 'chart',
        installed: false,
        version: ''
    },
    {
        id: 5,
        name: 'Requests',
        description: 'Elegant and simple HTTP library for Python, built for human beings.',
        category: 'web',
        installed: false,
        version: ''
    }
];

// 分类列表
const categories = [
    { id: 'all', name: 'ALL', count: 5 },
    { id: 'ai', name: 'AI', count: 3 },
    { id: 'data', name: 'Data Calculation', count: 8 },
    { id: 'game', name: 'Game', count: 5 },
    { id: 'chart', name: 'Chart', count: 4 }
];

const PythonInstall = () => {
    const [activeTab, setActiveTab] = useState('Recommended'); // recommended, installed, installer
    const [activeCategory, setActiveCategory] = useState('all'); // 包分类
    const [searchTerm, setSearchTerm] = useState('');
    const [packages, setPackages] = useState([]);
    const [installedPackages, setInstalledPackages] = useState([]);

    const [isLoading, setIsLoading] = useState(false);//安装与否
    const [installPackageName, setInstallPackageName] = useState(''); // 输入安装库名
    const [progressLog, setProgressLog] = useState(''); // 显示 pip 输出日志
    const [showInstallOverlay, setShowInstallOverlay] = useState(false);//显示下载log


    useEffect(() => {
        let isMounted = true;
        loadPackages();
    
        // 注册监听，获取 remove 函数
        const removeListener = window.EditorPreload.onPipProgress((msg) => {
            if (!isMounted) return;
            console.log(msg)
            if (msg.raw) {
                setProgressLog(prev => prev + msg.raw);
            }
        });
    
        // 卸载时清理
        return () => {
            isMounted = false;
            removeListener(); // 移除 ipcRenderer 监听
        };
    }, []);

    //加载推荐包
    const loadPackages = async () => {
        setIsLoading(true);
        try {
            setPackages(samplePackages);

            // 加载实际已安装包
            await loadInstalledPackages();
        } catch (error) {
            console.error('加载包列表失败:', error);
            
        }
    };

    // 加载系统重安装的库
    const loadInstalledPackages = async () => {
        try {
            const result  = await window.EditorPreload.pipPython("list","");
            if (!result.success) {
                console.error('加载已安装包失败:', result.error);
                return
            }

            let installed = result.data || [];
            // 去除不需要显示的系统包
            const skipList = ["pip"];
            installed = installed.filter(pkg => !skipList.includes(pkg.name.toLowerCase()));
            setInstalledPackages(installed);
            //console.log("当前已安装的包:", installed);

            // 根据已安装的库同步 samplePackages 状态
            setPackages(prev =>
                prev.map(pkg => {
                    const match = installed.find(inst => inst.name.toLowerCase() === pkg.name.toLowerCase());
                    return match
                        ? { ...pkg, installed: true, version: match.version }
                        : { ...pkg, installed: false };
                })
            );
            setIsLoading(false);
        } catch (error) {
            console.error('加载已安装包失败:', error);
        }
    };
    // 安装推荐包
    const handleInstall = (pkgName) => executePip("install", pkgName);

    // 输入安装
    const handleManualInstall = () => executePip("install", installPackageName);

    // 卸载
    const handleUninstall = (pkgName) => executePip("uninstall", pkgName);

    // 通用 pip 执行器
    const executePip = async (action, pkgName) => {
        setProgressLog('');
        setIsLoading(true);
        setShowInstallOverlay(true);
        console.log(pkgName)

        const result = await window.EditorPreload.pipPython(action, pkgName);

        if (result.success) {
            setShowInstallOverlay(false);
            showToast("Success");
            await loadInstalledPackages();
        } else {
            showToast(`Failed: ${result.error}`);
        }

        setIsLoading(false);
    };


    // 过滤包列表
    const filteredPackages = packages.filter(pkg => {
        const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
        //  || pkg.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'all' || pkg.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    // const installedPackagesFiltered = installedPackages.filter(pkg =>
    //     pkg.name.toLowerCase().includes(searchTerm.toLowerCase())
    // );

    // 警告窗口
    const showToast = (msg) => {
        const t = document.createElement("div");
        Object.assign(t.style, {
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#333",
        color: "#fff",
        padding: "8px 14px",
        borderRadius: "6px",
        zIndex: 9999,
        });
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    };

    return (
        <div className={styles.packageManager}>
            {/* 顶部标签页 */}
            <div className={styles.tabHeader}>
                {/* <div className={styles.tabList}>
                    <button
                        className={`${styles.tab} ${activeTab === 'recommended' ? styles.active : ''}`}
                        onClick={() => setActiveTab('recommended')}
                    >
                        Recommend
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'installed' ? styles.active : ''}`}
                        onClick={() => setActiveTab('installed')}
                    >
                        Install List
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'installer' ? styles.active : ''}`}
                        onClick={() => setActiveTab('installer')}
                    >
                        Installer
                    </button>
                </div> */}
                <div className={styles.categorySection}>
                    <div className={styles.categoryList}>
                        <button
                            key={"Recommended"}
                            className={`${styles.categoryTab} ${activeTab === "Recommended" ? styles.active : ''}`}
                            onClick={() => setActiveTab('Recommended')}
                        >
                            Recommended
                        </button>
                        <button
                            key={"Installed"}
                            className={`${styles.categoryTab} ${activeTab === "Installed" ? styles.active : ''}`}
                            onClick={() => setActiveTab('Installed')}
                        >
                            Installed
                        </button>
                        {/* 下面这些后续需求应该会用的到，非切换页面时 */}
                        {/* {categories.map(category => (
                            <button
                                key={category.id}
                                className={`${styles.categoryTab} ${activeCategory === category.id ? styles.active : ''}`}
                                onClick={() => setActiveCategory(category.id)}
                            >
                                {category.name}
                                <span className={styles.categoryCount}>({category.count})</span>
                            </button>
                        ))} */}
                    </div>
                    {activeTab === 'Recommended' && (
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    )}
                </div>
            </div>
    
            {/* 推荐页 */}
            {activeTab === 'Recommended' && (
                <>
                    <div className={styles.packageGrid}>
                        {isLoading ? (
                            <div className={styles.loading}>loading...</div>
                        ) : filteredPackages.length > 0 ? (
                            filteredPackages.map(pkg => (
                                <PackageCard
                                    key={pkg.id}
                                    pkg={pkg}
                                    onInstall={handleInstall}
                                    onUninstall={handleUninstall}
                                    isInstalled={pkg.installed}
                                />
                            ))
                        ) : (
                            <div className={styles.emptyState}>No matching package was found</div>
                            // 未找到匹配的包
                        )}
                    </div>
                </>
            )}
    
            {/* 已安装列表页 */}
            {activeTab === 'Installed' && (
                <div className={styles.installedList}>
                    {isLoading ? (
                        <div className={styles.loading}>loading...</div>
                    ) : installedPackages.length > 0 ? (
                        <div className={styles.installedPackages}>
                            {installedPackages.map(pkg => (
                                <div key={pkg.name} className={styles.installedItem}>
                                    <span className={styles.installedName}>{pkg.name}</span>
                                    <span className={styles.installedVersion}>v{pkg.version}</span>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => handleUninstall(pkg.name)}
                                        title="uninstall"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>暂无已安装的包</div>
                    )}
                </div>
            )}
    
            {/* 安装器页 */}
            {activeTab === 'Installer' && (
                <div className={styles.installerSection}>
                    <div className={styles.installerBox}>
                        <div className={styles.installerInputGroup}>
                            <input
                                type="text"
                                placeholder="package name"
                                value={installPackageName}
                                onChange={(e) => setInstallPackageName(e.target.value)}
                                className={styles.installerInput}
                            />
                            <button
                                className={styles.installerButton}
                                onClick={handleManualInstall}
                                disabled={!installPackageName.trim() || isLoading}
                            >
                                Install
                            </button>
                        </div>
                    </div>
                   
                </div>
            )}
            <InstallOverlay
                visible={showInstallOverlay}
                onClose={async () => {
                    await window.EditorPreload.pipPython("cancel",''); // 终止安装
                    setShowInstallOverlay(false);
                }}
                log={progressLog}
            />

        </div>
    );
};

// 包卡片组件
const PackageCard = ({ pkg, onInstall, onUninstall, isInstalled }) => {
    return (
        <div className={styles.packageCard}>
            <div className={styles.packageHeader}>
                <h3 className={styles.packageName}>{pkg.name}</h3>
                {/* <span className={styles.packageVersion}>v{pkg.version}</span> */}
            </div>
            <p className={styles.packageDescription}>{pkg.description}</p>
            <div className={styles.packageActions}>
                {isInstalled ? (
                    <button
                        className={styles.uninstallButton}
                        onClick={() => onUninstall(pkg.pkg)}
                        disabled={pkg.isSystem}
                    >
                        uninstall
                    </button>
                ) : (
                    <button
                        className={styles.installButton}
                        onClick={() => onInstall(pkg.pkg)}
                    >
                        install
                    </button>
                )}
            </div>
        </div>
    );
};


// 全屏安装控制台弹窗
const InstallOverlay = ({ visible, onClose, log }) => {
    const logRef = useRef(null);

    // 自动滚动到底部
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [log]);

    if (!visible) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(50, 50, 50, 0.8)",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                zIndex: 9999,
                backdropFilter: "blur(4px)"
            }}
        >

            {/* 顶部栏 */}
            <div style={{
                    padding: "12px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                }}
            >
                {/* 中断按钮固定在右上角 */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        right: "20px",
                        top: "50%",
                        background: "transparent",
                        color: "#ccc",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "36px",
                        transition: "color  0.2s",
                    }}
                    onMouseOver={(e) => {
                        e.target.style.color = "#ff4c4c";
                    }}
                    onMouseOut={(e) => {
                        e.target.style.color = "#999";
                    }}
                >
                    &times;
                </button>
            </div>

            {/* 日志区域 */}
            <div
                ref={logRef}
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "30px",
                    fontFamily: "Consolas, monospace",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.4",
                    fontSize: "14px",
                    scrollbarWidth: "thin",
                    scrollbarColor: "#0f0 #222",
                }}
            >
                {log || "waiting..."}
            </div>
        </div>
    );
};


export default PythonInstall;