import {FormattedMessage, intlShape, defineMessages} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';

import Box from '../box/box.jsx';
import PlayButton from '../../containers/play-button.jsx';
import styles from './library-item.css';
import classNames from 'classnames';

import bluetoothIconURL from './bluetooth.svg';
import internetConnectionIconURL from './internet-connection.svg';
import favoriteInactiveIcon from './favorite-inactive.svg';
import favoriteActiveIcon from './favorite-active.svg';

const messages = defineMessages({
    favorite: {
        defaultMessage: 'Favorite',
        description: 'Alt text of icon in costume, sound, and extension libraries to mark an item as favorite.',
        id: 'tw.favorite'
    },
    unfavorite: {
        defaultMessage: 'Unfavorite',
        description: 'Alt text of icon in costume, sound, and extension libraries to unmark an item as favorite.',
        id: 'tw.unfavorite'
    }
});

/* eslint-disable react/prefer-stateless-function */
class LibraryItemComponent extends React.PureComponent {
    state = {
        fileContent: null,// 远程文件内容
        loading: false, // 加载状态
        isImported:false // 扩展是否已导入
    };

    //远程文件获取方法
    // fetchFileContent = async () => {
    //     this.setState({ loading: true });
    //     try {
    //         const response = await fetch('http://8.130.129.159:9000/test/isUpdata.txt',{
    //             headers: {
    //                 'Cache-Control': 'no-cache, no-store, must-revalidate',
    //                 'Pragma': 'no-cache',
    //                 'Expires': '0'
    //             }
    //         }); // 替换为你的 IP 地址和文件路径
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }
    //         const text = await response.text();
    //         console.log(text)
    //         this.setState({ fileContent: text.trim().toLowerCase() === 'true', loading: false });
    //     } catch (error) {
    //         console.error('Failed to fetch file:', error);
    //         this.setState({ loading: false });
    //     }
    // };

    
    componentDidMount() {
        const isImported = this.props.loadedExts && this.props.loadedExts.includes(this.props.extensionId);

        console.log('扩展是否已导入:', isImported);
        this.setState({ isImported: isImported });
    }

    render () {
        const isTrue = this.state.fileContent; // 获取文件内容状态

        const onlineClass = classNames({
            [styles.onlineButton]:true,
            // [styles.onlineButtonTrue]:isTrue,
            // [styles.onlineButtonFalse]:!isTrue && this.state.fileContent !== null
        });
        const favoriteMessage = this.props.intl.formatMessage(
            this.props.favorite ? messages.unfavorite : messages.favorite
        );

        // 收藏按钮组件
        const favorite = (
            <button
                className={classNames(styles.favoriteContainer, {[styles.active]: this.props.favorite})}
                onClick={this.props.onFavorite}
            >
                <img
                    src={this.props.favorite ? favoriteActiveIcon : favoriteInactiveIcon}
                    className={styles.favoriteIcon}
                    draggable={false}
                    alt={favoriteMessage}
                    title={favoriteMessage}
                />
            </button>
        );

        // 在线更新按钮（注释状态）
        const online=(
            <button
                className={onlineClass}
                onClick={this.props.onOnline}
            >
                在线更新
            </button>
        );

        
        return this.props.featured ? (
            <div className={classNames(
                    styles.libraryItem,
                    styles.featuredItem,
                    {
                        [styles.disabled]: this.props.disabled
                    },
                    typeof this.props.extensionId === 'string' ? styles.libraryItemExtension : null,
                    this.props.hidden ? styles.hidden : null
                )}
                onClick={this.props.onClick}
            >
                {/* 已导入扩展的覆盖层和删除按钮 */}
                {this.state.isImported && (
                    <div className={styles.overlay}>
                        <button
                            className={styles.removeButton}
                            onClick={(e) => {
                                e.stopPropagation(); // 防止触发 onClick 的跳转逻辑
                                this.props.removeExtension(this.props.extensionId);
                                this.props.onClose();
                            }}
                        >
                            −
                        </button>
                    </div>
                )}
                <div className={styles.featuredImageContainer}>
                    {this.props.disabled ? (
                        <div className={styles.comingSoonText}>
                            <FormattedMessage
                                defaultMessage="Coming Soon"
                                description="Label for extensions that are not yet implemented"
                                id="gui.extensionLibrary.comingSoon"
                            />
                        </div>
                    ) : null}
                    <img
                        className={styles.featuredImage}
                        loading="lazy"
                        draggable={false}
                        src={this.props.iconURL}
                    />
                </div>
                {this.props.insetIconURL ? (
                    <div className={styles.libraryItemInsetImageContainer}>
                        <img
                            className={styles.libraryItemInsetImage}
                            src={this.props.insetIconURL}
                            draggable={false}
                        />
                    </div>
                ) : null}
                <div
                    className={typeof this.props.extensionId === 'string' ?
                        classNames(styles.featuredExtensionText, styles.featuredText) : styles.featuredText
                    }
                >
                    <span className={styles.libraryItemName}>{this.props.name}</span>
                    <br />
                    <span className={styles.featuredDescription}>{this.props.description}</span>
                </div>

                {(this.props.docsURI || this.props.samples) && (
                    <div className={styles.extensionLinks}>
                        {this.props.docsURI && (
                            <a
                                href={this.props.docsURI}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <FormattedMessage
                                    defaultMessage="Documentation"
                                    // eslint-disable-next-line max-len
                                    description="Appears in the extension list. Links to additional extension documentation."
                                    id="tw.documentation"
                                />
                            </a>
                        )}

                        {this.props.samples && (
                            <a
                                href={this.props.samples[0].href}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <FormattedMessage
                                    defaultMessage="Sample project"
                                    // eslint-disable-next-line max-len
                                    description="Appears in the extension list. Links to a sample project for an extension."
                                    id="tw.sample"
                                />
                            </a>
                        )}
                    </div>
                )}

                {this.props.credits && this.props.credits.length > 0 && (
                    <div className={styles.extensionLinks}>
                        <div>
                            <FormattedMessage
                                defaultMessage="Created by:"
                                description="Appears in the extension list. Followed by a list of names."
                                id="tw.createdBy"
                            />
                            {' '}
                            {this.props.credits.map((credit, index) => (
                                <React.Fragment key={index}>
                                    {credit}
                                    {index !== this.props.credits.length - 1 && (
                                        ', '
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}

                {this.props.bluetoothRequired || this.props.internetConnectionRequired || this.props.collaborator ? (
                    <div className={styles.featuredExtensionMetadata}>
                        <div className={styles.featuredExtensionRequirement}>
                            {this.props.bluetoothRequired || this.props.internetConnectionRequired ? (
                                <div>
                                    <div>
                                        <FormattedMessage
                                            defaultMessage="Requires"
                                            description="Label for extension hardware requirements"
                                            id="gui.extensionLibrary.requires"
                                        />
                                    </div>
                                    <div
                                        className={styles.featuredExtensionMetadataDetail}
                                    >
                                        {this.props.bluetoothRequired ? (
                                            <img
                                                src={bluetoothIconURL}
                                                draggable={false}
                                            />
                                        ) : null}
                                        {this.props.internetConnectionRequired ? (
                                            <img
                                                src={internetConnectionIconURL}
                                                draggable={false}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <div className={styles.featuredExtensionCollaboration}>
                            {this.props.collaborator ? (
                                <div>
                                    <div>
                                        <FormattedMessage
                                            defaultMessage="Collaboration with"
                                            description="Label for extension collaboration"
                                            id="gui.extensionLibrary.collaboration"
                                        />
                                    </div>
                                    <div
                                        className={styles.featuredExtensionMetadataDetail}
                                    >
                                        {this.props.collaborator}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {favorite}
                {/* {this.props.extensionId} */}
                {/* {test}
                {online} */}
            </div>
        ) : (
            <Box
                className={classNames(
                    styles.libraryItem, {
                        [styles.hidden]: this.props.hidden
                    }
                )}
                role="button"
                tabIndex="0"
                onBlur={this.props.onBlur}
                onClick={this.props.onClick}
                onFocus={this.props.onFocus}
                onKeyPress={this.props.onKeyPress}
                onMouseEnter={this.props.showPlayButton ? null : this.props.onMouseEnter}
                onMouseLeave={this.props.showPlayButton ? null : this.props.onMouseLeave}
            >
                {/* Layers of wrapping is to prevent layout thrashing on animation */}
                <Box className={styles.libraryItemImageContainerWrapper}>
                    <Box
                        className={styles.libraryItemImageContainer}
                        onMouseEnter={this.props.showPlayButton ? this.props.onMouseEnter : null}
                        onMouseLeave={this.props.showPlayButton ? this.props.onMouseLeave : null}
                    >
                        <img
                            className={styles.libraryItemImage}
                            loading="lazy"
                            src={this.props.iconURL}
                            draggable={false}
                        />
                    </Box>
                </Box>
                <span className={styles.libraryItemName}>{this.props.name}</span>
                {this.props.showPlayButton ? (
                    <PlayButton
                        isPlaying={this.props.isPlaying}
                        onPlay={this.props.onPlay}
                        onStop={this.props.onStop}
                    />
                ) : null}

                {favorite}
                {/* {test}
                {online} */}
            </Box>
        );
    }
}
/* eslint-enable react/prefer-stateless-function */


LibraryItemComponent.propTypes = {
    intl: intlShape,
    bluetoothRequired: PropTypes.bool,
    collaborator: PropTypes.string,
    description: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ]),
    disabled: PropTypes.bool,
    extensionId: PropTypes.string,
    featured: PropTypes.bool,
    hidden: PropTypes.bool,
    iconURL: PropTypes.string,
    insetIconURL: PropTypes.string,
    internetConnectionRequired: PropTypes.bool,
    isPlaying: PropTypes.bool,
    name: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ]),
    credits: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ])),
    docsURI: PropTypes.string,
    samples: PropTypes.arrayOf(PropTypes.shape({
        href: PropTypes.string,
        text: PropTypes.string
    })),
    favorite: PropTypes.bool,
    onFavorite: PropTypes.func,
    onTest: PropTypes.func,
    onOnline : PropTypes.func,
    onBlur: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
    onKeyPress: PropTypes.func.isRequired,
    onMouseEnter: PropTypes.func.isRequired,
    onMouseLeave: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onStop: PropTypes.func.isRequired,
    showPlayButton: PropTypes.bool,
    onClose:PropTypes.func,
    removeExtension: PropTypes.func,
    loadedExts:PropTypes.array
};

LibraryItemComponent.defaultProps = {
    disabled: false,
    showPlayButton: false
};

export default LibraryItemComponent;
