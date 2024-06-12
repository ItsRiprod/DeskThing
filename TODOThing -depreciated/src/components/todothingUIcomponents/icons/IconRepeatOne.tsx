// eslint-disable-next-line import/no-unresolved
import { IconRepeatOnce } from '../../../@spotify-internal/encore-web';
import React from 'react';
interface Props {
  className?: string;
  iconSize: number;
}

const IconRepeatOne = ({ className, iconSize }: Props) => {
  return (
    <IconRepeatOnce
      height={iconSize}
      width={iconSize}
      className={className}
      iconSize={48}
    />
  );
};

export default IconRepeatOne;