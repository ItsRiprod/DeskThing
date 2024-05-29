import { IconPlaybackSpeed1point5x } from '@spotify-internal/encore-web';
import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';

interface Props {
  className?: string;
  iconSize: number;
}

const CarThingIconPlaybackSpeed1point5x = ({ className, iconSize }: Props) => (
  <IconPlaybackSpeed1point5x
    iconSize={iconSize as IconSize}
    className={className}
    width={iconSize}
    height={iconSize}
  />
);

export default CarThingIconPlaybackSpeed1point5x;
