import styles from './ButtonGroup.module.scss';
import { CSSProperties } from 'react';
import classnames from 'classnames';

type Layout = 'horizontal' | 'vertical';

export interface Props {
  children: React.ReactNode;
  layout?: Layout;
  style?: CSSProperties;
}

export default function ButtonGroup({ children, style, layout }: Props) {
  return (
    <div
      className={classnames(styles.buttonGroupGrid, {
        [styles.horizontal]: layout === 'horizontal',
      })}
      style={style}
    >
      {children}
    </div>
  );
}
