import styles from './SetupHelp.module.scss';
import { IconGears } from '@spotify-internal/encore-web';
import { SetupView } from 'store/SetupStore';

type Props = {
  onBackToStart: () => void;
};

const SetUpHelp = ({ onBackToStart }: Props) => {
  return (
    <div className={styles.screen} data-testid={`${SetupView.HELP}-screen`}>
      <div className={styles.content}>
        <div className={styles.texts}>
          <div className={styles.subtitle}>
            Here’s another way to start setup:
          </div>
          <div className={styles.subtitle}>
            <ul className={styles.subtitle}>
              <li>
                Open the <span className={styles.white}>Spotify</span> app on
                your phone
              </li>
              <li>
                Go to <span className={styles.white}>Home</span>
              </li>
              <li>
                Open <span className={styles.white}>Settings </span>
                <IconGears className={styles.white} />
                <span> in the top right</span>
              </li>
              <li>
                Go to <span className={styles.white}>Car</span>, then look for
                <span className={styles.white}> Car Thing</span>
              </li>
            </ul>
          </div>
        </div>
        <div
          className={styles.backToSetup}
          data-testid="go-to-start-setup"
          onClick={() => onBackToStart()}
        >
          Back to Start setup
        </div>
      </div>
    </div>
  );
};

export default SetUpHelp;
