import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import storage from './storage';

import {getIsLoadingWithId} from '../reducers/project-state';

/**
 * 下载模式 VM 管理器
 * 与 vmManagerHOC 完全独立，不会启动 VM，也不会处理事件
 */
const vmDownloadManagerHOC = function (WrappedComponent) {
    class VMDownloadManager extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'loadDownloadProject'
            ]);
        }

        componentDidMount () {
            const vm = this.props.downloadVM;

            if (!vm.initialized) {
                // 初始化下载模式 VM
                vm.attachStorage(storage);
                vm.initialized = true;
                vm.setLocale(this.props.locale, this.props.messages);
            }

            // 不启动 VM！！下载模式不需要执行脚本
            // 不 attachAudioEngine
        }

        componentDidUpdate (prevProps) {
            // 在需要加载项目时执行
            if (this.props.isLoadingWithId &&
                this.props.fontsLoaded &&
                (!prevProps.isLoadingWithId || !prevProps.fontsLoaded)) {

                this.loadDownloadProject();
            }
        }

        loadDownloadProject () {
            const vm = this.props.downloadVM;

            return vm.loadProject(this.props.projectData)
                .catch(err => {
                    console.error('load download project error', err);
                });
        }

        render () {
            const {
                downloadVM,
                isLoadingWithId,
                ...componentProps
            } = this.props;

            return (
                <WrappedComponent
                    downloadVM={downloadVM}
                    isLoading={isLoadingWithId}
                    {...componentProps}
                />
            );
        }
    }

    VMDownloadManager.propTypes = {
        downloadVM: PropTypes.instanceOf(VM),
        fontsLoaded: PropTypes.bool,
        isLoadingWithId: PropTypes.bool,
        locale: PropTypes.string,
        messages: PropTypes.objectOf(PropTypes.string),
        projectData: PropTypes.oneOfType([PropTypes.object, PropTypes.string])
    };

    const mapStateToProps = state => {
        const loadingState = state.scratchGui.projectState.loadingState;

        return {
            downloadVM: state.scratchGui.vmDownload,
            fontsLoaded: state.scratchGui.fontsLoaded,
            isLoadingWithId: getIsLoadingWithId(loadingState),
            locale: state.locales.locale,
            messages: state.locales.messages,
            projectData: state.scratchGui.projectState.projectData
        };
    };

    return connect(
        mapStateToProps,
        null
    )(VMDownloadManager);
};

export default vmDownloadManagerHOC;
