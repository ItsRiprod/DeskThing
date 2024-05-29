import styles from './SpotifySplash.module.scss';
import SpotifyLogo from '../SpotifyLogo/SpotifyLogo';

const SpotifySplash = () => {
  return (
    <div className={styles.container}>
      <SpotifyLogo
        condensed={false}
        viewBox="0 0 80 24"
        logoHeight={96}
        logoColorClass="white"
      />
    </div>
  );
};

export default SpotifySplash;
