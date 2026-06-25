// lib/service-fotos.ts
// Upload/delete de fotos de serviço via Cloudinary — mesmo padrão que obras-service.ts

import type { ServiceFoto } from "@/lib/types"

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ""
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ""

export const MAX_FOTOS_POR_TIPO = 2 // máx 2 "antes" e 2 "depois"

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

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", PRESET)
    formData.append("folder", `servicos/${userId}/${serviceId}/${tipo}`)
    formData.append("tags", `servico,${serviceId},${tipo}`)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`)

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          tipo,
          uploadedAt: new Date().toISOString(),
        })
      } else {
        reject(new Error(`Upload falhou (${xhr.status}): ${xhr.statusText}`))
      }
    }

    xhr.onerror = () => reject(new Error("Erro de rede no upload da foto."))
    xhr.send(formData)
  })
}

export async function deleteServiceFoto(publicId: string): Promise<void> {
  // Cloudinary não permite delete direto do browser sem assinatura (segurança).
  // Para manter o mesmo padrão das obras (que também não fazem delete do browser),
  // apenas removemos a referência local. O public_id fica registado para
  // limpeza futura via webhook/cron se necessário.
  console.info("[service-fotos] Foto removida localmente. publicId:", publicId)
}

// Comprime a imagem antes do upload para economizar storage
export function compressImage(
  file: File,
  maxWidth = 1600,
  quality = 0.82
): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)

        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h)

        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }))
            } else {
              resolve(file) // fallback sem compressão
            }
          },
          "image/jpeg",
          quality
        )
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}
