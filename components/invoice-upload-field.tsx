"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { compressImage } from "@/lib/image-compression"
import { Camera, ImagePlus, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 MB antes de comprimir

export function InvoiceUploadField({
  existingUrl = null,
  onFileSelected,
  onRemove,
}: {
  existingUrl?: string | null
  onFileSelected: (file: File) => void
  onRemove: () => void
}) {
  const [preview, setPreview] = useState<string | null>(existingUrl)
  const [fileName, setFileName] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (rawFile: File | undefined) => {
    if (!rawFile) return

    if (!rawFile.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen (jpg, png, etc.)")
      return
    }
    if (rawFile.size > MAX_FILE_SIZE) {
      toast.error("La imagen es demasiado pesada (máximo 15 MB).")
      return
    }

    setProcessing(true)
    try {
      const compressed = await compressImage(rawFile)
      setFileName(compressed.name)
      setPreview(URL.createObjectURL(compressed))
      onFileSelected(compressed)
    } catch {
      toast.error("No se pudo procesar la imagen, intenta con otra foto.")
    } finally {
      setProcessing(false)
    }
  }

  const handleClear = () => {
    setPreview(null)
    setFileName(null)
    onRemove()
    if (cameraInputRef.current) cameraInputRef.current.value = ""
    if (galleryInputRef.current) galleryInputRef.current.value = ""
  }

  return (
    <div className="grid gap-2">
      {preview ? (
        <div className="relative overflow-hidden rounded-lg border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Vista previa de la factura" className="max-h-56 w-full object-contain" />
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute right-2 top-2 shadow"
            onClick={handleClear}
            aria-label="Quitar imagen"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 justify-center"
            disabled={processing}
            onClick={() => cameraInputRef.current?.click()}
          >
            {processing ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            Tomar foto
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 justify-center"
            disabled={processing}
            onClick={() => galleryInputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            Galería
          </Button>
        </div>
      )}

      {fileName && <p className="truncate text-xs text-muted-foreground">Nueva foto: {fileName}</p>}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
