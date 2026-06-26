import { create } from 'zustand';
import { runIoTProject } from "../../connect-modal/wifi.js"

const useStore = create((set, get) => ({
    components: [],
    selectedComponent: { id: 'screen', type: 'screen', name: 'Screen' },
    isRunning: false,
    showGrid: true,
    previewUrl: null,
    screenBackgroundColor: "#ffffff",
    // Running related states
    serverUrl: '',
    qrCodeUrl: '',

    // Guide lines related states
    showGuides: false,
    guides: [],
    activeGuide: null,
    guidePosition: null,
    allGuidesFixed: false,

    // Screen size related
    screenSize: {
        width: 640,
        height: 480,
        name: 'Default (640x480)'
    },
    showScreenBorder: false,
    customSizes: [],


    // Add the following methods in the create function:

    // Save project to local file
    saveProject: () => {
        const state = get();
        const projectData = {
            version: '1.0',
            saveTime: new Date().toISOString(),
            components: state.components,
            screenBackgroundColor: state.screenBackgroundColor,
            screenSize: state.screenSize,
            showScreenBorder: state.showScreenBorder,
            showGuides: state.showGuides,
            guides: state.guides,
            allGuidesFixed: state.allGuidesFixed
        };

        // Create JSON string
        const dataStr = JSON.stringify(projectData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // Create download link
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `iot_project_${new Date().getTime()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return true;
    },

    // Load project from file
    loadProject: (projectData) => {
        try {
            // Validate data format
            if (!projectData || !projectData.components || !projectData.screenSize) {
                throw new Error('Invalid project file format');
            }

            // Update state
            set({
                components: projectData.components || [],
                screenBackgroundColor: projectData.screenBackgroundColor || '#000000',
                screenSize: projectData.screenSize || { width: 640, height: 480, name: 'Default (640x480)' },
                showScreenBorder: projectData.showScreenBorder !== undefined ? projectData.showScreenBorder : true,
                showGuides: projectData.showGuides || false,
                guides: projectData.guides || [],
                allGuidesFixed: projectData.allGuidesFixed || false,
                selectedComponent: { id: 'screen', type: 'screen', name: 'Screen' },
                // Reset some temporary states
                activeGuide: null,
                guidePosition: null
            });

            return true;
        } catch (error) {
            console.error('Failed to load project:', error);
            throw error;
        }
    },

    // Clear current project
    newProject: () => {
        if (window.confirm('Are you sure you want to create a new project? Unsaved changes will be lost.')) {
            set({
                components: [],
                selectedComponent: { id: 'screen', type: 'screen', name: 'Screen' },
                screenBackgroundColor: '#000000',
                showGuides: false,
                guides: [],
                allGuidesFixed: false,
                activeGuide: null,
                guidePosition: null
            });
        }
    },

    //计数器--组件递增
    componentCounters: {
        label: 0,
        image: 0,
        text: 0,
        button: 0,
        switch: 0,
        slider: 0,
        gauge: 0,
        joystick: 0
    },
    
    // 新增组件
    addComponent: (type, props = {}) => {
        const components = get().components;
        const screenSize = get().screenSize;

        // 标题组件特殊处理，只能存在一个
        if (type === 'title') {
            const existingTitle = components.find(comp => comp.type === 'title');
            if (existingTitle) {
                return existingTitle;
            }

            //固定位置不能移动
            const titleComponent = {
                id: `title_${Date.now()}`,
                type,
                x: 30,
                y: 30,
                w: screenSize.width, // Span the entire screen width
                h: 40, // Fixed height of 40 pixels
                name: 'Title',
                isStatic: true,
                index: 1000,
                ...getDefaultProps(type),
                ...props
            };

            set(state => ({
                components: [...state.components, titleComponent],
                selectedComponent: titleComponent
            }));

            return titleComponent;
        }

        // 其他组件默认尺寸
        let defaultWidth, defaultHeight;
        switch (type) {
            case 'label':
            case 'text':
            case 'button':
                defaultWidth = 120;
                defaultHeight = 40;
                break;
            case 'switch':
                defaultWidth = 80;
                defaultHeight = 40;
                break;
            case 'rectangle':
                defaultWidth = 100;
                defaultHeight = 60;
                break;
            case 'circle':
                defaultWidth = 80;
                defaultHeight = 80;
                break;
            case 'line':
                defaultWidth = 120;
                defaultHeight = 2;
                break;
            case 'image':
                defaultWidth = 100;
                defaultHeight = 100;
                break;
            case 'slider':
                defaultWidth = 200;
                defaultHeight = 60;
                break;
            case 'barChart':
            case 'lineChart':
            case 'pieChart':
                defaultWidth = 250;
                defaultHeight = 182;
                break;
            case 'gauge':
                defaultWidth = 144;
                defaultHeight = 150;
                break;
            case 'joystick':
                defaultWidth = 150;
                defaultHeight = 150;
                break;
            default:
                defaultWidth = 100;
                defaultHeight = 100;
        }

        // Key modification: determine addition method
        let newX, newY;

        // 检测是否是拖放操作
        const isDragDrop = props.x !== undefined && props.y !== undefined;

        if (isDragDrop) {
            // 拖放添加，使用拖放位置
            newX = props.x !== undefined ? props.x : 30;
            newY = props.y !== undefined ? props.y : 30;
        } else {
            // 固定位置
            newX = 30;
            newY = 80;
        }

        let newW = props.w !== undefined ? props.w : defaultWidth;
        let newH = props.h !== undefined ? props.h : defaultHeight;

        //如果拖放添加，需要检查是否超出边界
        if (isDragDrop) {
            const editorWidth = 2100; 
            const editorHeight = 2100; 

            newX = Math.max(0, Math.min(newX, editorWidth - newW));
            newY = Math.max(0, Math.min(newY, editorHeight - newH));
        }

        // 创建组件对象
        const componentNames = {
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
            lineChart: 'Line Chart',
            pieChart: 'Pie Chart',
            gauge: 'Gauge',
            joystick: 'Joystick'
        };

        const defaultName = componentNames[type] || type;
        // 当前类型组件
        const sameTypeComponents = components.filter(comp => comp.type === type);

        const counters = get().componentCounters || {};

        // 如果当前已经没有这种组件了
        if (sameTypeComponents.length === 0) {
            counters[type] = 0;// 重置计数器
        }

        // 递增
        const nextIndex = (counters[type] || 0) + 1;

        // 写回 
        counters[type] = nextIndex;
        set({
            componentCounters: counters
        });

        const newComponent = {
            id: `comp_${Date.now()}`,
            type,
            x: newX,
            y: newY,
            w: newW,
            h: newH,
            name: `${defaultName}${nextIndex}`,
            index: nextIndex,
            ...getDefaultProps(type),
            ...props
        };


        set(state => ({
            components: [...state.components, newComponent],
            selectedComponent: newComponent
        }));

        get().createIoTVariable(newComponent);   //先创建变量   (我超威，突然发现变量能自动创建，但是目前必须得用，有不用变量的需要自行创建，有空再拆分吧)
        get().notifyVM_AddUI(newComponent);//vm通知添加组件

        return newComponent;
    },

    //修改组件
    updateComponent: (id, updates) => {
        const component = get().components.find(comp => comp.id === id);
        if (component && component.type === 'title') {
            const { x, y, w, h, ...safeUpdates } = updates;
            set(state => ({
                components: state.components.map(comp =>
                    comp.id === id ? { ...comp, ...safeUpdates } : comp
                ),
                selectedComponent: state.selectedComponent?.id === id
                    ? { ...state.selectedComponent, ...safeUpdates }
                    : state.selectedComponent
            }));
        } else {
            set(state => ({
                components: state.components.map(comp =>
                    comp.id === id ? { ...comp, ...updates } : comp
                ),
                selectedComponent: state.selectedComponent?.id === id
                    ? { ...state.selectedComponent, ...updates }
                    : state.selectedComponent
            }));

            const newName = updates.name ?? component.name;
            get().notifyVM_UpdateUI(id, newName);
            
        }
    },

    //删除组件
    deleteComponent: (id) => {
        set(state => ({
            components: state.components.filter(comp => comp.id !== id),
            selectedComponent: state.selectedComponent?.id === id
                ? null
                : state.selectedComponent
        }));

        get().notifyVM_DeleteUI(id);
    },

    selectComponent: (id) => {
        if (id === 'screen') {
            set({
                selectedComponent: { id: 'screen', type: 'screen', name: 'Screen' }
            });
        } else {
            const component = get().components.find(comp => comp.id === id);
            set({ selectedComponent: component });
        }
    },

    // 清空所有组件
    clearComponents: () => {
        set({ components: [], selectedComponent: { id: 'screen', type: 'screen', name: 'Screen' } });

        set({ screenBackgroundColor: "#ffffff" });//初始化屏幕

        get().notifyVM_ClearUI();
    },

    updateScreenBackgroundColor: (color) => {
        set({ screenBackgroundColor: color });
    },

    bringToFront: (id) => {
        const components = get().components;
        const maxIndex = Math.max(...components.map(comp => comp.index || 0));

        set(state => ({
            components: state.components.map(comp =>
                comp.id === id ? { ...comp, index: maxIndex + 1 } : comp
            )
        }));
    },

    sendToBack: (id) => {
        const components = get().components;
        const minIndex = Math.min(...components.map(comp => comp.index || 0));

        set(state => ({
            components: state.components.map(comp =>
                comp.id === id ? { ...comp, index: minIndex - 1 } : comp
            )
        }));
    },

    // Alignment function methods - modified to pixel units
    // Alignment function methods - modified to align only within screen area
    alignComponentLeft: (id) => {
        const component = get().components.find(comp => comp.id === id);
        if (component && component.type !== 'title') {
            const screenX = 30; // Screen area top-left X coordinate
            get().updateComponent(id, { x: screenX });
        }
    },

    alignComponentCenter: (id) => {
        const component = get().components.find(comp => comp.id === id);
        if (component && component.type !== 'title') {
            const screenX = 30; // Screen area top-left X coordinate
            const screenWidth = get().screenSize.width;
            const centerX = Math.round(screenX + (screenWidth - component.w) / 2);
            get().updateComponent(id, { x: Math.max(screenX, centerX) });
        }
    },

    alignComponentRight: (id) => {
        const component = get().components.find(comp => comp.id === id);
        if (component && component.type !== 'title') {
            const screenX = 30; // Screen area top-left X coordinate
            const screenWidth = get().screenSize.width;
            const rightX = screenX + screenWidth - component.w;
            get().updateComponent(id, { x: Math.max(screenX, rightX) });
        }
    },

    alignComponentTop: (id) => {
        const component = get().components.find(comp => comp.id === id);
        if (component && component.type !== 'title') {
            const screenY = 30; // Screen area top-left Y coordinate
            get().updateComponent(id, { y: screenY });
        }
    },

    alignComponentMiddle: (id) => {
        const component = get().components.find(comp => comp.id === id);
        if (component && component.type !== 'title') {
            const screenY = 30; // Screen area top-left Y coordinate
            const screenHeight = get().screenSize.height;
            const componentHeight = Math.min(component.h, screenHeight);
            const middleY = Math.max(screenY, Math.round(screenY + (screenHeight - componentHeight) / 2));
            get().updateComponent(id, { y: middleY });
        }
    },

    alignComponentBottom: (id) => {
        const component = get().components.find(comp => comp.id === id);
        if (component && component.type !== 'title') {
            const screenY = 30; // Screen area top-left Y coordinate
            const screenHeight = get().screenSize.height;
            const componentHeight = Math.min(component.h, screenHeight);
            const bottomY = Math.max(screenY, screenY + screenHeight - componentHeight);
            get().updateComponent(id, { y: bottomY });
        }
    },

    // Guide lines related methods - modified to pixel units
    toggleGuides: () => {
        set(state => ({ showGuides: !state.showGuides }));
    },

    addGuide: (type) => {
        const screenSize = get().screenSize;
        const newGuide = {
            id: `guide_${Date.now()}`,
            type,
            position: type === 'vertical' ? Math.floor(screenSize.width / 2) : Math.floor(screenSize.height / 2),
            fixed: false
        };

        set(state => ({
            guides: [...state.guides, newGuide],
            activeGuide: newGuide.id,
            guidePosition: {
                x: type === 'vertical' ? newGuide.position : null,
                y: type === 'horizontal' ? newGuide.position : null
            }
        }));
    },

    removeGuide: (id) => {
        set(state => ({
            guides: state.guides.filter(guide => guide.id !== id),
            activeGuide: state.activeGuide === id ? null : state.activeGuide,
            guidePosition: state.activeGuide === id ? null : state.guidePosition
        }));
    },

    removeAllGuides: () => {
        set({
            guides: [],
            allGuidesFixed: false,
            activeGuide: null,
            guidePosition: null
        });
    },

    updateGuidePosition: (id, position) => {
        const guide = get().guides.find(g => g.id === id);
        if (guide && (get().allGuidesFixed || guide.fixed)) return;

        set(state => ({
            guides: state.guides.map(guide =>
                guide.id === id ? { ...guide, position } : guide
            ),
            guidePosition: state.activeGuide === id ?
                {
                    x: state.guides.find(g => g.id === id)?.type === 'vertical' ? position : state.guidePosition?.x,
                    y: state.guides.find(g => g.id === id)?.type === 'horizontal' ? position : state.guidePosition?.y
                } : state.guidePosition
        }));
    },

    toggleFixAllGuides: () => {
        set(state => {
            const newFixedState = !state.allGuidesFixed;
            const updatedGuides = state.guides.map(guide => ({
                ...guide,
                fixed: newFixedState
            }));

            let newActiveGuide = state.activeGuide;
            let newGuidePosition = state.guidePosition;
            if (newFixedState && state.activeGuide) {
                newActiveGuide = null;
                newGuidePosition = null;
            }

            return {
                guides: updatedGuides,
                allGuidesFixed: newFixedState,
                activeGuide: newActiveGuide,
                guidePosition: newGuidePosition
            };
        });
    },

    toggleFixGuide: (id) => {
        set(state => {
            const updatedGuides = state.guides.map(guide =>
                guide.id === id ? { ...guide, fixed: !guide.fixed } : guide
            );

            let newActiveGuide = state.activeGuide;
            let newGuidePosition = state.guidePosition;
            if (id === state.activeGuide) {
                newActiveGuide = null;
                newGuidePosition = null;
            }

            const allFixed = updatedGuides.length > 0 && updatedGuides.every(guide => guide.fixed);

            return {
                guides: updatedGuides,
                allGuidesFixed: allFixed,
                activeGuide: newActiveGuide,
                guidePosition: newGuidePosition
            };
        });
    },

    setActiveGuide: (id) => {
        const guide = get().guides.find(g => g.id === id);
        if (guide && (get().allGuidesFixed || guide.fixed)) return;

        set({
            activeGuide: id,
            guidePosition: guide ? {
                x: guide.type === 'vertical' ? guide.position : null,
                y: guide.type === 'horizontal' ? guide.position : null
            } : null
        });
    },

    clearActiveGuide: () => {
        set({
            activeGuide: null,
            guidePosition: null
        });
    },

    // 屏幕尺寸更新
    updateScreenSize: (size) => {
        set(state => {
            // Update screen size
            const newState = { screenSize: size };

            //  同时更新标题的宽度
            const updatedComponents = state.components.map(comp => {
                if (comp.type === 'title') {
                    return {
                        ...comp,
                        w: size.width,  // Update Title width
                    };
                }
                return comp;
            });

            return {
                ...newState,
                components: updatedComponents  // Return updated component list
            };
        });
    },
    toggleScreenBorder: () => set(state => ({ showScreenBorder: !state.showScreenBorder })),
    addCustomSize: (size) =>
        set(state => {
            // Check if already exists
            const exists = state.customSizes.some(
                s => s.width === size.width && s.height === size.height
            );

            if (!exists) {
                return {
                    customSizes: [...state.customSizes, size].slice(-5) // Keep only recent 5
                };
            }
            return state;
        }),

    // 运行项目
    generatePreview: async (showCode) => {
        try { 
            // set({ isRunning: true });

            // 获取数据
            const state = get();

            // 过滤掉超出屏幕区域的组件
            const validComponents = state.components.filter(component =>
                isComponentInScreenArea(component, state.screenSize)
            );

            const projectData = {
                components: validComponents,
                screenBackgroundColor: state.screenBackgroundColor,
                screenSize: state.screenSize,
                showScreenBorder: state.showScreenBorder
            };
           //console.log('参与运行的组件', validComponents);

            const result = await runIoTProject(projectData);
            //console.log(result);

            if (result.success) {
                window.vm.runtime.ioDevices.toast.guiToast( "201", "", "success", 2000 );
                  
                if (showCode) {
                    set({ isRunning: true });
                    // const previewUrl = `http://192.168.20.161:3000/preview/${result.id}`;
                    // const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(previewUrl)}`;
                    set({
                        serverUrl: result.previewUrl,
                        qrCodeUrl: result.qrCodeUrl
                    });
                }
            }else{
                window.vm.runtime.ioDevices.toast.guiToast( "003", "", "error", 2000 );
            }
        } catch (error) {
            window.vm.runtime.ioDevices.toast.guiToast( "003", "", "error", 2000 );
            set({ isRunning: false });
        }
    },


    // Stop preview
    stopPreview: () => {
        set({
            isRunning: false,
            serverUrl: '',
            qrCodeUrl: ''
        });
    },

    toggleGrid: () => {
        set(state => ({ showGrid: !state.showGrid }));
    },

    // 通知 VM 添加组件
    notifyVM_AddUI: (component) => { 
        if (window.vm.extensionManager) {
            const ext = window.vm.extensionManager._loadedExtensions.get('UIIoT');
            if (ext) {
                window.vm.runtime.emit('IoT_ADD_COMPONENT', {
                    type: component.type,
                    id: component.id,
                    name: component.name
                });
            }

            setTimeout(() => {
                get().createCallbackBlock(component);
            }, 50);
        }
    },
    // 通知 VM 更新组件名称
    notifyVM_UpdateUI: (id,data) => {
        if (window.vm.extensionManager) {
            const ext = window.vm.extensionManager._loadedExtensions.get('UIIoT');
            if (ext) {
                window.vm.runtime.emit('IoT_UPDATE_COMPONENT', {
                    id: id,
                    name: data
                });
            }
        }



        setTimeout(() => {
            get().updateCallbackBlock(id, data);
        }, 50);
    },
    // 通知 VM 删除组件
    notifyVM_DeleteUI: (id) => {
        if (window.vm.extensionManager) {
            const ext = window.vm.extensionManager._loadedExtensions.get('UIIoT');
            if (ext) {
                window.vm.runtime.emit('IoT_DELETE_COMPONENT', {
                    id: id
                });
            }
        }
        setTimeout(() => {
            get().deleteCallbackBlock(id);
        }, 50);
    },
    // 通知 VM 清除所有组件
    notifyVM_ClearUI() {
       if (window.vm.extensionManager) {
            const ext = window.vm.extensionManager._loadedExtensions.get('UIIoT');
            if (ext) {
                window.vm.runtime.emit('IoT_CLEAR_ALL');
            }
        }
        setTimeout(() => {
            get().clearCallbackBlocks();
        }, 50);
    },

    // ########################变量相关
    createIoTVariable: (component) => {
        const target = window.vm.runtime.getTargetForStage();
        if (!target) return;

        let variables = [];

        // 需要根据名称创建的（只创建一个的）
        if (component.type === 'text') {
            variables.push(`iot_text_value`);
        }else if (component.type === 'switch') {
            variables.push(`iot_switch_value`);
        }else if (component.type === 'slider') {
            variables.push(`iot_slider_value`);
        }else if (component.type === 'joystick') {
            variables.push(`iot_joystick_Xvalue`);
            variables.push(`iot_joystick_Yvalue`);
        }else if (component.type === 'button') {
            
        }else {
            //其他的按照名称创建
            variables.push(`iot_${component.name}`);
        }

        // 创建变量
        variables.forEach((variableName, index) => {
            // 名称查重
            const existVar = Object.values(target.variables) .find(v => v.name === variableName);

            if (existVar) return;

            // id 查重
            const variableId = `Variable_${component.id}_${index}`;

            target.createVariable(
                variableId,
                variableName,
                ''
            );
        });
    },

    // ########################模块相关
    // 创建模块
    createCallbackBlock: (component) => {
        const workspace = window.Blockly.getMainWorkspace();
        const type = component.type;

        const blockType = BLOCK_TYPE_MAP[type];
        if (!blockType) return;

        //通用配置
        const blockId = `iot_${ component.id}`;
        const baseX = 50;
        const baseY = TYPE_INDEX[type] * 100 ;

        //变量配置
        const variableId = `Variable_${component.id}`;
        const variableName = `iot_${component.name}`;
        let valueXml = '';
        if(type === 'label' || type === 'image' || type === 'gauge'){
             valueXml = `
                <value name="DATA">
                    <block type="data_variable">
                        <field
                            name="VARIABLE"
                            id="${variableId}"
                            variabletype=""
                        >${variableName}</field>
                    </block>
                </value>
            `;
        }else{//text,button,switch

        }
        
        const xmlText = `
        <xml xmlns="https://developers.google.com/blockly/xml">
            <block
                id="${blockId}"
                type="${blockType}"
                x="${baseX}"
                y="${baseY}">
                <field name="ITEM">${component.name}</field>
                ${valueXml}
            </block>
        </xml>`;

        const dom = Blockly.Xml.textToDom(xmlText);
        Blockly.Xml.domToWorkspace( dom,  workspace );
    },

    //更新组件名称
    updateCallbackBlock: (id, name) => {
        const workspace = window.Blockly.getMainWorkspace();
        const blockId = `iot_${id}`;
        const block = workspace.getBlockById(blockId);
        if (!block) return;
        block.setFieldValue(name, 'ITEM');
    },

    //删除组件
    deleteCallbackBlock: (id) => {
        const workspace = window.Blockly.getMainWorkspace();
        const blockId = `iot_${id}`;

        const block = workspace.getBlockById(blockId);

        if (block) {
            block.dispose(false);
        }
    },

    // 清除所有的回调函数
    clearCallbackBlocks: () => {
        const workspace =  window.Blockly.getMainWorkspace();

        workspace.getAllBlocks(false) .forEach(block => {
            if (  block.id &&  block.id.startsWith('iot_') ) {
                block.dispose(false);
            }
        });
    },

}));


const BLOCK_TYPE_MAP = {
    label: 'UIIoT_labelCallback',
    image: 'UIIoT_imageCallback',
    text: 'UIIoT_textCallback',
    button: 'UIIoT_buttonCallback',
    switch: 'UIIoT_switchCallback',
    slider: 'UIIoT_sliderCallback',
    gauge: 'UIIoT_gaugeCallback',
    joystick: 'UIIoT_joystickCallback'
};
const TYPE_INDEX = {
    label: 1,
    image: 2,
    text: 3,
    button: 4,
    switch: 5,
    slider: 6,
    gauge: 7,
    joystick: 8
};

// 检查组件是否位于屏幕区域
const isComponentInScreenArea = (component, screenSize) => {
    const screenX = 30;
    const screenY = 30;

    const componentX = component.x || 0;
    const componentY = component.y || 0;
    const componentWidth = component.w || 0;
    const componentHeight = component.h || 0;

    return (
        componentX >= screenX &&
        componentY >= screenY &&
        componentX + componentWidth <= screenX + screenSize.width &&
        componentY + componentHeight <= screenY + screenSize.height
    );
};

 
// 获取默认属性
const getDefaultProps = (type) => {
    const defaults = {
        title: {
            text: 'Title',
            fontSize: 16,
            color: '#ffffff',
            backgroundColor: '#2caecd',
            colorTransparent: false,
            backgroundColorTransparent: false,
            fontWeight: 'bold',
            textAlign: 'center',
            index: 0,
            show: true
        },
        label: {
            text: 'Label',
            fontSize: 12,
            color: '#2caecd',
            interval:3000,
            backgroundColor: '#ffffff00',
            colorTransparent: false,
            backgroundColorTransparent: false,
            fontWeight: 'normal',
            index: 0,
            show: true
        },
        rectangle: {
            backgroundColor: '#3498db',
            borderColor: '#2980b9',
            backgroundColorTransparent: false,
            borderColorTransparent: false,
            index: 0,
            show: true
        },
        circle: {
            backgroundColor: '#e74c3c',
            borderColor: '#c0392b',
            backgroundColorTransparent: false,
            borderColorTransparent: false,
            index: 0,
            show: true
        },
        line: {
            strokeColor: '#ffffff',
            strokeWidth: 2,
            strokeColorTransparent: false,
            index: 0,
            show: true
        },
        image: {
            src: '',
            interval:3000,
            index: 0,
            show: true
        },
        text: {
            text: 'Text',
            fontSize: 12,
            color: '#4d4c4c',
            backgroundColor: '#ffffff00',
            colorTransparent: false,
            backgroundColorTransparent: false,
            fontWeight: 'normal',
            index: 0,
            show: true
        },
        button: {
            text: 'Button',
            fontSize: 12,
            color: '#ffffff',
            backgroundColor: '#0080ff',
            colorTransparent: false,
            backgroundColorTransparent: false,
            pressed: false,
            index: 0,
            show: true
        },
        switch: {
            backgroundColor: '#95a5a6',
            onColor: '#27ae60',
            backgroundColorTransparent: false,
            onColorTransparent: false,
            value: false,
            index: 0,
            show: true
        },
        slider: {
            min: 0,
            max: 100,
            value: 50,
            fillColor: '#3498db',
            fillColorTransparent: false,
            index: 0,
            show: true
        },
        barChart: {
            data: [
                { name: 'A', value: 40 },
                { name: 'B', value: 60 },
                { name: 'C', value: 80 }
            ],
            color: '#3498db',
            colorTransparent: false,
            index: 0,
            xAxisKey: 'name',
            yAxisKey: 'value',
            xAxisName: 'Category',
            yAxisName: 'Value',
            showGrid: true,
            showXAxis: true,
            showYAxis: true,
            showTooltip: true,
            barSize: 30,
            barRadius: 0,
            chartMargin: {
                top: 5,
                right: 5,
                left: 5,
                bottom: 5
            }
        },
        lineChart: {
            data: [
                { name: 'January', value: 30 },
                { name: 'February', value: 40 },
                { name: 'March', value: 35 },
                { name: 'April', value: 50 },
                { name: 'May', value: 55 },
                { name: 'June', value: 60 }
            ],
            color: '#3498db',
            colorTransparent: false,
            strokeWidth: 2,
            index: 0,
            xAxisKey: 'name',
            yAxisKey: 'value',
            xAxisName: 'Month',
            yAxisName: 'Value',
            showGrid: true,
            showXAxis: true,
            showYAxis: true,
            showTooltip: true,
            showLine: true,
            showPoints: true,
            lineType: 'monotone'
        },
        pieChart: {
            data: [
                { name: 'Category A', value: 40, color: '#3498db' },
                { name: 'Category B', value: 30, color: '#2ecc71' },
                { name: 'Category C', value: 20, color: '#e74c3c' },
                { name: 'Category D', value: 10, color: '#f39c12' }
            ],
            index: 0,
            showLabel: true,
            showPercentage: true,
            innerRadius: 0,
            outerRadius: '80%'
        },
        gauge: {
            // name: 'Gauge',
            value: 50,
            min: 0,
            max: 100,
            label: 'speed',
            color: '#3498db',
            colorTransparent: false,
            unit: '%',
            index: 0,
            showValue: true,
            showRange: true,
            arcWidth: 10,
            startAngle: 180,
            interval:3000,
            endAngle: 0,
            show: true
        },
        joystick: {
            // name: 'Joystick',
            xValue: 0,
            yValue: 0,
            xMin: -100,
            xMax: 100,
            yMin: -100,
            yMax: 100,
            color: '#34495e',
            colorTransparent: false,
            index: 0,
            showValues: false,
            returnToCenter: true,
            show: true
        }
    };
    return defaults[type] || {};
};
export default useStore;

window.IoTStore = useStore;