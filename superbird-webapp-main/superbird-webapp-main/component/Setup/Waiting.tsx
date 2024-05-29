import styles from './Waiting.module.scss';
import { SetupView } from 'store/SetupStore';
import AppendEllipsis from 'component/CarthingUIComponents/AppendEllipsis/AppendEllipsis';

const Waiting = () => {
  return (
    <div className={styles.screen} data-testid={`${SetupView.WAITING}-screen`}>
      <div className={styles.title}>
        <AppendEllipsis>Waiting</AppendEllipsis>
      </div>
      <div className={styles.subtitle}>
        Setup will continue once your phone has downloaded the latest version
        and reconnects to Car Thing.
      </div>
    </div>
  );
};

export default Waiting;
