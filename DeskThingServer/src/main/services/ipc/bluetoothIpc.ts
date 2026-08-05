import {
  BluetoothIPCData,
  IPC_BLUETOOTH_TYPES,
  BluetoothHandlerReturnMap
} from '@shared/types/ipc/ipcBluetooth'
import { bluetoothManager } from '@server/services/bluetooth'

export const bluetoothHandler = async (
  data: BluetoothIPCData
): Promise<BluetoothHandlerReturnMap[(typeof data)['type']]> => {
  switch (data.type) {
    case IPC_BLUETOOTH_TYPES.GET_STATUS:
      return await bluetoothManager.getStatus()
    case IPC_BLUETOOTH_TYPES.SET_PREFERENCE:
      return await bluetoothManager.setPreference(data.payload)
    case IPC_BLUETOOTH_TYPES.PROVISION_DEVICE:
      return await bluetoothManager.provision(data.payload.adbId)
    case IPC_BLUETOOTH_TYPES.DISCOVER:
      return await bluetoothManager.discover()
    case IPC_BLUETOOTH_TYPES.PAIR:
      return await bluetoothManager.pair(data.payload.address)
    case IPC_BLUETOOTH_TYPES.PAIR_REPLY:
      return await bluetoothManager.pairReply(data.payload.accept)
    case IPC_BLUETOOTH_TYPES.UNPAIR:
      return await bluetoothManager.unpair(data.payload.address)
  }
}
