import { jsonAuthInit, workshopJson } from "./http";

export type WorkshopUploadAssetType = "map" | "custom_logic" | "addon";

export interface PresignWorkshopUploadRequest {
  assetType: WorkshopUploadAssetType;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface PresignedWorkshopUpload {
  uploadId: string;
  method: string;
  url: string;
  fields: Record<string, string>;
  objectKey: string;
  expiresAt: string;
}

export interface WorkshopUploadSession {
  uploadId: string;
  status: string;
  objectKey: string;
  expiresAt: string;
  completedAt?: string | null;
}

export interface UploadedWorkshopFileReference {
  uploadId: string;
  key: string;
  objectKey: string;
  filename: string;
  sizeBytes: number;
  contentType: string;
}

export async function presignWorkshopUpload(accessToken: string, request: PresignWorkshopUploadRequest): Promise<PresignedWorkshopUpload> {
  return workshopJson<PresignedWorkshopUpload>("/uploads/presign", jsonAuthInit("POST", accessToken, request));
}

export async function completeWorkshopUpload(accessToken: string, uploadId: string): Promise<WorkshopUploadSession> {
  return workshopJson<WorkshopUploadSession>("/uploads/complete", jsonAuthInit("POST", accessToken, { uploadId }));
}

export async function uploadWorkshopFile(
  accessToken: string,
  assetType: WorkshopUploadAssetType,
  file: globalThis.File,
  onProgress?: (progress: number) => void,
): Promise<UploadedWorkshopFileReference> {
  const contentType = normalizeContentType(file.type);
  const target = await presignWorkshopUpload(accessToken, {
    assetType,
    filename: file.name,
    contentType,
    sizeBytes: file.size,
  });

  await uploadFileToTarget(target, file, contentType, onProgress);
  await completeWorkshopUpload(accessToken, target.uploadId);

  return {
    uploadId: target.uploadId,
    key: target.objectKey,
    objectKey: target.objectKey,
    filename: file.name,
    sizeBytes: file.size,
    contentType,
  };
}

function uploadFileToTarget(
  target: PresignedWorkshopUpload,
  file: globalThis.File,
  contentType: string,
  onProgress?: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new globalThis.XMLHttpRequest();
    xhr.open(target.method || "PUT", target.url);
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(xhr.responseText || `Upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and retry."));
    xhr.ontimeout = () => reject(new Error("Upload timed out. Retry the upload."));

    if (target.method.toUpperCase() === "POST" && Object.keys(target.fields).length > 0) {
      const form = new globalThis.FormData();
      for (const [key, value] of Object.entries(target.fields)) form.append(key, value);
      form.append("file", file);
      xhr.send(form);
      return;
    }

    xhr.setRequestHeader("content-type", contentType);
    xhr.send(file);
  });
}

function normalizeContentType(contentType: string) {
  return contentType.trim() || "application/octet-stream";
}
