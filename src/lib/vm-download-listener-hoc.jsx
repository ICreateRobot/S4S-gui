/* 下载模式专用 VM Listener HOC */

import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';

import {updateMonitors} from '../reducers/monitors';
import {updateTargets} from '../reducers/targets';
import {updateBlockDrag} from '../reducers/block-drag';

import {
    setFramerateState,
    setCompilerOptionsState,
    addCompileError,
    clearCompileErrors,
    setRuntimeOptionsState,
    setInterpolationState
} from '../reducers/tw';

import {setCustomStageSize} from '../reducers/custom-stage-size';

class VMDownloadListener extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleTargetsUpdate',
            'handleCompileError'
        ]);

        // 绑定 DOWNLOAD VM 的事件
        this.props.vm.on('targetsUpdate', this.handleTargetsUpdate);
        this.props.vm.on('MONITORS_UPDATE', this.props.onMonitorsUpdate);
        this.props.vm.on('BLOCK_DRAG_UPDATE', this.props.onBlockDragUpdate);

        this.props.vm.on('FRAMERATE_CHANGED', this.props.onFramerateChanged);
        this.props.vm.on('INTERPOLATION_CHANGED', this.props.onInterpolationChanged);
        this.props.vm.on('COMPILER_OPTIONS_CHANGED', this.props.onCompilerOptionsChanged);
        this.props.vm.on('RUNTIME_OPTIONS_CHANGED', this.props.onRuntimeOptionsChanged);
        this.props.vm.on('STAGE_SIZE_CHANGED', this.props.onStageSizeChanged);

        this.props.vm.on('COMPILE_ERROR', this.handleCompileError);
        this.props.vm.on('RUNTIME_STARTED', this.props.onClearCompileErrors);
    }

    componentWillUnmount () {
        // 移除所有事件
        this.props.vm.off('targetsUpdate', this.handleTargetsUpdate);
        this.props.vm.off('MONITORS_UPDATE', this.props.onMonitorsUpdate);
        this.props.vm.off('BLOCK_DRAG_UPDATE', this.props.onBlockDragUpdate);

        this.props.vm.off('FRAMERATE_CHANGED', this.props.onFramerateChanged);
        this.props.vm.off('INTERPOLATION_CHANGED', this.props.onInterpolationChanged);
        this.props.vm.off('COMPILER_OPTIONS_CHANGED', this.props.onCompilerOptionsChanged);
        this.props.vm.off('RUNTIME_OPTIONS_CHANGED', this.props.onRuntimeOptionsChanged);
        this.props.vm.off('STAGE_SIZE_CHANGED', this.props.onStageSizeChanged);

        this.props.vm.off('COMPILE_ERROR', this.handleCompileError);
        this.props.vm.off('RUNTIME_STARTED', this.props.onClearCompileErrors);
    }

    handleTargetsUpdate (data) {
        // 下载模式下也需要刷新 preview 区
        this.props.onTargetsUpdate(data);
    }

    handleCompileError (target, error) {
        const errorMessage = `${error}`;
        this.props.onCompileError({
            sprite: target.getName(),
            error: errorMessage,
            id: Date.now()
        });
    }

    render () {
        const {vm, ...props} = this.props;
        return <this.props.WrappedComponent {...props} />;
    }
}

VMDownloadListener.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapDispatchToProps = dispatch => ({
    onTargetsUpdate: data => {
        dispatch(updateTargets(data.targetList, data.editingTarget));
    },
    onMonitorsUpdate: monitors => {
        dispatch(updateMonitors(monitors));
    },
    onBlockDragUpdate: dragging => {
        dispatch(updateBlockDrag(dragging));
    },
    onFramerateChanged: framerate => dispatch(setFramerateState(framerate)),
    onInterpolationChanged: interpolation => dispatch(setInterpolationState(interpolation)),
    onCompilerOptionsChanged: opts => dispatch(setCompilerOptionsState(opts)),
    onRuntimeOptionsChanged: opts => dispatch(setRuntimeOptionsState(opts)),
    onStageSizeChanged: (w, h) => dispatch(setCustomStageSize(w, h)),
    onCompileError: err => dispatch(addCompileError(err)),
    onClearCompileErrors: () => dispatch(clearCompileErrors())
});

export default function wrapDownloadVMListener (WrappedComponent) {
    const Connected = connect(null, mapDispatchToProps)(VMDownloadListener);
    return props => <Connected WrappedComponent={WrappedComponent} {...props} />;
}
