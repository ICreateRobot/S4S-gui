import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import log from '../lib/log';

// 扩展不再使用原本的-直接新建了一个指定扩展项
// import extensionLibraryContent, {
//     galleryError,
//     galleryLoading,
//     galleryMore
// } from '../lib/libraries/extensions/index.jsx';
import extensionLibraryContent,{aiExtension,scratchExtension} from '../lib/libraries/extensions/index_S4S.jsx';


import extensionTags from '../lib/libraries/tw-extension-tags';

import LibraryComponent from '../components/library/library.jsx';
import extensionIcon from '../components/action-menu/icon--sprite.svg';

const messages = defineMessages({
    extensionTitle: {
        defaultMessage: 'Choose an Extension',
        description: 'Heading for the extension library',
        id: 'gui.extensionLibrary.chooseAnExtension'
    }
});

const LINKBOT_EXTENSIONS = [
    'LinkBot',                // 主扩展
    'LinkBotActuators',
    'LinkBotSensors',
    'LinkBotPower',
];


const toLibraryItem = extension => {
    if (typeof extension === 'object') {
        return ({
            rawURL: extension.iconURL || extensionIcon,
            ...extension
        });
    }
    return extension;
};

// 不再在线读取了
// const translateGalleryItem = (extension, locale) => ({
//     ...extension,
//     name: extension.nameTranslations[locale] || extension.name,
//     description: extension.descriptionTranslations[locale] || extension.description
// });

// let cachedGallery = null;

// const fetchLibrary = async () => {
//     const res = await fetch('https://extensions.turbowarp.org/generated-metadata/extensions-v0.json');
//     if (!res.ok) {
//         throw new Error(`HTTP status ${res.status}`);
//     }
//     const data = await res.json();
//     return data.extensions.map(extension => ({
//         name: extension.name,
//         nameTranslations: extension.nameTranslations || {},
//         description: extension.description,
//         descriptionTranslations: extension.descriptionTranslations || {},
//         extensionId: extension.id,
//         extensionURL: `https://extensions.turbowarp.org/${extension.slug}.js`,
//         iconURL: `https://extensions.turbowarp.org/${extension.image || 'images/unknown.svg'}`,
//         tags: ['tw'],
//         credits: [
//             ...(extension.original || []),
//             ...(extension.by || [])
//         ].map(credit => {
//             if (credit.link) {
//                 return (
//                     <a
//                         href={credit.link}
//                         target="_blank"
//                         rel="noreferrer"
//                         key={credit.name}
//                     >
//                         {credit.name}
//                     </a>
//                 );
//             }
//             return credit.name;
//         }),
//         docsURI: extension.docs ? `https://extensions.turbowarp.org/${extension.slug}` : null,
//         samples: extension.samples ? extension.samples.map(sample => ({
//             href: `${process.env.ROOT}editor?project_url=https://extensions.turbowarp.org/samples/${encodeURIComponent(sample)}.sb3`,
//             text: sample
//         })) : null,
//         incompatibleWithScratch: !extension.scratchCompatible,
//         featured: true
//     }));
// };

class ExtensionLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect',
            'removeExtension'
        ]);
        this.state = {
            // gallery: cachedGallery,
            // galleryError: null,
            // galleryTimedOut: false
            canDisplay: false // 只保留显示控制
        };
    }

    componentDidMount () {
        this.loadedExts = Array.from(window.vm.extensionManager._loadedExtensions.keys()); //获取当前扩展列表

        if (!this.state.gallery) {
            const timeout = setTimeout(() => {
                this.setState({
                    //galleryTimedOut: true,
                    canDisplay: true
                });
            }, 100);

            // fetchLibrary()
            //     .then(gallery => {
            //         cachedGallery = gallery;
            //         this.setState({
            //             gallery
            //         });
            //         clearTimeout(timeout);
            //     })
            //     .catch(error => {
            //         log.error(error);
            //         this.setState({
            //             galleryError: error
            //         });
            //         clearTimeout(timeout);
            //     });
        }
    }
    handleItemSelect (item) {
        if (item.href) {
            return;
        }

        const extensionId = item.extensionId;//获取扩展ID

        if (extensionId === 'custom_extension') {
            this.props.onOpenCustomExtensionModal();
            return;
        }

        if (extensionId === 'procedures_enable_return') {
            this.props.onEnableProcedureReturns();
            this.props.onCategorySelected('myBlocks');
            return;
        }

        const extensionManager = this.props.vm.extensionManager;
        //LinkBot单独的逻辑
        if (extensionId === 'LinkBot') {
            const loadTasks = LINKBOT_EXTENSIONS .filter(id => !extensionManager.isExtensionLoaded(id))
                .map(id => extensionManager.loadExtensionURL(id));

            Promise.all(loadTasks).then(() => {
                this.props.onCategorySelected('LinkBot');
            }).catch(err => {
                log.error(err);
                alert(err);
            });

            return;
        }

        const url = item.extensionURL ? item.extensionURL : extensionId;
        if (!item.disabled) {//检查是否已加载
            if (extensionManager.isExtensionLoaded(extensionId)) {
                this.props.onCategorySelected(extensionId);//直接切换到该扩展对应的积木分类
            } else {// 加载新扩展
                extensionManager.loadExtensionURL(url)
                    .then(() => {
                        this.props.onCategorySelected(extensionId);
                    })
                    .catch(err => {
                        log.error(err);
                        // eslint-disable-next-line no-alert
                        alert(err);
                    });
            }
        }
    }

    // 移除扩展（逻辑与gui中批量移除一致，但未来需要升级为直接移除，不再取巧）（已经更新写法，但是依然不妙，旧版本不要去除）
    async removeExtension(id){
        // const keepExts = this.loadedExts.filter(extId => extId !== id);
    
        // // 清空所有扩展
        // this.props.vm.runtime._blockInfo = [];
        // await this.props.vm.extensionManager._loadedExtensions.clear();
    
        // // 重新加载保留的扩展
        // for (const kid of keepExts) {
        //     try {
        //         await this.props.vm.extensionManager.loadExtensionIdSync(kid);
        //     } catch (e) {
        //         console.warn('扩展重新加载失败：', kid, e);
        //     }
        // }

        this.props.vm.runtime._blockInfo = this.props.vm.runtime._blockInfo.filter(block => block.id !== id);
        this.props.vm.extensionManager._loadedExtensions.delete(id);

        window.vm.emit('workspaceUpdate');//直接通知刷新
    }

    render () {
        let library = null;
        //if (this.state.gallery || this.state.galleryError || this.state.galleryTimedOut) {
        if (this.state.canDisplay) {
            // 使用本地通用扩展库
            library = extensionLibraryContent.map(toLibraryItem);
            library.push('---');
            library.push(...aiExtension.map(toLibraryItem));
            library.push('---');
            library.push(...scratchExtension.map(toLibraryItem));
            // console.log(library)

            // 根据异步加载状态添加不同内容(z暂时不再使用)
            // if (this.state.gallery) {
            //     library.push(toLibraryItem(galleryMore));
            //     const locale = this.props.intl.locale;
            //     library.push(
            //         ...this.state.gallery
            //             .map(i => translateGalleryItem(i, locale))
            //             .map(toLibraryItem)
            //     );
            // } else if (this.state.galleryError) {// 加载失败：显示错误项
            //     library.push(toLibraryItem(galleryError));
            // } else {// 加载中：显示加载项
            //     library.push(toLibraryItem(galleryLoading));
            // }
        }

        return (
            <LibraryComponent
                data={library}
                filterable
                persistableKey="extensionId"
                id="extensionLibrary"
                tags={extensionTags}
                title={this.props.intl.formatMessage(messages.extensionTitle)}
                visible={this.props.visible}
                onItemSelected={this.handleItemSelect}
                onRequestClose={this.props.onRequestClose}
                extensionName ={this.props.extensionName}
                modeValue = {this.props.modeValue}
                removeExtension = {this.removeExtension}
                loadedExts={this.loadedExts}//传入已经加载的扩展列表
            />
        );
    }
}

ExtensionLibrary.propTypes = {
    intl: intlShape.isRequired,
    onCategorySelected: PropTypes.func,
    onEnableProcedureReturns: PropTypes.func,
    onOpenCustomExtensionModal: PropTypes.func,
    onRequestClose: PropTypes.func,
    visible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired, // eslint-disable-line react/no-unused-prop-types
    extensionName : PropTypes.string,
    modeValue : PropTypes.string
};

export default injectIntl(ExtensionLibrary);
