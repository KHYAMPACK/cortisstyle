const PHOTOROOM_SEGMENT_URL = 'https://sdk.photoroom.com/v1/segment'

function getPhotoroomApiKey(): string {
  const apiKey = process.env.VITE_PHOTOROOM_API_KEY ?? process.env.PHOTOROOM_API_KEY
  if (!apiKey) {
    throw new Error('PHOTOROOM_API_KEY is not configured. Add it to .env.local.')
  }
  return apiKey
}

export async function removeGarmentBackground(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<Buffer> {
  const formData = new FormData()
  formData.append(
    'image_file',
    new Blob([new Uint8Array(buffer)], { type: mimeType }),
    filename,
  )
  formData.append('crop', 'true')
  formData.append('format', 'png')

  const response = await fetch(PHOTOROOM_SEGMENT_URL, {
    method: 'POST',
    headers: { 'x-api-key': getPhotoroomApiKey() },
    body: formData,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText)
    throw new Error(detail || `Photoroom API error (${response.status})`)
  }

  return Buffer.from(await response.arrayBuffer())
}
