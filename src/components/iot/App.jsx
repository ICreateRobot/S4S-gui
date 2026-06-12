import React, { useState, useRef } from 'react';
import ComponentPanel from './components/ComponentPanel/ComponentPanel.jsx';
import Editor from './components/Editor/Editor.jsx';
import PropertyPanel from './components/PropertyPanel/PropertyPanel.jsx';
import Preview from './components/Preview/Preview.jsx';
import Header from './components/Header/Header.jsx';
// import useStore from './stores/useStore.js';
import styles from './App.css'

function App() {
  // const {
  //   isRunning,
  //   screenSize,
  //   updateScreenSize,
  //   showScreenBorder,
  //   toggleScreenBorder,
  //   saveProject,
  //   loadProject,
  //   newProject
  // } = useStore();

  // const [customWidth, setCustomWidth] = useState('');
  // const [customHeight, setCustomHeight] = useState('');
  // const [showCustomInput, setShowCustomInput] = useState(false);
  // const fileInputRef = useRef(null);

  // Screen size options
  // const presetSizes = [
  //   { name: 'Default (640x480)', width: 640, height: 480 },
  //   { name: 'Small (320x240)', width: 320, height: 240 },
  //   { name: 'Medium (800x600)', width: 800, height: 600 },
  //   { name: 'Large (1024x768)', width: 1024, height: 768 },
  //   { name: 'Phone Portrait (375x667)', width: 375, height: 667 },
  //   { name: 'Phone Landscape (667x375)', width: 667, height: 375 },
  //   { name: 'Tablet Portrait (768x1024)', width: 768, height: 1024 },
  //   { name: 'Tablet Landscape (1024x768)', width: 1024, height: 768 }
  // ];

  // const getScreenSizes = () => {
  //   const sizes = [...presetSizes];

  //   if (screenSize.name.includes('Custom') &&
  //     !presetSizes.some(size => size.width === screenSize.width && size.height === screenSize.height)) {

  //     if (!sizes.some(size => size.name === screenSize.name)) {
  //       sizes.push(screenSize);
  //     }
  //   }

  //   if (!sizes.some(size => size.name === 'Custom')) {
  //     sizes.push({ name: 'Custom', width: 640, height: 480 });
  //   }

  //   return sizes;
  // };

  // const screenSizes = getScreenSizes();

  // const handleSizeChange = (e) => {
  //   const selectedSize = screenSizes.find(size => size.name === e.target.value);
  //   if (selectedSize) {
  //     if (selectedSize.name === 'Custom') {
  //       setShowCustomInput(true);
  //       if (screenSize.name.includes('Custom') && screenSize.name !== 'Custom') {
  //         setCustomWidth(screenSize.width.toString());
  //         setCustomHeight(screenSize.height.toString());
  //       } else {
  //         setCustomWidth('640');
  //         setCustomHeight('480');
  //       }
  //     } else {
  //       setShowCustomInput(false);
  //       updateScreenSize(selectedSize);
  //     }
  //   }
  // };

  // const handleCustomSizeApply = () => {
  //   const width = parseInt(customWidth) || 640;
  //   const height = parseInt(customHeight) || 480;

  //   const customSize = {
  //     name: `Custom (${width}x${height})`,
  //     width,
  //     height
  //   };

  //   updateScreenSize(customSize);
  //   setShowCustomInput(false);
  // };

  // const handleCustomSizeCancel = () => {
  //   setShowCustomInput(false);
  //   if (screenSize.name.includes('Custom') && screenSize.name !== 'Custom') {
  //     setCustomWidth(screenSize.width.toString());
  //     setCustomHeight(screenSize.height.toString());
  //   } else {
  //     setCustomWidth('');
  //     setCustomHeight('');
  //   }
  // };

  return (
    <div className={styles.app}>

      {/* <div className={styles.appheader}>
        <div className={styles.toolbar}>
          <div className={styles.sizeselector}>
            <select
              value={screenSize.name}
              onChange={handleSizeChange}
              title="Select or customize screen size"
            >
              {screenSizes.map(size => (
                <option key={size.name} value={size.name}>
                  {size.name}
                </option>
              ))}
            </select>
          </div>

          {showCustomInput && (
            <div className={styles.customsizeinput}>
              <input
                type="number"
                placeholder="Width"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                min="100"
                max="1920"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomSizeApply();
                  }
                }}
              />
              <span>×</span>
              <input
                type="number"
                placeholder="Height"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                min="100"
                max="1920"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomSizeApply();
                  }
                }}
              />
              <button
                className={styles.apply-btn}
                onClick={handleCustomSizeApply}
                disabled={!customWidth || !customHeight}
              >
                Apply
              </button>
              <button
                className={styles.cancel-btn}
                onClick={handleCustomSizeCancel}
              >
                Cancel
              </button>
            </div>
          )}


          <button className={styles.runBtn} onClick={() => useStore.getState().generatePreview()}>
            ▶️
          </button>
        </div>
      </div> */}

      <Header />

      <div className={styles.appContent}>
        <ComponentPanel />
        <Editor />
        <PropertyPanel />
      </div>
      
      {/* 预览弹窗 */}
      <Preview />
    </div>
  );
}

export default App;