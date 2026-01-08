import React from 'react';
import StageWrapperComponent from '../../components/stage-wrapper/stage-wrapper.jsx';
import PropTypes from 'prop-types';
import VM from 'scratch-vm';
import { STAGE_DISPLAY_SIZES } from '../../lib/layout-constants.js';

const StagePlaceholder = (props) => {
    const { stageSize, vm, isRendererSupported } = props;

    return (
        <div
            style={{
                flex: 1,
                height: '0px', 
                maxHeight:'1px',
                opacity: 0,         
                pointerEvents: 'none', 
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <StageWrapperComponent
                isFullScreen={false}
                isRendererSupported={isRendererSupported}
                isRtl={false}
                stageSize={stageSize}
                vm={vm}
            />
        </div>
    );
};

StagePlaceholder.propTypes = {
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired,
    vm: PropTypes.instanceOf(VM).isRequired,
    isRendererSupported: PropTypes.bool.isRequired
};

export default StagePlaceholder;
