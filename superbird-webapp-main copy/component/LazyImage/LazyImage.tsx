import { parseURI, URITypeMap } from '@spotify-internal/uri';
import classNames from 'classnames';
import Placeholder from 'component/LazyImage/Placeholder/Placeholder';
import { useStore } from 'context/store';
import {
  isRadioStationURI,
  isTrackOrEpisode,
  isYourEpisodesUri,
} from 'helpers/SpotifyUriUtil';
import { get } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import ImageStore, { ImageScale } from 'store/ImageStore';
import styles from './LazyImage.module.scss';

export type Props = {
  imageId?: string;
  size: number;
  scale?: number;
  uri: string;
  className?: string;
  shouldLoad?: boolean; // Useful if you want to delay loading of the image.
  onClick?: Function;
  dataTestId?: string;
  longPressing?: boolean;
  innerBorder?: boolean;
  isActive?: boolean;
};

export const getImageBorderRadius = (uri: string, size: number): string => {
  const podcastSize = size >= 240 ? '16px' : '8px';

  if (isYourEpisodesUri(uri)) {
    return podcastSize;
  }

  const parsedUri = parseURI(uri);

  if (!parsedUri) {
    return '';
  }

  switch (parsedUri.type) {
    case URITypeMap.ARTIST:
      return '50%';
    case URITypeMap.SHOW:
    case URITypeMap.EPISODE:
      return podcastSize;
    default:
      return '';
  }
};

const getOuterBorderRadius = (uri: string, size: number) => {
  const podcastSize = size === 240 ? '24px' : '16px';

  if (isYourEpisodesUri(uri)) {
    return podcastSize;
  }

  const parsedUri = parseURI(uri);

  if (!parsedUri) {
    return '12px';
  }

  switch (parsedUri.type) {
    case URITypeMap.ARTIST:
      return '50%';
    case URITypeMap.SHOW:
    case URITypeMap.EPISODE:
      return podcastSize;
    default:
      return '12px';
  }
};

const LazyImage = ({
  imageId,
  size,
  scale = 5,
  uri,
  shouldLoad = true,
  onClick,
  dataTestId,
  longPressing,
  innerBorder,
  isActive: outerBorder,
}: Props) => {
  const { imageStore } = useStore();

  useEffect(() => {
    if (
      shouldLoad &&
      imageId &&
      size &&
      !ImageStore.isLocalFileImage(imageId)
    ) {
      imageStore.loadImage(imageId, size);
    }
  }, [imageId, imageStore, shouldLoad, size]);

  const getClassName = () => {
    const from = parseURI(uri.replace('podcast', styles.show));

    if (!from) {
      return '';
    }

    const type = from.type;
    if (type === URITypeMap.TRACK) {
      return styles.track;
    }
    if (type === URITypeMap.SHOW) {
      return styles.show;
    }
    if (type === URITypeMap.EPISODE) {
      return styles.episode;
    }
    if (type === URITypeMap.ARTIST) {
      return styles.artist;
    }
    return '';
  };

  const getInnerBorderColor = () => {
    if (!shouldLoad) {
      return 'black';
    }
    if (imageId) {
      imageStore.loadColor(imageId);
    }
    const colorChannels = get(imageStore.colors, imageId) || [0, 0, 0];
    return `rgb(${colorChannels.join(',')})`;
  };

  const getImageTag = (image, imgSize, isRadioStation?) => {
    const imageBorderRadius = getImageBorderRadius(uri, size);
    return (
      <img
        style={{
          width: `${imgSize}px`,
          height: `${imgSize}px`,
          borderRadius: imageBorderRadius,
        }}
        data-testid={dataTestId}
        className={classNames(getClassName(), {
          [styles.image]: !isRadioStation,
          [styles.shaded]: longPressing,
          [styles.imageRadio]: isRadioStation,
        })}
        src={image ? `data:image/jpeg;base64,${image}` : undefined}
        alt=""
      />
    );
  };

  const getImageTemplate = (image: string) => {
    const showInnerBorder = innerBorder && isTrackOrEpisode(uri);
    const innerBorderColor = showInnerBorder
      ? getInnerBorderColor()
      : undefined;

    return (
      <div
        className={classNames(getClassName(), {
          [styles.innerBorder]: innerBorderColor,
        })}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderColor: innerBorderColor,
          backgroundColor: innerBorderColor,
        }}
        onClick={(e) => {
          if (onClick) {
            onClick(e);
          }
        }}
      >
        {isRadioStationURI(uri) ? (
          <div
            className={styles.radioStation}
            onClick={(e) => {
              if (onClick) {
                onClick(e);
              }
            }}
          >
            <img
              src="images/radio-rings-bg.svg"
              className={styles.radioStationBg}
              alt=""
            />
            {getImageTag(image, 108, true)}
          </div>
        ) : (
          getImageTag(image, size)
        )}
      </div>
    );
  };

  const wrapComponent = (component: React.ReactNode) => {
    const outerBorderRadius = getOuterBorderRadius(uri, size);
    return (
      <div className={styles.imageCenter} style={{ height: `${size}px` }}>
        <div
          className={classNames(styles.outerBorder, getClassName(), {
            [styles.outerBorderActive]: outerBorder,
          })}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: outerBorderRadius,
          }}
        >
          {component}
        </div>
      </div>
    );
  };

  if (!imageId || ImageStore.isLocalFileImage(imageId)) {
    return wrapComponent(
      <Placeholder
        uri={uri}
        size={size}
        onClick={onClick}
        scale={scale}
        isActive={outerBorder}
      />,
    );
  }

  let image = imageStore.thumbnails.get(imageId);
  if (imageStore.getImageScale(size) === ImageScale.BIG) {
    image = imageStore.images.get(imageId) || image;
  }
  if (!image) {
    return wrapComponent(
      <Placeholder
        uri={uri}
        size={size}
        onClick={onClick}
        scale={scale}
        isActive={outerBorder}
      />,
    );
  }
  return wrapComponent(getImageTemplate(image));
};

export default observer(LazyImage);
