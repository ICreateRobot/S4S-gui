import React from "react";
import SerialDeviceList from "./SerialDeviceList.jsx";
import BluetoothDeviceList from "./BluetoothDeviceList.jsx";
import WifiDeviceList from "./WifiDeviceList.jsx";

const ConnectContent = (props) => {
  const { mode } = props;

  if (mode === "serial") return <SerialDeviceList {...props} />;
  if (mode === "bluetooth") return <BluetoothDeviceList {...props} />;
  if (mode === "wifi") return <WifiDeviceList {...props} />;

  return null;
};

export default ConnectContent;
