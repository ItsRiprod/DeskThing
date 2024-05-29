import { observer } from 'mobx-react-lite';
import styles from 'component/PhoneCall/AnswerButton.module.scss';
import {
  Button,
  ButtonType,
  IconPhoneAnswer,
} from 'component/CarthingUIComponents';
import { useStore } from 'context/store';
import classNames from 'classnames';

const AnswerButton = () => {
  const uiState = useStore().phoneCallController.phoneCallUiState;

  return (
    <Button
      type={ButtonType.BUTTON_PRIMARY}
      className={classNames({
        [styles.toDecline]: uiState.shouldShowOnlyDeclineButton,
      })}
      onClick={() =>
        uiState.shouldShowAnswerOrDeclineButtons
          ? uiState.answer()
          : uiState.hangUp()
      }
      style={{ width: '207px', height: '88px', padding: 0 }}
      testId={uiState.shouldShowAnswerOrDeclineButtons ? 'answer' : 'hangup'}
    >
      <IconPhoneAnswer />
    </Button>
  );
};

export default observer(AnswerButton);
