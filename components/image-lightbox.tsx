"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"

export function ImageLightbox({
  src,
  alt,
  open,
  onOpenChange,
}: {
  src: string
  alt: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] bg-transparent p-0 ring-0 sm:max-w-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-h-[80svh] w-full rounded-xl object-contain" />
      </DialogContent>
    </Dialog>
  )
}
