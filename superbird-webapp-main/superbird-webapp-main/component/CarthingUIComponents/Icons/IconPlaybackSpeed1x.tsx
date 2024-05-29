import { IconPlaybackSpeed1x } from '@spotify-internal/encore-web';
import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';

interface Props {
  className?: string;
  iconSize: number;
}

const CarThingIconPlaybackSpeed1x = ({ className, iconSize }: Props) => (
  <IconPlaybackSpeed1x
    iconSize={iconSize as IconSize}
    className={className}
    width={iconSize}
    height={iconSize}
  />
);

export default CarThingIconPlaybackSpeed1x;
