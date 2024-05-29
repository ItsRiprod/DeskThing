import styles from './Views.module.scss';
import classNames from 'classnames';
import { View } from 'store/ViewStore';
import DelayedRender from '../DelayedRender/DelayedRender';
import { observer } from 'mobx-react-lite';
import Shelf from 'component/Shelf/Shelf';
import Npv from 'component/Npv/Npv';
import Tracklist from 'component/Tracklist/Tracklist';
import { transitionDurationMs } from 'style/Variables';
import { useStore } from 'context/store';
import Queue from 'component/Queue/Queue';

const Views = () => {
  const { viewStore } = useStore();

  const tracklistOverNpv =
    viewStore.currentView === View.TRACKLIST &&
    viewStore.viewUnderCurrentView === View.NPV;

  const queueOverNpv =
    viewStore.currentView === View.QUEUE &&
    viewStore.viewUnderCurrentView === View.NPV;

  return (
    <div className={styles.viewArea}>
      {[
        { name: View.CONTENT_SHELF, component: <Shelf /> },
        { name: View.QUEUE, component: <Queue /> },
        { name: View.TRACKLIST, component: <Tracklist /> },
        { name: View.NPV, component: <Npv /> },
      ].map((view) => (
        <div
          key={view.name}
          className={classNames(styles.view, {
            [styles.current]: view.name === viewStore.currentView,
            [styles.underCurrent]: viewStore.viewUnderCurrentView === view.name,
            [styles.forceOnTop]:
              (tracklistOverNpv && view.name === View.TRACKLIST) ||
              (queueOverNpv && view.name === View.QUEUE),
          })}
        >
          {/* @ts-ignore */}
          <DelayedRender
            showing={view.name === viewStore.currentView}
            hideDelay={transitionDurationMs}
          >
            {view.component}
          </DelayedRender>
        </div>
      ))}
    </div>
  );
};

export default observer(Views);
