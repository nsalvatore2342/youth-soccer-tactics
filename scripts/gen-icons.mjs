// Generates public/icon-192.png and public/icon-512.png
// Uses only Node.js built-ins — no npm dependencies needed.
import { writeFileSync, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'

// --- CRC32 ---
const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
  crcTable[i] = c
}
function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const byte of buf) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xFF]
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcVal = Buffer.alloc(4)
  crcVal.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])))
  return Buffer.concat([len, typeBytes, data, crcVal])
}

// RGBA PNG with a green rounded-rect background and a white soccer field stripe
function makePNG(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8  // bit depth
  ihdrData[9] = 6  // color type: RGBA
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0

  // Draw pixels: green rounded square with a white diagonal stripe
  const radius = size * 0.22
  const pixels = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const dx = Math.min(x, size - 1 - x)
      const dy = Math.min(y, size - 1 - y)
      // Rounded corners via distance from corner arc
      let alpha = 255
      if (dx < radius && dy < radius) {
        const dist = Math.sqrt((radius - dx) ** 2 + (radius - dy) ** 2)
        alpha = dist <= radius ? 255 : 0
      }
      // Green background (#16a34a)
      let r = 22, g = 163, b = 74
      // White center stripe (soccer field center line area)
      const cx = size / 2
      const cy = size / 2
      const stripe = size * 0.04
      if (Math.abs(y - cy) < stripe) { r = 255; g = 255; b = 255 }
      // White center circle outline
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      const circleR = size * 0.22
      if (dist >= circleR - stripe && dist <= circleR + stripe) { r = 255; g = 255; b = 255 }

      pixels[idx]     = r
      pixels[idx + 1] = g
      pixels[idx + 2] = b
      pixels[idx + 3] = alpha
    }
  }

  // Build raw scanlines with filter byte
  const rawData = Buffer.alloc(size * (1 + size * 4))
  for (let y = 0; y < size; y++) {
    rawData[y * (1 + size * 4)] = 0
    pixels.copy(rawData, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4)
  }

  const idat = chunk('IDAT', deflateSync(rawData))
  const iend = chunk('IEND', Buffer.alloc(0))
  return Buffer.concat([sig, chunk('IHDR', ihdrData), idat, iend])
}

mkdirSync('public', { recursive: true })
writeFileSync('public/icon-192.png', makePNG(192))
writeFileSync('public/icon-512.png', makePNG(512))
console.log('Icons created: public/icon-192.png, public/icon-512.png')
