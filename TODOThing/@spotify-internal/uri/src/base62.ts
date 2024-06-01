/* eslint-disable @typescript-eslint/no-unused-expressions */
// Alphabets
const HEX16 = '0123456789abcdef';
const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Hexadecimal fragments
export const _HEX256: string[] = [];
_HEX256.length = 256;
for (let i = 0; i < 256; i++) {
  _HEX256[i] = HEX16[i >> 4] + HEX16[i & 0xf];
}

// Look-up tables
export const _ID62: number[] = [];
_ID62.length = 128;
for (let i = 0; i < BASE62.length; ++i) {
  _ID62[BASE62.charCodeAt(i)] = i;
}

export const _ID16: number[] = [];
for (let i = 0; i < 16; i++) {
  _ID16[HEX16.charCodeAt(i)] = i;
}
for (let i = 0; i < 6; i++) {
  _ID16['ABCDEF'.charCodeAt(i)] = 10 + i;
}

/* eslint-disable no-unused-expressions,no-sequences */
export function base62ToHex(s: string): string | null {
  if (s.length !== 22) {
    // Can only parse base62 ids with length == 22.
    // Invalid base62 ids will lead to garbage in the output.
    return null;
  }

  // 1 / (2^32)
  const MAX_INT_INV = 2.3283064365386963e-10;
  // 2^32
  const MAX_INT = 0x100000000;
  // 62^3
  const P62_3 = 238328;

  let p0;
  let p1;
  let p2;
  let p3;
  let v;
  // First 7 characters fit in 2^53
  // prettier-ignore
  p0 =
        _ID62[s.charCodeAt(0)] * 56800235584 +  // * 62^6
        _ID62[s.charCodeAt(1)] * 916132832 +    // * 62^5
        _ID62[s.charCodeAt(2)] * 14776336 +     // * 62^4
        _ID62[s.charCodeAt(3)] * 238328 +       // * 62^3
        _ID62[s.charCodeAt(4)] * 3844 +         // * 62^2
        _ID62[s.charCodeAt(5)] * 62 +           // * 62^1
        _ID62[s.charCodeAt(6)]; // * 62^0
  p1 = (p0 * MAX_INT_INV) | 0;
  p0 -= p1 * MAX_INT;
  // 62^10 < 2^64
  v =
    _ID62[s.charCodeAt(7)] * 3844 +
    _ID62[s.charCodeAt(8)] * 62 +
    _ID62[s.charCodeAt(9)];
  // eslint-disable no-unused-expressions
  (p0 = p0 * P62_3 + v), (p0 = p0 - (v = (p0 * MAX_INT_INV) | 0) * MAX_INT);
  p1 = p1 * P62_3 + v;
  // 62^13 < 2^96
  v =
    _ID62[s.charCodeAt(10)] * 3844 +
    _ID62[s.charCodeAt(11)] * 62 +
    _ID62[s.charCodeAt(12)];
  (p0 = p0 * P62_3 + v), (p0 = p0 - (v = (p0 * MAX_INT_INV) | 0) * MAX_INT);
  (p1 = p1 * P62_3 + v), (p1 = p1 - (v = (p1 * MAX_INT_INV) | 0) * MAX_INT);
  p2 = v;
  // 62^16 < 2^96
  v =
    _ID62[s.charCodeAt(13)] * 3844 +
    _ID62[s.charCodeAt(14)] * 62 +
    _ID62[s.charCodeAt(15)];
  (p0 = p0 * P62_3 + v), (p0 = p0 - (v = (p0 * MAX_INT_INV) | 0) * MAX_INT);
  (p1 = p1 * P62_3 + v), (p1 = p1 - (v = (p1 * MAX_INT_INV) | 0) * MAX_INT);
  p2 = p2 * P62_3 + v;
  // 62^19 < 2^128
  v =
    _ID62[s.charCodeAt(16)] * 3844 +
    _ID62[s.charCodeAt(17)] * 62 +
    _ID62[s.charCodeAt(18)];
  (p0 = p0 * P62_3 + v), (p0 = p0 - (v = (p0 * MAX_INT_INV) | 0) * MAX_INT);
  (p1 = p1 * P62_3 + v), (p1 = p1 - (v = (p1 * MAX_INT_INV) | 0) * MAX_INT);
  (p2 = p2 * P62_3 + v), (p2 = p2 - (v = (p2 * MAX_INT_INV) | 0) * MAX_INT);
  p3 = v;
  v =
    _ID62[s.charCodeAt(19)] * 3844 +
    _ID62[s.charCodeAt(20)] * 62 +
    _ID62[s.charCodeAt(21)];
  (p0 = p0 * P62_3 + v), (p0 = p0 - (v = (p0 * MAX_INT_INV) | 0) * MAX_INT);
  (p1 = p1 * P62_3 + v), (p1 = p1 - (v = (p1 * MAX_INT_INV) | 0) * MAX_INT);
  (p2 = p2 * P62_3 + v), (p2 = p2 - (v = (p2 * MAX_INT_INV) | 0) * MAX_INT);
  (p3 = p3 * P62_3 + v), (p3 = p3 - (v = (p3 * MAX_INT_INV) | 0) * MAX_INT);
  if (v) {
    // carry not allowed
    return null;
  }
  // prettier-ignore
  return _HEX256[p3>>>24]+_HEX256[(p3>>>16)&0xFF]+_HEX256[(p3>>>8)&0xFF]+_HEX256[(p3)&0xFF] +
             _HEX256[p2>>>24]+_HEX256[(p2>>>16)&0xFF]+_HEX256[(p2>>>8)&0xFF]+_HEX256[(p2)&0xFF] +
             _HEX256[p1>>>24]+_HEX256[(p1>>>16)&0xFF]+_HEX256[(p1>>>8)&0xFF]+_HEX256[(p1)&0xFF] +
             _HEX256[p0>>>24]+_HEX256[(p0>>>16)&0xFF]+_HEX256[(p0>>>8)&0xFF]+_HEX256[(p0)&0xFF];
}
/* eslint-enable no-unused-expressions,no-sequences */

export function base62FromHex(s: string): string | null {
  let i;
  let p0 = 0;
  let p1 = 0;
  let p2 = 0;
  for (i = 0; i < 10; i++) p2 = p2 * 16 + _ID16[s.charCodeAt(i)];
  for (i = 0; i < 11; i++) p1 = p1 * 16 + _ID16[s.charCodeAt(i + 10)];
  for (i = 0; i < 11; i++) p0 = p0 * 16 + _ID16[s.charCodeAt(i + 21)];
  if (isNaN(p0 + p1 + p2)) {
    return null;
  }
  const P16_11 = 17592186044416; // 16^11
  const INV_62 = 1.0 / 62;

  let acc;
  let ret = '';
  i = 0;
  for (; i < 7; ++i) {
    acc = p2;
    p2 = Math.floor(acc * INV_62);
    acc = (acc - p2 * 62) * P16_11 + p1;
    p1 = Math.floor(acc * INV_62);
    acc = (acc - p1 * 62) * P16_11 + p0;
    p0 = Math.floor(acc * INV_62);
    ret = BASE62[acc - p0 * 62] + ret;
  }
  p1 += p2 * P16_11;
  for (; i < 15; ++i) {
    acc = p1;
    p1 = Math.floor(acc * INV_62);
    acc = (acc - p1 * 62) * P16_11 + p0;
    p0 = Math.floor(acc * INV_62);
    ret = BASE62[acc - p0 * 62] + ret;
  }
  p0 += p1 * P16_11;
  for (; i < 21; ++i) {
    acc = p0;
    p0 = Math.floor(acc * INV_62);
    ret = BASE62[acc - p0 * 62] + ret;
  }
  return BASE62[p0] + ret;
}
