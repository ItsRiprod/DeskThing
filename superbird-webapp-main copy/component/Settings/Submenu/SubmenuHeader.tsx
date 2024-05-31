import { ReactNode } from 'react';
import styles from './SubmenuHeader.module.scss';
import Type from '../../CarthingUIComponents/Type/Type';

type Props = {
  icon: ReactNode;
  name: string;
};
const SubmenuHeader = ({ icon, name }: Props) => {
  return (
    <div className={styles.header}>
      <div className={styles.headerDetails}>
        {icon}
        <Type name="altoBold" textColor="white">
          {name}
        </Type>
      </div>
    </div>
  );
};

export default SubmenuHeader;
