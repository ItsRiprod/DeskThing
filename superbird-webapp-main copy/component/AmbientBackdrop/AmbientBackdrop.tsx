import { useStore } from 'context/store';
import { get } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import styles from './AmbientBackdrop.module.scss';

type Props = {
  imageId?: string;
  getBackgroundStyleAttribute: (currentColor: number[]) => string;
};

const AmbientBackdrop = ({ getBackgroundStyleAttribute, imageId }: Props) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const { imageStore } = useStore();

  if (imageId) {
    imageStore.loadColor(imageId);
  }

  const currentColor = get(imageStore.colors, imageId);
  let background = 'black';

  if (currentColor) {
    background = getBackgroundStyleAttribute(currentColor);
  } else if (backdropRef.current) {
    background = backdropRef.current.style.background;
  }

  return (
    <div
      ref={backdropRef}
      className={styles.ambientBackdrop}
      style={{ background }}
    />
  );
};

export default observer(AmbientBackdrop);
