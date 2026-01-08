/* 专门给S4S做的扩展列表 */
import React from 'react';
import {FormattedMessage} from 'react-intl';

import robotteachableImage from './robotteachable/teachable_center.png';
import robotImgImage from './robotimg/img_center.png';
import robotapriltagImage from './robotapriltag/apriltag_center.png';
import robotcolordeteImage from './robotcolordete/colordete_center.png';
import robotqrImage from './robotqr/qr_center.png';
import robotfaceImage from './robotface/face_center.png';
import robotcolorplaceImage from './robotcolorplace/colorplace_center.png';
import robotcolorxyImage from './robotcolorxy/colorxy_center.png';
import robottrafficImage from './robottraffic/traffic_center.png';



import musicIconURL from './music/music.png';
import musicInsetIconURL from './music/music-small.svg';

import penIconURL from './pen/pen.png';
import penInsetIconURL from './pen/pen-small.svg';

import videoSensingIconURL from './videoSensing/video-sensing.png';
import videoSensingInsetIconURL from './videoSensing/video-sensing-small.svg';

import text2speechIconURL from './text2speech/text2speech.png';
import text2speechInsetIconURL from './text2speech/text2speech-small.svg';

import AIVisionIconURL from './ICreate_K210/k210.png';
import LinkbotIconURL from './ICreate_Linkbot/Linkbot.png';


export default [
    {
        name: (
            <FormattedMessage
                defaultMessage="Link Bot"
                id="gui.extension.linkBot.name"
            />
        ),
        extensionId: 'LinkBot',
        iconURL: LinkbotIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Link Bot."
                id="gui.extension.linkBot.description"
            />
        ),
        tags: ["upload"],
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="AI Vision"
                description="Name for the 'Music' extension"
                id="gui.extension.k210.name"
            />
        ),
        extensionId: 'ICreateK210',
        iconURL: AIVisionIconURL,
        description: (
            <FormattedMessage
                defaultMessage="AI Vision."
                id="gui.extension.k210.description"
            />
        ),
        tags: ['AI',"upload"],
        featured: true
    },
];


//ai扩展
export const aiExtension = [
    {
        name: (
            <FormattedMessage
                defaultMessage="机器学习"
                description="Name for the 'robotteachable' extension"
                id="gui.extension.robotteachable.name"
            />
        ),
        extensionId: 'robotteachable',
        iconURL: robotteachableImage,
        description: (
            <FormattedMessage
                defaultMessage="机器学习."
                description="Description for the 'robotteachable' extension"
                id="gui.extension.robotteachable.description"
            />
        ),
        tags: ['AI'],
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="摄像头"
                description="Name for the 'robotimg' extension"
                id="gui.extension.robotimg.name"
            />
        ),
        extensionId: 'robotimg',
        iconURL: robotImgImage,
        description: (
            <FormattedMessage
                defaultMessage="摄像头."
                description="Description for the 'robotimg' extension"
                id="gui.extension.robotimg.description"
            />
        ),
        tags: ['AI'],
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="apriltag识别"
                description="Name for the 'robotapriltag' extension"
                id="gui.extension.robotapriltag.name"
            />
        ),
        extensionId: 'robotapriltag',
        iconURL: robotapriltagImage,
        description: (
            <FormattedMessage
                defaultMessage="apriltag识别."
                description="Description for the 'robotapriltag' extension"
                id="gui.extension.robotapriltag.description"
            />
        ),
        tags: ['AI'],
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="二维码识别"
                description="Name for the 'robotqr' extension"
                id="gui.extension.robotqr.name"
            />
        ),
        extensionId: 'robotqr',
        iconURL: robotqrImage,
        description: (
            <FormattedMessage
                defaultMessage="二维码识别."
                description="Description for the 'robotqr' extension"
                id="gui.extension.robotqr.description"
            />
        ),
        tags: ['AI'],
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="颜色识别"
                description="Name for the 'robotcolordete' extension"
                id="gui.extension.robotcolordete.name"
            />
        ),
        extensionId: 'robotcolordete',
        iconURL: robotcolordeteImage,
        description: (
            <FormattedMessage
                defaultMessage="颜色识别."
                description="Description for the 'robotcolordete' extension"
                id="gui.extension.robotcolordete.description"
            />
        ),
        tags: ['AI'],
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="颜色位置追踪"
                description="Name for the 'robotcolorplace' extension"
                id="gui.extension.robotcolorplace.name"
            />
        ),
        extensionId: 'robotcolorplace',
        iconURL: robotcolorplaceImage,
        description: (
            <FormattedMessage
                defaultMessage="颜色位置追踪."
                description="Description for the 'robotcolorplace' extension"
                id="gui.extension.robotcolorplace.description"
            />
        ),
        tags: ['AI'],
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="颜色坐标追踪"
                description="Name for the 'robotcolorxy' extension"
                id="gui.extension.robotcolorxy.name"
            />
        ),
        extensionId: 'robotcolorxy',
        iconURL: robotcolorxyImage,
        description: (
            <FormattedMessage
                defaultMessage="颜色坐标追踪."
                description="Description for the 'robotcolorxy' extension"
                id="gui.extension.robotcolorxy.description"
            />
        ),
        tags: ['AI'],
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="人脸识别"
                description="Name for the 'robotface' extension"
                id="gui.extension.robotface.name"
            />
        ),
        extensionId: 'robotface',
        iconURL: robotfaceImage,
        description: (
            <FormattedMessage
                defaultMessage="人脸识别."
                description="Description for the 'robotface' extension"
                id="gui.extension.robotface.description"
            />
        ),
        tags: ['AI'],
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="路标识别"
                description="Name for the 'robottraffic' extension"
                id="gui.extension.robottraffic.name"
            />
        ),
        extensionId: 'robottraffic',
        iconURL: robottrafficImage,
        description: (
            <FormattedMessage
                defaultMessage="路标识别."
                description="Description for the 'robottraffic' extension"
                id="gui.extension.robottraffic.description"
            />
        ),
        tags: ['AI'],
        featured: true
    }
];


//scratch扩展
export const scratchExtension = [
    {
        name: (
            <FormattedMessage
                defaultMessage="Music"
                description="Name for the 'Music' extension"
                id="gui.extension.music.name"
            />
        ),
        extensionId: 'music',
        iconURL: musicIconURL,
        insetIconURL: musicInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Play instruments and drums."
                description="Description for the 'Music' extension"
                id="gui.extension.music.description"
            />
        ),
        tags: ['scratch'],
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="Pen"
                description="Name for the 'Pen' extension"
                id="gui.extension.pen.name"
            />
        ),
        extensionId: 'pen',
        iconURL: penIconURL,
        insetIconURL: penInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Draw with your sprites."
                description="Description for the 'Pen' extension"
                id="gui.extension.pen.description"
            />
        ),
        tags: ['scratch'],
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="Video Sensing"
                description="Name for the 'Video Sensing' extension"
                id="gui.extension.videosensing.name"
            />
        ),
        extensionId: 'videoSensing',
        iconURL: videoSensingIconURL,
        insetIconURL: videoSensingInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Sense motion with the camera."
                description="Description for the 'Video Sensing' extension"
                id="gui.extension.videosensing.description"
            />
        ),
        tags: ['scratch'],
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="Text to Speech"
                description="Name for the Text to Speech extension"
                id="gui.extension.text2speech.name"
            />
        ),
        extensionId: 'text2speech',
        collaborator: 'Amazon Web Services',
        iconURL: text2speechIconURL,
        insetIconURL: text2speechInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Make your projects talk."
                description="Description for the Text to speech extension"
                id="gui.extension.text2speech.description"
            />
        ),
        tags: ['scratch'],
        featured: true,
        internetConnectionRequired: true
    }

]


// export const galleryLoading = {
//     name: (
//         <FormattedMessage
//             defaultMessage="{APP_NAME} Extension Gallery"
//             description="Name of extensions.turbowarp.org in extension library"
//             id="tw.extensionGallery.name"
//             values={{
//                 APP_NAME
//             }}
//         />
//     ),
//     href: 'https://extensions.turbowarp.org/',
//     extensionId: 'gallery',
//     iconURL: galleryIcon,
//     description: (
//         <FormattedMessage
//             // eslint-disable-next-line max-len
//             defaultMessage="Loading extension gallery..."
//             description="Appears while loading extension list from the custom extension gallery"
//             id="tw.extensionGallery.loading"
//         />
//     ),
//     tags: ['tw'],
//     featured: true
// };

// export const galleryMore = {
//     name: (
//         <FormattedMessage
//             defaultMessage="{APP_NAME} Extension Gallery"
//             description="Name of extensions.turbowarp.org in extension library"
//             id="tw.extensionGallery.name"
//             values={{
//                 APP_NAME
//             }}
//         />
//     ),
//     href: 'https://extensions.turbowarp.org/',
//     extensionId: 'gallery',
//     iconURL: galleryIcon,
//     description: (
//         <FormattedMessage
//             // eslint-disable-next-line max-len
//             defaultMessage="Learn more about extensions at extensions.turbowarp.org."
//             description="Appears after the extension list from the gallery was loaded successfully"
//             id="tw.extensionGallery.more"
//         />
//     ),
//     tags: ['tw'],
//     featured: true
// };

// export const galleryError = {
//     name: (
//         <FormattedMessage
//             defaultMessage="{APP_NAME} Extension Gallery"
//             description="Name of extensions.turbowarp.org in extension library"
//             id="tw.extensionGallery.name"
//             values={{
//                 APP_NAME
//             }}
//         />
//     ),
//     href: 'https://extensions.turbowarp.org/',
//     extensionId: 'gallery',
//     iconURL: galleryIcon,
//     description: (
//         <FormattedMessage
//             // eslint-disable-next-line max-len
//             defaultMessage="Error loading extension gallery. Visit extensions.turbowarp.org to find more extensions."
//             description="Appears when an error occurred loading extension list from the custom extension gallery"
//             id="tw.extensionGallery.error"
//         />
//     ),
//     tags: ['tw'],
//     featured: true
// };
