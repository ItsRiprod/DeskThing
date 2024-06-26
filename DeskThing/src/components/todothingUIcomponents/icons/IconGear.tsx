
import { IconGears } from '@spotify-internal/encore-web';
import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';

interface Props {
  className?: string;
  iconSize: number;
}

const CarThingIconGear = ({ className, iconSize }: Props) => (
  <IconGears
    className={className}
    iconSize={iconSize as IconSize}
    width={iconSize}
    height={iconSize}
    
  />
);

export default CarThingIconGear;