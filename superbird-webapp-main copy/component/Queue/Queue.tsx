import { observer } from 'mobx-react-lite';
import styles from './Queue.module.scss';
import { useStore } from 'context/store';
import classNames from 'classnames';
import QueueSwiper from 'component/Queue/QueueSwiper/QueueSwiper';
import QueueHeader from 'component/Queue/QueueHeader/QueueHeader';
import AmbientBackdrop from 'component/AmbientBackdrop/AmbientBackdrop';
import { useEffect } from 'react';
import EmptyQueueState from 'component/Queue/QueueEmptyState/EmptyQueueState';

const Queue = () => {
  const uiState = useStore().queueStore.queueUiState;

  const getGradientBackground = (rgbChannels: number[]) => {
    return `linear-gradient(180deg, rgba(0, 0, 0, ${
      uiState.showGradientBackground ? '0.8' : '1'
    }) 0%, rgba(0, 0, 0, 1) 100%), rgb(${rgbChannels.join(',')})`;
  };

  useEffect(() => {
    uiState.resetDialDown();
  }, [uiState]);

  useEffect(() => {
    uiState.logQueueImpression();
  }, [uiState]);

  return (
    <>
      <AmbientBackdrop
        imageId={uiState.currentPlayingImageId}
        getBackgroundStyleAttribute={getGradientBackground}
      />
      <div
        data-testid="queue"
        className={classNames(styles.queue, {
          [styles.smallHeader]: uiState.shouldShowSmallHeader,
        })}
      >
        <QueueHeader />
        {uiState.isEmptyQueue ? <EmptyQueueState /> : <QueueSwiper />}
      </div>
    </>
  );
};

export default observer(Queue);
