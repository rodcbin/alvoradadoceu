/* =========================================================
   Alvorada do Céu — Reels Virais (9:16)
   Motor: 5 templates virais, multi-fonte de imagens,
   Canvas 1080x1920, Ken Burns, exportação PNG + MP4/WebM,
   legenda com IA (Cloudflare Workers AI).
   ========================================================= */

(() => {
  "use strict";

  const W = 1080;
  const H = 1920;
  const PREFS_KEY = "alvorada_rv_prefs_v1";

  /* ---------- helpers ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let toastTimer = null;
  function showToast(msg, type = "info") {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "toast " + type + " show";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = "toast " + type; }, 4200);
  }

  /* ---------- estado ---------- */
  const state = {
    template: "oracao-retencao",
    bgTheme: "golden-light",
    style: "cinematic",
    source: "cloudflare",
    content: null,
    busy: false,
    lastBlob: null,
    lastMime: "",
    caption: "",
    customText: "",
    isLight: false,
  };

  /* ---------- DOM refs ---------- */
  const el = {
    templateGrid: $("#template-grid"),
    themeChips: $("#bg-theme-chips"),
    styleChips: $("#rv-style-chips"),
    sourceChips: $("#rv-source-chips"),
    scriptText: $("#rv-script-text"),
    scriptMeta: $("#rv-script-meta"),
    btnNewContent: $("#btn-rv-new"),
    btnAiContent: $("#btn-rv-ai"),
    btnGenerate: $("#btn-rv-generate"),
    videoStage: $("#rv-video-stage"),
    placeholder: $("#rv-stage-placeholder"),
    video: $("#rv-video"),
    image: $("#rv-image"),
    canvas: $("#rv-canvas"),
    progressRow: $("#rv-progress-row"),
    progressFill: $("#rv-progress-fill"),
    progressStatus: $("#rv-progress-status"),
    btnDownload: $("#btn-rv-download"),
    btnCopyCaption: $("#btn-rv-copy-caption"),
    captionCard: $("#rv-caption-card"),
    captionText: $("#rv-caption-text"),
    engineNote: $("#rv-engine-note"),
    playbackBar: $("#rv-playback-bar"),
    btnPlay: $("#btn-rv-play"),
    btnPause: $("#btn-rv-pause"),
    btnStop: $("#btn-rv-stop"),
    pbTime: $("#rv-pb-time"),
    pbTrack: $("#rv-pb-track"),
    pbProgress: $("#rv-pb-progress"),
    themeToggle: $("#rv-theme-toggle"),
    hookText: $("#rv-hook-text"),
    btnCopyHook: $("#btn-rv-copy-hook"),
    btnRegenerateHook: $("#btn-rv-regen-hook"),
    formatOptions: $("#rv-format-options"),
    downloadNote: $("#rv-download-note"),
  };

  /* ---------- template ---------- */
  function templateById(id) {
    return RV_TEMPLATES.find((t) => t.id === id) || RV_TEMPLATES[0];
  }
  function bgThemeById(id) {
    return RV_BG_THEMES.find((t) => t.id === id) || RV_BG_THEMES[0];
  }

  /* ---------- chips ---------- */
  function makeChip(label, extra) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.innerHTML = label;
    if (extra) for (const k in extra) if (extra[k] != null) b.dataset[k] = String(extra[k]);
    return b;
  }

  function renderChips() {
    /* template grid */
    el.templateGrid.innerHTML = "";
    RV_TEMPLATES.forEach((t) => {
      const card = document.createElement("div");
      card.className = "template-card" + (t.id === state.template ? " active" : "");
      card.innerHTML = '<span class="tc-emoji">' + t.emoji + '</span><div class="tc-label">' + t.label + '</div><div class="tc-desc">' + t.desc + '</div>';
      card.addEventListener("click", () => { state.template = t.id; try { pickContent(); } catch (e) {} renderChips(); savePrefs(); });
      el.templateGrid.appendChild(card);
    });

    /* bg themes */
    el.themeChips.innerHTML = "";
    RV_BG_THEMES.forEach((t) => {
      const b = makeChip(t.emoji + " " + t.label, { bgtheme: t.id });
      if (t.id === state.bgTheme) b.classList.add("active");
      b.addEventListener("click", () => { state.bgTheme = t.id; renderChips(); savePrefs(); });
      el.themeChips.appendChild(b);
    });

    /* styles */
    el.styleChips.innerHTML = "";
    Object.entries(RV_STYLES).forEach(([k, s]) => {
      const b = makeChip(s.label, { style: k });
      if (k === state.style) b.classList.add("active");
      b.addEventListener("click", () => { state.style = k; renderChips(); savePrefs(); });
      el.styleChips.appendChild(b);
    });

    /* sources */
    el.sourceChips.innerHTML = "";
    Object.entries(RV_IMAGE_SOURCES).forEach(([k, s]) => {
      const b = makeChip(s.label, { source: k });
      if (k === state.source) b.classList.add("active");
      b.title = s.desc;
      b.addEventListener("click", () => { state.source = k; renderChips(); savePrefs(); });
      el.sourceChips.appendChild(b);
    });

    /* engine note */
    const tmpl = templateById(state.template);
    const src = RV_IMAGE_SOURCES[state.source] || RV_IMAGE_SOURCES.cloudflare;
    const style = RV_STYLES[state.style] || RV_STYLES.cinematic;
    el.engineNote.textContent = "✦ " + tmpl.label + " · " + src.label + " · " + style.label + " · 1080×1920 (9:16) · " + tmpl.duration + "s";

    /* download note */
    if (el.downloadNote) el.downloadNote.textContent = "Instagram prefere MP4. Se o navegador gerar WebM, converta no CapCut grátis antes de postar.";
  }

  /* ---------- conteúdo ---------- */
  function pickContent() {
    const pool = RV_CONTENT_BY_TEMPLATE[state.template] || RV_ORACAO_RETENCAO;
    const content = randomItem(pool);
    state.content = content;
    state.customText = "";
    el.scriptText.value = content.text;
    updateScriptMeta();
    generateHook();
  }

  function updateScriptMeta() {
    const text = el.scriptText.value.trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    const tmpl = templateById(state.template);
    const estSecs = Math.round(words / 2.7);
    el.scriptMeta.textContent = words + " palavras · ~" + estSecs + "s de narração · duração do vídeo: " + tmpl.duration + "s";
  }

  /* ---------- hook com IA ---------- */
  async function generateHook() {
    if (state.busy) return;
    const tmpl = templateById(state.template);
    const btn = el.btnRegenerateHook;
    const prev = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Pensando…"; }
    setStatus("Gerando gancho viral com IA…", 0.1);
    try {
      const res = await fetch("/api/ai-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "livre", theme: tmpl.label + " viral espiritual", duration: 15 }),
      });
      if (!res.ok) throw new Error("IA indisponível");
      const j = await res.json();
      if (j.text) {
        const hook = j.text.split(/[.!?]/)[0].trim().toUpperCase().slice(0, 60) || tmpl.hook;
        if (el.hookText) el.hookText.textContent = hook;
      }
    } catch (e) {
      console.error("Hook IA:", e);
      if (el.hookText) el.hookText.textContent = tmpl.hook;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = prev; }
      resetStatus();
    }
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
    const tmpl = templateById(state.template);
    const theme = bgThemeById(state.bgTheme);
    const style = RV_STYLES[state.style] || RV_STYLES.cinematic;
    const query = RV_STOCK_QUERIES[state.bgTheme] || "spiritual nature golden light";

    const scene = (tmpl.scenes && tmpl.scenes[0]) || theme.scene || "spiritual golden light, vertical composition, no text";
    const prompt = "breathtaking ultra-high-quality spiritual artwork, absolutely no text, no letters, no words, no watermark, no signature, " + scene + ", " + style.prompt + ", majestic atmosphere, luminous divine radiance, exquisite detail, perfect balanced composition, professional color grading, cinematic depth of field, masterpiece, 8k";

    const order = [state.source].concat(Object.keys(RV_IMAGE_SOURCES).filter((k) => k !== state.source));
    for (const src of order) {
      try {
        if (src === "cloudflare") return { blob: await cfImage(prompt), src: "cloudflare" };
        if (src === "pollinations") return { blob: await pollImage(prompt), src: "pollinations" };
        if (src === "pexels") return { blob: await stockPhoto("pexels", query), src: "pexels" };
        if (src === "pixabay") return { blob: await stockPhoto("pixabay", query), src: "pixabay" };
      } catch (e) {
        console.warn("BG src " + src + " falhou:", e);
      }
    }
    console.warn("Todas as fontes falharam — usando fallback.");
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

  function fitFont(ctx, text, weight, sizePx, family, maxW, minPx) {
    let s = sizePx;
    let f = weight + " " + Math.round(s) + "px " + family;
    ctx.font = f;
    while (ctx.measureText(text).width > maxW && s > minPx) {
      s -= 1;
      f = weight + " " + Math.round(s) + "px " + family;
      ctx.font = f;
    }
    return f;
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

  function drawImageCover(ctx, img) {
    if (!img || !img.width) { ctx.fillStyle = "#05040c"; ctx.fillRect(0, 0, W, H); return; }
    const ir = img.width / img.height;
    const cr = W / H;
    let sx, sy, sw, sh;
    if (ir > cr) { sh = img.height; sw = img.height * cr; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = img.width / cr; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  }

  /* --- renderizações por template --- */

  function drawOracaoRetencao(ctx, img, content) {
    drawImageCover(ctx, img);
    drawScrim(ctx, 0.65);

    /* moldura dourada sutil */
    const inset = W * 0.035;
    ctx.save();
    ctx.strokeStyle = "rgba(230,195,90,0.35)";
    ctx.lineWidth = Math.max(2, W * 0.0025);
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
    ctx.restore();

    /* título */
    const hook = (state.hookText ? state.hookText.textContent : templateById(state.template).hook) || "";
    const tFamily = "'Playfair Display','Cormorant Garamond',Georgia,serif";
    const tSize = Math.min(W * 0.055, 64);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = tSize * 0.14;
    ctx.fillStyle = "rgba(230,195,90,0.95)";
    ctx.font = "700 " + tSize + "px " + tFamily;
    ctx.fillText(hook.toUpperCase(), W / 2, H * 0.12);
    ctx.shadowBlur = 0;

    /* texto principal */
    const text = content ? content.text : "";
    const fontSize = Math.min(W * 0.058, 68);
    const font = "600 " + fontSize + "px " + tFamily;
    const lines = wrapLines(ctx, text, font, W * 0.84, 12);
    const lh = fontSize * 1.35;
    const blockH = lines.length * lh;
    const topY = H * 0.5 - blockH / 2;
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = fontSize * 0.18;
    ctx.shadowOffsetY = fontSize * 0.05;
    ctx.fillStyle = "#fffdf6";
    ctx.font = font;
    let y = topY;
    for (const line of lines) { ctx.fillText(line, W / 2, y); y += lh; }
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    drawWatermark(ctx);
  }

  function drawQuizBiblico(ctx, img, content) {
    drawImageCover(ctx, img);
    drawScrim(ctx, 0.6);

    const tFamily = "'Playfair Display','Cormorant Garamond',Georgia,serif";
    const pFamily = "'Poppins','Segoe UI',sans-serif";

    /* emoji + título */
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = Math.round(W * 0.1) + "px 'Segoe UI Emoji','Noto Color Emoji',sans-serif";
    ctx.fillText("❓", W / 2, H * 0.1);

    const title = content ? content.text.split("\n")[0] : "";
    const tSize = Math.min(W * 0.055, 64);
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = tSize * 0.14;
    ctx.fillStyle = "rgba(230,195,90,0.95)";
    ctx.font = "700 " + tSize + "px " + tFamily;
    ctx.fillText(title, W / 2, H * 0.18);
    ctx.shadowBlur = 0;

    /* pergunta + alternativas */
    const text = content ? content.text : "";
    const lines = text.split("\n").filter(Boolean);
    const fontSize = Math.min(W * 0.048, 56);
    ctx.fillStyle = "#fffdf6";
    ctx.font = "500 " + fontSize + "px " + pFamily;
    let y = H * 0.3;
    for (const line of lines) {
      const wrapped = wrapLines(ctx, line, "500 " + fontSize + "px " + pFamily, W * 0.82, 3);
      for (const wl of wrapped) {
        const isOption = /^[A-C]\)/.test(wl.trim());
        if (isOption) {
          /* badge dourado para alternativa */
          const bw = ctx.measureText(wl).width + W * 0.05;
          const bh = fontSize * 1.6;
          ctx.save();
          ctx.fillStyle = "rgba(230,195,90,0.18)";
          ctx.strokeStyle = "rgba(230,195,90,0.5)";
          ctx.lineWidth = Math.max(2, W * 0.002);
          if (ctx.roundRect) ctx.roundRect((W - bw) / 2, y - bh / 2, bw, bh, bh / 2);
          else ctx.rect((W - bw) / 2, y - bh / 2, bw, bh);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          ctx.fillStyle = "#ffe9a8";
          ctx.font = "600 " + fontSize + "px " + pFamily;
        }
        ctx.fillText(wl, W / 2, y);
        y += fontSize * 1.5;
      }
    }

    /* CTA */
    ctx.fillStyle = "rgba(230,195,90,0.9)";
    ctx.font = "700 " + Math.round(W * 0.04) + "px " + pFamily;
    ctx.fillText("👆 RESPOSTA NOS COMENTÁRIOS!", W / 2, H * 0.88);

    drawWatermark(ctx);
  }

  function drawNotificacaoIOS(ctx, img, content) {
    drawImageCover(ctx, img);
    drawScrim(ctx, 0.7);

    const pFamily = "'Poppins','Segoe UI',sans-serif";
    const tFamily = "'Cormorant Garamond',Georgia,serif";

    /* fundo do card de notificação */
    const cardW = W * 0.88;
    const cardH = H * 0.35;
    const cardX = (W - cardW) / 2;
    const cardY = H * 0.3;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 10;
    if (ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, cardH, 24);
    else ctx.rect(cardX, cardY, cardW, cardH);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fill();
    ctx.restore();

    /* barra superior do card */
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, 50, [24, 24, 0, 0]);
    else ctx.rect(cardX, cardY, cardW, 50);
    ctx.fillStyle = "rgba(230,195,90,0.15)";
    ctx.fill();
    ctx.restore();

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#1a1408";
    ctx.font = "600 20px " + pFamily;
    ctx.fillText("Deus 🙏", cardX + 20, cardY + 14);

    ctx.textAlign = "right";
    ctx.fillStyle = "#888";
    ctx.font = "400 16px " + pFamily;
    ctx.fillText("agora", cardX + cardW - 20, cardY + 16);

    /* texto da notificação */
    const text = content ? content.text.replace(/📱[^:]*:\s*/, "").replace(/—\s*/g, "") : "";
    const lines = text.split("\n").filter(Boolean);
    const fontSize = Math.min(W * 0.042, 48);
    ctx.textAlign = "left";
    ctx.fillStyle = "#333";
    ctx.font = "500 " + fontSize + "px " + pFamily;
    let y = cardY + 70;
    for (const line of lines) {
      const wrapped = wrapLines(ctx, line, "500 " + fontSize + "px " + pFamily, cardW - 40, 2);
      for (const wl of wrapped) {
        ctx.fillText(wl, cardX + 20, y);
        y += fontSize * 1.45;
      }
    }

    /* título acima do card */
    const hook = (state.hookText ? state.hookText.textContent : "") || templateById(state.template).hook;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(230,195,90,0.95)";
    ctx.font = "700 " + Math.round(W * 0.048) + "px " + tFamily;
    ctx.fillText(hook, W / 2, H * 0.2);

    drawWatermark(ctx);
  }

  function drawContrasteEmocional(ctx, img, content) {
    drawImageCover(ctx, img);
    drawScrim(ctx, 0.6);

    const tFamily = "'Playfair Display','Cormorant Garamond',Georgia,serif";
    const pFamily = "'Poppins','Segoe UI',sans-serif";

    const text = content ? content.text : "";
    const lines = text.split("\n").filter(Boolean);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let y = H * 0.14;

    for (const line of lines) {
      const isBefore = /^💔/.test(line);
      const isAfter = /^✨/.test(line);
      const isMain = isBefore || isAfter || /^[A-Z]/.test(line);

      let fontSize = isMain ? Math.min(W * 0.048, 56) : Math.min(W * 0.042, 48);
      let font = (isMain ? "700" : "500") + " " + fontSize + "px " + (isMain ? tFamily : pFamily);
      let color = "#fffdf6";

      if (isBefore) {
        color = "rgba(232,138,138,0.95)";
        fontSize = Math.min(W * 0.052, 60);
        font = "700 " + fontSize + "px " + tFamily;
      } else if (isAfter) {
        color = "rgba(127,214,160,0.95)";
        fontSize = Math.min(W * 0.052, 60);
        font = "700 " + fontSize + "px " + tFamily;
      }

      const wrapped = wrapLines(ctx, line, font, W * 0.84, 3);
      const lh = fontSize * 1.35;
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = fontSize * 0.14;
      ctx.fillStyle = color;
      ctx.font = font;
      for (const wl of wrapped) {
        ctx.fillText(wl, W / 2, y);
        y += lh;
      }
      y += fontSize * 0.3;
    }
    ctx.shadowBlur = 0;

    drawWatermark(ctx);
  }

  function drawReflexaoMinimalista(ctx, img, content) {
    drawImageCover(ctx, img);
    drawScrim(ctx, 0.75);

    const tFamily = "'Playfair Display','Cormorant Garamond',Georgia,serif";

    /* título */
    const hook = (state.hookText ? state.hookText.textContent : "") || templateById(state.template).hook;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(230,195,90,0.95)";
    ctx.font = "700 " + Math.round(W * 0.042) + "px " + tFamily;
    ctx.fillText(hook, W / 2, H * 0.12);

    /* texto reflexivo */
    const text = content ? content.text : "";
    const lines = text.split("\n").filter(Boolean);
    const fontSize = Math.min(W * 0.06, 72);
    const font = "600 " + fontSize + "px " + tFamily;
    const lh = fontSize * 1.4;
    const blockH = lines.length * lh;
    const topY = H * 0.5 - blockH / 2;
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = fontSize * 0.2;
    ctx.shadowOffsetY = fontSize * 0.06;
    ctx.fillStyle = "#fffdf6";
    ctx.font = font;
    let y = topY;
    for (const line of lines) {
      ctx.fillText(line, W / 2, y);
      y += lh;
    }
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    drawWatermark(ctx);
  }

  const DRAW_FNS = {
    "oracao-retencao": drawOracaoRetencao,
    "quiz-biblico": drawQuizBiblico,
    "notificacao-ios": drawNotificacaoIOS,
    "contraste-emocional": drawContrasteEmocional,
    "reflexao-minimalista": drawReflexaoMinimalista,
  };

  /* ---------- Ken Burns para vídeo ---------- */
  const KB_DIRS = [
    { zoomStart: 1.0, zoomEnd: 1.15, dx: 0.02, dy: 0.01 },
    { zoomStart: 1.15, zoomEnd: 1.0, dx: -0.015, dy: 0.008 },
    { zoomStart: 1.02, zoomEnd: 1.12, dx: -0.02, dy: -0.01 },
  ];

  function drawKenBurns(ctx, img, p, dirIdx) {
    if (!img || !img.width) { ctx.fillStyle = "#05040c"; ctx.fillRect(0, 0, W, H); return; }
    const dir = KB_DIRS[dirIdx % KB_DIRS.length];
    const zoom = dir.zoomStart + (dir.zoomEnd - dir.zoomStart) * p;
    const ox = (p - 0.5) * W * dir.dx;
    const oy = (p - 0.5) * H * dir.dy;
    const iw = W * zoom;
    const ih = H * zoom;
    const ir = img.width / img.height;
    const cr = W / H;
    let sx, sy, sw, sh;
    if (ir > cr) { sw = img.height * cr; sh = img.height; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = img.width / cr; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, ox, oy, iw, ih);
  }

  /* ---------- status UI ---------- */
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

  /* ---------- geração principal ---------- */
  async function handleGenerate() {
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

      /* texto customizado ou do banco */
      const text = el.scriptText.value.trim();
      if (!text) {
        showToast("Escreva o texto primeiro. ✧", "warn");
        state.busy = false;
        el.btnGenerate.disabled = false;
        return;
      }
      const content = { text, t: state.content ? state.content.t : "Reels Viral" };

      /* fundo */
      setStatus("Buscando cenário…", 0.05);
      const bg = await generateBackground();
      const img = await loadHtmlImage(bg.blob);

      /* renderizar frame estático */
      await ensureCanvasFonts();
      const ctx = el.canvas.getContext("2d");
      const drawFn = DRAW_FNS[state.template] || drawOracaoRetencao;
      drawFn(ctx, img, content);

      /* capturar PNG */
      const pngBlob = await new Promise((resolve) => {
        el.canvas.toBlob((b) => resolve(b || new Blob([], { type: "image/png" })), "image/png", 1);
      });
      state.lastBlob = pngBlob;
      state.lastMime = "image/png";

      /* preview */
      el.canvas.hidden = true;
      el.image.src = URL.createObjectURL(pngBlob);
      el.image.hidden = false;
      el.video.hidden = true;
      hidePlaybackBar();
      el.btnDownload.disabled = false;
      el.btnDownload.textContent = "⬇ Baixar imagem (PNG)";

      /* legenda */
      const tmpl = templateById(state.template);
      state.caption = buildCaption(content, tmpl);
      el.captionText.value = state.caption;
      el.captionCard.hidden = false;
      el.btnCopyCaption.disabled = false;

      setStatus("Imagem pronta! Baixe ou gere o vídeo. ✧", 1);
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
      if (!text) {
        showToast("Escreva o texto primeiro. ✧", "warn");
        state.busy = false;
        el.btnGenerate.disabled = false;
        return;
      }
      const content = { text, t: state.content ? state.content.t : "Reels Viral" };
      const tmpl = templateById(state.template);
      const totalDur = tmpl.duration;

      /* fundo */
      setStatus("Buscando cenário…", 0.05);
      const bg = await generateBackground();
      const img = await loadHtmlImage(bg.blob);

      /* renderer Ken Burns + texto */
      const ctx = el.canvas.getContext("2d");
      const drawFn = DRAW_FNS[state.template] || drawOracaoRetencao;

      /* gravar vídeo */
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
          const t = Math.min(elapsed, totalDur);
          const p = clamp(elapsed / totalDur, 0, 1);

          /* Ken Burns progressivo */
          const kbIdx = Math.floor(p * 3);
          ctx.save();
          drawKenBurns(ctx, img, p, kbIdx);
          ctx.restore();

          /* scrim + overlay do template */
          drawScrim(ctx, 0.65);
          drawFn(ctx, img, content);

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

      /* valida resolução — Instagram Reels exige 1080×1920 (9:16) */
      const dim = await verifyVideoResolution(blob);
      if (dim.w !== W || dim.h !== H) {
        console.warn("Resolução gravada inesperada:", dim);
        showToast("Atenção: o vídeo saiu em " + (dim.w || "?") + "×" + (dim.h || "?") + " em vez de 1080×1920. Gere novamente.", "warn");
      }

      state.lastBlob = blob;
      state.lastMime = type;

      el.canvas.hidden = true;
      el.video.src = URL.createObjectURL(blob);
      el.video.hidden = false;
      showPlaybackBar();
      el.btnDownload.disabled = false;
      el.btnDownload.textContent = type === "video/mp4" ? "⬇ Baixar MP4" : "⬇ Baixar vídeo (WebM)";

      /* legenda */
      const caption = buildCaption(content, tmpl);
      state.caption = caption;
      el.captionText.value = caption;
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
  function buildCaption(content, tmpl) {
    const hook = (state.hookText ? state.hookText.textContent : "") || tmpl.hook;
    const lines = [
      tmpl.emoji + " " + hook,
      "",
      content.text,
      "",
      "Comente AMÉM se essa mensagem tocou seu coração 🙏",
      "Salve para ouvir quando precisar 💛",
      "Compartilhe com alguém que precisa hoje ✨",
      "",
      tmpl.hashtags.join(" "),
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
    const tmpl = templateById(state.template);
    const isImage = state.lastMime === "image/png";
    const ext = isImage ? "png" : (state.lastMime === "video/mp4" ? "mp4" : "webm");
    const slug = tmpl.label.toLowerCase().replace(/[^a-z0-9à-ÿ\s]/g, "").trim().replace(/\s+/g, "-").slice(0, 30);
    triggerDownload(state.lastBlob, "alvorada-rv-" + slug + "." + ext);
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

  async function copyHook() {
    const hook = el.hookText ? el.hookText.textContent : "";
    try {
      await navigator.clipboard.writeText(hook);
      showToast("Gancho copiado! ✧", "ok");
    } catch (e) {
      showToast("Gancho copiado! ✧", "ok");
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

  /* ---------- theme toggle ---------- */
  function toggleTheme() {
    state.isLight = !state.isLight;
    document.body.classList.toggle("light", state.isLight);
    savePrefs();
  }

  /* ---------- preferências ---------- */
  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({
        template: state.template, bgTheme: state.bgTheme,
        style: state.style, source: state.source,
        isLight: state.isLight,
      }));
    } catch (e) {}
  }

  function loadPrefs() {
    try {
      const j = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
      if (!j) return;
      if (RV_TEMPLATES.some((t) => t.id === j.template)) state.template = j.template;
      if (RV_BG_THEMES.some((t) => t.id === j.bgTheme)) state.bgTheme = j.bgTheme;
      if (RV_STYLES[j.style]) state.style = j.style;
      if (RV_IMAGE_SOURCES[j.source]) state.source = j.source;
      if (typeof j.isLight === "boolean") state.isLight = j.isLight;
    } catch (e) {}
  }

  /* ---------- init ---------- */
  function init() {
    loadPrefs();
    document.body.classList.toggle("light", state.isLight);
    renderChips();
    pickContent();

    el.scriptText.addEventListener("input", () => {
      state.customText = el.scriptText.value;
      updateScriptMeta();
    });

    el.btnNewContent.addEventListener("click", pickContent);
    el.btnAiContent.addEventListener("click", generateHook);

    el.btnGenerate.addEventListener("click", () => {
      const btn = el.btnGenerate;
      if (btn.dataset.mode === "video") handleGenerateVideo();
      else handleGenerate();
    });

    el.btnDownload.addEventListener("click", downloadReel);
    el.btnCopyCaption.addEventListener("click", copyCaption);
    if (el.btnCopyHook) el.btnCopyHook.addEventListener("click", copyHook);
    if (el.btnRegenerateHook) el.btnRegenerateHook.addEventListener("click", generateHook);
    if (el.themeToggle) el.themeToggle.addEventListener("click", toggleTheme);

    /* mode toggle (image vs video) */
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
      el.video.addEventListener("click", () => { if (el.video.paused) { el.video.play(); el.btnPlay.hidden = true; el.btnPause.hidden = false; } else { el.video.pause(); el.btnPlay.hidden = false; el.btnPause.hidden = true; } });
    }

    /* scroll reveal */
    document.querySelectorAll(".tip, .pipe, .badge, .hero h1, .hero .sub, .hero-actions, .hero-badges, .section-head").forEach((el2, i) => {
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
