import { useEffect, useRef, useState, type DragEvent } from "react";
import { AlertCircle, CheckCircle2, RotateCcw, UploadCloud, X } from "lucide-react";
import { Button } from "@aottg2/ui";
import { getAccessToken } from "@/auth/storage";
import { uploadWorkshopFile, type UploadedWorkshopFileReference, type WorkshopUploadAssetType } from "@/lib/api/workshop";
import { toast } from "@/lib/toast";

type UploadStatus = "idle" | "selected" | "uploading" | "uploaded" | "failed" | "expired";

interface WorkshopFileUploadControlProps {
  accept?: string;
  allowedExtensions?: readonly string[];
  assetType: WorkshopUploadAssetType;
  disabled?: boolean;
  label: string;
  onBusyChange?: (busy: boolean) => void;
  onReferenceChange?: (reference: UploadedWorkshopFileReference | null) => void;
  reference?: DisplayUploadReference | null;
  required?: boolean;
}

interface DisplayUploadReference {
  uploadId?: string;
  filename?: string;
  sizeBytes?: number;
}

export function WorkshopFileUploadControl({
  accept,
  allowedExtensions = [],
  assetType,
  disabled = false,
  label,
  onBusyChange,
  onReferenceChange,
  reference = null,
  required = false,
}: WorkshopFileUploadControlProps) {
  const inputRef = useRef<globalThis.HTMLInputElement | null>(null);
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState("");
  const busy = status === "uploading";
  const hasReference = Boolean(reference?.uploadId);
  const displayName = file?.name ?? reference?.filename ?? "";
  const displaySize = file ? file.size : reference?.sizeBytes;
  const displayProgress = hasReference && !file ? 100 : progress;
  const ready = status === "uploaded" || (hasReference && !file);

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  function selectFile(nextFile: globalThis.File | null) {
    if (nextFile && !isAllowedFile(nextFile, allowedExtensions)) {
      const extensionList = allowedExtensions.join(", ");
      const errorMessage = extensionList ? `File must use ${extensionList}` : "File type is not allowed";
      setFile(null);
      setProgress(0);
      setMessage(errorMessage);
      setStatus("failed");
      onReferenceChange?.(null);
      if (inputRef.current) inputRef.current.value = "";
      toast.error("File not allowed", { description: errorMessage, id: "workshop-file-upload-error" });
      return;
    }

    setFile(nextFile);
    if (!nextFile && inputRef.current) inputRef.current.value = "";
    setProgress(0);
    setMessage("");
    setStatus(nextFile ? "selected" : "idle");
    onReferenceChange?.(null);
    if (nextFile) void startUpload(nextFile);
  }

  async function startUpload(uploadFile = file) {
    if (!uploadFile || disabled || busy) return;

    const token = getAccessToken();
    if (!token) {
      toast.info("Sign in required.", { description: "Sign in before uploading Workshop files." });
      return;
    }

    try {
      setStatus("uploading");
      setMessage("");
      const reference = await uploadWorkshopFile(token, assetType, uploadFile, setProgress);
      setProgress(100);
      setStatus("uploaded");
      setMessage("Uploaded");
      onReferenceChange?.(reference);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed. Retry the upload.";
      const expired = errorMessage.toLowerCase().includes("expired");
      setStatus(expired ? "expired" : "failed");
      setMessage(expired ? "Upload expired. Re-upload the file." : errorMessage);
      onReferenceChange?.(null);
      toast.error("Upload failed", { description: errorMessage, id: "workshop-file-upload-error" });
    }
  }

  function removeFile() {
    if (busy) return;
    selectFile(null);
  }

  function handleDrop(event: DragEvent<globalThis.HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    if (disabled || busy) return;
    selectFile(event.dataTransfer.files[0] ?? null);
  }

  const statusStyle = ready
    ? "text-emerald-300"
    : status === "failed" || status === "expired" || (required && !file && !hasReference)
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <div className="grid gap-3 border border-border bg-card/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase text-foreground">
            <UploadCloud className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </div>
          <p className={`mt-1 text-xs ${statusStyle}`}>{statusLabel(status, required, file, hasReference, message)}</p>
        </div>
        {file || hasReference ? (
          <Button type="button" variant="ghost" size="icon" disabled={busy} onClick={removeFile} aria-label="Remove selected file">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled || busy}
        onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
        className="sr-only"
      />

      <div
        className={`grid min-h-28 place-items-center border border-dashed px-4 py-6 text-center transition-colors ${dragActive ? "border-primary bg-primary/10" : "border-border bg-background/60"} ${disabled || busy ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        onClick={() => {
          if (!disabled && !busy) inputRef.current?.click();
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled && !busy) setDragActive(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled || busy ? -1 : 0}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !disabled && !busy) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <div className="grid gap-3">
          <UploadCloud className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden="true" />
          <div className="text-sm text-foreground">Drop file here</div>
          <Button type="button" variant="secondary" disabled={disabled || busy} onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}>
            Browse
          </Button>
        </div>
      </div>

      {file || hasReference ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="min-w-0 break-all">{displayName}</span>
            <span>{displaySize == null ? null : formatBytes(displaySize)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden bg-muted" aria-label="Upload progress" aria-valuenow={displayProgress} aria-valuemin={0} aria-valuemax={100} role="progressbar">
            <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${displayProgress}%` }} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusIcon status={hasReference && !file ? "uploaded" : status} />
            <div className="flex flex-wrap gap-2">
              {status === "failed" || status === "expired" ? (
                <Button type="button" variant="secondary" disabled={disabled || busy} onClick={() => void startUpload()}>
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Retry
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusIcon({ status }: { status: UploadStatus }) {
  if (status === "uploaded") {
    return <span className="inline-flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Ready</span>;
  }
  if (status === "failed" || status === "expired") {
    return <span className="inline-flex items-center gap-2 text-xs text-destructive"><AlertCircle className="h-4 w-4" aria-hidden="true" />Needs retry</span>;
  }
  return <span className="text-xs text-muted-foreground">Waiting</span>;
}

function statusLabel(status: UploadStatus, required: boolean, file: globalThis.File | null, hasReference: boolean, message: string) {
  if (message) return message;
  if (hasReference && !file) return "Uploaded";
  if (status === "uploading") return "Uploading...";
  if (status === "selected") return "Ready to upload";
  if (status === "uploaded") return "Uploaded";
  if (required && !file && !hasReference) return "File required";
  return "No file selected";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAllowedFile(file: globalThis.File, allowedExtensions: readonly string[]) {
  if (allowedExtensions.length === 0) return true;
  const name = file.name.toLowerCase();
  return allowedExtensions.some((extension) => name.endsWith(extension.toLowerCase()));
}
