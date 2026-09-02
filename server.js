"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

/* carrega .env ANTES do core-ai ler as credenciais */
function loadEnv() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 1) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    /* sem .env — usa apenas variáveis do sistema */
  }
}
loadEnv();

const { generatePhrase, gerarLegenda, configuredProviders } = require("./functions/_lib/core-ai");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const PORT = process.env.PORT || 8001;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
};

function send(res, status, contentType, body) {
  const headers = Object.assign({ "Content-Type": contentType }, SECURITY_HEADERS);
  res.writeHead(status, headers);
  res.end(body);
}

function readBody(req, limit = 1e5) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("Payload muito grande."));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleApi(req, res) {
  if (req.method === "GET" && req.url.endsWith("/api/status")) {
    const procs = configuredProviders();
    send(res, 200, "application/json; charset=utf-8", JSON.stringify({
      ok: true,
      nome: "Alvorada do Céu",
      categorias: require("./functions/_lib/core-ai").CATEGORIAS.length,
      provedores: procs
    }));
    return;
  }
  if (req.method !== "POST") {
    send(res, 405, "text/plain; charset=utf-8", "Método não permitido.");
    return;
  }
  let body = {};
  try {
    const raw = await readBody(req);
    body = raw ? JSON.parse(raw) : {};
  } catch {
    send(res, 400, "application/json; charset=utf-8", JSON.stringify({ ok: false, error: "JSON inválido." }));
    return;
  }
  try {
    const result = req.url.endsWith("/api/legenda")
      ? await gerarLegenda(body)
      : await generatePhrase(body);
    send(res, 200, "application/json; charset=utf-8", JSON.stringify({ ok: true, ...result }));
  } catch (e) {
    send(res, 500, "application/json; charset=utf-8", JSON.stringify({ ok: false, error: e && e.message ? e.message : "Erro interno." }));
  }
}

function serveStatic(urlPath, res) {
  let p = urlPath;
  if (p === "/" || p === "") p = "/index.html";
  const file = path.normalize(path.join(PUBLIC_DIR, path.normalize(p)));
  if (!file.startsWith(PUBLIC_DIR)) {
    send(res, 403, "text/plain; charset=utf-8", "Proibido.");
    return;
  }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      fs.readFile(path.join(PUBLIC_DIR, "404.html"), (err404, content404) => {
        send(res, 404, "text/html; charset=utf-8", err404 ? "404" : content404);
      });
      return;
    }
    const ext = path.extname(file).toLowerCase();
    fs.readFile(file, (errFile, content) => {
      if (errFile) {
        send(res, 404, "text/plain; charset=utf-8", "Not found");
        return;
      }
      send(res, 200, MIME[ext] || "application/octet-stream", content);
    });
  });
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");
  if (u.pathname.startsWith("/api/")) {
    handleApi(req, res);
    return;
  }
  if (u.pathname.startsWith("/.") || u.pathname.includes("..")) {
    send(res, 403, "text/plain; charset=utf-8", "Proibido.");
    return;
  }
  serveStatic(u.pathname, res);
});

server.listen(PORT, () => {
  console.log("Alvorada do Céu — gerador de frases");
  console.log("  Local: http://localhost:" + PORT);
  console.log("  API  : POST /api/frase");
});