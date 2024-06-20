
import { IconDevice } from '@spotify-internal/encore-web';
import { IconSize } from '@spotify-internal/encore-web/types/src/core/components/Icon/Svg';

interface Props {
    className?: string;
    iconSize: number;
    text?: string;
    fontSize?:number;
}

const IconCTDevice = ({ className, iconSize, text = '', fontSize = 150 }: Props) => (
    <div style={{ width: `${iconSize}px` }}>
        <IconDevice
            className={className}
            iconSize={iconSize as IconSize}
            text={text} 
            fontSize={fontSize}
            />
    </div>
);

export default IconCTDevice;