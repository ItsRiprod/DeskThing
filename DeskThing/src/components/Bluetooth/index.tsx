import React, { useEffect, useState } from 'react';
import socket, { socketData } from '../../helpers/WebSocketService';
import BluetoothStore from '../../helpers/BluetoothHelper';
import ControlSocket from '../../helpers/ControlWebsocketHelper';

const Footer: React.FC = () => {
  const [visible, setIsVisible] = useState(false)
  const btStore = new BluetoothStore()

  useEffect(() => {
    setIsVisible(false)
    const handlePostData = (data: any) => {
        ControlSocket.post(data)   
    }
    const handleBtData = (data: any) => {
        switch(data.action) {
            case 'scan':
                btStore.scan()
                break
            case 'pair':
                btStore.pair(data.mac)
                break
            case 'forget':                  
                btStore.forget(data.mac)
                break
            case 'list':
                btStore.triggerBTDeviceList()
                break
            case 'select':
                btStore.select(data.mac)
                break
            case 'discoverable':
                btStore.bluetoothDiscoverable(data.discoverable)
                break
            default:
                break
        }
    };

    const listener = (msg: socketData) => {
      if (msg.type === 'bluetooth') {
        handleBtData(msg.data);
      } else if (msg.type === 'post') {
        handlePostData(msg.data)
      }
    };

    const removeListener = socket.on('client', listener);

    return () => {
      removeListener()
    };
  }, []);

  return (
    <div className={`fixed flex max-w-full bottom-0 transition-all ease-out duration-200 ap_color ${visible ? 'h-36' : 'h-16'}`}>
    </div>
  );
};

export default Footer;
