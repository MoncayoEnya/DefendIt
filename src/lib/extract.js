// Reads text from PDF, Word (.docx) or .txt files – all inside the browser, free.
// Scanned PDFs (pages that are only pictures) are read with OCR (Tesseract.js).
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url' // legacy build = works on older phones too

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

const MAX_OCR_PAGES = 60 // OCR is slow on phones, so very long scans are capped

// onProgress(fraction 0-1, label)
export async function extractText(file, onProgress = () => {}) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return extractPdf(file, onProgress)
  if (name.endsWith('.docx')) return extractDocx(file)
  if (name.endsWith('.txt') || name.endsWith('.md')) return file.text()
  if (/\.(png|jpe?g|webp)$/.test(name)) return ocrImages([file], onProgress)
  throw new Error('Please upload a PDF, Word (.docx), .txt or a photo of your pages.')
}

const hasText = (t) => t.replace(/\s/g, '').length >= 200

async function extractPdf(file, onProgress) {
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    let lastY = null
    let line = ''
    const lines = []
    for (const item of content.items) {
      const y = item.transform?.[5]
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line)
        line = ''
      }
      line += item.str
      lastY = y
    }
    lines.push(line)
    pages.push(lines.join('\n'))
    onProgress(i / pdf.numPages, 'Reading your file')
  }
  const text = pages.join('\n\n')
  if (hasText(text)) return text
  // No selectable text: this is a scanned PDF, so read the page images.
  return ocrPdf(pdf, onProgress)
}

async function ocrPdf(pdf, onProgress) {
  const total = Math.min(pdf.numPages, MAX_OCR_PAGES)
  const worker = await makeWorker(onProgress)
  try {
    const out = []
    for (let i = 1; i <= total; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 2 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: canvas.getContext('2d'), viewport, canvas }).promise
      const { data } = await worker.recognize(canvas)
      out.push(data.text)
      onProgress(i / total, `Scanned PDF detected · reading page ${i} of ${total}`)
      canvas.width = canvas.height = 0
    }
    const text = out.join('\n\n')
    if (!hasText(text)) throw new Error('Could not read text from this scan. Try a clearer scan or a Word file.')
    return text
  } finally {
    await worker.terminate()
  }
}

async function ocrImages(files, onProgress) {
  const worker = await makeWorker(onProgress)
  try {
    const out = []
    for (let i = 0; i < files.length; i++) {
      const { data } = await worker.recognize(files[i])
      out.push(data.text)
      onProgress((i + 1) / files.length, `Reading image ${i + 1} of ${files.length}`)
    }
    return out.join('\n\n')
  } finally {
    await worker.terminate()
  }
}

async function makeWorker(onProgress) {
  onProgress(0, 'Scanned PDF detected · loading text reader')
  const { createWorker } = await import('tesseract.js')
  const base = new URL(`${import.meta.env.BASE_URL}ocr/`, location.href).href
  try {
    // 1st choice: OCR files bundled with the app (works offline, no outside servers)
    return await createWorker('eng', 1, { workerPath: `${base}worker.min.js`, corePath: base, langPath: base.replace(/\/$/, ''), gzip: true })
  } catch {
    try {
      // fallback: Tesseract's public CDN
      return await createWorker('eng', 1)
    } catch {
      throw new Error('The text reader could not load. Check your internet connection and try again.')
    }
  }
}

async function extractDocx(file) {
  const mammoth = (await import('mammoth/mammoth.browser.js')).default
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return value
}
