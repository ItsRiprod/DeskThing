import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import styles from './Equaliser.module.scss';

export type Props = {
  playing: boolean;
};

export enum EqAnimation {
  PAUSED,
  PAUSE_TO_PLAY,
  PLAYING,
  PLAY_TO_PAUSE,
}

const PAUSE_PLAY_TRANSITION_MS = 250;

const Equaliser = ({ playing }: Props) => {
  const [eqAnimation, setEqAnimation] = useState(
    playing ? EqAnimation.PLAYING : EqAnimation.PAUSED,
  );

  const playTimeout = useRef<number>();
  const pauseTimeout = useRef<number>();

  useEffect(() => {
    const startPlayingTimer = () => {
      window.clearTimeout(pauseTimeout.current);
      setEqAnimation(EqAnimation.PAUSE_TO_PLAY);
      playTimeout.current = window.setTimeout(() => {
        if (playing) {
          setEqAnimation(EqAnimation.PLAYING);
        }
      }, PAUSE_PLAY_TRANSITION_MS);
    };

    const startPausingTimer = () => {
      window.clearTimeout(playTimeout.current);
      setEqAnimation(EqAnimation.PLAY_TO_PAUSE);
      pauseTimeout.current = window.setTimeout(
        () => setEqAnimation(EqAnimation.PAUSED),
        PAUSE_PLAY_TRANSITION_MS,
      );
    };

    if (eqAnimation === EqAnimation.PAUSED && playing) {
      startPlayingTimer();
    } else if (eqAnimation === EqAnimation.PLAY_TO_PAUSE && playing) {
      startPlayingTimer();
    } else if (eqAnimation === EqAnimation.PLAYING && !playing) {
      startPausingTimer();
    } else if (eqAnimation === EqAnimation.PAUSE_TO_PLAY && !playing) {
      window.clearTimeout(playTimeout.current);
      setEqAnimation(EqAnimation.PAUSED);
    }
  }, [eqAnimation, playing]);

  useEffect(
    () => () => {
      window.clearTimeout(playTimeout.current);
      window.clearTimeout(pauseTimeout.current);
    },
    [],
  );

  return (
    <div className={styles.bars} data-testid="equaliser">
      <div
        className={classNames(styles.bar, styles.bar1, {
          [styles.pauseToPlay]: eqAnimation === EqAnimation.PAUSE_TO_PLAY,
          [styles.play]: eqAnimation === EqAnimation.PLAYING,
          [styles.playToPause]: eqAnimation === EqAnimation.PLAY_TO_PAUSE,
        })}
      />
      <div
        className={classNames(styles.bar, styles.bar2, {
          [styles.pauseToPlay]: eqAnimation === EqAnimation.PAUSE_TO_PLAY,
          [styles.play]: eqAnimation === EqAnimation.PLAYING,
          [styles.playToPause]: eqAnimation === EqAnimation.PLAY_TO_PAUSE,
        })}
      />
      <div
        className={classNames(styles.bar, styles.bar3, {
          [styles.pauseToPlay]: eqAnimation === EqAnimation.PAUSE_TO_PLAY,
          [styles.play]: eqAnimation === EqAnimation.PLAYING,
          [styles.playToPause]: eqAnimation === EqAnimation.PLAY_TO_PAUSE,
        })}
      />
    </div>
  );
};
export default Equaliser;
