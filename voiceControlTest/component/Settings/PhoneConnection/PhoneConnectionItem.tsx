import { useStore } from 'context/store';
import { useState } from 'react';
import styles from './PhoneConnection.module.scss';
import { observer } from 'mobx-react-lite';
import { IconMore } from '@spotify-internal/encore-web';

import classNames from 'classnames';
import Spinner, {
  SpinnerSize,
} from 'component/CarthingUIComponents/Spinner/Spinner';
import pointerListenersMaker from 'helpers/PointerListeners';
import { action } from 'mobx';

type Props = {
  phoneName: string;
  phoneAddress: string;
  isActive: boolean;
  isConnected: boolean;
  isConnecting: boolean;
};

const PhoneConnectionItem = ({
  phoneName,
  phoneAddress,
  isActive,
  isConnected,
  isConnecting,
}: Props) => {
  const { hardwareStore, phoneConnectionStore } = useStore();

  const [pressedPhoneItem, setPressedPhoneItem] = useState(false);

  const device = {
    name: phoneName,
    address: phoneAddress,
  };
  const displayConnectionStatus =
    phoneConnectionStore.getPhoneConnectionDisplayStatus(device);

  return (
    <div
      className={classNames(styles.phoneConnectionItem, {
        [styles.active]: isActive,
        [styles.pressed]:
          (hardwareStore.dialPressed && isActive) || pressedPhoneItem,
      })}
      {...pointerListenersMaker(setPressedPhoneItem)}
      data-testid={`phone-connection-item-${phoneAddress}`}
    >
      <div
        className={styles.titles}
        onClick={action(() =>
          phoneConnectionStore.handleSelectPhoneClick(device),
        )}
        data-testid={isActive ? 'selected-phone' : ''}
      >
        <span className={styles.title}>{phoneName}</span>
        <span
          className={classNames(styles.subtitle, {
            [styles.connected]: isConnected,
          })}
        >
          <span className={styles.subtitleText}>{displayConnectionStatus}</span>
          {isConnecting && <Spinner size={SpinnerSize.SMALL} />}
        </span>
      </div>
      <div
        onClick={action(() =>
          phoneConnectionStore.phoneConnectionContextMenuUiState.handleContextMenuClick(
            device,
          ),
        )}
        data-testid={`${phoneName}-menu`}
        className={styles.menuButton}
      >
        <IconMore className={styles.menuIcon} />
      </div>
    </div>
  );
};

export default observer(PhoneConnectionItem);
