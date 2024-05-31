import { CSSProperties, PropsWithChildren } from 'react';
import {
  genericEasing,
  recedeDefaultEasing,
  transitionDurationMs,
} from 'style/Variables';
import styles from './Overlays.module.scss';
import { Transition } from 'react-transition-group';
import {
  ENTERED,
  ENTERING,
  EXITED,
  EXITING,
} from 'react-transition-group/Transition';
import classnames from 'classnames';

export enum FROM {
  TOP = 'top',
  BOTTOM = 'bottom',
  FADE_IN = 'fade_in',
}

export const OVERLAY_TRANSITION_DURATION_MS = 300;

type Props = PropsWithChildren<{
  show: boolean;
  appear: FROM;
  classname?: string;
  outDelay?: number;
}>;

type Styles = {
  [ENTERING]: CSSProperties;
  [ENTERED]: CSSProperties;
  [EXITING]: CSSProperties;
  [EXITED]: CSSProperties;
};

const getFromTopStyles = (outDelay: number): Styles => ({
  [ENTERING]: {
    transform: 'translateY(0px)',
  },
  [ENTERED]: {
    transform: 'translateY(0px)',
  },
  [EXITING]: {
    transform: 'translateY(-480px)',
    transitionDelay: `${outDelay}ms`,
  },
  [EXITED]: {
    transform: 'translateY(-480px)',
  },
});

const getBottomUpStyles = (outDelay: number): Styles => ({
  [ENTERING]: {
    transform: 'translateY(0px)',
  },
  [ENTERED]: {
    transform: 'translateY(0px)',
  },
  [EXITING]: {
    transform: 'translateY(480px)',
    transitionDelay: `${outDelay}ms`,
  },
  [EXITED]: {
    transform: 'translateY(480px)',
  },
});

const getFadeInStyles = (outDelay: number): Styles => ({
  [ENTERING]: {
    opacity: 1,
    transitionTimingFunction: genericEasing,
    transitionDuration: `${OVERLAY_TRANSITION_DURATION_MS}ms`,
  },
  [ENTERED]: {
    opacity: 1,
  },
  [EXITING]: {
    opacity: 0,
    transitionDelay: `${outDelay}ms`,
    transitionTimingFunction: recedeDefaultEasing,
    transitionDuration: `${OVERLAY_TRANSITION_DURATION_MS}ms`,
  },
  [EXITED]: {
    opacity: 0,
  },
});

type getStyles = (outDelay: number) => Styles;

const appearanceClasses: Record<FROM, getStyles> = {
  [FROM.TOP]: getFromTopStyles,
  [FROM.BOTTOM]: getBottomUpStyles,
  [FROM.FADE_IN]: getFadeInStyles,
};

// force reflow to make enter transition work
// https://github.com/reactjs/react-transition-group/issues/159
const reflow = (node: HTMLDivElement) => {
  // eslint-disable-next-line no-unused-expressions
  node?.scrollTop;
};

const Overlay = ({
  children,
  show,
  appear,
  classname,
  outDelay = 0,
}: Props) => {
  const getAnimationStyle = (state) =>
    appearanceClasses[appear](outDelay)[state];
  return (
    <Transition
      unmountOnExit
      mountOnEnter
      //@ts-ignore
      onEnter={(node) => reflow(node)}
      timeout={{
        enter: transitionDurationMs,
        exit: transitionDurationMs + outDelay,
      }}
      in={show}
    >
      {(state) => (
        <div
          className={classnames(styles.overlay, classname)}
          style={getAnimationStyle(state)}
        >
          {children}
        </div>
      )}
    </Transition>
  );
};

export default Overlay;
