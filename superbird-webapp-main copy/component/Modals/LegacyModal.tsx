import { IconX } from '@spotify-internal/encore-web';
import { IconSize } from '@spotify-internal/encore-web/es/components/Icon/Svg';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import { PropsWithChildren } from 'react';
import styles from './LegacyModal.module.scss';

const iconSize: IconSize = 70 as IconSize;

const LegacyModal = ({ children }: PropsWithChildren<{}>) => {
  const uiState = useStore().overlayController.overlayUiState;

  const handleModalOnClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={styles.legacyModal}
      data-testid="modal"
      onClick={uiState.handleBackdropOnClick}
    >
      <div
        className={styles.content}
        data-testid="modal-content"
        onClick={handleModalOnClick}
      >
        {uiState.isDismissible && (
          <div
            data-testid="modal-icon-dismissible"
            onClick={() => uiState.maybeShowAModal()}
          >
            <IconX className={styles.icon} iconSize={iconSize} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default observer(LegacyModal);
