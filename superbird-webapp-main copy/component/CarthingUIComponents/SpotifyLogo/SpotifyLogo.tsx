import { LogoSpotify } from '@spotify-internal/encore-web';
import './SpotifyLogo.scss';

export type Props = {
  logoColorClass?: string;
  logoHeight?: number;
  condensed?: boolean;
  useBrandColor?: boolean;
  viewBox?: string;
};

const SpotifyLogo = ({
  logoColorClass,
  logoHeight,
  condensed = true,
  useBrandColor = false,
  viewBox = '0 0 26 24',
}: Props) => {
  return (
    <LogoSpotify
      data-testid="SpotifyLogo"
      condensed={condensed}
      height={logoHeight}
      className={logoColorClass}
      useBrandColor={useBrandColor}
      viewBox={viewBox}
    />
  );
};

export default SpotifyLogo;
