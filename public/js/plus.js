/* =========================================================
   Alvorada do Céu — Aba Plus (Engajamento)
   Motor: cards de versículo (preto/claro/página da bíblia/foto),
   posts AMÉM, marque alguém, mensagem de Deus, quiz bíblico,
   stories interativos e planner do mix semanal.
   Fundos: Cloudflare FLUX → Pollinations → Pexels → Pixabay
   (fallback automático entre as fontes).
   ========================================================= */

(() => {
  "use strict";

  const PREFS_KEY = "alvorada_plus_prefs_v1";
  const WEEK_KEY = "alvorada_plus_week_v1";

  /* ---------- helpers ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

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
    fmt: "versiculo",
    style: "dark",
    theme: "ceu",
    source: "cloudflare",
    sticker: "poll",
    size: "portrait",
    content: null,
    busy: false,
    lastBlob: null,
    slides: [],
    caption: "",
    weekPlan: null,
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

    /* estilos do card */
    el.styleChips.innerHTML = "";
    Object.entries(PLUS_CARD_STYLES).forEach(([k, s]) => {
      const b = makeChip(s.label, { style: k });
      if (k === state.style) b.classList.add("active");
      b.title = s.desc;
      b.addEventListener("click", () => { state.style = k; renderChips(); savePrefs(); });
      el.styleChips.appendChild(b);
    });
    el.styleHint.textContent = "✦ " + (PLUS_CARD_STYLES[state.style] || PLUS_CARD_STYLES.dark).desc;

    /* temas */
    el.themeChips.innerHTML = "";
    PLUS_THEMES.forEach((t) => {
      const b = makeChip(t.emoji + " " + t.label, { theme: t.id });
      if (t.id === state.theme) b.classList.add("active");
      b.addEventListener("click", () => { state.theme = t.id; renderChips(); savePrefs(); });
      el.themeChips.appendChild(b);
    });

    /* fontes */
    el.sourceChips.innerHTML = "";
    Object.entries(PLUS_SOURCES).forEach(([k, s]) => {
      const b = makeChip(s.label, { source: k });
      if (k === state.source) b.classList.add("active");
      b.title = s.desc;
      b.addEventListener("click", () => { state.source = k; renderChips(); savePrefs(); });
      el.sourceChips.appendChild(b);
    });

    /* stickers do story */
    el.stickerChips.innerHTML = "";
    PLUS_STORIES.forEach((st) => {
      const b = makeChip(st.label, { sticker: st.id });
      if (st.id === state.sticker) b.classList.add("active");
      b.addEventListener("click", () => { state.sticker = st.id; pickContent(); renderChips(); savePrefs(); });
      el.stickerChips.appendChild(b);
    });
    const sticker = PLUS_STORIES.find((s) => s.id === state.sticker) || PLUS_STORIES[0];
    el.stickerHint.textContent = "✦ " + sticker.hint;

    /* tamanhos */
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
    const isVerse = state.fmt === "versiculo";
    const isCarousel = state.fmt === "carrossel";
    const needsPhoto =
      (isVerse && state.style === "photo") ||
      (isCarousel && state.style === "photo") ||
      ["amem", "marque", "mensagem", "quiz", "story"].includes(state.fmt);

    el.styleOptions.hidden = !(isVerse || isCarousel);
    el.storyOptions.hidden = state.fmt !== "story";
    el.sizeOptions.hidden = ["story", "semana", "quiz"].includes(state.fmt);
    el.scriptBox.hidden = ["quiz", "story", "semana"].includes(state.fmt);
    el.refRow.hidden = !(isVerse || state.fmt === "mensagem");
    el.themeOptions.hidden = !needsPhoto;
    el.sourceOptions.hidden = !needsPhoto;
  }

  function updateEngineNote() {
    const fd = fmtById(state.fmt);
    let extra = "";
    if (state.fmt === "versiculo") {
      extra = " · " + (PLUS_CARD_STYLES[state.style] || {}).label.replace(/^[^\s]+\s/, "");
      if (state.style === "photo") extra += " (" + (PLUS_SOURCES[state.source] || {}).label + ")";
    } else if (state.fmt === "carrossel") {
      extra = " · " + (PLUS_CARD_STYLES[state.style] || {}).label.replace(/^[^\s]+\s/, "");
      const sz = PLUS_SIZES[state.size] || PLUS_SIZES.portrait;
      extra += " · carrossel de slides · " + sz.w + "×" + sz.h;
    } else if (["amem", "marque", "mensagem", "quiz", "story"].includes(state.fmt)) {
      extra = " · fundo " + (PLUS_SOURCES[state.source] || {}).label + " · tema " + (PLUS_THEMES.find((t) => t.id === state.theme) || {}).label;
    }
    if (!["story", "semana", "quiz"].includes(state.fmt)) {
      const sz = PLUS_SIZES[state.size];
      extra += (state.fmt === "carrossel" ? "" : " · " + sz.w + "×" + sz.h);
    } else if (state.fmt === "story") {
      extra = " · 1080×1920";
    } else if (state.fmt === "semana") {
      extra = " · planner 1080×1350";
    } else if (state.fmt === "quiz") {
      extra = " · carrossel de 3 slides (1080×1350)";
    }
    el.engineNote.textContent = "✦ " + fd.label.replace(/^[^\s]+\s/, "") + extra;
    el.btnGenerate.textContent =
      state.fmt === "semana" ? "🗓️ Gerar planner da semana" :
      state.fmt === "quiz" ? "🧠 Gerar quiz (3 slides)" :
      state.fmt === "carrossel" ? "🎠 Gerar carrossel de palavras" :
      state.fmt === "story" ? "📱 Gerar story" : "✧ Gerar post";

    if (el.downloadNote) {
      el.downloadNote.textContent =
        state.fmt === "quiz" ? "Baixe os 3 slides e poste como carrossel na ordem: pergunta → resposta → convite." :
        state.fmt === "carrossel" ? "Baixe todos os slides e poste como carrossel na ordem gerada — capa primeiro, CTA por último." :
        state.fmt === "semana" ? "Salve o planner e use o plano em texto copiável como checklist do dia." :
        state.fmt === "story" ? "Poste nos stories e adicione o sticker nativo por cima se quiser." :
        "Poste no feed com a legenda pronta — ela já vem com pedido de engajamento e hashtags.";
    }
  }

  /* =========================================================
     CONTEÚDO POR FORMATO
     ========================================================= */
  /* lembra o último conteúdo usado por formato para nunca repetir ao gerar de novo */
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
    if (c.x != null) el.scriptText.value = c.x;
    if (el.scriptRef) el.scriptRef.value = c.ref || "";
    updateScriptMeta();
  }

  function buildContent() {
    switch (state.fmt) {
      case "versiculo": return pickFresh(PLUS_VERSES, (v) => v.x);
      case "amem": return pickFresh(PLUS_AMEN_PRAYERS, (p) => p.x);
      case "marque": {
        const line = pickFresh(PLUS_MARK_LINES, (l) => l.head);
        return { head: line.head, sub: line.sub, x: pickFresh(PLUS_MARK_TEXTS, (t) => t) };
      }
      case "mensagem": {
        const m = pickFresh(PLUS_MESSAGES, (mm) => mm.x);
        return { hook: pickFresh(PLUS_MESSAGE_HOOKS, (h) => h), x: m.x, ref: m.ref };
      }
      case "carrossel": {
        const serie = pickFresh(PLUS_CAROUSELS, (s) => s.id);
        return {
          id: serie.id,
          title: serie.title,
          kicker: serie.kicker,
          verses: serie.verses.map((v) => ({ x: v.x, ref: v.ref })),
          x: carouselVersesToText(serie.verses),
        };
      }
      case "story": {
        const st = PLUS_STORIES.find((s) => s.id === state.sticker) || PLUS_STORIES[0];
        return { id: st.id, question: st.question, options: st.options.slice() };
      }
      default: return {};
    }
  }

  function contentFromInputs() {
    const base = state.content || {};
    const text = el.scriptText.value.trim();
    const ref = (el.scriptRef ? el.scriptRef.value : "").trim();
    const out = Object.assign({}, base);
    if (text) out.x = text;
    else if (base.head) out.x = base.sub || "";
    if (ref !== "" || base.ref) out.ref = ref;
    /* no carrossel, cada linha do textarea é um slide: "texto | Referência" */
    if (state.fmt === "carrossel") {
      out.verses = carouselTextToVerses(text || base.x || "");
    }
    return out;
  }

  function carouselVersesToText(verses) {
    return (verses || []).map((v) => v.x + " | " + (v.ref || "Palavra de Deus")).join("\n");
  }

  function carouselTextToVerses(text) {
    return String(text || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|");
        if (parts.length >= 2) {
          return { x: parts.slice(0, -1).join("|").trim(), ref: parts[parts.length - 1].trim() };
        }
        return { x: line.replace(/^[-•\s]+/, "").trim(), ref: "Palavra de Deus" };
      });
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
      body: JSON.stringify({ prompt, steps: 8 }),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => "") || "Cloudflare respondeu " + res.status);
    const blob = await res.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  async function pollImage(prompt) {
    const url = "/api/image?prompt=" + encodeURIComponent(prompt) +
      "&width=1024&height=1024&seed=" + randomInt(0, 999999) + "&nologo=true";
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
      "?q=" + encodeURIComponent(query) +
      "&per_page=15" +
      (isPexels ? "&orientation=portrait" : "&min_width=800&min_height=1200");
    const proxyPath = isPexels ? "/api/pexels/proxy" : "/api/pixabay/proxy";

    const res = await fetch(searchUrl);
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error((isPexels ? "Pexels" : "Pixabay") + ": " + (msg || res.status));
    }
    const j = await res.json();
    const photos = (j.photos || []).filter((p) => p.image);
    if (!photos.length) throw new Error("Nenhuma foto encontrada para este tema.");
    const portrait = photos.filter((p) => p.height >= p.width * 1.05);
    const pick = randomItem(portrait.length >= 3 ? portrait : photos);

    const r2 = await fetch(proxyPath + "?url=" + encodeURIComponent(pick.image));
    if (!r2.ok) throw new Error("Proxy de imagem respondeu " + r2.status);
    const blob = await r2.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  function plusBuildImagePrompt(theme) {
    return (
      "breathtaking ultra-high-quality spiritual artwork, absolutely no text, no letters, no words, no watermark, " +
      theme.scene +
      ", cinematic lighting, luminous divine radiance, exquisite detail, professional color grading, sharp crisp focus, masterpiece, high quality"
    );
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
  };

  function generateFallbackImage(themeId) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
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

  async function generateFrame(theme, sourceId) {
    const prompt = plusBuildImagePrompt(theme);
    const chosen = PLUS_SOURCES[sourceId] ? sourceId : "cloudflare";
    const order = [chosen].concat(Object.keys(PLUS_SOURCES).filter((k) => k !== chosen));
    for (const src of order) {
      try {
        if (src === "cloudflare") return { blob: await cfImage(prompt), src: "cloudflare" };
        if (src === "pollinations") return { blob: await pollImage(prompt), src: "pollinations" };
        if (src === "pexels") return { blob: await stockPhoto("pexels", theme.query), src: "pexels" };
        if (src === "pixabay") return { blob: await stockPhoto("pixabay", theme.query), src: "pixabay" };
      } catch (e) {
        console.warn("Fonte de imagem \"" + src + "\" falhou, tentando a próxima:", e);
      }
    }
    console.warn("Todas as fontes falharam — usando gradiente local.");
    return { blob: await generateFallbackImage(theme.id), src: "fallback" };
  }

  function loadHtmlImage(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível carregar o fundo."));
      img.src = URL.createObjectURL(blob);
    });
  }

  /* desenha imagem cobrindo todo o canvas (cover) */
  function drawCover(ctx, img, FW, FH) {
    const ir = img.width / img.height;
    const cr = FW / FH;
    let sx, sy, sw, sh;
    if (ir > cr) { sh = img.height; sw = img.height * cr; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = img.width / cr; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, FW, FH);
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
    } catch (e) { /* segue com fallback */ }
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

  /* =========================================================
     CARD DE VERSÍCULO (preto / claro / página da bíblia / foto)
     ========================================================= */
  function paintDarkBase(ctx, FW, FH) {
    const g = ctx.createRadialGradient(FW / 2, FH * 0.38, 0, FW / 2, FH * 0.5, FH * 0.85);
    g.addColorStop(0, "#17142a");
    g.addColorStop(0.6, "#0d0b18");
    g.addColorStop(1, "#050409");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FW, FH);
    for (let i = 0; i < 46; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * FW, Math.random() * FH, Math.random() * 1.7 + 0.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,250,230," + (Math.random() * 0.14 + 0.02) + ")";
      ctx.fill();
    }
    const rg = ctx.createRadialGradient(FW / 2, FH * 0.44, 0, FW / 2, FH * 0.44, FW * 0.72);
    rg.addColorStop(0, "rgba(230,195,90,0.1)");
    rg.addColorStop(1, "rgba(230,195,90,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, FW, FH);
  }

  function paintLightBase(ctx, FW, FH) {
    const g = ctx.createLinearGradient(0, 0, 0, FH);
    g.addColorStop(0, "#fdfaf2");
    g.addColorStop(0.55, "#f7f1e2");
    g.addColorStop(1, "#efe6cf");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FW, FH);
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * FW, Math.random() * FH, Math.random() * 1.6 + 0.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(150,125,60," + (Math.random() * 0.07 + 0.015) + ")";
      ctx.fill();
    }
    const rg = ctx.createRadialGradient(FW / 2, FH * 0.42, 0, FW / 2, FH * 0.42, FW * 0.8);
    rg.addColorStop(0, "rgba(212,175,55,0.08)");
    rg.addColorStop(1, "rgba(212,175,55,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, FW, FH);
  }

  function paintBiblePage(ctx, FW, FH) {
    /* papel envelhecido com colunas de texto simuladas */
    ctx.fillStyle = "#f2e8d0";
    ctx.fillRect(0, 0, FW, FH);

    const vg = ctx.createRadialGradient(FW / 2, FH / 2, FH * 0.2, FW / 2, FH / 2, FH * 0.75);
    vg.addColorStop(0, "rgba(120,90,40,0)");
    vg.addColorStop(0.75, "rgba(120,90,40,0.1)");
    vg.addColorStop(1, "rgba(96,70,28,0.32)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, FW, FH);

    /* manchas de idade */
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * FW;
      const y = Math.random() * FH;
      const r = Math.random() * FW * 0.09 + FW * 0.02;
      const mg = ctx.createRadialGradient(x, y, 0, x, y, r);
      mg.addColorStop(0, "rgba(140,105,50,0.06)");
      mg.addColorStop(1, "rgba(140,105,50,0)");
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    /* vinco central */
    ctx.fillStyle = "rgba(110,80,35,0.1)";
    ctx.fillRect(FW / 2 - 1, 0, 2, FH);
    ctx.fillStyle = "rgba(255,252,240,0.5)";
    ctx.fillRect(FW / 2 + 1, 0, 1, FH);

    /* colunas de texto simuladas */
    const marginX = FW * 0.075;
    const topY = FH * 0.06;
    const botY = FH * 0.95;
    const colGap = FW * 0.05;
    const colW = (FW - marginX * 2 - colGap) / 2;
    const lineH = FH * 0.011;
    ctx.save();
    for (let col = 0; col < 2; col++) {
      const x0 = marginX + col * (colW + colGap);
      let y = topY;
      while (y < botY) {
        const segs = randomInt(2, 4);
        let x = x0;
        for (let sIdx = 0; sIdx < segs && x < x0 + colW; sIdx++) {
          const segW = Math.min(randomInt(colW * 0.06, colW * 0.14), x0 + colW - x);
          ctx.fillStyle = "rgba(90,72,45," + (Math.random() * 0.1 + 0.16) + ")";
          ctx.fillRect(x, y, segW, lineH * 0.52);
          x += segW + lineH * 0.32;
        }
        y += lineH * (Math.random() > 0.92 ? 2.1 : 1);
      }
    }
    /* número de página e cabeçalho simulados */
    ctx.fillStyle = "rgba(90,72,45,0.4)";
    ctx.font = "600 " + Math.round(FH * 0.012) + "px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("A T E R O   P R I M E I R O", marginX, topY - lineH * 0.8);
    ctx.textAlign = "right";
    ctx.fillText(String(randomInt(300, 900)), FW - marginX, topY - lineH * 0.8);
    ctx.restore();

    /* área limpa central para o versículo */
    const cardY = FH * 0.3;
    const cardH = FH * 0.4;
    const cg = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
    cg.addColorStop(0, "rgba(242,232,208,0)");
    cg.addColorStop(0.18, "rgba(243,233,210,0.96)");
    cg.addColorStop(0.82, "rgba(243,233,210,0.96)");
    cg.addColorStop(1, "rgba(242,232,208,0)");
    ctx.fillStyle = cg;
    ctx.fillRect(0, cardY, FW, cardH);
  }

  function drawVerseCard(ctx, FW, FH, verse, styleId) {
    const light = styleId === "light" || styleId === "biblepage";
    const inkMain = light ? "#33270e" : "#fffdf6";
    const inkDim = light ? "rgba(70,56,24,0.72)" : "rgba(255,253,246,0.72)";
    const gold = light ? "rgba(158,124,34,0.95)" : "rgba(230,195,90,0.95)";
    const serif = "'Playfair Display','Cormorant Garamond',Georgia,serif";
    const sans = "'Poppins','Segoe UI',sans-serif";

    if (styleId === "dark") paintDarkBase(ctx, FW, FH);
    else if (styleId === "light") paintLightBase(ctx, FW, FH);
    else if (styleId === "biblepage") paintBiblePage(ctx, FW, FH);
    /* photo já foi pintada pelo chamador */

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    /* moldura dupla elegante */
    const inset = FW * 0.034;
    ctx.strokeStyle = gold;
    ctx.lineWidth = Math.max(2, FW * 0.0022);
    if (styleId === "photo") {
      ctx.strokeRect(inset, inset, FW - inset * 2, FH - inset * 2);
    } else {
      ctx.globalAlpha = 0.65;
      ctx.strokeRect(inset, inset, FW - inset * 2, FH - inset * 2);
      ctx.globalAlpha = 0.3;
      ctx.strokeRect(inset * 1.5, inset * 1.5, FW - inset * 3, FH - inset * 3);
      ctx.globalAlpha = 1;
    }

    /* kicker */
    const kicker = randomItem(PLUS_CARD_KICKERS);
    ctx.save();
    try { ctx.letterSpacing = Math.round(FW * 0.01) + "px"; } catch (e) {}
    ctx.font = "600 " + Math.round(FW * 0.027) + "px " + sans;
    ctx.fillStyle = gold;
    ctx.fillText(kicker.toUpperCase(), FW / 2, FH * (styleId === "story" ? 0.14 : 0.155));
    try { ctx.letterSpacing = "0px"; } catch (e) {}
    ctx.restore();

    /* ornamento ✦ pequeno */
    ctx.font = Math.round(FW * 0.03) + "px " + sans;
    ctx.fillStyle = gold;
    ctx.fillText("✦", FW / 2, FH * 0.21);

    /* versículo */
    let vSize = FW * 0.072;
    if (FW / FH < 0.75) vSize = FW * 0.082; /* story mais alto: fonte maior ok */
    const maxTextW = FW * 0.78;
    let lines = wrapLines(ctx, verse.x, "600 " + Math.round(vSize) + "px " + serif, maxTextW, 99);
    while ((lines.length > (FH > FW * 1.3 ? 7 : 5) || lines.length * vSize * 1.34 > FH * 0.44) && vSize > FW * 0.04) {
      vSize -= 2;
      lines = wrapLines(ctx, verse.x, "600 " + Math.round(vSize) + "px " + serif, maxTextW, 99);
    }
    const lh = vSize * 1.34;
    const blockH = lines.length * lh;
    const centerY = FH * 0.47;
    let y = centerY - blockH / 2 + lh / 2;
    ctx.save();
    if (styleId === "photo") {
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = vSize * 0.22;
      ctx.shadowOffsetY = vSize * 0.05;
    }
    ctx.fillStyle = inkMain;
    ctx.font = "600 " + Math.round(vSize) + "px " + serif;
    for (const ln of lines) { ctx.fillText(ln, FW / 2, y); y += lh; }
    ctx.restore();

    /* divisor + referência */
    const refY = centerY + blockH / 2 + FH * 0.05;
    drawDivider(ctx, FW / 2, refY, FW * 0.13, gold, FW * 0.042);
    const refText = verse.ref || "Palavra de Deus";
    ctx.font = "700 " + Math.round(FW * 0.034) + "px " + sans;
    ctx.fillStyle = inkDim;
    ctx.fillText(refText.toUpperCase(), FW / 2, refY + FH * 0.038);

    drawWatermark(ctx, FW, FH, light);
  }

  /* =========================================================
     POST ÚNICO DE ENGAJAMENTO (AMÉM / Marque / Mensagem)
     Layout fluido: mede título+corpo, encolhe até caber antes
     dos CTAs — nunca sobrepõe em nenhuma resolução.
     ========================================================= */
  function drawEngagementCard(ctx, FW, FH, spec) {
    const serif = "'Playfair Display','Cormorant Garamond',Georgia,serif";
    const sans = "'Poppins','Segoe UI',sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    /* moldura */
    const inset = FW * 0.034;
    ctx.strokeStyle = "rgba(230,195,90,0.5)";
    ctx.lineWidth = Math.max(2, FW * 0.0022);
    ctx.strokeRect(inset, inset, FW - inset * 2, FH - inset * 2);

    /* kicker dourado */
    ctx.save();
    try { ctx.letterSpacing = Math.round(FW * 0.009) + "px"; } catch (e) {}
    const kFont = fitFont(ctx, spec.kicker.toUpperCase(), "600", FW * 0.028, sans, FW * 0.76, FW * 0.02);
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = FW * 0.012;
    ctx.fillStyle = "rgba(230,195,90,0.95)";
    ctx.font = kFont;
    ctx.fillText(spec.kicker.toUpperCase(), FW / 2, FH * 0.125);
    try { ctx.letterSpacing = "0px"; } catch (e) {}
    ctx.restore();

    /* emoji */
    if (spec.emoji) {
      ctx.font = Math.round(FW * 0.095) + "px 'Segoe UI Emoji','Noto Color Emoji',sans-serif";
      ctx.fillText(spec.emoji, FW / 2, FH * 0.212);
    }

    /* título + corpo: blocos medidos em cascata */
    let tSize = Math.min(FW * 0.088, 96);
    let bSize = Math.min(FW * 0.041, 46);
    const titleTop = FH * (spec.emoji ? 0.295 : 0.265);
    const maxTitleW = FW * 0.8;
    const maxBodyW = FW * 0.76;

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
    while (m.bottom > FH * 0.55 && guard-- > 0 && (tSize > FW * 0.042 || bSize > FW * 0.028)) {
      if (tSize > FW * 0.042) tSize = Math.max(FW * 0.042, tSize * 0.955);
      if (bSize > FW * 0.028) bSize = Math.max(FW * 0.028, bSize * 0.955);
      m = measureBlocks();
    }

    /* título */
    let ty = titleTop + m.tlh / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = tSize * 0.18;
    ctx.shadowOffsetY = tSize * 0.05;
    ctx.fillStyle = "#fffdf6";
    ctx.font = "700 " + Math.round(tSize) + "px " + serif;
    for (const ln of m.tLines) { ctx.fillText(ln, FW / 2, ty); ty += m.tlh; }
    ctx.restore();

    /* divisor logo abaixo da última linha do título */
    drawDivider(ctx, FW / 2, ty - m.tlh + m.tlh * 0.62, FW * 0.13, "rgba(230,195,90,0.92)", FW * 0.042);

    /* corpo */
    let bodyBottom = ty - m.tlh;
    if (m.bLines.length) {
      let by = ty - m.tlh + m.bodyGap + m.blh / 2;
      ctx.fillStyle = "rgba(255,253,246,0.88)";
      ctx.font = "500 " + Math.round(bSize) + "px " + sans;
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = FW * 0.01;
      for (const ln of m.bLines) { ctx.fillText(ln, FW / 2, by); by += m.blh; }
      ctx.shadowBlur = 0;
      bodyBottom = by - m.blh / 2;
    }

    /* linhas de CTA + botão seguir: posições resolvidas por medida,
       garantindo folga entre corpo → CTAs → botão em qualquer resolução */
    const ctaK = FH < FW * 1.25 ? 0.78 : 1; /* quadrado: linhas compactas */
    const g1 = FH * 0.05;
    const g2 = FH * 0.042;
    const subExtent = (FW * 0.048 + FW * 0.0425) * ctaK; /* distância do centro da linha ao fim do subtítulo */

    function placeRows(n) {
      const start = Math.max(bodyBottom + g1, FH * 0.555);
      const followLabelTop = FH * 0.862 - FH * 0.05 - FW * 0.022;
      /* cada linha precisa de subExtent + respiro, senão o subtítulo invade a linha seguinte */
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
    for (const row of rows) {
      drawCtaRow(ctx, FW, rowY, row[0], row[1], row[2], false, ctaK);
      rowY += lay.slot;
    }

    drawFollowButton(ctx, FW, FH, lay.cyFollow);
    drawWatermark(ctx, FW, FH, false);
  }

  /* =========================================================
     QUIZ BÍBLICO — carrossel de 3 slides
     ========================================================= */
  function drawQuizCover(ctx, FW, FH, quiz, bgImg) {
    if (bgImg) { drawCover(ctx, bgImg, FW, FH); drawScrim(ctx, FW, FH, 1); }
    else { paintDarkBase(ctx, FW, FH); }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const inset = FW * 0.034;
    ctx.strokeStyle = "rgba(230,195,90,0.5)";
    ctx.lineWidth = Math.max(2, FW * 0.0022);
    ctx.strokeRect(inset, inset, FW - inset * 2, FH - inset * 2);

    ctx.save();
    try { ctx.letterSpacing = Math.round(FW * 0.009) + "px"; } catch (e) {}
    ctx.font = "600 " + Math.round(FW * 0.028) + "px 'Poppins','Segoe UI',sans-serif";
    ctx.fillStyle = "rgba(230,195,90,0.95)";
    ctx.fillText("QUIZ BÍBLICO", FW / 2, FH * 0.135);
    try { ctx.letterSpacing = "0px"; } catch (e) {}
    ctx.restore();

    ctx.font = Math.round(FW * 0.1) + "px 'Segoe UI Emoji','Noto Color Emoji',sans-serif";
    ctx.fillText("🧠", FW / 2, FH * 0.215);

    /* pergunta: fluxo de cima para baixo, encolhe até caber antes da pílula */
    const serif = "'Playfair Display','Cormorant Garamond',Georgia,serif";
    let tSize = Math.min(FW * 0.075, 84);
    const qTop = FH * 0.29;
    let lines = wrapLines(ctx, quiz.q, "700 " + Math.round(tSize) + "px " + serif, FW * 0.8, 99);
    while ((lines.length > 5 || qTop + lines.length * tSize * 1.24 > FH * 0.58) && tSize > FW * 0.042) {
      tSize -= 2;
      lines = wrapLines(ctx, quiz.q, "700 " + Math.round(tSize) + "px " + serif, FW * 0.8, 99);
    }
    const tlh = tSize * 1.24;
    let ty = qTop + tlh / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = tSize * 0.16;
    ctx.fillStyle = "#fffdf6";
    ctx.font = "700 " + Math.round(tSize) + "px " + serif;
    for (const ln of lines) { ctx.fillText(ln, FW / 2, ty); ty += tlh; }
    ctx.restore();

    drawDivider(ctx, FW / 2, ty - tlh + tlh * 0.66, FW * 0.13, "rgba(230,195,90,0.92)", FW * 0.042);

    const subText = "Responde aqui nos comentários 👇";
    const pill = drawGoldPill(ctx, FW / 2, Math.max(ty - tlh + tlh * 0.66 + FH * 0.065, FH * 0.68), subText, FW * 0.034);

    ctx.fillStyle = "rgba(255,253,246,0.66)";
    ctx.font = "500 " + Math.round(FW * 0.028) + "px 'Poppins','Segoe UI',sans-serif";
    ctx.fillText("Deslize para conferir a resposta →", FW / 2, pill.ph / 2 + Math.max(ty - tlh + tlh * 0.66 + FH * 0.065, FH * 0.68) + FH * 0.05);

    drawFollowButton(ctx, FW, FH, FH * 0.89);
    drawWatermark(ctx, FW, FH, false);
  }

  function drawQuizAnswer(ctx, FW, FH, quiz, bgImg) {
    if (bgImg) { drawCover(ctx, bgImg, FW, FH); drawScrim(ctx, FW, FH, 1.05); }
    else { paintDarkBase(ctx, FW, FH); }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    /* badge RESPOSTA */
    ctx.save();
    try { ctx.letterSpacing = Math.round(FW * 0.009) + "px"; } catch (e) {}
    ctx.font = "700 " + Math.round(FW * 0.03) + "px 'Poppins','Segoe UI',sans-serif";
    const label = "RESPOSTA CORRETA";
    const bw = ctx.measureText(label).width + FW * 0.06;
    ctx.strokeStyle = "rgba(230,195,90,0.8)";
    ctx.lineWidth = Math.max(2, FW * 0.003);
    roundRectPath(ctx, (FW - bw) / 2, FH * 0.115, bw, FH * 0.055, FH * 0.0275);
    ctx.stroke();
    ctx.fillStyle = "rgba(230,195,90,1)";
    ctx.fillText(label, FW / 2, FH * 0.115 + FH * 0.0275 + 1);
    try { ctx.letterSpacing = "0px"; } catch (e) {}
    ctx.restore();

    /* versículo completo: fluxo com limite antes do destaque */
    const serif = "'Playfair Display','Cormorant Garamond',Georgia,serif";
    let vSize = Math.min(FW * 0.064, 72);
    const vTop = FH * 0.235;
    let lines = wrapLines(ctx, quiz.verse, "600 " + Math.round(vSize) + "px " + serif, FW * 0.8, 99);
    while ((lines.length > 6 || vTop + lines.length * vSize * 1.3 > FH * 0.55) && vSize > FW * 0.036) {
      vSize -= 2;
      lines = wrapLines(ctx, quiz.verse, "600 " + Math.round(vSize) + "px " + serif, FW * 0.8, 99);
    }
    const vlh = vSize * 1.3;
    let vy = vTop + vlh / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = vSize * 0.18;
    ctx.fillStyle = "#fffdf6";
    ctx.font = "600 " + Math.round(vSize) + "px " + serif;
    for (const ln of lines) { ctx.fillText(ln, FW / 2, vy); vy += vlh; }
    ctx.restore();

    const refY = vy - vlh + vlh * 0.72;
    ctx.fillStyle = "rgba(255,253,246,0.7)";
    ctx.font = "600 " + Math.round(FW * 0.03) + "px 'Poppins','Segoe UI',sans-serif";
    ctx.fillText(quiz.ref, FW / 2, refY);

    /* palavra que faltava em destaque — sempre abaixo do versículo */
    const pillY = Math.max(refY + FH * 0.055, FH * 0.64);
    const pill = drawGoldPill(ctx, FW / 2, pillY, "✨ " + quiz.answer.toUpperCase() + " ✨", FW * 0.042);

    ctx.fillStyle = "rgba(255,253,246,0.75)";
    ctx.font = "500 " + Math.round(FW * 0.031) + "px 'Poppins','Segoe UI',sans-serif";
    ctx.fillText("Acertou? Comenta \"ACERTEI\" 🙌", FW / 2, pillY + pill.ph / 2 + FH * 0.05);

    drawFollowButton(ctx, FW, FH, FH * 0.86);
    drawWatermark(ctx, FW, FH, false);
  }

  /* =========================================================
     STORY INTERATIVO — mockup de sticker
     ========================================================= */
  function drawStorySticker(ctx, FW, FH, story, bgImg) {
    /* o fundo já foi pintado pelo chamador (foto ou base); aqui só o mockup */
    if (bgImg) { drawCover(ctx, bgImg, FW, FH); drawScrim(ctx, FW, FH, 0.85); }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    /* topo estilo stories */
    ctx.fillStyle = "rgba(255,253,246,0.9)";
    ctx.font = "600 " + Math.round(FW * 0.028) + "px 'Poppins','Segoe UI',sans-serif";
    ctx.fillText("ALVORADA DO CÉU", FW / 2, FH * 0.075);
    /* barra de progresso */
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    roundRectPath(ctx, FW * 0.06, FH * 0.045, FW * 0.88, FH * 0.004, FH * 0.002);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    roundRectPath(ctx, FW * 0.06, FH * 0.045, FW * 0.44, FH * 0.004, FH * 0.002);
    ctx.fill();

    /* pergunta grande acima do sticker */
    const qSize = Math.min(FW * 0.062, 72);
    const qlines = wrapLines(ctx, story.question, "700 " + Math.round(qSize) + "px 'Playfair Display','Cormorant Garamond',Georgia,serif", FW * 0.84, 4);
    const qlh = qSize * 1.26;
    const stickerTop = FH * 0.585;
    const qBottom = stickerTop - FH * 0.045;
    let qy = qBottom - (qlines.length - 1) * qlh;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = qSize * 0.18;
    ctx.fillStyle = "#fffdf6";
    for (const ln of qlines) { ctx.fillText(ln, FW / 2, qy); qy += qlh; }
    ctx.restore();

    const boxW = FW * 0.78;
    const boxX = (FW - boxW) / 2;

    if (story.id === "ask") {
      /* caixinha de perguntas */
      const boxH = FH * 0.17;
      const boxY = stickerTop;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = FW * 0.05;
      ctx.shadowOffsetY = FW * 0.012;
      roundRectPath(ctx, boxX, boxY, boxW, boxH, FW * 0.035);
      ctx.fillStyle = "rgba(255,255,255,0.94)";
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#1c1a2e";
      ctx.font = "600 " + Math.round(FW * 0.032) + "px 'Poppins','Segoe UI',sans-serif";
      ctx.fillText("Responda aqui ✍️", FW / 2, boxY + boxH * 0.34);
      ctx.fillStyle = "rgba(28,26,46,0.45)";
      ctx.font = "400 " + Math.round(FW * 0.027) + "px 'Poppins','Segoe UI',sans-serif";
      ctx.fillText("caixinha de perguntas anônimas", FW / 2, boxY + boxH * 0.62);
    } else {
      /* opções empilhadas estilo enquete */
      const opts = story.options.slice(0, 3);
      const optH = FH * 0.075;
      const optGap = FH * 0.022;
      const totalH = opts.length * optH + (opts.length - 1) * optGap;
      let oy = stickerTop;
      opts.forEach((opt, i) => {
        const pctFill = i === 0 ? 0.62 : i === 1 ? 0.34 : 0.18;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = FW * 0.03;
        ctx.shadowOffsetY = FW * 0.008;
        roundRectPath(ctx, boxX, oy, boxW, optH, FW * 0.02);
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.fill();
        ctx.restore();
        /* preenchimento de resultado */
        ctx.save();
        roundRectPath(ctx, boxX, oy, boxW * pctFill, optH, FW * 0.02);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 " + Math.round(FW * 0.033) + "px 'Poppins','Segoe UI',sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(opt, boxX + FW * 0.035, oy + optH / 2 + 1);
        ctx.textAlign = "right";
        ctx.font = "600 " + Math.round(FW * 0.028) + "px 'Poppins','Segoe UI',sans-serif";
        ctx.fillText(Math.round(pctFill * 100) + "%", boxX + boxW - FW * 0.035, oy + optH / 2 + 1);
        ctx.textAlign = "center";
        oy += optH + optGap;
      });
    }

    /* rodapé de instrução — sempre abaixo do sticker/enquete, nunca por cima */
    const stickerBottom = story.id === "ask"
      ? stickerTop + FH * 0.17
      : stickerTop + Math.min(story.options.length, 3) * FH * 0.075 + (Math.min(story.options.length, 3) - 1) * FH * 0.022;
    ctx.fillStyle = "rgba(255,253,246,0.8)";
    ctx.font = "500 " + Math.round(FW * 0.03) + "px 'Poppins','Segoe UI',sans-serif";
    ctx.fillText(story.id === "ask" ? "Cole o sticker \"pergunta\" no story 👆" : "Cole o sticker \"enquete\" no story 👆", FW / 2, Math.max(stickerBottom + FH * 0.045, FH * 0.86));
    drawWatermark(ctx, FW, FH, false);
  }

  /* =========================================================
     PLANNER DO MIX SEMANAL
     ========================================================= */
  function buildWeekPlan() {
    const usedGoals = [];
    const plan = PLUS_WEEK_DAYS.map((day) => {
      const pool = PLUS_WEEK_POOL[day.id] || [];
      /* prefere objetivos ainda não usados na semana para variar o mix */
      let options = shuffle(pool.filter((o) => !usedGoals.includes(o.goal)));
      if (!options.length) options = shuffle(pool);
      const pick = options[0] || randomItem(pool);
      usedGoals.push(pick.goal);
      return {
        day: day.label,
        emoji: pick.e,
        label: pick.label,
        detail: pick.detail,
        hour: pick.hour,
        goal: pick.goal,
        tool: pick.tool,
      };
    });
    return plan;
  }

  function weekPlanText(plan) {
    const goalLabel = (g) => (PLUS_WEEK_GOALS[g] || {}).label || g;
    const toolLabel = (t) => ({ plus: "Aba Plus", reels: "Aba Reels", frase: "Aba Frases" }[t] || t);
    const lines = ["🗓️ MIX DA SEMANA — Alvorada do Céu", ""];
    plan.forEach((d) => {
      lines.push(d.day + " · " + d.hour);
      lines.push("   " + d.emoji + " " + d.label + " (" + toolLabel(d.tool) + ")");
      lines.push("   " + d.detail + " · objetivo: " + goalLabel(d.goal));
      lines.push("");
    });
    lines.push("📌 Poste sempre no mesmo horário e responda todos os comentários na primeira hora.");
    lines.push("🎲 Sorteie um novo mix quando quiser — a ordem dos objetivos fica variada.");
    return lines.join("\n");
  }

  function renderWeekBoard(plan) {
    const board = $("#week-board");
    if (!board) return;
    board.innerHTML = "";
    const goalMap = PLUS_WEEK_GOALS;
    const toolMap = { plus: "Plus ✦", reels: "Reels ✦", frase: "Frases ✦" };
    plan.forEach((d) => {
      const card = document.createElement("div");
      card.className = "week-day";
      const head = document.createElement("div");
      head.className = "week-day-head";
      const name = document.createElement("span");
      name.className = "week-day-name";
      name.textContent = d.day;
      const hour = document.createElement("span");
      hour.className = "week-hour";
      hour.textContent = d.hour;
      head.appendChild(name);
      head.appendChild(hour);

      const slot = document.createElement("div");
      slot.className = "week-slot";
      const emo = document.createElement("span");
      emo.className = "w-e";
      emo.textContent = d.emoji;
      const info = document.createElement("div");
      const lbl = document.createElement("div");
      lbl.className = "w-label";
      lbl.textContent = d.label;
      const det = document.createElement("div");
      det.className = "w-detail";
      det.textContent = d.detail;
      const meta = document.createElement("div");
      meta.className = "week-slot-meta";
      const goal = document.createElement("span");
      goal.className = "w-goal";
      goal.textContent = (goalMap[d.goal] || {}).emoji + " " + (goalMap[d.goal] || {}).label;
      const tool = document.createElement("span");
      tool.className = "w-tool";
      tool.textContent = "gerar em: " + (toolMap[d.tool] || d.tool);
      meta.appendChild(goal);
      meta.appendChild(tool);
      info.appendChild(lbl);
      info.appendChild(det);
      info.appendChild(meta);
      slot.appendChild(emo);
      slot.appendChild(info);

      card.appendChild(head);
      card.appendChild(slot);
      board.appendChild(card);
    });
  }

  function loadWeek() {
    try {
      const j = JSON.parse(localStorage.getItem(WEEK_KEY) || "null");
      if (j && Array.isArray(j.plan) && j.plan.length === 7) return j.plan;
    } catch (e) {}
    const plan = buildWeekPlan();
    try { localStorage.setItem(WEEK_KEY, JSON.stringify({ plan })); } catch (e) {}
    return plan;
  }

  function saveWeek(plan) {
    state.weekPlan = plan;
    try { localStorage.setItem(WEEK_KEY, JSON.stringify({ plan })); } catch (e) {}
    renderWeekBoard(plan);
  }

  function drawWeekCard(ctx, FW, FH, plan) {
    paintDarkBase(ctx, FW, FH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const inset = FW * 0.03;
    ctx.strokeStyle = "rgba(230,195,90,0.45)";
    ctx.lineWidth = Math.max(2, FW * 0.002);
    ctx.strokeRect(inset, inset, FW - inset * 2, FH - inset * 2);

    /* título */
    ctx.save();
    try { ctx.letterSpacing = Math.round(FW * 0.01) + "px"; } catch (e) {}
    ctx.font = "600 " + Math.round(FW * 0.026) + "px 'Poppins','Segoe UI',sans-serif";
    ctx.fillStyle = "rgba(230,195,90,0.95)";
    ctx.fillText("ALVORADA DO CÉU · PLANNER", FW / 2, FH * 0.075);
    try { ctx.letterSpacing = "0px"; } catch (e) {}
    ctx.restore();

    ctx.font = "700 " + Math.round(FW * 0.082) + "px 'Playfair Display','Cormorant Garamond',Georgia,serif";
    ctx.fillStyle = "#fffdf6";
    ctx.fillText("Mix da Semana", FW / 2, FH * 0.125);

    drawDivider(ctx, FW / 2, FH * 0.165, FW * 0.12, "rgba(230,195,90,0.9)", FW * 0.036);

    /* linhas dos dias */
    const rowsTop = FH * 0.2;
    const rowH = FH * 0.0935;
    const rowGap = FH * 0.008;
    const rowW = FW * 0.87;
    const rowX = (FW - rowW) / 2;

    plan.forEach((d, i) => {
      const y = rowsTop + i * (rowH + rowGap);
      roundRectPath(ctx, rowX, y, rowW, rowH, FW * 0.02);
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.028)";
      ctx.fill();

      /* dia */
      ctx.textAlign = "left";
      ctx.font = "700 " + Math.round(FW * 0.03) + "px 'Poppins','Segoe UI',sans-serif";
      ctx.fillStyle = "rgba(230,195,90,0.95)";
      ctx.fillText(d.day.toUpperCase(), rowX + FW * 0.032, y + rowH * 0.31);

      /* formato */
      ctx.font = "600 " + Math.round(FW * 0.0305) + "px 'Poppins','Segoe UI',sans-serif";
      ctx.fillStyle = "#fffdf6";
      ctx.fillText(d.emoji + "  " + d.label, rowX + FW * 0.032, y + rowH * 0.64);

      /* detalhe */
      ctx.font = "400 " + Math.round(FW * 0.023) + "px 'Poppins','Segoe UI',sans-serif";
      ctx.fillStyle = "rgba(242,237,228,0.6)";
      ctx.fillText(d.detail, rowX + FW * 0.032, y + rowH * 0.86);

      /* horário à direita */
      ctx.textAlign = "right";
      ctx.font = "700 " + Math.round(FW * 0.026) + "px 'Poppins','Segoe UI',sans-serif";
      ctx.fillStyle = "rgba(230,195,90,0.9)";
      ctx.fillText(d.hour, rowX + rowW - FW * 0.032, y + rowH * 0.34);

      /* objetivo à direita */
      const goal = PLUS_WEEK_GOALS[d.goal] || { emoji: "", label: d.goal };
      ctx.font = "500 " + Math.round(FW * 0.022) + "px 'Poppins','Segoe UI',sans-serif";
      ctx.fillStyle = "rgba(242,237,228,0.62)";
      ctx.fillText(goal.emoji + " " + goal.label, rowX + rowW - FW * 0.032, y + rowH * 0.64);
    });

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,253,246,0.6)";
    ctx.font = "500 " + Math.round(FW * 0.024) + "px 'Poppins','Segoe UI',sans-serif";
    ctx.fillText("Constância é o que transforma visitante em seguidor fiel 🙏", FW / 2, FH * 0.935);

    drawWatermark(ctx, FW, FH, false);
  }

  /* =========================================================
     EXPORTAÇÃO / PREVIEW
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

  function clearStrip() {
    if (!el.strip) return;
    el.strip.innerHTML = "";
    el.strip.hidden = true;
  }

  function renderStrip(slides) {
    if (!el.strip) return;
    el.strip.innerHTML = "";
    el.strip.hidden = false;
    slides.forEach((s, i) => {
      const thumb = document.createElement("div");
      thumb.className = "cs-thumb" + (i === 0 ? " active" : "");
      const img = document.createElement("img");
      img.src = s.url;
      img.alt = "Slide " + (i + 1);
      img.loading = "lazy";
      const num = document.createElement("span");
      num.className = "cs-num";
      num.textContent = String(i + 1);
      const dl = document.createElement("button");
      dl.type = "button";
      dl.className = "cs-dl";
      dl.title = "Baixar slide " + (i + 1);
      dl.textContent = "⬇";
      dl.addEventListener("click", (ev) => {
        ev.stopPropagation();
        triggerDownload(s.blob, plusFileName(i + 1));
        showToast("Slide " + (i + 1) + " salvo. ✧", "ok");
      });
      thumb.appendChild(img);
      thumb.appendChild(num);
      thumb.appendChild(dl);
      thumb.addEventListener("click", () => {
        el.image.src = s.url;
        el.strip.querySelectorAll(".cs-thumb").forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
      });
      el.strip.appendChild(thumb);
    });
  }

  function triggerDownload(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function slugify(text) {
    return String(text || "post")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "").trim()
      .replace(/\s+/g, "-").slice(0, 40) || "post";
  }

  function plusFileName(i) {
    return "alvorada-plus-" + state.fmt + "-" + String(i).padStart(2, "0") + ".png";
  }

  function downloadAll() {
    const slides = state.slides || [];
    if (!slides.length) return;
    (async () => {
      for (let i = 0; i < slides.length; i++) {
        triggerDownload(slides[i].blob, plusFileName(i + 1));
        setStatus("Baixando slides… " + (i + 1) + "/" + slides.length, (i + 1) / slides.length);
        await sleep(420);
      }
      resetStatus();
      showToast(slides.length + " imagens salvas na pasta de downloads. ✧", "ok");
    })();
  }

  function finishWithSlides(slides, caption) {
    state.slides = slides;
    state.lastBlob = slides[0].blob;
    state.caption = caption;
    el.canvas.hidden = true;
    el.image.src = slides[0].url;
    el.image.hidden = false;
    el.placeholder.hidden = true;
    if (slides.length > 1) renderStrip(slides);
    else clearStrip();
    el.btnDownload.disabled = false;
    el.btnDownload.textContent = slides.length > 1 ? "⬇ Baixar os " + slides.length + " slides" : "⬇ Baixar imagem (PNG)";
    el.btnCopyCaption.disabled = false;
    el.btnCopyCaption2.disabled = false;
    el.captionText.value = caption;
    el.captionCard.hidden = false;
  }

  function failGeneration(e) {
    console.error(e);
    el.image.hidden = true;
    el.canvas.hidden = true;
    el.placeholder.hidden = false;
    clearStrip();
    showToast("Não foi possível gerar agora: " + (e.message || "tente novamente."), "error");
    setStatus("Falha na geração. Tente novamente.", 0);
  }

  function stageAspect(w, h) {
    el.stage.style.aspectRatio = w + "/" + h;
  }

  /* =========================================================
     FLUXOS DE GERAÇÃO
     ========================================================= */
  async function generateVersiculo() {
    const verse = contentFromInputs();
    if (!verse.x) { showToast("Escreva o versículo primeiro. ✧", "warn"); return; }
    const style = state.style;
    let FW, FH;
    if (state.size === "square") { FW = 1080; FH = 1080; }
    else if (state.size === "story") { FW = 1080; FH = 1920; }
    else { FW = 1080; FH = 1350; }
    stageAspect(FW, FH);
    el.canvas.width = FW;
    el.canvas.height = FH;
    const ctx = el.canvas.getContext("2d");

    setStatus(style === "photo" ? "Buscando o fundo (" + (PLUS_SOURCES[state.source] || {}).label + ")…" : "Desenhando o card…", 0.15);
    await ensureCanvasFonts();

    if (style === "photo") {
      const frame = await generateFrame(PLUS_THEMES.find((t) => t.id === state.theme) || PLUS_THEMES[0], state.source);
      setStatus("Compondo o versículo…", 0.6);
      const img = await loadHtmlImage(frame.blob);
      ctx.clearRect(0, 0, FW, FH);
      drawCover(ctx, img, FW, FH);
      drawScrim(ctx, FW, FH, 0.95);
    } else {
      setStatus("Compondo o versículo…", 0.6);
      ctx.clearRect(0, 0, FW, FH);
    }
    drawVerseCard(ctx, FW, FH, verse, style);

    const blob = await new Promise((resolve) => {
      el.canvas.toBlob((b) => resolve(b || new Blob([], { type: "image/png" })), "image/png", 1);
    });
    finishWithSlides([{ blob, url: URL.createObjectURL(blob) }], plusCaptionFor("versiculo", verse));
    setStatus("Versículo pronto! Baixe e poste. ✧", 1);
    showToast("Card de versículo pronto. ✧", "ok");
  }

  async function generateEngagement(formatId) {
    const c = contentFromInputs();
    const specs = {
      amem: () => ({
        kicker: randomItem(["Oração do dia", "Um momento de oração", "Ora comigo"]),
        emoji: "🙏",
        title: c.t || "Ore comigo agora",
        body: c.x,
        ctaRows: [
          ["👇", "Comente AMÉM", "para declarar esta oração"],
          ["📌", "Salve esta oração", "para rezar de novo depois"],
          ["✨", "Envie para alguém", "que precisa orar hoje"],
        ],
      }),
      marque: () => ({
        kicker: randomItem(["Abençoe alguém", "Espalhe luz", "Fé que contagia"]),
        emoji: "💌",
        title: c.head || "Marque alguém que precisa ler isso",
        body: c.x || c.sub,
        ctaRows: [
          ["👇", "Marque nos comentários", "quem precisa ouvir isso hoje"],
          ["📤", "Envie no privado", "para quem você lembrou agora"],
          ["📌", "Salve este post", "para abençoar outra pessoa depois"],
        ],
      }),
      mensagem: () => ({
        kicker: c.hook || randomItem(PLUS_MESSAGE_HOOKS),
        emoji: "✉️",
        title: "Deus tem um recado para você",
        body: c.x + (c.ref ? "  (" + c.ref + ")" : ""),
        ctaRows: [
          ["✨", "Compartilhe este recado", "pode ser o recado de alguém"],
          ["🙏", "Comente AMÉM", "se você recebeu essa palavra"],
          ["📌", "Salve para reler", "nos dias difíceis"],
        ],
      }),
    };
    const spec = specs[formatId]();
    if (!spec.body) { showToast("Escreva o texto primeiro. ✧", "warn"); return; }

    const size = PLUS_SIZES[state.size] || PLUS_SIZES.portrait;
    const FW = size.w;
    const FH = size.h;
    stageAspect(FW, FH);
    el.canvas.width = FW;
    el.canvas.height = FH;
    const ctx = el.canvas.getContext("2d");

    setStatus("Buscando o fundo (" + (PLUS_SOURCES[state.source] || {}).label + ")…", 0.12);
    const frame = await generateFrame(PLUS_THEMES.find((t) => t.id === state.theme) || PLUS_THEMES[0], state.source);
    const img = await loadHtmlImage(frame.blob);
    setStatus("Compondo o post…", 0.6);
    await ensureCanvasFonts();
    ctx.clearRect(0, 0, FW, FH);
    drawCover(ctx, img, FW, FH);
    drawScrim(ctx, FW, FH, 1.05);
    drawEngagementCard(ctx, FW, FH, spec);

    const blob = await new Promise((resolve) => {
      el.canvas.toBlob((b) => resolve(b || new Blob([], { type: "image/png" })), "image/png", 1);
    });
    finishWithSlides([{ blob, url: URL.createObjectURL(blob) }], plusCaptionFor(formatId, spec));
    setStatus("Post pronto! Baixe e publique. ✧", 1);
    showToast("Post \"" + formatId + "\" pronto. ✧", "ok");
  }

  async function generateQuiz() {
    const savedFmt = state.fmt;
    state.fmt = "quiz";
    const quiz = pickFresh(PLUS_QUIZ, (q) => q.q);
    state.fmt = savedFmt;
    const FW = 1080;
    const FH = 1350;
    stageAspect(FW, FH);
    el.canvas.width = FW;
    el.canvas.height = FH;
    const ctx = el.canvas.getContext("2d");

    const bgBlobs = [];
    for (let i = 0; i < 2; i++) {
      bgBlobs.push(await generateFrame(PLUS_THEMES.find((t) => t.id === state.theme) || PLUS_THEMES[0], state.source));
      setStatus("Buscando fundos… " + (i + 1) + "/2 prontos", 0.08 + i * 0.12);
    }
    const bgImgs = [];
    for (const b of bgBlobs) bgImgs.push(await loadHtmlImage(b.blob));

    await ensureCanvasFonts();
    const slides = [];
    const defs = [
      { fn: drawQuizCover, cap: "capa-pergunta" },
      { fn: drawQuizAnswer, cap: "resposta" },
    ];
    for (let i = 0; i < defs.length; i++) {
      setStatus("Renderizando slide " + (i + 1) + " de 3…", 0.35 + i * 0.25);
      ctx.clearRect(0, 0, FW, FH);
      defs[i].fn(ctx, FW, FH, quiz, bgImgs[i % bgImgs.length]);
      const blob = await new Promise((resolve) => {
        el.canvas.toBlob((b) => resolve(b || new Blob([], { type: "image/png" })), "image/png", 1);
      });
      slides.push({ blob, url: URL.createObjectURL(blob) });
      await sleep(40);
    }
    /* slide final de convite a seguir */
    setStatus("Renderizando slide 3 de 3…", 0.85);
    ctx.clearRect(0, 0, FW, FH);
    drawCover(ctx, bgImgs[0], FW, FH);
    drawScrim(ctx, FW, FH, 1.1);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawDivider(ctx, FW / 2, FH * 0.2, FW * 0.12, "rgba(230,195,90,0.9)", FW * 0.04);
    ctx.fillStyle = "#fffdf6";
    ctx.font = "700 " + Math.round(Math.min(FW * 0.07, 80)) + "px 'Playfair Display','Cormorant Garamond',Georgia,serif";
    ctx.fillText("Qual foi a sua resposta?", FW / 2, FH * 0.3);
    const rows = [
      ["🧠", "Comente sua resposta", "antes de conferir o slide 2"],
      ["🎯", "Acertou?", "comenta ACERTEI e desafia alguém"],
      ["✨", "Marque um amigo", "para responder o quiz também"],
    ];
    let rowY = FH * 0.4;
    for (const row of rows) {
      drawCtaRow(ctx, FW, rowY, row[0], row[1], row[2]);
      rowY += FH * 0.12;
    }
    drawFollowButton(ctx, FW, FH, FH * 0.84);
    drawWatermark(ctx, FW, FH, false);
    {
      const blob = await new Promise((resolve) => {
        el.canvas.toBlob((b) => resolve(b || new Blob([], { type: "image/png" })), "image/png", 1);
      });
      slides.push({ blob, url: URL.createObjectURL(blob) });
    }

    finishWithSlides(slides, plusCaptionFor("quiz", quiz));
    setStatus("Quiz pronto! Poste os 3 slides na ordem. ✧", 1);
    showToast("Quiz bíblico de 3 slides pronto. ✧", "ok");
  }

  /* ---------- carrossel de palavras 🎠 ---------- */
  function carouselPalette(styleId) {
    const light = styleId === "light" || styleId === "biblepage";
    return {
      light,
      inkMain: light ? "#33270e" : "#fffdf6",
      inkDim: light ? "rgba(70,56,24,0.72)" : "rgba(255,253,246,0.72)",
      gold: light ? "rgba(158,124,34,0.95)" : "rgba(230,195,90,0.95)",
      serif: "'Playfair Display','Cormorant Garamond',Georgia,serif",
      sans: "'Poppins','Segoe UI',sans-serif",
    };
  }

  /* capa do carrossel: título grande, kicker dourado e bolinhas de progresso */
  function drawCarouselCover(ctx, FW, FH, serie, total) {
    const p = carouselPalette(state.style === "photo" ? "photo" : state.style);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    /* moldura */
    const inset = FW * 0.034;
    ctx.strokeStyle = p.gold;
    ctx.lineWidth = Math.max(2, FW * 0.0022);
    ctx.globalAlpha = 0.7;
    ctx.strokeRect(inset, inset, FW - inset * 2, FH - inset * 2);
    ctx.globalAlpha = 1;

    /* kicker */
    ctx.save();
    try { ctx.letterSpacing = Math.round(FW * 0.012) + "px"; } catch (e) {}
    ctx.font = "600 " + Math.round(FW * 0.028) + "px " + p.sans;
    ctx.fillStyle = p.gold;
    const kickerY = FH * 0.15;
    ctx.fillText((serie.kicker || "Série de palavras").toUpperCase(), FW / 2, kickerY);
    try { ctx.letterSpacing = "0px"; } catch (e) {}
    ctx.restore();

    /* ornamento e título: fluxo de cima para baixo com limite antes da pílula */
    const divY = kickerY + FH * 0.05;
    drawDivider(ctx, FW / 2, divY, FW * 0.09, p.gold, FW * 0.004);
    let tSize = FW * 0.085;
    const titleTop = divY + FH * 0.058;
    const titleText = serie.title || "Palavras para o coração";
    let titleLines = wrapLines(ctx, titleText, "700 " + Math.round(tSize) + "px " + p.serif, FW * 0.78, 99);
    while ((titleLines.length > 3 || titleTop + titleLines.length * tSize * 1.16 > FH * 0.52) && tSize > FW * 0.048) {
      tSize *= 0.955;
      titleLines = wrapLines(ctx, titleText, "700 " + Math.round(tSize) + "px " + p.serif, FW * 0.78, 99);
    }
    const tlh = tSize * 1.16;
    let ty = titleTop + tlh / 2;
    titleLines.forEach((line) => {
      ctx.fillStyle = p.inkMain;
      ctx.font = "700 " + Math.round(tSize) + "px " + p.serif;
      ctx.fillText(line, FW / 2, ty);
      ty += tlh;
    });

    /* subtítulo com contagem de versículos */
    const lastTitleBaseline = ty - tlh;
    const subY = lastTitleBaseline + tlh * 0.66;
    const nVerses = (serie.verses || []).length;
    ctx.font = "400 " + Math.round(FW * 0.032) + "px " + p.sans;
    ctx.fillStyle = p.inkDim;
    ctx.fillText(nVerses + " versículos para guardar no coração", FW / 2, subY);

    /* selo "arraste" e bolinhas — ancorados abaixo do texto, nunca por cima */
    const pillY = Math.max(subY + FH * 0.062, FH * 0.6);
    const pill = drawGoldPill(ctx, FW / 2, pillY, "ARRASTE PARA O LADO ➜", Math.round(FW * 0.026));

    const dotY = pillY + pill.ph / 2 + FH * 0.05;
    const gap = FW * 0.032;
    const startX = FW / 2 - ((total - 1) * gap) / 2;
    for (let i = 0; i < total; i++) {
      ctx.beginPath();
      ctx.arc(startX + i * gap, dotY, i === 0 ? FW * 0.0095 : FW * 0.007, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? p.gold : (p.light ? "rgba(70,56,24,0.35)" : "rgba(255,253,246,0.35)");
      ctx.fill();
    }

    drawFollowButton(ctx, FW, FH, FH * 0.86);
    drawWatermark(ctx, FW, FH, p.light);
  }

  /* slide final: CTA de salvamento/compartilhamento */
  function drawCarouselEnd(ctx, FW, FH, serie) {
    const p = carouselPalette(state.style === "photo" ? "photo" : state.style);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    drawDivider(ctx, FW / 2, FH * 0.15, FW * 0.09, p.gold, FW * 0.004);

    ctx.fillStyle = p.inkMain;
    ctx.font = "700 " + Math.round(FW * 0.066) + "px " + p.serif;
    ctx.fillText("Guarde estas palavras", FW / 2, FH * 0.225);

    const rows = [
      ["📌", "Salve este carrossel", "para reler nos dias difíceis"],
      ["✨", "Compartilhe nos stories", "alguém precisa ler isso hoje"],
      ["💌", "Marque uma pessoa", "que ama a Palavra como você"],
    ];
    const endK = FH < FW * 1.25 ? 0.78 : 1;
    let rowY = FH * 0.345;
    const endSlot = Math.max(FH * 0.108, (FW * 0.0905 + FH * 0.035) * endK);
    for (const row of rows) {
      drawCtaRow(ctx, FW, rowY, row[0], row[1], row[2], p.light, endK);
      rowY += endSlot;
    }

    /* citação da série: ancorada abaixo do texto das CTAs, nunca sobreposta */
    const lastSubBottom = rowY - FH * 0.112 + FW * 0.048 + FW * 0.0425;
    const quotePill = drawGoldPill(ctx, FW / 2, Math.max(lastSubBottom + FH * 0.045, FH * 0.7), "\u201C" + (serie.title || "Palavra de Deus") + "\u201D", Math.round(FW * 0.024));
    void quotePill;
    drawFollowButton(ctx, FW, FH, FH * 0.86);
    drawWatermark(ctx, FW, FH, p.light);
  }

  async function generateCarrossel() {
    const c = contentFromInputs();
    if (!c.verses || !c.verses.length) {
      showToast("Escreva pelo menos um versículo (um por linha). ✧", "warn");
      return;
    }
    if (c.verses.length > 8) {
      showToast("Carrossel com até 8 slides de versículo — mantive os 8 primeiros. ✧", "warn");
      c.verses = c.verses.slice(0, 8);
    }

    /* carrossel é post de feed: story vira retrato automaticamente */
    let sizeKey = state.size;
    if (sizeKey === "story") {
      sizeKey = "portrait";
      showToast("Carrossel é post de feed — usando resolução Post 4:5 · 1080×1350.", "info");
    }
    const size = PLUS_SIZES[sizeKey] || PLUS_SIZES.portrait;
    const FW = size.w;
    const FH = size.h;

    const serie = { title: c.title || "Palavras para o seu coração", kicker: c.kicker || "Série de palavras", verses: c.verses };
    const totalSlides = c.verses.length + 2;
    stageAspect(FW, FH);
    el.canvas.width = FW;
    el.canvas.height = FH;
    const ctx = el.canvas.getContext("2d");

    await ensureCanvasFonts();

    /* uma única foto para o carrossel inteiro — coesão visual */
    let bgImg = null;
    if (state.style === "photo") {
      setStatus("Buscando o fundo (" + (PLUS_SOURCES[state.source] || {}).label + ")…", 0.08);
      const frame = await generateFrame(PLUS_THEMES.find((t) => t.id === state.theme) || PLUS_THEMES[0], state.source);
      bgImg = await loadHtmlImage(frame.blob);
    }

    const slides = [];
    for (let i = 0; i < totalSlides; i++) {
      setStatus("Renderizando slide " + (i + 1) + " de " + totalSlides + "…", 0.15 + (i / totalSlides) * 0.75);
      ctx.clearRect(0, 0, FW, FH);
      if (i === 0) {
        if (state.style === "photo") { drawCover(ctx, bgImg, FW, FH); drawScrim(ctx, FW, FH, 1.0); }
        else if (state.style === "dark") paintDarkBase(ctx, FW, FH);
        else if (state.style === "light") paintLightBase(ctx, FW, FH);
        else paintBiblePage(ctx, FW, FH);
        drawCarouselCover(ctx, FW, FH, serie, totalSlides);
      } else if (i <= c.verses.length) {
        const verse = c.verses[i - 1];
        if (state.style === "photo") { drawCover(ctx, bgImg, FW, FH); drawScrim(ctx, FW, FH, 0.95); }
        drawVerseCard(ctx, FW, FH, verse, state.style === "photo" ? "photo" : state.style);
      } else {
        if (state.style === "photo") { drawCover(ctx, bgImg, FW, FH); drawScrim(ctx, FW, FH, 1.1); }
        else if (state.style === "dark") paintDarkBase(ctx, FW, FH);
        else if (state.style === "light") paintLightBase(ctx, FW, FH);
        else paintBiblePage(ctx, FW, FH);
        drawCarouselEnd(ctx, FW, FH, serie);
      }
      const blob = await new Promise((resolve) => {
        el.canvas.toBlob((b) => resolve(b || new Blob([], { type: "image/png" })), "image/png", 1);
      });
      slides.push({ blob, url: URL.createObjectURL(blob) });
      await sleep(40);
    }

    finishWithSlides(slides, plusCaptionFor("carrossel", serie));
    setStatus("Carrossel pronto! Baixe os " + totalSlides + " slides na ordem. ✧", 1);
    showToast("Carrossel de " + totalSlides + " slides pronto. 🎠", "ok");
  }

  async function generateStory() {
    const story = PLUS_STORIES.find((s) => s.id === state.sticker) || PLUS_STORIES[0];
    const FW = 1080;
    const FH = 1920;
    stageAspect(FW, FH);
    el.canvas.width = FW;
    el.canvas.height = FH;
    const ctx = el.canvas.getContext("2d");

    setStatus("Buscando o fundo (" + (PLUS_SOURCES[state.source] || {}).label + ")…", 0.12);
    const frame = await generateFrame(PLUS_THEMES.find((t) => t.id === state.theme) || PLUS_THEMES[0], state.source);
    const img = await loadHtmlImage(frame.blob);
    setStatus("Montando o story…", 0.6);
    await ensureCanvasFonts();
    ctx.clearRect(0, 0, FW, FH);
    drawCover(ctx, img, FW, FH);
    drawStorySticker(ctx, FW, FH, story, null);

    const blob = await new Promise((resolve) => {
      el.canvas.toBlob((b) => resolve(b || new Blob([], { type: "image/png" })), "image/png", 1);
    });
    const content = { question: story.question, options: story.options };
    finishWithSlides([{ blob, url: URL.createObjectURL(blob) }], plusCaptionFor("story", content));
    setStatus("Story pronto! Poste e interaja com todos. ✧", 1);
    showToast("Story interativo pronto. ✧", "ok");
  }

  async function generateSemana() {
    const plan = buildWeekPlan();
    saveWeek(plan);
    const FW = 1080;
    const FH = 1350;
    stageAspect(FW, FH);
    el.canvas.width = FW;
    el.canvas.height = FH;
    const ctx = el.canvas.getContext("2d");

    setStatus("Planejando a sua semana…", 0.4);
    await ensureCanvasFonts();
    ctx.clearRect(0, 0, FW, FH);
    drawWeekCard(ctx, FW, FH, plan);

    const blob = await new Promise((resolve) => {
      el.canvas.toBlob((b) => resolve(b || new Blob([], { type: "image/png" })), "image/png", 1);
    });
    const text = weekPlanText(plan);
    finishWithSlides([{ blob, url: URL.createObjectURL(blob) }], plusCaptionFor("semana", { text }));
    setStatus("Planner pronto! Siga o mix dia a dia. ✧", 1);
    showToast("Mix semanal sorteado e planner gerado. ✧", "ok");
  }

  async function handleGenerate() {
    if (state.busy) return;
    state.busy = true;
    el.btnGenerate.disabled = true;
    el.btnDownload.disabled = true;
    el.placeholder.hidden = true;
    el.image.hidden = true;
    el.canvas.hidden = false;

    try {
      if (state.fmt === "versiculo") await generateVersiculo();
      else if (state.fmt === "amem") await generateEngagement("amem");
      else if (state.fmt === "marque") await generateEngagement("marque");
      else if (state.fmt === "mensagem") await generateEngagement("mensagem");
      else if (state.fmt === "quiz") await generateQuiz();
      else if (state.fmt === "carrossel") await generateCarrossel();
      else if (state.fmt === "story") await generateStory();
      else if (state.fmt === "semana") await generateSemana();
    } catch (e) {
      failGeneration(e);
    } finally {
      state.busy = false;
      el.btnGenerate.disabled = false;
      setTimeout(resetStatus, 6000);
    }
  }

  /* ---------- me surpreenda 🎲 ---------- */
  function surprise(fromHero) {
    if (state.busy) return;
    state.fmt = randomItem(PLUS_FORMATS.map((f) => f.id));
    if (state.fmt === "versiculo" || state.fmt === "carrossel") state.style = randomItem(Object.keys(PLUS_CARD_STYLES));
    if (["amem", "marque", "mensagem", "quiz", "story"].includes(state.fmt) || ((state.fmt === "versiculo" || state.fmt === "carrossel") && state.style === "photo")) {
      state.source = randomItem(Object.keys(PLUS_SOURCES));
      state.theme = randomItem(PLUS_THEMES).id;
    }
    if (state.fmt === "story") state.sticker = randomItem(PLUS_STORIES).id;
    if (state.fmt === "carrossel") {
      /* carrossel é post de feed: só resoluções de feed */
      state.size = randomItem(["square", "portrait"]);
    } else if (["versiculo", "amem", "marque", "mensagem"].includes(state.fmt)) {
      state.size = randomItem(Object.keys(PLUS_SIZES));
    }
    pickContent();
    renderChips();
    savePrefs();

    const parts = ["formato " + fmtById(state.fmt).label.replace(/^[^\s]+\s/, "")];
    if (state.fmt === "versiculo") parts.push("estilo " + (PLUS_CARD_STYLES[state.style] || {}).label.replace(/^[^\s]+\s/, ""));
    showToast("🎲 Surpresa: " + parts.join(" · ") + "!", "ok");

    handleGenerate();
    void fromHero;
  }

  /* =========================================================
     PREFERÊNCIAS
     ========================================================= */
  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({
        fmt: state.fmt, style: state.style, theme: state.theme,
        source: state.source, sticker: state.sticker, size: state.size,
      }));
    } catch (e) {}
  }

  function loadPrefs() {
    try {
      const j = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
      if (!j) return;
      if (PLUS_FORMATS.some((f) => f.id === j.fmt)) state.fmt = j.fmt;
      if (PLUS_CARD_STYLES[j.style]) state.style = j.style;
      if (PLUS_THEMES.some((t) => t.id === j.theme)) state.theme = j.theme;
      if (PLUS_SOURCES[j.source]) state.source = j.source;
      if (PLUS_STORIES.some((s) => s.id === j.sticker)) state.sticker = j.sticker;
      if (PLUS_SIZES[j.size]) state.size = j.size;
    } catch (e) {}
  }

  /* =========================================================
     FAIXA DE FORMATOS (hero)
     ========================================================= */
  function renderFormatStrip() {
    const strip = $("#format-strip");
    if (!strip) return;
    strip.innerHTML = "";
    PLUS_FORMATS.forEach((f) => {
      const card = document.createElement("div");
      card.className = "format-card";
      const icon = document.createElement("span");
      icon.className = "f-ico";
      icon.textContent = f.label.split(" ")[0];
      const title = document.createElement("h4");
      title.textContent = f.label.replace(/^[^\s]+\s/, "");
      const desc = document.createElement("p");
      desc.textContent = f.desc;
      const tag = document.createElement("span");
      tag.className = "f-tag";
      tag.textContent = f.multi ? "carrossel/multi" : "imagem única";
      card.appendChild(icon);
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(tag);
      card.addEventListener("click", () => {
        state.fmt = f.id;
        pickContent();
        renderChips();
        savePrefs();
        $("#estudio").scrollIntoView({ behavior: "smooth" });
      });
      strip.appendChild(card);
    });
  }

  /* =========================================================
     INIT
     ========================================================= */
  function cacheEls() {
    el.fmtChips = $("#fmt-chips");
    el.fmtHint = $("#fmt-hint");
    el.styleOptions = $("#style-options");
    el.styleChips = $("#style-chips");
    el.styleHint = $("#style-hint");
    el.themeOptions = $("#theme-options");
    el.themeChips = $("#theme-chips");
    el.sourceOptions = $("#source-options");
    el.sourceChips = $("#source-chips");
    el.storyOptions = $("#story-options");
    el.stickerChips = $("#sticker-chips");
    el.stickerHint = $("#sticker-hint");
    el.sizeOptions = $("#size-options");
    el.sizeChips = $("#size-chips");
    el.scriptBox = $("#script-box");
    el.scriptText = $("#script-text");
    el.scriptRef = $("#script-ref");
    el.refRow = $("#ref-row");
    el.scriptMeta = $("#script-meta");
    el.btnNewContent = $("#btn-new-content");
    el.engineNote = $("#engine-note");
    el.btnGenerate = $("#btn-generate");
    el.btnSurprise = $("#btn-surprise");
    el.btnSurpriseHero = $("#btn-surprise-hero");
    el.stage = $("#plus-stage");
    el.placeholder = $("#stage-placeholder");
    el.image = $("#plus-image");
    el.canvas = $("#plus-canvas");
    el.progressRow = $("#progress-row");
    el.progressFill = $("#progress-fill");
    el.progressStatus = $("#progress-status");
    el.strip = $("#plus-strip");
    el.btnDownload = $("#btn-download");
    el.btnCopyCaption = $("#btn-copy-caption");
    el.btnCopyCaption2 = $("#btn-copy-caption-2");
    el.captionCard = $("#caption-card");
    el.captionText = $("#caption-text");
    el.downloadNote = $("#download-note");
    el.btnWeekShuffle = $("#btn-week-shuffle");
    el.btnWeekCard = $("#btn-week-card");
    el.btnWeekCopy = $("#btn-week-copy");
  }

  function initScrollReveal() {
    const reveals = document.querySelectorAll(
      ".tip, .pipe, .badge, .format-card, .week-day, .hero h1, .hero .sub, .hero-actions, .hero-badges, .section-head"
    );
    reveals.forEach((n, i) => {
      n.classList.add("reveal-up");
      n.classList.add("delay-" + ((i % 4) + 1));
    });
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal-up").forEach((n) => obs.observe(n));
    document.querySelectorAll(".hero .reveal-up").forEach((n) => n.classList.add("visible"));
  }

  async function copyWeekText() {
    const plan = state.weekPlan || loadWeek();
    try {
      await navigator.clipboard.writeText(weekPlanText(plan));
      showToast("Plano da semana copiado. ✧", "ok");
    } catch (e) {
      showToast("Não foi possível copiar automaticamente.", "warn");
    }
  }

  async function downloadWeekCard() {
    const plan = state.weekPlan || loadWeek();
    const FW = 1080;
    const FH = 1350;
    const off = document.createElement("canvas");
    off.width = FW;
    off.height = FH;
    const ctx = off.getContext("2d");
    await ensureCanvasFonts();
    drawWeekCard(ctx, FW, FH, plan);
    off.toBlob((b) => {
      if (b) {
        triggerDownload(b, "alvorada-plus-mix-semanal.png");
        showToast("Planner da semana salvo. ✧", "ok");
      }
    }, "image/png", 1);
  }

  function init() {
    cacheEls();
    loadPrefs();
    pickContent();
    renderChips();
    renderFormatStrip();
    renderWeekBoard(loadWeek());
    state.weekPlan = state.weekPlan || null;

    el.scriptText.addEventListener("input", () => {
      if (state.content) state.content.x = el.scriptText.value;
      updateScriptMeta();
    });
    if (el.scriptRef) el.scriptRef.addEventListener("input", () => {
      if (state.content) state.content.ref = el.scriptRef.value.trim();
    });
    el.btnGenerate.addEventListener("click", handleGenerate);
    el.btnSurprise.addEventListener("click", () => surprise(false));
    if (el.btnSurpriseHero) el.btnSurpriseHero.addEventListener("click", () => surprise(true));
    /* ↻ Outro: sorteia um novo texto e, se já houver arte na tela,
       regenera na hora usando a IA do site (Cloudflare → demais fontes) */
    if (el.btnNewContent) {
      el.btnNewContent.addEventListener("click", async () => {
        if (state.busy) return;
        pickContent();
        showToast("Novo texto sorteado — pode editar antes de gerar. ✧", "ok");
        if (state.slides && state.slides.length && !el.scriptBox.hidden) {
          await handleGenerate();
        }
      });
    }
    el.btnDownload.addEventListener("click", downloadAll);
    el.btnCopyCaption.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(state.caption || el.captionText.value);
        showToast("Legenda copiada — cole na postagem. ✧", "ok");
      } catch (e) {
        el.captionText.select();
        document.execCommand("copy");
        showToast("Legenda copiada. ✧", "ok");
      }
    });
    el.btnCopyCaption2.addEventListener("click", () => el.btnCopyCaption.click());

    if (el.btnWeekShuffle) el.btnWeekShuffle.addEventListener("click", () => {
      const plan = buildWeekPlan();
      saveWeek(plan);
      showToast("Novo mix sorteado! Confira o quadro abaixo. 🎲", "ok");
    });
    if (el.btnWeekCopy) el.btnWeekCopy.addEventListener("click", copyWeekText);
    if (el.btnWeekCard) el.btnWeekCard.addEventListener("click", downloadWeekCard);

    initScrollReveal();

    /* botão shimmer tracking */
    let lastTrack = 0;
    document.addEventListener("mousemove", (e) => {
      const now = Date.now();
      if (now - lastTrack < 32) return;
      lastTrack = now;
      const btn = e.target.closest(".btn");
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty("--x", (((e.clientX - rect.left) / rect.width) * 100) + "%");
      btn.style.setProperty("--y", (((e.clientY - rect.top) / rect.height) * 100) + "%");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
