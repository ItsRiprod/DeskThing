import { makeAutoObservable, when } from 'mobx';
import { Socket } from 'Socket';
import MiddlewareActions from 'middleware/MiddlewareActions';

type OtaEvent = {
  type: 'ota_reboot' | 'ota_power_off';
  delay_ms: number;
};

type AmbientLightStatus = {
  type: 'ambient_light_update';
  payload: number;
};

type MiddlewareEventMessage = OtaEvent | AmbientLightStatus;

class HardwareStore {
  middlewareActions: MiddlewareActions;

  rebooting: boolean = false;
  dialPressed: boolean = false;
  ambientLightValue: number = 0;

  constructor(socket: Socket, middlewareActions: MiddlewareActions) {
    makeAutoObservable(this, { middlewareActions: false });

    socket.addSocketEventListener(this.onMiddlewareEvent.bind(this));
    this.middlewareActions = middlewareActions;
  }

  onMiddlewareEvent(msg: MiddlewareEventMessage) {
    switch (msg.type) {
      case 'ota_reboot':
        this.setRebooting(true);
        break;
      case 'ota_power_off':
        this.setRebooting(true);
        break;
      case 'ambient_light_update':
        this.ambientLightValue = msg.payload;
        break;
      default:
        break;
    }
  }

  onRebooting(callback: () => void) {
    when(
      () => this.rebooting,
      () => callback(),
    );
  }

  setDialPressed(dialPressed: boolean) {
    this.dialPressed = dialPressed;
  }

  reboot() {
    if (!this.rebooting) {
      this.setRebooting(true);
      this.middlewareActions.reboot();
    }
  }

  setRebooting(rebooting: boolean) {
    this.rebooting = rebooting;
  }

  factoryReset() {
    this.middlewareActions.factoryReset();
  }

  powerOff() {
    this.middlewareActions.powerOff();
  }
}
export default HardwareStore;
