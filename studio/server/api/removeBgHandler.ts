import type { IncomingMessage, ServerResponse } from 'node:http'
import Busboy from 'busboy'
import { removeGarmentBackground } from '../lib/photoroomBgRemoval.js'

interface ParsedUpload {
  fileBuffer?: Buffer
  filename?: string
  mimeType?: string
  imageUrl?: string
}

function parseMultipart(req: IncomingMessage): Promise<ParsedUpload> {
  return new Promise((resolve, reject) => {
    const result: ParsedUpload = {}
    const busboy = Busboy({ headers: req.headers })

    busboy.on('file', (fieldname, file, info) => {
      if (fieldname !== 'image') return
      const chunks: Buffer[] = []
      file.on('data', (chunk: Buffer) => chunks.push(chunk))
      file.on('end', () => {
        result.fileBuffer = Buffer.concat(chunks)
        result.filename = info.filename
        result.mimeType = info.mimeType
      })
    })

    busboy.on('field', (name, value) => {
      if (name === 'imageUrl') result.imageUrl = value
    })

    busboy.on('error', reject)
    busboy.on('finish', () => resolve(result))
    req.pipe(busboy)
  })
}

async function resolveImageBuffer(parsed: ParsedUpload): Promise<{
  buffer: Buffer
  filename: string
  mimeType: string
}> {
  if (parsed.fileBuffer) {
    return {
      buffer: parsed.fileBuffer,
      filename: parsed.filename ?? 'clipboard-asset.png',
      mimeType: parsed.mimeType ?? 'image/png',
    }
  }

  if (parsed.imageUrl) {
    const response = await fetch(parsed.imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch clipboard image URL (${response.status})`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    return {
      buffer: Buffer.from(arrayBuffer),
      filename: 'remote-asset.jpg',
      mimeType: contentType,
    }
  }

  throw new Error('No image file or URL provided')
}

export async function handleRemoveBg(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const parsed = await parseMultipart(req)
    const { buffer, filename, mimeType } = await resolveImageBuffer(parsed)
    const result = await removeGarmentBackground(buffer, filename, mimeType)

    res.statusCode = 200
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-store')
    res.end(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Background removal failed'
    console.error('[remove-bg]', message)
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(message)
  }
}
