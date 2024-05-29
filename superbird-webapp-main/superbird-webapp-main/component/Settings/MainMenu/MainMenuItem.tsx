import classNames from 'classnames';
import { useState } from 'react';
import styles from './MainMenuItem.module.scss';
import pointerListenersMaker from 'helpers/PointerListeners';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import { MainMenuItemId, View } from 'store/SettingsStore';
import {
  IconGears64,
  IconInfo64,
  IconMicOff64,
  IconMicOn64,
  IconMobile64,
  IconOption64,
  IconOtherVoice,
  IconPower64,
  IconTips64,
} from 'component/CarthingUIComponents';

const DynamicMicIcon = observer(() => {
  return useStore().voiceStore.isMicMuted ? (
    <div data-testid="mute-mic-icon">
      <IconMicOff64 />
    </div>
  ) : (
    <div data-testid="mic-icon" className={styles.green}>
      <IconMicOn64 />
    </div>
  );
});

const DynamicMicContent = observer(() => {
  const { isMicMuted } = useStore().voiceStore;
  return (
    <div
      className={classNames(
        styles.micStatus,
        isMicMuted ? styles.white : styles.green,
      )}
    >
      {isMicMuted ? 'Off' : 'On'}
    </div>
  );
});

export const iconMapping = {
  [MainMenuItemId.MIC]: <DynamicMicIcon />,
  [MainMenuItemId.PHONE_CONNECTION]: <IconMobile64 />,
  [MainMenuItemId.OPTIONS]: <IconOption64 />,
  [MainMenuItemId.TIPS]: <IconTips64 />,
  [MainMenuItemId.ABOUT]: <IconInfo64 />,
  [MainMenuItemId.RESTART]: <IconPower64 />,
  [MainMenuItemId.DEVELOPER_OPTIONS]: <IconGears64 />,
  [MainMenuItemId.OTHER_VOICE_ASSISTANTS]: <IconOtherVoice iconSize={64} />,
};

const contentMapping = {
  [MainMenuItemId.MIC]: <DynamicMicContent />,
};

export type Props = {
  item: View;
  active: boolean;
};

const MainMenuItem = ({ item, active }: Props) => {
  const { disabledOffline, id } = item;
  const [pressed, setPressed] = useState(false);

  const { hardwareStore, settingsStore } = useStore();

  const disabled = settingsStore.isMainMenuItemDisabled(disabledOffline);

  return (
    <div
      data-testid={`${id}-alternative${active ? '_active' : ''}`}
      className={classNames(styles.setting, {
        [styles.active]: active,
        [styles.pressed]: (hardwareStore.dialPressed && active) || pressed,
        [styles.disabled]: disabled,
      })}
      {...pointerListenersMaker(setPressed)}
      onClick={() => settingsStore.handleMainMenuItemSelected(item)}
    >
      <div className={styles.icon}>{iconMapping[id]}</div>
      <div className={styles.label}>{item.label}</div>
      {contentMapping[id]}
    </div>
  );
};

export default observer(MainMenuItem);
