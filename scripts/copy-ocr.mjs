// Copies the OCR engine and English language data into public/ocr,
// so scanned PDFs can be read from your own site (and offline) without any outside CDN.
// Runs automatically after "npm install".
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'ocr')
mkdirSync(out, { recursive: true })

const files = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js'],
  ['node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'eng.traineddata.gz'],
]

let copied = 0
for (const [from, to] of files) {
  const src = join(root, from)
  if (existsSync(src)) {
    copyFileSync(src, join(out, to))
    copied++
  } else {
    console.warn(`[copy-ocr] missing ${from} – scanned PDFs will fall back to the online CDN`)
  }
}
console.log(`[copy-ocr] ${copied}/${files.length} OCR files ready in public/ocr`)
