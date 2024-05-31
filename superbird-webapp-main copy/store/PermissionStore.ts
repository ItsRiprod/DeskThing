import { reaction, runInAction, makeAutoObservable } from 'mobx';
import Socket from '../Socket';
import InterappActions from 'middleware/InterappActions';
import ErrorHandler from 'eventhandler/ErrorHandler';
import { OverlayController } from 'component/Overlays/OverlayController';

export type PermissionStatusEvent = {
  type: 'device_permissions';
  can_use_superbird: boolean;
  can_play_on_demand: boolean;
};

export type PermissionStatusResponse = Omit<PermissionStatusEvent, 'type'>;

class PermissionsStore {
  overlayController: OverlayController;
  interappActions: InterappActions;
  errorHandler: ErrorHandler;

  constructor(
    overlayController: OverlayController,
    socket: Socket,
    interappActions: InterappActions,
    errorHandler: ErrorHandler,
  ) {
    makeAutoObservable(this, {
      overlayController: false,
      interappActions: false,
      errorHandler: false,
    });

    this.overlayController = overlayController;
    this.interappActions = interappActions;
    this.errorHandler = errorHandler;

    socket.addSocketEventListener((msg) => this.onEvent(msg));

    this.onCanUseCarThing(() => {
      this.overlayController.maybeShowAModal();
    });
  }

  canUseCarThing?: boolean;
  canPlayOnDemand?: boolean;

  async getPermissions(): Promise<void> {
    try {
      const result = await this.interappActions.getPermissions();
      runInAction(() => {
        this.canUseCarThing = result.can_use_superbird;
        this.canPlayOnDemand = result.can_play_on_demand;
      });
    } catch (e: any) {
      this.errorHandler.logUnexpectedError(e, 'Failed to get permissions');
    }
  }

  onEvent(msg: PermissionStatusEvent) {
    switch (msg.type) {
      case 'device_permissions':
        this.canUseCarThing = msg.can_use_superbird;
        this.canPlayOnDemand = msg.can_play_on_demand;
        break;
      default:
        break;
    }
  }

  onCanUseCarThing(callback: () => void) {
    reaction(
      () => this.canUseCarThing,
      () => {
        callback();
      },
    );
  }
}

export default PermissionsStore;
