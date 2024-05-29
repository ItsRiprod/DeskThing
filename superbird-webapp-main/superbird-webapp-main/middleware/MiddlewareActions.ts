import Socket from 'Socket';

export type PitstopDisconnectedTimeEvent = {
  type: 'disconnected_time';
  timestamp: number;
  time_disconnected_seconds: number;
};

class MiddlewareActions {
  socket: Socket;

  constructor(socket: Socket) {
    this.socket = socket;
  }

  bluetoothList() {
    this.socket.post({ type: 'bluetooth', action: 'list' });
  }

  bluetoothSelect(mac: string) {
    this.socket.post({ type: 'bluetooth', action: 'select', mac });
  }

  bluetoothScan() {
    this.socket.post({ type: 'bluetooth', action: 'scan' });
  }

  bluetoothPair(mac: string) {
    this.socket.post({ type: 'bluetooth', action: 'pair', mac });
  }

  bluetoothForget(mac: string) {
    this.socket.post({ type: 'bluetooth', action: 'forget', mac });
  }

  bluetoothDiscoverable(active: boolean) {
    this.socket.post({
      type: 'bluetooth',
      action: 'discoverable',
      active,
    });
  }

  voiceCancel() {
    this.socket.post({ type: 'voice', action: 'cancel' });
  }

  voiceStart() {
    this.socket.post({ type: 'voice', action: 'push_to_talk' });
  }

  voiceMute(mute: boolean, preserve = true) {
    this.socket.post({
      type: 'key',
      action: mute ? 'mute_mic' : 'unmute_mic',
      attributes: {
        preserve,
      },
    });
  }

  superbirdRequestVersion() {
    this.socket.post({ type: 'action', action: 'version_request' });
  }

  onboardingFinished() {
    this.socket.post({
      type: 'settings',
      action: 'put',
      value_type: 'string',
      key: 'onboarding_status',
      value: 'finished',
    });
  }

  onboardingGet() {
    this.socket.post({
      type: 'settings',
      action: 'get',
      value_type: 'string',
      key: 'onboarding_status',
    });
  }

  reboot() {
    this.socket.post({ type: 'device', action: 'reboot' });
  }

  powerOff() {
    this.socket.post({ type: 'device', action: 'power_off' });
  }

  pitstopLog(message: PitstopDisconnectedTimeEvent) {
    this.socket.post({ type: 'log', action: 'pitstop_log', message });
  }

  factoryReset() {
    this.socket.post({ type: 'device', action: 'factory_reset' });
  }

  refreshRemoteConfig() {
    this.socket.post({ type: 'action', action: 'rcs_request' });
  }

  returnToSpotify() {
    this.socket.post({ type: 'device', action: 'return_to_spotify' });
  }

  answerPhoneCall(callId: string): void {
    // iOS only
    this.socket.post({
      type: 'device',
      action: 'phone_call_answer',
      attributes: { call_id: callId },
    });
  }

  hangUpPhoneCall(callId: string): void {
    // iOS only
    this.socket.post({
      type: 'device',
      action: 'phone_call_end',
      attributes: { call_id: callId },
    });
  }
}

export default MiddlewareActions;
