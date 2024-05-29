import { RootStore } from './RootStore';
import { makeAutoObservable, reaction, runInAction } from 'mobx';
import Socket from 'Socket';
import InterappActions from 'middleware/InterappActions';
import { PhoneCallStore } from 'component/PhoneCall/PhoneCallController';

type PhoneCallState = 'IDLE' | 'RINGING' | 'OFFHOOK';

type PhoneCallMessage = {
  phone_number: string;
  state: PhoneCallState;
  display_name: string;
};

export type AndroidPhoneCallMessage = {
  type: 'com.spotify.superbird.phone.state';
  payload: PhoneCallMessage;
};

class AndroidPhoneCallStore implements PhoneCallStore {
  rootStore: RootStore;
  interappActions: InterappActions;
  constructor(
    rootStore: RootStore,
    interappActions: InterappActions,
    socket: Socket,
  ) {
    makeAutoObservable(this, { rootStore: false, interappActions: false });
    this.rootStore = rootStore;
    this.interappActions = interappActions;
    socket.addSocketEventListener((msg) => this.onMiddlewareEvent(msg));
  }

  phoneCallStatus: PhoneCallState = 'IDLE';
  phoneCallNumber = '';
  phoneCallDisplayName = '';
  phoneCallImage = '';
  // DEFAULT_MESSAGE = 'I am busy right now, call you back ASAP :) ';

  onMiddlewareEvent(msg: AndroidPhoneCallMessage) {
    if (!this.rootStore.remoteConfigStore.handleIncomingPhoneCalls) {
      return;
    }
    switch (msg.type) {
      case 'com.spotify.superbird.phone.state':
        if (msg.payload) {
          this.updatePhoneCallStatus(
            msg.payload.state,
            msg.payload.phone_number,
            msg.payload.display_name,
          );
        }
        if (msg.payload.state === 'RINGING') {
          this.loadPhoneCallImage(msg.payload.phone_number);
        }
        break;
      default:
        break;
    }
  }

  loadPhoneCallImage(phoneNumber: string) {
    this.loadImage(phoneNumber);
  }

  async loadImage(phoneNumber: string) {
    try {
      const img = await this.interappActions.getPhoneCallImage(phoneNumber);
      runInAction(() => {
        this.updatePhoneCallImage(img.image_data);
      });
    } catch (e: any) {
      this.rootStore.errorHandler.logUnexpectedError(
        e,
        'Failed to load image data',
      );
    }
  }

  updatePhoneCallImage(imageData) {
    this.phoneCallImage = imageData;
  }

  get isIdling() {
    return this.phoneCallStatus === 'IDLE';
  }

  get isRingingIncoming() {
    return this.phoneCallStatus === 'RINGING';
  }

  get isRingingOutgoing() {
    return false;
  }

  get isOngoingPhoneCall() {
    return this.phoneCallStatus === 'OFFHOOK';
  }

  get callerName(): string | undefined {
    if (this.phoneCallDisplayName.length === 0) {
      return undefined;
    }

    return this.phoneCallDisplayName;
  }

  get callerNumber(): string {
    return this.phoneCallNumber;
  }

  updatePhoneCallStatus(
    status: PhoneCallState,
    phoneNumber: string,
    phoneDisplayName: string,
  ) {
    this.phoneCallStatus = status;
    this.phoneCallNumber = phoneNumber;
    this.phoneCallDisplayName = phoneDisplayName;
  }

  answer() {
    this.interappActions.answerPhone();
  }

  hangUp() {
    this.interappActions.declinePhone();
  }

  onCallInitiated(callback: () => void): void {
    reaction(
      () => this.isRingingIncoming || this.isOngoingPhoneCall,
      () => {
        if (this.isRingingIncoming || this.isOngoingPhoneCall) {
          callback();
        }
      },
    );
  }

  onCallEnd(callback: () => void): void {
    reaction(
      () => this.isIdling,
      () => {
        if (this.isIdling) {
          callback();
        }
      },
    );
  }

  reset() {
    this.phoneCallStatus = 'IDLE';
    this.phoneCallNumber = '';
    this.phoneCallDisplayName = '';
    this.phoneCallImage = '';
  }
}

export default AndroidPhoneCallStore;
