const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { EdgeTTS } = require("@andresaya/edge-tts");

const ROOT = __dirname;
/* estáticos ficam em public/ — a raiz contém apenas código e segredos */
const PUBLIC_DIR = path.join(ROOT, "public");
const PORT = process.env.PORT || 8001;

/* ---------------- carregamento de .env (sem dependências) ---------------- */
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
  } catch (e) {
    /* sem arquivo .env — usa apenas variáveis do sistema */
  }
}
loadEnv();

const POLLINATIONS = "https://image.pollinations.ai/prompt/";
const CLOUDFLARE_ACCOUNT = process.env.CF_ACCOUNT_ID || "";
const CLOUDFLARE_TOKEN = process.env.CF_API_TOKEN || "";
const CF_IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const CF_TEXT_MODEL = "@cf/meta/llama-3.1-8b-instruct";
const UA = "alvorada-do-ceu-app/1.0";

/* vozes PT-BR gratuitas (Edge TTS — Microsoft Neural voices) */
const EDGE_VOICES = {
  camila:   { voice: "pt-BR-FranciscaNeural", pitch: "+15Hz", rate: "+5%" },
  elza:     { voice: "pt-BR-FranciscaNeural", pitch: "-12Hz", rate: "-8%" },
  vitoria:  { voice: "pt-BR-ThalitaMultilingualNeural", pitch: "+6Hz", rate: "+3%" },
  ricardo:  { voice: "pt-BR-AntonioNeural", pitch: "+12Hz", rate: "+5%" },
  cid:      { voice: "pt-BR-AntonioNeural", pitch: "-25Hz", rate: "-12%" },
  antonio:  { voice: "pt-BR-AntonioNeural", pitch: "-5Hz" },
};
const ttsCache = new Map();
const TTS_CACHE_MAX = 120;

/* insere no Map com limite de tamanho (evita crescimento infinito de memória) */
function cacheSetCap(map, key, value, max) {
  if (map.size >= max) {
    const oldest = map.keys().next().value;
    map.delete(oldest);
  }
  map.set(key, value);
}

/* remove entradas expiradas de um Map com TTL (chamado periodicamente) */
function sweepCache(map, ttl) {
  const now = Date.now();
  for (const [k, v] of map) {
    if (!v.ts || now - v.ts > ttl) map.delete(k);
  }
}

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
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "connect-src 'self' https://image.pollinations.ai https://api.cloudflare.com https://api.pexels.com https://pixabay.com",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; "),
};

function sendError(res, code, msg, extra) {
  const headers = Object.assign({ "Content-Type": "text/plain; charset=utf-8" }, extra || {});
  res.writeHead(code, headers);
  res.end(msg);
}

function readBody(req, limit = 1e6) {
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
    req.on("end", () => {
      let s = Buffer.concat(chunks).toString("utf8");
      if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
      resolve(s);
    });
    req.on("error", reject);
  });
}

async function handleCf(req, res) {
  if (rateLimit(req, res)) return;

  let prompt = "";
  let steps = 4;

  try {
    const params = new URL(req.url, "http://localhost:" + PORT).searchParams;
    prompt = params.get("prompt") || "";

    const raw = await readBody(req);
    if (raw) {
      const body = JSON.parse(raw);
      if (typeof body.prompt === "string" && body.prompt) prompt = body.prompt;
      if (typeof body.steps === "number") steps = body.steps;
    }
  } catch (e) {
    sendError(res, 400, "JSON inválido no corpo da requisição.");
    return;
  }

  if (!prompt) { sendError(res, 400, "Missing prompt"); return; }

  if (!CLOUDFLARE_ACCOUNT || !CLOUDFLARE_TOKEN) {
    sendError(res, 502, "Cloudflare AI não configurado. Defina CF_ACCOUNT_ID e CF_API_TOKEN no arquivo .env.");
    return;
  }

  steps = Math.min(8, Math.max(1, Math.round(steps)));

  const url =
    "https://api.cloudflare.com/client/v4/accounts/" + CLOUDFLARE_ACCOUNT +
    "/ai/run/" + CF_IMAGE_MODEL;
  const body = JSON.stringify({ prompt, steps });
  const rq = https.request(url, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + CLOUDFLARE_TOKEN,
      "Content-Type": "application/json",
      "User-Agent": UA,
    },
  }, (upstream) => {
    let data = "";
    upstream.setEncoding("utf8");
    upstream.on("data", (c) => (data += c));
    upstream.on("end", () => {
      try {
        const j = JSON.parse(data);
        if (!j.success) {
          const msg = (j.errors && j.errors[0] && j.errors[0].message) || "Cloudflare AI error";
          sendError(res, 502, msg);
          return;
        }
        if (!j.result || !j.result.image) {
          sendError(res, 502, "Cloudflare AI não retornou imagem.");
          return;
        }
        const buf = Buffer.from(j.result.image, "base64");
        res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "no-store" });
        res.end(buf);
      } catch (e) {
        sendError(res, 502, "Cloudflare AI error: " + e.message);
      }
    });
  });
  rq.setTimeout(45000, () => rq.destroy(new Error("timeout")));
  rq.on("error", (err) => sendError(res, 502, "Cloudflare AI error: " + err.message));
  rq.write(body);
  rq.end();
}

/* ---------------- util: resposta de IA genérica (base64 ou URL) ---------------- */
function deepFind(obj, keys, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 4) return null;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === "string" && keys.includes(k)) return v;
    const r = deepFind(v, keys, depth + 1);
    if (r !== null) return r;
  }
  return null;
}

function extractImage(j) {
  if (!j || typeof j !== "object") return null;
  const b64 = deepFind(j, ["b64_json", "b64", "image_b64", "image"]);
  if (b64 && typeof b64 === "string") {
    if (/^https?:\/\//.test(b64)) return { url: b64 };
    const cleaned = b64.replace(/^data:image\/[^;]+;base64,/, "").replace(/\s+/g, "");
    if (/^[A-Za-z0-9+/=]+$/.test(cleaned) && cleaned.length > 100) {
      return { buffer: Buffer.from(cleaned, "base64") };
    }
  }
  const url = deepFind(j, ["url", "image_url", "output_url"]);
  if (url && typeof url === "string" && /^https?:\/\//.test(url)) return { url };
  return null;
}

function proxyUpstreamImage(res, upstream) {
  const type = upstream.headers["content-type"] || "image/jpeg";
  const chunks = [];
  upstream.on("data", (c) => chunks.push(c));
  upstream.on("end", () => {
    const buf = Buffer.concat(chunks);
    if (!buf.length) { sendError(res, 502, "A IA não retornou conteúdo."); return; }
    if (buf[0] === 0x7b) {
      try {
        const j = JSON.parse(buf.toString("utf8"));
        const found = extractImage(j);
        if (!found) {
          const msg = (j && j.error && (j.error.message || j.error)) || "resposta sem imagem";
          sendError(res, 502, "A IA não retornou imagem: " + msg);
          return;
        }
        if (found.buffer) {
          res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
          res.end(found.buffer);
        } else {
          https.get(found.url, (up2) => {
            if (up2.statusCode >= 400) {
              up2.resume();
              sendError(res, up2.statusCode, "Erro ao baixar a imagem da IA.");
              return;
            }
            res.writeHead(200, { "Content-Type": up2.headers["content-type"] || "image/jpeg", "Cache-Control": "no-store" });
            up2.pipe(res);
          }).on("error", (err) => sendError(res, 502, "Erro ao baixar a imagem: " + err.message));
        }
        return;
      } catch (e) {
        sendError(res, 502, "Erro ao interpretar resposta da IA: " + e.message);
        return;
      }
    }
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(buf);
  });
  upstream.on("error", (err) => sendError(res, 502, "Erro na IA: " + err.message));
}

/* ---------------- geração: free.ai (requer FREE_AI_TOKEN) ---------------- */
function handleFreeAi(req, res) {
  if (rateLimit(req, res)) return;
  const params = new URL(req.url, "http://localhost:" + PORT).searchParams;
  const prompt = params.get("prompt") || "";
  const width = params.get("width") || "1024";
  const height = params.get("height") || "1024";
  const seed = params.get("seed") || String(Math.floor(Math.random() * 1000000));
  if (!prompt) { sendError(res, 400, "Missing prompt"); return; }

  const token = process.env.FREE_AI_TOKEN || "";
  if (!token) {
    sendError(res, 502, "free.ai requer a variável de ambiente FREE_AI_TOKEN. Crie uma chave gratuita em free.ai e defina-a no servidor.");
    return;
  }

  const payload = JSON.stringify({
    prompt,
    width: Math.min(2048, Math.max(256, parseInt(width, 10) || 1024)),
    height: Math.min(2048, Math.max(256, parseInt(height, 10) || 1024)),
    seed: parseInt(seed, 10) || 0,
    model: "sdxl",
  });

  const rq = https.request("https://api.free.ai/v1/image/generate/", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      "User-Agent": UA,
    },
  }, (upstream) => {
    if (upstream.statusCode >= 400) {
      let errText = "";
      upstream.on("data", (c) => (errText += c));
      upstream.on("end", () => sendError(res, upstream.statusCode, "free.ai: " + (errText.slice(0, 300) || upstream.statusCode)));
      return;
    }
    proxyUpstreamImage(res, upstream);
  });
  rq.setTimeout(45000, () => rq.destroy(new Error("timeout")));
  rq.on("error", (err) => sendError(res, 502, "free.ai error: " + err.message));
  rq.write(payload);
  rq.end();
}

/* ---------------- geração: g4f (servidor local "g4f api") ---------------- */
function handleG4f(req, res) {
  if (rateLimit(req, res)) return;
  const params = new URL(req.url, "http://localhost:" + PORT).searchParams;
  const prompt = params.get("prompt") || "";
  const width = params.get("width") || "1024";
  const height = params.get("height") || "1024";
  const seed = params.get("seed") || String(Math.floor(Math.random() * 1000000));
  if (!prompt) { sendError(res, 400, "Missing prompt"); return; }

  const g4fUrl = process.env.G4F_URL || "http://localhost:8080/v1/images/generations";
  const payload = JSON.stringify({
    prompt,
    model: "flux",
    n: 1,
    size: (parseInt(width, 10) || 1024) + "x" + (parseInt(height, 10) || 1024),
    seed: parseInt(seed, 10) || 0,
  });

  const rq = http.request(g4fUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
  }, (upstream) => {
    if (upstream.statusCode >= 400) {
      let errText = "";
      upstream.on("data", (c) => (errText += c));
      upstream.on("end", () => sendError(res, upstream.statusCode, "g4f: " + (errText.slice(0, 300) || upstream.statusCode)));
      return;
    }
    proxyUpstreamImage(res, upstream);
  });
  rq.setTimeout(45000, () => rq.destroy(new Error("timeout")));
  rq.on("error", (err) => sendError(res, 502, "g4f indisponível: " + err.message + " — rode 'g4f api' localmente ou defina G4F_URL."));
  rq.write(payload);
  rq.end();
}

/* ---------------- util: baixar URL como buffer / POST JSON ---------------- */
function getBuffer(url, headers) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https:") ? https : http;
    const rq = mod.get(url, { headers: Object.assign({ "User-Agent": UA }, headers || {}) }, (up) => {
      if (up.statusCode >= 400) {
        up.resume();
        reject(new Error("HTTP " + up.statusCode));
        return;
      }
      const chunks = [];
      up.on("data", (c) => chunks.push(c));
      up.on("end", () => resolve({ buffer: Buffer.concat(chunks), type: up.headers["content-type"] || "" }));
    });
    rq.setTimeout(25000, () => rq.destroy(new Error("timeout")));
    rq.on("error", reject);
  });
}

function postJson(url, payload, headers, cb) {
  const mod = url.startsWith("https:") ? https : http;
  const body = JSON.stringify(payload);
  const rq = mod.request(url, {
    method: "POST",
    headers: Object.assign({ "Content-Type": "application/json", "User-Agent": UA }, headers || {}),
  }, (up) => {
    let data = "";
    up.setEncoding("utf8");
    up.on("data", (c) => (data += c));
    up.on("end", () => {
      let j = null;
      try { j = JSON.parse(data); } catch (e) {}
      cb(null, j, data, up.statusCode);
    });
  });
  rq.setTimeout(45000, () => rq.destroy(new Error("timeout")));
  rq.on("error", (err) => cb(err));
  rq.write(body);
  rq.end();
}

/* ---------------- TTS (voz para narração do reels) ---------------- */
function handleTts(req, res) {
  const params = new URL(req.url, "http://localhost:" + PORT).searchParams;
  const voice = params.get("voice") || "camila";
  let text = (params.get("text") || "").trim().replace(/\s+/g, " ");
  if (!text) { sendError(res, 400, "Missing text"); return; }
  if (text.length > 480) text = text.slice(0, 480);
  const key = voice + "|" + text;
  const hit = ttsCache.get(key);
  if (hit) {
    res.writeHead(200, { "Content-Type": hit.type || "audio/mpeg", "Cache-Control": "no-store" });
    res.end(hit.buffer);
    return;
  }

  (async () => {
    /* 1. Tenta Edge TTS (neural, gratuito, vozes masculina/feminina reais) */
    const edgeCfg = EDGE_VOICES[voice];
    if (edgeCfg) {
      try {
        const tts = new EdgeTTS();
        await tts.synthesize(text, edgeCfg.voice, { pitch: edgeCfg.pitch, rate: edgeCfg.rate });
        const buf = tts.toBuffer();
        if (buf && buf.length > 800) {
          cacheSetCap(ttsCache, key, { buffer: buf, type: "audio/mpeg" }, TTS_CACHE_MAX);
          res.writeHead(200, { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" });
          res.end(buf);
          return;
        }
      } catch (e) { /* fallback abaixo */ }
    }
    /* 2. Fallback: Google Translate TTS (uma única voz, mas funciona) */
    try {
      const url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pt&q=" + encodeURIComponent(text.slice(0, 190));
      const r = await getBuffer(url);
      if (r.buffer && r.buffer.length > 800) {
        cacheSetCap(ttsCache, key, { buffer: r.buffer, type: "audio/mpeg" }, TTS_CACHE_MAX);
        res.writeHead(200, { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" });
        res.end(r.buffer);
        return;
      }
    } catch (e) { /* fim */ }
    sendError(res, 502, "Voz indisponível no momento. Tente novamente em instantes.");
  })();
}

/* ---------------- texto com IA (Cloudflare Workers AI / Llama) ---------------- */
function handleAiText(req, res) {
  if (rateLimit(req, res)) return;
  readBody(req, 200000).then((raw) => {
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch (e) {
      sendError(res, 400, "JSON inválido.");
      return;
    }
    const type = String(body.type || "oracao-manha");
    const theme = String(body.theme || "fé");
    const duration = parseInt(body.duration, 10) || 30;
    if (!CLOUDFLARE_ACCOUNT || !CLOUDFLARE_TOKEN) {
      sendError(res, 502, "Cloudflare AI não configurado. Defina CF_ACCOUNT_ID e CF_API_TOKEN no arquivo .env.");
      return;
    }
    const typePrompt = {
      "oracao-manha": "uma oração de boa manhã",
      "oracao-noite": "uma oração de boa noite",
      versiculo: "uma mensagem inspirada em um salmo ou versículo bíblico",
      parabola: "uma parábola curta",
      livre: "uma oração de fé e confiança",
    }[type] || "uma oração";
    const words = Math.max(60, Math.round((duration / 60) * 150));
    const system =
      "Você é um redator brasileiro de conteúdo espiritual cristão. Escreve com carinho, simplicidade e esperança, no tom de quem acalma e fortalece. Nunca usa markdown, nunca usa aspas no início ou fim, nunca inventa citações bíblicas com referências falsas. Responde apenas o texto pronto para ser narrado em voz alta.";
    const user =
      "Escreva " + typePrompt + " sobre o tema '" + theme + "', com cerca de " + words + " palavras, adequada para um vídeo de " + duration + " segundos no Instagram. Comece invocando a Deus e termine com 'Amém'.";
    postJson(
      "https://api.cloudflare.com/client/v4/accounts/" + CLOUDFLARE_ACCOUNT + "/ai/run/" + CF_TEXT_MODEL,
      { messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: 420 },
      { "Authorization": "Bearer " + CLOUDFLARE_TOKEN },
      (err, j) => {
        if (err) { sendError(res, 502, "Cloudflare AI error: " + err.message); return; }
        const text = (j && j.result && j.result.response) || "";
        if (!text) { sendError(res, 502, "Cloudflare AI não retornou texto."); return; }
        const clean = text.trim().replace(/^["'“”]+|["'“”]+$/g, "").replace(/\s+/g, " ");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
        res.end(JSON.stringify({ text: clean }));
      }
    );
  }).catch(() => sendError(res, 400, "Erro ao ler a requisição."));
}

/* ---------------- Pixabay videos (proxy com cache 24h) ---------------- */
const pixabayCache = new Map();
const PIXABAY_CACHE_TTL = 24 * 60 * 60 * 1000;

function handlePixabay(req, res) {
  if (rateLimit(req, res)) return;
  const params = new URL(req.url, "http://localhost:" + PORT).searchParams;
  const q = (params.get("q") || "prayer").trim().slice(0, 100);
  const perPage = Math.max(Math.min(parseInt(params.get("per_page"), 10) || 5, 20), 3);
  const minW = parseInt(params.get("min_width"), 10) || 960;
  const minH = parseInt(params.get("min_height"), 10) || 1440;

  const PIXABAY_KEY = process.env.PIXABAY_API_KEY || "";
  if (!PIXABAY_KEY) {
    sendError(res, 502, "Pixabay não configurado. Defina PIXABAY_API_KEY no .env (chave gratuita em pixabay.com/api/docs/).");
    return;
  }

  const cacheKey = q + "|" + perPage + "|" + minW + "|" + minH;
  const hit = pixabayCache.get(cacheKey);
  if (hit && (Date.now() - hit.ts < PIXABAY_CACHE_TTL)) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" });
    res.end(JSON.stringify(hit.data));
    return;
  }

  const apiUrl =
    "https://pixabay.com/api/videos/?key=" + encodeURIComponent(PIXABAY_KEY) +
    "&q=" + encodeURIComponent(q) +
    "&lang=pt" +
    "&video_type=film" +
    "&min_width=" + minW +
    "&min_height=" + minH +
    "&per_page=" + perPage +
    "&safesearch=true";

  const mod = https;
  const rq = mod.get(apiUrl, { headers: { "User-Agent": UA } }, (up) => {
    if (up.statusCode >= 400) {
      let errText = "";
      up.on("data", (c) => (errText += c));
      up.on("end", () => sendError(res, up.statusCode, "Pixabay API: " + (errText.slice(0, 300) || up.statusCode)));
      return;
    }
    let data = "";
    up.setEncoding("utf8");
    up.on("data", (c) => (data += c));
    up.on("end", () => {
      let j = null;
      try { j = JSON.parse(data); } catch (e) {}
      if (!j || !j.hits) { sendError(res, 502, "Pixabay retornou resposta inválida."); return; }

      const videos = j.hits.map((hit) => {
        const vids = hit.videos || {};
        const sm = vids.small || {};
        const med = vids.medium || {};
        const lg = vids.large || {};
        return {
          id: hit.id,
          pageURL: hit.pageURL,
          duration: hit.duration,
          tags: hit.tags,
          videoSmall: sm.url || "",
          smallW: sm.width || 0,
          smallH: sm.height || 0,
          videoMedium: med.url || "",
          mediumW: med.width || 0,
          mediumH: med.height || 0,
          videoLarge: lg.url || "",
          largeW: lg.width || 0,
          largeH: lg.height || 0,
          videoURL: med.url || sm.url || lg.url || "",
          width: med.width || sm.width || 0,
          height: med.height || sm.height || 0,
        };
      }).filter((v) => v.videoURL);

      const result = { total: j.total || 0, videos };
      cacheSetCap(pixabayCache, cacheKey, { data: result, ts: Date.now() }, 60);

      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" });
      res.end(JSON.stringify(result));
    });
  });
  rq.setTimeout(20000, () => rq.destroy(new Error("timeout")));
  rq.on("error", (err) => sendError(res, 502, "Pixabay indisponível: " + err.message));
}

/* ---------------- Pixabay video stream proxy ---------------- */
const PIXABAY_CDN_HOSTS = ["cdn.pixabay.com", "pixabay.com"];
const pixabayVideoCache = new Map();
const PIXABAY_VID_CACHE_TTL = 6 * 60 * 60 * 1000;

function streamProxyResponse(up, res, cacheObj, cacheKey) {
  const contentType = up.headers["content-type"] || "video/mp4";
  const contentLength = parseInt(up.headers["content-length"], 10) || 0;
  if (contentLength > 0 && contentLength <= 1 * 1024 * 1024) {
    const chunks = [];
    up.on("data", (c) => chunks.push(c));
    up.on("end", () => {
      const buf = Buffer.concat(chunks);
      if (cacheObj) cacheSetCap(cacheObj, cacheKey, { data: buf, contentType, ts: Date.now() }, 40);
      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": buf.length,
        "Cache-Control": "public, max-age=21600",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(buf);
    });
  } else {
    const headers = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=21600",
      "Access-Control-Allow-Origin": "*",
    };
    if (contentLength > 0) headers["Content-Length"] = contentLength;
    res.writeHead(200, headers);
    up.pipe(res);
  }
}

function handlePixabayProxy(req, res) {
  if (rateLimit(req, res)) return;
  const params = new URL(req.url, "http://localhost:" + PORT).searchParams;
  const videoUrl = params.get("url") || "";

  if (!videoUrl) { sendError(res, 400, "Parâmetro 'url' obrigatório."); return; }

  let parsed;
  try { parsed = new URL(videoUrl); } catch (e) { sendError(res, 400, "URL inválida."); return; }

  if (!PIXABAY_CDN_HOSTS.includes(parsed.hostname)) {
    sendError(res, 403, "Apenas URLs do CDN Pixabay são permitidas.");
    return;
  }

  const cacheKey = videoUrl;
  const hit = pixabayVideoCache.get(cacheKey);
  if (hit && (Date.now() - hit.ts < PIXABAY_VID_CACHE_TTL)) {
    res.writeHead(200, {
      "Content-Type": hit.contentType,
      "Content-Length": hit.data.length,
      "Cache-Control": "public, max-age=21600",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(hit.data);
    return;
  }

  const proxyHeaders = { "User-Agent": UA };
  const range = req.headers.range;
  if (range) proxyHeaders["Range"] = range;

  const mod = parsed.protocol === "https:" ? https : http;
  const proxyReq = mod.get(videoUrl, { headers: proxyHeaders }, (up) => {
    if (up.statusCode >= 300 && up.statusCode < 400 && up.headers.location) {
      handlePixabayProxyRedirect(up.headers.location, res, cacheKey, range);
      return;
    }
    if (up.statusCode >= 400) {
      let errText = "";
      up.on("data", (c) => (errText += c));
      up.on("end", () => sendError(res, up.statusCode, "Pixabay CDN erro: " + (errText.slice(0, 200) || up.statusCode)));
      return;
    }
    if (up.statusCode === 206 && range) {
      const contentType = up.headers["content-type"] || "video/mp4";
      res.writeHead(206, {
        "Content-Type": contentType,
        "Content-Range": up.headers["content-range"] || "",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=21600",
        "Access-Control-Allow-Origin": "*",
      });
      up.pipe(res);
      return;
    }
    streamProxyResponse(up, res, pixabayVideoCache, cacheKey);
  });
  proxyReq.setTimeout(60000, () => proxyReq.destroy(new Error("timeout")));
  proxyReq.on("error", (err) => sendError(res, 502, "Pixabay stream falhou: " + err.message));
}

function handlePixabayProxyRedirect(location, res, cacheKey, range) {
  let mod = https;
  let url = location;
  if (location.startsWith("/")) {
    url = "https://cdn.pixabay.com" + location;
  } else if (!location.startsWith("http")) {
    sendError(res, 502, "Redirect inválido.");
    return;
  }
  let parsedRedir;
  try { parsedRedir = new URL(url); } catch (e) { sendError(res, 502, "Redirect URL inválida."); return; }
  /* segurança: o redirect também precisa apontar para o CDN do Pixabay */
  if (!PIXABAY_CDN_HOSTS.includes(parsedRedir.hostname)) {
    sendError(res, 403, "Redirect para host não permitido.");
    return;
  }
  const rMod = url.startsWith("https") ? https : http;
  const redirHeaders = { "User-Agent": UA };
  if (range) redirHeaders["Range"] = range;
  const rReq = rMod.get(url, { headers: redirHeaders }, (up) => {
    if (up.statusCode >= 400) {
      sendError(res, up.statusCode, "Pixabay redirect erro.");
      return;
    }
    if (up.statusCode === 206 && range) {
      const contentType = up.headers["content-type"] || "video/mp4";
      res.writeHead(206, {
        "Content-Type": contentType,
        "Content-Range": up.headers["content-range"] || "",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=21600",
        "Access-Control-Allow-Origin": "*",
      });
      up.pipe(res);
      return;
    }
    streamProxyResponse(up, res, pixabayVideoCache, cacheKey);
  });
  rReq.setTimeout(60000, () => rReq.destroy(new Error("timeout")));
  rReq.on("error", (err) => sendError(res, 502, "Redirect falhou: " + err.message));
}

/* ---------------- Pixabay photos search (proxy com cache 24h) ---------------- */
const pixabayPhotosCache = new Map();

function handlePixabayPhotos(req, res) {
  if (rateLimit(req, res)) return;
  const params = new URL(req.url, "http://localhost:" + PORT).searchParams;
  const q = (params.get("q") || "nature").trim().slice(0, 100);
  const perPage = Math.max(Math.min(parseInt(params.get("per_page"), 10) || 5, 20), 3);
  const minWidth = parseInt(params.get("min_width"), 10) || 960;

  const PIXABAY_KEY = process.env.PIXABAY_API_KEY || "";
  if (!PIXABAY_KEY) {
    sendError(res, 502, "Pixabay não configurado.");
    return;
  }

  const cacheKey = "photos|" + q + "|" + perPage + "|" + minWidth;
  const hit = pixabayPhotosCache.get(cacheKey);
  if (hit && (Date.now() - hit.ts < PIXABAY_CACHE_TTL)) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" });
    res.end(JSON.stringify(hit.data));
    return;
  }

  const apiUrl =
    "https://pixabay.com/api/?key=" + encodeURIComponent(PIXABAY_KEY) +
    "&q=" + encodeURIComponent(q) +
    "&lang=pt" +
    "&image_type=photo" +
    "&min_width=" + minWidth +
    "&per_page=" + perPage +
    "&safesearch=true";

  const rq = https.get(apiUrl, { headers: { "User-Agent": UA } }, (up) => {
    if (up.statusCode >= 400) {
      let errText = "";
      up.on("data", (c) => (errText += c));
      up.on("end", () => sendError(res, up.statusCode, "Pixabay Photos API: " + (errText.slice(0, 300) || up.statusCode)));
      return;
    }
    let data = "";
    up.setEncoding("utf8");
    up.on("data", (c) => (data += c));
    up.on("end", () => {
      let j = null;
      try { j = JSON.parse(data); } catch (e) {}
      if (!j || !j.hits) { sendError(res, 502, "Pixabay Photos retornou resposta inválida."); return; }
      const photos = j.hits.map((hit) => ({
        id: hit.id,
        pageURL: hit.pageURL,
        tags: hit.tags,
        image: hit.largeImageURL || hit.webformatURL || "",
        thumb: hit.previewURL || "",
        width: hit.imageWidth || 0,
        height: hit.imageHeight || 0,
      })).filter((p) => p.image);
      const result = { total: j.total || 0, photos };
      cacheSetCap(pixabayPhotosCache, cacheKey, { data: result, ts: Date.now() }, 60);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" });
      res.end(JSON.stringify(result));
    });
  });
  rq.setTimeout(20000, () => rq.destroy(new Error("timeout")));
  rq.on("error", (err) => sendError(res, 502, "Pixabay Photos indisponível: " + err.message));
}

/* ---------------- Pexels photos search (proxy com cache 24h) ---------------- */
const pexelsPhotosCache = new Map();
const PEXELS_CACHE_TTL = 24 * 60 * 60 * 1000;

function handlePexelsPhotos(req, res) {
  if (rateLimit(req, res)) return;
  const params = new URL(req.url, "http://localhost:" + PORT).searchParams;
  const q = (params.get("q") || "nature").trim().slice(0, 100);
  const perPage = Math.max(Math.min(parseInt(params.get("per_page"), 10) || 5, 20), 3);
  const orientation = params.get("orientation") || "portrait";

  const PEXELS_KEY = process.env.PEXELS_API_KEY || "";
  if (!PEXELS_KEY) {
    sendError(res, 502, "Pexels não configurado. Defina PEXELS_API_KEY no .env (chave gratuita em pexels.com/api/).");
    return;
  }

  const cacheKey = "photos|" + q + "|" + perPage + "|" + orientation;
  const hit = pexelsPhotosCache.get(cacheKey);
  if (hit && (Date.now() - hit.ts < PEXELS_CACHE_TTL)) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" });
    res.end(JSON.stringify(hit.data));
    return;
  }

  const apiUrl =
    "https://api.pexels.com/v1/search?query=" + encodeURIComponent(q) +
    "&per_page=" + perPage +
    "&orientation=" + orientation;

  const rq = https.get(apiUrl, { headers: { "Authorization": PEXELS_KEY, "User-Agent": UA } }, (up) => {
    if (up.statusCode >= 400) {
      let errText = "";
      up.on("data", (c) => (errText += c));
      up.on("end", () => sendError(res, up.statusCode, "Pexels API: " + (errText.slice(0, 300) || up.statusCode)));
      return;
    }
    let data = "";
    up.setEncoding("utf8");
    up.on("data", (c) => (data += c));
    up.on("end", () => {
      let j = null;
      try { j = JSON.parse(data); } catch (e) {}
      if (!j || !j.photos) { sendError(res, 502, "Pexels retornou resposta inválida."); return; }
      const photos = j.photos.map((p) => ({
        id: p.id,
        pageURL: p.url,
        tags: p.alt || "",
        image: p.src.large2x || p.src.large || p.src.original || "",
        thumb: p.src.medium || "",
        width: p.width || 0,
        height: p.height || 0,
        photographer: p.photographer || "",
      })).filter((p) => p.image);
      const result = { total: j.total_results || 0, photos };
      cacheSetCap(pexelsPhotosCache, cacheKey, { data: result, ts: Date.now() }, 60);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" });
      res.end(JSON.stringify(result));
    });
  });
  rq.setTimeout(20000, () => rq.destroy(new Error("timeout")));
  rq.on("error", (err) => sendError(res, 502, "Pexels indisponível: " + err.message));
}

/* ---------------- Pexels videos search (proxy com cache 24h) ---------------- */
const pexelsVideosCache = new Map();

function handlePexelsVideos(req, res) {
  if (rateLimit(req, res)) return;
  const params = new URL(req.url, "http://localhost:" + PORT).searchParams;
  const q = (params.get("q") || "nature").trim().slice(0, 100);
  const perPage = Math.max(Math.min(parseInt(params.get("per_page"), 10) || 5, 20), 3);
  const orientation = params.get("orientation") || "portrait";
  const minW = parseInt(params.get("min_width"), 10) || 960;

  const PEXELS_KEY = process.env.PEXELS_API_KEY || "";
  if (!PEXELS_KEY) {
    sendError(res, 502, "Pexels não configurado. Defina PEXELS_API_KEY no .env.");
    return;
  }

  const cacheKey = "videos|" + q + "|" + perPage + "|" + orientation + "|" + minW;
  const hit = pexelsVideosCache.get(cacheKey);
  if (hit && (Date.now() - hit.ts < PEXELS_CACHE_TTL)) {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" });
    res.end(JSON.stringify(hit.data));
    return;
  }

  const apiUrl =
    "https://api.pexels.com/videos/search?query=" + encodeURIComponent(q) +
    "&per_page=" + perPage +
    "&orientation=" + orientation;

  const rq = https.get(apiUrl, { headers: { "Authorization": PEXELS_KEY, "User-Agent": UA } }, (up) => {
    if (up.statusCode >= 400) {
      let errText = "";
      up.on("data", (c) => (errText += c));
      up.on("end", () => sendError(res, up.statusCode, "Pexels Videos API: " + (errText.slice(0, 300) || up.statusCode)));
      return;
    }
    let data = "";
    up.setEncoding("utf8");
    up.on("data", (c) => (data += c));
    up.on("end", () => {
      let j = null;
      try { j = JSON.parse(data); } catch (e) {}
      if (!j || !j.videos) { sendError(res, 502, "Pexels Videos retornou resposta inválida."); return; }
      const videos = j.videos.map((v) => {
        const files = (v.video_files || []).filter((f) => f.width >= minW && f.height >= Math.round(minW * 16 / 9));
        const best = files.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || v.video_files[0] || {};
        const sm = files.filter((f) => f.width <= 720).sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || best;
        const lg = files.filter((f) => f.width >= 1920).sort((a, b) => (a.width * a.height) - (b.width * b.height))[0] || best;
        return {
          id: v.id,
          pageURL: v.url,
          duration: v.duration || 0,
          tags: v.url || "",
          videoSmall: sm.link || "",
          smallW: sm.width || 0,
          smallH: sm.height || 0,
          videoMedium: best.link || "",
          mediumW: best.width || 0,
          mediumH: best.height || 0,
          videoLarge: lg.link || "",
          largeW: lg.width || 0,
          largeH: lg.height || 0,
          videoURL: best.link || "",
          width: best.width || 0,
          height: best.height || 0,
        };
      }).filter((v) => v.videoURL);
      const result = { total: j.total_results || 0, videos };
      cacheSetCap(pexelsVideosCache, cacheKey, { data: result, ts: Date.now() }, 60);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" });
      res.end(JSON.stringify(result));
    });
  });
  rq.setTimeout(20000, () => rq.destroy(new Error("timeout")));
  rq.on("error", (err) => sendError(res, 502, "Pexels Videos indisponível: " + err.message));
}

/* ---------------- Pexels media proxy ---------------- */
const PEXELS_HOSTS = ["videos.pexels.com", "images.pexels.com", "player.vimeo.com"];
const pexelsProxyCache = new Map();
const PEXELS_PROXY_TTL = 6 * 60 * 60 * 1000;

function handlePexelsProxy(req, res) {
  if (rateLimit(req, res)) return;
  const params = new URL(req.url, "http://localhost:" + PORT).searchParams;
  const mediaUrl = params.get("url") || "";
  if (!mediaUrl) { sendError(res, 400, "Parâmetro 'url' obrigatório."); return; }

  let parsed;
  try { parsed = new URL(mediaUrl); } catch (e) { sendError(res, 400, "URL inválida."); return; }

  if (!PEXELS_HOSTS.includes(parsed.hostname)) {
    sendError(res, 403, "Apenas URLs do Pexels são permitidas.");
    return;
  }

  const cacheKey = mediaUrl;
  const hit = pexelsProxyCache.get(cacheKey);
  if (hit && (Date.now() - hit.ts < PEXELS_PROXY_TTL)) {
    res.writeHead(200, {
      "Content-Type": hit.contentType,
      "Content-Length": hit.data.length,
      "Cache-Control": "public, max-age=21600",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(hit.data);
    return;
  }

  const proxyHeaders = { "User-Agent": UA, "Referer": "https://www.pexels.com/" };
  const range = req.headers.range;
  if (range) proxyHeaders["Range"] = range;

  const mod = parsed.protocol === "https:" ? https : http;
  const proxyReq = mod.get(mediaUrl, { headers: proxyHeaders }, (up) => {
    if (up.statusCode >= 300 && up.statusCode < 400 && up.headers.location) {
      let redirUrl = up.headers.location;
      if (redirUrl.startsWith("/")) redirUrl = parsed.protocol + "//" + parsed.hostname + redirUrl;
      handlePexelsProxyRedirect(redirUrl, res, cacheKey, range);
      return;
    }
    if (up.statusCode >= 400) {
      let errText = "";
      up.on("data", (c) => (errText += c));
      up.on("end", () => sendError(res, up.statusCode, "Pexels CDN erro: " + (errText.slice(0, 200) || up.statusCode)));
      return;
    }
    if (up.statusCode === 206 && range) {
      const contentType = up.headers["content-type"] || "video/mp4";
      res.writeHead(206, {
        "Content-Type": contentType,
        "Content-Range": up.headers["content-range"] || "",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=21600",
        "Access-Control-Allow-Origin": "*",
      });
      up.pipe(res);
      return;
    }
    streamProxyResponse(up, res, pexelsProxyCache, cacheKey);
  });
  proxyReq.setTimeout(60000, () => proxyReq.destroy(new Error("timeout")));
  proxyReq.on("error", (err) => sendError(res, 502, "Pexels stream falhou: " + err.message));
}

function handlePexelsProxyRedirect(url, res, cacheKey, range) {
  let mod = https;
  let parsedRedir;
  try { parsedRedir = new URL(url); } catch (e) { sendError(res, 502, "Redirect URL inválida."); return; }
  /* segurança: o redirect também precisa apontar para hosts do Pexels */
  if (!PEXELS_HOSTS.includes(parsedRedir.hostname)) {
    sendError(res, 403, "Redirect para host não permitido.");
    return;
  }
  if (url.startsWith("http:")) mod = http;
  const redirHeaders = { "User-Agent": UA };
  if (range) redirHeaders["Range"] = range;
  const rReq = mod.get(url, { headers: redirHeaders }, (up) => {
    if (up.statusCode >= 400) {
      sendError(res, up.statusCode, "Pexels redirect erro.");
      return;
    }
    if (up.statusCode === 206 && range) {
      const contentType = up.headers["content-type"] || "video/mp4";
      res.writeHead(206, {
        "Content-Type": contentType,
        "Content-Range": up.headers["content-range"] || "",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=21600",
        "Access-Control-Allow-Origin": "*",
      });
      up.pipe(res);
      return;
    }
    streamProxyResponse(up, res, pexelsProxyCache, cacheKey);
  });
  rReq.setTimeout(60000, () => rReq.destroy(new Error("timeout")));
  rReq.on("error", (err) => sendError(res, 502, "Pexels redirect falhou: " + err.message));
}

/* ---------------- rate limit simples (protege as APIs de IA) ---------------- */
const rateBuckets = new Map();
const RATE_LIMIT = { windowMs: 60 * 1000, max: 40 };

/* limpeza periódica de memória (buckets expirados e caches de mídia) */
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of rateBuckets) {
    if (now - b.start > RATE_LIMIT.windowMs * 4) rateBuckets.delete(ip);
  }
  sweepCache(pixabayVideoCache, PIXABAY_VID_CACHE_TTL);
  sweepCache(pexelsProxyCache, PEXELS_PROXY_TTL);
}, 10 * 60 * 1000).unref();

function rateLimit(req, res, maxOverride, windowOverride) {
  const max = maxOverride || RATE_LIMIT.max;
  const windowMs = windowOverride || RATE_LIMIT.windowMs;
  const ip = req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const bucket = rateBuckets.get(ip) || { count: 0, start: now };
  if (now - bucket.start > windowMs) {
    bucket.count = 0;
    bucket.start = now;
  }
  bucket.count++;
  rateBuckets.set(ip, bucket);
  if (bucket.count > max) {
    const retry = Math.ceil((windowMs - (now - bucket.start)) / 1000);
    sendError(res, 429, "Muitas imagens por minuto. Aguarde " + retry + "s.", { "Retry-After": String(retry) });
    return true;
  }
  return false;
}

const server = http.createServer((req, res) => {
  Object.keys(SECURITY_HEADERS).forEach((k) => res.setHeader(k, SECURITY_HEADERS[k]));

  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  /* ---------------- geração: Pollinations (fallback) ---------------- */
  if (urlPath === "/api/image") {
    if (rateLimit(req, res)) return;
    const params = new URL(req.url, "http://localhost:" + PORT).searchParams;
    const prompt = params.get("prompt") || "";
    const width = params.get("width") || "1024";
    const height = params.get("height") || "1024";
    const seed = params.get("seed") || String(Math.floor(Math.random() * 1000000));
    if (!prompt) { sendError(res, 400, "Missing prompt"); return; }

    const MAX_RETRIES = 2;
    let attempts = 0;

    function tryPollinations(retrySeed) {
      const target =
        POLLINATIONS + encodeURIComponent(prompt) +
        `?width=${width}&height=${height}&nologo=true&seed=${retrySeed}`;
      https.get(target, (upstream) => {
        if (upstream.statusCode >= 400) {
          upstream.resume();
          attempts++;
          if (attempts < MAX_RETRIES && (upstream.statusCode === 409 || upstream.statusCode === 429)) {
            const newSeed = String(Math.floor(Math.random() * 1000000));
            setTimeout(() => tryPollinations(newSeed), 800);
            return;
          }
          res.writeHead(upstream.statusCode, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Pollinations error: " + upstream.statusCode);
          return;
        }
        res.writeHead(200, {
          "Content-Type": upstream.headers["content-type"] || "image/jpeg",
          "Cache-Control": "no-store",
        });
        upstream.pipe(res);
      }).on("error", (err) => {
        sendError(res, 502, "Proxy error: " + err.message);
      });
    }

    tryPollinations(seed);
    return;
  }

  /* ---------------- geração: Cloudflare (FLUX) ---------------- */
  if (urlPath === "/api/cf") {
    handleCf(req, res);
    return;
  }

  /* ---------------- geração: free.ai ---------------- */
  if (urlPath === "/api/freeai") {
    handleFreeAi(req, res);
    return;
  }

  /* ---------------- geração: g4f (gpt4free local) ---------------- */
  if (urlPath === "/api/g4f") {
    handleG4f(req, res);
    return;
  }

  /* ---------------- TTS: voz para narração ---------------- */
  if (urlPath === "/api/tts") {
    if (!rateLimit(req, res, 30, 60000)) return;
    handleTts(req, res);
    return;
  }

  /* ---------------- texto com IA (Cloudflare) ---------------- */
  if (urlPath === "/api/ai-text") {
    handleAiText(req, res);
    return;
  }

  /* ---------------- Pixabay videos proxy ---------------- */
  if (urlPath === "/api/pixabay") {
    handlePixabay(req, res);
    return;
  }

  /* ---------------- Pixabay video stream proxy ---------------- */
  if (urlPath === "/api/pixabay/proxy") {
    handlePixabayProxy(req, res);
    return;
  }

  /* ---------------- Pixabay photos search ---------------- */
  if (urlPath === "/api/pixabay/photos") {
    handlePixabayPhotos(req, res);
    return;
  }

  /* ---------------- Pexels photos search ---------------- */
  if (urlPath === "/api/pexels/photos") {
    handlePexelsPhotos(req, res);
    return;
  }

  /* ---------------- Pexels videos search ---------------- */
  if (urlPath === "/api/pexels/videos") {
    handlePexelsVideos(req, res);
    return;
  }

  /* ---------------- Pexels media proxy ---------------- */
  if (urlPath === "/api/pexels/proxy") {
    handlePexelsProxy(req, res);
    return;
  }

  /* ---------------- limpar histórico ---------------- */
  if (urlPath === "/clear-history") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Limpando...</title></head><body>
<script>
localStorage.removeItem("alvorada_recent_v1");
localStorage.removeItem("alvorada_used_quotes_v1");
localStorage.removeItem("alvorada_reels_used_v1");
document.body.innerHTML = "<p style='font-family:sans-serif;text-align:center;margin-top:40vh'>Histórico limpo! ✧</p>";
setTimeout(function(){ window.location = "/"; }, 1200);
</script></body></html>`);
    return;
  }

  /* ---------------- estáticos ---------------- */
  let staticPath = urlPath;
  if (staticPath === "/") staticPath = "/index.html";

  /* segurança: bloqueia dotfiles (.env, .git...), node_modules e arquivos sensíveis */
  const BLOCKED_FILES = new Set(["server.js", "package.json", "package-lock.json"]);
  const segments = staticPath.split("/").filter(Boolean);
  const hasUnsafeSegment = segments.some(
    (seg) => seg.startsWith(".") || seg === "node_modules"
  );
  if (
    hasUnsafeSegment ||
    BLOCKED_FILES.has(path.basename(staticPath)) ||
    staticPath.includes("\0")
  ) {
    sendError(res, 403, "Forbidden");
    return;
  }

  const filePath = path.join(PUBLIC_DIR, staticPath);
  /* segurança: garante que o caminho resolvido fica dentro de public/ */
  const rel = path.relative(PUBLIC_DIR, filePath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    sendError(res, 403, "Forbidden");
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      if (staticPath === "/favicon.ico") {
        res.writeHead(200, { "Content-Type": "image/x-icon" });
        res.end();
        return;
      }
      sendError(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=300",
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log("Alvorada do Céu — Espiritualidade rodando em http://localhost:" + PORT);
});
