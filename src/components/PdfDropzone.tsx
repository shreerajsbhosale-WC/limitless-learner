import { useCallback, useRef, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sanitizeFilename, validatePdfFile } from "@/lib/security";

type Props = {
  onFile: (file: File) => void;
  busy: boolean;
  status?: string;
};

export function PdfDropzone({ onFile, busy, status }: Props) {
  const [drag, setDrag] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      setChecking(true);
      try {
        const result = await validatePdfFile(file);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setFileName(sanitizeFilename(file.name));
        onFile(file);
      } finally {
        setChecking(false);
      }
    },
    [onFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files?.[0]);
      }}
      className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-all glass ${
        drag ? "border-primary shadow-glow scale-[1.01]" : "border-border"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />

      <div className="mx-auto size-16 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow mb-5">
        {busy || checking ? (
          <Loader2 className="size-7 text-primary-foreground animate-spin" />
        ) : fileName ? (
          <FileText className="size-7 text-primary-foreground" />
        ) : (
          <Upload className="size-7 text-primary-foreground" />
        )}
      </div>

      <h3 className="font-display text-xl font-semibold mb-1">
        {busy ? "Working its magic…" : fileName ?? "Drop your PDF here"}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {busy
          ? status ?? "Hang tight"
          : "Or click to browse. Up to 25 MB, 60 pages."}
      </p>

      {!busy && (
        <Button
          onClick={() => inputRef.current?.click()}
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
        >
          Choose PDF
        </Button>
      )}
    </div>
  );
}
