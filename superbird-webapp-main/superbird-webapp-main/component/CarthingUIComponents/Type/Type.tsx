import './Type.scss';
import classNames from 'classnames';
import React, { CSSProperties } from 'react';

export type TypeName =
  | 'bassBold'
  | 'bassBook'
  | 'forteBold'
  | 'forteBook'
  | 'brioBold'
  | 'brioBook'
  | 'altoBold'
  | 'altoBook'
  | 'canonBold'
  | 'canonBook'
  | 'celloBold'
  | 'celloBook'
  | 'balladBold'
  | 'balladBook'
  | 'mestroBold'
  | 'mestroBook'
  | 'minuet';

type Props = {
  children: React.ReactNode;
  name: TypeName;
  textColor?: string;
  dataTestId?: string;
  className?: string;
  onClick?: (e?: any) => void;
  style?: CSSProperties;
};

const Type = React.forwardRef<HTMLDivElement, Props>(
  (
    { children, name, textColor, className, dataTestId, onClick, style }: Props,
    ref,
  ) => {
    return (
      <div
        data-testid={dataTestId}
        className={classNames(name, className)}
        style={{ color: textColor, ...style }}
        onClick={onClick}
        ref={ref}
      >
        {children}
      </div>
    );
  },
);

export default Type;
