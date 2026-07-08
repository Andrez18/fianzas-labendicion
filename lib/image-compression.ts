/**
 * Comprime/redimensiona una imagen en el navegador antes de subirla.
 * Las fotos de cámara de celular suelen pesar varios MB; esto las
 * reduce a un tamaño razonable (ancho máximo + calidad JPEG) para que
 * la subida sea rápida incluso con mala conexión.
 *
 * Si algo falla (formato no soportado por el canvas, etc.), devuelve el
 * archivo original sin tocar, para no bloquear la subida.
 */
export async function compressImage(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {},
): Promise<File> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.8 } = options

  // Si ya es pequeña, no vale la pena reprocesarla.
  if (file.size <= 400 * 1024) return file

  try {
    const bitmap = await createImageBitmap(file)
    let { width, height } = bitmap

    if (width > maxWidth || height > maxHeight) {
      const scale = Math.min(maxWidth / width, maxHeight / height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
    if (!blob) return file

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg"
    return new File([blob], newName, { type: "image/jpeg" })
  } catch {
    return file
  }
}
