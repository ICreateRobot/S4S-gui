import React from 'react';
import GUI from '../containers/gui.jsx';

const searchParams = new URLSearchParams(location.search);
const cloudHost = searchParams.get('cloud_host') || 'wss://clouddata.turbowarp.org';

const RenderGUI = props => (
    <GUI
        cloudHost={cloudHost}//云服务的主机地址。
        canUseCloud//是否允许使用云服务。
        hasCloudPermission//是否有使用云服务的权限
        canSave={false}//是否允许保存数据
        basePath={process.env.ROOT}//用于构建资源路径的根路径
        canEditTitle//是否可以编辑标题
        enableCommunity//是否启用社区功能 
        {...props}
    />
);

export default RenderGUI;
