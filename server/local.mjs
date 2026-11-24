import { createServer } from "node:http";
import { stat, readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { handle } from "./api.mjs";
import { localState, root } from "./local-state.mjs";
const state = localState(),
  port = Number(process.env.PORT || 4817),
  origin = "http://localhost:" + port;
const directory = resolve(root, "dist");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
};
const vite = process.argv.includes("--dev")
  ? await (
      await import("vite")
    ).createServer({ server: { middlewareMode: true }, appType: "spa" })
  : null;
const server = createServer(async (req, res) => {
  try {
    if (
      req.headers.host !== "localhost:" + port &&
      req.headers.host !== "127.0.0.1:" + port
    ) {
      res.writeHead(403).end();
      return;
    }
    const url = new URL(req.url, "http://" + req.headers.host);
    if (url.pathname.startsWith("/api/")) {
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers))
        if (k !== "cf-connecting-ip" && typeof v === "string")
          headers.set(k, v);
      const options = { method: req.method, headers };
      if (req.method !== "GET" && req.method !== "HEAD") {
        options.body = req;
        options.duplex = "half";
      }
      const reply = await handle(new Request(url, options), state);
      res.writeHead(reply.status, Object.fromEntries(reply.headers));
      res.end(Buffer.from(await reply.arrayBuffer()));
      return;
    }
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (vite) {
      vite.middlewares(req, res);
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405).end();
      return;
    }
    const target = resolve(directory, "." + decodeURIComponent(url.pathname));
    if (target !== directory && !target.startsWith(directory + sep)) {
      res.writeHead(404).end();
      return;
    }
    let filename = target;
    if (!(await stat(target).catch(() => null))?.isFile()) {
      if (extname(target)) {
        res.writeHead(404).end();
        return;
      }
      filename = resolve(directory, "index.html");
    }
    const data = await readFile(filename);
    res.writeHead(200, {
      "Content-Type": mime[extname(filename)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(req.method === "HEAD" ? null : data);
  } catch {
    if (!res.headersSent) res.writeHead(500);
    res.end("Unable to complete this request.");
  }
});
server.on("error", (e) => {
  console.error("Local preview could not start (" + e.code + ").");
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  console.log("Discrete Art Studio preview: " + origin);
  if (process.argv.includes("--open"))
    import("node:child_process").then(({ spawn }) =>
      spawn("open", [origin], { stdio: "ignore", detached: true }).unref(),
    );
});
