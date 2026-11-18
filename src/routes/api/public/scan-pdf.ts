import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/scan-pdf")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["OVERRIDE_SECRET"];
        if (!secret || secret.length < 32) return Response.json({ error: "Screening service is not configured." }, { status: 503 });
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { resolveActorId, screenPdfContent, resumeApprovedPdf } = await import("@/lib/screening.server");
          const { enforceGuestRateLimit } = await import("@/lib/rate-limit.server");
          await enforceGuestRateLimit("screening");
          const actorId = await resolveActorId(supabaseAdmin, request.headers.get("authorization"), request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "", secret);
          const filename = (request.headers.get("x-file-name") ?? "upload.pdf").slice(0, 128);
          const maxBytes = 25 * 1024 * 1024;
          const contentLength = Number(request.headers.get("content-length") ?? 0);
          if (contentLength > maxBytes) return Response.json({ error: "PDF is too large (max 25 MB)." }, { status: 413 });
          const reader = request.body?.getReader();
          if (!reader) return Response.json({ error: "Choose a PDF to scan." }, { status: 400 });
          const chunks: Uint8Array[] = [];
          let total = 0;
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            total += part.value.byteLength;
            if (total > maxBytes) {
              await reader.cancel();
              return Response.json({ error: "PDF is too large (max 25 MB)." }, { status: 413 });
            }
            chunks.push(part.value);
          }
          const bytes = new Uint8Array(total);
          let offset = 0;
          for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
          const token = request.headers.get("x-screening-override");
          const result = typeof token === "string" && token
            ? await resumeApprovedPdf(supabaseAdmin, actorId, bytes, filename, token, secret)
            : await screenPdfContent(supabaseAdmin, actorId, bytes, filename, secret);
          return Response.json(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : "The PDF could not be screened.";
          return Response.json({ error: message }, { status: /unauthorized/i.test(message) ? 401 : 400 });
        }
      },
    },
  },
});
