/* =========================================================
   Alvorada do Céu — Reels (9:16)
   Motor: frases curtas, multi-fonte de imagens,
   Canvas 1080x1920, Ken Burns, exportação PNG + MP4/WebM,
   legenda com hashtags.
   ========================================================= */

(() => {
  "use strict";

  const W = 1080;
  const H = 1920;
  const PREFS_KEY = "alvorada_rv2_prefs_v1";

  const $ = (s, c = document) => c.querySelector(s);
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let toastTimer = null;
  function showToast(msg, type = "info") {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "toast " + type + " show";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = "toast " + type; }, 4200);
  }

  /* ---------- state ---------- */
  const state = {
    category: "oracao",
    theme: "golden-light",
    style: "cinematic",
    source: "cloudflare",
    busy: false,
    lastBlob: null,
    lastMime: "",
    caption: "",
  };

  /* ---------- DOM refs ---------- */
  const el = {
    categoryChips: $("#rv-category-chips"),
    themeChips: $("#rv-theme-chips"),
    styleChips: $("#rv-style-chips"),
    sourceChips: $("#rv-source-chips"),
    scriptText: $("#rv-script-text"),
    scriptMeta: $("#rv-script-meta"),
    btnNew: $("#rv-btn-new"),
    btnGenerate: $("#rv-btn-generate"),
    videoStage: $("#rv-video-stage"),
    placeholder: $("#rv-stage-placeholder"),
    video: $("#rv-video"),
    image: $("#rv-image"),
    canvas: $("#rv-canvas"),
    progressRow: $("#rv-progress-row"),
    progressFill: $("#rv-progress-fill"),
    progressStatus: $("#rv-progress-status"),
    btnDownload: $("#rv-btn-download"),
    btnCopyCaption: $("#rv-btn-copy-caption"),
    captionCard: $("#rv-caption-card"),
    captionText: $("#rv-caption-text"),
    engineNote: $("#rv-engine-note"),
    playbackBar: $("#rv-playback-bar"),
    btnPlay: $("#rv-btn-play"),
    btnPause: $("#rv-btn-pause"),
    btnStop: $("#rv-btn-stop"),
    pbTime: $("#rv-pb-time"),
    pbTrack: $("#rv-pb-track"),
    pbProgress: $("#rv-pb-progress"),
    downloadNote: $("#rv-download-note"),
  };

  /* ---------- helpers ---------- */
  function themeById(id) { return REELS_BG_THEMES.find((t) => t.id === id) || REELS_BG_THEMES[0]; }

  function pickPhrase() {
    const pool = REELS_PHRASES[state.category] || REELS_PHRASES.oracao;
    const p = randomItem(pool);
    el.scriptText.value = p.text;
    updateMeta();
  }

  function updateMeta() {
    const text = el.scriptText.value.trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    const estSecs = Math.round(words / 2.7);
    el.scriptMeta.textContent = words + " palavras · ~" + estSecs + "s de narração · vídeo: 7s";
  }

  /* ---------- chips ---------- */
  function renderChips() {
    el.categoryChips.innerHTML = "";
    REELS_CATEGORIES.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (c.id === state.category ? " active" : "");
      b.textContent = c.emoji + " " + c.label;
      b.addEventListener("click", () => { state.category = c.id; pickPhrase(); renderChips(); savePrefs(); });
      el.categoryChips.appendChild(b);
    });

    el.themeChips.innerHTML = "";
    REELS_BG_THEMES.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (t.id === state.theme ? " active" : "");
      b.textContent = t.emoji + " " + t.label;
      b.addEventListener("click", () => { state.theme = t.id; renderChips(); savePrefs(); });
      el.themeChips.appendChild(b);
    });

    el.styleChips.innerHTML = "";
    Object.entries(REELS_STYLES).forEach(([k, s]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (k === state.style ? " active" : "");
      b.textContent = s.label;
      b.addEventListener("click", () => { state.style = k; renderChips(); savePrefs(); });
      el.styleChips.appendChild(b);
    });

    el.sourceChips.innerHTML = "";
    Object.entries(REELS_SOURCES).forEach(([k, s]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (k === state.source ? " active" : "");
      b.textContent = s.label;
      b.title = s.desc;
      b.addEventListener("click", () => { state.source = k; renderChips(); savePrefs(); });
      el.sourceChips.appendChild(b);
    });

    const src = REELS_SOURCES[state.source] || REELS_SOURCES.cloudflare;
    const style = REELS_STYLES[state.style] || REELS_STYLES.cinematic;
    el.engineNote.textContent = "✦ " + src.label + " · " + style.label + " · 1080×1920 (9:16) · 7s";
  }

  /* ---------- imagem de fundo ---------- */
  async function cfImage(prompt) {
    const res = await fetch("/api/cf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, steps: 8, seed: randomInt(0, 999999) }),
    });
    if (!res.ok) throw new Error("Cloudflare: " + (await res.text().catch(() => "")));
    const blob = await res.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  async function pollImage(prompt) {
    const url = "/api/image?prompt=" + encodeURIComponent(prompt) + "&width=1080&height=1920&seed=" + randomInt(0, 999999) + "&nologo=true&model=flux&enhance=true";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Pollinations: " + res.status);
    const blob = await res.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  async function stockPhoto(provider, query) {
    const isPexels = provider === "pexels";
    const searchUrl = (isPexels ? "/api/pexels/photos" : "/api/pixabay/photos") +
      "?q=" + encodeURIComponent(query) + "&per_page=10" +
      (isPexels ? "&orientation=portrait" : "&min_width=800&min_height=1200");
    const proxyPath = isPexels ? "/api/pexels/proxy" : "/api/pixabay/proxy";
    const res = await fetch(searchUrl);
    if (!res.ok) throw new Error((isPexels ? "Pexels" : "Pixabay") + ": " + (await res.text().catch(() => "")));
    const j = await res.json();
    const photos = (j.photos || []).filter((p) => p.image);
    if (!photos.length) throw new Error("Nenhuma foto encontrada.");
    const portrait = photos.filter((p) => p.height >= p.width * 1.7);
    const pick = randomItem(portrait.length >= 3 ? portrait : photos);
    const r2 = await fetch(proxyPath + "?url=" + encodeURIComponent(pick.image));
    if (!r2.ok) throw new Error("Proxy: " + r2.status);
    const blob = await r2.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  function generateFallbackImage() {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const colors = [
      ["#1a1040", "#c8860a", "#f5d78e"],
      ["#0b0a12", "#8b6fe8", "#e6c35a"],
      ["#1a0f00", "#daa520", "#f5e6b8"],
    ];
    const c = randomItem(colors);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, c[0]);
    g.addColorStop(0.5, c[1]);
    g.addColorStop(1, c[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 3 + 1, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,240," + (Math.random() * 0.25 + 0.05) + ")";
      ctx.fill();
    }
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob || new Blob([""], { type: "image/png" })), "image/jpeg", 0.92);
    });
  }

  async function generateBackground() {
    const theme = themeById(state.theme);
    const style = REELS_STYLES[state.style] || REELS_STYLES.cinematic;
    const query = theme.query || "spiritual nature golden light";
    const scene = theme.scene || "spiritual golden light, vertical composition, no text";
    const prompt = "breathtaking ultra-high-quality spiritual artwork, absolutely no text, no letters, no words, no watermark, no signature, " + scene + ", " + style.prompt + ", majestic atmosphere, luminous divine radiance, exquisite detail, perfect balanced composition, professional color grading, cinematic depth of field, masterpiece, 8k";

    const order = [state.source].concat(Object.keys(REELS_SOURCES).filter((k) => k !== state.source));
    for (const src of order) {
      try {
        if (src === "cloudflare") return { blob: await cfImage(prompt), src: "cloudflare" };
        if (src === "pollinations") return { blob: await pollImage(prompt), src: "pollinations" };
        if (src === "pexels") return { blob: await stockPhoto("pexels", query), src: "pexels" };
        if (src === "pixabay") return { blob: await stockPhoto("pixabay", query), src: "pixabay" };
      } catch (e) { console.warn("BG src " + src + " falhou:", e); }
    }
    return { blob: await generateFallbackImage(), src: "fallback" };
  }

  function loadHtmlImage(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
      img.src = URL.createObjectURL(blob);
    });
  }

  /* ---------- canvas rendering ---------- */
  async function ensureCanvasFonts() {
    try {
      await Promise.all([
        document.fonts.load("700 48px 'Playfair Display'"),
        document.fonts.load("600 40px 'Poppins'"),
      ]);
    } catch (e) {}
    await document.fonts.ready;
  }

  function wrapLines(ctx, text, font, maxW, maxLines) {
    ctx.font = font;
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines.slice(0, maxLines || 99);
  }

  function drawImageCover(ctx, img) {
    if (!img || !img.width) { ctx.fillStyle = "#05040c"; ctx.fillRect(0, 0, W, H); return; }
    const ir = img.width / img.height;
    const cr = W / H;
    let sx, sy, sw, sh;
    if (ir > cr) { sh = img.height; sw = img.height * cr; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = img.width / cr; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  }

  function drawScrim(ctx, intensity) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(8,8,16," + (intensity * 0.7) + ")");
    g.addColorStop(0.3, "rgba(8,8,16," + (intensity * 0.35) + ")");
    g.addColorStop(0.7, "rgba(8,8,16," + (intensity * 0.4) + ")");
    g.addColorStop(1, "rgba(8,8,16," + (intensity * 0.8) + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawWatermark(ctx) {
    ctx.save();
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.font = "600 30px 'Poppins','Segoe UI',sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillStyle = "rgba(230,195,90,0.95)";
    ctx.fillText("ALVORADA DO CÉU ✧", W - 34, H - 56);
    ctx.letterSpacing = "0px";
    ctx.font = "500 26px 'Poppins','Segoe UI',sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("@alvoradadoceu", W - 34, H - 20);
    ctx.restore();
  }

  function drawFrame(ctx, img, text) {
    drawImageCover(ctx, img);
    drawScrim(ctx, 0.7);

    const tFamily = "'Playfair Display','Cormorant Garamond',Georgia,serif";

    /* decorative line */
    ctx.save();
    ctx.strokeStyle = "rgba(230,195,90,0.3)";
    ctx.lineWidth = Math.max(2, W * 0.002);
    const lineY = H * 0.32;
    ctx.beginPath();
    ctx.moveTo(W * 0.25, lineY);
    ctx.lineTo(W * 0.75, lineY);
    ctx.stroke();
    ctx.restore();

    /* main text */
    const lines = wrapLines(ctx, text, "600 " + Math.min(W * 0.065, 76) + "px " + tFamily, W * 0.82, 10);
    const fontSize = Math.min(W * 0.065, 76);
    const lh = fontSize * 1.4;
    const blockH = lines.length * lh;
    const topY = H * 0.5 - blockH / 2;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = fontSize * 0.2;
    ctx.shadowOffsetY = fontSize * 0.06;
    ctx.fillStyle = "#fffdf6";
    ctx.font = "600 " + fontSize + "px " + tFamily;
    let y = topY;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += lh;
    }
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    /* decorative line below */
    ctx.save();
    ctx.strokeStyle = "rgba(230,195,90,0.3)";
    ctx.lineWidth = Math.max(2, W * 0.002);
    const lineY2 = H * 0.5 + blockH / 2 + H * 0.03;
    ctx.beginPath();
    ctx.moveTo(W * 0.25, lineY2);
    ctx.lineTo(W * 0.75, lineY2);
    ctx.stroke();
    ctx.restore();

    drawWatermark(ctx);
  }

  /* ---------- Ken Burns (Canva-style smooth) ---------- */
  const KB_SEGS = [
    { zoomA: 1.00, zoomB: 1.08, panX:  0.02, panY:  0.01 },
    { zoomA: 1.08, zoomB: 1.14, panX: -0.01, panY:  0.015 },
    { zoomA: 1.14, zoomB: 1.04, panX: -0.02, panY: -0.01 },
    { zoomA: 1.04, zoomB: 1.10, panX:  0.015, panY: -0.015 },
    { zoomA: 1.10, zoomB: 1.00, panX: -0.005, panY:  0.005 },
  ];

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function drawKenBurns(ctx, img, p, segIdx) {
    if (!img || !img.width) { ctx.fillStyle = "#05040c"; ctx.fillRect(0, 0, W, H); return; }
    const seg = KB_SEGS[segIdx % KB_SEGS.length];
    const local = (p * KB_SEGS.length) % 1;
    const t = easeInOutCubic(local);
    const zoom = seg.zoomA + (seg.zoomB - seg.zoomA) * t;
    const ox = (local - 0.5) * W * seg.panX * 2;
    const oy = (local - 0.5) * H * seg.panY * 2;
    const iw = W * zoom; const ih = H * zoom;
    const ir = img.width / img.height; const cr = W / H;
    let sx, sy, sw, sh;
    if (ir > cr) { sw = img.height * cr; sh = img.height; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = img.width / cr; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, ox, oy, iw, ih);
  }

  function drawTextOverlay(ctx, text, textAlpha) {
    const tFamily = "'Playfair Display','Cormorant Garamond',Georgia,serif";
    ctx.save();
    ctx.globalAlpha = textAlpha;
    ctx.strokeStyle = "rgba(230,195,90,0.3)";
    ctx.lineWidth = Math.max(2, W * 0.002);
    const lineY = H * 0.32;
    ctx.beginPath();
    ctx.moveTo(W * 0.25, lineY);
    ctx.lineTo(W * 0.75, lineY);
    ctx.stroke();
    ctx.restore();

    const lines = wrapLines(ctx, text, "600 " + Math.min(W * 0.065, 76) + "px " + tFamily, W * 0.82, 10);
    const fontSize = Math.min(W * 0.065, 76);
    const lh = fontSize * 1.4;
    const blockH = lines.length * lh;
    const topY = H * 0.5 - blockH / 2;

    ctx.save();
    ctx.globalAlpha = textAlpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = fontSize * 0.2;
    ctx.shadowOffsetY = fontSize * 0.06;
    ctx.fillStyle = "#fffdf6";
    ctx.font = "600 " + fontSize + "px " + tFamily;
    let y = topY;
    for (const line of lines) { ctx.fillText(line, W / 2, y); y += lh; }
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = textAlpha;
    ctx.strokeStyle = "rgba(230,195,90,0.3)";
    ctx.lineWidth = Math.max(2, W * 0.002);
    const lineY2 = H * 0.5 + blockH / 2 + H * 0.03;
    ctx.beginPath();
    ctx.moveTo(W * 0.25, lineY2);
    ctx.lineTo(W * 0.75, lineY2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = textAlpha;
    drawWatermark(ctx);
    ctx.restore();
  }

  /* ---------- status ---------- */
  function setStatus(msg, pct) {
    el.progressRow.classList.add("show");
    if (pct != null) el.progressFill.style.width = Math.round(clamp(pct, 0, 1) * 100) + "%";
    el.progressStatus.textContent = msg;
  }
  function resetStatus() {
    el.progressRow.classList.remove("show");
    el.progressFill.style.width = "0%";
    el.progressStatus.textContent = "";
  }

  /* ---------- geração de imagem ---------- */
  async function handleGenerateImage() {
    if (state.busy) return;
    state.busy = true;
    el.btnGenerate.disabled = true;

    try {
      el.placeholder.hidden = true;
      el.video.hidden = true;
      el.image.hidden = true;
      el.canvas.hidden = false;
      el.canvas.width = W;
      el.canvas.height = H;
      el.btnDownload.disabled = true;
      hidePlaybackBar();

      const text = el.scriptText.value.trim();
      if (!text) { showToast("Escreva a frase primeiro. ✧", "warn"); state.busy = false; el.btnGenerate.disabled = false; return; }

      setStatus("Buscando cenário…", 0.05);
      const bg = await generateBackground();
      const img = await loadHtmlImage(bg.blob);

      await ensureCanvasFonts();
      const ctx = el.canvas.getContext("2d");
      drawFrame(ctx, img, text);

      const pngBlob = await new Promise((resolve) => {
        el.canvas.toBlob((b) => resolve(b || new Blob([], { type: "image/png" })), "image/png", 1);
      });
      state.lastBlob = pngBlob;
      state.lastMime = "image/png";

      el.canvas.hidden = true;
      el.image.src = URL.createObjectURL(pngBlob);
      el.image.hidden = false;
      el.video.hidden = true;
      hidePlaybackBar();
      el.btnDownload.disabled = false;
      el.btnDownload.textContent = "⬇ Baixar imagem (PNG)";

      state.caption = buildCaption(text);
      el.captionText.value = state.caption;
      el.captionCard.hidden = false;
      el.btnCopyCaption.disabled = false;

      setStatus("Imagem pronta! ✧", 1);
      showToast("Imagem 1080×1920 pronta. ✧", "ok");
    } catch (e) {
      console.error(e);
      el.video.hidden = true;
      el.image.hidden = true;
      el.canvas.hidden = true;
      el.placeholder.hidden = false;
      hidePlaybackBar();
      showToast("Erro: " + (e.message || "tente novamente."), "error");
      setStatus("Falha na geração.", 0);
    } finally {
      state.busy = false;
      el.btnGenerate.disabled = false;
      setTimeout(resetStatus, 5000);
    }
  }

  /* ---------- geração de vídeo ---------- */
  function verifyVideoResolution(blob) {
    return new Promise((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => resolve({ w: v.videoWidth || 0, h: v.videoHeight || 0 });
      v.onerror = () => resolve({ w: 0, h: 0 });
      v.src = URL.createObjectURL(blob);
    });
  }

  function pickMime() {
    const cands = [
      'video/mp4;codecs="avc1.64002A,mp4a.40.2"',
      'video/mp4;codecs="avc1.640028,mp4a.40.2"',
      'video/mp4;codecs="avc1.64002A"',
      'video/mp4;codecs="avc1.640028"',
      "video/mp4;codecs=avc1",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    for (const c of cands) {
      try { if (window.MediaRecorder && MediaRecorder.isTypeSupported(c)) return c; } catch (e) {}
    }
    return "";
  }

  async function handleGenerateVideo() {
    if (state.busy) return;
    state.busy = true;
    el.btnGenerate.disabled = true;

    try {
      el.placeholder.hidden = true;
      el.video.hidden = true;
      el.image.hidden = true;
      el.canvas.hidden = false;
      el.canvas.width = W;
      el.canvas.height = H;
      el.btnDownload.disabled = true;
      hidePlaybackBar();

      const text = el.scriptText.value.trim();
      if (!text) { showToast("Escreva a frase primeiro. ✧", "warn"); state.busy = false; el.btnGenerate.disabled = false; return; }

      const totalDur = 10;

      setStatus("Buscando cenário…", 0.05);
      const bg = await generateBackground();
      const img = await loadHtmlImage(bg.blob);

      const ctx = el.canvas.getContext("2d");

      const mime = pickMime();
      if (!mime) throw new Error("Seu navegador não suporta gravação de vídeo.");

      const stream = el.canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8000000 });
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = (e) => reject(e.error || new Error("Erro na gravação"));
      });

      recorder.start(250);
      setStatus("Gravando vídeo (~" + totalDur + "s)…", 0.1);

      const SAFETY_TIMEOUT = (totalDur + 5) * 1000;
      await new Promise((resolve, reject) => {
        let last = performance.now();
        let elapsed = 0;
        let resolved = false;
        const safetyTimer = setTimeout(() => {
          if (!resolved) { resolved = true; try { recorder.stop(); } catch (e) {} reject(new Error("Timeout na gravação.")); }
        }, SAFETY_TIMEOUT);

        function frame(now) {
          if (resolved) return;
          const rawDt = (now - last) / 1000;
          last = now;
          const dt = Math.min(rawDt, 0.5);
          elapsed += dt;
          const p = clamp(elapsed / totalDur, 0, 1);

          /* Ken Burns background — smooth segments */
          const segIdx = Math.floor(p * KB_SEGS.length);
          ctx.save();
          drawKenBurns(ctx, img, p, Math.min(segIdx, KB_SEGS.length - 1));
          ctx.restore();

          /* Scrim */
          drawScrim(ctx, 0.7);

          /* Text fade-in: 0→1 over first 1.5s, hold at 1 */
          const textAlpha = clamp(elapsed / 1.5, 0, 1);
          drawTextOverlay(ctx, text, textAlpha);

          el.progressFill.style.width = Math.round(p * 100) + "%";
          el.progressStatus.textContent = "Gravando… " + Math.round(p * 100) + "%";

          if (elapsed >= totalDur + 0.3) {
            resolved = true;
            clearTimeout(safetyTimer);
            setTimeout(() => { try { recorder.stop(); } catch (e) {} }, 100);
            resolve();
            return;
          }
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });

      await stopped;

      const type = mime.includes("mp4") ? "video/mp4" : "video/webm";
      const blob = new Blob(chunks, { type });
      if (blob.size < 20000) throw new Error("Gravação falhou (arquivo muito pequeno).");

      const dim = await verifyVideoResolution(blob);
      if (dim.w !== W || dim.h !== H) {
        showToast("Atenção: vídeo saiu em " + (dim.w || "?") + "×" + (dim.h || "?") + ". Gere novamente.", "warn");
      }

      state.lastBlob = blob;
      state.lastMime = type;

      el.canvas.hidden = true;
      el.video.src = URL.createObjectURL(blob);
      el.video.hidden = false;
      showPlaybackBar();
      el.btnDownload.disabled = false;
      el.btnDownload.textContent = type === "video/mp4" ? "⬇ Baixar MP4" : "⬇ Baixar vídeo (WebM)";

      state.caption = buildCaption(text);
      el.captionText.value = state.caption;
      el.captionCard.hidden = false;
      el.btnCopyCaption.disabled = false;

      setStatus("Vídeo pronto! ✧", 1);
      showToast(type === "video/mp4" ? "Vídeo MP4 1080×1920 pronto. ✧" : "Vídeo pronto! Converta para MP4. ✧", "ok");
    } catch (e) {
      console.error(e);
      el.video.hidden = true;
      el.image.hidden = true;
      el.canvas.hidden = true;
      el.placeholder.hidden = false;
      hidePlaybackBar();
      showToast("Erro: " + (e.message || "tente novamente."), "error");
      setStatus("Falha na gravação.", 0);
    } finally {
      state.busy = false;
      el.btnGenerate.disabled = false;
      setTimeout(resetStatus, 5000);
    }
  }

  /* ---------- legenda ---------- */
  function buildCaption(text) {
    const lines = [
      "✨ " + text.split("\n")[0],
      "",
      text,
      "",
      "Comente AMÉM se essa mensagem tocou seu coração 🙏",
      "Salve para ouvir quando precisar 💛",
      "Compartilhe com alguém que precisa hoje ✨",
      "",
      "#oracaododia #fe #deus #versiculododia #reflexaoespiritual #reels #viral #vidacrista #palavradedeus #fé #jesus #espiritualidade",
    ];
    return lines.join("\n");
  }

  /* ---------- download ---------- */
  function triggerDownload(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function downloadReel() {
    if (!state.lastBlob) return;
    const isImage = state.lastMime === "image/png";
    const ext = isImage ? "png" : (state.lastMime === "video/mp4" ? "mp4" : "webm");
    triggerDownload(state.lastBlob, "alvorada-reel." + ext);
    showToast(isImage ? "Imagem salva. ✧" : "Vídeo salvo. ✧", "ok");
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(state.caption || el.captionText.value);
      showToast("Legenda copiada! ✧", "ok");
    } catch (e) {
      el.captionText.select();
      document.execCommand("copy");
      showToast("Legenda copiada! ✧", "ok");
    }
  }

  /* ---------- playback ---------- */
  function fmtTime(s) {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    return Math.floor(s / 60) + ":" + (Math.floor(s % 60) < 10 ? "0" : "") + Math.floor(s % 60);
  }

  function updatePlaybackUI() {
    const v = el.video;
    if (!v || v.hidden) return;
    el.pbTime.textContent = fmtTime(v.currentTime) + " / " + fmtTime(v.duration);
    el.pbProgress.style.width = (v.duration > 0 ? (v.currentTime / v.duration * 100) : 0) + "%";
  }

  function showPlaybackBar() {
    el.playbackBar.hidden = false;
    el.btnStop.disabled = false;
    el.btnPlay.hidden = false;
    el.btnPause.hidden = true;
    updatePlaybackUI();
  }

  function hidePlaybackBar() {
    el.playbackBar.hidden = true;
  }

  /* ---------- prefs ---------- */
  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({
        category: state.category, theme: state.theme,
        style: state.style, source: state.source,
      }));
    } catch (e) {}
  }

  function loadPrefs() {
    try {
      const j = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
      if (!j) return;
      if (REELS_CATEGORIES.some((c) => c.id === j.category)) state.category = j.category;
      if (REELS_BG_THEMES.some((t) => t.id === j.theme)) state.theme = j.theme;
      if (REELS_STYLES[j.style]) state.style = j.style;
      if (REELS_SOURCES[j.source]) state.source = j.source;
    } catch (e) {}
  }

  /* ---------- init ---------- */
  function init() {
    loadPrefs();
    renderChips();
    pickPhrase();

    el.scriptText.addEventListener("input", updateMeta);

    el.btnNew.addEventListener("click", pickPhrase);

    el.btnGenerate.addEventListener("click", () => {
      if (el.btnGenerate.dataset.mode === "video") handleGenerateVideo();
      else handleGenerateImage();
    });

    el.btnDownload.addEventListener("click", downloadReel);
    el.btnCopyCaption.addEventListener("click", copyCaption);

    /* mode toggle */
    const modeChips = document.querySelectorAll("#rv-mode-chips .chip");
    modeChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        modeChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        const mode = chip.dataset.mode || "image";
        el.btnGenerate.dataset.mode = mode;
        el.btnGenerate.textContent = mode === "video" ? "🎬 Gerar vídeo (7s)" : "✧ Gerar imagem";
      });
    });

    /* playback */
    if (el.btnPlay) el.btnPlay.addEventListener("click", () => { el.video.play(); el.btnPlay.hidden = true; el.btnPause.hidden = false; });
    if (el.btnPause) el.btnPause.addEventListener("click", () => { el.video.pause(); el.btnPlay.hidden = false; el.btnPause.hidden = true; });
    if (el.btnStop) el.btnStop.addEventListener("click", () => { el.video.pause(); el.video.currentTime = 0; el.btnPlay.hidden = false; el.btnPause.hidden = true; updatePlaybackUI(); });
    if (el.pbTrack) el.pbTrack.addEventListener("click", (e) => {
      const rect = el.pbTrack.getBoundingClientRect();
      el.video.currentTime = clamp((e.clientX - rect.left) / rect.width, 0, 1) * (el.video.duration || 0);
      updatePlaybackUI();
    });
    if (el.video) {
      el.video.addEventListener("timeupdate", updatePlaybackUI);
      el.video.addEventListener("ended", () => { el.btnPlay.hidden = false; el.btnPause.hidden = true; updatePlaybackUI(); });
      el.video.addEventListener("click", () => {
        if (el.video.paused) { el.video.play(); el.btnPlay.hidden = true; el.btnPause.hidden = false; }
        else { el.video.pause(); el.btnPlay.hidden = false; el.btnPause.hidden = true; }
      });
    }

    /* mobile nav */
    const navToggle = document.getElementById("nav-toggle");
    const siteNav = document.getElementById("site-nav");
    if (navToggle && siteNav) {
      navToggle.addEventListener("click", () => {
        navToggle.classList.toggle("open");
        siteNav.classList.toggle("open");
      });
    }

    /* scroll reveal */
    document.querySelectorAll(".tip, .pipe, .badge, .hero h1, .hero .sub, .hero-actions, .hero-badges, .section-head").forEach((el2) => {
      el2.classList.add("reveal-up");
    });
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal-up").forEach((el2) => obs.observe(el2));
    document.querySelectorAll(".hero .reveal-up").forEach((el2) => el2.classList.add("visible"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
