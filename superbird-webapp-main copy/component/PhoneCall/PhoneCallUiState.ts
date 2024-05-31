import PhoneCallController, { PhoneCallStore } from './PhoneCallController';
import { autorun, makeAutoObservable, runInAction } from 'mobx';
import PhoneCallUbiLogger from 'eventhandler/PhoneCallUbiLogger';

export const INCOMING_CALL_TEXT = 'Incoming call';
export const NUMBER_UNAVAILABLE = 'Number unavailable';

class PhoneCallUiState {
  phoneCallController: PhoneCallController;
  phoneCallUbiLogger: PhoneCallUbiLogger;

  constructor(
    phoneCallController: PhoneCallController,
    phoneCallUbiLogger: PhoneCallUbiLogger,
  ) {
    this.phoneCallController = phoneCallController;
    this.phoneCallUbiLogger = phoneCallUbiLogger;
    makeAutoObservable(this, {
      phoneCallController: false,
      phoneCallUbiLogger: false,
    });

    autorun(() => {
      if (this.isOngoingCall) {
        runInAction(() => this.setHasAnswered(true));
      }
    });
  }

  hasAnswered: boolean = false;
  isOutgoing: boolean = false; // to retain state during out transition

  get store(): PhoneCallStore {
    return this.phoneCallController.store;
  }

  get shouldShowCallingText(): boolean {
    return this.isOutgoing && !this.hasAnswered;
  }

  get shouldShowAnswerOrDeclineButtons(): boolean {
    return (
      !this.isOutgoing && (this.store.isRingingIncoming || !this.hasAnswered)
    );
  }

  get shouldShowOnlyDeclineButton(): boolean {
    if (this.store.isRingingOutgoing) {
      return true;
    }

    return !this.shouldShowAnswerOrDeclineButtons;
  }

  get title(): string {
    return (
      this.store.callerName || this.store.callerNumber || NUMBER_UNAVAILABLE
    );
  }

  get subtitle(): string | undefined {
    if (this.store.callerName) {
      return this.store.callerNumber;
    }

    if (this.isOutgoing || this.hasAnswered) {
      return undefined;
    }

    return INCOMING_CALL_TEXT;
  }

  get isOngoingCall(): boolean {
    return this.store.isOngoingPhoneCall;
  }

  get phoneCallImage() {
    return this.store.phoneCallImage;
  }

  hangUp(): void {
    this.store.hangUp();
    this.phoneCallUbiLogger.logHangUpButtonClicked();
  }

  decline(): void {
    this.store.hangUp();
    this.phoneCallUbiLogger.logDeclineButtonClicked();
  }

  answer(): void {
    this.store.answer();
    this.phoneCallUbiLogger.logAnswerButtonClicked();
  }

  setMicMuted(muted: boolean): void {
    this.phoneCallController.setMicMuted(muted);
  }

  handleMount() {
    this.isOutgoing = this.store.isRingingOutgoing;
    this.phoneCallController.setMicMuted(true);
    this.phoneCallUbiLogger.logPhoneCallImpression();
  }

  handleUnmount(): void {
    this.setHasAnswered(false);
    this.setMicMuted(false);
    this.isOutgoing = false;
  }

  setHasAnswered(hasAnswered: boolean): void {
    this.hasAnswered = hasAnswered;
  }

  logImpression() {
    this.phoneCallUbiLogger.logPhoneCallImpression();
  }
}

export default PhoneCallUiState;
