import { IconBluetooth, IconX } from '@spotify-internal/encore-web';
import classNames from 'classnames';
import { useState } from 'react';
import pointerListenersMaker from 'helpers/PointerListeners';

import Type from 'component/CarthingUIComponents/Type/Type';
import styles from 'component/Settings/PhoneConnection/contextmenu/PhoneConnectionContextMenu.module.scss';
import { useStore } from 'context/store';
import { action } from 'mobx';

type Props = {
  item;
  isActive?: boolean;
  dialPressed?: boolean;
};

const PhoneConnectionContextMenuItem = ({
  item,
  isActive = false,
  dialPressed = false,
}: Props) => {
  const [pressedMenuItem, setPressedMenuItem] = useState(false);
  const { phoneConnectionStore } = useStore();

  const getIcon = (label: string) => {
    return {
      ['Connect']: <IconBluetooth />,
      ['Forget']: <IconX />,
    }[label];
  };

  return (
    <div
      data-testid={`phone-menu-item-${item}`}
      className={classNames(styles.item, {
        [styles.active]: isActive,
        [styles.pressed]: pressedMenuItem || (dialPressed && isActive),
      })}
      {...pointerListenersMaker(setPressedMenuItem)}
      onClick={action(() =>
        phoneConnectionStore.phoneConnectionContextMenuUiState.handleActionMenuItemClick(
          item,
        ),
      )}
    >
      <div className={styles.icon}>{getIcon(item)}</div>
      <Type name="canonBold" className={styles.label}>
        {item}
      </Type>
    </div>
  );
};

export default PhoneConnectionContextMenuItem;
