import Spacer from 'component/Npv/ControlButtons/Spacer';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import styles from './Controls.module.scss';
import LikeTrack from './LikeTrack';
import PlayPause from './PlayPause';
import PodcastSpeed from './PodcastSpeed';
import PreviousOrNext from './PreviousOrNext';
import SaveEpisode from './SaveEpisode';
import Shuffle from './Shuffle';
import Seek from './Seek';
import Block from './Block';
import classnames from 'classnames';
import { ControlButtonSet } from 'component/Npv/ControlButtons/ControlButtonsUiState';
import { ReactNode } from 'react';

export enum NpvIcon {
  UNLIKE = 'unlike',
  LIKE = 'like',
  UNSHUFFLE = 'unshuffle',
  SHUFFLE = 'shuffle',
  PAUSE = 'pause',
  PLAY = 'play',
  SKIP_NEXT = 'skip-next',
  SKIP_PREV = 'skip-prev',
  PODCAST_SPEED = 'podcast-speed',
  SEEK_BACK_15 = 'seek-back-15',
  SEEK_FORWARD_15 = 'seek-forward-15',
  REMOVE_FROM_EPISODES = 'remove-from-episodes',
  ADD_TO_EPISODES = 'add-to-episodes',
  SPACER = 'spacer',
  VOICE_ON = 'voice-on',
  VOICE_OFF = 'voice-off',
  BLOCK = 'block',
}

export enum SkipDirection {
  FORWARD,
  BACK,
}

const Controls = () => {
  const uiState = useStore().npvStore.controlButtonsUiState;

  const setToComp: Record<ControlButtonSet, ReactNode> = {
    ['music']: (
      <>
        <Shuffle />
        <PreviousOrNext direction={SkipDirection.BACK} />
        <PlayPause />
        <PreviousOrNext direction={SkipDirection.FORWARD} />
        <LikeTrack />
      </>
    ),
    ['podcast']: (
      <>
        <PodcastSpeed />
        <Seek direction={SkipDirection.BACK} />
        <PlayPause />
        <Seek direction={SkipDirection.FORWARD} />
        <SaveEpisode />
      </>
    ),
    ['other_media']: (
      <>
        <Spacer />
        <PreviousOrNext direction={SkipDirection.BACK} />
        <PlayPause />
        <PreviousOrNext direction={SkipDirection.FORWARD} />
        <Spacer />
      </>
    ),
    ['music_ad']: (
      <>
        <Spacer />
        <PreviousOrNext direction={SkipDirection.BACK} />
        <PlayPause />
        <PreviousOrNext direction={SkipDirection.FORWARD} />
        <Spacer />
      </>
    ),
    ['free']: (
      <>
        <LikeTrack />
        <PreviousOrNext direction={SkipDirection.BACK} />
        <PlayPause />
        <PreviousOrNext direction={SkipDirection.FORWARD} />
        <Block />
      </>
    ),
  };

  return (
    <div
      className={classnames(styles.controls, {
        [styles.otherMedia]: uiState.showOtherMediaControls,
      })}
      data-testid="controls"
    >
      {setToComp[uiState.controlButtonSet]}
    </div>
  );
};

export default observer(Controls);
