import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import VM from 'scratch-vm';
import storage from './storage';
import { getIsLoadingWithId } from '../reducers/project-state';
import { setProjectUnchanged } from '../reducers/project-changed';

/**
 * VM Mode Manager HOC
 * 支持：
 * - download模式：轻量VM，仅可加载扩展和保存项目
 * - interactive模式：完整VM，支持渲染、事件监听
 */
const vmModeManagerHOC = (WrappedComponent) => {
    class VMModeManager extends React.Component {
        constructor(props) {
            super(props);
            bindAll(this, [
                'switchMode',
                'loadProject',
                'addExtensions',
                'saveProject'
            ]);

            this.currentVM = null; // 当前模式的 VM
            this.extensionSelect = {}; // 已加载扩展记录
        }

        componentDidMount() {
            // 初始化默认模式
            this.switchMode(this.props.mode);
        }

        componentDidUpdate(prevProps) {
            if (prevProps.mode !== this.props.mode) {
                this.switchMode(this.props.mode);
            }

            // 当项目需要加载时
            if (this.props.isLoadingWithId && this.currentVM &&
                this.props.fontsLoaded &&
                (!prevProps.isLoadingWithId || !prevProps.fontsLoaded)) {
                this.loadProject(this.props.projectData);
            }
        }

        switchMode(mode) {
            // 销毁旧 VM
            if (this.currentVM) {
                this.currentVM.quit();
                this.currentVM = null;
            }

            // 创建新 VM
            const vm = new VM();
            if (mode === 'download') {
                vm.attachStorage(storage);
                vm.initialized = true;
                vm.setLocale(this.props.locale, this.props.messages);
            } else {
                // 互动模式，可 attach AudioEngine 或渲染
                if (!vm.initialized) {
                    if (this.props.audioEngine) vm.attachAudioEngine(this.props.audioEngine);
                    vm.initialized = true;
                    vm.setLocale(this.props.locale, this.props.messages);
                    vm.start();
                }
            }

            this.currentVM = vm;
        }

        async addExtensions(devices) {
            if (!this.currentVM) return;
            const Exts = this.props.categoryMap[devices] || [];

            if (this.extensionSelect[devices]) {
                console.log('非首次加载扩展');
                return;
            }

            console.log('首次加载扩展');
            for (const id of Exts) {
                try {
                    if (!this.currentVM.extensionManager.isExtensionLoaded(id)) {
                        await this.currentVM.extensionManager.loadExtensionIdSync(id);
                    }
                } catch (e) {
                    console.warn('扩展加载失败：', id, e);
                }
            }
            this.extensionSelect[devices] = true;
        }

        async loadProject(projectData) {
            if (!this.currentVM) return;
            try {
                await this.currentVM.loadProject(projectData);
                // 设置为未修改状态
                this.props.onSetProjectUnchanged();
            } catch (e) {
                console.error('项目加载失败', e);
            }
        }

        async saveProject() {
            if (!this.currentVM) return null;
            try {
                const projectData = await this.currentVM.saveProjectSb3();
                return projectData;
            } catch (e) {
                console.error('保存项目失败', e);
                return null;
            }
        }

        render() {
            return (
                <WrappedComponent
                    currentVM={this.currentVM}
                    addExtensions={this.addExtensions}
                    saveProject={this.saveProject}
                    loadProject={this.loadProject}
                    {...this.props}
                />
            );
        }
    }

    VMModeManager.propTypes = {
        mode: PropTypes.oneOf(['download', 'interactive']).isRequired,
        fontsLoaded: PropTypes.bool,
        locale: PropTypes.string,
        messages: PropTypes.objectOf(PropTypes.string),
        categoryMap: PropTypes.object.isRequired, // { deviceName: [extensionIds] }
        onSetProjectUnchanged: PropTypes.func.isRequired,
        audioEngine: PropTypes.object // 可选，用于 interactive 模式
    };

    const mapStateToProps = (state) => ({
        fontsLoaded: state.scratchGui.fontsLoaded,
        locale: state.locales.locale,
        messages: state.locales.messages
    });

    const mapDispatchToProps = (dispatch) => ({
        onSetProjectUnchanged: () => dispatch(setProjectUnchanged())
    });

    return connect(mapStateToProps, mapDispatchToProps)(VMModeManager);
};

export default vmModeManagerHOC;
