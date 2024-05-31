import styles from './Modal.module.scss';
import { SpotifyLogo } from 'component/CarthingUIComponents';

const LoginRequired = () => {
  return (
    <div data-testid="login-modal-type" className={styles.dialog}>
      <SpotifyLogo logoHeight={64} logoColorClass="white" />
      <div className={styles.title}>Not logged in</div>
      <div className={styles.description}>
        <p>
          To use Car Thing you need to log in to the Spotify app on your phone.
        </p>
      </div>
    </div>
  );
};

export default LoginRequired;
