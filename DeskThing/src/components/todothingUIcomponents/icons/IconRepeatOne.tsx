
import { IconRepeatOnce } from '@spotify-internal/encore-web';

interface Props {
  className?: string;
  iconSize: number;
}

const IconRepeatOne = ({ className, iconSize }: Props) => {
  return (
    <IconRepeatOnce
      height={iconSize}
      width={iconSize}
      className={className}
      iconSize={48}
    />
  );
};

export default IconRepeatOne;