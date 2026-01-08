import { useState, useEffect, useRef } from 'react';
import formatMessage  from 'format-message';
import { setIsMaster, setIsBricks, getIsBricks, setRobotIp, setCurrent, getCurrent } from '../utils/utils.js';
import codeModule from '../../../../../utils/global.js';
import { setLan, getLan } from '../../../../../utils/lanMode.js';
import { setIsRobot, getShowCodeDb, setShowCodeDb, addLoadExtension, delLoadExtension, getLoadExtension, getAllLoaded, setAllLoaded, codeArray } from '../utils/utils.js';




let attemptCount = 0;
let extensionSelect = [false, false, false];//暂定为microbit，arduino，esp32(判断是否为首次加载使用,因为扩展实际并未删除)
let isRecive = false;
let isUpLoadMode = false;
let IP;
let reciveTimer = '';
let hasReceivedResponse = false;
let isPostIp = false;
let socketSuccess = false;
let socketTimer;
let whatConnect = [0, 0, 0];
let bleDownloadTimer;
let serialDownloadTimer;
let isUnMount = false;

export const useGuiLogic = (props) => { 
    const {
        onExtensionButtonClick,
        onOpenCustomExtensionModal,
        download,
        SerialDownload,
        saveCode,
        loadCode,
        cancelload,
        clickDownloadCode,
        clickEspSend,
        clickSendWifi,
    } = props;

    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(1);
    const [pythonCode, setPythonCode] = useState('print("Hello, World!")');
    const [childData, setChildData] = useState(1);
    const [isTrain, setIsTrain] = useState(false);
    const [isBricks, setbricks] = useState(false);
    const [showCode, setShowCode] = useState(getShowCodeDb());
    const [lanMode, setLanMode] = useState(getLan());
    const [isDown, setIsDown] = useState(true);
    const [currentExtension, setCurrentExtension] = useState('2');//当前的扩展序列（未来可能会不再使用）
    const [isLoading, setIsLoading] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);
    const [logs, setLogs] = useState([]);
    const [extensionName, setExtensionName] = useState(getCurrent().length > 0 ? getCurrent() : '选择设备');//当前选择设备名称（就用他了，以后有空统一）
    const [childBalls, setChildBalls] = useState([
        { image: '', text: '1', data: '', isShow: false },
        { image: '', text: '2', data: '', isShow: false },
        { image: '', text: '3', data: '', isShow: false },
        { image: '', text: '4', data: '', isShow: false },
        { image: '', text: '5', data: '', isShow: false },
        { image: '', text: '6', data: '', isShow: false },
        { image: '', text: '7', data: '', isShow: false },
        { image: '', text: '8', data: '', isShow: false },
    ]);
    const [socket, setSocket] = useState(null);
    const [soc, setSoc] = useState(null);
    const [upload, setUpload] = useState(null);
    const [data, setData] = useState('');
    const [selectedOption, setSelectedOption] = useState('');

    const [modeValue, setModeValue] = useState('interactive');//useState(currentModelValue); // 控制 切换按钮 状态

    // const portArr = [7, 0, 6, 1, 5, 2, 4, 3];

    // const channel1 = new BroadcastChannel('extensionSecondly');
    const channel2 = new BroadcastChannel('startRobotSocket');
    // const channelBleIsDown = new BroadcastChannel('ble-download');
    // const channelLoadExtension = new BroadcastChannel('loadExtension');
    const channelHostPot = new BroadcastChannel('hostpot');
    // const channelSendIp = new BroadcastChannel('sendIp');
    const channelTrain = new BroadcastChannel('channelTrain');
    const stopAll = new BroadcastChannel('stopAll');
    const channel = new BroadcastChannel('distance_channel');
    const channelMasterClose = new BroadcastChannel('master_close');
    const channelLoad = new BroadcastChannel('isLoading');
    // const bleChangeMode = new BroadcastChannel('ble-change')
    const channelLoadExample = new BroadcastChannel('load_example')

    useEffect(() => {
        const newSocket = new WebSocket('ws://localhost:8082');
        setSocket(newSocket);

        newSocket.addEventListener('open', (event) => {
        console.log('WebSocket connection opened');
        });

        // Handle incoming WebSocket messages
        newSocket.addEventListener('message', (event) => {
            // console.log(event.data)
            // console.log(JSON.parse(event.data))
            let sensorState=JSON.parse(event.data)
        //   let distance = event.data.split(',');
        //   distance = distance.map(Number);

        channel.postMessage(sensorState);  // 广播数据给其他页面

        });
    // Cleanup WebSocket connection when component unmounts
    return () => {
        console.log('Cleaning up WebSocket connection');
        newSocket.close();
        };
    }, []); // Empty dependency array to run only once
    useEffect(() => {
        channelLoad.addEventListener('message',(event)=>{
            if(!event.data){
                setIsLoading(event.data)
            }else{
                setIsLoading(event.data)
            }
        })
    }, []);

    useEffect(() => {
        // console.log('发送了一次当前模式');
        // channelMode.postMessage(!getShowCodeDb());
    }, []);

    useEffect(() => {
        channel2.addEventListener('message', (event) => {
            if (event.data == 'response') {
                hasReceivedResponse = true;
            }
        });
    }, []);

    useEffect(() => {
        channelTrain.addEventListener('message', (event) => {
            setIsTrain(event.data);
        });
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setPythonCode(prevCode => codeModule.getCode());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setbricks(prevCode => getIsBricks());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const handleOffline = () => {
            if (soc?.readyState === WebSocket.OPEN) {
                soc.send(JSON.stringify({
                    type: 'offline',
                    data: { message: 'true' }
                }));
            }
            whatConnect[1] = 0;
            channelHostPot.postMessage(false);
            console.log('Offline event handled');
        };

        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('offline', handleOffline); // ✅ 清除绑定，防止重复
        };
    }, []); // 👈 空依赖数组，确保只绑定一次
    const handleLoadSelectedCode = (index) => {
        const codeIndex = index ?? selectedIndex; // 👈 如果传了参数就用参数
        console.log('代码索引', codeIndex)
        const code = codeArray[codeIndex - 1];
        codeModule.setCode(code);
    };

    const handleChildData = async (data) => {
        setChildData(data + 1);
        console.log('子组件传来的数据:', data);
        downloadCodeTotal(data + 1);
    };

    function modifyPythonCode(code) {
        const lines = code.split('\n');
        let modifiedLines = [];
        let insideWhile = false;
        let whileStack = [];
        let importTimeAdded = false;
        let addedSleepLines = new Set();

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            modifiedLines.push(line);

            let trimmed = line.trim();
            let indentLevel = line.match(/^ */)[0].length;

            if (/^while\b.*:\s*$/.test(trimmed)) {
                whileStack.push({
                    startLine: i,
                    indent: indentLevel,
                    lineTrackingFound: false,
                    bodyStart: null
                });
            }

            if (whileStack.length > 0) {
                const currentWhile = whileStack[whileStack.length - 1];

                if (currentWhile.bodyStart === null && indentLevel > currentWhile.indent) {
                    currentWhile.bodyStart = i;
                }

                if (trimmed.includes('icrobot.rgb_sensor.line_tracking')) {
                    currentWhile.lineTrackingFound = true;
                }

                if (i > currentWhile.startLine && indentLevel <= currentWhile.indent) {
                    if (currentWhile.lineTrackingFound && currentWhile.bodyStart !== null) {
                        let insertIndent = ' '.repeat(currentWhile.indent + 4);
                        modifiedLines.splice(i, 0, insertIndent + 'time.sleep(0.05)');
                        i++;
                    }
                    whileStack.pop();
                }
            }
        }

        whileStack.forEach(w => {
            if (w.lineTrackingFound && w.bodyStart !== null) {
                let insertIndent = ' '.repeat(w.indent + 4);
                modifiedLines.push(insertIndent + 'time.sleep(0.05)');
            }
        });

        return modifiedLines.join('\n');
    }

    async function downloadCodeTotal(args) {
        if(whatConnect[1]==1){
            console.log('wifi下载');

            setIsLoading(true);
            let timerLoad = setTimeout(() => {
                alert(formatMessage({
                    id: 'gui.alert.downFailed',
                    default: 'Download failed',
                    description: 'gui.alert.downFailed'
                }));
                setIsLoading(false);
            }, 8000);
            let downloadCode = pythonCode;
            // if (!downloadCode.includes('while')) {
            //     downloadCode += '\nwhile True:\n    pass\n';
            // }
            downloadCode = modifyPythonCode(downloadCode);
            console.log(downloadCode);

            let place = args;
            console.log(place);
            if (place > 0 && place < 6) {
                let socket = new WebSocket(`ws://${IP}:8084`);
                socket.addEventListener('open', async () => {
                    socket.addEventListener('message', (event) => {
                        if (event.data === 'success') {
                            showToast(formatMessage({
                                id: 'gui.alert.downSuccess',
                                default: 'Download successful',
                                description: 'gui.alert.downSuccess'
                            }));
                            socket.close();
                            clearTimeout(timerLoad);
                            setIsLoading(false);
                        } else if (event.data === 'failed') {
                            showToast(formatMessage({
                                id: 'gui.alert.downFailed',
                                default: 'Download failed',
                                description: 'gui.alert.downFailed'
                            }));
                            socket.close();
                            clearTimeout(timerLoad);
                            setIsLoading(false);
                        }
                    });
                    const jsonData = {
                        command: "upload_script",
                        params: {
                            name: `${place}.py`,
                            script: downloadCode
                        }
                    };
                    socket.send(JSON.stringify(jsonData));
                });
            } else {
                alert(formatMessage({
                    id: 'gui.alert.selectplace',
                    default: '请选择正确坑位',
                    description: 'gui.alert.selectplace'
                }));
            }
        }else if(whatConnect[0]==1){
            console.log('蓝牙下载')
            console.log(args)
            if(extensionName=='ICBricks'){
                if (args==0) {
                    download(args);
                    setIsLoading(true)
                    if(bleDownloadTimer){
                        clearTimeout(bleDownloadTimer)
                    }
                    bleDownloadTimer=setTimeout(()=>{
                        setIsLoading(false)
                        alert(formatMessage({
                            id: 'gui.alert.downFailed',
                            default: 'Download failed',
                            description: 'gui.alert.downFailed'
                        }))
                    },6000)
                    
                } else {
                    cancelload();
                }
                 setIsDown(!isDown);
            }else if(extensionName=='ICRobot'){
                download(args);
                setIsLoading(true)
                if(bleDownloadTimer){
                    clearTimeout(bleDownloadTimer)
                }
                bleDownloadTimer=setTimeout(()=>{
                    setIsLoading(false)
                    alert(formatMessage({
                        id: 'gui.alert.downFailed',
                        default: 'Download failed',
                        description: 'gui.alert.downFailed'
                    }))
                },10000)
            }
        }else if(whatConnect[2]==1){
            console.log('串口下载')
            // let place = await new Promise(resolve => {
            //     resolve(prompt('请输入坑位(1-5)'));
            // });
            console.log(SerialDownload)
            let place=args
            if (place > 0 && place < 6) {
                SerialDownload(place);
                setIsLoading(true)
                if(serialDownloadTimer){
                    clearTimeout(serialDownloadTimer)
                }
                serialDownloadTimer=setTimeout(()=>{
                    setIsLoading(false)
                    alert(formatMessage({
                        id: 'gui.alert.downFailed',
                        default: 'Download failed',
                        description: 'gui.alert.downFailed'
                    }))
                },10000)
            } else {
                alert(formatMessage({
                        id: 'gui.alert.selectplace',
                        default: 'Please select the correct slot',
                        description: 'gui.alert.selectplace'
                    }));
            }
        }
    }

    function showToast(message, duration = 3000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            Object.assign(container.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            });
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.textContent = message;

        Object.assign(toast.style, {
            background: '#333',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            maxWidth: '300px'
        });

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                toast.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 300);
        }, duration);
    }

    const updateChildBallText = (index, image, data, isShow) => {
        setChildBalls((prev) =>
            prev.map((child, i) =>
                i === index ? { ...child, image: image, data: data, isShow: isShow } : child
            )
        );
    };




    const handleOpenExample =()=>{
        console.log('点击了默认程序按钮')
        setOpen(true)
    }
    const handleSelect=async(item)=>{
        console.log('选择了示例程序',item)
        if(item.mode=='py'){
            console.log('itemid',item.id)
            setSelectedIndex(item.id)
            // await new Promise(resolve => setTimeout(resolve, 100));
            handleLoadSelectedCode(item.id)
        }else{
            channelLoadExample.postMessage(item)
        }
        
    }



      //----------------------------------------------------------------------
    return {
        selectedIndex,
        setSelectedIndex,
        pythonCode,
        setPythonCode,
        childData,
        setChildData,
        isTrain,
        setIsTrain,
        isBricks,
        setbricks,
        showCode,
        setShowCode,
        lanMode,
        setLanMode,
        isDown,
        setIsDown,
        currentExtension,
        setCurrentExtension,
        isLoading,
        setIsLoading,
        isFlashing,
        setIsFlashing,
        logs,
        setLogs,
        extensionName,
        setExtensionName,
        childBalls,
        setChildBalls,
        socket,
        setSocket,
        soc,
        setSoc,
        upload,
        setUpload,
        data,
        setData,
        selectedOption,
        setSelectedOption,
        modeValue,
        setModeValue,
        handleLoadSelectedCode,
        handleChildData,
        updateChildBallText,
        downloadCodeTotal,
        showToast,
        getCurrent,
        open,
        setOpen,
        selected,
        setSelected,
        handleOpenExample,
        handleSelect,

    };
};

