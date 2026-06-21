import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { webcrypto } from 'crypto'

global.TextEncoder = TextEncoder as typeof global.TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder
Object.defineProperty(global, 'crypto', { value: webcrypto, writable: true })

// File.arrayBuffer polyfill: copy data through Buffer so Node.js webcrypto accepts it
if (!File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = function (): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        // Convert jsdom ArrayBuffer → Node Buffer → clean ArrayBuffer
        const buf = Buffer.from(new Uint8Array(reader.result as ArrayBuffer))
        resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(this)
    })
  }
}
