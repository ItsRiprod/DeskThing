import InterappActions from 'middleware/InterappActions';
import { makeAutoObservable, runInAction } from 'mobx';
import ErrorHandler from 'eventhandler/ErrorHandler';

export type Tip = {
  title: string;
  description: string;
  action: string;
  id: number;
};

export type TipResponse = {
  result: Tip[];
};

export type TipOnDemandResponse = {
  tipsOnDemand: {
    tips: Tip[];
  };
};

class TipsStore {
  interappActions: InterappActions;
  errorHandler: ErrorHandler;
  tip?: Tip;
  onDemandTip?: Tip;
  nextOnDemandTip?: Tip;
  onDemandTipError: boolean = false;

  constructor(interappActions: InterappActions, errorHandler: ErrorHandler) {
    makeAutoObservable(this, {
      interappActions: false,
      errorHandler: false,
    });
    this.interappActions = interappActions;
    this.errorHandler = errorHandler;
  }

  async getNewTip() {
    try {
      const response: TipResponse = await this.interappActions.getTips();
      if (response && response.result.length > 0) {
        const parsedTip: Tip = response.result[0];
        this.setTip(parsedTip);
      } else {
        throw new Error('response with 0 tips');
      }
    } catch (e: any) {
      this.errorHandler.logUnexpectedError(e, 'Failed to get Tips:');
      throw new Error('Invalid tips response');
    }
  }

  async getOnDemandTip() {
    try {
      this.useNextOnDemandTip();
      const response: TipOnDemandResponse =
        await this.interappActions.getOnDemandTips();
      if (response && response.tipsOnDemand.tips.length > 0) {
        const [newTip, afterNewTip]: Tip[] = response.tipsOnDemand.tips;
        runInAction(() => {
          this.onDemandTip = newTip;
          this.nextOnDemandTip = afterNewTip;
          this.onDemandTipError = false;
        });
      } else {
        throw new Error('response with 0 tips');
      }
    } catch (e: any) {
      runInAction(() => {
        this.onDemandTipError = true;
      });
      this.errorHandler.logUnexpectedError(e, 'Failed to get Tips:');
    }
  }

  useNextOnDemandTip(): void {
    if (this.nextOnDemandTip) {
      this.onDemandTip = this.nextOnDemandTip;
    }
  }

  setTip(tip: Tip) {
    this.tip = tip;
  }

  // This should almost always be called from TipsUiState to also retrigger a new tip request timer
  clearTip() {
    this.tip = undefined;
  }
}

export default TipsStore;
