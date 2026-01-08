import PropTypes from 'prop-types';
import React from 'react';
import {compose} from 'redux';
import {connect} from 'react-redux';
import ReactModal from 'react-modal';
import VM from 'scratch-vm';
import {injectIntl, intlShape} from 'react-intl';

import ErrorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import {
    getIsError,
    getIsShowingProject
} from '../reducers/project-state';
import {
    activateTab,
    activateTabUpload,
    activateTabPython,
    BLOCKS_TAB_INDEX,
    COSTUMES_TAB_INDEX,
    SOUNDS_TAB_INDEX
} from '../reducers/editor-tab';

import {
    closeCostumeLibrary,
    closeBackdropLibrary,
    closeTelemetryModal,
    openExtensionLibrary
} from '../reducers/modals';

import FontLoaderHOC from '../lib/font-loader-hoc.jsx';
import LocalizationHOC from '../lib/localization-hoc.jsx';
import SBFileUploaderHOC from '../lib/sb-file-uploader-hoc.jsx';
import ProjectFetcherHOC from '../lib/project-fetcher-hoc.jsx';
import TitledHOC from '../lib/titled-hoc.jsx';
import ProjectSaverHOC from '../lib/project-saver-hoc.jsx';
import storage from '../lib/storage';
import vmListenerHOC from '../lib/vm-listener-hoc.jsx';
import vmManagerHOC from '../lib/vm-manager-hoc.jsx';
import cloudManagerHOC from '../lib/cloud-manager-hoc.jsx';

import GUIComponent from '../components/gui/gui.jsx';
import {setIsScratchDesktop} from '../lib/isScratchDesktop.js';
import TWFullScreenResizerHOC from '../lib/tw-fullscreen-resizer-hoc.jsx';
import TWThemeManagerHOC from './tw-theme-manager-hoc.jsx';

import DesktopAPI from '../lib/DesktopAPI.js';

//import vmDownloadListenerHOC from '../lib/vm-download-listener-hoc.jsx';//新增的下载vm相关
//import vmDownloadManagerHOC from '../lib/vm-download-manager-hoc.jsx';

import { setSelectedMode } from '../reducers/sun';


import downloadVM  from '../lib/download-vm.js';

const {RequestMetadata, setMetadata, unsetMetadata} = storage.scratchFetch;

const setProjectIdMetadata = projectId => {
    // If project ID is '0' or zero, it's not a real project ID. In that case, remove the project ID metadata.
    // Same if it's null undefined.
    // 如果项目 ID 为“0”或零，则它不是一个真实的项目 ID。在这种情况下，移除项目 ID 元数据。
    // 如果为 null 或未定义，情况也相同。
    if (projectId && projectId !== '0') {
        setMetadata(RequestMetadata.ProjectId, projectId);
    } else {
        unsetMetadata(RequestMetadata.ProjectId);
    }
};




class GUI extends React.Component {
    componentDidMount () {//初始化
        setIsScratchDesktop(this.props.isScratchDesktop);//设置当前是否是桌面版应用。
        this.props.onStorageInit(storage);//初始化存储，传入 storage 对象。
        this.props.onVmInit(this.props.vm);//初始化虚拟机 (VM)
        setProjectIdMetadata(this.props.projectId);//将项目 ID 设置为元数据

        //导入时模式监听
        this.handleProjectModeChanged = (mode) => {
            this.props.setSelectedMode(mode);
        };

        this.props.vm.on('projectModeChanged', this.handleProjectModeChanged);
        
    }
    componentDidUpdate (prevProps) {//组件更新时触发，用来检测属性变化并做相应的操作
        //如果 projectId 发生了变化，会调用 onUpdateProjectId 来更新项目 ID。
        if (this.props.projectId !== prevProps.projectId) {
            if (this.props.projectId !== null) {
                this.props.onUpdateProjectId(this.props.projectId);
            }
            setProjectIdMetadata(this.props.projectId);
        }
        //如果 isShowingProject 从 false 变为 true，表示项目已经加载完毕，调用 onProjectLoaded 来处理相关操作
        if (this.props.isShowingProject && !prevProps.isShowingProject) {
            // this only notifies container when a project changes from not yet loaded to loaded
            // At this time the project view in www doesn't need to know when a project is unloaded
            this.props.onProjectLoaded();
        }
    }

    // 组件卸载时
    componentWillUnmount() {
        //取消监听
        if (this.props.vm && this.handleProjectModeChanged) {
            this.props.vm.off('projectModeChanged', this.handleProjectModeChanged);
        }
    }

    render () {
        if (this.props.isError) {
            throw this.props.error;
        }
        const {
            /* eslint-disable no-unused-vars */
            assetHost,
            cloudHost,
            error,
            isError,
            isScratchDesktop,
            isShowingProject,
            onProjectLoaded,
            onStorageInit,
            onUpdateProjectId,
            onVmInit,
            projectHost,
            projectId,
            /* eslint-enable no-unused-vars */
            children,
            fetchingProject,
            isLoading,
            loadingStateVisible,
            ...componentProps
        } = this.props;
        return (
            <GUIComponent
                loading={fetchingProject || isLoading || loadingStateVisible}
                masterSelectedState={this.props.masterSelectedState}//传递设备选择状态
                //downloadVM = {downloadVM} // 传递下载VM
                {...componentProps}
            >
                {children}
            </GUIComponent>
        );
    }
}


//定义该组件允许接收的属性和默认值
GUI.propTypes = {
    assetHost: PropTypes.string,
    children: PropTypes.node,
    cloudHost: PropTypes.string,
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    fetchingProject: PropTypes.bool,
    intl: intlShape,
    isError: PropTypes.bool,
    isEmbedded: PropTypes.bool,
    isFullScreen: PropTypes.bool,
    isLoading: PropTypes.bool,
    isScratchDesktop: PropTypes.bool,
    isShowingProject: PropTypes.bool,
    isTotallyNormal: PropTypes.bool,
    loadingStateVisible: PropTypes.bool,
    onProjectLoaded: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onStorageInit: PropTypes.func,
    onUpdateProjectId: PropTypes.func,
    onVmInit: PropTypes.func,
    projectHost: PropTypes.string,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    telemetryModalVisible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    //downloadVM: PropTypes.instanceOf(VM).isRequired
};

GUI.defaultProps = {
    isScratchDesktop: false,
    isTotallyNormal: false,
    onStorageInit: storageInstance => storageInstance.addOfficialScratchWebStores(),
    onProjectLoaded: () => {},
    onUpdateProjectId: () => {},
    onVmInit: (/* vm */) => {}
};

//Redux 连接部分

//把 Redux 全局状态映射到组件 props
const mapStateToProps = state => {
    const loadingState = state.scratchGui.projectState.loadingState;
    return {
        activeTabIndex: state.scratchGui.editorTab.activeTabIndex,
        activeTabIndexUpload:state.scratchGui.editorTab.activeTabIndexUpload,//下载模式tab
        activeTabIndexPython:state.scratchGui.editorTab.activeTabIndexPython,//py模式tab
        alertsVisible: state.scratchGui.alerts.visible,
        backdropLibraryVisible: state.scratchGui.modals.backdropLibrary,
        blocksTabVisible: state.scratchGui.editorTab.activeTabIndex === BLOCKS_TAB_INDEX,
        blocksTabUploadVisible: state.scratchGui.editorTab.activeTabIndexUpload === BLOCKS_TAB_INDEX,//下载模式是否为block
        cardsVisible: state.scratchGui.cards.visible,
        connectionModalVisible: state.scratchGui.modals.connectionModal,
        costumeLibraryVisible: state.scratchGui.modals.costumeLibrary,
        costumesTabVisible: state.scratchGui.editorTab.activeTabIndex === COSTUMES_TAB_INDEX,
        error: state.scratchGui.projectState.error,
        isError: getIsError(loadingState),
        isEmbedded: state.scratchGui.mode.isEmbedded,
        isFullScreen: state.scratchGui.mode.isFullScreen || state.scratchGui.mode.isEmbedded,
        isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
        isRtl: state.locales.isRtl,
        isShowingProject: getIsShowingProject(loadingState),
        loadingStateVisible: state.scratchGui.modals.loadingProject,
        projectId: state.scratchGui.projectState.projectId,
        soundsTabVisible: state.scratchGui.editorTab.activeTabIndex === SOUNDS_TAB_INDEX,
        targetIsStage: (
            state.scratchGui.targets.stage &&
            state.scratchGui.targets.stage.id === state.scratchGui.targets.editingTarget
        ),
        telemetryModalVisible: state.scratchGui.modals.telemetryModal,
        tipsLibraryVisible: state.scratchGui.modals.tipsLibrary,
        usernameModalVisible: state.scratchGui.modals.usernameModal,
        settingsModalVisible: state.scratchGui.modals.settingsModal,
        customExtensionModalVisible: state.scratchGui.modals.customExtensionModal,
        fontsModalVisible: state.scratchGui.modals.fontsModal,
        unknownPlatformModalVisible: state.scratchGui.modals.unknownPlatformModal,
        invalidProjectModalVisible: state.scratchGui.modals.invalidProjectModal,
        vm: state.scratchGui.vm,
        //downloadVM: state.scratchGui.vmDownload,//下载模式vm
        masterModalVisible: state.scratchGui.modals.masterModal, //主控选择页面状态
        connectModalVisible: state.scratchGui.modals.connectModal, //连接窗口状态
        firmwareModalVisible: state.scratchGui.modals.firmwareModal,//固件升级窗口状态
        masterSelectedState: state.scratchGui.modals.masterSelectedState,//选择了哪个设备
    };
};


//把操作函数绑定到组件
const mapDispatchToProps = dispatch => {
    // 注册
    DesktopAPI.registerDispatch(dispatch);
    // 初始化监听
    DesktopAPI.initListeners();
    return {
        onExtensionButtonClick: () => dispatch(openExtensionLibrary()),
        onActivateTab: tab => dispatch(activateTab(tab)),
        onActivateTabUpload: tab => dispatch(activateTabUpload(tab)),
        onActivateTabPython: tab => dispatch(activateTabPython(tab)),

        onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),
        onActivateSoundsTab: () => dispatch(activateTab(SOUNDS_TAB_INDEX)),
        onRequestCloseBackdropLibrary: () => dispatch(closeBackdropLibrary()),
        onRequestCloseCostumeLibrary: () => dispatch(closeCostumeLibrary()),
        onRequestCloseTelemetryModal: () => dispatch(closeTelemetryModal()),
        setSelectedMode: (mode) => dispatch(setSelectedMode(mode)),//模式

        ...DesktopAPI
    };
};

const ConnectedGUI = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(GUI));

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedGui = compose(
    LocalizationHOC,
    ErrorBoundaryHOC('Top Level App'),
    TWThemeManagerHOC, // componentDidUpdate() needs to run very early for icons to update immediately
    TWFullScreenResizerHOC,
    FontLoaderHOC,
    // QueryParserHOC, // tw: HOC is unused
    ProjectFetcherHOC,
    TitledHOC,
    ProjectSaverHOC,
    vmListenerHOC,
    vmManagerHOC,
    //vmDownloadListenerHOC, // 新增download
    //vmDownloadManagerHOC,
    
    SBFileUploaderHOC,
    cloudManagerHOC
)(ConnectedGUI);

WrappedGui.setAppElement = ReactModal.setAppElement;
export default WrappedGui;
