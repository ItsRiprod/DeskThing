export function copyArrayBuffer(buf: ArrayBuffer | SharedArrayBuffer): ArrayBuffer {
  const src = new Uint8Array(buf)
  const out = new ArrayBuffer(src.byteLength)
  new Uint8Array(out).set(src)
  return out
}

/**
 * Encode an appId and append binary payload.
 * Result layout: [4 bytes BE appIdLength][appId UTF-8 bytes][payload bytes]
 * Accepts ArrayBuffer | SharedArrayBuffer and returns an ArrayBuffer (transferable).
 */
export function encodeAppId(appId: string, payload: ArrayBuffer | SharedArrayBuffer): ArrayBuffer {
  const encoder = new TextEncoder()
  const appIdBytes = encoder.encode(appId)
  const appIdLen = appIdBytes.length

  // Create a view for payload bytes without forcing an extra copy where possible
  const payloadView = new Uint8Array(payload as ArrayBuffer)

  const total = 4 + appIdLen + payloadView.byteLength
  const out = new ArrayBuffer(total)
  const dv = new DataView(out)
  // big-endian
  dv.setUint32(0, appIdLen, false)
  const outU8 = new Uint8Array(out)
  outU8.set(appIdBytes, 4)
  outU8.set(payloadView, 4 + appIdLen)
  return out
}

/**
 * Decode an encoded buffer created by encodeAppId.
 * Returns { appId, data } where data is an ArrayBuffer containing only the payload bytes.
 * Accepts Buffer | ArrayBuffer | SharedArrayBuffer.
 */
export function decodeAppId(buffer: ArrayBuffer): {
  appId: string
  // return an ArrayBuffer containing only the payload bytes (copy)
  data: ArrayBuffer
} {
  // view referencing the incoming bytes (no copy)
  const view = new Uint8Array(buffer as ArrayBuffer)

  if (view.byteLength < 4) {
    throw new Error('Buffer too small to contain appId length')
  }

  const dv = new DataView(view.buffer, view.byteOffset, view.byteLength)
  const appIdLen = dv.getUint32(0, false) // big-endian

  if (4 + appIdLen > view.byteLength) {
    throw new Error('Invalid appId length (exceeds buffer)')
  }

  const appIdBytes = new Uint8Array(view.buffer, view.byteOffset + 4, appIdLen)
  const decoder = new TextDecoder()
  const appId = decoder.decode(appIdBytes)

  const payloadOffset = view.byteOffset + 4 + appIdLen
  const payloadLen = view.byteLength - (4 + appIdLen)
  // return an ArrayBuffer containing only the payload bytes (copy)
  const data = view.buffer.slice(payloadOffset, payloadOffset + payloadLen)

  return { appId, data }
}
