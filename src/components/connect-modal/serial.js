/* 串口相关 */

// 扫描
export async function scan(deviceType) {
  try {
    //console.log("设备类型",deviceType)

    const result = await window.EditorPreload.serialScan(deviceType);
    console.log(result)

    let list = [];
    if (result.success) list = result.devices;
  
    return list;
  } catch (err) {
    throw new Error(err?.message || "串口扫描失败");
  }
}
 
// 连接设备
export async function connect(device,currentDevice,modeValue) {
  if (!device.comPort) throw new Error("该设备无串口路径");
  const result = await window.EditorPreload.serialConnect(device,currentDevice);
  
  if (result && result.success) {
    //Microbit特殊处理
    if(currentDevice == "Microbit" && modeValue == "interactive"){
        window.EditorPreload.enterReplMode();//进入repl
    }else if(currentDevice == "Microbit" && modeValue == "upload"){
        window.EditorPreload.exitReplMode();//退出repl
    }
    
    return result.info || device;
  } else {
    throw new Error(result?.message || result?.error || "连接失败");
  }
}

//断开连接设备
export async function disconnect() {
  const result = await window.EditorPreload.serialDisconnect();
  if (!result || !result.success) {
    throw new Error(result?.message || result?.error || "断开失败");
  }
  return true;
}
