import {
  ButtonPrimary,
  ButtonSecondary,
  FormToggle,
} from '@spotify-internal/encore-web';
import styles from './DevOptions.module.scss';
import { observer } from 'mobx-react-lite';
import { FETCH_IMAGES, OTA_NONE_CRITICAL_OPTION } from 'store/DevOptionsStore';
import { useStore } from 'context/store';
import { action } from 'mobx';

const DevOptions = () => {
  const { devOptionsStore } = useStore();

  const handleChange = (event, info: string) => {
    const isChecked = event.target.checked;
    switch (info) {
      case OTA_NONE_CRITICAL_OPTION:
        devOptionsStore.setOtaNoneCriticalOption(isChecked);
        break;
      case FETCH_IMAGES:
        devOptionsStore.setImageFetchEnabled(isChecked);
        break;
      default:
        break;
    }
  };

  return (
    <div data-testid="dev-options" className={styles.devOptions}>
      <div className={styles.title}>Developer Options</div>
      <div className={styles.options}>
        <FormToggle
          onChange={(event) => handleChange(event, FETCH_IMAGES)}
          checked={devOptionsStore.imageFetchEnabled}
          className={styles.devOptionsToggle}
        >
          Load Images
        </FormToggle>
        <label htmlFor="alert-threshold" className={styles.devOptionsCounting}>
          <p>Wind alert threshold: </p>
          <span>{devOptionsStore.windAlertThreshold}</span>
          <section>
            <ButtonSecondary
              buttonSize="sm"
              onClick={action(() =>
                devOptionsStore.handleCountWindThreshold(1),
              )}
            >
              +
            </ButtonSecondary>
            <ButtonSecondary
              buttonSize="sm"
              onClick={action(() =>
                devOptionsStore.handleCountWindThreshold(-1),
              )}
            >
              -
            </ButtonSecondary>
          </section>
        </label>
        <label htmlFor="cache-size" className={styles.devOptionsCounting}>
          <p>Image cache size: </p>
          <span>{devOptionsStore.imageCacheSize}</span>
          <section id="cache-size">
            <ButtonSecondary
              buttonSize="sm"
              onClick={action(() => devOptionsStore.setImageStoreCacheSize(25))}
            >
              +
            </ButtonSecondary>
            <ButtonSecondary
              buttonSize="sm"
              onClick={action(() =>
                devOptionsStore.setImageStoreCacheSize(-25),
              )}
            >
              -
            </ButtonSecondary>
          </section>
        </label>
        <ButtonPrimary
          className={styles.requestTipBtn}
          onClick={devOptionsStore.getNewTip}
        >
          Request new tip
        </ButtonPrimary>
        <ButtonPrimary
          className={styles.requestTipBtn}
          onClick={devOptionsStore.clearLocalStorage}
        >
          Clear localStorage
        </ButtonPrimary>
      </div>
      <table className={styles.statsTable}>
        <tbody>
          <tr>
            <td>Images currently in cache:</td>
            <td>{devOptionsStore.imagesInCache()}</td>
          </tr>
          <tr>
            <td>Images loaded total:</td>
            <td>{devOptionsStore.imagesLoaded}</td>
          </tr>
          <tr>
            <td>Dismissed at:</td>
            <td>{devOptionsStore.alertDismissedAt}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default observer(DevOptions);
