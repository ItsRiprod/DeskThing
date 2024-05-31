import { CSSProperties, useState } from 'react';
import styles from './Button.module.scss';
import pointerListenersMaker from 'helpers/PointerListeners';
import classNames from 'classnames';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';

export enum ButtonType {
  BUTTON_PRIMARY = 'buttonPrimary',
  BUTTON_SECONDARY = 'buttonSecondary',
}

export type Props = {
  children: React.ReactNode;
  onClick: () => void;
  type: ButtonType;
  className?: string;
  testId?: string;
  highlightOnDialPress?: boolean;
  style?: CSSProperties;
};

const Button = ({
  children,
  onClick,
  type,
  className,
  testId,
  highlightOnDialPress = true,
  style,
}: Props) => {
  const [pressed, setPressed] = useState(false);
  const { hardwareStore } = useStore();

  return (
    <button
      className={classNames(className, {
        [styles.buttonPrimary]: type === ButtonType.BUTTON_PRIMARY,
        [styles.buttonSecondary]: type === ButtonType.BUTTON_SECONDARY,
        [styles.pressed]:
          highlightOnDialPress &&
          ((hardwareStore.dialPressed && type === ButtonType.BUTTON_PRIMARY) ||
            pressed),
      })}
      style={style}
      onClick={onClick}
      data-testid={testId}
      {...pointerListenersMaker(setPressed)}
    >
      {children}
    </button>
  );
};

export default observer(Button);
