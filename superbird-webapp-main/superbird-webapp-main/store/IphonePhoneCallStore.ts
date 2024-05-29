import { RootStore } from './RootStore';
import Socket from '../Socket';
import { makeAutoObservable, reaction } from 'mobx';
import { PhoneCallStore } from 'component/PhoneCall/PhoneCallController';
import MiddlewareActions from 'middleware/MiddlewareActions';

export type IphonePhoneCallState = {
  type: 'phone_call_info';
  remote_id: string;
  display_name: string;
  status:
    | 'Disconnected'
    | 'Sending'
    | 'Ringing'
    | 'Connecting'
    | 'Active'
    | 'Held'
    | 'Disconnecting';
  call_dir: 'Incoming' | 'Outgoing';
  call_id: string;
};

export const hasName = (number: string, name?: string): boolean => {
  if (name === undefined || name.length === 0) {
    return false;
  }

  return name.replace(/\D/g, '') !== number.replace(/\D/g, '');
};

class IphonePhoneCallStore implements PhoneCallStore {
  rootStore: RootStore;
  middlewareActions: MiddlewareActions;

  constructor(
    rootStore: RootStore,
    middlewareActions: MiddlewareActions,
    socket: Socket,
  ) {
    makeAutoObservable(this, { rootStore: false, middlewareActions: false });
    this.rootStore = rootStore;
    this.middlewareActions = middlewareActions;
    socket.addSocketEventListener((msg) => this.onMiddlewareEvent(msg));
  }

  callState: IphonePhoneCallState | undefined;
  phoneCallImage = '';

  onMiddlewareEvent(message: IphonePhoneCallState) {
    if (!this.rootStore.remoteConfigStore.handleIncomingPhoneCalls) {
      return;
    }

    switch (message.type) {
      case 'phone_call_info':
        this.callState = message;
        break;
      default:
        break;
    }
  }

  answer(): void {
    if (this.callState?.call_id) {
      this.middlewareActions.answerPhoneCall(this.callState.call_id);
    }
  }

  hangUp(): void {
    if (this.callState?.call_id) {
      this.middlewareActions.hangUpPhoneCall(this.callState.call_id);
    }
  }

  get isOngoingPhoneCall(): boolean {
    return this.callState?.status === 'Active';
  }

  get callerName(): string | undefined {
    return hasName(this.callerNumber, this.callState?.display_name)
      ? this.callState?.display_name
      : undefined;
  }

  get callerNumber(): string {
    return this.callState?.remote_id ?? '';
  }

  get isRingingIncoming(): boolean {
    return (
      this.callState?.call_dir === 'Incoming' &&
      this.callState?.status === 'Ringing'
    );
  }

  get isRingingOutgoing(): boolean {
    return (
      this.callState?.call_dir === 'Outgoing' &&
      this.callState?.status === 'Sending'
    );
  }

  onCallInitiated(callback: () => void): void {
    reaction(
      () => this.isRingingIncoming || this.isRingingOutgoing,
      () => {
        if (this.isRingingIncoming || this.isRingingOutgoing) {
          callback();
        }
      },
    );
  }

  onCallEnd(callback: () => void): void {
    reaction(
      () => this.callState?.status,
      () => {
        if (this.callState?.status === 'Disconnected') {
          callback();
        }
      },
    );
  }

  reset() {
    this.callState = undefined;
  }
}

export default IphonePhoneCallStore;
