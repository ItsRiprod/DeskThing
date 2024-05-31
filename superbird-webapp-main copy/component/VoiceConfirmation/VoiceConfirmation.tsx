import styles from './VoiceConfirmation.module.scss';
import { IconCheck, IconHeartAltActive } from '@spotify-internal/encore-web';
import {
  ADD_TO_COLLECTION_INTENT,
  FOLLOW_INTENT,
  MUTE_INTENT,
  MUTE_MIC_INTENT,
  REPEAT_OFF_INTENT,
  REPEAT_ON_INTENT,
  REPEAT_ONE_INTENT,
  SET_PLAYBACK_SPEED_1POINT2X_INTENT,
  SET_PLAYBACK_SPEED_1POINT5X_INTENT,
  SET_PLAYBACK_SPEED_1X_INTENT,
  SHUFFLE_OFF_INTENT,
  SHUFFLE_ON_INTENT,
  THUMBS_UP_INTENT,
  VoiceConfirmationIntent,
} from 'component/VoiceConfirmation/VoiceConfirmationIntents';
import {
  SAVE_TO_COLLECTION_EPISODE,
  SAVE_TO_COLLECTION_PODCAST_ACTION,
  VoiceConfirmationAction,
} from 'component/VoiceConfirmation/VoiceConfirmationActions';
import {
  IconCheckAlt,
  IconMicOff,
  IconPlaybackSpeed1point2x,
  IconPlaybackSpeed1point5x,
  IconPlaybackSpeed1x,
  IconRepeat,
  IconRepeatOne,
  IconShuffle,
  IconShuffleActive,
} from 'component/CarthingUIComponents';
import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';

export type Props = {
  intent: VoiceConfirmationIntent;
  action?: VoiceConfirmationAction;
};

const iconSize: IconSize = 96 as IconSize;

const VoiceConfirmation = ({ intent, action }: Props): JSX.Element => {
  switch (intent) {
    case THUMBS_UP_INTENT:
    case FOLLOW_INTENT:
    case ADD_TO_COLLECTION_INTENT:
      if (
        action === SAVE_TO_COLLECTION_PODCAST_ACTION ||
        action === SAVE_TO_COLLECTION_EPISODE
      ) {
        return (
          <IconCheckAlt
            className={styles.confirmationIcon}
            iconSize={iconSize}
          />
        );
      }
      return (
        <IconHeartAltActive
          className={styles.confirmationIcon}
          iconSize={iconSize}
        />
      );
    case SHUFFLE_ON_INTENT:
      return (
        <div data-testid="shuffle-confirmation">
          <IconShuffleActive
            className={styles.confirmationIcon}
            iconSize={iconSize}
          />
        </div>
      );
    case SHUFFLE_OFF_INTENT:
      return (
        <div data-testid="shuffle-confirmation">
          <IconShuffle
            className={styles.confirmationIcon}
            iconSize={iconSize}
          />
        </div>
      );
    case REPEAT_ON_INTENT:
      return (
        <IconRepeat className={styles.confirmationIcon} iconSize={iconSize} />
      );
    case REPEAT_OFF_INTENT:
      return (
        <IconRepeat className={styles.confirmationIcon} iconSize={iconSize} />
      );
    case REPEAT_ONE_INTENT:
      return (
        <IconRepeatOne
          className={styles.confirmationIcon}
          iconSize={iconSize}
        />
      );
    case SET_PLAYBACK_SPEED_1X_INTENT:
      return (
        <IconPlaybackSpeed1x
          className={styles.confirmationIcon}
          iconSize={iconSize}
        />
      );
    case SET_PLAYBACK_SPEED_1POINT2X_INTENT:
      return (
        <IconPlaybackSpeed1point2x
          className={styles.confirmationIcon}
          iconSize={iconSize}
        />
      );
    case SET_PLAYBACK_SPEED_1POINT5X_INTENT:
      return (
        <IconPlaybackSpeed1point5x
          className={styles.confirmationIcon}
          iconSize={iconSize}
        />
      );
    case MUTE_INTENT:
    case MUTE_MIC_INTENT:
      return (
        <div data-testid="mute-confirmation">
          <IconMicOff className={styles.confirmationIcon} iconSize={iconSize} />
        </div>
      );
    default:
      // This shouldn't actually happen...
      return (
        <IconCheck
          data-testid="default-confirmation"
          className={styles.confirmationIcon}
          iconSize={iconSize}
        />
      );
  }
};

export default VoiceConfirmation;
