// @ts-nocheck
import quantize from 'quantize';
import convert from 'color-convert';
import contrast from 'color-contrast';

/*
copied from https://ghe.spotify.net/web-platform/client-web/blob/master/shared/src/utils/colorExtractor.js
in order to mimic the color extraction on the web player

and https://ghe.spotify.net/web-platform/client-web/blob/946f7b639523feb908ec08f8bac35182a89e2f90/open/server/lib/color-extraction.js
for contrast adjustment.
*/

const fetchImage = (imageUrl: string): Promise<typeof Image> => {
  return new Promise((resolve, reject) => {
    const domImage = new Image();
    domImage.crossOrigin = 'Anonymous';
    domImage.onload = () => resolve(domImage);
    domImage.onerror = () => reject();
    domImage.src = imageUrl;
  });
};

export const extractColor = (base64ImageContent: string) => {
  return fetchImage(`data:image/jpeg;base64,${base64ImageContent}`).then(
    (domImage) => {
      const width = domImage.naturalWidth;
      const height = domImage.naturalHeight;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;
      context.drawImage(domImage, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height).data;
      const pixelCount = width * height;
      const pixelArray = [];

      for (let i = 0, offset, r, g, b, a; i < pixelCount; i += 10) {
        offset = i * 4;
        r = pixels[offset + 0];
        g = pixels[offset + 1];
        b = pixels[offset + 2];
        a = pixels[offset + 3];

        // If pixel is mostly opaque and not white
        if (a >= 125) {
          if (!(r > 250 && g > 250 && b > 250)) {
            pixelArray.push([r, g, b]);
          }
        }
      }
      const cmap = quantize(pixelArray, 5);
      const palette = cmap.palette();
      return palette[0];
    },
  );
};

const ensureContrastRatio = (hex: string) => {
  const minTextContrast = 7; // Minimum text/background contrast ratio for WCAG AAA compliance.
  const minBackgroundContrast = 1.5; // Minimum background/background contrast (arbitrarily chosen).
  const hsl = convert.hex.hsl(hex);

  // Add lightness (L in HSL) until accessible against black.
  while (
    contrast(`#${convert.hsl.hex(hsl)}`, '#000000') < minBackgroundContrast &&
    hsl[2] < 100
  ) {
    hsl[2] += 1;
  }

  // Subtract lightness (L in HSL) until accessible against white.
  while (
    contrast(`#${convert.hsl.hex(hsl)}`, '#FFFFFF') < minTextContrast &&
    hsl[2] > 0
  ) {
    hsl[2] -= 1;
  }

  // Return the new HEX value.
  return `#${convert.hsl.hex(hsl)}`;
};

export const getBackgroundColor = (blob: string, factor = 1) =>
  extractColor(blob)
    .then((rgb) => rgb.map((channel: number) => Math.floor(channel * factor)))
    .then((rgb) => `#${convert.rgb.hex(rgb)}`)
    .then(ensureContrastRatio)
    .then((hex) => convert.hex.rgb(hex));
