import { IconShuffle } from '@spotify-internal/encore-web';
import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';

interface Props {
  className?: string;
  iconSize: number;
}

const CarThingIconShuffle = ({ className, iconSize }: Props) => (
  <IconShuffle
    className={className}
    width={iconSize}
    height={iconSize}
    iconSize={iconSize as IconSize}
  />
);

export default CarThingIconShuffle;
