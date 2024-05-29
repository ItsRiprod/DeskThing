import { observer } from 'mobx-react-lite';
import styles from 'component/Presets/PresetCard/PresetPlaceholder.module.scss';
import Type from 'component/CarthingUIComponents/Type/Type';
import classNames from 'classnames';

type Props = {
  isFocused: boolean;
};
const PresetPlaceholder = ({ isFocused }: Props) => {
  return (
    <div className={styles.presetPlaceholder}>
      <Type
        name="mestroBold"
        className={classNames(styles.title, { [styles.active]: isFocused })}
      >
        Press and hold the preset button to save what’s playing
      </Type>
    </div>
  );
};

export default observer(PresetPlaceholder);
