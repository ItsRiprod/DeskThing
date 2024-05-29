import { get, ObservableMap, runInAction, set, makeAutoObservable } from 'mobx';
import InterappActions from 'middleware/InterappActions';
import { getBackgroundColor } from 'helpers/ColorExtractor';
import { RootStore } from './RootStore';

// Sync with C++ middleware when changing these values
export enum ImageScale {
  BIG = 248,
  SMALL = 96,
}

type ImageKey = {
  scale: ImageScale;
  imageId: string;
};

const DEFAULT_CACHE_SIZE = 50;

class ImageStore {
  interappActions: InterappActions;
  rootStore: RootStore;

  colorsMap: ObservableMap<string, Array<number>> = new ObservableMap<
    string,
    Array<number>
  >();
  imagesMap: ObservableMap<ImageScale, Map<string, string>> = new ObservableMap<
    ImageScale,
    Map<string, string>
  >();
  pendingImages: Map<ImageScale, Map<string, string>> = new Map<
    ImageScale,
    Map<string, string>
  >([
    [ImageScale.SMALL, new Map<string, string>()],
    [ImageScale.BIG, new Map<string, string>()],
  ]);
  pendingColors: Map<string, string> = new Map<string, string>();
  requestedColors: Map<string, string> = new Map<string, string>();
  orderedImages: ImageKey[] = [];
  cacheSize = DEFAULT_CACHE_SIZE;
  loadedTotal = 0;
  fetchEnabled = true;

  constructor(rootStore: RootStore, interappActions: InterappActions) {
    makeAutoObservable(this, {
      rootStore: false,
      interappActions: false,
      pendingImages: false,
      pendingColors: false,
      requestedColors: false,
      orderedImages: false,
      loadedTotal: false,
    });

    this.rootStore = rootStore;
    this.interappActions = interappActions;
    this.initImagesMap();
  }

  initImagesMap() {
    this.imagesMap.set(ImageScale.SMALL, new ObservableMap<string, string>());
    this.imagesMap.set(ImageScale.BIG, new ObservableMap<string, string>());
  }

  getImageScale(size?: number): ImageScale {
    return size && size > 100 ? ImageScale.BIG : ImageScale.SMALL;
  }

  private getAnyImage(imageId: string): string | undefined {
    return (
      this.imagesMap.get(ImageScale.BIG)?.get(imageId) ||
      this.imagesMap.get(ImageScale.SMALL)?.get(imageId)
    );
  }

  private shouldCalculateColor(imageId: string): boolean {
    return (
      (this.getAnyImage(imageId) &&
        !this.colorsMap.get(imageId) &&
        !this.pendingColors.get(imageId)) ||
      false
    );
  }

  static isLocalFileImage(imageId: string): boolean {
    return imageId.includes(':localfileimage:');
  }

  private shouldFetchImage(imageId: string, scale: ImageScale): boolean {
    return (
      imageId.length > 0 &&
      !ImageStore.isLocalFileImage(imageId) &&
      this.fetchEnabled &&
      !this.imagesMap.get(scale)?.get(imageId) &&
      !this.pendingImages.get(scale)?.get(imageId)
    );
  }

  private requestImage(imageId: string, scale: ImageScale) {
    if (scale === ImageScale.BIG) {
      return this.interappActions.getImage(imageId);
    }
    return this.interappActions.getThumbnailImage(imageId);
  }

  setColorRequested(imageId: string): void {
    this.requestedColors.set(imageId, 'requested');
  }

  setColorPending(imageId: string): void {
    this.pendingColors.set(imageId, 'pending');
  }

  setImagePending(scale: ImageScale, imageId: string): void {
    this.pendingImages.get(scale)?.set(imageId, 'pending');
  }

  async loadColor(imageId: string) {
    const image = this.getAnyImage(imageId);

    if (this.shouldCalculateColor(imageId)) {
      this.setColorPending(imageId);
      const color = await getBackgroundColor(image || '');
      runInAction(() => {
        this.pendingColors.delete(imageId);
        this.requestedColors.delete(imageId);
        set(this.colorsMap, imageId, color);
      });
    } else if (!image) {
      this.loadImage(imageId);
      this.setColorRequested(imageId);
    }
  }

  async loadImage(imageId: string, size?: number) {
    const scale = this.getImageScale(size);
    if (this.shouldFetchImage(imageId, scale)) {
      this.setImagePending(scale, imageId);
      try {
        const img = await this.requestImage(imageId, scale);
        runInAction(() => {
          this.imagesMap.get(scale)?.set(imageId, img.image_data);
          this.cacheSideEffect(imageId, scale);
          this.pendingImages.get(scale)?.delete(imageId);
          if (
            this.requestedColors.get(imageId) &&
            !get(this.colorsMap, imageId)
          ) {
            this.loadColor(imageId);
          }
        });
      } catch (e: any) {
        this.rootStore.errorHandler.logUnexpectedError(
          e,
          'Failed to load image data',
        );
      }
    }
  }

  private cacheSideEffect(imageId: string, scale: ImageScale) {
    const key: ImageKey = { scale, imageId };
    this.loadedTotal++;
    this.orderedImages.unshift(key);
    const toEvict = this.orderedImages.slice(this.cacheSize);
    this.orderedImages = this.orderedImages.slice(0, this.cacheSize);
    toEvict.forEach((id: ImageKey) =>
      this.imagesMap.get(id.scale)?.delete(id.imageId),
    );
  }

  get images(): Map<string, string> {
    return get(this.imagesMap, ImageScale.BIG)!;
  }

  get thumbnails(): Map<string, string> {
    return get(this.imagesMap, ImageScale.SMALL)!;
  }

  get colors(): ObservableMap<string, Array<number>> {
    return this.colorsMap;
  }

  get loaded(): number {
    return this.loadedTotal;
  }

  setCacheSize(size: number) {
    this.cacheSize = size;
  }

  // dev options
  setFetchEnabled(fetchEnabled: boolean) {
    this.fetchEnabled = fetchEnabled;
  }
}

export default ImageStore;
