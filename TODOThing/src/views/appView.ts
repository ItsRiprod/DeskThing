export enum AppView {
  LOGO,
  SETUP,
  OTA,
  MAIN,
  ONBOARDING,
  NOTHING, // before we have info needed to decide what to show.
}

class ViewStore {
  private _appView: AppView = AppView.MAIN; // Initialize with a default value

  get appView(): AppView {
    return this._appView;
  }

  set appView(view: AppView) {
    this._appView = view;
  }

  get isMain() {
    return this._appView === AppView.MAIN;
  }

  get isSetup() {
    return this._appView === AppView.SETUP;
  }

  get isOnboarding() {
    return this._appView === AppView.ONBOARDING;
  }
}

const viewStore = new ViewStore();
export default viewStore;
