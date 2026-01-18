/* 渲染 Scratch Blocks 工作区

管理工具箱、扩展、拖拽、事件

绑定 Scratch VM 事件和状态

处理语言切换、舞台大小、弹窗

连接 Redux 做全局状态管理 */
import bindAll from 'lodash.bindall';
import debounce from 'lodash.debounce';
import defaultsDeep from 'lodash.defaultsdeep';
import makeToolboxXML from '../lib/make-toolbox-xml';
import PropTypes from 'prop-types';
import React ,{ useState} from 'react';
import {intlShape, injectIntl, defineMessages} from 'react-intl';
import VMScratchBlocks from '../lib/blocks';
import VM from 'scratch-vm';

import log from '../lib/log.js';
import Prompt from './prompt.jsx';
import BlocksComponent from '../components/blocks/blocks.jsx';
import ExtensionLibrary from './extension-library.jsx';
import extensionData from '../lib/libraries/extensions/index.jsx';
import CustomProcedures from './custom-procedures.jsx';
import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import {BLOCKS_DEFAULT_SCALE, STAGE_DISPLAY_SIZES} from '../lib/layout-constants';
import DropAreaHOC from '../lib/drop-area-hoc.jsx';
import DragConstants from '../lib/drag-constants';
import defineDynamicBlock from '../lib/define-dynamic-block';
import {Theme} from '../lib/themes';
import {injectExtensionBlockTheme, injectExtensionCategoryTheme} from '../lib/themes/blockHelpers';

import {connect} from 'react-redux';
import {updateToolbox} from '../reducers/toolbox';
import {activateColorPicker} from '../reducers/color-picker';
import {
    closeExtensionLibrary,
    openSoundRecorder,
    openConnectionModal,
    openCustomExtensionModal
} from '../reducers/modals';
import {activateCustomProcedures, deactivateCustomProcedures} from '../reducers/custom-procedures';
import {setConnectionModalExtensionId} from '../reducers/connection-modal';
import {updateMetrics} from '../reducers/workspace-metrics';
import {isTimeTravel2020} from '../reducers/time-travel';

import {
    activateTab,
    SOUNDS_TAB_INDEX
} from '../reducers/editor-tab';
import AddonHooks from '../addons/hooks.js';
import LoadScratchBlocksHOC from '../lib/tw-load-scratch-blocks-hoc.jsx';
import {findTopBlock} from '../lib/backpack/code-payload.js';
import {gentlyRequestPersistentStorage} from '../lib/tw-persistent-storage.js';

import { createBlocksLogic} from './hooks/blocks-logic.js';

import { setGeneratedCode } from '../reducers/sun';//设置生成的code


// 旧机制，根据设备加载扩展
const categoryMap = {
    Arduino: [
        'ArduinoS4S'
    ],
    ESP32: [
        'robotmove',
        'robotemote',
        'robotshow'
    ],
    Microbit: [ 'MicrobitIcreate' ]
};

//可以一直存在的扩展
const keepList = ['MicrobitIcreate',  'ArduinoS4S', 'ICreateK210','LinkBot'];


// TW: Strings we add to scratch-blocks are localized here
//国际化消息定义
const messages = defineMessages({
    PROCEDURES_RETURN: {
        defaultMessage: 'return {v}',
        // eslint-disable-next-line max-len
        description: 'The name of the "return" block from the Custom Reporters extension. {v} is replaced with a slot to insert a value.',
        id: 'tw.blocks.PROCEDURES_RETURN'
    },
    PROCEDURES_TO_REPORTER: {
        defaultMessage: 'Change To Reporter',
        // eslint-disable-next-line max-len
        description: 'Context menu item to change a command-shaped custom block into a reporter. Part of the Custom Reporters extension.',
        id: 'tw.blocks.PROCEDURES_TO_REPORTER'
    },
    PROCEDURES_TO_STATEMENT: {
        defaultMessage: 'Change To Statement',
        // eslint-disable-next-line max-len
        description: 'Context menu item to change a reporter-shaped custom block into a statement/command. Part of the Custom Reporters extension.',
        id: 'tw.blocks.PROCEDURES_TO_STATEMENT'
    },
    PROCEDURES_DOCS: {
        defaultMessage: 'How to use return',
        // eslint-disable-next-line max-len
        description: 'Button in extension list to learn how to use the "return" block from the Custom Reporters extension.',
        id: 'tw.blocks.PROCEDURES_DOCS'
    }
});

const addFunctionListener = (object, property, callback) => {
    const oldFn = object[property];
    object[property] = function (...args) {
        const result = oldFn.apply(this, args);
        callback.apply(this, result);
        return result;
    };
};

const DroppableBlocks = DropAreaHOC([
    DragConstants.BACKPACK_CODE
])(BlocksComponent);



class Blocks extends React.Component {
    constructor (props) {
        super(props);
        this.logic = createBlocksLogic(this,props.modeValue,props.extensionName);//自定义的 Blocks 逻辑
        this.ScratchBlocks = VMScratchBlocks(props.vm, false);//初始化 Scratch Blocks 工作空间

        this._mountedOnce=false
        // console.log(props.vm)
        window.ScratchBlocks = this.ScratchBlocks;
        AddonHooks.blockly = this.ScratchBlocks;
        AddonHooks.blocklyCallbacks.forEach(i => i());
        AddonHooks.blocklyCallbacks.length = [];

        this.channelMode=this.logic.channelMode 
        this.channelLoadExtension = this.logic.channelLoadExtension
        //this.unindentCode=(code)=>this.logic.unindentCode(code)
        //this.indentPythonFunctions=(code)=>this.logic.indentPythonFunctions(code)
        this.arraysAreEqual=(arr1,arr2)=>this.logic.arraysAreEqual(arr1,arr2)
        this.findSecondTopParent=(block)=>this.logic.findSecondTopParent(block)
        this.removeCategoryFromToolbox=(categoriesToRemove)=>this.logic.removeCategoryFromToolbox(categoriesToRemove)
        this.restoreCategoriesToToolbox=(categoriesToRestore)=>this.logic.restoreCategoriesToToolbox(categoriesToRestore)
        //this.getToolboxXML = this.logic.getToolboxXML; //坑的一批

        bindAll(this, [//绑定所有方法到组件实例
            'attachVM',
            'detachVM',
            'getToolboxXML',
            'removeCategoryFromToolbox',
            'restoreCategoriesToToolbox',
            'handleCategorySelected',
            'handleConnectionModalStart',
            'handleDrop',
            'handleStatusButtonUpdate',
            'handleOpenSoundRecorder',
            'handlePromptStart',
            'handlePromptCallback',
            'handlePromptClose',
            'handleCustomProceduresClose',
            'onScriptGlowOn',
            'onScriptGlowOff',
            'onBlockGlowOn',
            'onBlockGlowOff',
            'handleMonitorsUpdate',
            'handleExtensionAdded',
            'handleBlocksInfoUpdate',
            'onTargetsUpdate',
            'onVisualReport',
            'onWorkspaceUpdate',
            'onWorkspaceMetricsChange',
            'setBlocks',
            'setLocale',
            'handleEnableProcedureReturns',
            'workspaceToCode',
            'unindentCode',
            'findSecondTopParent',
            'handleRuntimeStop',
            'arraysAreEqual',
        ]);
        this.ScratchBlocks.prompt = this.handlePromptStart;
        this.ScratchBlocks.statusButtonCallback = this.handleConnectionModalStart;
        this.ScratchBlocks.recordSoundCallback = this.handleOpenSoundRecorder;
        

        this.state = {
            prompt: null
        };//用于弹出变量/列表/函数对话框
        this.onTargetsUpdate = debounce(this.onTargetsUpdate, 100);//处理目标更新，降低高频刷新
        this.toolboxUpdateQueue = [];
        this.channel = this.logic.channel 
        this.channelMasterClose = this.logic.channelMasterClose    
    }

    handleRuntimeStop=()=>{
        // console.log('程序停止')
    }

    async componentDidMount () {//首次挂载走
        if (this._mountedOnce) return;
        this._mountedOnce = true;

        this.props.setGeneratedCode("");  //进入清空代码

        this.ScratchBlocks = VMScratchBlocks(this.props.vm, this.props.useCatBlocks);
        this.ScratchBlocks.prompt = this.handlePromptStart;
        this.ScratchBlocks.statusButtonCallback = this.handleConnectionModalStart;
        this.ScratchBlocks.recordSoundCallback = this.handleOpenSoundRecorder;

        this.ScratchBlocks.FieldColourSlider.activateEyedropper_ = this.props.onActivateColorPicker;
        this.ScratchBlocks.Procedures.externalProcedureDefCallback = this.props.onActivateCustomProcedures;
        this.ScratchBlocks.ScratchMsgs.setLocale(this.props.locale);

        const Msg = this.ScratchBlocks.Msg;
        Msg.PROCEDURES_RETURN = this.props.intl.formatMessage(messages.PROCEDURES_RETURN, {
            v: '%1'
        });
        Msg.PROCEDURES_TO_REPORTER = this.props.intl.formatMessage(messages.PROCEDURES_TO_REPORTER);
        Msg.PROCEDURES_TO_STATEMENT = this.props.intl.formatMessage(messages.PROCEDURES_TO_STATEMENT);
        Msg.PROCEDURES_DOCS = this.props.intl.formatMessage(messages.PROCEDURES_DOCS);

        const workspaceConfig = defaultsDeep({},
            this.props.options,
            {
                rtl: this.props.isRtl,
                toolbox: this.props.toolboxXML,
                colours: this.props.theme.getBlockColors(),
                grid: {
                    colour: this.props.theme.getBlockColors().gridColor
                }
            },
            Blocks.defaultOptions
        );
        this.workspace = this.ScratchBlocks.inject(this.blocks, workspaceConfig);
        AddonHooks.blocklyWorkspace = this.workspace;

        

       
        // Register buttons under new callback keys for creating variables,
        // lists, and procedures from extensions.

        const toolboxWorkspace = this.workspace.getFlyout().getWorkspace();

        const varListButtonCallback = type =>
            (() => this.ScratchBlocks.Variables.createVariable(this.workspace, null, type));
        const procButtonCallback = () => {
            this.ScratchBlocks.Procedures.createProcedureDefCallback_(this.workspace);
        };

        toolboxWorkspace.registerButtonCallback('MAKE_A_VARIABLE', varListButtonCallback(''));
        toolboxWorkspace.registerButtonCallback('MAKE_A_LIST', varListButtonCallback('list'));
        toolboxWorkspace.registerButtonCallback('MAKE_A_PROCEDURE', procButtonCallback);
        toolboxWorkspace.registerButtonCallback('EXTENSION_CALLBACK', block => {
            this.props.vm.handleExtensionButtonPress(block.callbackData_);
        });
        toolboxWorkspace.registerButtonCallback('OPEN_EXTENSION_DOCS', block => {
            const docsURI = block.callbackData_;
            const url = new URL(docsURI);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                window.open(docsURI, '_blank');
            }
        });
        toolboxWorkspace.registerButtonCallback('OPEN_RETURN_DOCS', () => {
            window.open('https://docs.turbowarp.org/return', '_blank');
        });

        // Store the xml of the toolbox that is actually rendered.
        // This is used in componentDidUpdate instead of prevProps, because
        // the xml can change while e.g. on the costumes tab.
        this._renderedToolboxXML = this.props.toolboxXML;

        // we actually never want the workspace to enable "refresh toolbox" - this basically re-renders the
        // entire toolbox every time we reset the workspace.  We call updateToolbox as a part of
        // componentDidUpdate so the toolbox will still correctly be updated
        this.setToolboxRefreshEnabled = this.workspace.setToolboxRefreshEnabled.bind(this.workspace);
        this.workspace.setToolboxRefreshEnabled = () => {
            this.setToolboxRefreshEnabled(false);
        };

        // @todo change this when blockly supports UI events
        addFunctionListener(this.workspace, 'translate', this.onWorkspaceMetricsChange);
        addFunctionListener(this.workspace, 'zoom', this.onWorkspaceMetricsChange);

        this.props.vm.setCompilerOptions({
            warpTimer: true
        });

        this.attachVM();
        // Only update blocks/vm locale when visible to avoid sizing issues
        // If locale changes while not visible it will get handled in didUpdate
        if (this.props.isVisible) {
            this.setLocale();
        }

        // tw: Handle when extensions are added when Blocks isn't mounted

        if(this.props.modeValue == "upload"){//下载模式监听代码变化
            this.workspace.addChangeListener(this.workspaceToCode);
        }

        /* 根据模式加载扩展（初始模块在配置xmL中） 
        * 先清理掉所有的，再根据设备直接添加，没有任何干涉(此为旧方法，暂时启用，未来可能会有特殊模块，可能会再次启用)
        */
        // const loadedExts = Array.from(this.props.vm.extensionManager._loadedExtensions.keys());
        // console.log('已加载扩展',loadedExts)
        //先清理
        // this.props.vm.runtime._blockInfo = [];
        // await this.props.vm.extensionManager._loadedExtensions.clear();

        // //直接添加
        // const categoryList = categoryMap[this.props.extensionName] || [];
        // for (const id of categoryList) {
        //     await this.props.vm.extensionManager.loadExtensionIdSync(id);
        // }

        // 新切换模式扩展留存方法，完全基于持久列表
        this.props.vm.runtime._blockInfo = this.props.vm.runtime._blockInfo.filter(block => keepList.includes(block.id));

        // 过滤 loadedExtensions
        for (const id of Array.from(this.props.vm.extensionManager._loadedExtensions.keys())) {
            if (!keepList.includes(id)) {
                //console.log(id)
                this.props.vm.extensionManager._loadedExtensions.delete(id);
            }
        }

        // 不再通过读取的形式添加扩展
        // for (const category of this.props.vm.runtime._blockInfo) {
        //     this.handleExtensionAdded(category);
        // }

        gentlyRequestPersistentStorage();

        //程序停止监听
        // this.props.vm.runtime.on('PROJECT_RUN_STOP',()=>{
        //     console.log('程序停止')
        // })  

        // 全局用法（致命，暂时只能这么弄了，未来优化）
        window.BlocksSearch = (type,value) => {
            if(type == 'show'){this.showSearchFlyout();}
            else if(type == 'hide'){ this.hideSearchFlyout();}
            else if(type == 'search'){ this.searchBlock(value);}
        };
        if (this.props.isActive) { this.hideSearchFlyout(); }//初始化时强行关闭搜索框
    }
    

    shouldComponentUpdate (nextProps, nextState) {
        return (
            this.state.prompt !== nextState.prompt ||
            this.props.isVisible !== nextProps.isVisible ||
            this._renderedToolboxXML !== nextProps.toolboxXML ||
            this.props.extensionLibraryVisible !== nextProps.extensionLibraryVisible ||
            this.props.customProceduresVisible !== nextProps.customProceduresVisible ||
            this.props.locale !== nextProps.locale ||
            this.props.anyModalVisible !== nextProps.anyModalVisible ||
            this.props.stageSize !== nextProps.stageSize ||
            this.props.customStageSize !== nextProps.customStageSize||
            this.props.extensionName !== nextProps.extensionName //切换设备名称
        );
    }
    componentDidUpdate (prevProps) {
        // If any modals are open, call hideChaff to close z-indexed field editors
        //弹窗关闭处理
        if (this.props.anyModalVisible && !prevProps.anyModalVisible) {
            this.ScratchBlocks.hideChaff();
        }

        // if(this.props.extensionName !== prevProps.extensionName && this.props.modeValue=="upload"){
        //     this.workspaceToCode({type: 'endDrag'})
        // }

        // Only rerender the toolbox when the blocks are visible and the xml is
        // different from the previously rendered toolbox xml.
        // Do not check against prevProps.toolboxXML because that may not have been rendered.
        // toolbox XML 变化时刷新工具箱 不论处于哪个tab，只要切换样式就会执行此
        if (this.props.isVisible && this.props.toolboxXML !== this._renderedToolboxXML) {
            this.requestToolboxUpdate();
        }

        // stageSize 变化时触发 resize
        if (this.props.isVisible === prevProps.isVisible) {
            if (
                this.props.stageSize !== prevProps.stageSize ||
                this.props.customStageSize !== prevProps.customStageSize
            ) {
                // force workspace to redraw for the new stage size
                window.dispatchEvent(new Event('resize'));
            }
            return;
        }
        // @todo hack to resize blockly manually in case resize happened while hidden
        // @todo hack to reload the workspace due to gui bug #413
        //语言/本地化变化处理
        if (this.props.isVisible) { // Scripts tab
            
            this.workspace.setVisible(true);
            if (prevProps.locale !== this.props.locale || this.props.locale !== this.props.vm.getLocale()) {
                // call setLocale if the locale has changed, or changed while the blocks were hidden.
                // vm.getLocale() will be out of sync if locale was changed while not visible
                //语言变化
                this.setLocale();
                console.log("")
            } else {//切换回block执行
                this.props.vm.refreshWorkspace();
                this.requestToolboxUpdate();
            }

            window.dispatchEvent(new Event('resize'));
        } else {//目前切换到第二个tab执行
            this.workspace.setVisible(false);
        }

       
    }
    componentWillUnmount () {
        console.log('Blocks unmounted');
        if (this.channelMode) {
            this.channelMode.close();
        }
        if (this.channel) {
            this.channel.close();
        }
        this.detachVM();
        this.unmounted = true;
        this.workspace.dispose();
        clearTimeout(this.toolboxUpdateTimeout);

        // Clear the flyout blocks so that they can be recreated on mount.
        this.props.vm.clearFlyoutBlocks();

        AddonHooks.blocklyWorkspace = null;     

        // 清理全局用法
        delete window.BlocksSearch;
    }
    requestToolboxUpdate () {
        clearTimeout(this.toolboxUpdateTimeout);
        this.toolboxUpdateTimeout = setTimeout(() => {
            this.updateToolbox();
        }, 0);
    }
    setLocale () {
        this.ScratchBlocks.ScratchMsgs.setLocale(this.props.locale);
        this.props.vm.setLocale(this.props.locale, this.props.messages)
            .then(() => {
                if (this.unmounted) return;
                this.workspace.getFlyout().setRecyclingEnabled(false);
                this.props.vm.refreshWorkspace();
                this.requestToolboxUpdate();
                this.withToolboxUpdates(() => {
                    this.workspace.getFlyout().setRecyclingEnabled(true);
                });
            });
    }

    updateToolbox () {
        this.toolboxUpdateTimeout = false;

        const categoryId = this.workspace.toolbox_.getSelectedCategoryId();
        const offset = this.workspace.toolbox_.getCategoryScrollOffset();
        this.workspace.updateToolbox(this.props.toolboxXML);
        this._renderedToolboxXML = this.props.toolboxXML;

        // In order to catch any changes that mutate the toolbox during "normal runtime"
        // (variable changes/etc), re-enable toolbox refresh.
        // Using the setter function will rerender the entire toolbox which we just rendered.
        this.workspace.toolboxRefreshEnabled_ = true;

        const currentCategoryPos = this.workspace.toolbox_.getCategoryPositionById(categoryId);
        const currentCategoryLen = this.workspace.toolbox_.getCategoryLengthById(categoryId);
        if (offset < currentCategoryLen) {
            this.workspace.toolbox_.setFlyoutScrollPos(currentCategoryPos + offset);
        } else {
            this.workspace.toolbox_.setFlyoutScrollPos(currentCategoryPos);
        }

        const queue = this.toolboxUpdateQueue;
        this.toolboxUpdateQueue = [];
        queue.forEach(fn => fn());
    }

    withToolboxUpdates (fn) {
        // if there is a queued toolbox update, we need to wait
        if (this.toolboxUpdateTimeout) {
            this.toolboxUpdateQueue.push(fn);
        } else {
            fn();
        }
    }

    attachVM () {
        if(this.props.modeValue == 'interactive'){
            this.workspace.addChangeListener(this.props.vm.blockListener);//当工作区里的 blocks 发生变化时触发
            this.flyoutWorkspace = this.workspace
                .getFlyout()
                .getWorkspace();
            this.flyoutWorkspace.addChangeListener(this.props.vm.flyoutBlockListener);
            this.flyoutWorkspace.addChangeListener(this.props.vm.monitorBlockListener);

            this.props.vm.addListener('SCRIPT_GLOW_ON', this.onScriptGlowOn);
            this.props.vm.addListener('SCRIPT_GLOW_OFF', this.onScriptGlowOff);
            this.props.vm.addListener('BLOCK_GLOW_ON', this.onBlockGlowOn);
            this.props.vm.addListener('BLOCK_GLOW_OFF', this.onBlockGlowOff);
            this.props.vm.addListener('VISUAL_REPORT', this.onVisualReport);//把 VM 中的值反馈到对应的积木上
            this.props.vm.addListener('targetsUpdate', this.onTargetsUpdate);//当舞台或角色目标列表发生变化时
            this.props.vm.addListener('MONITORS_UPDATE', this.handleMonitorsUpdate);//当监控器（变量、列表、传感器值的积木）发生更新时
        }

        const toolboxDiv = this.workspace.getToolbox().HtmlDiv; // 工具箱点击事件
        toolboxDiv.addEventListener('click', this.toolboxClick);
      

        this.props.vm.addListener('workspaceUpdate', this.onWorkspaceUpdate);//当项目的工作区（积木）发生变化时（例如切换角色、加载新积木、添加扩展）触发。
        
        this.props.vm.addListener('EXTENSION_ADDED', this.handleExtensionAdded);//当加载一个扩展
        this.props.vm.addListener('BLOCKSINFO_UPDATE', this.handleBlocksInfoUpdate);
        this.props.vm.addListener('PERIPHERAL_CONNECTED', this.handleStatusButtonUpdate);//外设
        this.props.vm.addListener('PERIPHERAL_DISCONNECTED', this.handleStatusButtonUpdate);
        // this.props.vm.addListener('EXTENSION_REMOVED', this.handleExtensionRemoved);//扩展移除事件
    }

    detachVM () {
        this.props.vm.removeListener('SCRIPT_GLOW_ON', this.onScriptGlowOn);
        this.props.vm.removeListener('SCRIPT_GLOW_OFF', this.onScriptGlowOff);
        this.props.vm.removeListener('BLOCK_GLOW_ON', this.onBlockGlowOn);
        this.props.vm.removeListener('BLOCK_GLOW_OFF', this.onBlockGlowOff);
        this.props.vm.removeListener('VISUAL_REPORT', this.onVisualReport);

        this.props.vm.removeListener('workspaceUpdate', this.onWorkspaceUpdate);
        this.props.vm.removeListener('targetsUpdate', this.onTargetsUpdate);
        this.props.vm.removeListener('MONITORS_UPDATE', this.handleMonitorsUpdate);
        this.props.vm.removeListener('EXTENSION_ADDED', this.handleExtensionAdded);
        this.props.vm.removeListener('BLOCKSINFO_UPDATE', this.handleBlocksInfoUpdate);
        this.props.vm.removeListener('PERIPHERAL_CONNECTED', this.handleStatusButtonUpdate);
        this.props.vm.removeListener('PERIPHERAL_DISCONNECTED', this.handleStatusButtonUpdate);
        // this.props.vm.removeListener('EXTENSION_REMOVED', this.handleExtensionRemoved);
        const toolboxDiv = this.workspace.getToolbox().HtmlDiv; // 工具箱点击事件
        toolboxDiv.removeEventListener('click', this.toolboxClick);
    }

    updateToolboxBlockValue (id, value) {
        this.withToolboxUpdates(() => {
            const block = this.workspace
                .getFlyout()
                .getWorkspace()
                .getBlockById(id);
            if (block) {
                block.inputList[0].fieldRow[0].setValue(value);
            }
        });
    }

    onTargetsUpdate () {
        if (this.props.vm.editingTarget && this.workspace.getFlyout()) {
            ['glide', 'move', 'set'].forEach(prefix => {
                this.updateToolboxBlockValue(`${prefix}x`, Math.round(this.props.vm.editingTarget.x).toString());
                this.updateToolboxBlockValue(`${prefix}y`, Math.round(this.props.vm.editingTarget.y).toString());
            });
        }
    }
    onWorkspaceMetricsChange () {
        const target = this.props.vm.editingTarget;
        if (target && target.id) {
            // Dispatch updateMetrics later, since onWorkspaceMetricsChange may be (very indirectly)
            // called from a reducer, i.e. when you create a custom procedure.
            // TODO: Is this a vehement hack?
            setTimeout(() => {
                this.props.updateMetrics({
                    targetID: target.id,
                    scrollX: this.workspace.scrollX,
                    scrollY: this.workspace.scrollY,
                    scale: this.workspace.scale
                });
            }, 0);
        }
    }
    onScriptGlowOn (data) {
        this.workspace.glowStack(data.id, true);
    }
    onScriptGlowOff (data) {
        this.workspace.glowStack(data.id, false);
    }
    onBlockGlowOn (data) {
        this.workspace.glowBlock(data.id, true);
    }
    onBlockGlowOff (data) {
        this.workspace.glowBlock(data.id, false);
    }
    onVisualReport (data) {
        this.workspace.reportValue(data.id, data.value);
    }
    

    getToolboxXML () {
        // Use try/catch because this requires digging pretty deep into the VM
        // Code inside intentionally ignores several error situations (no stage, etc.)
        // Because they would get caught by this try/catch
        try {
            let {editingTarget: target, runtime} = this.props.vm;
            const stage = runtime.getTargetForStage();
            if (!target) target = stage; // If no editingTarget, use the stage

            const stageCostumes = stage.getCostumes();
            const targetCostumes = target.getCostumes();
            const targetSounds = target.getSounds();
            const dynamicBlocksXML = injectExtensionCategoryTheme(
                this.props.vm.runtime.getBlocksXML(target),
                this.props.theme
            );
            return makeToolboxXML(false, target.isStage, target.id, dynamicBlocksXML,
                targetCostumes[targetCostumes.length - 1].name,
                stageCostumes[stageCostumes.length - 1].name,
                targetSounds.length > 0 ? targetSounds[targetSounds.length - 1].name : '',
                this.props.theme.getBlockColors(),
                this.props.modeValue//传入模式，根据模式生成模块
            );
        } catch(e) {
            console.log(e)
            return null;
        }
    }

    defenCatch(toolboxXml){
        if (!toolboxXml) return;
        // 小技巧：加个没意义的注释防止缓存
        const modifiedXML = toolboxXml.replace('</xml>', `<!--force update--> </xml>`);
        // console.log(modifiedXML)
        this.props.updateToolboxState(modifiedXML);
        // this.props.updateToolboxState(toolboxXML);
    }

    onWorkspaceUpdate (data) {
        // When we change sprites, update the toolbox to have the new sprite's blocks
        console.log("onWorkspaceUpdate",data)
        //切换角色 / 扩展更新 → 重新构建工具箱

        //工具箱刷新
        const toolboxXML = this.getToolboxXML();
        if (toolboxXML) {
            this.defenCatch(toolboxXML)
            this.props.updateToolboxState(toolboxXML);
        }

        if (!data || !data.xml) {
            console.warn("只刷新工具栏，避免向后执行影响workspace");
            return;
        }

        if (this.props.vm.editingTarget && !this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id]) {
            this.onWorkspaceMetricsChange();
        }

        // Remove and reattach the workspace listener (but allow flyout events)
        //清理旧 workspace 事件
        this.workspace.removeChangeListener(this.props.vm.blockListener);
        //把 VM 发来的 XML 解析成 DOM(先去除，去除后不再加载项目)
        const dom = this.ScratchBlocks.Xml.textToDom(data.xml);
        try {
            //加载项目积木(先去除，去除后不再加载项目)
            this.ScratchBlocks.Xml.clearWorkspaceAndLoadFromXml(dom, this.workspace);
        } catch (error) {
            // The workspace is likely incomplete. What did update should be
            // functional.
            //
            // Instead of throwing the error, by logging it and continuing as
            // normal lets the other workspace update processes complete in the
            // gui and vm, which lets the vm run even if the workspace is
            // incomplete. Throwing the error would keep things like setting the
            // correct editing target from happening which can interfere with
            // some blocks and processes in the vm.
            if (error.message) {
                error.message = `Workspace Update Error: ${error.message}`;
            }
            log.error(error);
        }

        //恢复 blockListener
        this.workspace.addChangeListener(this.props.vm.blockListener);

        //恢复滚动位置、scale
        if (this.props.vm.editingTarget && this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id]) {
            // const {scrollX, scrollY, scale} = this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id];
            // this.workspace.scrollX = scrollX;
            // this.workspace.scrollY = scrollY;
            // this.workspace.scale = scale;
            this.workspace.resize();
        }

        // Clear the undo state of the workspace since this is a
        // fresh workspace and we don't want any changes made to another sprites
        // workspace to be 'undone' here.
        // 清空 undo 栈
        this.workspace.clearUndo();

        if (this.props.modeValue === "upload") {
            const blocks = this.workspace.getAllBlocks(false);// 取当前工作区所有积木(false:不含阴影block)
            let existedEventBlock = blocks.find(b => b.type === 'event_when');// 查找 event_when 模块
            if (existedEventBlock) {//存在
                existedEventBlock.setDeletable(false);//设置为不可删除
                this.workspaceToCode({type: 'endDrag'})
            } else {// 不存在
                const block = this.workspace.newBlock('event_when');
                block.initSvg();
                block.render();
                block.moveBy(200, 100);
                block.setDeletable(false);
            }
            // const block = this.workspace.newBlock('event_when');
            // block.initSvg();
            // block.render();
            // block.moveBy(200, 100);
            // block.setDeletable(false);
        }
    }
    handleMonitorsUpdate (monitors) {
        // Update the checkboxes of the relevant monitors.
        // TODO: What about monitors that have fields? See todo in scratch-vm blocks.js changeBlock:
        // https://github.com/LLK/scratch-vm/blob/2373f9483edaf705f11d62662f7bb2a57fbb5e28/src/engine/blocks.js#L569-L576
        const flyout = this.workspace.getFlyout();
        for (const monitor of monitors.values()) {
            const blockId = monitor.get('id');
            const isVisible = monitor.get('visible');
            flyout.setCheckboxState(blockId, isVisible);
            // We also need to update the isMonitored flag for this block on the VM, since it's used to determine
            // whether the checkbox is activated or not when the checkbox is re-displayed (e.g. local variables/blocks
            // when switching between sprites).
            const block = this.props.vm.runtime.monitorBlocks.getBlock(blockId);
            if (block) {
                block.isMonitored = isVisible;
            }
        }
    }

    // 扩展移除回调
    // handleExtensionRemoved (info) {
    //     console.log('1111111扩展移除:', info.extensionId);
    //     // 从 runtime 中重新生成积木 XML
    //     const toolboxXML = this.getToolboxXML();
    //     if (toolboxXML) {
    //         this.defenCatch(toolboxXML); // 使用你已有的刷新方法
    //     }
    // }
    

    handleExtensionAdded (categoryInfo) {
        const defineBlocks = blockInfoArray => {
            if (blockInfoArray && blockInfoArray.length > 0) {
                const staticBlocksJson = [];
                const dynamicBlocksInfo = [];
                blockInfoArray.forEach(blockInfo => {
                    if (blockInfo.info && blockInfo.info.isDynamic) {
                        dynamicBlocksInfo.push(blockInfo);
                    } else if (blockInfo.json) {
                        staticBlocksJson.push(injectExtensionBlockTheme(blockInfo.json, this.props.theme));
                    }
                    // otherwise it's a non-block entry such as '---'
                });

                this.ScratchBlocks.defineBlocksWithJsonArray(staticBlocksJson);
                dynamicBlocksInfo.forEach(blockInfo => {
                    // This is creating the block factory / constructor -- NOT a specific instance of the block.
                    // The factory should only know static info about the block: the category info and the opcode.
                    // Anything else will be picked up from the XML attached to the block instance.
                    const extendedOpcode = `${categoryInfo.id}_${blockInfo.info.opcode}`;
                    const blockDefinition = defineDynamicBlock(
                        this.ScratchBlocks,
                        categoryInfo,
                        blockInfo,
                        extendedOpcode,
                        this.props.theme
                    );
                    this.ScratchBlocks.Blocks[extendedOpcode] = blockDefinition;
                });
            }
        };

        // scratch-blocks implements a menu or custom field as a special kind of block ("shadow" block)
        // these actually define blocks and MUST run regardless of the UI state
        defineBlocks(
            Object.getOwnPropertyNames(categoryInfo.customFieldTypes)
                .map(fieldTypeName => categoryInfo.customFieldTypes[fieldTypeName].scratchBlocksDefinition));
        defineBlocks(categoryInfo.menus);
        defineBlocks(categoryInfo.blocks);

        // Update the toolbox with new blocks if possible
        const toolboxXML = this.getToolboxXML();
        if (toolboxXML) {
            this.props.updateToolboxState(toolboxXML);
        }
    }
    handleBlocksInfoUpdate (categoryInfo) {
        // @todo Later we should replace this to avoid all the warnings from redefining blocks.
        this.handleExtensionAdded(categoryInfo);
    }
    handleCategorySelected (categoryId) {
        const extension = extensionData.find(ext => ext.extensionId === categoryId);
        if (extension && extension.launchPeripheralConnectionFlow) {
            this.handleConnectionModalStart(categoryId);
        }

        this.withToolboxUpdates(() => {
            this.workspace.toolbox_.setSelectedCategoryById(categoryId);
        });
    }
    setBlocks (blocks) {
        this.blocks = blocks;
    }
    handlePromptStart (message, defaultValue, callback, optTitle, optVarType) {
        const p = {prompt: {callback, message, defaultValue}};
        p.prompt.title = optTitle ? optTitle :
            this.ScratchBlocks.Msg.VARIABLE_MODAL_TITLE;
        p.prompt.varType = typeof optVarType === 'string' ?
            optVarType : this.ScratchBlocks.SCALAR_VARIABLE_TYPE;
        p.prompt.showVariableOptions = // This flag means that we should show variable/list options about scope
            optVarType !== this.ScratchBlocks.BROADCAST_MESSAGE_VARIABLE_TYPE &&
            p.prompt.title !== this.ScratchBlocks.Msg.RENAME_VARIABLE_MODAL_TITLE &&
            p.prompt.title !== this.ScratchBlocks.Msg.RENAME_LIST_MODAL_TITLE;
        p.prompt.showCloudOption = (optVarType === this.ScratchBlocks.SCALAR_VARIABLE_TYPE) && this.props.canUseCloud;
        this.setState(p);
    }
    handleConnectionModalStart (extensionId) {
        this.props.onOpenConnectionModal(extensionId);
    }
    handleStatusButtonUpdate () {
        this.ScratchBlocks.refreshStatusButtons(this.workspace);
    }
    handleOpenSoundRecorder () {
        this.props.onOpenSoundRecorder();
    }

    /*
     * Pass along information about proposed name and variable options (scope and isCloud)
     * and additional potentially conflicting variable names from the VM
     * to the variable validation prompt callback used in scratch-blocks.
     */
    handlePromptCallback (input, variableOptions) {
        this.state.prompt.callback(
            input,
            this.props.vm.runtime.getAllVarNamesOfType(this.state.prompt.varType),
            variableOptions);
        this.handlePromptClose();
    }
    handlePromptClose () {
        this.setState({prompt: null});
    }
    handleCustomProceduresClose (data) {
        this.props.onRequestCloseCustomProcedures(data);
        const ws = this.workspace;
        ws.refreshToolboxSelection_();
        ws.toolbox_.scrollToCategoryById('myBlocks');
    }
    handleDrop (dragInfo) {
        fetch(dragInfo.payload.bodyUrl)
            .then(response => response.json())
            .then(payload => {
                const topBlock = findTopBlock(payload);
                if (topBlock) {
                    const metrics = this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id];
                    if (metrics) {
                        const {x, y} = dragInfo.currentOffset;
                        const {left, right} = this.workspace.scrollbar.hScroll.outerSvg_.getBoundingClientRect();
                        const {top} = this.workspace.scrollbar.vScroll.outerSvg_.getBoundingClientRect();
                        topBlock.x = (
                            this.props.isRtl ? metrics.scrollX - x + right : -metrics.scrollX + x - left
                        ) / metrics.scale;
                        topBlock.y = (-metrics.scrollY - top + y) / metrics.scale;
                    }
                }
                return this.props.vm.shareBlocksToTarget(payload, this.props.vm.editingTarget.id);
            })
            .then(() => {
                this.props.vm.refreshWorkspace();
                this.updateToolbox(); // To show new variables/custom blocks
            });
    }
    handleEnableProcedureReturns () {
        this.workspace.enableProcedureReturns();
        this.requestToolboxUpdate();
    }


    //* 新增的 */
    //大大的有用（事件检测，生成代码相关）
    workspaceToCode (event) {
        console.log(event.type)
        if(event.type == 'endDrag' || event.type == 'change'){//拖拽结束或内容变化
            let code;
            //防抖，避免卡顿
            clearTimeout(this._codeTimer);
            this._codeTimer = setTimeout(() => {
                try {
                    let generatorName = "Python";//默认python
                    //console.log(this.props.extensionName)
                    if(this.props.extensionName == "Microbit"){//根据设备判断语言
                        generatorName = "Python";
                    }else if(this.props.extensionName == "Arduino"){
                        generatorName = "Arduino";
                    }else{//否则不显示代码
                        return
                    }
                    
                    // 检查生成器是否存在
                    const generator = this.ScratchBlocks[generatorName];
                    if (!generator) return;

                    code = generator.workspaceToCode(this.workspace);
                    console.log(code)
                    // this.props.setGeneratedCode(this.unindentCode(code));  
                    this.props.setGeneratedCode( code );  
                } catch (e) {
                    code = e.message;
                    console.log(e.message)
                }
            }, 150);
            return code;
        }
        return ''  
    }


    //格式处理（修改为代码整合）暂时不用了
    unindentCode(generator) {
        let functionCodes = [];
        let eventWhenCodes = [];

        //顶层块
        const topBlocks = this.workspace.getTopBlocks(true); // true = 按位置排序
        topBlocks.forEach(block => {
            const opcode = block.type;

            // 先收集函数
            if (opcode === 'procedures_definition') {
                const code = generator.blockToCode(block);
                if (code) functionCodes.push(code);
            }

            // 再收集 event_when
            if (opcode === 'event_when') {
                const code = generator.blockToCode(block);
                if (code) eventWhenCodes.push(code);
            }
        });

        return [
            ...functionCodes,
            ...eventWhenCodes
        ].join('\n\n');
        // // 将代码按行分割
        // let lines = code.split('\n');
        // // 使用map遍历每一行，先取消四个空格缩进，再检查并取消恰好两个空格的缩进
        // const unindentedLines = lines.map(line => {
        //     // 记录原始行
        //     let originalLine = line;
            
        //     // 尝试取消四个空格的缩进
        //     let newLine = line.replace(/^\s{4}/, '');
            
        //     // 如果四个空格缩进已经被取消，检查是否有恰好两个空格的缩进
        //     if (newLine !== originalLine) {
        //     // 只有在四个空格缩进被取消后，才检查恰好两个空格的缩进
        //     newLine = newLine.replace(/^\s{2}(?! )/, '');
        //     }
            
        //     return newLine;
        // });
    
        // // 将处理后的行重新组合成一个字符串
        // return unindentedLines.join('\n');
    }

    //格式处理（没细看）
    indentPythonFunctions(code) {
        const lines = code.split('\n');
        let result = [];
        let inFunction = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
        
            if (line.trim().startsWith('def ')) {
            // 函数定义行
            inFunction = true;
            result.push(line); // 原样添加
            continue;
            }
        
            // 空行代表函数体结束
            if (line.trim() === '') {
            inFunction = false;
            result.push(line);
            continue;
            }
        
            // 缩进函数体（不在 def 行且处于函数中）
            if (inFunction) {
            result.push('    ' + line);
            } else {
            result.push(line);
            }
        }
        return result.join('\n');
    }
    








    //工具箱分类点击（主要用于搜索收起）
    toolboxClick = () => {
        if (!this.props.isActive) { return }//搜索未展开不处理
        this.hideSearchFlyout();

        // const category = this.workspace.getToolbox().getSelectedItem();
        // const toolbox = this.workspace?.getToolbox();//暂时不用了，不过可能会出现展开搜索框时点击分类无法正常跳转,就可以放开此处，不过放开会出现二次切换造成闪烁
        // toolbox.selectItemById(category?.id_);
    }

    

    // 展示编程模块
    showSearchFlyout = async() => {
        if (!this.workspace) return;
        const flyout = this.workspace.getFlyout();
        if (!flyout) return;

        if (!this._searchIndex) {
            await this.setSearchSourceXml(flyout);
        }

        const xmlText = ``;
        //const xmlText = `<label text="Selected"></label> <block type="motion_movesteps"> <value name="STEPS"> <shadow type="math_number"> <field name="NUM">10</field> </shadow> </value> </block> <block type="motion_turnright"> <value name="DEGREES"> <shadow type="math_number"> <field name="NUM">15</field> </shadow> </value> </block> <block type="looks_say"> <value name="MESSAGE"> <shadow type="text"> <field name="TEXT">Hello!</field> </shadow> </value> </block>` ;
        
        const dom = this.ScratchBlocks.Xml.textToDom(`<xml>${xmlText}</xml>`);
        const blockNodes = Array.from(dom.children);
        
        // 显示搜索模块
        flyout.show(blockNodes);
        flyout.reflow();
    };

    //卸载编程模块
    hideSearchFlyout = () => {
        this._searchIndex = null; // 清缓存
        this.props.setisSearchActive(false)
        this.requestToolboxUpdate(); // 恢复flyout
    };

    // 记录并存储当前模块
    setSearchSourceXml = async(flyout) => {
        const flyoutWorkspace = flyout.getWorkspace();
        if (!flyoutWorkspace) return;
        const blocks = flyoutWorkspace.getTopBlocks(false);

        this._searchIndex = blocks.map(block => {
            const type = block.type;
 
            const label = block.toString();

            const xmlDom = this.ScratchBlocks.Xml.blockToDom(block);
            const xmlText = this.ScratchBlocks.Xml.domToText(xmlDom);
    
            // 搜索文本（还可以增强）
            const searchableText = [
                label,
                type,
                ...(this.getBlockKeywords?.(type) || [])
            ].join(' ').toLowerCase();
    
            return { type, label, searchableText, xmlText };
        });
    }
    
    //筛选
    searchBlock = (value) => {
        if (!this.workspace) return;
        const flyout = this.workspace.getFlyout();
        if (!flyout) return;

        let matchedXml=[];
        const keyword = value.trim().toLowerCase();
        
        if (keyword) {
            const matched = this._searchIndex.filter(item =>
                item.searchableText.includes(keyword)
            );
        
            matchedXml = matched.map(item => {
                const dom = this.ScratchBlocks.Xml.textToDom(item.xmlText);
                return dom;
            });
        }
        

        const labelDom = this.ScratchBlocks.Xml.textToDom(
            `<xml><label text=" "></label></xml>`
        ).firstChild;
        matchedXml.unshift(labelDom);
    
        flyout.show(matchedXml);
        flyout.reflow();
    };
    

    

    render () {
        /* eslint-disable no-unused-vars */
        const {
            anyModalVisible,
            canUseCloud,
            customStageSize,
            customProceduresVisible,
            extensionLibraryVisible,
            options,
            stageSize,
            vm,
            isRtl,
            isVisible,
            onActivateColorPicker,
            onOpenConnectionModal,
            onOpenSoundRecorder,
            onOpenCustomExtensionModal,
            reduxOnOpenCustomExtensionModal,
            updateToolboxState,
            onActivateCustomProcedures,
            onRequestCloseExtensionLibrary,
            onRequestCloseCustomProcedures,
            toolboxXML,
            updateMetrics: updateMetricsProp,
            useCatBlocks,
            workspaceMetrics,
            ...props
        } = this.props;
        /* eslint-enable no-unused-vars */
        return (
            <React.Fragment>

                <DroppableBlocks
                    componentRef={this.setBlocks}
                    onDrop={this.handleDrop}
                    {...props}
                />
                {this.state.prompt ? (
                    <Prompt
                        defaultValue={this.state.prompt.defaultValue}
                        isStage={vm.runtime.getEditingTarget().isStage}
                        showListMessage={this.state.prompt.varType === this.ScratchBlocks.LIST_VARIABLE_TYPE}
                        label={this.state.prompt.message}
                        showCloudOption={this.state.prompt.showCloudOption}
                        showVariableOptions={this.state.prompt.showVariableOptions}
                        title={this.state.prompt.title}
                        vm={vm}
                        onCancel={this.handlePromptClose}
                        onOk={this.handlePromptCallback}
                    />
                ) : null}
                {extensionLibraryVisible ? (
                    <ExtensionLibrary
                        vm={vm}
                        onCategorySelected={this.handleCategorySelected}
                        onEnableProcedureReturns={this.handleEnableProcedureReturns}
                        onRequestClose={onRequestCloseExtensionLibrary}
                        onOpenCustomExtensionModal={onOpenCustomExtensionModal || reduxOnOpenCustomExtensionModal}
                        extensionName ={this.props.extensionName}
                        modeValue = {this.props.modeValue}
                    />
                ) : null}
                {customProceduresVisible ? (
                    <CustomProcedures
                        options={{
                            media: options.media
                        }}
                        onRequestClose={this.handleCustomProceduresClose}
                    />
                ) : null}
            </React.Fragment>
        );
    }
}

Blocks.propTypes = {
    intl: intlShape,
    anyModalVisible: PropTypes.bool,
    canUseCloud: PropTypes.bool,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
    }),
    customProceduresVisible: PropTypes.bool,
    extensionLibraryVisible: PropTypes.bool,
    isRtl: PropTypes.bool,
    isVisible: PropTypes.bool,
    locale: PropTypes.string.isRequired,
    messages: PropTypes.objectOf(PropTypes.string),
    onActivateColorPicker: PropTypes.func,
    onActivateCustomProcedures: PropTypes.func,
    onOpenConnectionModal: PropTypes.func,
    onOpenSoundRecorder: PropTypes.func,
    onOpenCustomExtensionModal: PropTypes.func,
    reduxOnOpenCustomExtensionModal: PropTypes.func,
    onRequestCloseCustomProcedures: PropTypes.func,
    onRequestCloseExtensionLibrary: PropTypes.func,
    options: PropTypes.shape({
        media: PropTypes.string,
        zoom: PropTypes.shape({
            controls: PropTypes.bool,
            wheel: PropTypes.bool,
            startScale: PropTypes.number
        }),
        comments: PropTypes.bool,
        collapse: PropTypes.bool
    }),
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired,
    theme: PropTypes.instanceOf(Theme),
    toolboxXML: PropTypes.string,
    updateMetrics: PropTypes.func,
    updateToolboxState: PropTypes.func,
    useCatBlocks: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    workspaceMetrics: PropTypes.shape({
        targets: PropTypes.objectOf(PropTypes.object)
    })
};

Blocks.defaultOptions = {
    zoom: {
        controls: true,
        wheel: true,
        startScale: BLOCKS_DEFAULT_SCALE
    },
    grid: {
        spacing: 40,
        length: 2,
        colour: '#ddd'
    },
    comments: true,
    collapse: false,
    sounds: false
};

Blocks.defaultProps = {
    isVisible: true,
    options: Blocks.defaultOptions,
    theme: Theme.light
};

const mapStateToProps = state => ({
    anyModalVisible: (
        Object.keys(state.scratchGui.modals).some(key => state.scratchGui.modals[key]) ||
        state.scratchGui.mode.isFullScreen
    ),
    customStageSize: state.scratchGui.customStageSize,
    extensionLibraryVisible: state.scratchGui.modals.extensionLibrary,
    isRtl: state.locales.isRtl,
    locale: state.locales.locale,
    messages: state.locales.messages,
    toolboxXML: state.scratchGui.toolbox.toolboxXML,
    customProceduresVisible: state.scratchGui.customProcedures.active,
    workspaceMetrics: state.scratchGui.workspaceMetrics,
    useCatBlocks: isTimeTravel2020(state)
});

const mapDispatchToProps = dispatch => ({
    onActivateColorPicker: callback => dispatch(activateColorPicker(callback)),
    onActivateCustomProcedures: (data, callback) => dispatch(activateCustomProcedures(data, callback)),
    onOpenConnectionModal: id => {
        dispatch(setConnectionModalExtensionId(id));
        dispatch(openConnectionModal());
    },
    onOpenSoundRecorder: () => {
        dispatch(activateTab(SOUNDS_TAB_INDEX));
        dispatch(openSoundRecorder());
    },
    reduxOnOpenCustomExtensionModal: () => dispatch(openCustomExtensionModal()),
    onRequestCloseExtensionLibrary: () => {
        dispatch(closeExtensionLibrary());
    },
    onRequestCloseCustomProcedures: data => {
        dispatch(deactivateCustomProcedures(data));
    },
    updateToolboxState: toolboxXML => {
        dispatch(updateToolbox(toolboxXML));
    },
    updateMetrics: metrics => {
        dispatch(updateMetrics(metrics));
    },
    setGeneratedCode: code => dispatch(setGeneratedCode(code))//更新代码
});

export default injectIntl(errorBoundaryHOC('Blocks')(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(LoadScratchBlocksHOC(Blocks))
));
















