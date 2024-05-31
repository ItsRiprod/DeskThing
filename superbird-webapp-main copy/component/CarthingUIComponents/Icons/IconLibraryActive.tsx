import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';
import { IconCollectionActive } from '@spotify-internal/encore-web';

type Props = {
  iconSize: IconSize;
};

const IconLibraryActive = ({ iconSize }: Props) => (
  <IconCollectionActive iconSize={iconSize} />
);

export default IconLibraryActive;
