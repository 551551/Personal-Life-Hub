// Checksums detect accidental corruption, not malicious modification.
export function checksum(text: string) {
  let value = 2166136261
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619)
  return (value >>> 0).toString(16)
}

export function byteLength(text: string) {
  let bytes = 0
  for (const char of text) {
    const code = char.codePointAt(0)!
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4
  }
  return bytes
}

export function splitSnapshot(text: string) {
  // 64K UTF-16 units remain below 1MB even when JSON escapes every unit.
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += 65536) chunks.push(text.slice(i, i + 65536))
  return chunks
}
