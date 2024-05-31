import classNames from 'classnames';
import pointerListenersMaker from 'helpers/PointerListeners';
import { useState } from 'react';
import * as React from 'react';
import styles from './Controls.module.scss';

type Props = {
  id: string;
  children?: React.ReactNode;
  onClick?: (e?) => void;
  fullSize?: boolean;
  isDisabled?: boolean;
};

const ControlButton = ({
  id,
  onClick,
  children,
  fullSize = false,
  isDisabled = false,
}: Props) => {
  const [touchDown, setTouchDown] = useState(false);

  const onClickProps = {
    onClick,
    ...pointerListenersMaker(setTouchDown),
  };

  return (
    <div className={styles.controlButton}>
      <div
        className={classNames(styles.touchArea, {
          [styles.touchAreaFullSize]: fullSize,
          [styles.touchAreaDown]: touchDown,
          [styles.disabledIcon]: isDisabled,
        })}
        data-testid={`control-button-${id}`}
        {...(onClick && !isDisabled && onClickProps)}
      >
        {children}
      </div>
    </div>
  );
};

export default ControlButton;
