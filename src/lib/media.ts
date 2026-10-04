// Shrinks a phone photo to a web-sized JPEG data URL before upload.
export async function compressImage(file: File, maxSide = 1400): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('This photo type is not supported. Use JPG, PNG or WebP.'))
      i.src = url
    })
    let scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    let quality = 0.82
    for (let attempt = 0; attempt < 5; attempt++) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not read this photo')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const out = canvas.toDataURL('image/jpeg', quality)
      if (out.length < 1_500_000) return out
      scale *= 0.8
      quality = Math.max(0.6, quality - 0.08)
    }
    throw new Error('This photo is too large')
  } finally {
    URL.revokeObjectURL(url)
  }
}
