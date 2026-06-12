import React from 'react'
import App from './App.jsx'
import './index.css'

// ✅ Scratch 可用组件入口
export default function IoTEditor(props) {
  return (
    <div className="iot-root">
      <App {...props} />
    </div>
  )
}