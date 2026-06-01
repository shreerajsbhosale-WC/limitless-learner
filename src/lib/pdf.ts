// Client-side PDF text extraction. Imports are dynamic so pdfjs-dist
// (which touches browser-only APIs at module scope) never loads during SSR.
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url"))
    .default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const chunks: string[] = [];
  const maxPages = Math.min(pdf.numPages, 60);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it: unknown) => {
        const item = it as { str?: string };
        return item.str ?? "";
      })
      .join(" ");
    chunks.push(text);
  }
  return chunks.join("\n\n").replace(/\s+/g, " ").trim();
}
