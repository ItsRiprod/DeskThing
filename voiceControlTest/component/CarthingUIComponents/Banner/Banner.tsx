import styles from 'component/CarthingUIComponents/Banner/Banner.module.scss';
import Type from 'component/CarthingUIComponents/Type/Type';
import { transitionDurationMs } from 'style/Variables';
import { CSSTransition } from 'react-transition-group';
import classNames from 'classnames';

const transitionStyles = {
  enter: styles.enter,
  enterActive: styles.enterActive,
  exit: styles.exit,
  exitActive: styles.exitActive,
};

export type ColorStyle = 'confirmation' | 'information' | 'unavailable';

export type Props = {
  show: boolean;
  icon: React.ReactNode;
  infoText: string;
  colorStyle?: ColorStyle;
  children?: React.ReactNode;
};

const Banner = ({
  show,
  icon,
  infoText,
  colorStyle = 'information',
  children,
}: Props) => {
  return (
    <CSSTransition
      in={show}
      timeout={transitionDurationMs}
      classNames={transitionStyles}
      mountOnEnter
      unmountOnExit
    >
      <div
        className={classNames(styles.bannerContainer, {
          [styles.confirmation]: colorStyle === 'confirmation',
          [styles.information]: colorStyle === 'information',
          [styles.unavailable]: colorStyle === 'unavailable',
        })}
      >
        <div className={styles.info}>
          <div className={styles.icon}>{icon}</div>
          <Type name="mestroBook" className={styles.informationalText}>
            {infoText}
          </Type>
        </div>
        {children && <div className={styles.buttons}>{children}</div>}
      </div>
    </CSSTransition>
  );
};

export default Banner;
