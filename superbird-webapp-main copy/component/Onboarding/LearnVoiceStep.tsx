/* eslint-disable react-hooks/exhaustive-deps */
import classNames from 'classnames';
import Jellyfish from 'component/CarthingUIComponents/Jellyfish/Jellyfish';
import { useStore } from 'context/store';
import { firstLetterUpperCase } from 'helpers/TextUtil';
import { action, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { delayedAction, LearnVoiceStepId } from 'store/OnboardingStore';
import { LearnVoiceData } from './LearnVoice';
import styles from './LearnVoiceStep.module.scss';
import SkipButton from './SkipButton';
import { Type } from 'component/CarthingUIComponents';

type Props = {
  learnVoiceData: LearnVoiceData;
};

const animationStyles = {
  appear: styles.animationAppear,
  appearActive: styles.animationAppearActive,
  appearDone: styles.animationAppearDone,
  enter: styles.animationEnter,
  enterActive: styles.animationEnterActive,
  enterDone: styles.animationEnterDone,
  exit: styles.animationExit,
  exitActive: styles.animationExitActive,
  exitDone: styles.animationExitDone,
};

const LearnVoiceStep = ({
  learnVoiceData: { header, title, voiceEnabled, tts1, tts2 },
}: Props) => {
  const [show, setShow] = useState(false);

  const { playerStore, onboardingStore, voiceStore, shelfStore } = useStore();

  // Toggle next view if no voice
  useEffect(() => {
    let timeoutId: number;
    const effect = () => {
      voiceStore.resetVoiceSessionState();
      onboardingStore.setWakewordTriggered(false);
      if (playerStore.playing) {
        onboardingStore.pause();
      }

      if (!voiceEnabled) {
        timeoutId = window.setTimeout(
          action(() => onboardingStore.nextLearnVoiceStep()),
          tts1.timeout,
        );
      }
    };
    runInAction(effect);
    return () => window.clearTimeout(timeoutId);
  }, []);

  // Pre voice request
  useEffect(() => {
    const ttsStep1 = async () => {
      onboardingStore.muteMic(true);
      setShow(true);

      if (tts1.fileName) {
        if (onboardingStore.learnVoiceStep === LearnVoiceStepId.LAST_STEP) {
          shelfStore.getShelfData();
        }

        await delayedAction(() => {
          if (tts1.fileName) {
            onboardingStore.playTts(tts1.fileName);
          }
        }, 1000);
      }

      if (voiceEnabled) {
        await delayedAction(() => {
          onboardingStore.muteMic(false);
        }, tts1.timeout + 1000);
      }
    };
    runInAction(ttsStep1);
  }, []);

  // Post voice request
  useEffect(() => {
    const ttsStep2 = async () => {
      if (voiceStore.intent && tts2) {
        onboardingStore.muteMic(true);

        await delayedAction(async () => {}, 4000);

        if (tts2.fileName) {
          await onboardingStore.waitForTts({
            fileName: tts2.fileName,
            fileLength: tts2.timeout,
          });
        }
        await delayedAction(() => onboardingStore.nextLearnVoiceStep(), 2000);
      }
    };
    runInAction(ttsStep2);
  }, [voiceStore.intent]);

  const voiceActive =
    voiceEnabled && onboardingStore.wakewordTriggered && !voiceStore.error;
  const transcript =
    voiceEnabled &&
    !voiceStore.error &&
    voiceStore.state.asr.isFinal &&
    voiceStore.state.asr.transcript;

  const showHeader = show && !transcript && !voiceStore.error;

  return (
    <div className={styles.learnVoiceStep}>
      <TransitionGroup className={styles.headerAndTitle}>
        <CSSTransition
          timeout={2000}
          key={transcript || voiceStore.error || title}
          classNames={{ ...animationStyles }}
          appear
        >
          <div
            className={classNames({
              [styles.voiceActive]: voiceActive,
            })}
          >
            {showHeader && (
              <Type name="canonBold" className={styles.header}>
                {header}
              </Type>
            )}
            {show &&
              (voiceStore.error ? (
                <div className={styles.transition}>
                  <Type name="brioBold" className={styles.errorContent}>
                    That didn’t work, you might be offline.
                  </Type>
                  <Type name="brioBold" className={styles.errorContent}>
                    That’s OK, let’s move on.
                  </Type>
                </div>
              ) : (
                <Type name="forteBold">
                  {transcript ? firstLetterUpperCase(transcript) : title}
                </Type>
              ))}
          </div>
        </CSSTransition>
      </TransitionGroup>
      <div className={styles.skipOrJellyfish}>
        {!voiceActive && <SkipButton />}
        {voiceActive && (
          <div className={styles.jellyfishContainer} data-testid="jellyfish">
            <Jellyfish />
          </div>
        )}
      </div>
    </div>
  );
};

export default observer(LearnVoiceStep);
