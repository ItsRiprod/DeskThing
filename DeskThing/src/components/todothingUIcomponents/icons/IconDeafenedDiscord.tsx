
import { IconDeafenedDiscord } from '@spotify-internal/encore-web';
import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';

interface Props {
    className?: string;
    iconSize: number;
}


const Headphones = ({ className, iconSize }: Props) => (
    <IconDeafenedDiscord
        className={className}
        iconSize={iconSize as IconSize} 
        />
);

export default Headphones;
