// 蓝牙扫描

// 扫描
export async function scan(deviceType) {
    try {
        const result = await window.EditorPreload.bleScan(deviceType);
        console.log(result)

        let list = [];
        if (result.success) list = result.devices;
      
        return list;
    } catch (err) {
        throw new Error(err?.message || "串口扫描失败");
    }
}

// 连接
export async function connect(device, deviceType, modeValue) {
    const result = await window.EditorPreload.bleConnect(device, deviceType);
    if (!result.success) {
      throw new Error(result.message || 'BLE connect failed');
    }
    return result.info;
}

//断开连接设备
export async function disconnect() {
  const result = await window.EditorPreload.blelDisconnect();
  if (!result || !result.success) {
    throw new Error(result?.message || result?.error || "断开失败");
  }
  return true;
}
