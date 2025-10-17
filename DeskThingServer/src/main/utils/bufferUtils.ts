export function bufferToTransferable(buf: Buffer): ArrayBuffer | SharedArrayBuffer {
  const backing = buf.buffer // exact backing buffer -> transfer directly
  if (buf.byteOffset === 0 && buf.byteLength === backing.byteLength) {
    return backing
  }
  // otherwise create an ArrayBuffer with just the slice (copies bytes)
  const out = new ArrayBuffer(buf.byteLength)
  new Uint8Array(out).set(new Uint8Array(backing, buf.byteOffset, buf.byteLength))
  return out
}

export function arrayBufferToBuffer(ab: ArrayBuffer | SharedArrayBuffer): Buffer {
  return Buffer.from(ab)
}

export function copyBuffer(buf: Buffer): Buffer {
  const copy = Buffer.allocUnsafe(buf.length)
  buf.copy(copy)
  return copy
}

/**
 * Encode an appId and append binary payload.
 * Result layout: [4 bytes BE appIdLength][appId UTF-8 bytes][payload bytes]
 * Accepts Buffer | ArrayBuffer | SharedArrayBuffer and returns an ArrayBuffer (transferable).
 */
export function encodeAppId(
  appId: string,
  payload: Buffer | ArrayBuffer | SharedArrayBuffer
): ArrayBuffer {
  const encoder = new TextEncoder()
  const appIdBytes = encoder.encode(appId)
  const appIdLen = appIdBytes.length

  // Create a view for payload bytes without forcing an extra copy where possible
  const payloadView = Buffer.isBuffer(payload)
    ? new Uint8Array(
        (payload as Buffer).buffer,
        (payload as Buffer).byteOffset,
        (payload as Buffer).byteLength
      )
    : new Uint8Array(payload as ArrayBuffer)

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
export function decodeAppId(buffer: Buffer | ArrayBuffer | SharedArrayBuffer): {
  appId: string
  data: ArrayBuffer
} {
  // Normalize to a Uint8Array view referencing the incoming bytes
  const view = Buffer.isBuffer(buffer)
    ? new Uint8Array(
        (buffer as Buffer).buffer,
        (buffer as Buffer).byteOffset,
        (buffer as Buffer).byteLength
      )
    : new Uint8Array(buffer as ArrayBuffer)

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

  const payloadOffset = 4 + appIdLen
  const payloadLen = view.byteLength - payloadOffset
  const data = new ArrayBuffer(payloadLen)
  new Uint8Array(data).set(new Uint8Array(view.buffer, view.byteOffset + payloadOffset, payloadLen))

  return { appId, data }
}
