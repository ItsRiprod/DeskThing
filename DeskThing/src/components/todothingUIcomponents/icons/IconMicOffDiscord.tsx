
import { IconMicOffDiscord } from '@spotify-internal/encore-web';
import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';

interface Props {
    className?: string;
    iconSize: number;
}

const IconMicOff = ({ className, iconSize }: Props) => (
    <IconMicOffDiscord
        className={className}
        iconSize={iconSize as IconSize} 
        />
);

export default IconMicOff;