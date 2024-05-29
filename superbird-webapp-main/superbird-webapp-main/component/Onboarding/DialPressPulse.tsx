import withStore from 'hocs/withStore';
import styles from './DialPressPulse.module.scss';

const DialPressPulse = () => {
  return (
    <div className={styles.outerCircle} data-testid="dial-press-pulse">
      <div className={styles.innerCircle} />
    </div>
  );
};

export default withStore(DialPressPulse);
