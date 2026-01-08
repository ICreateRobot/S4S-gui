import classNames from 'classnames';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React ,{ useState,useEffect }from 'react';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import MediaQuery from 'react-responsive';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import tabStyles from 'react-tabs/style/react-tabs.css';
import VM from 'scratch-vm';

import Blocks from '../../containers/blocks.jsx';
import CostumeTab from '../../containers/costume-tab.jsx';
import TargetPane from '../../containers/target-pane.jsx';
import SoundTab from '../../containers/sound-tab.jsx';
import StageWrapper from '../../containers/stage-wrapper.jsx';
import Loader from '../loader/loader.jsx';
import Box from '../box/box.jsx';
import MenuBar from '../menu-bar/menu-bar.jsx';
import CostumeLibrary from '../../containers/costume-library.jsx';
import BackdropLibrary from '../../containers/backdrop-library.jsx';
import Watermark from '../../containers/watermark.jsx';

import BrowserModal from '../browser-modal/browser-modal.jsx';
import TipsLibrary from '../../containers/tips-library.jsx';
import Cards from '../../containers/cards.jsx';
import Alerts from '../../containers/alerts.jsx';
import DragLayer from '../../containers/drag-layer.jsx';
import ConnectionModal from '../../containers/connection-modal.jsx';
import TelemetryModal from '../telemetry-modal/telemetry-modal.jsx';
import TWUsernameModal from '../../containers/tw-username-modal.jsx';
import TWSettingsModal from '../../containers/tw-settings-modal.jsx';
import TWSecurityManager from '../../containers/tw-security-manager.jsx';
import TWCustomExtensionModal from '../../containers/tw-custom-extension-modal.jsx';
import TWRestorePointManager from '../../containers/tw-restore-point-manager.jsx';
import TWFontsModal from '../../containers/tw-fonts-modal.jsx';
import TWUnknownPlatformModal from '../../containers/tw-unknown-platform-modal.jsx';
import TWInvalidProjectModal from '../../containers/tw-invalid-project-modal.jsx';
import CodeMirrorComponent from '../CodeMirrorComponent/CodeMirrorComponent.jsx';

import {STAGE_SIZE_MODES, FIXED_WIDTH, UNCONSTRAINED_NON_STAGE_WIDTH} from '../../lib/layout-constants';
import {resolveStageSize} from '../../lib/screen-utils';
import {Theme} from '../../lib/themes';

import {isRendererSupported, isBrowserSupported} from '../../lib/tw-environment-support-prober';

import styles from './gui.css';

import addExtensionIcon from './icon--extensions.svg';
import codeIcon from '!../../lib/tw-recolor/build!./icon--code.svg';
import costumesIcon from '!../../lib/tw-recolor/build!./icon--costumes.svg';
import soundsIcon from '!../../lib/tw-recolor/build!./icon--sounds.svg';

import pythonIcon from '!../../lib/tw-recolor/build!./icon--python.svg';//python图标
import pipIcon from '!../../lib/tw-recolor/build!./icon--pip.svg';//python图标
import uiEditorIcon from '!../../lib/tw-recolor/build!./icon--uiEditor.svg';//ui图标
import iotIcon from '!../../lib/tw-recolor/build!./icon--iot.svg';//iot图标


import LoadingOverlay from '../LoadingOverlay/LoadingOverlay.jsx';
import BurnLogs from 'scratch-gui/src/components/Burn-logs/BurnLogs.jsx';
import TrainPage from '../TrainPage/TrainPage.jsx';
import TabSwitcher from '../TabSwitcher/TabSwitcher.jsx';
import { useGuiLogic } from '../hooks/gui-logic.js';
import ExampleModal from '../ExampleModal/ExampleModal.jsx'

// 自定义窗口
import MasterModal from '../master-modal/MasterModal.jsx'//设备
import ConnectTabs from '../connect-modal/connectModal.jsx';//连接
import FirmwareModal from '../firmware-modal/FirmwareModal.jsx'//固件


import PythonEditor from '../python-editor/pythonEditor.jsx';
import PythonInstall from '../python-install/pythonInstall.jsx';

import UploadCodeToolbar from '../upload-code-toolbar/upload-code-toolbar.jsx';

import ToolboxSearchButton from '../../containers/toolbox-search-button.jsx';


const messages = defineMessages({
    addExtension: {
        id: 'gui.gui.addExtension',
        description: 'Button to add an extension in the target pane',
        defaultMessage: 'Add Extension'
    }
});

const getFullscreenBackgroundColor = () => {
    const params = new URLSearchParams(location.search);
    if (params.has('fullscreen-background')) {
        return params.get('fullscreen-background');
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return '#111';
    }
    return 'white';
};

const fullscreenBackgroundColor = getFullscreenBackgroundColor();

const GUIComponent = props => {

    const {
        accountNavOpen,
        activeTabIndex,
        activeTabIndexUpload,
        activeTabIndexPython,
        alertsVisible,
        authorId,
        authorThumbnailUrl,
        authorUsername,
        basePath,
        backdropLibraryVisible,
        backpackHost,
        backpackVisible,
        blocksId,
        blocksTabVisible,
        blocksTabUploadVisible,
        cardsVisible,
        canChangeLanguage,
        canChangeTheme,
        canCreateNew,
        canEditTitle,
        canManageFiles,
        canRemix,
        canSave,
        canCreateCopy,
        canShare,
        canUseCloud,
        children,
        connectionModalVisible,
        costumeLibraryVisible,
        costumesTabVisible,
        customStageSize,
        enableCommunity,
        intl,
        isCreating,
        isEmbedded,
        isFullScreen,
        isPlayerOnly,
        isRtl,
        isShared,
        isWindowFullScreen,
        isTelemetryEnabled,
        isTotallyNormal,
        loading,
        logo,
        renderLogin,
        onClickAbout,
        onClickAccountNav,
        onCloseAccountNav,
        onClickAddonSettings,
        onClickConnect,
        onClickFirmware,
        onClickDesktopSettings,
        clickSerialConnect,
        download,
        SerialDownload,
        saveCode,
        loadCode,
        cancelload,
        clickBleConnect,
        clickDownloadCode,
        clickEspSend,
        clickSendWifi,
        onClickNewWindow,
        onClickPackager,
        onLogOut,
        onOpenRegistration,
        onToggleLoginOpen,
        onActivateCostumesTab,
        onActivateSoundsTab,
        onActivateTab,
        onActivateTabUpload,
        onActivateTabPython,
        onClickLogo,
        onExtensionButtonClick,
        onOpenCustomExtensionModal,
        onProjectTelemetryEvent,
        onRequestCloseBackdropLibrary,
        onRequestCloseCostumeLibrary,
        onRequestCloseTelemetryModal,
        onSeeCommunity,
        onShare,
        onShowPrivacyPolicy,
        onStartSelectingFileUpload,
        onTelemetryModalCancel,
        onTelemetryModalOptIn,
        onTelemetryModalOptOut,
        securityManager,
        showComingSoon,
        showOpenFilePicker,
        showSaveFilePicker,
        soundsTabVisible,
        stageSizeMode,
        targetIsStage,
        telemetryModalVisible,
        theme,
        tipsLibraryVisible,
        usernameModalVisible,
        settingsModalVisible,
        customExtensionModalVisible,
        fontsModalVisible,
        unknownPlatformModalVisible,
        invalidProjectModalVisible,
        vm,
        //downloadVM,
        ...componentProps
    } = omit(props, 'dispatch');

    if (children) {
        return <Box {...componentProps}>{children}</Box>;
    }

    const {
        pythonCode,
        isTrain,
        isLoading,
        setIsLoading,
        isFlashing,
        logs,
        extensionName,
        setExtensionName,
        data,
        modeValue,
        setModeValue,
        open,
        setOpen,
        handleOpenExample,
        handleSelect,
    } = useGuiLogic({
        onExtensionButtonClick,
        onOpenCustomExtensionModal,
        download,
        SerialDownload,
        saveCode,
        loadCode,
        cancelload,
        clickDownloadCode,
        clickEspSend,
        clickSendWifi
    });

    const tabClassNames = {
        tabs: styles.tabs,
        tab: classNames(tabStyles.reactTabsTab, styles.tab),
        tabList: classNames(tabStyles.reactTabsTabList, styles.tabList),
        tabPanel: classNames(tabStyles.reactTabsTabPanel, styles.tabPanel),
        tabPanelSelected: classNames(tabStyles.reactTabsTabPanelSelected, styles.isSelected),
        tabSelected: classNames(tabStyles.reactTabsTabSelected, styles.isSelected)
    };

    const unconstrainedWidth = (
        UNCONSTRAINED_NON_STAGE_WIDTH +
        FIXED_WIDTH +
        Math.max(0, customStageSize.width - FIXED_WIDTH)
    );


    const [uploadLayout, setUploadLayout] = useState('split');//下载模式用（占比）


    // 监听设备变化
    useEffect(() => {
        console.log("gui")
        console.log(props.selectedDevice,props.selectedmode)
        setExtensionName(props.selectedDevice);//先用着后面更换
        setModeValue(props.selectedmode)
       
    }, [props.selectedDevice,props.selectedmode]);


    // 搜索模块相关
    const [isSearchActive, setisSearchActive] = useState(false);
    const showSearchFlyoutDiv = () => {
        // 如果是搜索状态，就隐藏flyout
        if (isSearchActive) {
            hideSearchFlyout();
            return;
        }
        
        setisSearchActive(true );

        window.BlocksSearch("show","");//全局调用
    };

    //卸载
    const hideSearchFlyout = () => {
        if (!isSearchActive) return;

        setisSearchActive(false);

        window.BlocksSearch("hide","");//全局调用
    };

    //筛选
    const handleInputChange = (e) => {
        console.log(e.target.value);
        window.BlocksSearch("search",e.target.value);//全局调用

    };

    return (
        <MediaQuery minWidth={unconstrainedWidth}>{isUnconstrained => {
        const stageSize = resolveStageSize(stageSizeMode, isUnconstrained);
        const alwaysEnabledModals = (
            <React.Fragment>
                <TWSecurityManager securityManager={securityManager} />
                <TWRestorePointManager />
                {usernameModalVisible && <TWUsernameModal />}
                {settingsModalVisible && <TWSettingsModal />}
                {customExtensionModalVisible && <TWCustomExtensionModal />}
                {fontsModalVisible && <TWFontsModal />}
                {unknownPlatformModalVisible && <TWUnknownPlatformModal />}
                {invalidProjectModalVisible && <TWInvalidProjectModal />}
            </React.Fragment>
        );


        return isPlayerOnly ? (
            <React.Fragment>
                {isWindowFullScreen ? (
                    <div
                        className={styles.fullscreenBackground}
                        style={{
                            backgroundColor: fullscreenBackgroundColor
                        }}
                    />
                ) : null}
                <StageWrapper
                    isFullScreen={isFullScreen}
                    isEmbedded={isEmbedded}
                    isRendererSupported={isRendererSupported()}
                    isRtl={isRtl}
                    loading={loading}
                    stageSize={STAGE_SIZE_MODES.full}
                    vm={vm}
                >
                    {alertsVisible ? (
                        <Alerts className={styles.alertsContainer} />
                    ) : null}
                </StageWrapper>
                {alwaysEnabledModals}
            </React.Fragment>
        ) : (
            <Box
                className={styles.pageWrapper}
                dir={isRtl ? 'rtl' : 'ltr'}
                style={{
                    minWidth: 1024 + Math.max(0, customStageSize.width - 480),
                    minHeight: 640 + Math.max(0, customStageSize.height - 360)
                }}
                {...componentProps}
            >
                {alwaysEnabledModals}
                {telemetryModalVisible ? (
                    <TelemetryModal
                        isRtl={isRtl}
                        isTelemetryEnabled={isTelemetryEnabled}
                        onCancel={onTelemetryModalCancel}
                        onOptIn={onTelemetryModalOptIn}
                        onOptOut={onTelemetryModalOptOut}
                        onRequestClose={onRequestCloseTelemetryModal}
                        onShowPrivacyPolicy={onShowPrivacyPolicy}
                    />
                ) : null}
                {loading ? (
                    <Loader isFullScreen />
                ) : null}
                {isCreating ? (
                    <Loader
                        isFullScreen
                        messageId="gui.loader.creating"
                    />
                ) : null}
                {isBrowserSupported() ? null : (
                    <BrowserModal
                        isRtl={isRtl}
                        onClickDesktopSettings={onClickDesktopSettings}
                    />
                )}
                {tipsLibraryVisible ? (
                    <TipsLibrary />
                ) : null}
                {cardsVisible ? (
                    <Cards />
                ) : null}
                {alertsVisible ? (
                    <Alerts className={styles.alertsContainer} />
                ) : null}
                {connectionModalVisible ? (
                    <ConnectionModal
                        vm={vm}
                    />
                ) : null}
                {costumeLibraryVisible ? (
                    <CostumeLibrary
                        vm={vm}
                        onRequestClose={onRequestCloseCostumeLibrary}
                    />
                ) : null}
                {backdropLibraryVisible ? (
                    <BackdropLibrary
                        vm={vm}
                        onRequestClose={onRequestCloseBackdropLibrary}
                    />
                ) : null}
                
                <MenuBar
                    accountNavOpen={accountNavOpen}
                    authorId={authorId}
                    authorThumbnailUrl={authorThumbnailUrl}
                    authorUsername={authorUsername}
                    canChangeLanguage={canChangeLanguage}
                    canChangeTheme={canChangeTheme}
                    canCreateCopy={canCreateCopy}
                    canCreateNew={canCreateNew}
                    canEditTitle={canEditTitle}
                    canManageFiles={canManageFiles}
                    canRemix={canRemix}
                    canSave={canSave}
                    canShare={canShare}
                    className={styles.menuBarPosition}
                    enableCommunity={enableCommunity}
                    isShared={isShared}
                    isTotallyNormal={isTotallyNormal}
                    logo={logo}
                    renderLogin={renderLogin}
                    showComingSoon={showComingSoon}
                    showOpenFilePicker={showOpenFilePicker}
                    showSaveFilePicker={showSaveFilePicker}
                    onClickAbout={onClickAbout}
                    onClickAccountNav={onClickAccountNav}
                    onClickAddonSettings={onClickAddonSettings}
                    onClickMaster={props.onClickMaster}//选择主控窗口点击开启
                    onClickConnect={() => props.onConnectModal(props.selectedDevice)}//连接窗口点击开启props.onConnectModal
                    onClickFirmware={() => props.onClickFirmware(props.selectedDevice)}//固件升级窗口
                    onClickDesktopSettings={onClickDesktopSettings}
                    clickSerialConnect={clickSerialConnect}
                    clickBleConnect={clickBleConnect}
                    clickDownloadCode={clickDownloadCode}
                    clickEspSend={clickEspSend}
                    clickSendWifi={clickSendWifi}
                    onClickNewWindow={onClickNewWindow}
                    onClickPackager={onClickPackager}
                    onClickLogo={onClickLogo}
                    onCloseAccountNav={onCloseAccountNav}
                    onLogOut={onLogOut}
                    onOpenRegistration={onOpenRegistration}
                    onProjectTelemetryEvent={onProjectTelemetryEvent}
                    onSeeCommunity={onSeeCommunity}
                    onShare={onShare}
                    onStartSelectingFileUpload={onStartSelectingFileUpload}
                    onToggleLoginOpen={onToggleLoginOpen}
                    setIsLoading={setIsLoading}
                    modeValue={modeValue}
                    extensionName={extensionName}
                    openExampleCode={handleOpenExample}
                />
                <Box className={styles.bodyWrapper}>
                    {modeValue === 'python'  && (//python窗口
                        <Box className={styles.flexWrapper}>
                            <Box className={styles.editorWrapper}>
                                <Tabs
                                    forceRenderTabPanel//强制渲染所有 TabPanel
                                    className={tabClassNames.tabs}
                                    selectedIndex={ activeTabIndexPython }// 需要修改为新的索引管理 当前选中索引 pythonTabIndex
                                    selectedTabClassName={tabClassNames.tabSelected}
                                    selectedTabPanelClassName={tabClassNames.tabPanelSelected}
                                    onSelect={onActivateTabPython }// 需要修改为新的处理函数 onPythonTab
                                >
                                    {/* 标签栏 */}
                                    <TabList className={tabClassNames.tabList} style={{
                                        position: 'relative',
                                        zIndex: 100
                                    }}>
                                        <Tab className={tabClassNames.tab}>
                                            <img
                                                draggable={false}
                                                src={pythonIcon()}
                                            />
                                            <FormattedMessage
                                                defaultMessage="Python"
                                                id="gui.gui.pythonTab"
                                            />
                                        </Tab>
                                        <Tab  className={tabClassNames.tab}>
                                            <img
                                                draggable={false}
                                                src={pipIcon()}
                                            />
                                            <FormattedMessage
                                                defaultMessage="Library Manager"
                                                id="gui.gui.installTab"
                                            />
                                        </Tab>
                                    </TabList>
                                    {/* Python 标签内容 编辑器 */}
                                    <TabPanel className={tabClassNames.tabPanel}>
                                        <PythonEditor 
                                            theme = { theme }
                                        />
                                    </TabPanel>
                                    <TabPanel className={tabClassNames.tabPanel}>
                                        <PythonInstall />
                                    </TabPanel>
                                </Tabs>
                            </Box>
                            
                        </Box>
                    )} 
                    {modeValue === 'interactive' && (  //互动窗口
                        <Box className={styles.flexWrapper}>
                            <Box className={styles.editorWrapper}>
                                <Tabs
                                    forceRenderTabPanel
                                    className={tabClassNames.tabs}
                                    selectedIndex={activeTabIndex}
                                    selectedTabClassName={tabClassNames.tabSelected}
                                    selectedTabPanelClassName={tabClassNames.tabPanelSelected}
                                    onSelect={onActivateTab}
                                >
                                    <TabList className={tabClassNames.tabList} style={{
                                        position: 'relative',
                                        zIndex: 100
                                    }}>
                                        <Tab className={tabClassNames.tab}>
                                            <img
                                                draggable={false}
                                                src={codeIcon()}
                                            />
                                            <FormattedMessage
                                                defaultMessage="Code"
                                                description="Button to get to the code panel"
                                                id="gui.gui.codeTab"
                                            />
                                        </Tab>
                                        <Tab
                                            className={tabClassNames.tab}
                                            onClick={onActivateCostumesTab}
                                        >
                                            <img
                                                draggable={false}
                                                src={costumesIcon()}
                                            />
                                            {targetIsStage ? (
                                                <FormattedMessage
                                                    defaultMessage="Backdrops"
                                                    description="Button to get to the backdrops panel"
                                                    id="gui.gui.backdropsTab"
                                                />
                                            ) : (
                                                <FormattedMessage
                                                    defaultMessage="Costumes"
                                                    description="Button to get to the costumes panel"
                                                    id="gui.gui.costumesTab"
                                                />
                                            )}
                                        </Tab>
                                        <Tab
                                            className={tabClassNames.tab}
                                            onClick={onActivateSoundsTab}
                                        >
                                            <img
                                                draggable={false}
                                                src={soundsIcon()}
                                            />
                                            <FormattedMessage
                                                defaultMessage="Sounds"
                                                description="Button to get to the sounds panel"
                                                id="gui.gui.soundsTab"
                                            />
                                        </Tab>
                                    </TabList>
                                    <TabPanel className={tabClassNames.tabPanel}>
                                        <Box className={styles.blocksWrapper}>
                                            <Blocks
                                                key={`${blocksId}/${theme.id}`}
                                                canUseCloud={canUseCloud}
                                                grow={1}
                                                isVisible={blocksTabVisible}
                                                options={{
                                                    media: `${basePath}static/${theme.getBlocksMediaFolder()}/`
                                                }}
                                                stageSize={stageSize}
                                                onOpenCustomExtensionModal={onOpenCustomExtensionModal}
                                                theme={theme}
                                                vm={vm}
                                                modeValue={"interactive"}
                                                extensionName={extensionName}
                                                isActive ={isSearchActive}
                                                setisSearchActive = {setisSearchActive}
                                            />
                                        </Box>
                                        <ToolboxSearchButton
                                            isActive ={isSearchActive}
                                            onClick={showSearchFlyoutDiv}
                                            handleInputChange = {handleInputChange}
                                        />
                
                                        <Box className={styles.extensionButtonContainer}>
                                            <button
                                                className={styles.extensionButton}
                                                title={intl.formatMessage(messages.addExtension)}
                                                onClick={(e) => { onExtensionButtonClick(e) }}
                                            >
                                                <img
                                                    className={styles.extensionButtonIcon}
                                                    draggable={false}
                                                    src={addExtensionIcon}
                                                />
                                            </button>
                                        </Box>
                                        <Box className={styles.watermark}>
                                            <Watermark />
                                        </Box>
                                    </TabPanel>
                                    <TabPanel className={tabClassNames.tabPanel}>
                                        {costumesTabVisible ? <CostumeTab
                                            vm={vm}
                                        /> : null}
                                    </TabPanel>
                                    <TabPanel className={tabClassNames.tabPanel}>
                                        {soundsTabVisible ? <SoundTab vm={vm} /> : null}
                                    </TabPanel>
                                </Tabs>
                                {/* {backpackVisible ? (
                                    <Backpack host={backpackHost} />
                                ) : null} */}
                            </Box>

                            {/* 机器学习窗口 */}
                            <TrainPage isTrain={isTrain}></TrainPage>
                            
                            <Box className={classNames(styles.stageAndTargetWrapper, styles[stageSize])}>
                                <StageWrapper
                                    isFullScreen={isFullScreen}
                                    isRendererSupported={isRendererSupported()}
                                    isRtl={isRtl}
                                    stageSize={stageSize}
                                    vm={vm}
                                />
                                <Box className={styles.targetWrapper}>
                                    <TargetPane
                                        stageSize={stageSize}
                                        vm={vm}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    )} 
                    {modeValue === 'upload' && (  //下载模式
                        <Box className={styles.flexWrapper}>
                            <Box className={styles.editorWrapper}>
                                <Tabs
                                    forceRenderTabPanel//强制渲染所有 TabPanel
                                    className={tabClassNames.tabs}
                                    selectedIndex={activeTabIndexUpload } // uploadTabIndex
                                    selectedTabClassName={tabClassNames.tabSelected}
                                    selectedTabPanelClassName={tabClassNames.tabPanelSelected}
                                    onSelect={onActivateTabUpload}//onUploadTab
                                >
                                    <TabList className={tabClassNames.tabList} style={{
                                        position: 'relative',
                                        zIndex: 100
                                    }}>
                                        <Tab className={tabClassNames.tab}>
                                            <img
                                                draggable={false}
                                                src={codeIcon()}
                                            />
                                            <FormattedMessage
                                                defaultMessage="Code"
                                                description=" "
                                                id="gui.gui.codeTab"
                                            />
                                        </Tab>
                                        {/* {extensionName === 'ESP32' && ( */}
                                            <Tab  className={tabClassNames.tab}>
                                                <img
                                                    draggable={false}
                                                    src={uiEditorIcon()}
                                                />
                                                <FormattedMessage
                                                    defaultMessage="UI Editor"
                                                    description=" "
                                                    id="gui.gui.uieditorTab"
                                                />
                                            </Tab>
                                        {/* )} */}
                                        {(extensionName === 'ESP32' || extensionName === 'Arduino') && (
                                            <Tab className={tabClassNames.tab} >
                                                <img
                                                    draggable={false}
                                                    src={iotIcon()}
                                                />
                                                <FormattedMessage
                                                    defaultMessage="IOT"
                                                    description=" "
                                                    id="gui.gui.iotTab"
                                                />
                                            </Tab>
                                        )}
                                        
                                    </TabList>

                                    {/* upload标签内容 编辑器 */}
                                    <TabPanel className={tabClassNames.tabPanel}>
                                        <Box className={classNames(styles.blocksWrapper) }>
                                            <Blocks
                                                key={`${blocksId}/${theme.id}/upload`}
                                                canUseCloud={canUseCloud}
                                                grow={1}
                                                isVisible={blocksTabUploadVisible}//blocksTabVisible
                                                options={{
                                                    media: `${basePath}static/${theme.getBlocksMediaFolder()}/`
                                                }}
                                                stageSize={stageSize}
                                                onOpenCustomExtensionModal={onOpenCustomExtensionModal}
                                                theme={theme}
                                                vm={vm}
                                                modeValue={"upload"}
                                                extensionName={extensionName}
                                                isActive = {isSearchActive}
                                                setisSearchActive = {setisSearchActive}
                                            />

                                            {/* <BlocksDownload
                                                key={`${blocksId}/${theme.id}`}
                                                canUseCloud={canUseCloud}
                                                grow={1}
                                                isVisible={blocksTabVisible}
                                                options={{
                                                    media: `${basePath}static/${theme.getBlocksMediaFolder()}/`
                                                }}
                                                stageSize={stageSize}
                                                onOpenCustomExtensionModal={onOpenCustomExtensionModal}
                                                theme={theme}
                                                 vm={downloadVM.getVM()}
                                            /> */}
                                            
                                        </Box>

                                        <ToolboxSearchButton
                                            isActive ={isSearchActive}
                                            onClick={showSearchFlyoutDiv}
                                            handleInputChange = {handleInputChange}
                                        />
                                        {/* 添加扩展 */}
                                        <Box className={styles.extensionButtonContainer}>
                                            <button
                                                className={styles.extensionButton}
                                                title={intl.formatMessage(messages.addExtension)}
                                                onClick={(e) => { onExtensionButtonClick(e); }}
                                            >
                                                <img
                                                    className={styles.extensionButtonIcon}
                                                    draggable={false}
                                                    src={addExtensionIcon}
                                                />
                                            </button>
                                        </Box>
                                    </TabPanel>
                                    {/* {extensionName === 'ESP32' && ( */}
                                        <TabPanel className={tabClassNames.tabPanel}>
                                            <div >UI</div>
                                        </TabPanel>
                                    {/* )} */}

                                    {(extensionName === 'ESP32' || extensionName === 'Arduino') && (
                                        <TabPanel className={tabClassNames.tabPanel}>
                                            <div >IOT</div>
                                        </TabPanel>
                                    )}
                                </Tabs>
                            </Box>
                            <Box className={classNames(styles.stageAndTargetWrapper, styles.uploadStageColumn, uploadLayout === 'full' && styles.fullWidth)}  >
                                
                                <UploadCodeToolbar device={extensionName} layout={uploadLayout} onChangeLayout={setUploadLayout} />
                                <CodeMirrorComponent code={pythonCode} theme = { theme }/>
                                {/* 监视器 */}
                                <TabSwitcher serialData={data} device={extensionName}/>
                            </Box>
                            {/* <StagePlaceholder
                                    stageSize = {stageSize}
                                    vm = {vm}
                                    isRendererSupported = {isRendererSupported}
                                /> */}
                        </Box>
                    )} 

                    <LoadingOverlay isLoading={isLoading} />
                    <BurnLogs isLoading={isFlashing} logs={logs}></BurnLogs>

                    {/* 示例程序弹窗 */}
                    <ExampleModal
                        open={open}
                        onClose={() => setOpen(false)}
                        onSelect={handleSelect}
                        modeValue={modeValue} 
                        extensionName={extensionName}
                    />

                    {/* 主控选择弹窗 */}
                    {props.masterModalVisible && (
                        <MasterModal onRequestClose={props.onCloseMasterModal} setIsLoading={setIsLoading} />
                    )}
                    
                    {/* 连接窗口 */}
                    {props.connectModalVisible && (
                        <ConnectTabs onRequestClose={props.onCloseConnectModal} modeValue={modeValue} extensionName={extensionName}/>
                    )}

                    {/* 固件烧录窗口 */}
                    {props.firmwareModalVisible && (
                        <FirmwareModal onRequestClose={props.onCloseFirmwareModal} modeValue={modeValue} extensionName={extensionName}/>
                    )}

                </Box>
                <DragLayer />
            </Box>
        );
    }}</MediaQuery>);
};

GUIComponent.propTypes = {
    accountNavOpen: PropTypes.bool,
    activeTabIndex: PropTypes.number,
    activeTabIndexUpload: PropTypes.number,
    activeTabIndexPython: PropTypes.number,
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    authorThumbnailUrl: PropTypes.string,
    authorUsername: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    backdropLibraryVisible: PropTypes.bool,
    backpackHost: PropTypes.string,
    backpackVisible: PropTypes.bool,
    basePath: PropTypes.string,
    blocksTabVisible: PropTypes.bool,
    blocksTabUploadVisible: PropTypes.bool,
    blocksId: PropTypes.string,
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canRemix: PropTypes.bool,
    canSave: PropTypes.bool,
    canShare: PropTypes.bool,
    canUseCloud: PropTypes.bool,
    cardsVisible: PropTypes.bool,
    children: PropTypes.node,
    costumeLibraryVisible: PropTypes.bool,
    costumesTabVisible: PropTypes.bool,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
    }),
    enableCommunity: PropTypes.bool,
    intl: intlShape.isRequired,
    isCreating: PropTypes.bool,
    isEmbedded: PropTypes.bool,
    isFullScreen: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    isShared: PropTypes.bool,
    isWindowFullScreen: PropTypes.bool,
    isTotallyNormal: PropTypes.bool,
    loading: PropTypes.bool,
    logo: PropTypes.string,
    onActivateCostumesTab: PropTypes.func,
    onActivateSoundsTab: PropTypes.func,
    onActivateTab: PropTypes.func,
    onActivateTabUpload: PropTypes.func,
    onActivateTabPython: PropTypes.func,
    onClickAccountNav: PropTypes.func,
    onClickAddonSettings: PropTypes.func,
    onClickConnect:PropTypes.func,
    onClickFirmware:PropTypes.func,
    onClickDesktopSettings: PropTypes.func,
    clickSerialConnect: PropTypes.func,
    download:PropTypes.func,
    SerialDownload:PropTypes.func,
    saveCode:PropTypes.func,
    loadCode:PropTypes.func,
    cancelload:PropTypes.func,
    clickBleConnect: PropTypes.func,
    clickDownloadCode: PropTypes.func,
    clickEspSend: PropTypes.func,
    clickSendWifi: PropTypes.func,
    onClickNewWindow: PropTypes.func,
    onClickPackager: PropTypes.func,
    onClickLogo: PropTypes.func,
    onCloseAccountNav: PropTypes.func,
    onExtensionButtonClick: PropTypes.func,
    onOpenCustomExtensionModal: PropTypes.func,
    onLogOut: PropTypes.func,
    onOpenRegistration: PropTypes.func,
    onRequestCloseBackdropLibrary: PropTypes.func,
    onRequestCloseCostumeLibrary: PropTypes.func,
    onRequestCloseTelemetryModal: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onShare: PropTypes.func,
    onShowPrivacyPolicy: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    onTabSelect: PropTypes.func,
    onTelemetryModalCancel: PropTypes.func,
    onTelemetryModalOptIn: PropTypes.func,
    onTelemetryModalOptOut: PropTypes.func,
    onToggleLoginOpen: PropTypes.func,
    renderLogin: PropTypes.func,
    securityManager: PropTypes.shape({}),
    showComingSoon: PropTypes.bool,
    showOpenFilePicker: PropTypes.func,
    showSaveFilePicker: PropTypes.func,
    soundsTabVisible: PropTypes.bool,
    stageSizeMode: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    targetIsStage: PropTypes.bool,
    telemetryModalVisible: PropTypes.bool,
    theme: PropTypes.instanceOf(Theme),
    tipsLibraryVisible: PropTypes.bool,
    usernameModalVisible: PropTypes.bool,
    settingsModalVisible: PropTypes.bool,
    customExtensionModalVisible: PropTypes.bool,
    fontsModalVisible: PropTypes.bool,
    unknownPlatformModalVisible: PropTypes.bool,
    invalidProjectModalVisible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    //downloadVM: PropTypes.instanceOf(VM).isRequired, 
};

GUIComponent.defaultProps = {
    backpackHost: null,
    backpackVisible: false,
    basePath: './',
    blocksId: 'original',
    canChangeLanguage: true,
    canChangeTheme: true,
    canCreateNew: false,
    canEditTitle: false,
    canManageFiles: true,
    canRemix: false,
    canSave: false,
    canCreateCopy: false,
    canShare: false,
    canUseCloud: false,
    enableCommunity: false,
    isCreating: false,
    isShared: false,
    isTotallyNormal: false,
    loading: false,
    showComingSoon: false,
    stageSizeMode: STAGE_SIZE_MODES.large,
};

const mapStateToProps = state => ({
    customStageSize: state.scratchGui.customStageSize,
    isWindowFullScreen: state.scratchGui.tw.isWindowFullScreen,
    blocksId: state.scratchGui.timeTravel.year.toString(),
    stageSizeMode: state.scratchGui.stageSize.stageSize,
    theme: state.scratchGui.theme.theme,
    selectedDevice: state.scratchGui.sun.selectedDevice,//统一管理的设备
    selectedmode: state.scratchGui.sun.selectedmode///统一管理的模式
});

export default injectIntl(connect(
    mapStateToProps
)(GUIComponent));