import { useState } from 'react';
import styles from 'component/CarthingUIComponents/Banner/BannerButton.module.scss';
import classnames from 'classnames';
import Type from 'component/CarthingUIComponents/Type/Type';
import { ColorStyle } from 'component/CarthingUIComponents/Banner/Banner';

export type ButtonProps = {
  withDivider?: boolean;
  text: string;
  colors?: ColorStyle;
  onClick: () => void;
};

const BannerButton = ({
  withDivider = false,
  text,
  colors = 'information',
  onClick,
}: ButtonProps) => {
  const [buttonPressed, setButtonPressed] = useState(false);

  return (
    <div
      key={text}
      data-testid={`${text}-button`}
      className={classnames(styles.buttonContainer, {
        [styles.confirmation]: colors === 'confirmation',
        [styles.information]: colors === 'information',
        [styles.unavailable]: colors === 'unavailable',
      })}
      onClick={() => {
        onClick();
      }}
      onTouchStart={() => setButtonPressed(true)}
      onTouchEnd={() => setButtonPressed(false)}
    >
      {withDivider && <div className={styles.divider} />}
      <div
        className={classnames(styles.bannerButton, styles.touchArea, {
          [styles.pressed]: buttonPressed,
        })}
        onTouchStart={() => setButtonPressed(true)}
        onTouchEnd={() => setButtonPressed(false)}
      >
        <Type name="minuet" className={styles.buttonText}>
          {text}
        </Type>
      </div>
    </div>
  );
};

export default BannerButton;
