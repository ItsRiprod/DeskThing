/* eslint-disable react-hooks/exhaustive-deps */
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import { useEffect, useState, useRef } from 'react';
import styles from './LearnTactile.module.scss';
import Main from '../Main';
import BackPressBanner from './BackPressBanner';
import DialPressPulse from './DialPressPulse';
import DialTurnDots from './DialTurnDots';
import { delayedAction } from 'store/OnboardingStore';
import { transitionDurationMs } from 'style/Variables';
import Overlay, { FROM } from 'component/Overlays/Overlay';
import NoInteractionModal from './NoInteractionModal';
import { learnTactileTTS, LearnTactileTtsNames } from './tts/Tactile';
import { runInAction } from 'mobx';

export const TIME_TO_REPEAT_TTS = 5_000;
export const TIME_TO_NO_INTERACTION_MODAL = 10_000;

const LearnTactile = () => {
  const rootStore = useStore();
  const onboardingStore = rootStore.onboardingStore;
  const playerStore = rootStore.playerStore;
  const onboardingUbiLogger = rootStore.ubiLogger.onboardingUbiLogger;

  const [showDialTurnDots, setShowDialTurnDots] = useState(false);
  const [showDialPressPulse, setShowDialPressPulse] = useState(false);
  const [showBackPressBanner, setBackPressBanner] = useState(false);
  const noInteractionTimeoutId = useRef<number>();

  const startNoInteractionTimer = (ttsToRepeat: LearnTactileTtsNames) => {
    const tts = learnTactileTTS[ttsToRepeat];
    window.clearTimeout(noInteractionTimeoutId.current);

    noInteractionTimeoutId.current = window.setTimeout(() => {
      noInteractionTimeoutId.current = window.setTimeout(() => {
        onboardingStore.showNoInteractionModal(tts);
      }, TIME_TO_NO_INTERACTION_MODAL + tts.fileLength);
      onboardingStore.playTts(tts.fileName);
    }, TIME_TO_REPEAT_TTS + tts.fileLength);
  };

  useEffect(() => {
    let mounted = true;
    const effect = async () => {
      if (playerStore.playing) {
        playerStore.pause();
      }
      onboardingStore.muteMic(true);
      onboardingStore.setDialPressEnabled(false);
      onboardingStore.setDialTurnEnabled(false);
      await onboardingStore.waitForTts(
        learnTactileTTS[LearnTactileTtsNames.SHELF_EXPLAIN],
      );
      if (mounted) {
        onboardingStore.setDialTurnEnabled(true);

        setShowDialTurnDots(true);
        onboardingUbiLogger.logShelfDialTurnShown();

        startNoInteractionTimer(LearnTactileTtsNames.SHELF_DIAL_TURN);
        await onboardingStore.waitForTts(
          learnTactileTTS[LearnTactileTtsNames.SHELF_DIAL_TURN],
        );
      }
    };
    runInAction(effect);

    return () => {
      mounted = false;
      window.clearTimeout(noInteractionTimeoutId.current);
    };
  }, []);

  useEffect(() => {
    const effect = async () => {
      switch (onboardingStore.dialTurnCounter) {
        case 1:
          startNoInteractionTimer(LearnTactileTtsNames.SHELF_DIAL_TURN);
          break;
        case 2:
          window.clearTimeout(noInteractionTimeoutId.current);
          onboardingStore.setDialTurnEnabled(false);
          setShowDialTurnDots(false);
          setShowDialPressPulse(true);
          onboardingUbiLogger.logShelfDialPressShown();
          onboardingStore.setDialPressEnabled(true);
          startNoInteractionTimer(LearnTactileTtsNames.SHELF_DIAL_PRESS);
          onboardingStore.waitForTts(
            learnTactileTTS[LearnTactileTtsNames.SHELF_DIAL_PRESS],
          );
          break;
        default:
          break;
      }
    };
    runInAction(effect);
  }, [onboardingStore.dialTurnCounter]);

  useEffect(() => {
    const effect = async () => {
      switch (onboardingStore.dialPressCounter) {
        case 1:
          window.clearTimeout(noInteractionTimeoutId.current);
          await delayedAction(() => {}, transitionDurationMs);
          runInAction(() => {
            if (onboardingStore.isOnboardingOngoing) {
              onboardingStore.setDialTurnEnabled(true);
              startNoInteractionTimer(
                LearnTactileTtsNames.TRACKLIST_DIAL_PRESS,
              );
              onboardingUbiLogger.logTrackListDialPressShown();
              onboardingStore.waitForTts(
                learnTactileTTS[LearnTactileTtsNames.TRACKLIST_DIAL_PRESS],
              );
            }
          });
          break;
        case 2:
          window.clearTimeout(noInteractionTimeoutId.current);
          onboardingStore.setDialTurnEnabled(false);
          onboardingStore.setDialPressEnabled(false);
          setShowDialPressPulse(false);
          await delayedAction(() => {}, 5000);
          await onboardingStore.waitForTts(
            learnTactileTTS[LearnTactileTtsNames.NPV_EXPLAIN],
          );
          setShowDialPressPulse(true);
          onboardingStore.setDialPressEnabled(true);
          onboardingUbiLogger.logNpvDialPressShown();
          // wait 1 second to play tts and actions
          startNoInteractionTimer(LearnTactileTtsNames.NPV_DIAL_PRESS);
          onboardingStore.waitForTts(
            learnTactileTTS[LearnTactileTtsNames.NPV_DIAL_PRESS],
          );
          break;
        case 3:
          window.clearTimeout(noInteractionTimeoutId.current);
          setShowDialPressPulse(false);
          onboardingStore.setDialPressEnabled(false);
          await delayedAction(() => {}, 1000);
          setBackPressBanner(true);
          onboardingStore.setBackEnabled(true);
          startNoInteractionTimer(LearnTactileTtsNames.NPV_BACK_PRESS);
          onboardingUbiLogger.logNpvBackPressShown();
          onboardingStore.waitForTts(
            learnTactileTTS[LearnTactileTtsNames.NPV_BACK_PRESS],
          );
          break;
        default:
          break;
      }
    };
    runInAction(effect);
  }, [onboardingStore.dialPressCounter]);

  useEffect(() => {
    const effect = async () => {
      switch (onboardingStore.backCounter) {
        case 1:
          startNoInteractionTimer(LearnTactileTtsNames.TRACKLIST_BACK_PRESS);
          onboardingUbiLogger.logTrackListBackPressShown();
          await onboardingStore.waitForTts(
            learnTactileTTS[LearnTactileTtsNames.TRACKLIST_BACK_PRESS],
          );
          break;
        case 2:
          window.clearTimeout(noInteractionTimeoutId.current);
          await delayedAction(() => {}, 1000 + transitionDurationMs);
          startNoInteractionTimer(LearnTactileTtsNames.SHELF_BACK_PRESS);
          onboardingUbiLogger.logShelfBackPressShown();
          await onboardingStore.waitForTts(
            learnTactileTTS[LearnTactileTtsNames.SHELF_BACK_PRESS],
          );
          break;
        case 3:
          window.clearTimeout(noInteractionTimeoutId.current);
          setBackPressBanner(false);
          await delayedAction(() => {}, 1000 + transitionDurationMs);
          onboardingStore.setBackEnabled(true);
          onboardingStore.setDialTurnEnabled(true);
          onboardingStore.setDialPressEnabled(true);
          await onboardingStore.waitForTts(
            learnTactileTTS[LearnTactileTtsNames.END_TOUR],
          );
          runInAction(() => {
            if (!playerStore.playing) {
              playerStore.play();
            }
          });
          onboardingStore.setOnboardingFinished();
          break;
        default:
          break;
      }
    };
    runInAction(effect);
  }, [onboardingStore.backCounter]);

  return (
    <div className={styles.learnTactile} data-testid="onboarding-learn-tactile">
      <Main />
      {showDialTurnDots && <DialTurnDots />}
      {showDialPressPulse && <DialPressPulse />}
      {showBackPressBanner && <BackPressBanner />}
      {!onboardingStore.noInteractionModal && (
        <div className={styles.blockTouch} />
      )}
      <Overlay
        show={!!onboardingStore.noInteractionModal}
        appear={FROM.FADE_IN}
      >
        <NoInteractionModal />
      </Overlay>
    </div>
  );
};

export default observer(LearnTactile);
