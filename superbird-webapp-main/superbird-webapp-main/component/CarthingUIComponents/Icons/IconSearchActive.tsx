import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';
import { IconSearchActive } from '@spotify-internal/encore-web';

type Props = {
  iconSize: IconSize;
};

export default function CarThingIconSearchActive({ iconSize }: Props) {
  return <IconSearchActive iconSize={iconSize} />;
}
