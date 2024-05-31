import classNames from 'classnames';
import styles from './AppendEllipsis.module.scss';

type Props = {
  children: string;
};

const Ellipsis = ({ children }: Props) => {
  return (
    <>
      <span>{children}</span>
      <span className={classNames(styles.dot, styles.dot1)}>.</span>
      <span className={classNames(styles.dot, styles.dot2)}>.</span>
      <span className={classNames(styles.dot, styles.dot3)}>.</span>
    </>
  );
};

export default Ellipsis;
