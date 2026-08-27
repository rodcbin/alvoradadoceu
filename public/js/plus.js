/* =========================================================
   Alvorada do Céu — Aba Plus (Engajamento)
   3 formatos: Versículo Card, Mensagem de Deus, Cura e Libertação
   Imagem PNG ou vídeo Ken Burns MP4.
   Fundos: Cloudflare FLUX → Pollinations → Pexels → Pixabay
   ========================================================= */

(() => {
  "use strict";

  const PREFS_KEY = "alvorada_plus_prefs_v2";
  const W = 1080;

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

  const state = {
    fmt: "versiculo",
    style: "dark",
    theme: "ceu",
    source: "cloudflare",
    size: "portrait",
    content: null,
    busy: false,
    lastBlob: null,
    lastMime: "",
    caption: "",
  };

  const el = {};

  /* =========================================================
     CHIPS / UI
     ========================================================= */
  function makeChip(label, extra) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.innerHTML = label;
    if (extra) for (const k in extra) if (extra[k] != null) b.dataset[k] = String(extra[k]);
    return b;
  }

  function fmtById(id) { return PLUS_FORMATS.find((f) => f.id === id) || PLUS_FORMATS[0]; }

  function renderChips() {
    el.fmtChips.innerHTML = "";
    PLUS_FORMATS.forEach((f) => {
      const b = makeChip(f.label, { fmt: f.id });
      if (f.id === state.fmt) b.classList.add("active");
      b.title = f.desc;
      b.addEventListener("click", () => { state.fmt = f.id; pickContent(); renderChips(); savePrefs(); });
      el.fmtChips.appendChild(b);
    });
    const fd = fmtById(state.fmt);
    el.fmtHint.textContent = "✦ " + fd.desc + " " + fd.hint;

    el.styleChips.innerHTML = "";
    Object.entries(PLUS_CARD_STYLES).forEach(([k, s]) => {
      const b = makeChip(s.label, { style: k });
      if (k === state.style) b.classList.add("active");
      b.title = s.desc;
      b.addEventListener("click", () => { state.style = k; renderChips(); savePrefs(); });
      el.styleChips.appendChild(b);
    });
    el.styleHint.textContent = "✦ " + (PLUS_CARD_STYLES[state.style] || PLUS_CARD_STYLES.dark).desc;

    el.themeChips.innerHTML = "";
    PLUS_THEMES.forEach((t) => {
      const b = makeChip(t.emoji + " " + t.label, { theme: t.id });
      if (t.id === state.theme) b.classList.add("active");
      b.addEventListener("click", () => { state.theme = t.id; renderChips(); savePrefs(); });
      el.themeChips.appendChild(b);
    });

    el.sourceChips.innerHTML = "";
    Object.entries(PLUS_SOURCES).forEach(([k, s]) => {
      const b = makeChip(s.label, { source: k });
      if (k === state.source) b.classList.add("active");
      b.title = s.desc;
      b.addEventListener("click", () => { state.source = k; renderChips(); savePrefs(); });
      el.sourceChips.appendChild(b);
    });

    el.sizeChips.innerHTML = "";
    Object.entries(PLUS_SIZES).forEach(([k, s]) => {
      const b = makeChip(s.label, { size: k });
      if (k === state.size) b.classList.add("active");
      b.title = s.desc;
      b.addEventListener("click", () => { state.size = k; renderChips(); savePrefs(); });
      el.sizeChips.appendChild(b);
    });

    applyVisibility();
    updateEngineNote();
  }

  function applyVisibility() {
    const isPhoto = state.style === "photo";
    el.styleOptions.hidden = false;
    el.themeOptions.hidden = !isPhoto;
    el.sourceOptions.hidden = !isPhoto;
    el.refRow.hidden = state.fmt !== "versiculo";
  }

  function updateEngineNote() {
    const fd = fmtById(state.fmt);
    const style = PLUS_CARD_STYLES[state.style] || PLUS_CARD_STYLES.dark;
    const sz = PLUS_SIZES[state.size] || PLUS_SIZES.portrait;
    let extra = " · " + style.label.replace(/^[^\s]+\s/, "");
    if (state.style === "photo") extra += " · " + (PLUS_SOURCES[state.source] || {}).label;
    extra += " · " + sz.w + "×" + sz.h;
    el.engineNote.textContent = "✦ " + fd.label.replace(/^[^\s]+\s/, "") + extra;
    el.btnGenerate.textContent =
      el.btnGenerate.dataset.mode === "video" ? "🎬 Gerar vídeo (7s)" : "✧ Gerar post";
  }

  /* =========================================================
     CONTEÚDO POR FORMATO
     ========================================================= */
  const lastPick = {};
  function pickFresh(items, keyFn) {
    const lastKey = lastPick[state.fmt];
    let pool = items;
    if (items.length > 1 && lastKey != null) {
      const filtered = items.filter((it) => keyFn(it) !== lastKey);
      if (filtered.length) pool = filtered;
    }
    const pick = randomItem(pool);
    lastPick[state.fmt] = keyFn(pick);
    return pick;
  }

  function pickContent() {
    const c = buildContent();
    state.content = c;
    if (el.scriptText) el.scriptText.value = c.x || "";
    if (el.scriptRef) el.scriptRef.value = c.ref || "";
    updateScriptMeta();
  }

  function buildContent() {
    switch (state.fmt) {
      case "versiculo": return pickFresh(PLUS_VERSES, (v) => v.x);
      case "mensagem": {
        const m = pickFresh(PLUS_MESSAGES, (mm) => mm.x);
        return { hook: pickFresh(PLUS_MESSAGE_HOOKS, (h) => h), x: m.x, ref: m.ref };
      }
      case "cura": return pickFresh(PLUS_CURA_POSTS, (p) => p.t);
      default: return {};
    }
  }

  function contentFromInputs() {
    const base = state.content || {};
    const text = el.scriptText.value.trim();
    const ref = (el.scriptRef ? el.scriptRef.value : "").trim();
    const out = Object.assign({}, base);
    if (text) out.x = text;
    if (ref !== "" || base.ref) out.ref = ref;
    return out;
  }

  function updateScriptMeta() {
    const words = el.scriptText.value.trim().split(/\s+/).filter(Boolean).length;
    el.scriptMeta.textContent = words ? words + " palavras · pode editar à vontade" : "";
  }

  /* =========================================================
     FONTES DE IMAGEM (com fallback em cadeia)
     ========================================================= */
  async function cfImage(prompt) {
    const res = await fetch("/api/cf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, steps: 8, seed: randomInt(0, 999999) }),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => "") || "Cloudflare respondeu " + res.status);
    const blob = await res.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  async function pollImage(prompt) {
    const url = "/api/image?prompt=" + encodeURIComponent(prompt) +
      "&width=1080&height=1350&seed=" + randomInt(0, 999999) + "&nologo=true&model=flux&enhance=true";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Pollinations respondeu " + res.status);
    const blob = await res.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  async function stockPhoto(provider, query) {
    const isPexels = provider === "pexels";
    const searchUrl =
      (isPexels ? "/api/pexels/photos" : "/api/pixabay/photos") +
      "?q=" + encodeURIComponent(query) + "&per_page=15" +
      (isPexels ? "&orientation=portrait" : "&min_width=800&min_height=1200");
    const proxyPath = isPexels ? "/api/pexels/proxy" : "/api/pixabay/proxy";
    const res = await fetch(searchUrl);
    if (!res.ok) throw new Error((isPexels ? "Pexels" : "Pixabay") + ": " + (await res.text().catch(() => "")));
    const j = await res.json();
    const photos = (j.photos || []).filter((p) => p.image);
    if (!photos.length) throw new Error("Nenhuma foto encontrada.");
    const portrait = photos.filter((p) => p.height >= p.width * 1.05);
    const pick = randomItem(portrait.length >= 3 ? portrait : photos);
    const r2 = await fetch(proxyPath + "?url=" + encodeURIComponent(pick.image));
    if (!r2.ok) throw new Error("Proxy: " + r2.status);
    const blob = await r2.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  function plusBuildImagePrompt(theme) {
    return "breathtaking ultra-high-quality spiritual artwork, absolutely no text, no letters, no words, no watermark, " +
      theme.scene + ", cinematic lighting, luminous divine radiance, exquisite detail, professional color grading, masterpiece, 8k";
  }

  const FALLBACK_GRADIENTS = {
    ceu: ["#1a1040", "#c8860a", "#f5d78e"],
    natureza: ["#0f2410", "#24522a", "#4a7c3f"],
    vela: ["#160d02", "#6e3a10", "#daa520"],
    mar: ["#081420", "#164664", "#4a9ead"],
    montanhas: ["#141228", "#3c3464", "#b09ad8"],
    estrelas: ["#04040e", "#0a0a34", "#282868"],
    pomba: ["#20243a", "#5a607e", "#e8e4d4"],
    maos: ["#170f00", "#7a5c12", "#caa53d"],
    sunset: ["#1a0f00", "#daa520", "#f5e6b8"],
    lavanda: ["#1a0f28", "#7b4f9e", "#d4b8f0"],
  };

  function generateFallbackImage(themeId, h) {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = h || 1350;
    const ctx = canvas.getContext("2d");
    const colors = FALLBACK_GRADIENTS[themeId] || FALLBACK_GRADIENTS.ceu;
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, colors[0]);
    g.addColorStop(0.55, colors[1]);
    g.addColorStop(1, colors[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 36; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2.6 + 0.8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,240," + (Math.random() * 0.25 + 0.04) + ")";
      ctx.fill();
    }
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob || new Blob([], { type: "image/png" })), "image/jpeg", 0.92);
    });
  }

  async function generateBackground(h) {
    const theme = PLUS_THEMES.find((t) => t.id === state.theme) || PLUS_THEMES[0];
    const prompt = plusBuildImagePrompt(theme);
    const order = [state.source].concat(Object.keys(PLUS_SOURCES).filter((k) => k !== state.source));
    for (const src of order) {
      try {
        if (src === "cloudflare") return { blob: await cfImage(prompt), src: "cloudflare" };
        if (src === "pollinations") return { blob: await pollImage(prompt), src: "pollinations" };
        if (src === "pexels") return { blob: await stockPhoto("pexels", theme.query), src: "pexels" };
        if (src === "pixabay") return { blob: await stockPhoto("pixabay", theme.query), src: "pixabay" };
      } catch (e) { console.warn("BG src " + src + " falhou:", e); }
    }
    return { blob: await generateFallbackImage(theme.id, h), src: "fallback" };
  }

  function loadHtmlImage(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível carregar o fundo."));
      img.src = URL.createObjectURL(blob);
    });
  }

  /* =========================================================
     HELPERS DE DESENHO
     ========================================================= */
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
    const words = String(text).split(" ");
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

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  function drawDivider(ctx, cx, cy, halfW, color, size) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, size * 0.055);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - halfW, cy);
    ctx.lineTo(cx - halfW * 0.24, cy);
    ctx.moveTo(cx + halfW * 0.24, cy);
    ctx.lineTo(cx + halfW, cy);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = Math.round(size) + "px 'Poppins','Segoe UI',sans-serif";
    ctx.fillText("✦", cx, cy + size * 0.04);
    ctx.restore();
  }

  function drawWatermark(ctx, FW, FH, light) {
    ctx.save();
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.font = "600 " + Math.round(FW * 0.026) + "px 'Poppins','Segoe UI',sans-serif";
    try { ctx.letterSpacing = "2px"; } catch (e) {}
    ctx.fillStyle = light ? "rgba(122,94,20,0.9)" : "rgba(230,195,90,0.95)";
    ctx.fillText("ALVORADA DO CÉU ✧", FW - FW * 0.032, FH * 0.952);
    try { ctx.letterSpacing = "0px"; } catch (e) {}
    ctx.font = "500 " + Math.round(FW * 0.022) + "px 'Poppins','Segoe UI',sans-serif";
    ctx.fillStyle = light ? "rgba(60,48,16,0.75)" : "rgba(255,255,255,0.85)";
    ctx.fillText("@alvoradadoceu", FW - FW * 0.032, FH * 0.984);
    ctx.restore();
  }

  function drawScrim(ctx, FW, FH, strength) {
    const s = strength == null ? 1 : strength;
    const g = ctx.createLinearGradient(0, 0, 0, FH);
    g.addColorStop(0, "rgba(8,8,16," + 0.62 * s + ")");
    g.addColorStop(0.45, "rgba(8,8,16," + 0.52 * s + ")");
    g.addColorStop(1, "rgba(8,8,16," + 0.88 * s + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FW, FH);
  }

  function drawGoldPill(ctx, cx, cy, text, fontPx) {
    ctx.font = "700 " + Math.round(fontPx) + "px 'Poppins','Segoe UI',sans-serif";
    const tw = ctx.measureText(text).width;
    const pw = tw + fontPx * 2.2;
    const ph = fontPx * 2.1;
    const px = cx - pw / 2;
    const py = cy - ph / 2;
    ctx.save();
    ctx.shadowColor = "rgba(212,175,55,0.42)";
    ctx.shadowBlur = fontPx * 0.8;
    ctx.shadowOffsetY = fontPx * 0.18;
    const pg = ctx.createLinearGradient(px, py, px + pw, py + ph);
    pg.addColorStop(0, "#f4dc8e");
    pg.addColorStop(0.55, "#d4af37");
    pg.addColorStop(1, "#b78f2e");
    roundRectPath(ctx, px, py, pw, ph, ph / 2);
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#241c08";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cx, cy + 1);
    return { pw, ph };
  }

  function drawCtaRow(ctx, FW, y, icon, main, sub, light, compactK) {
    const k = compactK || 1;
    const badgeD = FW * 0.085 * k;
    const gap = FW * 0.024;
    let mSize = FW * 0.046 * k;
    const badgeFill = light ? "rgba(158,124,34,0.14)" : "rgba(230,195,90,0.16)";
    const badgeStroke = light ? "rgba(140,108,28,0.6)" : "rgba(230,195,90,0.55)";
    ctx.font = "700 " + mSize + "px 'Poppins','Segoe UI',sans-serif";
    while (badgeD + gap + ctx.measureText(main).width > FW * 0.84 && mSize > FW * 0.03 * k) {
      mSize -= 1;
      ctx.font = "700 " + mSize + "px 'Poppins','Segoe UI',sans-serif";
    }
    const tw = ctx.measureText(main).width;
    const startX = (FW - (badgeD + gap + tw)) / 2;
    ctx.beginPath();
    ctx.arc(startX + badgeD / 2, y, badgeD / 2, 0, Math.PI * 2);
    ctx.fillStyle = badgeFill;
    ctx.fill();
    ctx.strokeStyle = badgeStroke;
    ctx.lineWidth = Math.max(2, FW * 0.0022);
    ctx.stroke();
    if (icon) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = Math.round(badgeD * 0.46) + "px 'Segoe UI Emoji','Noto Color Emoji',sans-serif";
      ctx.fillText(icon, startX + badgeD / 2, y + 1);
    }
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.shadowColor = light ? "rgba(255,252,240,0.7)" : "rgba(0,0,0,0.8)";
    ctx.shadowBlur = FW * 0.012;
    ctx.fillStyle = light ? "#4a3a10" : "#ffe9a8";
    ctx.font = "700 " + mSize + "px 'Poppins','Segoe UI',sans-serif";
    ctx.fillText(main, startX + badgeD + gap, y + 1);
    ctx.restore();
    ctx.save();
    ctx.shadowColor = light ? "rgba(255,252,240,0.6)" : "rgba(0,0,0,0.8)";
    ctx.shadowBlur = FW * 0.01;
    ctx.textAlign = "center";
    ctx.fillStyle = light ? "rgba(70,56,24,0.85)" : "rgba(255,253,246,0.82)";
    ctx.font = "500 " + Math.round(FW * 0.032 * k) + "px 'Poppins','Segoe UI',sans-serif";
    ctx.fillText(sub, FW / 2, y + badgeD / 2 + FW * 0.048 * k);
    ctx.shadowBlur = 0;
  }

  function drawFollowButton(ctx, FW, FH, cy) {
    const fam = "'Poppins','Segoe UI',sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,253,246,0.85)";
    ctx.font = "500 " + Math.round(FW * 0.033) + "px " + fam;
    ctx.fillText("Quer receber palavras assim todos os dias?", FW / 2, cy - FH * 0.05);
    const followLabel = "+ Seguir  @alvoradadoceu";
    const fFont = fitFont(ctx, followLabel, "700", FW * 0.041, fam, FW * 0.74, FW * 0.024);
    const ftw = ctx.measureText(followLabel).width;
    const fbw = ftw + FW * 0.11;
    const fbh = FH * 0.06;
    const fbx = (FW - fbw) / 2;
    const fby = cy - fbh / 2;
    ctx.save();
    ctx.shadowColor = "rgba(212,175,55,0.45)";
    ctx.shadowBlur = FW * 0.03;
    ctx.shadowOffsetY = FW * 0.008;
    const fg = ctx.createLinearGradient(fbx, fby, fbx + fbw, fby + fbh);
    fg.addColorStop(0, "#f4dc8e");
    fg.addColorStop(0.55, "#d4af37");
    fg.addColorStop(1, "#a8852a");
    roundRectPath(ctx, fbx, fby, fbw, fbh, fbh / 2);
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#241c08";
    ctx.font = fFont;
    ctx.fillText(followLabel, FW / 2, fby + fbh / 2 + 1);
  }

  function drawCover(ctx, img, FW, FH) {
    if (!img || !img.width) return;
    const ir = img.width / img.height;
    const cr = FW / FH;
    let sx, sy, sw, sh;
    if (ir > cr) { sh = img.height; sw = img.height * cr; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = img.width / cr; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, FW, FH);
  }

  /* =========================================================
     PAINT BASES (dark, light, etc.)
     ========================================================= */
  function paintDarkBase(ctx, FW, FH) {
    const g = ctx.createRadialGradient(FW / 2, FH * 0.38, 0, FW / 2, FH * 0.5, FH * 0.85);
    g.addColorStop(0, "#17142a"); g.addColorStop(0.6, "#0d0b18"); g.addColorStop(1, "#050409");
    ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
    for (let i = 0; i < 46; i++) { ctx.beginPath(); ctx.arc(Math.random() * FW, Math.random() * FH, Math.random() * 1.7 + 0.4, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,250,230," + (Math.random() * 0.14 + 0.02) + ")"; ctx.fill(); }
    const rg = ctx.createRadialGradient(FW / 2, FH * 0.44, 0, FW / 2, FH * 0.44, FW * 0.72);
    rg.addColorStop(0, "rgba(230,195,90,0.1)"); rg.addColorStop(1, "rgba(230,195,90,0)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, FW, FH);
  }

  function paintLightBase(ctx, FW, FH) {
    const g = ctx.createLinearGradient(0, 0, 0, FH);
    g.addColorStop(0, "#fdfaf2"); g.addColorStop(0.55, "#f7f1e2"); g.addColorStop(1, "#efe6cf");
    ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
    for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.arc(Math.random() * FW, Math.random() * FH, Math.random() * 1.6 + 0.4, 0, Math.PI * 2); ctx.fillStyle = "rgba(150,125,60," + (Math.random() * 0.07 + 0.015) + ")"; ctx.fill(); }
  }

  function paintRoxoBase(ctx, FW, FH) {
    const g = ctx.createRadialGradient(FW / 2, FH * 0.38, 0, FW / 2, FH * 0.5, FH * 0.9);
    g.addColorStop(0, "#2b1a4d"); g.addColorStop(0.55, "#1c1035"); g.addColorStop(1, "#0c0718");
    ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
    for (let i = 0; i < 44; i++) { ctx.beginPath(); ctx.arc(Math.random() * FW, Math.random() * FH, Math.random() * 1.7 + 0.4, 0, Math.PI * 2); ctx.fillStyle = "rgba(238,228,255," + (Math.random() * 0.15 + 0.03) + ")"; ctx.fill(); }
  }

  function paintBordoBase(ctx, FW, FH) {
    const g = ctx.createRadialGradient(FW / 2, FH * 0.38, 0, FW / 2, FH * 0.5, FH * 0.9);
    g.addColorStop(0, "#4e1527"); g.addColorStop(0.55, "#340d1a"); g.addColorStop(1, "#150509");
    ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
    for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(Math.random() * FW, Math.random() * FH, Math.random() * 1.6 + 0.4, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,232,232," + (Math.random() * 0.13 + 0.02) + ")"; ctx.fill(); }
  }

  function paintVipBase(ctx, FW, FH) {
    const g = ctx.createLinearGradient(0, 0, 0, FH);
    g.addColorStop(0, "#151006"); g.addColorStop(0.5, "#0a0805"); g.addColorStop(1, "#171106");
    ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
    ctx.save();
    for (let i = -2; i <= 2; i++) {
      const x0 = FW * 0.5 + i * FW * 0.34;
      const lg = ctx.createLinearGradient(x0 - FW * 0.08, 0, x0 + FW * 0.08, FH);
      lg.addColorStop(0, "rgba(212,175,55,0)"); lg.addColorStop(0.5, "rgba(212,175,55,0.05)"); lg.addColorStop(1, "rgba(212,175,55,0)");
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x0 - FW * 0.07, 0); ctx.lineTo(x0 + FW * 0.07, 0); ctx.lineTo(x0 + FW * 0.24, FH); ctx.lineTo(x0 + FW * 0.1, FH); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.arc(Math.random() * FW, Math.random() * FH, Math.random() * 1.5 + 0.4, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,240,200," + (Math.random() * 0.12 + 0.02) + ")"; ctx.fill(); }
  }

  function paintNavyBase(ctx, FW, FH) {
    const g = ctx.createRadialGradient(FW / 2, FH * 0.38, 0, FW / 2, FH * 0.5, FH * 0.9);
    g.addColorStop(0, "#142a52"); g.addColorStop(0.55, "#0c1b3a"); g.addColorStop(1, "#050e20");
    ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
    for (let i = 0; i < 42; i++) { ctx.beginPath(); ctx.arc(Math.random() * FW, Math.random() * FH, Math.random() * 1.6 + 0.4, 0, Math.PI * 2); ctx.fillStyle = "rgba(216,228,255," + (Math.random() * 0.13 + 0.02) + ")"; ctx.fill(); }
  }

  function paintVerdeBase(ctx, FW, FH) {
    const g = ctx.createRadialGradient(FW / 2, FH * 0.38, 0, FW / 2, FH * 0.5, FH * 0.9);
    g.addColorStop(0, "#174229"); g.addColorStop(0.55, "#0f2f1d"); g.addColorStop(1, "#06170e");
    ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
    for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(Math.random() * FW, Math.random() * FH, Math.random() * 1.6 + 0.4, 0, Math.PI * 2); ctx.fillStyle = "rgba(226,255,236," + (Math.random() * 0.12 + 0.02) + ")"; ctx.fill(); }
  }

  function paintCleanBase(ctx, FW, FH) {
    const g = ctx.createLinearGradient(0, 0, 0, FH);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.6, "#fafbfd"); g.addColorStop(1, "#f1f4f7");
    ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
    ctx.save(); ctx.strokeStyle = "rgba(145,155,170,0.08)"; ctx.lineWidth = Math.max(1, FW * 0.0018);
    for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(FW / 2, FH * 0.46, FW * (0.16 + i * 0.15), 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }

  function paintPergaminhoBase(ctx, FW, FH) {
    const g = ctx.createLinearGradient(0, 0, FW, FH);
    g.addColorStop(0, "#efe2bf"); g.addColorStop(0.5, "#f7edd2"); g.addColorStop(1, "#eadbb2");
    ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
    ctx.fillStyle = "rgba(165,135,85,0.05)";
    for (let y = FH * 0.02; y < FH; y += Math.max(3, FH * 0.004)) { ctx.fillRect(0, y, FW, 1); }
    for (let i = 0; i < 12; i++) { const x = Math.random() * FW; const y = Math.random() * FH; const r = Math.random() * FW * 0.08 + FW * 0.02; const mg = ctx.createRadialGradient(x, y, 0, x, y, r); mg.addColorStop(0, "rgba(150,112,55,0.07)"); mg.addColorStop(1, "rgba(150,112,55,0)"); ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    function drawRoll(cy) { const rh = FH * 0.03; const rg2 = ctx.createLinearGradient(0, cy - rh / 2, 0, cy + rh / 2); rg2.addColorStop(0, "#a97f45"); rg2.addColorStop(0.35, "#e2c48c"); rg2.addColorStop(0.65, "#d3b077"); rg2.addColorStop(1, "#96703c"); ctx.fillStyle = rg2; ctx.fillRect(0, cy - rh / 2, FW, rh); }
    drawRoll(FH * 0.05); drawRoll(FH * 0.938);
  }

  function paintClassicoBase(ctx, FW, FH) {
    const g = ctx.createLinearGradient(0, 0, 0, FH);
    g.addColorStop(0, "#f3e8d1"); g.addColorStop(0.55, "#e9dbbc"); g.addColorStop(1, "#dcc9a2");
    ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
    ctx.save(); ctx.globalAlpha = 0.05;
    for (let i = 0; i < 240; i++) { const x = Math.random() * FW; const y = Math.random() * FH; ctx.strokeStyle = Math.random() > 0.5 ? "#8a6f3f" : "#fffaf0"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6, y + 2); ctx.stroke(); }
    ctx.restore();
  }

  function paintMarmoreBase(ctx, FW, FH) {
    const g = ctx.createLinearGradient(FW * 0.15, 0, FW * 0.85, FH);
    g.addColorStop(0, "#fcfcfb"); g.addColorStop(0.5, "#f2f2ef"); g.addColorStop(1, "#e8e8e4");
    ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
    ctx.save(); ctx.lineCap = "round";
    for (let v = 0; v < 5; v++) { let x = Math.random() * FW; let y = -FH * 0.05; ctx.strokeStyle = "rgba(125,130,140,0.17)"; ctx.lineWidth = Math.max(1.2, FW * 0.0022); ctx.beginPath(); ctx.moveTo(x, y); while (y < FH * 1.05) { const nx = x + (Math.random() - 0.5) * FW * 0.24; const ny = y + FH * (0.08 + Math.random() * 0.12); ctx.quadraticCurveTo(x + (nx - x) * 0.5 + (Math.random() - 0.5) * FW * 0.1, (y + ny) / 2, nx, ny); x = nx; y = ny; } ctx.stroke(); }
    ctx.restore();
  }

  function paintBiblePage(ctx, FW, FH) {
    ctx.fillStyle = "#f2e8d0"; ctx.fillRect(0, 0, FW, FH);
    const vg = ctx.createRadialGradient(FW / 2, FH / 2, FH * 0.2, FW / 2, FH / 2, FH * 0.75);
    vg.addColorStop(0, "rgba(120,90,40,0)"); vg.addColorStop(0.75, "rgba(120,90,40,0.1)"); vg.addColorStop(1, "rgba(96,70,28,0.32)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, FW, FH);
    ctx.fillStyle = "rgba(110,80,35,0.1)"; ctx.fillRect(FW / 2 - 1, 0, 2, FH);
    ctx.fillStyle = "rgba(255,252,240,0.5)"; ctx.fillRect(FW / 2 + 1, 0, 1, FH);
    const marginX = FW * 0.075; const topY = FH * 0.06; const botY = FH * 0.95; const colGap = FW * 0.05; const colW = (FW - marginX * 2 - colGap) / 2; const lineH = FH * 0.011;
    ctx.save();
    for (let col = 0; col < 2; col++) { const x0 = marginX + col * (colW + colGap); let y = topY; while (y < botY) { const segs = randomInt(2, 4); let x = x0; for (let sIdx = 0; sIdx < segs && x < x0 + colW; sIdx++) { const segW = Math.min(randomInt(colW * 0.06, colW * 0.14), x0 + colW - x); ctx.fillStyle = "rgba(90,72,45," + (Math.random() * 0.1 + 0.16) + ")"; ctx.fillRect(x, y, segW, lineH * 0.52); x += segW + lineH * 0.32; } y += lineH * (Math.random() > 0.92 ? 2.1 : 1); } }
    ctx.fillStyle = "rgba(90,72,45,0.4)"; ctx.font = "600 " + Math.round(FH * 0.012) + "px Georgia, serif"; ctx.textAlign = "left"; ctx.fillText("A T E R O   P R I M E I R O", marginX, topY - lineH * 0.8); ctx.textAlign = "right"; ctx.fillText(String(randomInt(300, 900)), FW - marginX, topY - lineH * 0.8);
    ctx.restore();
    const cardY = FH * 0.3; const cardH = FH * 0.4;
    const cg = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
    cg.addColorStop(0, "rgba(242,232,208,0)"); cg.addColorStop(0.18, "rgba(243,233,210,0.96)"); cg.addColorStop(0.82, "rgba(243,233,210,0.96)"); cg.addColorStop(1, "rgba(242,232,208,0)");
    ctx.fillStyle = cg; ctx.fillRect(0, cardY, FW, cardH);
  }

  const PLUS_LIGHT_STYLES = ["light", "biblepage", "clean", "marmore", "pergaminho", "classico"];
  function isLightStyle(s) { return PLUS_LIGHT_STYLES.indexOf(s) !== -1; }

  function paintStyleBase(ctx, FW, FH, styleId) {
    if (styleId === "roxo") paintRoxoBase(ctx, FW, FH);
    else if (styleId === "bordo") paintBordoBase(ctx, FW, FH);
    else if (styleId === "vip") paintVipBase(ctx, FW, FH);
    else if (styleId === "navy") paintNavyBase(ctx, FW, FH);
    else if (styleId === "verde") paintVerdeBase(ctx, FW, FH);
    else if (styleId === "clean") paintCleanBase(ctx, FW, FH);
    else if (styleId === "marmore") paintMarmoreBase(ctx, FW, FH);
    else if (styleId === "pergaminho") paintPergaminhoBase(ctx, FW, FH);
    else if (styleId === "classico") paintClassicoBase(ctx, FW, FH);
    else if (styleId === "light") paintLightBase(ctx, FW, FH);
    else if (styleId === "biblepage") paintBiblePage(ctx, FW, FH);
    else paintDarkBase(ctx, FW, FH);
  }

  function drawVipCorners(ctx, FW, FH, color) {
    const inset = FW * 0.034; const len = FW * 0.095;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = Math.max(2.5, FW * 0.0028); ctx.lineCap = "round";
    [[inset, inset, 1, 1], [FW - inset, inset, -1, 1], [inset, FH - inset, 1, -1], [FW - inset, FH - inset, -1, -1]].forEach(([x, y, sx, sy]) => { ctx.beginPath(); ctx.moveTo(x + sx * len, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * len); ctx.stroke(); });
    ctx.restore();
  }

  /* =========================================================
     CARD DE VERSÍCULO
     ========================================================= */
  function drawVerseCard(ctx, FW, FH, verse, styleId) {
    const light = isLightStyle(styleId);
    const inkMain = light ? "#33270e" : "#fffdf6";
    const inkDim = light ? "rgba(70,56,24,0.72)" : "rgba(255,253,246,0.72)";
    const gold = light ? "rgba(158,124,34,0.95)" : "rgba(230,195,90,0.95)";
    const serif = "'Playfair Display','Cormorant Garamond',Georgia,serif";
    const sans = "'Poppins','Segoe UI',sans-serif";

    if (styleId !== "photo") paintStyleBase(ctx, FW, FH, styleId);

    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const inset = FW * 0.034;
    ctx.strokeStyle = gold; ctx.lineWidth = Math.max(2, FW * 0.0022);
    ctx.globalAlpha = 0.65; ctx.strokeRect(inset, inset, FW - inset * 2, FH - inset * 2);
    ctx.globalAlpha = 0.3; ctx.strokeRect(inset * 1.5, inset * 1.5, FW - inset * 3, FH - inset * 3);
    ctx.globalAlpha = 1;
    if (styleId === "vip") drawVipCorners(ctx, FW, FH, gold);

    const kicker = randomItem(PLUS_CARD_KICKERS);
    ctx.save();
    try { ctx.letterSpacing = Math.round(FW * 0.01) + "px"; } catch (e) {}
    ctx.font = "600 " + Math.round(FW * 0.027) + "px " + sans;
    ctx.fillStyle = gold;
    ctx.fillText(kicker.toUpperCase(), FW / 2, FH * 0.155);
    try { ctx.letterSpacing = "0px"; } catch (e) {}
    ctx.restore();

    ctx.font = Math.round(FW * 0.03) + "px " + sans;
    ctx.fillStyle = gold;
    ctx.fillText("✦", FW / 2, FH * 0.21);

    let vSize = FW * 0.072;
    if (FW / FH < 0.75) vSize = FW * 0.082;
    const maxTextW = FW * 0.78;
    let lines = wrapLines(ctx, verse.x, "600 " + Math.round(vSize) + "px " + serif, maxTextW, 99);
    while ((lines.length > 7 || lines.length * vSize * 1.34 > FH * 0.44) && vSize > FW * 0.04) { vSize -= 2; lines = wrapLines(ctx, verse.x, "600 " + Math.round(vSize) + "px " + serif, maxTextW, 99); }
    const lh = vSize * 1.34; const blockH = lines.length * lh; const centerY = FH * 0.47;
    let y = centerY - blockH / 2 + lh / 2;
    ctx.save();
    if (styleId === "photo") { ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = vSize * 0.22; ctx.shadowOffsetY = vSize * 0.05; }
    ctx.fillStyle = inkMain; ctx.font = "600 " + Math.round(vSize) + "px " + serif;
    for (const ln of lines) { ctx.fillText(ln, FW / 2, y); y += lh; }
    ctx.restore();

    const refY = centerY + blockH / 2 + FH * 0.05;
    drawDivider(ctx, FW / 2, refY, FW * 0.13, gold, FW * 0.042);
    const refText = verse.ref || "Palavra de Deus";
    ctx.font = "700 " + Math.round(FW * 0.034) + "px " + sans;
    ctx.fillStyle = inkDim;
    ctx.fillText(refText.toUpperCase(), FW / 2, refY + FH * 0.038);

    drawWatermark(ctx, FW, FH, light);
  }

  /* =========================================================
     POST DE ENGAJAMENTO (Mensagem de Deus / Cura)
     ========================================================= */
  function drawEngagementCard(ctx, FW, FH, spec) {
    const serif = "'Playfair Display','Cormorant Garamond',Georgia,serif";
    const sans = "'Poppins','Segoe UI',sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";

    const inset = FW * 0.034;
    ctx.strokeStyle = "rgba(230,195,90,0.5)"; ctx.lineWidth = Math.max(2, FW * 0.0022);
    ctx.strokeRect(inset, inset, FW - inset * 2, FH - inset * 2);

    let tSize = Math.min(FW * 0.088, 96);
    let bSize = Math.min(FW * 0.041, 46);
    const titleTop = FH * 0.18;
    const maxTitleW = FW * 0.8; const maxBodyW = FW * 0.76;

    function measureBlocks() {
      const tLines = wrapLines(ctx, spec.title, "700 " + Math.round(tSize) + "px " + serif, maxTitleW, 4);
      const tlh = tSize * 1.18;
      const bLines = spec.body ? wrapLines(ctx, spec.body, "500 " + Math.round(bSize) + "px " + sans, maxBodyW, 6) : [];
      const blh = bSize * 1.48;
      const bodyGap = bLines.length ? FH * 0.05 : 0;
      const bottom = titleTop + tLines.length * tlh + tlh * 0.62 + bodyGap + bLines.length * blh;
      return { tLines, tlh, bLines, blh, bodyGap, bottom };
    }
    let m = measureBlocks();
    let guard = 44;
    while (m.bottom > FH * 0.64 && guard-- > 0 && (tSize > FW * 0.042 || bSize > FW * 0.028)) {
      if (tSize > FW * 0.042) tSize = Math.max(FW * 0.042, tSize * 0.955);
      if (bSize > FW * 0.028) bSize = Math.max(FW * 0.028, bSize * 0.955);
      m = measureBlocks();
    }

    let ty = titleTop + m.tlh / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = tSize * 0.18; ctx.shadowOffsetY = tSize * 0.05;
    ctx.fillStyle = "#fffdf6"; ctx.font = "700 " + Math.round(tSize) + "px " + serif;
    for (const ln of m.tLines) { ctx.fillText(ln, FW / 2, ty); ty += m.tlh; }
    ctx.restore();

    let bodyBottom = ty - m.tlh;
    if (m.bLines.length) {
      let by = ty - m.tlh + m.bodyGap + m.blh / 2;
      ctx.fillStyle = "rgba(255,253,246,0.88)";
      ctx.font = "500 " + Math.round(bSize) + "px " + sans;
      ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = FW * 0.01;
      for (const ln of m.bLines) { ctx.fillText(ln, FW / 2, by); by += m.blh; }
      ctx.shadowBlur = 0;
      bodyBottom = by - m.blh / 2;
    }

    const ctaK = FH < FW * 1.25 ? 0.78 : 1;
    const g1 = FH * 0.05; const g2 = FH * 0.042;
    const subExtent = (FW * 0.048 + FW * 0.0425) * ctaK;

    function placeRows(n) {
      const start = Math.max(bodyBottom + g1, FH * 0.555);
      const followLabelTop = FH * 0.862 - FH * 0.05 - FW * 0.022;
      const minSlot = subExtent + FH * 0.04;
      const maxN = Math.max(1, Math.min(3, Math.floor((followLabelTop - g2 - start - subExtent) / minSlot) + 1));
      n = Math.min(n, maxN);
      const slot = Math.max(minSlot, Math.min(FH * 0.118, n > 1 ? (followLabelTop - g2 - start) / (n - 1) : FH * 0.118));
      const lastCenter = start + (n - 1) * slot;
      const subBottom = lastCenter + subExtent;
      const cyFollow = Math.min(FH * 0.885, Math.max(subBottom + g2 + FH * 0.05 + FW * 0.02, FH * 0.84));
      return { n, start, slot, subBottom, cyFollow };
    }

    let rows = spec.ctaRows;
    const lay = placeRows(rows.length);
    rows = rows.slice(0, lay.n);
    let rowY = lay.start;
    for (const row of rows) { drawCtaRow(ctx, FW, rowY, row[0], row[1], row[2], false, ctaK); rowY += lay.slot; }

    drawFollowButton(ctx, FW, FH, lay.cyFollow);
    drawWatermark(ctx, FW, FH, false);
  }

  /* =========================================================
     STATUS / PROGRESS
     ========================================================= */
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

  /* =========================================================
     KEN BURNS VIDEO (Canva-style smooth)
     ========================================================= */
  function pickMime() {
    const cands = [
      'video/mp4;codecs="avc1.64002A,mp4a.40.2"',
      'video/mp4;codecs="avc1.640028,mp4a.40.2"',
      'video/mp4;codecs=avc1',
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    for (const c of cands) { try { if (window.MediaRecorder && MediaRecorder.isTypeSupported(c)) return c; } catch (e) {} }
    return "";
  }

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

  function drawKenBurns(ctx, img, FW, FH, p, segIdx) {
    if (!img || !img.width) { ctx.fillStyle = "#05040c"; ctx.fillRect(0, 0, FW, FH); return; }
    const seg = KB_SEGS[segIdx % KB_SEGS.length];
    const local = (p * KB_SEGS.length) % 1;
    const t = easeInOutCubic(local);
    const zoom = seg.zoomA + (seg.zoomB - seg.zoomA) * t;
    const ox = (local - 0.5) * FW * seg.panX * 2;
    const oy = (local - 0.5) * FH * seg.panY * 2;
    const iw = FW * zoom; const ih = FH * zoom;
    const ir = img.width / img.height; const cr = FW / FH;
    let sx, sy, sw, sh;
    if (ir > cr) { sw = img.height * cr; sh = img.height; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = img.width / cr; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, ox, oy, iw, ih);
  }

  /* =========================================================
     GERAÇÃO — IMAGEM
     ========================================================= */
  async function handleGenerateImage() {
    if (state.busy) return;
    state.busy = true; el.btnGenerate.disabled = true;

    try {
      el.placeholder.hidden = true; el.plusVideo.hidden = true; el.plusImage.hidden = true; el.plusCanvas.hidden = false;
      const sz = PLUS_SIZES[state.size] || PLUS_SIZES.portrait;
      el.plusCanvas.width = sz.w; el.plusCanvas.height = sz.h;
      el.btnDownload.disabled = true; hidePlaybackBar();

      const text = el.scriptText.value.trim();
      if (!text) { showToast("Escreva a frase primeiro. ✧", "warn"); state.busy = false; el.btnGenerate.disabled = false; return; }

      const content = contentFromInputs();

      if (state.style === "photo") {
        setStatus("Buscando cenário…", 0.05);
        const bg = await generateBackground(sz.h);
        const img = await loadHtmlImage(bg.blob);
        await ensureCanvasFonts();
        const ctx = el.plusCanvas.getContext("2d");
        drawCover(ctx, img, sz.w, sz.h);
        drawScrim(ctx, sz.w, sz.h, 1);
      } else {
        await ensureCanvasFonts();
      }

      const ctx = el.plusCanvas.getContext("2d");
      if (state.fmt === "versiculo") {
        drawVerseCard(ctx, sz.w, sz.h, content, state.style);
      } else {
        const spec = {
          title: content.t || content.x.split("\n")[0],
          body: state.fmt === "cura" ? content.x : "",
          ctaRows: state.fmt === "mensagem"
            ? [["💬", "Comente AMÉM", "declaração de fé"], ["📤", "Compartilhe", "pode ser o recado de alguém"]]
            : [["💬", "Comente EU RECEBO", "declaração de cura"], ["💌", "Marque alguém", "que precisa dessa palavra"]],
        };
        drawEngagementCard(ctx, sz.w, sz.h, spec);
      }

      const pngBlob = await new Promise((resolve) => {
        el.plusCanvas.toBlob((b) => resolve(b || new Blob([], { type: "image/png" })), "image/png", 1);
      });
      state.lastBlob = pngBlob; state.lastMime = "image/png";

      el.plusCanvas.hidden = true; el.plusImage.src = URL.createObjectURL(pngBlob); el.plusImage.hidden = false;
      el.plusVideo.hidden = true; hidePlaybackBar();
      el.btnDownload.disabled = false; el.btnDownload.textContent = "⬇ Baixar imagem (PNG)";

      state.caption = plusCaptionFor(state.fmt, content);
      el.captionText.value = state.caption; el.captionCard.hidden = false; el.btnCopyCaption.disabled = false;

      setStatus("Imagem pronta! ✧", 1);
      showToast("Imagem " + sz.w + "×" + sz.h + " pronta. ✧", "ok");
    } catch (e) {
      console.error(e);
      el.plusVideo.hidden = true; el.plusImage.hidden = true; el.plusCanvas.hidden = true; el.placeholder.hidden = false; hidePlaybackBar();
      showToast("Erro: " + (e.message || "tente novamente."), "error");
      setStatus("Falha na geração.", 0);
    } finally {
      state.busy = false; el.btnGenerate.disabled = false; setTimeout(resetStatus, 5000);
    }
  }

  /* =========================================================
     GERAÇÃO — VÍDEO (Ken Burns 7s)
     ========================================================= */
  async function handleGenerateVideo() {
    if (state.busy) return;
    state.busy = true; el.btnGenerate.disabled = true;

    try {
      el.placeholder.hidden = true; el.plusVideo.hidden = true; el.plusImage.hidden = true; el.plusCanvas.hidden = false;
      const sz = PLUS_SIZES[state.size] || PLUS_SIZES.portrait;
      el.plusCanvas.width = sz.w; el.plusCanvas.height = sz.h;
      el.btnDownload.disabled = true; hidePlaybackBar();

      const text = el.scriptText.value.trim();
      if (!text) { showToast("Escreva a frase primeiro. ✧", "warn"); state.busy = false; el.btnGenerate.disabled = false; return; }

      const content = contentFromInputs();
      const totalDur = 10;

      let bgImg = null;
      if (state.style === "photo") {
        setStatus("Buscando cenário…", 0.05);
        const bg = await generateBackground(sz.h);
        bgImg = await loadHtmlImage(bg.blob);
      }

      const ctx = el.plusCanvas.getContext("2d");
      const mime = pickMime();
      if (!mime) throw new Error("Seu navegador não suporta gravação de vídeo.");

      const stream = el.plusCanvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8000000 });
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const stopped = new Promise((resolve, reject) => { recorder.onstop = resolve; recorder.onerror = (e) => reject(e.error || new Error("Erro na gravação")); });

      recorder.start(250);
      setStatus("Gravando vídeo (~" + totalDur + "s)…", 0.1);

      const SAFETY_TIMEOUT = (totalDur + 5) * 1000;
      await new Promise((resolve, reject) => {
        let last = performance.now(); let elapsed = 0; let resolved = false;
        const safetyTimer = setTimeout(() => { if (!resolved) { resolved = true; try { recorder.stop(); } catch (e) {} reject(new Error("Timeout na gravação.")); } }, SAFETY_TIMEOUT);

        function frame(now) {
          if (resolved) return;
          const rawDt = (now - last) / 1000; last = now;
          elapsed += Math.min(rawDt, 0.5);
          const p = clamp(elapsed / totalDur, 0, 1);

          ctx.save();
          if (bgImg) {
            const segIdx = Math.min(Math.floor(p * KB_SEGS.length), KB_SEGS.length - 1);
            drawKenBurns(ctx, bgImg, sz.w, sz.h, p, segIdx);
            drawScrim(ctx, sz.w, sz.h, 1);
          } else {
            if (state.fmt === "versiculo") {
              paintStyleBase(ctx, sz.w, sz.h, state.style);
            } else {
              paintDarkBase(ctx, sz.w, sz.h);
            }
          }

          const textAlpha = clamp(elapsed / 1.5, 0, 1);
          ctx.globalAlpha = textAlpha;
          if (state.fmt === "versiculo") {
            drawVerseCard(ctx, sz.w, sz.h, content, state.style);
          } else {
            const spec = {
              title: content.t || content.x.split("\n")[0],
              body: state.fmt === "cura" ? content.x : "",
              ctaRows: state.fmt === "mensagem"
                ? [["💬", "Comente AMÉM", "declaração de fé"], ["📤", "Compartilhe", "pode ser o recado de alguém"]]
                : [["💬", "Comente EU RECEBO", "declaração de cura"], ["💌", "Marque alguém", "que precisa dessa palavra"]],
            };
            drawEngagementCard(ctx, sz.w, sz.h, spec);
          }
          ctx.restore();

          el.progressFill.style.width = Math.round(p * 100) + "%";
          el.progressStatus.textContent = "Gravando… " + Math.round(p * 100) + "%";

          if (elapsed >= totalDur + 0.3) {
            resolved = true; clearTimeout(safetyTimer);
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

      state.lastBlob = blob; state.lastMime = type;
      el.plusCanvas.hidden = true; el.plusVideo.src = URL.createObjectURL(blob); el.plusVideo.hidden = false;
      showPlaybackBar();
      el.btnDownload.disabled = false;
      el.btnDownload.textContent = type === "video/mp4" ? "⬇ Baixar MP4" : "⬇ Baixar vídeo (WebM)";

      state.caption = plusCaptionFor(state.fmt, content);
      el.captionText.value = state.caption; el.captionCard.hidden = false; el.btnCopyCaption.disabled = false;

      setStatus("Vídeo pronto! ✧", 1);
      showToast(type === "video/mp4" ? "Vídeo MP4 " + sz.w + "×" + sz.h + " pronto. ✧" : "Vídeo pronto! ✧", "ok");
    } catch (e) {
      console.error(e);
      el.plusVideo.hidden = true; el.plusImage.hidden = true; el.plusCanvas.hidden = true; el.placeholder.hidden = false; hidePlaybackBar();
      showToast("Erro: " + (e.message || "tente novamente."), "error");
      setStatus("Falha na gravação.", 0);
    } finally {
      state.busy = false; el.btnGenerate.disabled = false; setTimeout(resetStatus, 5000);
    }
  }

  /* =========================================================
     PLAYBACK
     ========================================================= */
  function fmtTime(s) { if (!Number.isFinite(s) || s < 0) return "0:00"; return Math.floor(s / 60) + ":" + (Math.floor(s % 60) < 10 ? "0" : "") + Math.floor(s % 60); }

  function updatePlaybackUI() {
    const v = el.plusVideo; if (!v || v.hidden) return;
    el.pbTime.textContent = fmtTime(v.currentTime) + " / " + fmtTime(v.duration);
    el.pbProgress.style.width = (v.duration > 0 ? (v.currentTime / v.duration * 100) : 0) + "%";
  }

  function showPlaybackBar() { el.playbackBar.hidden = false; el.btnStopPb.disabled = false; el.btnPlayPb.hidden = false; el.btnPausePb.hidden = true; updatePlaybackUI(); }
  function hidePlaybackBar() { el.playbackBar.hidden = true; }

  /* =========================================================
     DOWNLOAD / COPY
     ========================================================= */
  function triggerDownload(blob, name) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function downloadResult() {
    if (!state.lastBlob) return;
    const isImage = state.lastMime === "image/png";
    const ext = isImage ? "png" : (state.lastMime === "video/mp4" ? "mp4" : "webm");
    triggerDownload(state.lastBlob, "alvorada-plus." + ext);
    showToast(isImage ? "Imagem salva. ✧" : "Vídeo salvo. ✧", "ok");
  }

  async function copyCaption() {
    try { await navigator.clipboard.writeText(state.caption || el.captionText.value); showToast("Legenda copiada! ✧", "ok"); }
    catch (e) { el.captionText.select(); document.execCommand("copy"); showToast("Legenda copiada! ✧", "ok"); }
  }

  /* =========================================================
     SURPRISE
     ========================================================= */
  function surprise() {
    const fmts = PLUS_FORMATS.map((f) => f.id);
    const styles = Object.keys(PLUS_CARD_STYLES);
    const themes = PLUS_THEMES.map((t) => t.id);
    state.fmt = randomItem(fmts);
    state.style = randomItem(styles);
    state.theme = randomItem(themes);
    state.source = randomItem(Object.keys(PLUS_SOURCES));
    pickContent(); renderChips(); savePrefs();
    handleGenerate();
  }

  function handleGenerate() {
    if (el.btnGenerate.dataset.mode === "video") handleGenerateVideo();
    else handleGenerateImage();
  }

  /* =========================================================
     PREFS
     ========================================================= */
  function savePrefs() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ fmt: state.fmt, style: state.style, theme: state.theme, source: state.source, size: state.size })); } catch (e) {}
  }

  function loadPrefs() {
    try {
      const j = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
      if (!j) return;
      if (PLUS_FORMATS.some((f) => f.id === j.fmt)) state.fmt = j.fmt;
      if (PLUS_CARD_STYLES[j.style]) state.style = j.style;
      if (PLUS_THEMES.some((t) => t.id === j.theme)) state.theme = j.theme;
      if (PLUS_SOURCES[j.source]) state.source = j.source;
      if (PLUS_SIZES[j.size]) state.size = j.size;
    } catch (e) {}
  }

  /* =========================================================
     INIT
     ========================================================= */
  function init() {
    el.fmtChips = $("#fmt-chips");
    el.styleChips = $("#style-chips");
    el.styleOptions = $("#style-options");
    el.styleHint = $("#style-hint");
    el.themeChips = $("#theme-chips");
    el.themeOptions = $("#theme-options");
    el.sourceChips = $("#source-chips");
    el.sourceOptions = $("#source-options");
    el.sizeChips = $("#size-chips");
    el.sizeOptions = $("#size-options");
    el.fmtHint = $("#fmt-hint");
    el.scriptText = $("#script-text");
    el.scriptRef = $("#script-ref");
    el.scriptMeta = $("#script-meta");
    el.refRow = $("#ref-row");
    el.engineNote = $("#engine-note");
    el.btnGenerate = $("#btn-generate");
    el.btnNewContent = $("#btn-new-content");
    el.btnSurprise = $("#btn-surprise");
    el.btnSurpriseHero = $("#btn-surprise-hero");
    el.plusStage = $("#plus-stage");
    el.placeholder = $("#stage-placeholder");
    el.plusVideo = $("#plus-video");
    el.plusImage = $("#plus-image");
    el.plusCanvas = $("#plus-canvas");
    el.progressRow = $("#progress-row");
    el.progressFill = $("#progress-fill");
    el.progressStatus = $("#progress-status");
    el.btnDownload = $("#btn-download");
    el.btnCopyCaption = $("#btn-copy-caption");
    el.btnCopyCaption2 = $("#btn-copy-caption-2");
    el.captionCard = $("#caption-card");
    el.captionText = $("#caption-text");
    el.playbackBar = $("#plus-playback-bar");
    el.btnPlayPb = $("#plus-btn-play");
    el.btnPausePb = $("#plus-btn-pause");
    el.btnStopPb = $("#plus-btn-stop");
    el.pbTime = $("#plus-pb-time");
    el.pbTrack = $("#plus-pb-track");
    el.pbProgress = $("#plus-pb-progress");
    el.downloadNote = $("#download-note");

    loadPrefs();
    renderChips();
    pickContent();

    el.scriptText.addEventListener("input", updateScriptMeta);
    el.btnNewContent.addEventListener("click", pickContent);
    el.btnGenerate.addEventListener("click", handleGenerate);
    if (el.btnSurprise) el.btnSurprise.addEventListener("click", surprise);
    if (el.btnSurpriseHero) el.btnSurpriseHero.addEventListener("click", () => { surprise(); document.getElementById("estudio").scrollIntoView({ behavior: "smooth" }); });
    el.btnDownload.addEventListener("click", downloadResult);
    el.btnCopyCaption.addEventListener("click", copyCaption);
    if (el.btnCopyCaption2) el.btnCopyCaption2.addEventListener("click", copyCaption);

    const modeChips = document.querySelectorAll("#rv-mode-chips .chip");
    modeChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        modeChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        const mode = chip.dataset.mode || "image";
        el.btnGenerate.dataset.mode = mode;
        el.btnGenerate.textContent = mode === "video" ? "🎬 Gerar vídeo (7s)" : "✧ Gerar post";
      });
    });

    if (el.btnPlayPb) el.btnPlayPb.addEventListener("click", () => { el.plusVideo.play(); el.btnPlayPb.hidden = true; el.btnPausePb.hidden = false; });
    if (el.btnPausePb) el.btnPausePb.addEventListener("click", () => { el.plusVideo.pause(); el.btnPlayPb.hidden = false; el.btnPausePb.hidden = true; });
    if (el.btnStopPb) el.btnStopPb.addEventListener("click", () => { el.plusVideo.pause(); el.plusVideo.currentTime = 0; el.btnPlayPb.hidden = false; el.btnPausePb.hidden = true; updatePlaybackUI(); });
    if (el.pbTrack) el.pbTrack.addEventListener("click", (e) => { const rect = el.pbTrack.getBoundingClientRect(); el.plusVideo.currentTime = clamp((e.clientX - rect.left) / rect.width, 0, 1) * (el.plusVideo.duration || 0); updatePlaybackUI(); });
    if (el.plusVideo) {
      el.plusVideo.addEventListener("timeupdate", updatePlaybackUI);
      el.plusVideo.addEventListener("ended", () => { el.btnPlayPb.hidden = false; el.btnPausePb.hidden = true; updatePlaybackUI(); });
      el.plusVideo.addEventListener("click", () => { if (el.plusVideo.paused) { el.plusVideo.play(); el.btnPlayPb.hidden = true; el.btnPausePb.hidden = false; } else { el.plusVideo.pause(); el.btnPlayPb.hidden = false; el.btnPausePb.hidden = true; } });
    }

    const navToggle = document.getElementById("nav-toggle");
    const siteNav = document.getElementById("site-nav");
    if (navToggle && siteNav) { navToggle.addEventListener("click", () => { navToggle.classList.toggle("open"); siteNav.classList.toggle("open"); }); }

    document.querySelectorAll(".tip, .pipe, .badge, .hero h1, .hero .sub, .hero-actions, .hero-badges, .section-head").forEach((el2) => { el2.classList.add("reveal-up"); });
    const obs = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }); }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal-up").forEach((el2) => obs.observe(el2));
    document.querySelectorAll(".hero .reveal-up").forEach((el2) => el2.classList.add("visible"));
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); } else { init(); }
})();
