const fetchImage = (imageUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const domImage = new Image();
    domImage.crossOrigin = 'Anonymous';
    domImage.onload = () => resolve(domImage);
    domImage.onerror = () => reject();
    domImage.src = imageUrl;
  });
};

const getBackgroundColor = (base64ImageContent: string): Promise<[number, number, number]> => {
  return fetchImage(`${base64ImageContent}`).then((domImage) => {
    const width = domImage.naturalWidth;
    const height = domImage.naturalHeight;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    context?.drawImage(domImage, 0, 0, width, height);
    const pixels = context?.getImageData(0, 0, width, height)?.data || [];
    const pixelCount = width * height;
    const pixelArray: [number, number, number][] = [];

    for (let i = 0, offset, r, g, b, a; i < pixelCount; i += 10) {
      offset = i * 4;
      r = pixels[offset + 0];
      g = pixels[offset + 1];
      b = pixels[offset + 2];
      a = pixels[offset + 3];

      // If pixel is mostly opaque and not white
      if (a >= 125) {
        if (!(r > 254 && g > 254 && b > 254)) {
          pixelArray.push([r, g, b]);
        }
      }
    }

    canvas.remove();
    const cmap = quantize(pixelArray, 5);
    const palette = cmap.palette();
    return palette[0];
  });
};

const quantize = (pixels: [number, number, number][], maxColors = 5, step = 8) => {
  const cmap = new Map();
  const res = new Map();

  const normalizeColor = ([r, g, b]: [number, number, number]): string => {
    const nr = Math.round(r / step) * step;
    const ng = Math.round(g / step) * step;
    const nb = Math.round(b / step) * step;
    return `${nr},${ng},${nb}`;
  };

  for (const [r, g, b] of pixels) {
    const key = normalizeColor([r, g, b]);
    const count = cmap.get(key) || 0;
    cmap.set(key, count + 1);
  }
  const sortedColors = Array.from(cmap.entries()).sort((a, b) => b[1] - a[1]);

  for (const [key, count] of sortedColors.slice(0, maxColors)) {
    const [r, g, b] = key.split(',').map(Number);
    res.set(key, [r, g, b, count]);
  }

  return {
    palette: () => Array.from(res.values()),
  };
};

export const findContrastColor = (rgb: [number, number, number]): [number, number, number] => {
  const [r, g, b] = rgb;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Adjust the RGB values to find a contrasting color
  const contrastR = brightness < 128 ? 250 : 25;
  const contrastG = brightness < 128 ? 250 : 25;
  const contrastB = brightness < 128 ? 250 : 25;

  return [contrastR, contrastG, contrastB];
};

export default getBackgroundColor;

const calculateLuminance = (color: string) => {
  const rgb = color.match(/\w\w/g)?.map((x) => parseInt(x, 16));
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Determine if white or black text is more readable on the background color
export const getContrastingTextColor = (bgColor: string): string => {
  const color = bgColor.replace('var(', '').replace(')', '');
  const style = getComputedStyle(document.documentElement);
  const hexColor = style.getPropertyValue(color).trim().substring(1);
  const luminance = calculateLuminance(hexColor);
  return luminance > 0.5 ? '#37474F' : '#FFFFFF';
};
