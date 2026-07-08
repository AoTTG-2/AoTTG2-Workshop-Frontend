import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, RotateCcw, UploadCloud, X } from "lucide-react";
import { Button } from "@aottg2/ui";
import { getAccessToken } from "@/auth/storage";
import { uploadWorkshopFile, type UploadedWorkshopFileReference, type WorkshopUploadAssetType } from "@/lib/api/workshop";
import { toast } from "@/lib/toast";

type UploadStatus = "idle" | "selected" | "uploading" | "uploaded" | "failed" | "expired";

interface WorkshopFileUploadControlProps {
  accept?: string;
  assetType: WorkshopUploadAssetType;
  disabled?: boolean;
  label: string;
  onBusyChange?: (busy: boolean) => void;
  onReferenceChange?: (reference: UploadedWorkshopFileReference | null) => void;
  required?: boolean;
}

export function WorkshopFileUploadControl({
  accept,
  assetType,
  disabled = false,
  label,
  onBusyChange,
  onReferenceChange,
  required = false,
}: WorkshopFileUploadControlProps) {
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState("");
  const busy = status === "uploading";

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  function selectFile(nextFile: globalThis.File | null) {
    setFile(nextFile);
    setProgress(0);
    setMessage("");
    setStatus(nextFile ? "selected" : "idle");
    onReferenceChange?.(null);
  }

  async function startUpload() {
    if (!file || disabled || busy) return;

    const token = getAccessToken();
    if (!token) {
      toast.info("Sign in required.", { description: "Sign in before uploading Workshop files." });
      return;
    }

    try {
      setStatus("uploading");
      setMessage("");
      const reference = await uploadWorkshopFile(token, assetType, file, setProgress);
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

  const statusStyle = status === "uploaded"
    ? "text-emerald-300"
    : status === "failed" || status === "expired" || (required && !file)
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
          <p className={`mt-1 text-xs ${statusStyle}`}>{statusLabel(status, required, file, message)}</p>
        </div>
        {file ? (
          <Button type="button" variant="ghost" size="icon" disabled={busy} onClick={removeFile} aria-label="Remove selected file">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <input
        type="file"
        accept={accept}
        disabled={disabled || busy}
        onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
        className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      />

      {file ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="min-w-0 break-all">{file.name}</span>
            <span>{formatBytes(file.size)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden bg-muted" aria-label="Upload progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} role="progressbar">
            <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusIcon status={status} />
            <div className="flex flex-wrap gap-2">
              {status === "failed" || status === "expired" ? (
                <Button type="button" variant="secondary" disabled={disabled || busy} onClick={() => void startUpload()}>
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Retry
                </Button>
              ) : null}
              {status !== "uploaded" ? (
                <Button type="button" disabled={disabled || busy || !file} onClick={() => void startUpload()}>
                  {busy ? "Uploading..." : "Upload"}
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

function statusLabel(status: UploadStatus, required: boolean, file: globalThis.File | null, message: string) {
  if (message) return message;
  if (status === "uploading") return "Uploading...";
  if (status === "selected") return "Ready to upload";
  if (status === "uploaded") return "Uploaded";
  if (required && !file) return "File required";
  return "No file selected";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
