import { observer } from 'mobx-react-lite';
import styles from './QueueHeader.module.scss';
import classNames from 'classnames';
import { useStore } from 'context/store';
import Type from 'component/CarthingUIComponents/Type/Type';

const QueueHeader = () => {
  const uiState = useStore().queueStore.queueUiState;

  return (
    <div
      className={styles.headerWrapper}
      style={{
        background: uiState.headerBackground,
      }}
      data-testid="queue-header"
    >
      <div
        className={classNames(styles.header, {
          [styles.smallHeader]: uiState.shouldShowSmallHeader,
        })}
      >
        <Type
          className={classNames(styles.queueTitle, {
            [styles.smallHeader]: uiState.shouldShowSmallHeader,
          })}
          name="altoBold"
        >
          {uiState.headerText}
        </Type>
      </div>
    </div>
  );
};

export default observer(QueueHeader);
