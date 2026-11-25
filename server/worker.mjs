import { handle } from "./api.mjs";
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) {
      const r = await env.ASSETS.fetch(request);
      const response = new Response(r.body, r);
      response.headers.set("Referrer-Policy", "no-referrer");
      response.headers.set("X-Content-Type-Options", "nosniff");
      return response;
    }
    if (!env.DB || !env.FORM_TIMING_SECRET)
      return Response.json(
        { error: "Studio service is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    const db = {
      first: (s, ...a) =>
        env.DB.prepare(s)
          .bind(...a)
          .first(),
      all: async (s, ...a) =>
        (
          await env.DB.prepare(s)
            .bind(...a)
            .all()
        ).results,
      run: async (s, ...a) =>
        (
          await env.DB.prepare(s)
            .bind(...a)
            .run()
        ).meta,
    };
    return handle(request, { db, secret: env.FORM_TIMING_SECRET });
  },
};
