import Type from 'component/CarthingUIComponents/Type/Type';
import StatusIcons from 'component/Npv/PlayingInfo/StatusIcons';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import styles from './Tips.module.scss';

const Tips = () => {
  const uiState = useStore().npvStore.tipsUiState;

  const [tipOrTrick, setTipOrTrick] = useState(uiState.tipToShow);
  useEffect(() => {
    if (!tipOrTrick) {
      setTipOrTrick(uiState.tipToShow);
    }
  }, [tipOrTrick, uiState.tipToShow]);

  useEffect(() => {
    if (tipOrTrick) {
      uiState.logTipImpression(tipOrTrick.action);
      uiState.setHasBeenShown(true);
    }
  }, [tipOrTrick, uiState]);

  if (!tipOrTrick) {
    return null;
  }

  return (
    <div className={styles.tips}>
      <div
        data-testid="tip-container"
        onMouseDown={() => uiState.logTipClicked()}
        onTouchStart={() => uiState.logTipClicked()}
      >
        <div className={styles.topBar}>
          <Type name="canonBold" className={styles.title}>
            {tipOrTrick.title}
          </Type>
          <StatusIcons />
        </div>
        <Type name="brioBold" className={styles.description}>
          {tipOrTrick.description}
        </Type>
      </div>
    </div>
  );
};

export default observer(Tips);
