import { IconPublic } from '@spotify-internal/encore-web';
import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';

interface Props {
  iconSize: IconSize;
}

export default function CarThingIconPublic({ iconSize }: Props) {
  return <IconPublic iconSize={iconSize} />;
}
