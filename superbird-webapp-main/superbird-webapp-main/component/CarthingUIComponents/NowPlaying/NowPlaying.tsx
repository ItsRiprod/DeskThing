import styles from 'component/CarthingUIComponents/NowPlaying/NowPlaying.module.scss';
import Equaliser from 'component/CarthingUIComponents/Equaliser/Equaliser';
import Type, { TypeName } from 'component/CarthingUIComponents/Type/Type';
import { greenLight } from 'style/Variables';

export type Props = {
  playing?: boolean;
  textName: TypeName;
};
const NowPlaying = ({ playing = false, textName }: Props) => {
  return (
    <div className={styles.nowPlayingWrapper}>
      <Equaliser playing={playing} />
      <Type
        name={textName}
        textColor={greenLight}
        className={styles.nowPlayingText}
      >
        Now Playing
      </Type>
    </div>
  );
};

export default NowPlaying;
