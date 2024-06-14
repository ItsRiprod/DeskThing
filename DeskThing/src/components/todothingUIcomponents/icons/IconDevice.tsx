
import { IconDevice } from '@spotify-internal/encore-web';
import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';

interface Props {
    className?: string;
    iconSize: number;
}

const IconCTDevice = ({ className, iconSize }: Props) => (
    <IconDevice
        className={className}
        iconSize={iconSize as IconSize} 
        />
);

export default IconCTDevice;