import { IconPlaybackSpeed1point2x } from '@spotify-internal/encore-web';
import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';
interface Props {
  className?: string;
  iconSize: number;
}

const CarThingIconPlaybackSpeed1point2x = ({ className, iconSize }: Props) => (
  <IconPlaybackSpeed1point2x
    className={className}
    width={iconSize}
    height={iconSize}
    iconSize={iconSize as IconSize}
  />
);

export default CarThingIconPlaybackSpeed1point2x;
