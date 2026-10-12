// Reads text from PDF, Word (.docx) or .txt files – all inside the browser, free.
import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export async function extractText(file, onProgress = () => {}) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return extractPdf(file, onProgress)
  if (name.endsWith('.docx')) return extractDocx(file)
  if (name.endsWith('.txt') || name.endsWith('.md')) return file.text()
  throw new Error('Please upload a PDF, Word (.docx) or .txt file.')
}

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
    onProgress(i / pdf.numPages)
  }
  const text = pages.join('\n\n')
  if (text.replace(/\s/g, '').length < 200) {
    throw new Error('This PDF looks like scanned images (no selectable text). Try exporting it as a text PDF or Word file.')
  }
  return text
}

async function extractDocx(file) {
  const mammoth = (await import('mammoth/mammoth.browser.js')).default
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return value
}
