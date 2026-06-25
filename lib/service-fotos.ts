// lib/service-fotos.ts
import type { ServiceFoto } from "@/lib/types"

const CLOUD  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME   ?? ""
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ""

export const MAX_FOTOS_POR_TIPO = 10 // máx 10 antes + 10 depois

export function uploadServiceFoto(
  file: File,
  userId: string,
  serviceId: string,
  tipo: "antes" | "depois",
  onProgress?: (pct: number) => void
): Promise<ServiceFoto> {
  return new Promise((resolve, reject) => {
    if (!CLOUD || !PRESET) {
      reject(new Error("Cloudinary não configurado. Verifica as variáveis de ambiente."))
      return
    }
    const fd = new FormData()
    fd.append("file", file)
    fd.append("upload_preset", PRESET)
    fd.append("folder", `servicos/${userId}/${serviceId}/${tipo}`)
    fd.append("tags", `servico,${serviceId},${tipo}`)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`)
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status === 200) {
        const d = JSON.parse(xhr.responseText)
        resolve({ url: d.secure_url, publicId: d.public_id, tipo, uploadedAt: new Date().toISOString() })
      } else {
        reject(new Error(`Upload falhou (${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error("Erro de rede no upload."))
    xhr.send(fd)
  })
}

export async function deleteServiceFoto(publicId: string): Promise<void> {
  // Delete client-side não é suportado sem assinatura — removemos apenas a referência local
  console.info("[service-fotos] Removida referência local. publicId:", publicId)
}

export function compressImage(file: File, maxWidth = 1600, quality = 0.82): Promise<File> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement("canvas")
        canvas.width = w; canvas.height = h
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h)
        canvas.toBlob(
          blob => resolve(blob ? new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }) : file),
          "image/jpeg", quality
        )
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}
