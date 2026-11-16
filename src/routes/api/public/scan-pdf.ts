import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/scan-pdf")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["OVERRIDE_SECRET"];
        if (!secret || secret.length < 32) return Response.json({ error: "Screening service is not configured." }, { status: 503 });
        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength > 26 * 1024 * 1024) return Response.json({ error: "PDF is too large (max 25 MB)." }, { status: 413 });
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { resolveActorId, screenPdfContent, resumeApprovedPdf } = await import("@/lib/screening.server");
          const actorId = await resolveActorId(supabaseAdmin, request.headers.get("authorization"), request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "", secret);
          const form = await request.formData();
          const candidate = form.get("file");
          if (!(candidate instanceof File)) return Response.json({ error: "Choose a PDF to scan." }, { status: 400 });
          if (candidate.size > 25 * 1024 * 1024) return Response.json({ error: "PDF is too large (max 25 MB)." }, { status: 413 });
          const bytes = new Uint8Array(await candidate.arrayBuffer());
          const token = form.get("overrideToken");
          const result = typeof token === "string" && token
            ? await resumeApprovedPdf(supabaseAdmin, actorId, bytes, candidate.name, token, secret)
            : await screenPdfContent(supabaseAdmin, actorId, bytes, candidate.name, secret);
          return Response.json(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : "The PDF could not be screened.";
          return Response.json({ error: message }, { status: /unauthorized/i.test(message) ? 401 : 400 });
        }
      },
    },
  },
});
