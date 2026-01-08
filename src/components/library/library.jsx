import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import LibraryItem from '../../containers/library-item.jsx';
import Modal from '../../containers/modal.jsx';
import Divider from '../divider/divider.jsx';
import Filter from '../filter/filter.jsx';
import TagButton from '../../containers/tag-button.jsx';
import Spinner from '../spinner/spinner.jsx';
import Separator from '../tw-extension-separator/separator.jsx';
import RemovedTrademarks from '../tw-removed-trademarks/removed-trademarks.jsx';
import {APP_NAME} from '../../lib/brand.js';
import styles from './library.css';

import { createLibraryLogic } from './hook/library-logic.js';
const messages = defineMessages({
    filterPlaceholder: {
        id: 'gui.library.filterPlaceholder',
        defaultMessage: 'Search',
        description: 'Placeholder text for library search field'
    },
    allTag: {
        id: 'gui.library.allTag',
        defaultMessage: 'All',
        description: 'Label for library tag to revert to all items after filtering by tag.'
    },
    mainCon: {
        id: 'gui.library.mainCon',
        defaultMessage: 'ICreateCode',
        description: 'Label for library tag to revert to all items after filtering by tag.'
    }
});

// 配置过滤标签
const ALL_TAG = {tag: 'all', intlLabel: messages.allTag};
const MAIN_TAG={tag: 'main', intlLabel: messages.mainCon};
const AI_TAG={tag: 'AI', intlLabel: "AI"};
const scratch_TAG={tag: 'scratch', intlLabel: "scratch"};
const tagListPrefix = [ALL_TAG,AI_TAG,scratch_TAG];

class LibraryComponent extends React.Component {
    constructor (props) {
        super(props);
        this.logic = createLibraryLogic(this);
        console.log('==============================')
        console.log(this.props.extensionName,this.props.modeValue)//拿到了设备与模式，看后续怎么用
        

        //this.handleSelect = (id) => this.logic.handleSelect(this.getFilteredData(), id);
        this.handleTest = this.logic.handleTest;
        this.handleOnline = this.logic.handleOnline;
        this.sendMove =(dir,speed)=>this.logic.sendMove(dir,speed);
        this.sort=(key)=>this.logic.sort(key)
        this.getHiddenData = this.logic.getHiddenData
        // this.getFilteredData = this.logic.getFilteredData


        this.channelLoadExtension = this.logic.channelLoadExtension;
        this.channelClose = this.logic.channelClose;
        this.channelMasterClose=this.logic.channelMasterClose

        bindAll(this, [
            'handleClose',
            'handleFilterChange',
            'handleFilterClear',
            'handleMouseEnter',
            'handleMouseLeave',
            'handlePlayingEnd',
            'handleSelect',
            'handleFavorite',
            'handleTagClick',
            'setFilteredDataRef',
            'handleTest',
            'handleOnline',
            'sendMove',
            'sort'
        ]);

        //管理收藏
        const favorites = this.readFavoritesFromStorage();
        this.state = {
            playingItem: null,
            filterQuery: '',
            selectedTag: ALL_TAG.tag,
            canDisplay: false,
            favorites,
            initialFavorites: favorites
        };
    }
    
    
    componentDidMount () {
        // Rendering all the items in the library can take a bit, so we'll always
        // show one frame with a loading spinner.
        setTimeout(() => {
            this.setState({
                canDisplay: true
            });
        });
        this.logic.initExtensionLoader(this.getFilteredData.bind(this), this.getHiddenData.bind(this));
        
        if (this.props.setStopHandler) this.props.setStopHandler(this.handlePlayingEnd);
    }

    componentDidUpdate (prevProps, prevState) {
        if (prevState.filterQuery !== this.state.filterQuery ||
            prevState.selectedTag !== this.state.selectedTag) {
            this.scrollToTop();
        }

        if (this.state.favorites !== prevState.favorites) {
            try {
                localStorage.setItem(this.getFavoriteStorageKey(), JSON.stringify(this.state.favorites));
            } catch (error) {
                // ignore
            }
        }
    }
    handleSelect (id) {//选择扩展
        this.handleClose();
        this.props.onItemSelected(this.getFilteredData()[id]);
    }
    readFavoritesFromStorage () {
        let data;
        try {
            data = JSON.parse(localStorage.getItem(this.getFavoriteStorageKey()));
        } catch (error) {
            // ignore
        }
        if (!Array.isArray(data)) {
            data = [];
        }
        return data;
    }
    getFavoriteStorageKey () {
        return `tw:library-favorites:${this.props.id}`;
    }
    handleFavorite (id) {
        const data = this.getFilteredData()[id];
        const key = data[this.props.persistableKey];
        this.setState(oldState => ({
            favorites: oldState.favorites.includes(key) ? (
                oldState.favorites.filter(i => i !== key)
            ) : (
                [...oldState.favorites, key]
            )
        }));
    }
    handleClose () {
        this.props.onRequestClose();
    }
    handleTagClick (tag) {
        if (this.state.playingItem === null) {
            this.setState({
                filterQuery: '',
                selectedTag: tag.toLowerCase()
            });
        } else {
            this.props.onItemMouseLeave(this.getFilteredData()[[this.state.playingItem]]);
            this.setState({
                filterQuery: '',
                playingItem: null,
                selectedTag: tag.toLowerCase()
            });
        }
    }
    handleMouseEnter (id) {
        // don't restart if mouse over already playing item
        if (this.props.onItemMouseEnter && this.state.playingItem !== id) {
            this.props.onItemMouseEnter(this.getFilteredData()[id]);
            this.setState({
                playingItem: id
            });
        }
    }
    handleMouseLeave (id) {
        if (this.props.onItemMouseLeave) {
            this.props.onItemMouseLeave(this.getFilteredData()[id]);
            this.setState({
                playingItem: null
            });
        }
    }
    handlePlayingEnd () {
        if (this.state.playingItem !== null) {
            this.setState({
                playingItem: null
            });
        }
    }
    handleFilterChange (event) {
        if (this.state.playingItem === null) {
            this.setState({
                filterQuery: event.target.value,
                selectedTag: ALL_TAG.tag
            });
        } else {
            this.props.onItemMouseLeave(this.getFilteredData()[[this.state.playingItem]]);
            this.setState({
                filterQuery: event.target.value,
                playingItem: null,
                selectedTag: ALL_TAG.tag
            });
        }
    }
    handleFilterClear () {
        this.setState({filterQuery: ''});
    }
    //过滤扩展
    getFilteredData () {
        // When no filtering, favorites get their own section
        //无过滤条件（显示收藏+全部）
        if (this.state.selectedTag === 'all' && !this.state.filterQuery) {
            //选出收藏的扩展
            const favoriteItems = this.props.data
                .filter(dataItem => (
                    this.state.initialFavorites.includes(dataItem[this.props.persistableKey])
                ))
                .map(dataItem => ({
                    ...dataItem,
                    key: `favorite-${dataItem[this.props.persistableKey]}`
                }));

            if (favoriteItems.length) {//如果有收藏项，添加分隔符
                favoriteItems.push('---');
            }

            let result = [...favoriteItems, ...this.props.data];

            result = this.getFilteredData_modeValue(result);
            return result;
        }

        /* 有过滤条件 */
        // When filtering, favorites are just listed first, not in a separate section.
        const favoriteItems = [];
        const nonFavoriteItems = [];
        for (const dataItem of this.props.data) {
            if (dataItem === '---') {// 忽略分隔线
                // ignore
            } else if (this.state.initialFavorites.includes(dataItem[this.props.persistableKey])) {
                favoriteItems.push(dataItem);// 收藏项
            } else {
                nonFavoriteItems.push(dataItem);// 普通项
            }
        }

        let filteredItems = favoriteItems.concat(nonFavoriteItems);//收藏项置顶

        //标签过滤
        if (this.state.selectedTag !== 'all') {
            filteredItems = filteredItems.filter(dataItem => (
                dataItem.tags &&
                dataItem.tags.map(i => i.toLowerCase()).includes(this.state.selectedTag)
            ));
        }

        //搜索词过滤
        if (this.state.filterQuery) {
            filteredItems = filteredItems.filter(dataItem => {
                const search = [...dataItem.tags];
                if (dataItem.name) {
                    // Use the name if it is a string, else use formatMessage to get the translated name
                    if (typeof dataItem.name === 'string') {
                        search.push(dataItem.name);
                    } else {
                        search.push(this.props.intl.formatMessage(dataItem.name.props, {
                            APP_NAME
                        }));
                    }
                }
                if (dataItem.description) {
                    search.push(dataItem.description);
                }
                return search
                    .join('\n')
                    .toLowerCase()
                    .includes(this.state.filterQuery.toLowerCase());
            });
        }

        filteredItems = this.getFilteredData_modeValue(filteredItems)

        //设备筛选：只显示包含设备名称标签的扩展(这样不行，后面应该改成只修改收藏与硬件相关的部分)
        // if (this.props.extensionName) {
        //     finalResult = finalResult.filter(dataItem => 
        //         dataItem && dataItem.tags && 
        //         dataItem.tags.map(tag => tag.toLowerCase())
        //             .includes(this.props.extensionName.toLowerCase())
        //     );
        // }

        return filteredItems;
    }

    // 根据模式筛选扩展
    getFilteredData_modeValue(filteredItems){
        if (this.props.modeValue === 'upload') {
            filteredItems = filteredItems.filter(dataItem => 
                dataItem && dataItem.tags && 
                dataItem.tags.map(tag => tag.toLowerCase())
                    .includes('upload')
            );
        }
        return filteredItems;
    }
    scrollToTop () {
        this.filteredDataRef.scrollTop = 0;
    }
    setFilteredDataRef (ref) {
        this.filteredDataRef = ref;
    }
    
    render () {
        const filteredData = this.state.canDisplay && this.props.data && this.getFilteredData();
        return (
            <Modal
                fullScreen
                contentLabel={this.props.title}
                id={this.props.id}
                onRequestClose={this.handleClose}
            >
                {(this.props.filterable || this.props.tags) && (
                    <div className={styles.filterBar}>
                        {this.props.filterable && (
                            // 搜索过滤器
                            <Filter
                                className={classNames(
                                    styles.filterBarItem,
                                    styles.filter
                                )}
                                filterQuery={this.state.filterQuery}
                                inputClassName={styles.filterInput}
                                placeholderText={this.props.intl.formatMessage(messages.filterPlaceholder)}
                                onChange={this.handleFilterChange}
                                onClear={this.handleFilterClear}
                            />
                        )}
                        {this.props.filterable && this.props.tags && (
                            <Divider className={classNames(styles.filterBarItem, styles.divider)} />
                        )}
                        {this.props.tags &&
                            <div className={styles.tagWrapper}>
                                {/* {tagListPrefix.concat(this.props.tags).map((tagProps, id) => ( */}
                                {tagListPrefix.map((tagProps, id) => (
                                    // 标签过滤器
                                    <TagButton
                                        active={this.state.selectedTag === tagProps.tag.toLowerCase()}
                                        className={classNames(
                                            styles.filterBarItem,
                                            styles.tagButton,
                                            tagProps.className
                                        )}
                                        key={`tag-button-${id}`}
                                        onClick={this.handleTagClick}
                                        {...tagProps}
                                    />
                                ))}
                            </div>
                        }
                    </div>
                )}
                <div
                    className={classNames(styles.libraryScrollGrid, {
                        [styles.withFilterBar]: this.props.filterable || this.props.tags
                    })}
                    ref={this.setFilteredDataRef}
                >
                    {/* 扩展列表 */}
                    {filteredData && this.getFilteredData().map((dataItem, index) => (
                        dataItem === '---' ? (
                            <Separator key={index} />
                        ) : (
                            <LibraryItem
                                bluetoothRequired={dataItem.bluetoothRequired}
                                collaborator={dataItem.collaborator}
                                description={dataItem.description}
                                disabled={dataItem.disabled}
                                extensionId={dataItem.extensionId}
                                href={dataItem.href}
                                featured={dataItem.featured}
                                hidden={dataItem.hidden}
                                iconMd5={dataItem.costumes ? dataItem.costumes[0].md5ext : dataItem.md5ext}
                                iconRawURL={dataItem.rawURL}
                                icons={dataItem.costumes}
                                id={index}
                                incompatibleWithScratch={dataItem.incompatibleWithScratch}
                                favorite={this.state.favorites.includes(dataItem[this.props.persistableKey])}
                                onFavorite={this.handleFavorite}
                                onTest={this.handleTest}
                                onOnline={this.handleOnline}
                                insetIconURL={dataItem.insetIconURL}
                                internetConnectionRequired={dataItem.internetConnectionRequired}
                                isPlaying={this.state.playingItem === index}
                                key={dataItem.key || (
                                    typeof dataItem.name === 'string' ?
                                        dataItem.name :
                                        dataItem.rawURL
                                )}
                                name={dataItem.name}
                                credits={dataItem.credits}
                                samples={dataItem.samples}
                                docsURI={dataItem.docsURI}
                                showPlayButton={this.props.showPlayButton}
                                onMouseEnter={this.handleMouseEnter}
                                onMouseLeave={this.handleMouseLeave}
                                onSelect={this.handleSelect}
                                onClose={this.handleClose}
                                removeExtension={this.props.removeExtension}//移除扩展
                                loadedExts={this.props.loadedExts}//传入已经加载的扩展列表
                                
                            />
                        )
                    ))}
                    {/* 商标信息 */}
                    {filteredData && this.props.removedTrademarks && (
                        <React.Fragment>
                            {filteredData.length > 0 && (
                                <Separator />
                            )}
                            <RemovedTrademarks />
                        </React.Fragment>
                    )}
                    {/* 加载中显示 */}
                    {!filteredData && (
                        <div className={styles.spinnerWrapper}>
                            <Spinner
                                large
                                level="primary"
                            />
                        </div>
                    )}
                </div>
            </Modal> 
        );  
    }
}

LibraryComponent.propTypes = {
    data: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.oneOfType([
            /* eslint-disable react/no-unused-prop-types, lines-around-comment */
            // An item in the library
            PropTypes.shape({
                // @todo remove md5/rawURL prop from library, refactor to use storage
                md5: PropTypes.string,
                name: PropTypes.oneOfType([
                    PropTypes.string,
                    PropTypes.node
                ]),
                rawURL: PropTypes.string
            }),
            PropTypes.string
            /* eslint-enable react/no-unused-prop-types, lines-around-comment */
        ])),
        PropTypes.instanceOf(Promise)
    ]),
    filterable: PropTypes.bool,
    id: PropTypes.string.isRequired,
    persistableKey: PropTypes.string,
    intl: intlShape.isRequired,
    onItemMouseEnter: PropTypes.func,
    onItemMouseLeave: PropTypes.func,
    onItemSelected: PropTypes.func,
    onRequestClose: PropTypes.func,
    setStopHandler: PropTypes.func,
    showPlayButton: PropTypes.bool,
    tags: PropTypes.arrayOf(PropTypes.shape(TagButton.propTypes)),
    title: PropTypes.string.isRequired,
    removedTrademarks: PropTypes.bool,
    extensionName : PropTypes.string,
    modeValue : PropTypes.string,
    removeExtension: PropTypes.func,
    loadedExts:PropTypes.array
};

LibraryComponent.defaultProps = {
    filterable: true,
    persistableKey: 'name',
    showPlayButton: false
};

export default injectIntl(LibraryComponent);
