import { IconRepeat } from '@spotify-internal/encore-web';
import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';

interface Props {
  className?: string;
  iconSize: number;
}

const CarThingIconRepeat = ({ className, iconSize }: Props) => (
  <IconRepeat
    className={className}
    iconSize={iconSize as IconSize}
    width={iconSize}
    height={iconSize}
  />
);

export default CarThingIconRepeat;
