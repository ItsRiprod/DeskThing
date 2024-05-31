import classNames from 'classnames';
import { useStore } from 'context/store';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import styles from './ShelfHeaderItem.module.scss';

export type TitleRef = {
  titleContainerRef: HTMLDivElement;
  titleTextRef: HTMLDivElement;
};

type Props = {
  id: string;
  title: string;
  icon?: {
    active: React.ReactNode;
    inactive: React.ReactNode;
  };
  iconMargin?: number;
  marginRight: number;
  visible: boolean;
  active: boolean;
  onlyIcon?: boolean;
  translateLeft: number;
};

const ShelfHeaderItem = (
  {
    id,
    icon,
    iconMargin,
    marginRight,
    title,
    visible,
    active,
    onlyIcon,
    translateLeft,
  }: Props,
  ref,
) => {
  const uiState = useStore().shelfStore.shelfController.headerUiState;

  const containerRef = useRef<HTMLDivElement>(null);
  const titleTextRef = useRef<HTMLDivElement>(null);

  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    // Delay the withTransition class to prevent the item from animating
    // until the component has finished rendering the first time.
    setTimeout(() => {
      setShouldAnimate(true);
    }, 0);
  }, [setShouldAnimate]);

  useImperativeHandle(
    ref,
    () => ({
      get titleContainerRef() {
        return containerRef.current;
      },

      get titleTextRef() {
        return titleTextRef.current;
      },
    }),
    [],
  );

  return (
    <div
      className={classNames(styles.titleContainer, {
        [styles.active]: active,
        [styles.hidden]: !visible,
        [styles.withTransition]: shouldAnimate,
      })}
      style={{
        marginRight,
        transform: uiState.isInYourLibrary
          ? `translateX(-${translateLeft}px)`
          : '',
      }}
      data-testid={
        active ? `shelf-title-${title}-active` : `shelf-title-${title}`
      }
      onPointerDown={action(() => uiState.headerItemClicked(id))}
      ref={containerRef}
    >
      {icon && (
        <div className={styles.titleIcon} style={{ marginRight: iconMargin }}>
          {active ? icon.active : icon.inactive}
        </div>
      )}
      <div
        className={classNames(styles.titleText, {
          [styles.hidden]: onlyIcon,
        })}
        ref={titleTextRef}
      >
        {title}
      </div>
    </div>
  );
};

export default observer(forwardRef(ShelfHeaderItem));
