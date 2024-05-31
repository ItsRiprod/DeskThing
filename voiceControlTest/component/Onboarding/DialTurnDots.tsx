import withStore from 'hocs/withStore';
import styles from './DialTurnDots.module.scss';

const DialTurnDots = () => {
  return (
    <div className={styles.outerCircle} data-testid="dial-turn-dots">
      <div className={styles.innerCircle}>
        <div className={styles.dot1} />
        <div className={styles.dot2} />
      </div>
    </div>
  );
};

export default withStore(DialTurnDots);
