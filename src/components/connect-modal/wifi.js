// modes/wifi.js
export async function scanWifiDevices() {
    return [
      { name: "ESP32-WiFi-A", id: "WIFI-A" },
      { name: "ESP32-WiFi-B", id: "WIFI-B" }
    ];
  }
  
  export async function connectWifi(device) {
    alert(`WiFi连接暂未实现: ${device.name || device.id}`);
    throw new Error("WiFi功能未实现");
  }
  
  export async function disconnectWifi() {
    return true;
  }
  