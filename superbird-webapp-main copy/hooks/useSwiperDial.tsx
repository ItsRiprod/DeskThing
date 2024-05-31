import { autorun, runInAction } from 'mobx';
import { useEffect, useRef } from 'react';
import { easingFunction, transitionDurationMs } from 'style/Variables';
import { Swiper as ISwiper } from 'swiper';

type Args = {
  selectedItemIndex: number | undefined;
  animateSliding: boolean;
  setAnimateSliding?: (animate: boolean) => void;
};

let dragging = false;

const setDragging = (value: boolean) => (dragging = value);

export const useSwiperDial = (args: Args) => {
  const swiperRef = useRef<ISwiper>();
  useEffect(() => {
    const setAnimate = (isAnimated: boolean) => {
      if (args.setAnimateSliding) {
        args.setAnimateSliding(isAnimated);
      }
    };
    runInAction(() => setAnimate(false));
    const disposer = autorun(() => {
      if (
        args.selectedItemIndex !== undefined &&
        args.selectedItemIndex > -1 &&
        !dragging
      ) {
        if (swiperRef.current) {
          swiperRef.current.slideTo(
            args.selectedItemIndex,
            args.animateSliding ? transitionDurationMs : 0,
          );
          swiperRef.current.wrapperEl.style.transitionTimingFunction =
            easingFunction;
        }
        setAnimate(true);
      }
    });

    return () => {
      disposer();
    };
  }, [args]);

  return { setDragging, swiperRef };
};
