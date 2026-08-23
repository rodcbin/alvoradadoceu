/* =========================================================
   Alvorada do Céu — API serverless (Netlify Functions v2)
   Replica os endpoints do server.js local usando fetch nativo.
   Variáveis de ambiente (Netlify > Site settings > Environment):
     CF_ACCOUNT_ID, CF_API_TOKEN, FREE_AI_TOKEN (opcional),
     PIXABAY_API_KEY, PEXELS_API_KEY, G4F_URL (opcional)
   ========================================================= */

const UA = "alvorada-do-ceu-app/1.0";
const CF_IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const CF_TEXT_MODEL = "@cf/meta/llama-3.1-8b-instruct";

const PIXABAY_CDN_HOSTS = ["cdn.pixabay.com", "pixabay.com"];
const PEXELS_HOSTS = ["videos.pexels.com", "images.pexels.com", "player.vimeo.com"];

/* caches efêmeros por instância (com limite e TTL) */
const jsonCache = new Map(); /* buscas pixabay/pexels */
const mediaCache = new Map(); /* mídias proxy <= 1MB */
const rateBuckets = new Map();

const JSON_TTL = 24 * 60 * 60 * 1000;
const MEDIA_TTL = 6 * 60 * 60 * 1000;
const CACHE_MAX = 40;

function cacheSetCap(map, key, value, max) {
  if (map.size >= max) {
    map.delete(map.keys().next().value);
  }
  map.set(key, value);
}

function cacheGet(map, key, ttl) {
  const hit = map.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > ttl) {
    map.delete(key);
    return null;
  }
  return hit;
}

function jsonRes(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extra },
  });
}

function errRes(msg, status = 502) {
  return new Response(msg, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/* ---------------- rate limit por IP ---------------- */
function rateLimit(req, max = 40, windowMs = 60000) {
  const ip =
    req.headers.get("x-nf-client-connection-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown";
  const now = Date.now();
  const bucket = rateBuckets.get(ip) || { count: 0, start: now };
  if (now - bucket.start > windowMs) {
    bucket.count = 0;
    bucket.start = now;
  }
  bucket.count++;
  rateBuckets.set(ip, bucket);
  if (rateBuckets.size > 5000) rateBuckets.clear();
  return bucket.count <= max;
}

/* ---------------- utilitários ---------------- */
async function fetchBuffer(url, headers = {}, timeoutMs = 25000) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, ...headers },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const buf = new Uint8Array(await res.arrayBuffer());
  return { buf, type: res.headers.get("content-type") || "" };
}

async function readJson(req) {
  try {
    const raw = await req.text();
    if (!raw || raw.length > 200000) return {};
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function mediaResponse(buf, contentType) {
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}

/* ---------------- Cloudflare FLUX (imagem) ---------------- */
async function handleCf(req) {
  let body = {};
  if (req.method === "POST") {
    body = await readJson(req);
    if (body === null) return errRes("JSON inválido no corpo da requisição.", 400);
  }
  const url = new URL(req.url);
  const prompt = body.prompt || url.searchParams.get("prompt") || "";
  if (!prompt) return errRes("Missing prompt", 400);

  const account = process.env.CF_ACCOUNT_ID || "";
  const token = process.env.CF_API_TOKEN || "";
  if (!account || !token) {
    return errRes("Cloudflare AI não configurado. Defina CF_ACCOUNT_ID e CF_API_TOKEN nas variáveis de ambiente do Netlify.");
  }
  let steps = Number(body.steps) || 4;
  steps = Math.min(8, Math.max(1, Math.round(steps)));

  /* dimensões suportadas pelo flux-1-schnell: múltiplos de 8, entre 256 e 1024 */
  const clampDim = (v) => Math.min(1024, Math.max(256, Math.round((Number(v) || 1024) / 8) * 8));
  const width = clampDim(body.width);
  const height = clampDim(body.height);

  /* erros transitórios da Cloudflare: "busy", modelo carregando, throttle etc. */
  const TRANSIENT_RE = /busy|loading|not ready|capacity|overload|throttl|rate.?limit|quota|try again|timeout/i;

  let msg = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/" + account + "/ai/run/" + CF_IMAGE_MODEL,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
          "User-Agent": UA,
        },
        body: JSON.stringify({ prompt, steps, width, height }),
        signal: AbortSignal.timeout(30000),
      }
    );
    const j = await res.json().catch(() => null);
    if (j && j.success && j.result && j.result.image) {
      return mediaResponse(Uint8Array.from(atob(j.result.image), (c) => c.charCodeAt(0)), "image/jpeg");
    }
    msg = (j && j.errors && j.errors[0] && j.errors[0].message) || "Cloudflare AI não retornou imagem.";
    if (!TRANSIENT_RE.test(msg)) break;
    await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
  }
  return errRes(msg);
}

/* ---------------- Pollinations (proxy de imagem) ---------------- */
async function handlePollinations(url) {
  const prompt = url.searchParams.get("prompt") || "";
  if (!prompt) return errRes("Missing prompt", 400);
  const width = parseInt(url.searchParams.get("width"), 10) || 1024;
  const height = parseInt(url.searchParams.get("height"), 10) || 1024;
  const seed = url.searchParams.get("seed") || String(Math.floor(Math.random() * 1000000));
  const target =
    "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt) +
    "?width=" + width + "&height=" + height +
    "&nologo=true&seed=" + seed;
  const { buf, type } = await fetchBuffer(target, {}, 60000);
  return mediaResponse(buf, type || "image/jpeg");
}

/* ---------------- free.ai ---------------- */
async function handleFreeAi(url) {
  const prompt = url.searchParams.get("prompt") || "";
  if (!prompt) return errRes("Missing prompt", 400);
  const token = process.env.FREE_AI_TOKEN || "";
  if (!token) return errRes("free.ai requer a variável de ambiente FREE_AI_TOKEN.");
  const width = Math.min(2048, Math.max(256, parseInt(url.searchParams.get("width"), 10) || 1024));
  const height = Math.min(2048, Math.max(256, parseInt(url.searchParams.get("height"), 10) || 1024));
  const seed = parseInt(url.searchParams.get("seed"), 10) || 0;

  const res = await fetch("https://api.free.ai/v1/image/generate/", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      "User-Agent": UA,
    },
    body: JSON.stringify({ prompt, width, height, seed, model: "sdxl" }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    const t = (await res.text()).slice(0, 300);
    return errRes("free.ai: " + (t || res.status), res.status);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    /* resposta JSON com base64 ou URL */
    const j = await res.json().catch(() => null);
    const found = deepFindImage(j);
    if (!found) return errRes("A IA não retornou imagem.");
    if (found.buf) return mediaResponse(found.buf, "image/png");
    const dl = await fetchBuffer(found.url, {}, 30000);
    return mediaResponse(dl.buf, dl.type || "image/jpeg");
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  if (!buf.length) return errRes("A IA não retornou conteúdo.");
  return mediaResponse(buf, ct || "image/jpeg");
}

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

function deepFindImage(j) {
  if (!j || typeof j !== "object") return null;
  const b64 = deepFind(j, ["b64_json", "b64", "image_b64", "image"]);
  if (b64 && typeof b64 === "string") {
    if (/^https?:\/\//.test(b64)) return { url: b64 };
    const cleaned = b64.replace(/^data:image\/[^;]+;base64,/, "").replace(/\s+/g, "");
    if (/^[A-Za-z0-9+/=]+$/.test(cleaned) && cleaned.length > 100) {
      return { buf: Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0)) };
    }
  }
  const url = deepFind(j, ["url", "image_url", "output_url"]);
  if (url && /^https?:\/\//.test(url)) return { url };
  return null;
}

/* ---------------- g4f (servidor externo opcional) ---------------- */
async function handleG4f(url) {
  const prompt = url.searchParams.get("prompt") || "";
  if (!prompt) return errRes("Missing prompt", 400);
  const g4fUrl = process.env.G4F_URL || "";
  if (!g4fUrl) {
    return errRes("g4f indisponível no Netlify — defina G4F_URL apontando para um servidor g4f público, ou use outra fonte de imagem.");
  }
  const width = parseInt(url.searchParams.get("width"), 10) || 1024;
  const height = parseInt(url.searchParams.get("height"), 10) || 1024;
  const seed = parseInt(url.searchParams.get("seed"), 10) || 0;
  const res = await fetch(g4fUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify({ prompt, model: "flux", n: 1, size: width + "x" + height, seed }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    const t = (await res.text()).slice(0, 300);
    return errRes("g4f: " + (t || res.status), res.status);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = await res.json().catch(() => null);
    const found = deepFindImage(j);
    if (!found) return errRes("A IA não retornou imagem.");
    if (found.buf) return mediaResponse(found.buf, "image/png");
    const dl = await fetchBuffer(found.url, {}, 30000);
    return mediaResponse(dl.buf, dl.type || "image/jpeg");
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  return mediaResponse(buf, ct || "image/jpeg");
}

/* ---------------- texto com IA (Cloudflare Llama) ---------------- */
async function handleAiText(req) {
  const body = await readJson(req);
  if (body === null) return errRes("JSON inválido.", 400);
  const type = String(body.type || "oracao-manha");
  const theme = String(body.theme || "fé");
  const duration = parseInt(body.duration, 10) || 30;

  const account = process.env.CF_ACCOUNT_ID || "";
  const token = process.env.CF_API_TOKEN || "";
  if (!account || !token) {
    return errRes("Cloudflare AI não configurado. Defina CF_ACCOUNT_ID e CF_API_TOKEN nas variáveis de ambiente do Netlify.");
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

  const res = await fetch(
    "https://api.cloudflare.com/client/v4/accounts/" + account + "/ai/run/" + CF_TEXT_MODEL,
    {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", "User-Agent": UA },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 420,
      }),
      signal: AbortSignal.timeout(45000),
    }
  );
  const j = await res.json().catch(() => null);
  const text = (j && j.result && j.result.response) || "";
  if (!text) return errRes("Cloudflare AI não retornou texto.");
  const clean = text.trim().replace(/^["'“”]+|["'“”]+$/g, "").replace(/\s+/g, " ");
  return jsonRes({ text: clean });
}

/* ---------------- Pixabay vídeos ---------------- */
async function handlePixabayVideos(url) {
  const key = process.env.PIXABAY_API_KEY || "";
  if (!key) return errRes("Pixabay não configurado. Defina PIXABAY_API_KEY no Netlify.");
  const q = (url.searchParams.get("q") || "prayer").trim().slice(0, 100);
  const perPage = Math.max(Math.min(parseInt(url.searchParams.get("per_page"), 10) || 5, 20), 3);
  const minW = parseInt(url.searchParams.get("min_width"), 10) || 960;
  const minH = parseInt(url.searchParams.get("min_height"), 10) || 1440;

  const cacheKey = "pixvid|" + q + "|" + perPage + "|" + minW + "|" + minH;
  const hit = cacheGet(jsonCache, cacheKey, JSON_TTL);
  if (hit) return jsonRes(hit.data, 200, { "Cache-Control": "public, max-age=300" });

  const apiUrl =
    "https://pixabay.com/api/videos/?key=" + encodeURIComponent(key) +
    "&q=" + encodeURIComponent(q) + "&lang=pt&video_type=film" +
    "&min_width=" + minW + "&min_height=" + minH +
    "&per_page=" + perPage + "&safesearch=true";
  const res = await fetch(apiUrl, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) return errRes("Pixabay API: HTTP " + res.status, res.status >= 400 ? 502 : res.status);
  const j = await res.json().catch(() => null);
  if (!j || !j.hits) return errRes("Pixabay retornou resposta inválida.");

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
  cacheSetCap(jsonCache, cacheKey, { data: result, ts: Date.now() }, CACHE_MAX);
  return jsonRes(result, 200, { "Cache-Control": "public, max-age=300" });
}

/* ---------------- Pixabay fotos ---------------- */
async function handlePixabayPhotos(url) {
  const key = process.env.PIXABAY_API_KEY || "";
  if (!key) return errRes("Pixabay não configurado.");
  const q = (url.searchParams.get("q") || "nature").trim().slice(0, 100);
  const perPage = Math.max(Math.min(parseInt(url.searchParams.get("per_page"), 10) || 5, 20), 3);
  const minWidth = parseInt(url.searchParams.get("min_width"), 10) || 960;

  const cacheKey = "pixphoto|" + q + "|" + perPage + "|" + minWidth;
  const hit = cacheGet(jsonCache, cacheKey, JSON_TTL);
  if (hit) return jsonRes(hit.data, 200, { "Cache-Control": "public, max-age=300" });

  const apiUrl =
    "https://pixabay.com/api/?key=" + encodeURIComponent(key) +
    "&q=" + encodeURIComponent(q) + "&lang=pt&image_type=photo" +
    "&min_width=" + minWidth + "&per_page=" + perPage + "&safesearch=true";
  const res = await fetch(apiUrl, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) return errRes("Pixabay Photos API: HTTP " + res.status, 502);
  const j = await res.json().catch(() => null);
  if (!j || !j.hits) return errRes("Pixabay Photos retornou resposta inválida.");

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
  cacheSetCap(jsonCache, cacheKey, { data: result, ts: Date.now() }, CACHE_MAX);
  return jsonRes(result, 200, { "Cache-Control": "public, max-age=300" });
}

/* ---------------- Pexels fotos ---------------- */
async function handlePexelsPhotos(url) {
  const key = process.env.PEXELS_API_KEY || "";
  if (!key) return errRes("Pexels não configurado. Defina PEXELS_API_KEY no Netlify.");
  const q = (url.searchParams.get("q") || "nature").trim().slice(0, 100);
  const perPage = Math.max(Math.min(parseInt(url.searchParams.get("per_page"), 10) || 5, 20), 3);
  const orientation = url.searchParams.get("orientation") || "portrait";

  const cacheKey = "pxphoto|" + q + "|" + perPage + "|" + orientation;
  const hit = cacheGet(jsonCache, cacheKey, JSON_TTL);
  if (hit) return jsonRes(hit.data, 200, { "Cache-Control": "public, max-age=300" });

  const apiUrl =
    "https://api.pexels.com/v1/search?query=" + encodeURIComponent(q) +
    "&per_page=" + perPage + "&orientation=" + orientation;
  const res = await fetch(apiUrl, {
    headers: { Authorization: key, "User-Agent": UA },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return errRes("Pexels API: HTTP " + res.status, 502);
  const j = await res.json().catch(() => null);
  if (!j || !j.photos) return errRes("Pexels retornou resposta inválida.");

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
  cacheSetCap(jsonCache, cacheKey, { data: result, ts: Date.now() }, CACHE_MAX);
  return jsonRes(result, 200, { "Cache-Control": "public, max-age=300" });
}

/* ---------------- Pexels vídeos ---------------- */
async function handlePexelsVideos(url) {
  const key = process.env.PEXELS_API_KEY || "";
  if (!key) return errRes("Pexels não configurado. Defina PEXELS_API_KEY no Netlify.");
  const q = (url.searchParams.get("q") || "nature").trim().slice(0, 100);
  const perPage = Math.max(Math.min(parseInt(url.searchParams.get("per_page"), 10) || 5, 20), 3);
  const orientation = url.searchParams.get("orientation") || "portrait";
  const minW = parseInt(url.searchParams.get("min_width"), 10) || 960;

  const cacheKey = "pxvid|" + q + "|" + perPage + "|" + orientation + "|" + minW;
  const hit = cacheGet(jsonCache, cacheKey, JSON_TTL);
  if (hit) return jsonRes(hit.data, 200, { "Cache-Control": "public, max-age=300" });

  const apiUrl =
    "https://api.pexels.com/videos/search?query=" + encodeURIComponent(q) +
    "&per_page=" + perPage + "&orientation=" + orientation;
  const res = await fetch(apiUrl, {
    headers: { Authorization: key, "User-Agent": UA },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return errRes("Pexels Videos API: HTTP " + res.status, 502);
  const j = await res.json().catch(() => null);
  if (!j || !j.videos) return errRes("Pexels Videos retornou resposta inválida.");

  const videos = j.videos.map((v) => {
    const files = (v.video_files || []).filter((f) => f.width >= minW && f.height >= Math.round((minW * 16) / 9));
    const best = files.sort((a, b) => b.width * b.height - a.width * a.height)[0] || v.video_files[0] || {};
    const sm = files.filter((f) => f.width <= 720).sort((a, b) => b.width * b.height - a.width * a.height)[0] || best;
    const lg = files.filter((f) => f.width >= 1920).sort((a, b) => a.width * a.height - b.width * b.height)[0] || best;
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
  cacheSetCap(jsonCache, cacheKey, { data: result, ts: Date.now() }, CACHE_MAX);
  return jsonRes(result, 200, { "Cache-Control": "public, max-age=300" });
}

/* ---------------- proxy de mídia com allowlist ---------------- */
async function handleMediaProxy(url, allowedHosts, referer) {
  const mediaUrl = url.searchParams.get("url") || "";
  if (!mediaUrl) return errRes("Parâmetro 'url' obrigatório.", 400);
  let parsed;
  try { parsed = new URL(mediaUrl); } catch (e) { return errRes("URL inválida.", 400); }
  if (!allowedHosts.includes(parsed.hostname)) {
    return errRes("Apenas URLs do provedor são permitidas.", 403);
  }

  const hit = cacheGet(mediaCache, mediaUrl, MEDIA_TTL);
  if (hit) {
    return new Response(hit.data, {
      status: 200,
      headers: {
        "Content-Type": hit.contentType,
        "Cache-Control": "public, max-age=21600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const headers = { "User-Agent": UA };
  if (referer) headers["Referer"] = referer;
  const upstream = await fetch(mediaUrl, {
    headers,
    signal: AbortSignal.timeout(60000),
  });

  if (!upstream.ok) return errRes("CDN erro: HTTP " + upstream.status, 502);
  const ct = upstream.headers.get("content-type") || "video/mp4";
  const contentLength = parseInt(upstream.headers.get("content-length"), 10) || 0;

  /* respostas pequenas vão para o cache; grandes fazem streaming direto */
  if (contentLength > 0 && contentLength <= 1 * 1024 * 1024) {
    const buf = new Uint8Array(await upstream.arrayBuffer());
    cacheSetCap(mediaCache, mediaUrl, { data: buf, contentType: ct, ts: Date.now() }, CACHE_MAX);
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=21600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": ct,
      "Cache-Control": "public, max-age=21600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/* ---------------- roteador principal ---------------- */
export default async (req, context) => {
  const url = new URL(req.url);
  /* funciona tanto com rewrite /api/* quanto com caminho interno da função */
  let m = url.pathname.match(/\/api\/(.+)$/);
  if (!m) m = url.pathname.match(/\/\.netlify\/functions\/api(?:\/(.+))?$/);
  const sub = (m && m[1] ? m[1] : "").replace(/\/+$/, "");

  if (req.method === "OPTIONS") return new Response(null, { status: 204 });

  if (!sub) return jsonRes({ ok: true, service: "alvorada-do-ceu-api" });

  try {
    switch (sub) {
      case "cf":
        return await handleCf(req);
      case "image":
        if (!rateLimit(req)) return errRes("Muitas imagens por minuto. Aguarde alguns segundos.", 429);
        return await handlePollinations(url);
      case "freeai":
        if (!rateLimit(req)) return errRes("Muitas imagens por minuto. Aguarde alguns segundos.", 429);
        return await handleFreeAi(url);
      case "g4f":
        if (!rateLimit(req)) return errRes("Muitas imagens por minuto. Aguarde alguns segundos.", 429);
        return await handleG4f(url);
      case "ai-text":
        if (!rateLimit(req)) return errRes("Muitas requisições. Aguarde alguns segundos.", 429);
        return await handleAiText(req);
      case "pixabay":
        if (!rateLimit(req)) return errRes("Muitas requisições. Aguarde alguns segundos.", 429);
        return await handlePixabayVideos(url);
      case "pixabay/photos":
        if (!rateLimit(req)) return errRes("Muitas requisições. Aguarde alguns segundos.", 429);
        return await handlePixabayPhotos(url);
      case "pixabay/proxy":
        if (!rateLimit(req)) return errRes("Muitas requisições. Aguarde alguns segundos.", 429);
        return await handleMediaProxy(url, PIXABAY_CDN_HOSTS, null);
      case "pexels/photos":
        if (!rateLimit(req)) return errRes("Muitas requisições. Aguarde alguns segundos.", 429);
        return await handlePexelsPhotos(url);
      case "pexels/videos":
        if (!rateLimit(req)) return errRes("Muitas requisições. Aguarde alguns segundos.", 429);
        return await handlePexelsVideos(url);
      case "pexels/proxy":
        if (!rateLimit(req)) return errRes("Muitas requisições. Aguarde alguns segundos.", 429);
        return await handleMediaProxy(url, PEXELS_HOSTS, "https://www.pexels.com/");
      default:
        return errRes("Endpoint não encontrado: " + sub, 404);
    }
  } catch (e) {
    const msg = e && e.name === "TimeoutError" ? "Tempo esgotado no upstream." : (e.message || "Erro interno");
    console.error("[api]", sub, msg);
    return errRes(msg, 502);
  }
};

export const config = {
  path: "/api/*",
};
