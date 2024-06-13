
import { IconCallDiscord } from '@spotify-internal/encore-web';
import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';

interface Props {
    className?: string;
    iconSize: number;
}

const IconCall = ({ className, iconSize }: Props) => (
    <IconCallDiscord
        className={className}
        iconSize={iconSize as IconSize} 
        />
);

export default IconCall;