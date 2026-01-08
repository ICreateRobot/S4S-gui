import ReactDOM from 'react-dom';
import {setAppElement} from 'react-modal';

const appTarget = document.getElementById('app');

// Remove everything from the target to fix macOS Safari "Save Page As",
//清除现有子元素
while (appTarget.firstChild) {
    appTarget.removeChild(appTarget.firstChild);
}
 
setAppElement(appTarget);

const render = children => {
    ReactDOM.render(children, appTarget);

    if (window.SplashEnd) {
        window.SplashEnd();
    }
};

export default render;
