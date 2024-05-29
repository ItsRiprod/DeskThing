import { observer } from 'mobx-react-lite';
import styles from 'component/PhoneCall/DeclineButton.module.scss';
import {
  Button,
  ButtonType,
  IconPhoneDecline,
} from 'component/CarthingUIComponents';
import { useStore } from 'context/store';
import { CSSTransition } from 'react-transition-group';
import { transitionDurationMs } from 'style/Variables';

const transitionStyles = {
  enter: styles.enter,
  enterActive: styles.enterActive,
  exit: styles.exit,
  exitActive: styles.exitActive,
};

const DeclineButton = () => {
  const uiState = useStore().phoneCallController.phoneCallUiState;

  return (
    <CSSTransition
      classNames={transitionStyles}
      timeout={transitionDurationMs}
      in={uiState.shouldShowAnswerOrDeclineButtons}
      unmountOnExit
    >
      <Button
        type={ButtonType.BUTTON_PRIMARY}
        className={styles.decline}
        onClick={() => uiState.decline()}
        style={{ width: '207px', height: '88px', padding: 0 }}
        testId={
          uiState.shouldShowAnswerOrDeclineButtons ? 'decline' : undefined
        }
      >
        <IconPhoneDecline />
      </Button>
    </CSSTransition>
  );
};

export default observer(DeclineButton);
