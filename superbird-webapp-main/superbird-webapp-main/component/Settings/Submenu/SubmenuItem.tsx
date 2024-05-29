import classNames from 'classnames';
import { useStore } from 'context/store';
import { useState } from 'react';
import pointerListenersMaker from 'helpers/PointerListeners';
import styles from './SubmenuItem.module.scss';
import { observer } from 'mobx-react-lite';
import { MenuItemId, View } from 'store/SettingsStore';
import { Type } from 'component/CarthingUIComponents';

export type Props = {
  item: View;
  active: boolean;
};

const OnOrOff = ({
  id,
  isToggleOn,
  active,
}: {
  id: MenuItemId;
  isToggleOn: boolean;
  active: boolean;
}) => (
  <div
    className={classNames(
      styles.onOffToggle,
      isToggleOn ? styles.green : styles.white70,
      { [styles.movedForDial]: active },
    )}
    data-testid={`${id}-toggle`}
  >
    <Type name="canonBold">{isToggleOn ? 'On' : 'Off'}</Type>
  </div>
);

const SubmenuItem = ({ item, active }: Props) => {
  const { label, disabledOffline, type, id } = item;
  const [pressed, setPressed] = useState(false);

  const { hardwareStore, settingsStore, remoteControlStore } = useStore();
  const uiState = settingsStore.submenuUiState;

  const disabled = !remoteControlStore.interappConnected && disabledOffline;

  return (
    <div
      data-testid={`${id}-alternative${active ? '_active' : ''}`}
      className={classNames(styles.item, {
        [styles.active]: active,
        [styles.pressed]: (hardwareStore.dialPressed && active) || pressed,
        [styles.disabled]: disabled,
      })}
      {...pointerListenersMaker(setPressed)}
      onClick={() =>
        disabled
          ? uiState.showUnavailableBanner()
          : uiState.handleSubmenuItemClicked(item)
      }
    >
      <Type name="canonBold">{label}</Type>
      {(() => {
        switch (type) {
          case 'toggle':
            return (
              <OnOrOff
                active={active}
                id={id}
                isToggleOn={uiState.isToggleOn(item)}
              />
            );
          case 'key-value':
            return (
              <Type
                className={classNames(styles.keyValueValue, {
                  [styles.movedForDial]: active,
                })}
                name="canonBook"
              >
                {uiState.getKeyValue(item)}
              </Type>
            );
          default:
            return null;
        }
      })()}
    </div>
  );
};

export default observer(SubmenuItem);
