/* =========================================================
   Alvorada do Céu — Estúdio de Reels
   Motor: imagens Cloudflare (+ Pollinations fallback),
    animação Ken Burns, TTS PT-BR (Edge TTS),
    montagem em canvas e gravação em tempo real (MP4/WebM).
   ========================================================= */

(() => {
  "use strict";

  const W = 1080;
  const H = 1920;
  const PREFS_KEY = "alvorada_reels_prefs_v1";

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
    mode: "video",
    type: "oracao-manha",
    theme: "natureza",
    style: "cinematic",
    format: "story",
    source: "cloudflare",
    duration: 30,
    engine: "kenburns",
    transition: "crossfade",
    imageCount: 3,
    kind: "quiz",
    slideCount: 7,
    content: null,
    busy: false,
    lastBlob: null,
    lastMime: "",
    caption: "",
    clips: [],
    images: [],
    segs: [],
    total: 0,
    slides: [],
  };

  const TRANSITIONS = {
    crossfade: { label: "Suave", desc: "Dissolução cruzada — cada imagem desaparece enquanto a próxima surge" },
    fadeblack: { label: "Fade preto", desc: "Escurece até preto, depois revela a próxima imagem" },
    slideleft: { label: "Deslizar", desc: "A imagem desliza para a esquerda enquanto a nova entra pela direita" },
    zoomblur: { label: "Zoom", desc: "A imagem atual amplia e desfoca, a nova surge do centro" },
  };

  const MODES = {
    image: { label: "Imagem + Frase", desc: "Gere uma imagem com frase para postar" },
    carousel: { label: "Carrossel", desc: "Vários slides prontos para o feed" },
    video: { label: "Vídeo Reels", desc: "Gere um vídeo animado com Ken Burns" },
  };

  /* modelos de carrossel — os que mais engajam no nicho de fé */
  const CAROUSEL_KINDS = {
    quiz: {
      label: "🎲 Escolha um número",
      desc: "Capa pede para escolher um número; cada slide revela uma mensagem. Gera uma enxurrada de comentários.",
      hint: "O rei do engajamento: a pessoa comenta o número e você responde com uma bênção. Responda todos os comentários!",
    },
    frases: {
      label: "💬 Frases do dia",
      desc: "Capa com gancho + frases do acervo + CTA. O carrossel clássico do nicho.",
      hint: "O formato mais usado no nicho: capa forte, frases curtas e pedido de salvamento no final.",
    },
    versiculos: {
      label: "📖 Versículos",
      desc: "Sequência de versículos com referência bíblica para salvar e compartilhar.",
      hint: "Versículos com referência geram muitos salvamentos — o sinal que o Instagram mais valoriza.",
    },
    lista: {
      label: "🔢 Lista numerada",
      desc: "\"7 promessas\", \"motivos para agradecer\"… listas que as pessoas salvam e compartilham.",
      hint: "Listas prometem um conteúdo completo: quase ninguém desiste no meio, e isso dispara o alcance.",
    },
    passos: {
      label: "🙏 Oração em passos",
      desc: "Uma oração dividida em passos para rezar junto, deslizando cada slide.",
      hint: "Convida a pessoa a orar ali mesmo, slide por slide — engajamento emocional altíssimo.",
    },
  };

  const IMAGE_SOURCES = {
    cloudflare: { label: "Cloudflare IA", desc: "Arte exclusiva gerada por IA (FLUX)" },
    pollinations: { label: "Pollinations IA", desc: "Arte exclusiva gerada por IA gratuita" },
    pexels: { label: "Pexels", desc: "Fotos reais profissionais gratuitas" },
    pixabay: { label: "Pixabay", desc: "Fotos reais gratuitas" },
  };

  const STOCK_QUERIES = {
    natureza: "forest morning mist sunbeams",
    ceu: "golden sky clouds sunrise rays",
    vela: "candle flame warm dark bokeh",
    mar: "calm ocean waves golden hour",
    montanhas: "mountain peaks sunrise clouds valley",
    estrelas: "starry night sky milky way",
    amanhecer: "dawn pastel hills mist morning",
    floresta: "enchanted forest light rays ferns",
    pomba: "white dove flying sky",
    maos: "praying hands warm light",
    chamas: "fire flames dark embers glow",
    rio: "river flowing forest sunlight",
    arvore: "ancient tree golden light branches",
    rosas: "white golden roses dew light",
    portao: "gate heavenly light path",
  };

  const REELS_FORMATS = {
    square: { label: "Post 1:1", w: 1080, h: 1080, desc: "Feed do Instagram" },
    story: { label: "Story 9:16", w: 1080, h: 1920, desc: "Stories / Reels" },
    portrait: { label: "Retrato 4:5", w: 1080, h: 1350, desc: "Feed vertical" },
  };

  const el = {
    modeChips: $("#mode-chips"),
    typeChips: $("#type-chips"),
    themeChips: $("#theme-chips"),
    styleChips: $("#style-chips"),
    formatChips: $("#format-chips"),
    durationChips: $("#duration-chips"),
    imageCountChips: $("#image-count-chips"),
    scriptText: $("#script-text"),
    scriptMeta: $("#script-meta"),
    btnNewContent: $("#btn-new-content"),
    btnAiContent: $("#btn-ai-content"),
    btnGenerate: $("#btn-generate"),
    videoStage: $("#video-stage"),
    placeholder: $("#stage-placeholder"),
    video: $("#reels-video"),
    image: $("#reels-image"),
    canvas: $("#reels-canvas"),
    progressRow: $("#progress-row"),
    progressFill: $("#progress-fill"),
    progressStatus: $("#progress-status"),
    btnDownload: $("#btn-download"),
    btnCopyCaption: $("#btn-copy-caption"),
    btnCopyCaption2: $("#btn-copy-caption-2"),
    captionCard: $("#caption-card"),
    captionText: $("#caption-text"),
    engineNote: $("#engine-note"),
    playbackBar: $("#playback-bar"),
    btnPlay: $("#btn-play"),
    btnPause: $("#btn-pause"),
    btnStop: $("#btn-stop"),
    pbTime: $("#pb-time"),
    pbTrack: $("#pb-track"),
    pbProgress: $("#pb-progress"),
    videoOptions: $("#video-options"),
    imageOptions: $("#image-options"),
    carouselInfo: $("#carousel-info"),
    formatOptions: $("#format-options"),
    sourceOptions: $("#source-options"),
    sourceChips: $("#source-chips"),
    carouselOptions: $("#carousel-options"),
    scriptBox: $("#script-box"),
    kindChips: $("#kind-chips"),
    kindHint: $("#kind-hint"),
    slideCountChips: $("#slide-count-chips"),
    carouselStrip: $("#carousel-strip"),
    btnSurprise: $("#btn-surprise"),
    downloadNote: $("#download-note"),
  };

  /* ---------- áudio ---------- */
  async function ensureAudio() { return null; }

  /* ---------- melodia ambiente ---------- */
  /* ---------- render de chips ---------- */
  function makeChip(label, extra) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.innerHTML = label;
    if (extra) {
      for (const k in extra) if (extra[k] != null) b.dataset[k] = String(extra[k]);
    }
    return b;
  }

  function renderChips() {
    el.modeChips.innerHTML = "";
    Object.entries(MODES).forEach(([k, m]) => {
      const b = makeChip(m.label, { mode: k });
      if (k === state.mode) b.classList.add("active");
      b.addEventListener("click", () => { state.mode = k; renderChips(); savePrefs(); });
      el.modeChips.appendChild(b);
    });

    const isImage = state.mode === "image";
    const isCarousel = state.mode === "carousel";
    if (el.videoOptions) el.videoOptions.hidden = isImage || isCarousel;
    if (el.imageOptions) el.imageOptions.hidden = !isImage;
    if (el.carouselInfo) el.carouselInfo.hidden = !isCarousel;
    if (el.formatOptions) el.formatOptions.hidden = !(isImage || isCarousel);
    if (el.sourceOptions) el.sourceOptions.hidden = !(isImage || isCarousel);
    if (el.carouselOptions) el.carouselOptions.hidden = !isCarousel;
    if (el.scriptBox) el.scriptBox.hidden = isCarousel;

    /* update stage aspect ratio */
    const fmt = REELS_FORMATS[state.format] || REELS_FORMATS.story;
    if (el.videoStage) {
      el.videoStage.style.aspectRatio = ((isImage || isCarousel) ? (fmt.w + "/" + fmt.h) : "9/16");
    }

    el.typeChips.innerHTML = "";
    REELS_TYPES.forEach((t) => {
      const b = makeChip(t.emoji + " " + t.label, { type: t.id });
      if (t.id === state.type) b.classList.add("active");
      b.addEventListener("click", () => { state.type = t.id; try { pickContent(); } catch (e) { console.error("pickContent:", e); } renderChips(); savePrefs(); });
      el.typeChips.appendChild(b);
    });

    el.themeChips.innerHTML = "";
    REELS_THEMES.forEach((t) => {
      const b = makeChip(t.emoji + " " + t.label, { theme: t.id });
      if (t.id === state.theme) b.classList.add("active");
      b.addEventListener("click", () => { state.theme = t.id; renderChips(); savePrefs(); });
      el.themeChips.appendChild(b);
    });

    el.styleChips.innerHTML = "";
    Object.entries(REELS_STYLES).forEach(([k, s]) => {
      const b = makeChip(s.label, { style: k });
      if (k === state.style) b.classList.add("active");
      b.addEventListener("click", () => { state.style = k; renderChips(); savePrefs(); });
      el.styleChips.appendChild(b);
    });

    if (el.formatChips) {
      el.formatChips.innerHTML = "";
      Object.entries(REELS_FORMATS).forEach(([k, f]) => {
        const b = makeChip(f.label, { format: k });
        if (k === state.format) b.classList.add("active");
        b.addEventListener("click", () => { state.format = k; renderChips(); savePrefs(); });
        el.formatChips.appendChild(b);
      });
    }

    if (el.sourceChips) {
      el.sourceChips.innerHTML = "";
      Object.entries(IMAGE_SOURCES).forEach(([k, s]) => {
        const b = makeChip(s.label, { source: k });
        if (k === state.source) b.classList.add("active");
        b.title = s.desc;
        b.addEventListener("click", () => { state.source = k; renderChips(); savePrefs(); });
        el.sourceChips.appendChild(b);
      });
    }

    if (el.kindChips) {
      el.kindChips.innerHTML = "";
      Object.entries(CAROUSEL_KINDS).forEach(([k, c]) => {
        const b = makeChip(c.label, { kind: k });
        if (k === state.kind) b.classList.add("active");
        b.title = c.desc;
        b.addEventListener("click", () => { state.kind = k; renderChips(); savePrefs(); });
        el.kindChips.appendChild(b);
      });
    }
    if (el.kindHint) {
      const kd = CAROUSEL_KINDS[state.kind] || CAROUSEL_KINDS.quiz;
      el.kindHint.textContent = "✦ " + kd.desc + " " + kd.hint;
    }

    if (el.slideCountChips) {
      el.slideCountChips.innerHTML = "";
      [5, 7, 10].forEach((n) => {
        const b = makeChip(n + " slides", { slidecount: n });
        if (n === state.slideCount) b.classList.add("active");
        b.addEventListener("click", () => { state.slideCount = n; renderChips(); savePrefs(); });
        el.slideCountChips.appendChild(b);
      });
    }

    el.durationChips.innerHTML = "";
    [30, 45, 60].forEach((d) => {
      const b = makeChip(d + "s", { duration: d });
      if (d === state.duration) b.classList.add("active");
      b.addEventListener("click", () => { state.duration = d; renderChips(); savePrefs(); });
      el.durationChips.appendChild(b);
    });

    el.imageCountChips.innerHTML = "";
    [1, 2, 3, 4, 5].forEach((n) => {
      const label = n === 1 ? "1 imagem" : n + " imagens";
      const b2 = makeChip(label, { imagecount: n });
      if (n === state.imageCount) b2.classList.add("active");
      b2.addEventListener("click", () => { state.imageCount = n; renderChips(); savePrefs(); });
      el.imageCountChips.appendChild(b2);
    });

    if (!el.transitionChips) {
      el.transitionChips = $("#transition-chips");
    }
    if (el.transitionChips) {
      el.transitionChips.innerHTML = "";
      Object.entries(TRANSITIONS).forEach(([k, t]) => {
        const chip = makeChip(t.label, { transition: k });
        if (k === state.transition) chip.classList.add("active");
        chip.addEventListener("click", () => { state.transition = k; renderChips(); savePrefs(); });
        el.transitionChips.appendChild(chip);
      });
    }

    const style = REELS_STYLES[state.style] || REELS_STYLES.cinematic;
    if (isImage) {
      const src = IMAGE_SOURCES[state.source] || IMAGE_SOURCES.cloudflare;
      el.engineNote.textContent = "✦ " + src.label + " · " + style.label + " · " + fmt.label + " (" + fmt.w + "×" + fmt.h + ") — " + fmt.desc;
      el.btnGenerate.textContent = "✧ Gerar imagem com frase";
    } else if (isCarousel) {
      const kd = CAROUSEL_KINDS[state.kind] || CAROUSEL_KINDS.quiz;
      const src = IMAGE_SOURCES[state.source] || IMAGE_SOURCES.cloudflare;
      el.engineNote.textContent = "✦ Carrossel \"" + kd.label.replace(/^[^\s]+\s/, "") + "\" · " + state.slideCount + " slides · " + src.label + " · " + fmt.label + " (" + fmt.w + "×" + fmt.h + ")";
      el.btnGenerate.textContent = "✧ Gerar carrossel (" + state.slideCount + " slides)";
    } else {
      const tr = TRANSITIONS[state.transition] || TRANSITIONS.crossfade;
      el.engineNote.textContent = "✦ Ken Burns · Formato Instagram 9:16 (1080×1920) · Transição: " + tr.label + " — " + tr.desc + ". · " + state.imageCount + " imagem" + (state.imageCount > 1 ? "s" : "") + ".";
      el.btnGenerate.textContent = "✧ Gerar meu reels";
    }

    if (el.downloadNote) {
      if (isImage) el.downloadNote.textContent = "Baixe o PNG e poste direto no feed ou story.";
      else if (isCarousel) el.downloadNote.textContent = "Poste os slides na ordem baixada: capa primeiro, CTA por último. A legenda já vem pronta.";
      else el.downloadNote.textContent = "Instagram prefere MP4. Se o navegador gerar WebM, converta no CapCut grátis antes de postar.";
    }
  }

  /* ---------- conteúdo ---------- */
  function typeById(id) { return REELS_TYPES.find((t) => t.id === id) || REELS_TYPES[0]; }
  function themeById(id) { return REELS_THEMES.find((t) => t.id === id) || REELS_THEMES[0]; }

  function pickContent() {
    const c = reelsContentForType(state.type);
    state.content = { ...c };
    el.scriptText.value = c.x + (c.refSpoken ? " " + c.refSpoken : "");
    updateScriptMeta();
  }

  function updateScriptMeta() {
    const words = el.scriptText.value.trim().split(/\s+/).filter(Boolean).length;
    const est = Math.round(words / 2.7);
    el.scriptMeta.textContent =
      words + " palavras · narração de aproximadamente " + est + "s · pode editar à vontade";
  }

  function contentFromText() {
    const type = typeById(state.type);
    const raw = el.scriptText.value.trim();
    if (!raw) return null;
    const first = raw.split(/[.!?]/)[0].trim().slice(0, 48);
    return {
      t: first || type.hook,
      e: type.emoji,
      x: raw,
      h: type.hook,
    };
  }

  /* ---------- texto com IA ---------- */
  async function aiContent() {
    const type = typeById(state.type);
    const theme = themeById(state.theme);
    const btn = el.btnAiContent;
    const prev = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Pensando…";
    setStatus("Criando a mensagem com IA…", 0);
    try {
      const res = await fetch("/api/ai-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: state.type, theme: theme.label, duration: state.duration }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "IA indisponível");
      }
      const j = await res.json();
      if (!j.text) throw new Error("A IA não retornou texto.");
      state.content = { t: type.hook, e: type.emoji, x: j.text, h: type.hook };
      el.scriptText.value = j.text;
      updateScriptMeta();
      showToast("Mensagem criada com IA. Edite se quiser. ✧", "ok");
    } catch (e) {
      console.error(e);
      showToast("IA ocupada — use o acervo por enquanto.", "warn");
    } finally {
      btn.disabled = false;
      btn.textContent = prev;
      resetStatus();
    }
  }

  /* ---------- split do texto em trechos ---------- */
  function splitScript(text, maxSegs) {
    const raw = String(text).replace(/\s+/g, " ").trim();
    if (!raw) return [];
    const parts = raw.split(/(?<=[.;:!?])\s+/).map((s) => s.trim()).filter(Boolean);
    const merged = [];
    for (const p of parts) {
      if (merged.length && merged[merged.length - 1].length + p.length < 42) {
        merged[merged.length - 1] += " " + p;
      } else {
        merged.push(p);
      }
    }
    const out = [];
    for (const m of merged) {
      if (m.length <= 150) {
        out.push(m);
      } else {
        const bits = m.split(/(?<=[,])\s+/);
        let cur = "";
        for (const b of bits) {
          const t = (cur + " " + b).trim();
          if (t.length <= 140) cur = t;
          else { out.push(cur); cur = b; }
        }
        if (cur) out.push(cur);
      }
    }
    return out.slice(0, maxSegs);
  }

  /* ---------- linha do tempo ---------- */
  async function buildTimeline(chunks, target) {
    const segs = chunks.map((text) => ({ text, dur: 0, start: 0, buffer: null, imageIdx: 0 }));
    for (const seg of segs) {
      seg.dur = Math.max(2, seg.text.split(/\s+/).length / 2.8);
    }
    const n = segs.length;
    const pause = 0.05;
    let t = 0;
    for (const s of segs) {
      s.start = t;
      s.dur = s.dur + pause;
      t += s.dur;
    }
    if (t > target && n > 1) {
      segs[n - 1].dur -= t - target;
      if (segs[n - 1].dur < 1.2) segs[n - 1].dur = 1.2;
    }
    const total = segs.reduce((a, s) => a + s.dur, 0);
    return { segs, total };
  }

  /* ---------- imagens de fundo ---------- */
  async function cfImage(prompt) {
    const res = await fetch("/api/cf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, steps: 8, seed: randomInt(0, 999999) }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "Cloudflare respondeu " + res.status);
    }
    const blob = await res.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  async function pollImage(prompt) {
    const url =
      "/api/image?prompt=" + encodeURIComponent(prompt) +
      "&width=1024&height=1024&seed=" + randomInt(0, 999999) + "&nologo=true&model=flux&enhance=true";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Pollinations respondeu " + res.status);
    const blob = await res.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  /* ---------- fotos reais: Pexels / Pixabay (via proxy do servidor) ---------- */
  function stockQueryFor(themeId) {
    return STOCK_QUERIES[themeId] || "spiritual nature golden light";
  }

  async function stockPhoto(provider, theme) {
    const isPexels = provider === "pexels";
    const searchUrl =
      (isPexels ? "/api/pexels/photos" : "/api/pixabay/photos") +
      "?q=" + encodeURIComponent(stockQueryFor(theme.id)) +
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

    /* prefere fotos verticais (melhor encaixe no 9:16) */
    const portrait = photos.filter((p) => p.height >= p.width * 1.1);
    const pick = randomItem(portrait.length >= 3 ? portrait : photos);

    const r2 = await fetch(proxyPath + "?url=" + encodeURIComponent(pick.image));
    if (!r2.ok) throw new Error("Proxy de imagem respondeu " + r2.status);
    const blob = await r2.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  const FALLBACK_GRADIENTS = {
    natureza: ["#1a3a1a", "#2d5a27", "#4a7c3f"],
    ceu: ["#1a1040", "#c8860a", "#f5d78e"],
    vela: ["#1a0f00", "#8b4513", "#daa520"],
    mar: ["#0a1628", "#1a4a6e", "#4a9ead"],
    montanhas: ["#1a1a2e", "#4a3a6e", "#c8a0e0"],
    estrelas: ["#050510", "#0a0a3a", "#2a2a6e"],
    amanhecer: ["#1a0a2e", "#c85a20", "#f5c842"],
    floresta: ["#0a1a0a", "#1a4a1a", "#4a8a3a"],
    pomba: ["#f5f0e0", "#e8d8b0", "#c8b888"],
    maos: ["#1a1000", "#8b6914", "#daa520"],
    chamas: ["#1a0500", "#8b2500", "#da5200"],
    rio: ["#0a1a0a", "#1a5a4a", "#4a9a7a"],
    arvore: ["#1a1a0a", "#4a6a20", "#8aaa40"],
    rosas: ["#1a0a1a", "#8a2040", "#da6080"],
    portao: ["#1a1000", "#8b6914", "#ffd700"],
  };

  function generateFallbackImage(themeId) {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const colors = FALLBACK_GRADIENTS[themeId] || FALLBACK_GRADIENTS.ceu;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, colors[0]);
    g.addColorStop(0.5, colors[1]);
    g.addColorStop(1, colors[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 3 + 1;
      const a = Math.random() * 0.3 + 0.05;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,240," + a + ")";
      ctx.fill();
    }
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve({ blob: blob || new Blob([""], { type: "image/png" }), src: "fallback" });
      }, "image/jpeg", 0.92);
    });
  }

  async function generateFrame(theme, style, sourceId) {
    const prompt = reelsBuildImagePrompt(theme, style);
    const chosen = IMAGE_SOURCES[sourceId] ? sourceId : "cloudflare";
    const others = Object.keys(IMAGE_SOURCES).filter((k) => k !== chosen);
    const order = [chosen].concat(others);

    for (const src of order) {
      try {
        if (src === "cloudflare") return { blob: await cfImage(prompt), src: "cloudflare" };
        if (src === "pollinations") return { blob: await pollImage(prompt), src: "pollinations" };
        if (src === "pexels") return { blob: await stockPhoto("pexels", theme), src: "pexels" };
        if (src === "pixabay") return { blob: await stockPhoto("pixabay", theme), src: "pixabay" };
      } catch (e) {
        console.warn("Fonte de imagem \"" + src + "\" falhou, tentando a próxima:", e);
      }
    }
    console.warn("Todas as fontes falharam — usando gradiente de fallback.");
    return generateFallbackImage(theme.id);
  }

  function loadHtmlImage(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível carregar o cenário."));
      img.src = URL.createObjectURL(blob);
    });
  }

  /* ---------- renderer ---------- */
  function setupRenderer(segs, images, content) {
    const ctx = el.canvas.getContext("2d");
    const total = segs.reduce((a, s) => a + s.dur, 0);
    const transitionType = state.transition || "crossfade";
    const FADE_DURATION = 0.6;

    /* varied Ken Burns directions per segment */
    const KB_DIRS = [
      { zoomStart: 1.0, zoomEnd: 1.15, dx: 0.02, dy: 0.01 },
      { zoomStart: 1.15, zoomEnd: 1.0, dx: -0.015, dy: 0.008 },
      { zoomStart: 1.02, zoomEnd: 1.12, dx: -0.02, dy: -0.01 },
      { zoomStart: 1.1, zoomEnd: 1.0, dx: 0.01, dy: -0.012 },
      { zoomStart: 1.0, zoomEnd: 1.18, dx: 0.015, dy: -0.008 },
      { zoomStart: 1.12, zoomEnd: 1.02, dx: -0.01, dy: 0.015 },
    ];

    /* text layout cache */
    const textCache = new Map();
    function cacheTextLayout(text) {
      if (textCache.has(text)) return textCache.get(text);
      let size = Math.min(W * 0.068, 84);
      let lines = [];
      const maxW = W * 0.82;
      while (size > 38) {
        ctx.font = "600 " + size + "px 'Cormorant Garamond', Georgia, serif";
        const words = String(text).split(" ");
        lines = [];
        let line = "";
        for (const w of words) {
          const t = line ? line + " " + w : w;
          if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
          else line = t;
        }
        if (line) lines.push(line);
        if (lines.length <= 4) break;
        size -= 3;
      }
      const lineH = size * 1.28;
      const blockH = lines.length * lineH;
      const topY = H * 0.64 - blockH / 2;
      const cached = { lines, size, lineH, topY, blockH };
      textCache.set(text, cached);
      return cached;
    }
    for (const seg of segs) cacheTextLayout(seg.text);

    function findSeg(t) {
      for (let i = segs.length - 1; i >= 0; i--) {
        if (t >= segs[i].start) return { seg: segs[i], idx: i };
      }
      return { seg: segs[0], idx: 0 };
    }

    /* --- Ken Burns with varied direction --- */
    function drawKenBurnsVariant(img, p, segIdx) {
      if (!img || !img.width || !img.height) { ctx.fillStyle = "#05040c"; ctx.fillRect(0, 0, W, H); return; }
      const dir = KB_DIRS[segIdx % KB_DIRS.length];
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

    /* --- blend function for transitions --- */
    function blendImages(outImg, outP, outIdx, inImg, inP, inIdx, blend) {
      if (transitionType === "fadeblack") {
        const mid = blend < 0.5 ? blend * 2 : 2 - blend * 2;
        if (blend < 0.5) {
          drawKenBurnsVariant(outImg, outP, outIdx);
          ctx.fillStyle = "rgba(5,4,12," + mid + ")";
          ctx.fillRect(0, 0, W, H);
        } else {
          ctx.fillStyle = "rgba(5,4,12," + mid + ")";
          ctx.fillRect(0, 0, W, H);
          drawKenBurnsVariant(inImg, inP, inIdx);
        }
      } else if (transitionType === "slideleft") {
        const offset = blend * W;
        ctx.save();
        ctx.translate(-offset, 0);
        drawKenBurnsVariant(outImg, outP, outIdx);
        ctx.restore();
        ctx.save();
        ctx.translate(W - offset, 0);
        drawKenBurnsVariant(inImg, inP, inIdx);
        ctx.restore();
      } else if (transitionType === "zoomblur") {
        const mid = blend < 0.5 ? blend * 2 : 2 - blend * 2;
        if (blend < 0.5) {
          const z = 1 + blend * 1.5;
          ctx.save();
          ctx.translate(W / 2, H / 2);
          ctx.scale(z, z);
          ctx.translate(-W / 2, -H / 2);
          ctx.globalAlpha = 1 - blend;
          drawKenBurnsVariant(outImg, outP, outIdx);
          ctx.restore();
          ctx.fillStyle = "rgba(5,4,12," + blend * 0.8 + ")";
          ctx.fillRect(0, 0, W, H);
        } else {
          const z = 1 + (1 - blend) * 0.5;
          ctx.fillStyle = "rgba(5,4,12," + (1 - blend) * 0.8 + ")";
          ctx.fillRect(0, 0, W, H);
          ctx.save();
          ctx.globalAlpha = blend;
          ctx.translate(W / 2, H / 2);
          ctx.scale(z, z);
          ctx.translate(-W / 2, -H / 2);
          drawKenBurnsVariant(inImg, inP, inIdx);
          ctx.restore();
        }
      } else {
        /* crossfade — default */
        ctx.globalAlpha = 1 - blend;
        drawKenBurnsVariant(outImg, outP, outIdx);
        ctx.globalAlpha = blend;
        drawKenBurnsVariant(inImg, inP, inIdx);
        ctx.globalAlpha = 1;
      }
    }

    function drawScrim() {
      const g = ctx.createLinearGradient(0, H * 0.38, 0, H);
      g.addColorStop(0, "rgba(8,8,16,0)");
      g.addColorStop(0.5, "rgba(8,8,16,0.42)");
      g.addColorStop(1, "rgba(8,8,16,0.86)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const t = ctx.createLinearGradient(0, 0, 0, H * 0.3);
      t.addColorStop(0, "rgba(8,8,16,0.5)");
      t.addColorStop(1, "rgba(8,8,16,0)");
      ctx.fillStyle = t;
      ctx.fillRect(0, 0, W, H);
    }

    function drawChunkText(text, p, segDur) {
      const cached = cacheTextLayout(text);
      const { lines, size, lineH, topY } = cached;

      let alpha = 1;
      const fadeIn = 0.3 / segDur;
      const fadeOut = 0.32 / segDur;
      if (p < fadeIn) alpha = clamp(p / fadeIn, 0, 1);
      const endP = 1 - fadeOut;
      if (p > endP) alpha = clamp((1 - p) / fadeOut, 0, 1);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = size * 0.16;
      ctx.shadowOffsetY = size * 0.05;
      ctx.fillStyle = "#fffdf6";
      const cx = W / 2;
      let y = topY + lineH / 2;
      ctx.font = "600 " + size + "px 'Cormorant Garamond', Georgia, serif";
      for (const line of lines) {
        ctx.fillText(line, cx, y);
        y += lineH;
      }
      ctx.restore();
    }

    function drawTitleChip(content, t) {
      if (t > 4) return;
      const alpha = clamp((4 - t) / 1, 0, 1) * clamp(t / 0.4, 0, 1);
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      const label = (content.e || "🙏") + " " + (content.t || "");
      ctx.font = "600 40px 'Cormorant Garamond', Georgia, serif";
      const tw = ctx.measureText(label).width;
      const padX = 34;
      const bw = tw + padX * 2;
      const bx = (W - bw) / 2;
      const by = H * 0.14 - 30;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, bw, 60, 30);
      else ctx.rect(bx, by, bw, 60);
      ctx.fillStyle = "rgba(6,5,14,0.55)";
      ctx.fill();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,253,246,0.96)";
      ctx.fillText(label, W / 2, by + 30);
      ctx.restore();
    }

    function drawWatermark() {
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

    function draw(t) {
      const { seg, idx } = findSeg(t);
      const p = seg ? clamp((t - seg.start) / seg.dur, 0, 1) : 0;
      const imageIdx = seg.imageIdx;
      const img = images[imageIdx];
      const hasSize = img && img.width;

      ctx.clearRect(0, 0, W, H);

      const nextSeg = idx < segs.length - 1 ? segs[idx + 1] : null;
      const timeUntilEnd = seg ? (seg.start + seg.dur - t) : 0;
      const inTransition = nextSeg && timeUntilEnd < FADE_DURATION && timeUntilEnd > 0;

      if (inTransition) {
        const nextImg = images[nextSeg.imageIdx];
        const nextHasSize = nextImg && nextImg.width;
        const blend = 1 - (timeUntilEnd / FADE_DURATION);
        const nextP = clamp((t - nextSeg.start) / nextSeg.dur, 0, 1);
        if (hasSize && nextHasSize) {
          blendImages(img, p, imageIdx, nextImg, nextP, nextSeg.imageIdx, blend);
        } else if (hasSize) {
          drawKenBurnsVariant(img, p, imageIdx);
        } else {
          ctx.fillStyle = "#05040c";
          ctx.fillRect(0, 0, W, H);
        }
      } else {
        if (hasSize) {
          drawKenBurnsVariant(img, p, imageIdx);
        } else {
          ctx.fillStyle = "#05040c";
          ctx.fillRect(0, 0, W, H);
        }
      }

      drawScrim();
      if (seg) drawChunkText(seg.text, p, seg.dur);
      drawTitleChip(content, t);
      drawWatermark();
    }

    return { draw, total };
  }

  /* ---------- gravação ---------- */
  function pickMime() {
    /* 1080×1920@30 exige H.264 Level 4.0+ (3.1 só suporta até 720p —
       gravar acima disso gera stream fora de spec e o Instagram corta o vídeo) */
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

  function verifyVideoResolution(blob) {
    return new Promise((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => resolve({ w: v.videoWidth || 0, h: v.videoHeight || 0 });
      v.onerror = () => resolve({ w: 0, h: 0 });
      v.src = URL.createObjectURL(blob);
    });
  }

  async function capture(segs, total, drawFn) {
    if (!Number.isFinite(total) || total <= 0) {
      total = Math.max(5, segs.reduce((a, s) => a + (Number.isFinite(s.dur) ? s.dur : 3), 0));
    }
    const stream = el.canvas.captureStream(30);
    const mime = pickMime();
    if (!mime) throw new Error("Seu navegador não suporta gravação de vídeo.");

    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8000000 });
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (e) => reject(e.error || new Error("Erro na gravação"));
    });

    recorder.start(250);

    const SAFETY_TIMEOUT = (total + 5) * 1000;
    const finished = new Promise((resolve, reject) => {
      let last = performance.now();
      let elapsed = 0;
      let resolved = false;
      const safetyTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try { recorder.stop(); } catch (e) {}
          reject(new Error("Gravação excedeu o tempo limite de segurança."));
        }
      }, SAFETY_TIMEOUT);
      function frame(now) {
        if (resolved) return;
        const rawDt = (now - last) / 1000;
        last = now;
        const dt = Math.min(rawDt, 0.5);
        elapsed += dt;
        const t = Math.min(elapsed, total);
        try {
          drawFn(t);
        } catch (err) {
          console.error("Erro no frame de gravação:", err);
          resolved = true;
          clearTimeout(safetyTimer);
          try { recorder.stop(); } catch (e) {}
          reject(err);
          return;
        }
        const p = clamp(elapsed / total, 0, 1);
        el.progressFill.style.width = Math.round(p * 100) + "%";
        el.progressStatus.textContent = "Gravando… " + Math.round(p * 100) + "% (" + Math.round(t) + "s de " + Math.round(total) + "s)";
        if (elapsed >= total + 0.4) {
          resolved = true;
          clearTimeout(safetyTimer);
          setTimeout(() => { try { recorder.stop(); } catch (e) {} }, 150);
          resolve();
          return;
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });

    await finished;
    await stopped;

    const type = mime.includes("mp4") ? "video/mp4" : "video/webm";
    const blob = new Blob(chunks, { type });
    if (blob.size < 20000) throw new Error("Gravação falhou (arquivo muito pequeno).");
    return { blob, isMp4: type === "video/mp4" };
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

  /* ---------- geração de imagem+frase ---------- */
  async function handleGenerateImage() {
    if (state.busy) return;
    state.busy = true;
    el.btnGenerate.disabled = true;

    const type = typeById(state.type);
    const theme = themeById(state.theme);
    const style = REELS_STYLES[state.style] || REELS_STYLES.cinematic;
    const content = contentFromText();
    if (!content) {
      showToast("Escreva o texto primeiro. ✧", "warn");
      state.busy = false;
      el.btnGenerate.disabled = false;
      return;
    }

    const fmt = REELS_FORMATS[state.format] || REELS_FORMATS.story;
    const FW = fmt.w;
    const FH = fmt.h;

    try {
      el.placeholder.hidden = true;
      el.video.hidden = true;
      el.canvas.hidden = false;
      el.canvas.width = FW;
      el.canvas.height = FH;
      el.btnDownload.disabled = true;
      hidePlaybackBar();
      clearCarouselStrip();
      state.slides = [];

      setStatus("Buscando a imagem de fundo (" + (IMAGE_SOURCES[state.source] || IMAGE_SOURCES.cloudflare).label + ")…", 0.1);
      const frame = await generateFrame(theme, style, state.source);
      const img = await loadHtmlImage(frame.blob);
      const srcLabel = IMAGE_SOURCES[frame.src] ? IMAGE_SOURCES[frame.src].label : "estilo pictórico";
      if (frame.src !== state.source) {
        showToast("Fonte \"" + (IMAGE_SOURCES[state.source] || {}).label + "\" indisponível — usado " + srcLabel + ".", "warn");
      }

      setStatus("Desenhando a frase…", 0.6);
      await document.fonts.ready;

      const ctx = el.canvas.getContext("2d");
      ctx.clearRect(0, 0, FW, FH);

      /* draw image covering canvas (cover) */
      const ir = img.width / img.height;
      const cr = FW / FH;
      let sx, sy, sw, sh;
      if (ir > cr) { sh = img.height; sw = img.height * cr; sx = (img.width - sw) / 2; sy = 0; }
      else { sw = img.width; sh = img.width / cr; sx = 0; sy = (img.height - sh) / 2; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, FW, FH);

      /* scrim gradient */
      const g = ctx.createLinearGradient(0, FH * 0.35, 0, FH);
      g.addColorStop(0, "rgba(8,8,16,0)");
      g.addColorStop(0.5, "rgba(8,8,16,0.42)");
      g.addColorStop(1, "rgba(8,8,16,0.86)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, FW, FH);
      const t = ctx.createLinearGradient(0, 0, 0, FH * 0.25);
      t.addColorStop(0, "rgba(8,8,16,0.45)");
      t.addColorStop(1, "rgba(8,8,16,0)");
      ctx.fillStyle = t;
      ctx.fillRect(0, 0, FW, FH);

      /* title chip */
      const label = (content.e || "🙏") + " " + (content.t || "");
      ctx.font = "600 " + Math.round(FW * 0.037) + "px 'Cormorant Garamond', Georgia, serif";
      const ltw = ctx.measureText(label).width;
      const padX = Math.round(FW * 0.032);
      const lbw = ltw + padX * 2;
      const lbx = (FW - lbw) / 2;
      const lby = FH * 0.12;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(lbx, lby, lbw, FH * 0.055, FH * 0.027);
      else ctx.rect(lbx, lby, lbw, FH * 0.055);
      ctx.fillStyle = "rgba(6,5,14,0.55)";
      ctx.fill();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,253,246,0.96)";
      ctx.fillText(label, FW / 2, lby + FH * 0.0275);

      /* main text — word wrap */
      const fullText = content.x + (content.ref ? " " + content.ref : "");
      let fontSize = Math.min(FW * 0.068, 84);
      let lines = [];
      const maxW = FW * 0.82;
      while (fontSize > 32) {
        ctx.font = "600 " + fontSize + "px 'Cormorant Garamond', Georgia, serif";
        const words = String(fullText).split(" ");
        lines = [];
        let line = "";
        for (const w of words) {
          const test = line ? line + " " + w : w;
          if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
          else line = test;
        }
        if (line) lines.push(line);
        if (lines.length <= 5) break;
        fontSize -= 3;
      }
      const lineH = fontSize * 1.28;
      const blockH = lines.length * lineH;
      const topY = FH * 0.62 - blockH / 2;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = fontSize * 0.16;
      ctx.shadowOffsetY = fontSize * 0.05;
      ctx.fillStyle = "#fffdf6";
      ctx.font = "600 " + fontSize + "px 'Cormorant Garamond', Georgia, serif";
      let y = topY + lineH / 2;
      for (const line of lines) {
        ctx.fillText(line, FW / 2, y);
        y += lineH;
      }
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      /* watermark */
      ctx.save();
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.font = "600 " + Math.round(FW * 0.028) + "px 'Poppins','Segoe UI',sans-serif";
      ctx.letterSpacing = "2px";
      ctx.fillStyle = "rgba(230,195,90,0.95)";
      ctx.fillText("ALVORADA DO CÉU ✧", FW - FW * 0.03, FH - FH * 0.03);
      ctx.letterSpacing = "0px";
      ctx.font = "500 " + Math.round(FW * 0.024) + "px 'Poppins','Segoe UI',sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText("@alvoradadoceu", FW - FW * 0.03, FH - FH * 0.012);
      ctx.restore();

      /* export */
      const blob = await new Promise((resolve) => {
        el.canvas.toBlob((b) => resolve(b || new Blob([], { type: "image/png" })), "image/png", 1);
      });

      state.lastBlob = blob;
      state.lastMime = "image/png";
      state.content = content;
      /* show preview */
      el.canvas.hidden = true;
      el.image.src = URL.createObjectURL(blob);
      el.image.hidden = false;
      el.video.hidden = true;
      hidePlaybackBar();
      el.btnDownload.disabled = false;
      el.btnDownload.textContent = "⬇ Baixar imagem (PNG)";
      el.btnCopyCaption.disabled = false;
      el.btnCopyCaption2.disabled = false;

      /* caption */
      state.caption = reelsBuildCaption(content, type);
      el.captionText.value = state.caption;
      el.captionCard.hidden = false;

      setStatus("Imagem pronta! É só baixar e postar. ✧", 1);
      showToast("Imagem com frase pronta. ✧", "ok");
    } catch (e) {
      console.error(e);
      el.video.hidden = true;
      el.image.hidden = true;
      el.canvas.hidden = true;
      el.placeholder.hidden = false;
      hidePlaybackBar();
      showToast("Não foi possível gerar agora: " + (e.message || "tente novamente."), "error");
      setStatus("Falha na geração. Tente novamente.", 0);
    } finally {
      state.busy = false;
      el.btnGenerate.disabled = false;
      setTimeout(resetStatus, 6000);
    }
  }

  /* =========================================================
     CARROSSEL — decks, render e exportação
     ========================================================= */

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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

  /* divide texto em N partes equilibradas por palavra (para oração em passos) */
  function splitBalanced(text, parts) {
    const words = String(text).replace(/\s+/g, " ").trim().split(" ");
    if (words.length < parts * 3) return null;
    const per = Math.ceil(words.length / parts);
    const out = [];
    for (let i = 0; i < parts; i++) {
      const c = words.slice(i * per, (i + 1) * per).join(" ");
      if (c) out.push(c);
    }
    return out.length === parts ? out : null;
  }

  /* monta o baralho de slides conforme o modelo escolhido */
  function buildCarouselDeck(kind, n) {
    const inner = Math.max(3, n - 2); /* capa + conteúdo + CTA */
    const hook = randomItem(CAROUSEL_HOOKS);

    if (kind === "quiz") {
      const msgs = shuffle(CAROUSEL_QUIZ_MESSAGES).slice(0, inner);
      return {
        kind,
        title: "Qual mensagem Deus tem para você hoje?",
        emoji: "🎲",
        captionLead: "Deus tem uma palavra específica para você hoje.",
        slides: [
          { type: "cover", emoji: "🎲", title: "Qual mensagem Deus tem para você hoje?", sub: "Escolha um número de 1 a " + msgs.length + " 👇" },
          ...msgs.map((m, i) => ({ type: "number", num: i + 1, emoji: m.e, text: m.x })),
          { type: "cta", ctaKind: "quiz", total: msgs.length },
        ],
      };
    }

    if (kind === "frases") {
      const cat = randomItem(typeof QUOTE_CATEGORIES !== "undefined" ? QUOTE_CATEGORIES : [{ id: "fe", label: "Fé", emoji: "✝️" }]);
      const pool = typeof QUOTES !== "undefined" && QUOTES[cat.id] ? QUOTES[cat.id] : [];
      const picks = shuffle(pool).slice(0, inner);
      return {
        kind,
        title: cat.label,
        emoji: cat.emoji || "💬",
        captionLead: picks[0] ? picks[0].text : "",
        slides: [
          { type: "cover", emoji: cat.emoji || "💬", title: hook, sub: cat.label + " · deslize para ler →" },
          ...picks.map((q) => ({ type: "item", text: q.text, author: q.author })),
          { type: "cta", ctaKind: "padrao" },
        ],
      };
    }

    if (kind === "versiculos") {
      const picks = shuffle(REELS_VERSES).slice(0, inner);
      return {
        kind,
        title: "Versículos para o seu dia",
        emoji: "📖",
        captionLead: picks[0] ? picks[0].x + " (" + picks[0].ref + ")" : "",
        slides: [
          { type: "cover", emoji: "📖", title: hook, sub: "Versículos para guardar no coração →" },
          ...picks.map((v) => ({ type: "item", text: v.x, ref: v.ref })),
          { type: "cta", ctaKind: "salvar" },
        ],
      };
    }

    if (kind === "lista") {
      const deck = randomItem(CAROUSEL_LIST_DECKS);
      const items = deck.items.slice(0, inner);
      return {
        kind,
        title: deck.t,
        emoji: deck.e,
        captionLead: deck.hook,
        slides: [
          { type: "cover", emoji: deck.e, title: deck.t, sub: "Deslize para ver todos →" },
          ...items.map((it, i) => ({ type: "number", num: i + 1, emoji: "", text: it })),
          { type: "cta", ctaKind: "salvar" },
        ],
      };
    }

    /* passos — oração dividida em etapas */
    const prayers = [...REELS_MORNING, ...REELS_NIGHT, ...REELS_FREE_PRAYERS];
    let prayer = randomItem(prayers);
    let chunks = splitBalanced(prayer.x, inner);
    let tries = 0;
    while ((!chunks || chunks.length < inner) && tries < 10) {
      prayer = randomItem(prayers);
      chunks = splitBalanced(prayer.x, inner);
      tries++;
    }
    if (!chunks || chunks.length < inner) chunks = splitScript(prayer.x, inner);
    return {
      kind: "passos",
      title: prayer.t,
      emoji: prayer.e || "🙏",
      captionLead: "Ore comigo: " + prayer.t.toLowerCase() + ".",
      slides: [
        { type: "cover", emoji: prayer.e || "🙏", title: "Ore comigo agora", sub: prayer.t + " · deslize e reze →" },
        ...chunks.map((c, i) => ({ type: "item", idx: "Passo " + (i + 1), text: c })),
        { type: "cta", ctaKind: "amem" },
      ],
    };
  }

  function ctaLinesFor(kindCta) {
    if (kindCta === "quiz") {
      return [
        ["👇 Comente o número que você escolheu", "e eu te respondo com uma palavra"],
        ["📌 Salve este perfil", "@alvoradadoceu para receber fé todo dia"],
        ["✨ Compartilhe", "com quem precisa de uma palavra hoje"],
      ];
    }
    if (kindCta === "amem") {
      return [
        ["🙏 Termine dizendo AMÉM", "nos comentários"],
        ["📌 Salve esta oração", "para rezar de novo depois"],
        ["✨ Envie para alguém", "que precisa orar com você"],
      ];
    }
    if (kindCta === "salvar") {
      return [
        ["📌 Salve agora", "para reler quando precisar"],
        ["🙏 Comente AMÉM", "para declarar essa palavra"],
        ["✨ Compartilhe", "com quem ama a Palavra"],
      ];
    }
    return CAROUSEL_CTA_LINES.map((l) => [l[0], l[1]]);
  }

  /* desenha um slide completo no canvas */
  async function drawSlide(ctx, FW, FH, slide, bgImg, variant) {
    await document.fonts.ready;

    /* fundo cobrindo o slide, com leve variação de zoom por slide */
    ctx.clearRect(0, 0, FW, FH);
    if (bgImg && bgImg.width) {
      const zoom = 1 + (variant % 3) * 0.06;
      const ir = bgImg.width / bgImg.height;
      const cr = FW / FH;
      let sx, sy, sw, sh;
      if (ir > cr) { sh = bgImg.height / zoom; sw = sh * cr; sx = (bgImg.width - sw) / 2; sy = (bgImg.height - sh) / 2; }
      else { sw = bgImg.width / zoom; sh = sw / cr; sx = (bgImg.width - sw) / 2; sy = (bgImg.height - sh) / 2; }
      ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, FW, FH);
    } else {
      ctx.fillStyle = "#0b0a12";
      ctx.fillRect(0, 0, FW, FH);
    }

    /* scrim conforme o tipo de slide */
    const g = ctx.createLinearGradient(0, 0, 0, FH);
    if (slide.type === "cover") {
      g.addColorStop(0, "rgba(8,8,16,0.72)");
      g.addColorStop(0.5, "rgba(8,8,16,0.55)");
      g.addColorStop(1, "rgba(8,8,16,0.88)");
    } else if (slide.type === "cta") {
      g.addColorStop(0, "rgba(8,8,16,0.62)");
      g.addColorStop(0.5, "rgba(8,8,16,0.78)");
      g.addColorStop(1, "rgba(8,8,16,0.94)");
    } else {
      g.addColorStop(0, "rgba(8,8,16,0.42)");
      g.addColorStop(0.45, "rgba(8,8,16,0.6)");
      g.addColorStop(1, "rgba(8,8,16,0.9)");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FW, FH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (slide.type === "cover") {
      /* emoji */
      ctx.font = Math.round(FW * 0.13) + "px 'Segoe UI Emoji','Noto Color Emoji',sans-serif";
      ctx.fillText(slide.emoji || "✨", FW / 2, FH * 0.3);
      /* título */
      const tSize = Math.min(FW * 0.098, 108);
      const font = "700 " + tSize + "px 'Cormorant Garamond', Georgia, serif";
      const lines = wrapLines(ctx, slide.title, font, FW * 0.84, 4);
      const lh = tSize * 1.22;
      let y = FH * 0.52 - ((lines.length - 1) * lh) / 2;
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = tSize * 0.18;
      ctx.shadowOffsetY = tSize * 0.05;
      ctx.fillStyle = "#fffdf6";
      ctx.font = font;
      for (const ln of lines) { ctx.fillText(ln, FW / 2, y); y += lh; }
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      /* pílula "deslize" */
      const subFont = "600 " + Math.round(FW * 0.034) + "px 'Poppins','Segoe UI',sans-serif";
      ctx.font = subFont;
      const stw = ctx.measureText(slide.sub).width;
      const pw = stw + FW * 0.07;
      const ph = FH * 0.052;
      const px = (FW - pw) / 2;
      const py = FH * 0.76;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, ph / 2);
      else ctx.rect(px, py, pw, ph);
      ctx.fillStyle = "rgba(230,195,90,0.92)";
      ctx.fill();
      ctx.fillStyle = "#241c08";
      ctx.fillText(slide.sub, FW / 2, py + ph / 2 + 1);
    } else if (slide.type === "number") {
      /* número gigante translúcido ao fundo */
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#e6c35a";
      ctx.font = "700 " + Math.round(FW * 0.62) + "px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText(String(slide.num), FW / 2, FH * 0.4);
      ctx.restore();
      /* texto da mensagem */
      const mSize = Math.min(FW * 0.062, 74);
      const mfont = "600 " + mSize + "px 'Cormorant Garamond', Georgia, serif";
      const mlines = wrapLines(ctx, slide.text, mfont, FW * 0.82, 6);
      const mlh = mSize * 1.3;
      let my = FH * 0.56 - ((mlines.length - 1) * mlh) / 2;
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = mSize * 0.16;
      ctx.shadowOffsetY = mSize * 0.05;
      ctx.fillStyle = "#fffdf6";
      ctx.font = mfont;
      for (const ln of mlines) { ctx.fillText(ln, FW / 2, my); my += mlh; }
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      if (slide.emoji) {
        ctx.font = Math.round(FW * 0.07) + "px 'Segoe UI Emoji','Noto Color Emoji',sans-serif";
        ctx.fillText(slide.emoji, FW / 2, FH * 0.24);
      }
      /* marcador do número */
      const bFont = "600 " + Math.round(FW * 0.03) + "px 'Poppins','Segoe UI',sans-serif";
      ctx.font = bFont;
      const blabel = slide.num + " / " + (state.slidesTotal || "");
      const bw = ctx.measureText(blabel).width + FW * 0.05;
      const bh = FH * 0.042;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect((FW - bw) / 2, FH * 0.115, bw, bh, bh / 2);
      else ctx.rect((FW - bw) / 2, FH * 0.115, bw, bh);
      ctx.fillStyle = "rgba(6,5,14,0.55)";
      ctx.fill();
      ctx.fillStyle = "rgba(255,253,246,0.95)";
      ctx.fillText(blabel, FW / 2, FH * 0.115 + bh / 2 + 1);
    } else if (slide.type === "cta") {
      const lines = ctaLinesFor(slide.ctaKind);
      const tSize = Math.min(FW * 0.052, 60);
      const sSize = Math.min(FW * 0.033, 38);
      const blockH = lines.length * (tSize + sSize + FH * 0.035);
      let y = FH * 0.48 - blockH / 2 + tSize / 2;
      for (const [main, sub] of lines) {
        ctx.shadowColor = "rgba(0,0,0,0.85)";
        ctx.shadowBlur = tSize * 0.15;
        ctx.fillStyle = "#ffe9a8";
        ctx.font = "700 " + tSize + "px 'Poppins','Segoe UI',sans-serif";
        ctx.fillText(main, FW / 2, y);
        y += tSize * 0.72;
        ctx.fillStyle = "rgba(255,253,246,0.85)";
        ctx.font = "500 " + sSize + "px 'Poppins','Segoe UI',sans-serif";
        ctx.fillText(sub, FW / 2, y + sSize * 0.4);
        y += sSize + FH * 0.035;
      }
      ctx.shadowBlur = 0;
    } else {
      /* item — frase/versículo/passo */
      const badge = slide.idx || slide.ref || "";
      if (badge) {
        const bFont = "600 " + Math.round(FW * 0.028) + "px 'Poppins','Segoe UI',sans-serif";
        ctx.font = bFont;
        const bw = ctx.measureText(badge).width + FW * 0.05;
        const bh = FH * 0.04;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect((FW - bw) / 2, FH * 0.12, bw, bh, bh / 2);
        else ctx.rect((FW - bw) / 2, FH * 0.12, bw, bh);
        ctx.fillStyle = "rgba(230,195,90,0.9)";
        ctx.fill();
        ctx.fillStyle = "#241c08";
        ctx.fillText(badge, FW / 2, FH * 0.12 + bh / 2 + 1);
      }
      const tSize = Math.min(FW * 0.066, 80);
      const tfont = "600 " + tSize + "px 'Cormorant Garamond', Georgia, serif";
      const tlines = wrapLines(ctx, slide.text, tfont, FW * 0.82, 7);
      const tlh = tSize * 1.3;
      let ty = FH * 0.54 - ((tlines.length - 1) * tlh) / 2;
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = tSize * 0.16;
      ctx.shadowOffsetY = tSize * 0.05;
      ctx.fillStyle = "#fffdf6";
      ctx.font = tfont;
      for (const ln of tlines) { ctx.fillText(ln, FW / 2, ty); ty += tlh; }
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      if (slide.author) {
        ctx.fillStyle = "rgba(255,253,246,0.75)";
        ctx.font = "500 " + Math.round(FW * 0.03) + "px 'Poppins','Segoe UI',sans-serif";
        ctx.fillText("— " + slide.author, FW / 2, ty + FH * 0.02);
      }
    }

    /* marca d'água */
    ctx.save();
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.font = "600 " + Math.round(FW * 0.028) + "px 'Poppins','Segoe UI',sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillStyle = "rgba(230,195,90,0.95)";
    ctx.fillText("ALVORADA DO CÉU ✧", FW - FW * 0.03, FH - FH * 0.03);
    ctx.letterSpacing = "0px";
    ctx.font = "500 " + Math.round(FW * 0.024) + "px 'Poppins','Segoe UI',sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("@alvoradadoceu", FW - FW * 0.03, FH - FH * 0.012);
    ctx.restore();
  }

  function buildCarouselCaption(deck) {
    const type = typeById(state.type);
    const tags = reelsHashtags(type.id, {});
    const lines = [];
    lines.push(deck.emoji + " " + deck.title);
    lines.push("");
    if (deck.kind === "quiz") {
      lines.push("Escolha um número de 1 a " + (deck.slides.length - 2) + " e deslize para ver a mensagem que Deus tem para você hoje.");
      lines.push("");
      lines.push("👇 Comenta aqui embaixo qual número você escolheu — eu vou responder com uma palavra de fé!");
    } else {
      lines.push(deck.captionLead);
      lines.push("");
      lines.push("Deslize até o fim e me conta nos comentários qual slide tocou o seu coração 💛");
    }
    lines.push("");
    lines.push("📌 Salve para reler · ✨ Compartilhe com quem precisa · 🔔 Siga @alvoradadoceu");
    lines.push("");
    lines.push(tags.join(" "));
    return lines.join("\n");
  }

  /* ---------- geração do carrossel ---------- */
  async function handleGenerateCarousel() {
    if (state.busy) return;
    state.busy = true;
    el.btnGenerate.disabled = true;

    const theme = themeById(state.theme);
    const style = REELS_STYLES[state.style] || REELS_STYLES.cinematic;
    const fmt = REELS_FORMATS[state.format] || REELS_FORMATS.portrait;
    const FW = fmt.w;
    const FH = fmt.h;

    try {
      const deck = buildCarouselDeck(state.kind, state.slideCount);
      state.slidesTotal = deck.slides.length;

      el.placeholder.hidden = true;
      el.video.hidden = true;
      el.image.hidden = true;
      el.canvas.hidden = false;
      el.canvas.width = FW;
      el.canvas.height = FH;
      el.btnDownload.disabled = true;
      hidePlaybackBar();
      clearCarouselStrip();

      /* fundos — poucas imagens reaproveitadas entre os slides */
      const nBg = Math.min(3, deck.slides.length);
      setStatus("Buscando " + nBg + " fundos (" + (IMAGE_SOURCES[state.source] || IMAGE_SOURCES.cloudflare).label + ")…", 0.05);
      const bgBlobs = await Promise.all(
        Array.from({ length: nBg }, () => generateFrame(theme, style, state.source))
      );
      const bgImgs = [];
      for (let i = 0; i < bgBlobs.length; i++) {
        bgImgs.push(await loadHtmlImage(bgBlobs[i].blob));
      }

      const ctx = el.canvas.getContext("2d");
      const slides = [];
      for (let i = 0; i < deck.slides.length; i++) {
        setStatus("Renderizando slide " + (i + 1) + " de " + deck.slides.length + "…", 0.25 + (i / deck.slides.length) * 0.65);
        await drawSlide(ctx, FW, FH, deck.slides[i], bgImgs[i % bgImgs.length], i);
        const blob = await new Promise((resolve) => {
          el.canvas.toBlob((b) => resolve(b || new Blob([], { type: "image/png" })), "image/png", 1);
        });
        slides.push({ blob, url: URL.createObjectURL(blob) });
        await sleep(40);
      }

      state.slides = slides;
      state.lastBlob = slides[0].blob;
      state.lastMime = "image/png";

      /* preview: primeiro slide grande + faixa de miniaturas */
      el.canvas.hidden = true;
      el.image.src = slides[0].url;
      el.image.hidden = false;
      el.video.hidden = true;
      hidePlaybackBar();
      renderCarouselStrip(slides, deck);

      el.btnDownload.disabled = false;
      el.btnDownload.textContent = "⬇ Baixar todos os " + slides.length + " slides";
      el.btnCopyCaption.disabled = false;
      el.btnCopyCaption2.disabled = false;

      state.caption = buildCarouselCaption(deck);
      el.captionText.value = state.caption;
      el.captionCard.hidden = false;

      setStatus("Carrossel pronto! Baixe os slides e poste na ordem. ✧", 1);
      showToast("Carrossel de " + slides.length + " slides pronto. ✧", "ok");
    } catch (e) {
      console.error(e);
      el.video.hidden = true;
      el.image.hidden = true;
      el.canvas.hidden = true;
      el.placeholder.hidden = false;
      hidePlaybackBar();
      showToast("Não foi possível gerar agora: " + (e.message || "tente novamente."), "error");
      setStatus("Falha na geração. Tente novamente.", 0);
    } finally {
      state.busy = false;
      el.btnGenerate.disabled = false;
      setTimeout(resetStatus, 6000);
    }
  }

  /* ---------- faixa de miniaturas ---------- */
  function clearCarouselStrip() {
    if (!el.carouselStrip) return;
    el.carouselStrip.innerHTML = "";
    el.carouselStrip.hidden = true;
  }

  function renderCarouselStrip(slides, deck) {
    if (!el.carouselStrip) return;
    el.carouselStrip.innerHTML = "";
    el.carouselStrip.hidden = false;
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
        triggerDownload(s.blob, carouselFileName(i + 1));
        showToast("Slide " + (i + 1) + " salvo. ✧", "ok");
      });
      thumb.appendChild(img);
      thumb.appendChild(num);
      thumb.appendChild(dl);
      thumb.addEventListener("click", () => {
        el.image.src = s.url;
        el.carouselStrip.querySelectorAll(".cs-thumb").forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
      });
      el.carouselStrip.appendChild(thumb);
    });
  }

  function carouselFileName(i) {
    return "alvorada-carrossel-" + state.kind + "-" + String(i).padStart(2, "0") + ".png";
  }

  async function downloadAllSlides() {
    const slides = state.slides || [];
    for (let i = 0; i < slides.length; i++) {
      triggerDownload(slides[i].blob, carouselFileName(i + 1));
      setStatus("Baixando slides… " + (i + 1) + "/" + slides.length, (i + 1) / slides.length);
      await sleep(420);
    }
    resetStatus();
    showToast(slides.length + " slides salvos na pasta de downloads. ✧", "ok");
  }

  /* ---------- surpresa 🎲 ---------- */
  function surprise() {
    if (state.busy) return;
    state.mode = randomItem(["image", "carousel", "carousel"]);
    state.type = randomItem(REELS_TYPES).id;
    state.theme = randomItem(REELS_THEMES).id;
    state.style = randomItem(Object.keys(REELS_STYLES));
    state.source = randomItem(Object.keys(IMAGE_SOURCES));
    state.format = randomItem(Object.keys(REELS_FORMATS));
    state.kind = randomItem(Object.keys(CAROUSEL_KINDS));
    state.slideCount = randomItem([5, 7, 10]);
    if (state.mode !== "carousel") pickContent();
    renderChips();
    savePrefs();

    const parts = [];
    if (state.mode === "carousel") {
      parts.push("carrossel \"" + ((CAROUSEL_KINDS[state.kind] || {}).label || "").replace(/^[^\s]+\s/, "") + "\"");
      parts.push(state.slideCount + " slides");
    } else {
      parts.push("imagem \"" + typeById(state.type).label + "\"");
    }
    parts.push("tema " + themeById(state.theme).label);
    showToast("🎲 Surpresa: " + parts.join(" · ") + "!", "ok");

    if (state.mode === "carousel") handleGenerateCarousel();
    else handleGenerateImage();
  }

  /* ---------- geração de vídeo ---------- */
  async function handleGenerate() {
    if (state.busy) return;
    state.busy = true;
    el.btnGenerate.disabled = true;

    const type = typeById(state.type);
    const theme = themeById(state.theme);
    const style = REELS_STYLES[state.style] || REELS_STYLES.cinematic;
    const content = contentFromText();
    if (!content) {
      showToast("Escreva a narração primeiro. ✧", "warn");
      state.busy = false;
      el.btnGenerate.disabled = false;
      return;
    }

    try {
      el.placeholder.hidden = true;
      el.video.hidden = true;
      el.image.hidden = true;
      el.canvas.hidden = false;
      el.canvas.width = W;
      el.canvas.height = H;
      el.btnDownload.disabled = true;
      hidePlaybackBar();
      clearCarouselStrip();
      state.slides = [];
      state.clips = [];
      state.images = [];
      state.segs = [];
      state.total = 0;

      // textos
      const chunks = splitScript(el.scriptText.value, 12);
      if (!chunks.length) throw new Error("A narração está vazia.");
      setStatus("Preparando texto…", 0.02);
      const { segs, total } = await buildTimeline(chunks, state.duration);
      state.segs = segs;
      state.total = total;

      // cenários — Ken Burns apenas
      const nImg = Math.min(state.imageCount, segs.length);
      let htmlImages = [];

      setStatus("Pintando os cenários (" + nImg + " imagens em paralelo)…", 0.05);
      const IMG_CONCURRENCY = 3;
      const imageResults = new Array(nImg);
      let imgCursor = 0;
      let imgDone = 0;
      let usedFallback = false;
      async function genNextImage() {
        while (imgCursor < nImg) {
          const idx = imgCursor++;
          const frame = await generateFrame(theme, style);
          if (frame.src === "fallback") usedFallback = true;
          const html = await loadHtmlImage(frame.blob);
          imageResults[idx] = { blob: frame.blob, img: html, src: frame.src };
          imgDone++;
          const srcLabel = usedFallback ? " (estilo pictórico)" : "";
          setStatus("Pintando cenários… " + imgDone + " de " + nImg + " prontos" + srcLabel, 0.05 + (imgDone / nImg) * 0.38);
        }
      }
      const imgWorkers = [];
      for (let i = 0; i < Math.min(IMG_CONCURRENCY, nImg); i++) imgWorkers.push(genNextImage());
      await Promise.all(imgWorkers);
      htmlImages = imageResults.map((i) => i.img);

      // assign segments to images
      segs.forEach((s, j) => { s.imageIdx = j % htmlImages.length; });

      // renderer + gravação
      const renderer = setupRenderer(segs, htmlImages, content);
      setStatus("Gravando o reels (~" + Math.round(total) + "s)…", 0.05);
      await document.fonts.ready;
      const { blob, isMp4 } = await capture(segs, total, renderer.draw);

      /* valida resolução — Instagram Reels exige exatamente 1080×1920 (9:16) */
      const dim = await verifyVideoResolution(blob);
      if (dim.w !== W || dim.h !== H) {
        console.warn("Resolução gravada inesperada:", dim);
        showToast("Atenção: o vídeo saiu em " + (dim.w || "?") + "×" + (dim.h || "?") + " em vez de 1080×1920. Gere novamente antes de postar.", "warn");
      }

      state.lastBlob = blob;
      state.lastMime = isMp4 ? "video/mp4" : "video/webm";
      el.canvas.hidden = true;
      el.video.src = URL.createObjectURL(blob);
      el.video.hidden = false;
      showPlaybackBar();
      el.btnDownload.disabled = false;
      el.btnDownload.textContent = isMp4 ? "⬇ Baixar MP4" : "⬇ Baixar vídeo (WebM)";
      el.btnCopyCaption.disabled = false;
      el.btnCopyCaption2.disabled = false;

      // legenda
      state.caption = reelsBuildCaption(content, type);
      el.captionText.value = state.caption;
      el.captionCard.hidden = false;

      setStatus("Reels pronto! É só baixar e postar. ✧", 1);
      showToast(isMp4 ? "Reels pronto em MP4 1080×1920 (9:16). ✧" : "Reels pronto! Converta para MP4 antes de postar. ✧", "ok");
    } catch (e) {
      console.error(e);
      el.video.hidden = true;
      el.image.hidden = true;
      el.canvas.hidden = true;
      el.placeholder.hidden = false;
      hidePlaybackBar();
      showToast("Não foi possível gerar agora: " + (e.message || "tente novamente."), "error");
      setStatus("Falha na geração. Tente novamente.", 0);
    } finally {
      state.busy = false;
      el.btnGenerate.disabled = false;
      setTimeout(resetStatus, 6000);
    }
  }

  /* ---------- download / cópia ---------- */
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
    if (state.mode === "carousel" && state.slides.length) {
      downloadAllSlides();
      return;
    }
    if (!state.lastBlob) return;
    const type = typeById(state.type);
    const isImage = state.lastMime === "image/png";
    const ext = isImage ? "png" : (state.lastMime === "video/mp4" ? "mp4" : "webm");
    const slug = (state.content && state.content.t ? state.content.t : type.label)
      .toLowerCase().replace(/[^a-z0-9à-ÿ\s]/g, "").trim().replace(/\s+/g, "-").slice(0, 40);
    triggerDownload(state.lastBlob, "alvorada-do-ceu-" + (isImage ? "frase-" : "reels-") + slug + "." + ext);
    showToast(isImage ? "Imagem salva na sua pasta de downloads. ✧" : "Vídeo salvo na sua pasta de downloads. ✧", "ok");
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(state.caption || el.captionText.value);
      showToast("Legenda copiada — cole na postagem. ✧", "ok");
    } catch (e) {
      el.captionText.select();
      document.execCommand("copy");
      showToast("Legenda copiada. ✧", "ok");
    }
  }

  /* ---------- preferências ---------- */
  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({
        type: state.type, theme: state.theme, style: state.style,
        duration: state.duration, engine: state.engine,
        transition: state.transition, imageCount: state.imageCount,
        mode: state.mode, source: state.source,
        kind: state.kind, slideCount: state.slideCount,
      }));
    } catch (e) {}
  }

  function loadPrefs() {
    try {
      const j = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
      if (!j) return;
      if (REELS_TYPES.some((t) => t.id === j.type)) state.type = j.type;
      if (REELS_THEMES.some((t) => t.id === j.theme)) state.theme = j.theme;
      if (REELS_STYLES[j.style]) state.style = j.style;
      if ([30, 45, 60].includes(j.duration)) state.duration = j.duration;
      state.engine = "kenburns";
      if (TRANSITIONS[j.transition]) state.transition = j.transition;
      if ([1, 2, 3, 4, 5].includes(j.imageCount)) state.imageCount = j.imageCount;
      if (["image", "carousel", "video"].includes(j.mode)) state.mode = j.mode;
      if (IMAGE_SOURCES[j.source]) state.source = j.source;
      if (CAROUSEL_KINDS[j.kind]) state.kind = j.kind;
      if ([5, 7, 10].includes(j.slideCount)) state.slideCount = j.slideCount;
    } catch (e) {}
  }

  /* ---------- scroll reveal ---------- */
  function initScrollReveal() {
    const reveals = document.querySelectorAll(
      ".tip, .pipe, .badge, .hero h1, .hero .sub, .hero-actions, .hero-badges, .section-head"
    );
    reveals.forEach((el, i) => {
      el.classList.add("reveal-up");
      el.classList.add("delay-" + ((i % 4) + 1));
    });
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal-up").forEach((el) => obs.observe(el));
    document.querySelectorAll(".hero .reveal-up").forEach((el) => el.classList.add("visible"));
  }

  /* ---------- button shimmer tracking ---------- */
  function initButtonEffects() {
    let lastTrack = 0;
    document.addEventListener("mousemove", (e) => {
      const now = Date.now();
      if (now - lastTrack < 32) return;
      lastTrack = now;
      const btn = e.target.closest(".btn");
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      btn.style.setProperty("--x", x + "%");
      btn.style.setProperty("--y", y + "%");
    });
  }

  /* ---------- playback controls ---------- */
  function fmtTime(s) {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function updatePlaybackUI() {
    const v = el.video;
    if (!v || v.hidden) return;
    const cur = v.currentTime || 0;
    const dur = v.duration || 0;
    el.pbTime.textContent = fmtTime(cur) + " / " + fmtTime(dur);
    el.pbProgress.style.width = dur > 0 ? (cur / dur * 100) + "%" : "0%";
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

  function onPlayClick() {
    el.video.play();
    el.btnPlay.hidden = true;
    el.btnPause.hidden = false;
  }

  function onPauseClick() {
    el.video.pause();
    el.btnPlay.hidden = false;
    el.btnPause.hidden = true;
  }

  function onStopClick() {
    el.video.pause();
    el.video.currentTime = 0;
    el.btnPlay.hidden = false;
    el.btnPause.hidden = true;
    updatePlaybackUI();
  }

  function onTrackClick(e) {
    const rect = el.pbTrack.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.video.currentTime = pct * (el.video.duration || 0);
    updatePlaybackUI();
  }

  function initPlaybackControls() {
    el.btnPlay.addEventListener("click", onPlayClick);
    el.btnPause.addEventListener("click", onPauseClick);
    el.btnStop.addEventListener("click", onStopClick);
    el.pbTrack.addEventListener("click", onTrackClick);
    el.video.addEventListener("timeupdate", updatePlaybackUI);
    el.video.addEventListener("ended", () => {
      el.btnPlay.hidden = false;
      el.btnPause.hidden = true;
      updatePlaybackUI();
    });
    el.video.addEventListener("click", () => {
      if (el.video.paused) onPlayClick(); else onPauseClick();
    });
  }

  /* ---------- init ---------- */
  function init() {
    loadPrefs();
    renderChips();
    pickContent();

    el.scriptText.addEventListener("input", updateScriptMeta);
    el.btnNewContent.addEventListener("click", () => { pickContent(); });
    el.btnAiContent.addEventListener("click", aiContent);
    el.btnGenerate.addEventListener("click", () => {
      if (state.mode === "image") handleGenerateImage();
      else if (state.mode === "carousel") handleGenerateCarousel();
      else handleGenerate();
    });
    if (el.btnSurprise) el.btnSurprise.addEventListener("click", surprise);
    el.btnDownload.addEventListener("click", downloadReel);
    el.btnCopyCaption.addEventListener("click", copyCaption);
    el.btnCopyCaption2.addEventListener("click", copyCaption);

    initScrollReveal();
    initButtonEffects();
    initPlaybackControls();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
