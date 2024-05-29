import classNames from 'classnames';
import Type from 'component/CarthingUIComponents/Type/Type';
import LazyImage from 'component/LazyImage/LazyImage';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import styles from './Widget.module.scss';

const Widget = () => {
  const controller = useStore().npvStore.otherMediaController;
  const uiState = controller.otherMediaUiState;

  return (
    <div className={styles.otherMediaWidget}>
      <div className={styles.artwork}>
        {uiState.shouldShowContent ? (
          <LazyImage
            uri={uiState.currentItem.uri}
            size={224}
            imageId={uiState.currentItem.image_id}
            onClick={controller.handleArtworkClick}
          />
        ) : (
          <LazyImage uri="" size={224} imageId="" />
        )}
      </div>
      {uiState.shouldShowContent && (
        <div className={styles.metadata}>
          <Type
            name="balladBold"
            className={classNames(styles.source, styles.truncate)}
          >{`Playing on ${uiState.otherActiveApp?.name}`}</Type>
          <Type
            name="brioBold"
            className={classNames(styles.title, styles.truncate)}
          >{`${uiState.title}`}</Type>
          <Type
            name="celloBook"
            className={classNames(styles.subtitle, styles.truncate)}
          >{`${uiState.subtitle}`}</Type>
        </div>
      )}
    </div>
  );
};

export default observer(Widget);
