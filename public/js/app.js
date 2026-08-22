/* =========================================================
   Alvorada do Céu — gerador de frases e imagens espirituais
   Geração gratuita: Cloudflare Workers AI → Pollinations (fallback)
   ========================================================= */

(() => {
  "use strict";

  const FLAT_FORMATS = {};
  FORMAT_GROUPS.forEach((g) => Object.assign(FLAT_FORMATS, g.formats));

  const PREFS_KEY = "alvorada_prefs_v1";
  const USED_KEY = "alvorada_used_quotes_v1";
  const DEFAULT_TEXT = { color: "#ffffff", effect: "solid" };
  const DEFAULT_CAPTION = { color: "#ffffff", effect: "solid" };
  const DEFAULT_GRAD = "#ffd76a";
  const DEFAULT_OUTLINE = "#0d0c1a";

  const state = {
    category: QUOTE_CATEGORIES[0],
    quote: null,
    style: "cinematic",
    format: { key: "square", ...FLAT_FORMATS.square },
    engine: "cloudflare",
    textColor: DEFAULT_TEXT.color,
    textEffect: DEFAULT_TEXT.effect,
    textColor2: DEFAULT_GRAD,
    textOutline: DEFAULT_OUTLINE,
    captionColor: DEFAULT_CAPTION.color,
    captionEffect: DEFAULT_CAPTION.effect,
    captionColor2: DEFAULT_GRAD,
    captionOutline: DEFAULT_OUTLINE,
    melody: "none",
    busy: false,
    lastBlob: null,
    composedBlob: null,
    lastEngine: null,
    audioCtx: null,
    audioDest: null,
    carousel: {
      busy: false,
      slides: [], // { dataURL, blob, quote, kind }
    },
  };

  /* ---------- elementos ---------- */
  const el = {
    phrase: $("#phrase"),
    author: $("#author"),
    quoteMark: $("#quote-mark"),
    newPhrase: $("#new-phrase"),
    generate: $("#generate"),
    download: $("#download"),
    downloadMp4: $("#download-mp4"),
    share: $("#share"),
    revealStage: $("#reveal-stage"),
    cardImg: $("#card-img"),
    flash: $("#flash"),
    rings: $("#rings"),
    sparkles: $("#sparkles"),
    canvas: $("#card-canvas"),
    chips: $("#category-chips"),
    styles: $("#style-chips"),
    formats: $("#format-chips"),
    formatSize: $("#format-size"),
    melodyChips: $("#melody-chips"),
    melodyLabel: $("#melody-label"),
    engines: $("#engine-chips"),
    textColor: $("#text-color"),
    textEffect: $("#text-effect"),
    textColor2: $("#text-color2"),
    textOutline: $("#text-outline"),
    captionColor: $("#caption-color"),
    captionEffect: $("#caption-effect"),
    captionColor2: $("#caption-color2"),
    captionOutline: $("#caption-outline"),
    textGradRow: $("#text-grad-row"),
    textOutlineRow: $("#text-outline-row"),
    captionGradRow: $("#caption-grad-row"),
    captionOutlineRow: $("#caption-outline-row"),
    engineNote: $("#engine-note"),
    gallery: $("#phrase-gallery"),
    galleryMore: $("#gallery-more"),
    copyPhrase: $("#copy-phrase"),
    countPhrases: $("#count-phrases"),
    countCategories: $("#count-categories"),
    countStyles: $("#count-styles"),
    countFormats: $("#count-formats"),
    recentStrip: $("#recent-strip"),
    captionCard: $("#caption-card"),
    captionText: $("#caption-text"),
    copyCaption: $("#copy-caption"),
    refreshCaption: $("#refresh-caption"),
    shareModal: $("#share-modal"),
    sharePreview: $("#share-preview-img"),
    shareCaption: $("#share-caption"),
    dailyDate: $("#daily-date"),
    dailyVerseText: $("#daily-verse-text"),
    dailyVerseAuthor: $("#daily-verse-author"),
    dailyPrayerText: $("#daily-prayer-text"),
    dailyPrayerAuthor: $("#daily-prayer-author"),
    dailyVerseUse: $("#daily-verse-use"),
    dailyPrayerUse: $("#daily-prayer-use"),
    legalModal: $("#legal-modal"),
    legalHead: $("#legal-head"),
    cookieBar: $("#cookie-bar"),
    cookieAccept: $("#cookie-accept"),
    cookieMore: $("#cookie-more"),
    btnContact: $("#btn-contact"),
    contactModal: $("#contact-modal"),
    contactForm: $("#contact-form"),
    contactName: $("#contact-name"),
    contactMsg: $("#contact-msg"),
    backTop: $("#back-top"),
    navToggle: $("#nav-toggle"),
    siteNav: $("#site-nav"),
    carousel: $("#carousel"),
    carouselModal: $("#carousel-modal"),
    carouselCount: $("#carousel-count"),
    carouselRatio: $("#carousel-ratio"),
    carouselGenerate: $("#carousel-generate"),
    carouselStrip: $("#carousel-strip"),
    carouselResults: $("#carousel-results"),
    carouselZip: $("#carousel-zip"),
    carouselCaption: $("#carousel-caption"),
    carouselProgress: $("#carousel-progress"),
    carouselProgressRow: $("#carousel-progress-row"),
  };

  const ctx = el.canvas.getContext("2d");

  /* ---------- helpers ---------- */
  const loadImage = (src) =>
    new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error("Não foi possível carregar a imagem."));
      img.src = src;
    });

  function scaledDims(w, h, max = 1024) {
    const long = Math.max(w, h);
    if (long <= max) return { w, h };
    const k = max / long;
    return { w: Math.round(w * k), h: Math.round(h * k) };
  }

  function wrapText(text, maxW, c = ctx) {
    const words = String(text).split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const t = line ? line + " " + word : word;
      if (c.measureText(t).width > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = t;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function shade(hex, pct) {
    const { r, g, b } = hexToRgb(hex);
    const f = (c) => Math.round(Math.min(255, Math.max(0, pct < 0 ? c * (1 + pct) : c + (255 - c) * pct)));
    return "rgb(" + f(r) + "," + f(g) + "," + f(b) + ")";
  }

  function pickQuote(category) {
    const list = QUOTES[category.id];
    const used = getUsedQuotes();
    const available = list.filter((q) => !used.includes(q.text));
    let pick;
    if (available.length > 0) {
      pick = randomItem(available);
    } else {
      pick = randomItem(list);
      showToast("Todas as frases desta categoria já foram usadas. Reiniciando ciclo.", "warn");
      clearUsedQuotes(category.id);
    }
    markQuoteUsed(pick.text);
    state.quote = { ...pick, category };
    renderUsedCount();
    return state.quote;
  }

  function getUsedQuotes() {
    try { return JSON.parse(localStorage.getItem(USED_KEY) || "[]"); } catch (e) { return []; }
  }

  function markQuoteUsed(text) {
    const used = getUsedQuotes();
    if (!used.includes(text)) {
      used.push(text);
      try { localStorage.setItem(USED_KEY, JSON.stringify(used)); } catch (e) {}
    }
  }

  function clearUsedQuotes() {
    try { localStorage.removeItem(USED_KEY); } catch (e) {}
  }

  function countUsedQuotes() {
    const used = getUsedQuotes();
    let total = 0;
    QUOTE_CATEGORIES.forEach((cat) => { total += (QUOTES[cat.id] || []).length; });
    return { used: used.length, total };
  }

  function renderUsedCount() {
    const el2 = $("#used-count");
    if (!el2) return;
    const { used, total } = countUsedQuotes();
    el2.textContent = used + " de " + total + " frases usadas";
  }

  const scrollToGenerator = () =>
    $("#gerador").scrollIntoView({ behavior: "smooth", block: "start" });

  /* ---------- render ---------- */
  function renderChips() {
    el.chips.innerHTML = "";
    QUOTE_CATEGORIES.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (cat.id === state.category.id ? " active" : "");
      btn.dataset.cat = cat.id;
      btn.style.setProperty("--chip", cat.accent);
      btn.innerHTML = `<span class="chip-emoji">${cat.emoji}</span>${cat.label}`;
      btn.addEventListener("click", () => selectCategory(cat));
      el.chips.appendChild(btn);
    });

    el.styles.innerHTML = "";
    Object.entries(ART_STYLES).forEach(([key, s]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip style-chip" + (key === state.style ? " active" : "");
      btn.dataset.style = key;
      btn.textContent = s.label;
      btn.addEventListener("click", () => {
        state.style = key;
        renderChips();
      });
      el.styles.appendChild(btn);
    });

    renderFormats();

    el.engines.innerHTML = "";
    [
      ["cloudflare", "Cloudflare (padrão)"],
      ["pollinations", "Pollinations"],
      ["freeai", "free.ai"],
      ["g4f", "g4f (gpt4free)"],
      ["pixabay-photos", "📸 Pixabay"],
      ["pexels-photos", "📸 Pexels"],
    ].forEach(([key, label]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip engine-chip" + (key === state.engine ? " active" : "");
      btn.dataset.engine = key;
      btn.textContent = label;
      btn.addEventListener("click", () => {
        state.engine = key;
        renderChips();
      });
      el.engines.appendChild(btn);
    });

    document.documentElement.style.setProperty("--accent", state.category.accent);
  }

  function renderFormats() {
    el.formats.innerHTML = "";
    FORMAT_GROUPS.forEach((g) => {
      const box = document.createElement("div");
      box.className = "format-group";
      const lbl = document.createElement("span");
      lbl.className = "format-group-label";
      lbl.textContent = g.label;
      const chips = document.createElement("div");
      chips.className = "chips";
      Object.entries(g.formats).forEach(([key, f]) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chip format-chip" + (key === state.format.key ? " active" : "");
        btn.dataset.format = key;
        btn.textContent = f.label;
        btn.addEventListener("click", () => {
          state.format = { key, ...f };
          applyStageFormat();
          renderFormats();
        });
        chips.appendChild(btn);
      });
      box.appendChild(lbl);
      box.appendChild(chips);
      el.formats.appendChild(box);
    });
    if (el.formatSize) {
      el.formatSize.textContent =
        state.format.w + " × " + state.format.h + " px";
    }
    const isStory = state.format.key === "story" || state.format.key === "whatsapp" || state.format.key === "celular";
    if (el.downloadMp4) el.downloadMp4.hidden = !isStory;
    if (el.melodyChips) el.melodyChips.hidden = !isStory;
    if (el.melodyLabel) el.melodyLabel.hidden = !isStory;
    if (isStory) renderMelodyChips();
  }

  function renderMelodyChips() {
    if (!el.melodyChips) return;
    el.melodyChips.innerHTML = "";
    Object.entries(MELODIES).forEach(([k, m]) => {
      const label = m.label + (m.desc ? ' <span class="v-tag">' + m.desc + "</span>" : "");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (k === state.melody ? " active" : "");
      btn.innerHTML = label;
      btn.addEventListener("click", () => {
        state.melody = k;
        renderMelodyChips();
      });
      el.melodyChips.appendChild(btn);
    });
  }

  function applyStageFormat() {
    if (!el.revealStage) return;
    const r = state.format.w / state.format.h;
    el.revealStage.style.aspectRatio = r;
    el.revealStage.classList.toggle("tall", r < 0.7);
    el.revealStage.classList.toggle("wide", r > 1.5);
  }

  function selectCategory(cat) {
    state.category = cat;
    state.quote = pickQuote(cat);
    renderPhrase();
    renderChips();
  }

  function renderPhrase() {
    el.phrase.textContent = "“" + state.quote.text + "”";
    el.author.textContent = "— " + state.quote.author;
    el.quoteMark.textContent = state.category.emoji;
  }

  function renderGallery() {
    if (!el.gallery) return;
    const sample = [];
    const total = QUOTE_CATEGORIES.reduce((n, c) => n + QUOTES[c.id].length, 0);
    const wanted = Math.min(12, total);
    let guard = wanted * 30;
    while (sample.length < wanted && guard-- > 0) {
      const cat = randomItem(QUOTE_CATEGORIES);
      const q = randomItem(QUOTES[cat.id]);
      if (sample.some((x) => x.text === q.text)) continue;
      sample.push({ ...q, cat });
    }
    el.gallery.innerHTML = "";
    sample.forEach((q) => {
      const card = document.createElement("article");
      card.className = "gallery-card";
      card.style.setProperty("--cat", q.cat.accent);
      card.innerHTML = `
        <div class="gallery-top">
          <span class="gallery-emoji">${q.cat.emoji}</span>
          <span class="gallery-cat">${q.cat.label}</span>
        </div>
        <p class="gallery-text">“${q.text}”</p>
        <div class="gallery-actions">
          <span class="gallery-author">${q.author}</span>
          <button type="button" class="gallery-use" data-cat="${q.cat.id}">Usar esta frase</button>
        </div>`;
      card.querySelector(".gallery-use").addEventListener("click", () => {
        selectCategory(q.cat);
        state.quote = { ...q, category: q.cat };
        renderPhrase();
        scrollToGenerator();
        showToast("Frase escolhida. Agora gere sua imagem. ✧", "ok");
      });
      el.gallery.appendChild(card);
    });
  }

  /* ---------- legenda para Instagram ---------- */
  const CAPTION_HASHTAGS_BASE = [
    "#oracao", "#fe", "#deus", "#jesus", "#espiritualidade", "#paz",
    "#gratidao", "#biblia", "#esperanca", "#amor", "#proposito", "#reels",
    "#instagram", "#oracaododia", "#milagre", "#testemunho", "#consolo",
    "#louvor", "#cristo", "#pazinterior", "#sabedoriadedeus", "#fortalezaemdeus",
    "#amordeus", "#vidadeDeus", "#espiritualidadeCrista",
  ];

  const CAPTION_HOOKS_ALT = [
    "Uma palavra que vai tocar o seu coração",
    "Salve para reler quando precisar de paz",
    "Essa mensagem é para quem está lendo agora",
    "Deus tem uma mensagem para você hoje",
    "Uma reflexão que vai iluminar o seu dia",
    "Você precisava ler isso hoje",
    "Mensagem de fé para começar o dia",
    "Uma oração que vai abençoar a sua vida",
    "Palavras de paz para o seu coração",
    "Leia com calma e sinta a paz",
    "Envie para alguém que precisa ouvir isso",
    "Um versículo que vai mudar o seu dia",
    "Momento de reflexão e paz",
    "Essa é a palavra que Deus tem para você",
    "Uma dádiva para o seu coração",
  ];

  const CAPTION_CTAS = [
    ["Comente AMÉM se essa mensagem tocou seu coração 🙏"],
    ["Comente \u201CAMÉM\u201D e Receba em nome de Jesus ✨"],
    ["Marca alguém que precisa de fé hoje 💛"],
    ["Comente \u201CEU CREIO\u201D se você também acredita 🙏"],
    ["Salve e compartilhe com quem precisa 🌟"],
  ];

  const CAPTION_EMOJIS = ["✝️", "🕊️", "🙏", "🌟", "💛", "📖", "✨", "🌅", "🌿", "🔥"];

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function buildPhraseCaption() {
    const q = state.quote;
    if (!q) return "";
    const cat = q.category;
    const hook = Math.random() < 0.5 ? (cat.hook || "Uma palavra para o seu coração") : randomItem(CAPTION_HOOKS_ALT);
    const emoji = randomItem(CAPTION_EMOJIS);
    const cta = randomItem(CAPTION_CTAS);
    const catHashtags = cat.hashtags || [];
    const ref = q.ref ? "\n📖 " + q.ref : "";
    const shuffledTags = shuffleArray(CAPTION_HASHTAGS_BASE.concat(catHashtags)).slice(0, 20);
    const lines = [
      emoji + " " + hook,
      "",
      "\u201C" + q.text + "\u201D" + ref,
      "",
      cta,
      "Salve para reler quando precisar 💛",
      "Compartilhe com quem precisa hoje ✨",
      "",
      shuffledTags.join(" "),
    ];
    return lines.join("\n");
  }

  function showCaption() {
    const caption = buildPhraseCaption();
    if (!caption || !el.captionCard || !el.captionText) return;
    el.captionText.value = caption;
    el.captionCard.hidden = false;
  }

  function refreshCaption() {
    const caption = buildPhraseCaption();
    if (!caption || !el.captionText) return;
    el.captionText.value = caption;
    showToast("Nova legenda gerada. ✧", "ok");
  }

  /* ---------- geração ---------- */
  function buildPrompt() {
    const style = ART_STYLES[state.style];
    const q = state.quote;
    const gen = scaledDims(state.format.w, state.format.h, 1024);
    const scene =
      "breathtaking ultra-high-quality spiritual artwork, absolutely no text, no letters, no words, no watermark, no signature, " +
      q.category.scene +
      ", " +
      style.prompt +
      ", " +
      "majestic atmosphere, luminous divine radiance, exquisite detail, perfect balanced composition, professional color grading, cinematic depth of field, sharp crisp focus, vibrant rich colors, masterpiece, 8k, award winning, high quality art";
    return {
      prompt: scene,
      w: gen.w,
      h: gen.h,
      label:
        "Imagem em " + style.label + " — " + state.category.label + ", sem palavras",
    };
  }

  async function generateWithCloudflare(prompt, w, h) {
    const body = {
      prompt,
      steps: 8,
      width: w,
      height: h,
      seed: randomInt(0, 999999),
    };
    const res = await fetch("/api/cf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let msg = "Cloudflare respondeu " + res.status;
      try {
        msg = await res.text();
      } catch (e) {}
      throw new Error(msg);
    }
    const blob = await res.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  async function generateWithPollinations(prompt, w, h) {
    const url =
      "/api/image?prompt=" +
      encodeURIComponent(prompt) +
      "&width=" +
      w +
      "&height=" +
      h +
      "&seed=" +
      randomInt(0, 999999) +
      "&nologo=true&model=flux&enhance=true";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Pollinations respondeu " + res.status);
    const blob = await res.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  async function generateWithFreeAi(prompt, w, h) {
    const url =
      "/api/freeai?prompt=" +
      encodeURIComponent(prompt) +
      "&width=" +
      w +
      "&height=" +
      h +
      "&seed=" +
      randomInt(0, 999999);
    const res = await fetch(url);
    if (!res.ok) {
      let msg = "free.ai respondeu " + res.status;
      try { msg = await res.text(); } catch (e) {}
      throw new Error(msg);
    }
    const blob = await res.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  async function generateWithG4f(prompt, w, h) {
    const url =
      "/api/g4f?prompt=" +
      encodeURIComponent(prompt) +
      "&width=" + w +
      "&height=" + h +
      "&seed=" + randomInt(0, 999999);
    const res = await fetch(url);
    if (!res.ok) {
      let msg = "g4f respondeu " + res.status;
      try { msg = await res.text(); } catch (e) {}
      throw new Error(msg);
    }
    const blob = await res.blob();
    if (!blob || blob.size < 5000) throw new Error("Imagem muito pequena");
    return blob;
  }

  /* ---------- Pixabay / Pexels photo search ---------- */
  const STOCK_KEYWORDS = {
    fe: "prayer faith light",
    esperanca: "sunrise hope dawn",
    gratidao: "wheat field harvest golden",
    paz: "calm lake peaceful doves",
    coragem: "eagle mountain summit",
    amor: "roses candlelight warm",
    recomeco: "sunrise ocean new beginning",
    oracao: "prayer hands light",
    proposito: "starry night path light",
    luz: "lantern light glow",
    biblia: "bible open pages light",
    forca: "mountain climber strong",
    sabedoria: "old tree forest wisdom",
    cura: "gentle rain green leaf",
    milagre: "light through clouds divine",
  };

  function getStockKeywords() {
    return STOCK_KEYWORDS[state.category.id] || "spiritual peaceful nature light";
  }

  async function fetchPixabayPhoto(w, h) {
    const q = getStockKeywords();
    const res = await fetch("/api/pixabay/photos?q=" + encodeURIComponent(q) + "&per_page=5&min_width=" + Math.min(w, 1920));
    if (!res.ok) throw new Error("Pixabay Photos " + res.status);
    const j = await res.json();
    if (!j.photos || !j.photos.length) throw new Error("Nenhuma foto Pixabay encontrada");
    const photo = j.photos[Math.floor(Math.random() * j.photos.length)];
    const proxyUrl = "/api/pixabay/proxy?url=" + encodeURIComponent(photo.image);
    const imgRes = await fetch(proxyUrl);
    if (!imgRes.ok) throw new Error("Falha ao baixar foto Pixabay");
    return await imgRes.blob();
  }

  async function fetchPexelsPhoto(w, h) {
    const q = getStockKeywords();
    const res = await fetch("/api/pexels/photos?q=" + encodeURIComponent(q) + "&per_page=5&orientation=portrait");
    if (!res.ok) throw new Error("Pexels Photos " + res.status);
    const j = await res.json();
    if (!j.photos || !j.photos.length) throw new Error("Nenhuma foto Pexels encontrada");
    const photo = j.photos[Math.floor(Math.random() * j.photos.length)];
    const proxyUrl = "/api/pexels/proxy?url=" + encodeURIComponent(photo.image);
    const imgRes = await fetch(proxyUrl);
    if (!imgRes.ok) throw new Error("Falha ao baixar foto Pexels");
    return await imgRes.blob();
  }

  async function fetchPexelsVideoAsImage(w, h) {
    const q = getStockKeywords();
    const res = await fetch("/api/pexels/videos?q=" + encodeURIComponent(q) + "&per_page=3&orientation=portrait&min_width=" + Math.min(w, 1080));
    if (!res.ok) throw new Error("Pexels Videos " + res.status);
    const j = await res.json();
    if (!j.videos || !j.videos.length) throw new Error("Nenhum vídeo Pexels encontrado");
    const video = j.videos[Math.floor(Math.random() * j.videos.length)];
    const vidEl = document.createElement("video");
    vidEl.src = "/api/pexels/proxy?url=" + encodeURIComponent(video.videoMedium || video.videoSmall || video.videoURL);
    vidEl.muted = true;
    vidEl.playsInline = true;
    vidEl.preload = "auto";
    await new Promise((resolve, reject) => {
      vidEl.onloadeddata = resolve;
      vidEl.onerror = () => reject(new Error("Falha ao carregar vídeo Pexels"));
      vidEl.load();
    });
    vidEl.currentTime = Math.min(1, vidEl.duration * 0.3);
    await new Promise((r) => setTimeout(r, 200));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    const vr = vidEl.videoWidth / vidEl.videoHeight;
    const cr = w / h;
    let sx, sy, sw, sh;
    if (vr > cr) { sh = vidEl.videoHeight; sw = sh * cr; sx = (vidEl.videoWidth - sw) / 2; sy = 0; }
    else { sw = vidEl.videoWidth; sh = sw / cr; sx = 0; sy = (vidEl.videoHeight - sh) / 2; }
    ctx.drawImage(vidEl, sx, sy, sw, sh, 0, 0, w, h);
    return new Promise((resolve) => c.toBlob(resolve, "image/jpeg", 0.92));
  }

  /* ---------- Reels video generation ---------- */
  async function generateReelsVideo(prompt, w, h) {
    const BW = 1080, BH = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = BW;
    canvas.height = BH;
    const ctx = canvas.getContext("2d");
    const videoDuration = 15;
    const FPS = 30;

    let bgBlob;
    if (state.engine === "pixabay-photos") {
      bgBlob = await fetchPixabayPhoto(BW, BH);
    } else if (state.engine === "pexels-photos") {
      bgBlob = await fetchPexelsPhoto(BW, BH);
    } else if (state.engine === "pexels-videos") {
      bgBlob = await fetchPexelsVideoAsImage(BW, BH);
    } else {
      bgBlob = await generateWithCloudflare(prompt, BW, BH).catch(() =>
        generateWithPollinations(prompt, BW, BH)
      );
    }

    const bgImg = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Falha ao carregar imagem de fundo"));
      img.src = URL.createObjectURL(bgBlob);
    });

    const stream = canvas.captureStream(FPS);
    const mime = stream.getVideoTracks()[0].getCapabilities && stream.getVideoTracks()[0].getCapabilities().codecs
      ? 'video/webm;codecs=vp9' : 'video/webm';
    let selectedMime = "video/webm;codecs=vp9";
    if (typeof MediaRecorder !== "undefined") {
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) selectedMime = "video/webm;codecs=vp9";
      else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) selectedMime = "video/webm;codecs=vp8";
      else if (MediaRecorder.isTypeSupported("video/webm")) selectedMime = "video/webm";
      else if (MediaRecorder.isTypeSupported("video/mp4")) selectedMime = "video/mp4";
    }
    const recorder = new MediaRecorder(stream, { mimeType: selectedMime, videoBitsPerSecond: 5000000 });
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise((resolve) => { recorder.onstop = resolve; });

    recorder.start();

    const q = state.quote;
    const text = q ? q.text : "";
    const lineH = 56;
    const maxW = BW * 0.82;
    ctx.font = "600 48px 'Cormorant Garamond', Georgia, serif";
    let lines = [];
    const words = text.split(" ");
    let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    }
    if (line) lines.push(line);
    const blockH = lines.length * lineH;
    const textY = BH * 0.5 - blockH / 2;

    let elapsed = 0;
    const frameMs = 1000 / FPS;
    const frames = videoDuration * FPS;

    for (let f = 0; f < frames; f++) {
      const t = f / frames;
      const zoom = 1.0 + t * 0.12;
      const ox = (t - 0.5) * BW * 0.03;
      const oy = (t - 0.5) * BH * 0.02;
      const iw = BW * zoom;
      const ih = BH * zoom;
      const ir = bgImg.width / bgImg.height;
      const cr2 = BW / BH;
      let sx, sy, sw, sh;
      if (ir > cr2) { sh = bgImg.height; sw = sh * cr2; sx = (bgImg.width - sw) / 2; sy = 0; }
      else { sw = bgImg.width; sh = sw / cr2; sx = 0; sy = (bgImg.height - sh) / 2; }

      ctx.clearRect(0, 0, BW, BH);
      ctx.drawImage(bgImg, sx, sy, sw, sh, ox, oy, iw, ih);

      ctx.fillStyle = "rgba(5,4,12,0.35)";
      ctx.fillRect(0, 0, BW, BH);

      const fadeIn = Math.min(t * 6, 1);
      const fadeOut = t > 0.85 ? (1 - t) / 0.15 : 1;
      ctx.globalAlpha = fadeIn * fadeOut;
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      const padX = 40;
      const padY = 30;
      const boxTop = textY - padY;
      const boxH = blockH + padY * 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(padX, boxTop, BW - padX * 2, boxH, 16);
      else ctx.rect(padX, boxTop, BW - padX * 2, boxH);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "600 48px 'Cormorant Garamond', Georgia, serif";
      ctx.fillStyle = "rgba(255,253,246,0.97)";
      lines.forEach((l, i) => {
        ctx.fillText(l, BW / 2, textY + i * lineH + lineH / 2);
      });

      ctx.font = "500 26px 'Poppins','Segoe UI',sans-serif";
      ctx.fillStyle = "rgba(230,195,90,0.9)";
      ctx.fillText("ALVORADA DO CÉU ✧", BW / 2, BH - 80);
      ctx.globalAlpha = 1;

      await new Promise((r) => setTimeout(r, frameMs));
    }

    recorder.stop();
    await stopped;
    const blob = new Blob(chunks, { type: selectedMime });
    return { blob, engine: "reels-video" };
  }

  /* ---------- melodia ambiente (story MP4) ---------- */
  let melodyNodes = [];

  async function ensureAudioCtx() {
    if (!state.audioCtx) {
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      state.audioDest = state.audioCtx.createMediaStreamDestination();
    }
    if (state.audioCtx.state === "suspended") {
      try { await state.audioCtx.resume(); } catch (e) {}
    }
    return state.audioCtx;
  }

  function startMelody(duration) {
    stopMelody();
    const m = MELODIES[state.melody];
    if (!m || state.melody === "none") return;
    const ac = state.audioCtx;
    if (!ac) return;

    const masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(0, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(m.gain, ac.currentTime + 1.5);
    masterGain.gain.setValueAtTime(m.gain, ac.currentTime + Math.max(0, duration - 2));
    masterGain.gain.linearRampToValueAtTime(0, ac.currentTime + duration);
    masterGain.connect(ac.destination);
    if (state.audioDest) masterGain.connect(state.audioDest);

    const lfo = ac.createOscillator();
    const lfoGain = ac.createGain();
    lfo.frequency.value = m.lfoRate;
    lfoGain.gain.value = m.lfoDepth;
    lfo.connect(lfoGain);
    lfo.start(ac.currentTime);
    lfo.stop(ac.currentTime + duration);
    melodyNodes.push(lfo, lfoGain);

    m.overtones.forEach((ratio, i) => {
      const osc = ac.createOscillator();
      const oscGain = ac.createGain();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = m.baseFreq * ratio;
      oscGain.gain.value = i === 0 ? 0.5 : 0.25 / (i + 1);
      lfoGain.connect(osc.frequency);
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + duration);
      melodyNodes.push(osc, oscGain);
    });
  }

  function stopMelody() {
    melodyNodes.forEach((n) => { try { n.disconnect(); } catch (e) {} try { n.stop(); } catch (e) {} });
    melodyNodes = [];
  }

  /* ---------- Story MP4 (3s Ken Burns + melodia) ---------- */
  async function generateStoryMp4() {
    const ac = await ensureAudioCtx();
    const BW = state.format.w || 1080;
    const BH = state.format.h || 1920;
    const canvas = document.createElement("canvas");
    canvas.width = BW;
    canvas.height = BH;
    const ctx = canvas.getContext("2d");
    const videoDuration = 3;
    const FPS = 30;

    const { prompt } = buildPrompt();
    let bgBlob;
    if (state.engine === "pixabay-photos") {
      bgBlob = await fetchPixabayPhoto(BW, BH);
    } else if (state.engine === "pexels-photos") {
      bgBlob = await fetchPexelsPhoto(BW, BH);
    } else if (state.engine === "pexels-videos") {
      bgBlob = await fetchPexelsVideoAsImage(BW, BH);
    } else {
      bgBlob = await generateWithCloudflare(prompt, BW, BH).catch(() =>
        generateWithPollinations(prompt, BW, BH)
      );
    }

    const bgImg = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Falha ao carregar imagem de fundo"));
      img.src = URL.createObjectURL(bgBlob);
    });

    const stream = canvas.captureStream(FPS);
    const tracks = stream.getVideoTracks();
    if (state.audioDest && state.audioDest.stream.getAudioTracks().length) {
      tracks.push.apply(tracks, state.audioDest.stream.getAudioTracks());
    }
    const combined = new MediaStream(tracks);

    let selectedMime = "video/webm";
    if (typeof MediaRecorder !== "undefined") {
      if (MediaRecorder.isTypeSupported('video/mp4;codecs="avc1.64001f,mp4a.40.2"')) selectedMime = 'video/mp4;codecs="avc1.64001f,mp4a.40.2"';
      else if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) selectedMime = "video/mp4;codecs=avc1";
      else if (MediaRecorder.isTypeSupported("video/mp4")) selectedMime = "video/mp4";
      else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) selectedMime = "video/webm;codecs=vp9,opus";
      else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) selectedMime = "video/webm;codecs=vp8,opus";
      else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) selectedMime = "video/webm;codecs=vp9";
      else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) selectedMime = "video/webm;codecs=vp8";
    }
    const recorder = new MediaRecorder(combined, { mimeType: selectedMime, videoBitsPerSecond: 5000000 });
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise((resolve) => { recorder.onstop = resolve; });

    startMelody(videoDuration + 0.5);
    recorder.start();

    const q = state.quote;
    const text = q ? q.text : "";
    const lineH = Math.round(BH * 0.03);
    const maxW = BW * 0.82;
    ctx.font = "600 " + Math.round(BH * 0.025) + "px 'Cormorant Garamond', Georgia, serif";
    let lines = [];
    const words = text.split(" ");
    let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    }
    if (line) lines.push(line);
    const blockH = lines.length * lineH;
    const textY = BH * 0.5 - blockH / 2;

    const frames = videoDuration * FPS;
    const frameMs = 1000 / FPS;

    for (let f = 0; f < frames; f++) {
      const t = f / frames;
      const zoom = 1.0 + t * 0.10;
      const ox = (t - 0.5) * BW * 0.02;
      const oy = (t - 0.5) * BH * 0.015;
      const iw = BW * zoom;
      const ih = BH * zoom;
      const ir = bgImg.width / bgImg.height;
      const cr = BW / BH;
      let sx, sy, sw, sh;
      if (ir > cr) { sh = bgImg.height; sw = sh * cr; sx = (bgImg.width - sw) / 2; sy = 0; }
      else { sw = bgImg.width; sh = sw / cr; sx = 0; sy = (bgImg.height - sh) / 2; }

      ctx.clearRect(0, 0, BW, BH);
      ctx.drawImage(bgImg, sx, sy, sw, sh, ox, oy, iw, ih);

      ctx.fillStyle = "rgba(5,4,12,0.35)";
      ctx.fillRect(0, 0, BW, BH);

      const fadeIn = Math.min(t * 5, 1);
      const fadeOut = t > 0.82 ? (1 - t) / 0.18 : 1;
      ctx.globalAlpha = fadeIn * fadeOut;
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      const padX = 40;
      const padY = 30;
      const boxTop = textY - padY;
      const boxH = blockH + padY * 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(padX, boxTop, BW - padX * 2, boxH, 16);
      else ctx.rect(padX, boxTop, BW - padX * 2, boxH);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "600 " + Math.round(BH * 0.025) + "px 'Cormorant Garamond', Georgia, serif";
      ctx.fillStyle = "rgba(255,253,246,0.97)";
      lines.forEach((l, i) => {
        ctx.fillText(l, BW / 2, textY + i * lineH + lineH / 2);
      });

      ctx.font = "500 " + Math.round(BH * 0.014) + "px 'Poppins','Segoe UI',sans-serif";
      ctx.fillStyle = "rgba(230,195,90,0.9)";
      ctx.fillText("ALVORADA DO CÉU ✧", BW / 2, BH - 80);
      ctx.globalAlpha = 1;

      await new Promise((r) => setTimeout(r, frameMs));
    }

    recorder.stop();
    await stopped;
    stopMelody();
    const blob = new Blob(chunks, { type: selectedMime });
    const isMp4 = selectedMime.includes("mp4");
    return { blob, engine: "story-mp4", isMp4 };
  }

  function downloadStoryMp4() {
    if (!state.lastBlob) return;
    const slug = state.quote.text
      .toLowerCase()
      .replace(/[^a-z0-9à-ÿ\s]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40);
    const ext = (state.lastEngine === "story-mp4") ? "mp4" : "webm";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(state.lastBlob);
    a.download = "alvorada-story-" + slug + "." + ext;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    showToast("Story MP4 salvo na sua pasta de downloads. ✧", "ok");
  }

  async function handleGenerateMp4() {
    if (state.busy) return;
    state.busy = true;
    el.generate.disabled = true;
    el.downloadMp4 && (el.downloadMp4.disabled = true);
    renderPhrase();
    showLoader();
    el.revealStage.classList.remove("reveal");
    el.revealStage.classList.remove("ready");

    try {
      const { blob, engine, isMp4 } = await generateStoryMp4();
      state.lastBlob = blob;
      state.lastEngine = engine;
      const url = URL.createObjectURL(blob);
      el.cardImg.hidden = true;
      let vidEl = el.revealStage.querySelector("video.reels-preview");
      if (!vidEl) {
        vidEl = document.createElement("video");
        vidEl.className = "reels-preview";
        vidEl.style.cssText = "width:100%;max-height:70vh;border-radius:12px;object-fit:contain;background:#000;";
        vidEl.controls = true;
        vidEl.loop = true;
        vidEl.muted = true;
        el.revealStage.insertBefore(vidEl, el.flash);
      }
      vidEl.src = url;
      vidEl.hidden = false;
      vidEl.play().catch(() => {});
      triggerReveal();
      updateEngineNote();
      rememberRecent();
      showCaption();
      showToast("Story MP4 gerado com sucesso (3s). ✧", "ok");
    } catch (e) {
      console.error(e);
      showToast("Não foi possível gerar o Story MP4. Tente novamente.", "error");
    } finally {
      hideLoader();
      state.busy = false;
      el.generate.disabled = false;
      el.downloadMp4 && (el.downloadMp4.disabled = false);
    }
  }

  async function generateImageFor(prompt, w, h) {
    if (state.format && state.format.isVideo) {
      return generateReelsVideo(prompt, w, h);
    }
    if (state.engine === "pixabay-photos") {
      try {
        const blob = await fetchPixabayPhoto(w, h);
        return { blob, engine: "pixabay-photos" };
      } catch (e) {
        console.warn("Pixabay Photos falhou, gerando com IA:", e);
        showToast("Pixabay indisponível — gerando com IA…", "warn");
        const blob = await generateWithPollinations(prompt, w, h);
        return { blob, engine: "pollinations" };
      }
    }
    if (state.engine === "pexels-photos") {
      try {
        const blob = await fetchPexelsPhoto(w, h);
        return { blob, engine: "pexels-photos" };
      } catch (e) {
        console.warn("Pexels Photos falhou, gerando com IA:", e);
        showToast("Pexels indisponível — gerando com IA…", "warn");
        const blob = await generateWithPollinations(prompt, w, h);
        return { blob, engine: "pollinations" };
      }
    }
    if (state.engine === "pexels-videos") {
      try {
        const blob = await fetchPexelsVideoAsImage(w, h);
        return { blob, engine: "pexels-videos" };
      } catch (e) {
        console.warn("Pexels Vídeos falhou, gerando com IA:", e);
        showToast("Pexels indisponível — gerando com IA…", "warn");
        const blob = await generateWithPollinations(prompt, w, h);
        return { blob, engine: "pollinations" };
      }
    }
    if (state.engine === "pollinations") {
      const blob = await generateWithPollinations(prompt, w, h);
      return { blob, engine: "pollinations" };
    }
    if (state.engine === "freeai") {
      try {
        const blob = await generateWithFreeAi(prompt, w, h);
        return { blob, engine: "freeai" };
      } catch (e) {
        console.warn("free.ai falhou, tentando Pollinations:", e);
        showToast("free.ai indisponível — gerando via Pollinations…", "warn");
        const blob = await generateWithPollinations(prompt, w, h);
        return { blob, engine: "pollinations" };
      }
    }
    if (state.engine === "g4f") {
      try {
        const blob = await generateWithG4f(prompt, w, h);
        return { blob, engine: "g4f" };
      } catch (e) {
        console.warn("g4f falhou, tentando Pollinations:", e);
        showToast("g4f indisponível — gerando via Pollinations…", "warn");
        const blob = await generateWithPollinations(prompt, w, h);
        return { blob, engine: "pollinations" };
      }
    }
    try {
      const blob = await generateWithCloudflare(prompt, w, h);
      return { blob, engine: "cloudflare" };
    } catch (e) {
      console.warn("Cloudflare ocupado, tentando Pollinations:", e);
      showToast("Cloudflare ocupado — gerando via Pollinations…", "warn");
      const blob = await generateWithPollinations(prompt, w, h);
      return { blob, engine: "pollinations" };
    }
  }

  async function generateImage() {
    const { prompt, w, h } = buildPrompt();
    return generateImageFor(prompt, w, h);
  }

  function updateEngineNote() {
    if (!el.engineNote) return;
    if (state.lastEngine && state.lastEngine !== "cloudflare") {
      const labels = {
        pollinations: "Pollinations",
        freeai: "free.ai",
        g4f: "g4f (gpt4free)",
        "pixabay-photos": "Pixabay (fotos)",
        "pexels-photos": "Pexels (fotos)",
        "pexels-videos": "Pexels (vídeos)",
        "reels-video": "Reels com Ken Burns",
        "story-mp4": "Story MP4 (3s Ken Burns + melodia)",
      };
      el.engineNote.textContent =
        state.lastEngine === "reels-video"
          ? "Reels gerado com Ken Burns + texto sobreposto"
          : state.lastEngine === "story-mp4"
          ? "Story MP4 gerado com Ken Burns (3s) + melodia"
          : "Imagem gerada via " + (labels[state.lastEngine] || state.lastEngine) + " (via gratuita)";
    } else {
      el.engineNote.textContent =
        "Imagens geradas gratuitamente por IA (Cloudflare · Pollinations · Pixabay · Pexels)";
    }
  }

  async function handleGenerate() {
    if (state.busy) return;
    state.busy = true;
    el.generate.disabled = true;
    renderPhrase();
    showLoader();
    el.revealStage.classList.remove("reveal");
    el.revealStage.classList.remove("ready");

    try {
      state.composedBlob = null;
      const { blob, engine } = await generateImage();
      state.lastBlob = blob;
      state.lastEngine = engine;
      if (engine === "reels-video") {
        const url = URL.createObjectURL(blob);
        el.cardImg.hidden = true;
        let vidEl = el.revealStage.querySelector("video.reels-preview");
        if (!vidEl) {
          vidEl = document.createElement("video");
          vidEl.className = "reels-preview";
          vidEl.style.cssText = "width:100%;max-height:70vh;border-radius:12px;object-fit:contain;background:#000;";
          vidEl.controls = true;
          vidEl.loop = true;
          vidEl.muted = true;
          el.revealStage.insertBefore(vidEl, el.flash);
        }
        vidEl.src = url;
        vidEl.hidden = false;
        vidEl.play().catch(() => {});
        triggerReveal();
        updateEngineNote();
        rememberRecent();
        showCaption();
        showToast("Reels gerado com sucesso. ✧", "ok");
      } else {
        let vidEl = el.revealStage.querySelector("video.reels-preview");
        if (vidEl) vidEl.hidden = true;
        el.cardImg.hidden = false;
        await drawCard(blob);
        triggerReveal();
        updateEngineNote();
        rememberRecent();
        showCaption();
        showToast(
          engine === "pollinations"
            ? "Gerado pela via gratuita alternativa. ✧"
            : "Imagem abençoada e pronta. ✧",
          "ok"
        );
      }
    } catch (e) {
      console.error(e);
      showToast("Não foi possível gerar agora. Tente novamente em instantes.", "error");
    } finally {
      hideLoader();
      state.busy = false;
      el.generate.disabled = false;
    }
  }

  /* ---------- texto estilizado ---------- */
  function styledFill(c, text, x, y, font, color, effect, scale, color2, outlineColor) {
    c.font = font;
    c.textAlign = "center";
    c.textBaseline = "middle";
    const hasOutline = String(effect).includes("outline");
    const hasGradient = String(effect).includes("gradient");

    if (hasOutline) {
      c.save();
      c.lineJoin = "round";
      c.strokeStyle = outlineColor || "rgba(6,5,14,0.92)";
      c.lineWidth = Math.max(1.5, scale * 0.05);
      c.strokeText(text, x, y);
      c.restore();
    }
    if (hasGradient) {
      const w = c.measureText(text).width;
      const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, color2 || shade(color, -0.18));
      g.addColorStop(0.5, shade(color, 0.22));
      g.addColorStop(1, color2 || shade(color, -0.18));
      c.fillStyle = g;
    } else {
      c.fillStyle = color;
    }
    c.fillText(text, x, y);
  }

  function roundedRectPath(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.lineTo(x + w - rr, y);
    c.quadraticCurveTo(x + w, y, x + w, y + rr);
    c.lineTo(x + w, y + h - rr);
    c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    c.lineTo(x + rr, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - rr);
    c.lineTo(x, y + rr);
    c.quadraticCurveTo(x, y, x + rr, y);
    c.closePath();
  }

  /* ---------- canvas ---------- */
  function paintBackground(c, img, W, H) {
    c.clearRect(0, 0, W, H);
    const ir = img.width / img.height;
    const cr = W / H;
    let sx, sy, sw, sh;
    if (ir > cr) {
      sw = img.height * cr;
      sh = img.height;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = img.width / cr;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    c.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

    /* vinheta suave para profundidade */
    const vg = c.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.28, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(6,5,12,0.44)");
    c.fillStyle = vg;
    c.fillRect(0, 0, W, H);

    const g = c.createLinearGradient(0, H * 0.36, 0, H);
    g.addColorStop(0, "rgba(8,8,16,0)");
    g.addColorStop(0.55, "rgba(8,8,16,0.46)");
    g.addColorStop(1, "rgba(8,8,16,0.9)");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    const t = c.createLinearGradient(0, 0, 0, H * 0.32);
    t.addColorStop(0, "rgba(8,8,16,0.44)");
    t.addColorStop(1, "rgba(8,8,16,0)");
    c.fillStyle = t;
    c.fillRect(0, 0, W, H);
  }

  function drawQuoteCard(c, W, H, quote) {
    const cx = W / 2;
    const oy = H * 0.47;

    const text = "“" + quote.text + "”";
    const maxW = W * 0.78;
    const maxH = H * 0.2;
    let size = W * 0.052;
    const fits = (s) => {
      c.font = "500 " + s + "px 'Cormorant Garamond', Georgia, serif";
      return wrapText(text, maxW, c).length * s * 1.42 <= maxH;
    };
    let step = size / 2;
    while (step > 0.4) {
      if (fits(size)) size += step;
      else size -= step;
      step /= 2;
    }

    const lineH = size * 1.42;
    const lines = wrapText(text, maxW, c);
    const blockH = lines.length * lineH;
    const topY = oy + H * 0.055;

    /* legenda (autor): maior, com ajuste automático para autores longos */
    const captionText = "— " + quote.author.toUpperCase();
    let captionSize = Math.max(12, W * 0.024);
    c.save();
    c.font = "600 " + captionSize + "px 'Poppins', 'Segoe UI', sans-serif";
    c.letterSpacing = captionSize * 0.14 + "px";
    while (captionSize > 12 && c.measureText(captionText).width - captionSize * 0.14 > maxW) {
      captionSize = Math.max(12, Math.floor(captionSize * 0.94));
      c.font = "600 " + captionSize + "px 'Poppins', 'Segoe UI', sans-serif";
      c.letterSpacing = captionSize * 0.14 + "px";
    }
    c.restore();
    const captionGap = lineH * 0.45;
    const captionH = captionSize * 1.6;

    /* ornamento: divisor com losango */
    c.save();
    c.strokeStyle = "rgba(255,255,255,0.8)";
    c.lineWidth = Math.max(1, W * 0.0012);
    c.beginPath();
    c.moveTo(cx - W * 0.17, oy);
    c.lineTo(cx - W * 0.025, oy);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + W * 0.025, oy);
    c.lineTo(cx + W * 0.17, oy);
    c.stroke();
    const ds = W * 0.006;
    c.fillStyle = "rgba(255,255,255,0.92)";
    c.beginPath();
    c.moveTo(cx, oy - ds);
    c.lineTo(cx + ds, oy);
    c.lineTo(cx, oy + ds);
    c.lineTo(cx - ds, oy);
    c.closePath();
    c.fill();
    c.restore();

    /* texto da frase — sem sombra, apoiado na faixa */
    const quoteFont = "500 " + size + "px 'Cormorant Garamond', Georgia, serif";
    let y = topY + lineH / 2;
    lines.forEach((line) => {
      styledFill(c, line, cx, y, quoteFont, state.textColor, state.textEffect, size, state.textColor2, state.textOutline);
      y += lineH;
    });

    /* legenda (autor) — sem sombra */
    const captionFont = "600 " + captionSize + "px 'Poppins', 'Segoe UI', sans-serif";
    c.save();
    c.letterSpacing = captionSize * 0.14 + "px";
    styledFill(c, captionText, cx, topY + blockH + captionGap + captionH * 0.55, captionFont, state.captionColor, state.captionEffect, captionSize, state.captionColor2, state.captionOutline);
    c.restore();
  }

  async function drawCard(blob) {
    const f = state.format;
    const W = f.w;
    const H = f.h;
    el.canvas.width = W;
    el.canvas.height = H;
    const img = await loadImage(URL.createObjectURL(blob));

    paintBackground(ctx, img, W, H);
    drawQuoteCard(ctx, W, H, state.quote);

    drawWatermark(ctx, W, H);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    el.cardImg.src = el.canvas.toDataURL("image/png", 0.95);
    state.composedBlob = await new Promise((resolve) => el.canvas.toBlob(resolve, "image/png"));
    el.cardImg.alt = state.quote.text;
    el.revealStage.classList.add("ready");
  }

  function drawWatermark(c, W, H) {
    const cx = W - W * 0.024;
    const by = H - H * 0.028;
    const fs = Math.max(13, W * 0.022);
    const subFs = Math.max(11, W * 0.017);
    const pad = W * 0.014;

    c.save();
    c.textAlign = "right";
    c.textBaseline = "alphabetic";

    /* marca principal (rodapé) */
    c.font = "600 " + fs + "px 'Poppins', 'Segoe UI', sans-serif";
    c.letterSpacing = fs * 0.2 + "px";
    c.fillStyle = "rgba(230,195,90,1)";
    c.fillText("ALVORADA DO CÉU", cx, by);

    /* legenda acima da marca, sem tocar no ornamento */
    c.letterSpacing = "0px";
    c.font = "600 " + subFs + "px 'Poppins', 'Segoe UI', sans-serif";
    const subText = "um amanhecer para a sua alma";
    const subBaseline = by - fs * 1.35;
    c.fillStyle = "rgba(255,255,255,1)";
    c.fillText(subText, cx, subBaseline);

    /* ornamento: linha + losango, acima da legenda */
    const mainW = c.measureText("ALVORADA DO CÉU").width;
    const ruleY = subBaseline - subFs * 2.0;
    c.strokeStyle = "rgba(230,195,90,0.6)";
    c.lineWidth = Math.max(1, W * 0.0009);
    c.beginPath();
    c.moveTo(cx - mainW - pad * 3, ruleY);
    c.lineTo(cx, ruleY);
    c.stroke();

    const d = fs * 0.4;
    const dCx = cx - mainW - pad * 3 - d;
    c.fillStyle = "rgba(230,195,90,1)";
    c.beginPath();
    c.moveTo(dCx, ruleY - d);
    c.lineTo(dCx + d, ruleY);
    c.lineTo(dCx, ruleY + d);
    c.lineTo(dCx - d, ruleY);
    c.closePath();
    c.fill();
    c.restore();
  }

  /* ---------- carrossel para Instagram ---------- */
  const CAROUSEL_RATIOS = {
    "45": { w: 1080, h: 1350, label: "4:5" },
    "11": { w: 1080, h: 1080, label: "1:1" },
    "34": { w: 1080, h: 1440, label: "3:4" },
  };

  function carouselHook(category, n) {
    if (category.id === "biblia") return n + " versículos da Bíblia";
    if (category.id === "oracao") return n + " orações para o seu dia";
    return n + " mensagens de " + category.label;
  }

  function pickDistinctQuotes(category, n) {
    const list = QUOTES[category.id] || [];
    const pool = [...list];
    const out = [];
    let guard = 0;
    while (out.length < n && pool.length && guard++ < 500) {
      const i = randomInt(0, pool.length - 1);
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  }

  async function runPool(items, limit, worker, onProgress) {
    const results = new Array(items.length);
    let cursor = 0;
    let done = 0;
    async function work() {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await worker(items[i], i);
        done++;
        if (onProgress) onProgress(done, items.length);
      }
    }
    const runners = [];
    for (let i = 0; i < Math.min(limit, items.length); i++) runners.push(work());
    await Promise.all(runners);
    return results;
  }

  function buildCarouselScene(cat, style, ratio) {
    const gen = scaledDims(ratio.w, ratio.h, 1024);
    const scene =
      "breathtaking ultra-high-quality spiritual artwork, absolutely no text, no letters, no words, no watermark, no signature, " +
      cat.scene +
      ", " +
      style.prompt +
      ", " +
      "majestic atmosphere, luminous divine radiance, exquisite detail, perfect balanced composition, professional color grading, cinematic depth of field, sharp crisp focus, vibrant rich colors, masterpiece, 8k, award winning, high quality art";
    return { prompt: scene, w: gen.w, h: gen.h };
  }

  function drawSlideCounter(c, W, H, idx, total) {
    const label = idx + " / " + total;
    const fs = Math.max(12, W * 0.022);
    c.save();
    c.font = "600 " + fs + "px 'Poppins', 'Segoe UI', sans-serif";
    c.textAlign = "right";
    const tw = c.measureText(label).width;
    const px = W - fs * 1.2;
    const py = fs * 1.8;
    const pad = fs * 0.6;
    roundedRectPath(c, px - tw - pad * 2, py - fs, tw + pad * 2, fs * 2, fs);
    c.fillStyle = "rgba(6,5,14,0.55)";
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.95)";
    c.fillText(label, px, py);
    c.restore();
  }

  function drawCoverSlide(c, W, H, quoteCount) {
    const cx = W / 2;
    const emojiSize = W * 0.18;
    c.save();
    c.font = emojiSize + "px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(state.category.emoji, cx, H * 0.18);
    c.restore();

    const hook = carouselHook(state.category, quoteCount);
    const maxW = W * 0.82;
    const maxH = H * 0.22;
    let size = W * 0.085;
    while (size > 16) {
      c.font = "700 " + size + "px 'Cormorant Garamond', Georgia, serif";
      const lines = wrapText(hook, maxW, c);
      if (lines.length * size * 1.25 <= maxH) break;
      size *= 0.92;
    }
    const hLines = wrapText(hook, maxW, c);
    const hLineH = size * 1.25;
    const hTop = H * 0.42 - (hLines.length * hLineH) / 2;
    c.save();
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.letterSpacing = size * 0.02 + "px";
    let y = hTop + hLineH / 2;
    hLines.forEach((line) => {
      styledFill(c, line, cx, y, "700 " + size + "px 'Cormorant Garamond', Georgia, serif", state.textColor, state.textEffect, size, state.textColor2, state.textOutline);
      y += hLineH;
    });
    c.restore();

    const sub = "para iluminar o seu dia";
    const subSize = Math.max(14, W * 0.032);
    styledFill(c, sub, cx, hTop + hLines.length * hLineH + subSize * 1.7, "600 " + subSize + "px 'Poppins', 'Segoe UI', sans-serif", state.captionColor, state.captionEffect, subSize, state.captionColor2, state.captionOutline);

    const swipe = "deslize →";
    const swSize = Math.max(13, W * 0.026);
    c.save();
    c.font = "600 " + swSize + "px 'Poppins', 'Segoe UI', sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "rgba(255,255,255,0.92)";
    c.fillText(swipe, cx, H * 0.88);
    c.restore();
  }

  function drawCtaSlide(c, W, H) {
    const cx = W / 2;
    const emojiSize = W * 0.16;
    c.save();
    c.font = emojiSize + "px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(state.category.emoji, cx, H * 0.24);
    c.restore();

    const title = "Salve esta publicação";
    const tSize = Math.min(W * 0.09, 64);
    styledFill(c, title, cx, H * 0.46, "700 " + tSize + "px 'Cormorant Garamond', Georgia, serif", state.textColor, state.textEffect, tSize, state.textColor2, state.textOutline);

    const follow = "Siga @alvoradadoceu para mais mensagens";
    const fSize = Math.max(14, W * 0.028);
    styledFill(c, follow, cx, H * 0.57, "600 " + fSize + "px 'Poppins', 'Segoe UI', sans-serif", state.captionColor, state.captionEffect, fSize, state.captionColor2, state.captionOutline);
  }

  async function drawSlide(c, canvas, img, ratio, kind, quote, idx, total, quoteCount) {
    const W = ratio.w;
    const H = ratio.h;
    canvas.width = W;
    canvas.height = H;
    paintBackground(c, img, W, H);
    if (kind === "cover") drawCoverSlide(c, W, H, quoteCount);
    else if (kind === "cta") drawCtaSlide(c, W, H);
    else drawQuoteCard(c, W, H, quote);
    drawWatermark(c, W, H);
    drawSlideCounter(c, W, H, idx, total);
    c.textAlign = "left";
    c.textBaseline = "alphabetic";
    return canvas.toDataURL("image/png", 0.95);
  }

  async function generateCarouselSlides(count, ratioKey) {
    const ratio = CAROUSEL_RATIOS[ratioKey];
    const style = ART_STYLES[state.style];
    const cat = state.category;
    const scene = buildCarouselScene(cat, style, ratio);
    const quoteSlots = count - 2;
    const quotes = pickDistinctQuotes(cat, quoteSlots);

    el.carouselProgress.textContent = "Gerando os " + count + " fundos…";
    const blobs = await runPool(
      new Array(count),
      2,
      async () => {
        const { blob } = await generateImageFor(scene.prompt, scene.w, scene.h);
        return blob;
      },
      (done, total) => {
        el.carouselProgress.textContent = "Gerando os fundos… " + done + " de " + total;
      }
    );

    const canvas = document.createElement("canvas");
    const c = canvas.getContext("2d");
    const slides = [];
    for (let i = 0; i < count; i++) {
      el.carouselProgress.textContent = "Montando o slide " + (i + 1) + " de " + count + "…";
      const img = await loadImage(URL.createObjectURL(blobs[i]));
      const kind = i === 0 ? "cover" : i === count - 1 ? "cta" : "quote";
      const quote = kind === "quote" ? quotes[i - 1] : null;
      const dataURL = await drawSlide(c, canvas, img, ratio, kind, quote, i + 1, count, quoteSlots);
      slides.push({ dataURL, blob: null, kind, quote, idx: i + 1, total: count });
    }
    return slides;
  }

  function renderCarouselStrip() {
    el.carouselStrip.innerHTML = "";
    state.carousel.slides.forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "carousel-slide";
      const ratio = CAROUSEL_RATIOS[el.carouselRatio.value];
      div.style.aspectRatio = ratio.w / ratio.h;
      const img = document.createElement("img");
      img.src = s.dataURL;
      img.alt = "Slide " + (i + 1);
      const idx = document.createElement("span");
      idx.className = "carousel-idx";
      idx.textContent = i + 1;
      div.appendChild(img);
      div.appendChild(idx);
      el.carouselStrip.appendChild(div);
    });
  }

  function buildCarouselCaption(category, quotes) {
    const lines = [carouselHook(category, quotes.length) + " ✧", ""];
    quotes.forEach((q, i) => lines.push((i + 1) + ". “" + q.text + "” — " + q.author));
    lines.push("", "Salve para ler quando precisar 💛", "Siga @alvoradadoceu para mais mensagens ✨");
    return lines.join("\n");
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

  async function downloadCarouselZip() {
    const slides = state.carousel.slides;
    if (!slides.length) return;
    try {
      await Promise.all(
        slides.map(async (s) => {
          if (!s.blob) s.blob = await (await fetch(s.dataURL)).blob();
        })
      );
    } catch (e) {
      console.warn(e);
    }
    const JSZipLib = window.JSZip;
    if (!JSZipLib) {
      slides.forEach((s, i) => triggerDownload(s.blob, "alvorada-do-ceu-carrossel-" + (i + 1) + ".png"));
      showToast("ZIP indisponível — baixando uma a uma. ✧", "warn");
      return;
    }
    const zip = new JSZipLib();
    slides.forEach((s, i) => zip.file("alvorada-do-ceu-" + (i + 1) + ".png", s.blob));
    const content = await zip.generateAsync({ type: "blob" });
    triggerDownload(content, "alvorada-do-ceu-carrossel.zip");
    showToast("ZIP salvo na sua pasta de downloads. ✧", "ok");
  }

  async function copyCarouselCaption() {
    try {
      const quotes = state.carousel.slides.filter((s) => s.kind === "quote").map((s) => s.quote);
      await navigator.clipboard.writeText(buildCarouselCaption(state.category, quotes));
      showToast("Legenda copiada. ✧", "ok");
    } catch (e) {
      showToast("Não foi possível copiar neste navegador.", "warn");
    }
  }

  async function handleCarouselGenerate() {
    if (state.carousel.busy) return;
    state.carousel.busy = true;
    el.carouselGenerate.disabled = true;
    el.carouselResults.hidden = true;
    el.carouselStrip.innerHTML = "";
    el.carouselProgressRow.hidden = false;
    el.carouselProgress.textContent = "Preparando os slides…";
    try {
      const count = parseInt(el.carouselCount.value, 10) || 7;
      const ratioKey = el.carouselRatio.value;
      const slides = await generateCarouselSlides(count, ratioKey);
      state.carousel.slides = slides;
      renderCarouselStrip();
      el.carouselResults.hidden = false;
      showToast("Carrossel pronto com " + count + " slides. ✧", "ok");
    } catch (e) {
      console.error(e);
      showToast("Não foi possível gerar o carrossel. Tente novamente.", "error");
      el.carouselStrip.innerHTML = "";
    } finally {
      el.carouselProgressRow.hidden = true;
      state.carousel.busy = false;
      el.carouselGenerate.disabled = false;
    }
  }

  function openCarousel() {
    el.carouselModal.classList.add("open");
    el.carouselModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeCarousel() {
    el.carouselModal.classList.remove("open");
    el.carouselModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  /* ---------- revelação ---------- */
  function triggerReveal() {
    const stage = el.revealStage;
    stage.classList.remove("reveal");
    void stage.offsetWidth;
    stage.classList.add("reveal");
    const flash = el.flash;
    flash.classList.remove("go");
    void flash.offsetWidth;
    flash.classList.add("go");
    spawnSparkles();
    spawnRings();
  }

  function spawnRings() {
    if (!el.rings) return;
    el.rings.innerHTML = "";
    for (let i = 0; i < 2; i++) {
      const r = document.createElement("span");
      r.className = "ring";
      el.rings.appendChild(r);
      void r.offsetWidth;
      r.classList.add("go");
    }
  }

  function spawnSparkles() {
    if (!el.sparkles) return;
    el.sparkles.innerHTML = "";
    const count = 9;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "sparkle";
      s.textContent = randomItem(["✦", "✧", "✦", "✧"]);
      s.style.left = randomInt(5, 92) + "%";
      s.style.top = randomInt(8, 85) + "%";
      s.style.animationDelay = (Math.random() * 0.5).toFixed(2) + "s";
      s.style.fontSize = randomInt(12, 26) + "px";
      el.sparkles.appendChild(s);
      void s.offsetWidth;
      s.classList.add("go");
    }
  }

  /* ---------- download ---------- */
  function downloadCard() {
    if (!state.lastBlob) return;
    const slug = state.quote.text
      .toLowerCase()
      .replace(/[^a-z0-9à-ÿ\s]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40);
    if (state.lastEngine === "reels-video" || state.lastEngine === "story-mp4") {
      const ext = (state.lastEngine === "story-mp4" && state.lastBlob.type.includes("mp4")) ? "mp4" : "webm";
      const prefix = state.lastEngine === "story-mp4" ? "alvorada-story-" : "alvorada-reels-";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(state.lastBlob);
      a.download = prefix + slug + "." + ext;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      showToast(state.lastEngine === "story-mp4" ? "Story MP4 salvo na sua pasta de downloads. ✧" : "Reels salvo na sua pasta de downloads. ✧", "ok");
    } else {
      const out = state.composedBlob || state.lastBlob;
      const ext = out.type.includes("png") ? "png" : "jpg";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      a.download = "alvorada-do-ceu-" + slug + "." + ext;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      showToast("Imagem salva na sua pasta de downloads. ✧", "ok");
    }
  }

  /* ---------- compartilhar ---------- */
  function shareText() {
    return (
      "“" + state.quote.text + "” — " + state.quote.author +
      " ✧ Gerado gratuitamente com Alvorada do Céu"
    );
  }

  function openShare() {
    if (!state.lastBlob) {
      showToast("Gere uma imagem primeiro. ✧", "warn");
      return;
    }
    el.sharePreview.src = el.cardImg.src;
    el.shareCaption.textContent = "“" + state.quote.text + "” — " + state.quote.author;
    el.shareModal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeShare() {
    el.shareModal.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ---------- banner legal (termos / privacidade) ---------- */
  const LEGAL_TITLES = { terms: "Termos de Uso", privacy: "Política de Privacidade" };

  function openLegal(which) {
    document.querySelectorAll("[data-legal-section]").forEach((s) => {
      s.hidden = s.dataset.legalSection !== which;
    });
    el.legalHead.textContent = LEGAL_TITLES[which] || "Termos de Uso";
    el.legalModal.classList.add("open");
    el.legalModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    el.legalModal.querySelector(".legal-body").scrollTop = 0;
  }

  function closeLegal() {
    el.legalModal.classList.remove("open");
    el.legalModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function wireLegal() {
    document.querySelectorAll("[data-legal]").forEach((btn) => {
      btn.addEventListener("click", () => openLegal(btn.dataset.legal));
    });
    el.legalModal.addEventListener("click", (e) => {
      if (e.target.closest("[data-legal-close]")) closeLegal();
    });
  }

  /* ---------- aviso de cookies (reabre a cada 6 meses) ---------- */
  const COOKIE_KEY = "alvorada_cookie_consent";
  const SIX_MONTHS = 1000 * 60 * 60 * 24 * 180;

  function wireCookieBar() {
    const accepted = (() => {
      try {
        const t = parseInt(localStorage.getItem(COOKIE_KEY), 10);
        return !isNaN(t) ? t : 0;
      } catch (e) {
        return 0;
      }
    })();
    if (accepted && Date.now() - accepted < SIX_MONTHS) return;
    el.cookieBar.hidden = false;
  }

  function acceptCookies() {
    try {
      localStorage.setItem(COOKIE_KEY, String(Date.now()));
    } catch (e) {}
    el.cookieBar.hidden = true;
  }

  /* ---------- modal de contato ---------- */
  function openContact() {
    el.contactModal.classList.add("open");
    el.contactModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeContact() {
    el.contactModal.classList.remove("open");
    el.contactModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function wireContact() {
    el.btnContact.addEventListener("click", openContact);
    el.contactModal.addEventListener("click", (e) => {
      if (e.target.closest("[data-contact-close]")) closeContact();
    });
    el.contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = el.contactName.value.trim();
      const msg = el.contactMsg.value.trim();
      if (!name || !msg) {
        showToast("Preencha seu nome e sua mensagem. ✧", "warn");
        return;
      }
      el.contactForm.reset();
      closeContact();
      showToast("Mensagem enviada. Em breve responderemos. ✧", "ok");
    });
  }

  /* ---------- voltar ao topo ---------- */
  function alignBackTop() {
    const brand = document.querySelector(".site-footer .brand");
    if (!brand) return;
    const scrollY = window.scrollY || 0;
    const rect = brand.getBoundingClientRect();
    const brandCenter = rect.top + scrollY + rect.height / 2;
    const fromBottom = document.documentElement.scrollHeight - brandCenter;
    el.backTop.style.bottom = Math.max(18, fromBottom) + "px";
  }

  function wireBackTop() {
    let lastScroll = 0;
    const onScroll = () => {
      const now = Date.now();
      if (now - lastScroll < 64) return;
      lastScroll = now;
      el.backTop.classList.toggle("show", window.scrollY > 480);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", alignBackTop);
    onScroll();
    alignBackTop();
    el.backTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- menu hamburguer (mobile) ---------- */
  function setMenu(open) {
    const nav = el.siteNav;
    nav.classList.toggle("open", open);
    el.navToggle.classList.toggle("open", open);
    el.navToggle.setAttribute("aria-expanded", String(open));
    el.navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }

  function wireNavToggle() {
    el.navToggle.addEventListener("click", () => setMenu(!el.siteNav.classList.contains("open")));
    el.siteNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) setMenu(false);
    });
  }

  async function copyImage() {
    try {
      const blob = await new Promise((r) => el.canvas.toBlob(r, "image/png"));
      if (!blob) throw new Error("sem blob");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      showToast("Imagem copiada. Cole onde quiser. ✧", "ok");
    } catch (e) {
      downloadCard();
    }
  }

  function shareInstagram() {
    downloadCard();
    window.open("https://www.instagram.com/", "_blank", "noopener");
    showToast("Imagem baixada — poste no seu Instagram. ✧", "ok");
  }

  async function nativeShare() {
    const blob = await new Promise((r) => el.canvas.toBlob(r, "image/png"));
    if (!blob) return;
    const file = new File([blob], "alvorada-do-ceu.png", { type: "image/png" });
    const payload = {
      files: [file],
      title: "Alvorada do Céu — " + state.category.label,
      text: shareText(),
    };
    if (navigator.canShare && navigator.canShare(payload)) {
      try {
        await navigator.share(payload);
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
    await copyImage();
  }

  async function handleShare(target) {
    const text = shareText();
    const url = location.href.split("#")[0];
    const subject = "Uma mensagem de paz ✧ Alvorada do Céu";
    const enc = encodeURIComponent;
    closeShare();
    switch (target) {
      case "whatsapp":
        window.open("https://wa.me/?text=" + enc(text), "_blank", "noopener");
        break;
      case "facebook":
        window.open(
          "https://www.facebook.com/sharer/sharer.php?u=" + enc(url) + "&quote=" + enc(text),
          "_blank", "noopener"
        );
        break;
      case "x":
        window.open(
          "https://twitter.com/intent/tweet?text=" + enc(text) + "&url=" + enc(url),
          "_blank", "noopener"
        );
        break;
      case "pinterest":
        window.open(
          "https://pinterest.com/pin/create/button/?url=" + enc(url) + "&description=" + enc(text),
          "_blank", "noopener"
        );
        break;
      case "telegram":
        window.open(
          "https://t.me/share/url?url=" + enc(url) + "&text=" + enc(text),
          "_blank", "noopener"
        );
        break;
      case "linkedin":
        window.open(
          "https://www.linkedin.com/sharing/share-offsite/?url=" + enc(url),
          "_blank", "noopener"
        );
        break;
      case "email":
        window.location.href =
          "mailto:?subject=" + enc(subject) + "&body=" + enc(text + "\n\n" + url);
        break;
      case "instagram":
        shareInstagram();
        break;
      case "copy":
        await copyImage();
        break;
      case "native":
        await nativeShare();
        break;
    }
  }

  /* ---------- histórico / últimos gerados (sessão + localStorage) ---------- */
  const RECENT_KEY = "alvorada_recent_v1";
  const MAX_RECENT = 9;
  let sessionRecent = [];

  function loadPersistedRecent() {
    try {
      const arr = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function persistRecent(list) {
    try {
      let json = JSON.stringify(list);
      if (json.length > 4200000) {
        const slim = list.map((x, i) => (i < 3 && x.full ? x : x.full ? { ...x, full: null } : x));
        json = JSON.stringify(slim);
      }
      if (json.length > 4200000) {
        json = JSON.stringify(list.map((x) => (x.full ? { ...x, full: null } : x)));
      }
      localStorage.setItem(RECENT_KEY, json);
    } catch (e) {
      try { localStorage.removeItem(RECENT_KEY); } catch (_) {}
    }
  }

  function dataUrlToBlob(dataUrl) {
    try {
      const m = dataUrl.match(/^data:(.*?);base64,(.*)$/s);
      if (!m) return null;
      const bin = atob(m[2]);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: m[1] });
    } catch (e) {
      return null;
    }
  }

  function makeThumb(src, max = 360) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(img.width * k));
          c.height = Math.max(1, Math.round(img.height * k));
          const x = c.getContext("2d");
          x.imageSmoothingEnabled = true;
          x.imageSmoothingQuality = "high";
          x.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.8));
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function rememberRecent() {
    if (!state.lastBlob) return;
    const thumb = await makeThumb(el.cardImg.src);
    if (!thumb) return;
    const full = el.canvas.toDataURL("image/png", 0.95);
    const item = {
      thumb,
      full,
      text: state.quote.text,
      author: state.quote.author,
      cat: state.category.id,
      format: state.format.key,
      ts: Date.now(),
    };
    sessionRecent = [item, ...sessionRecent.filter((x) => x.text !== item.text)].slice(0, MAX_RECENT);
    const persisted = loadPersistedRecent().filter((x) => x.text !== item.text);
    persisted.unshift(item);
    persistRecent(persisted.slice(0, MAX_RECENT));
    renderRecent();
  }

  function renderRecent() {
    if (!el.recentStrip) return;
    const seen = new Set();
    const all = [];
    [...sessionRecent, ...loadPersistedRecent()].forEach((x) => {
      if (seen.has(x.thumb)) return;
      seen.add(x.thumb);
      all.push(x);
    });
    all.length = Math.min(all.length, MAX_RECENT);
    el.recentStrip.innerHTML = "";
    all.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "recent-item";
      btn.title = "Abrir no gerador";
      const img = document.createElement("img");
      img.src = item.thumb;
      img.alt = "Imagem recente";
      img.loading = "lazy";
      btn.appendChild(img);
      btn.addEventListener("click", () => {
        const cat = QUOTE_CATEGORIES.find((c) => c.id === item.cat) || state.category;
        state.category = cat;
        state.quote = { text: item.text, author: item.author, category: cat };
        if (item.format && FLAT_FORMATS[item.format]) {
          state.format = { key: item.format, ...FLAT_FORMATS[item.format] };
        }
        renderPhrase();
        renderChips();
        applyStageFormat();
          const src = item.full || item.thumb;
          el.cardImg.src = src;
          state.lastBlob = dataUrlToBlob(src);
          state.composedBlob = state.lastBlob;
        const img = new Image();
        img.onload = () => {
          const W = state.format.w;
          const H = state.format.h;
          el.canvas.width = W;
          el.canvas.height = H;
          ctx.clearRect(0, 0, W, H);
          const ir = img.width / img.height;
          const cr = W / H;
          let sx, sy, sw, sh;
          if (ir > cr) {
            sw = img.height * cr;
            sh = img.height;
            sx = (img.width - sw) / 2;
            sy = 0;
          } else {
            sw = img.width;
            sh = img.width / cr;
            sx = 0;
            sy = (img.height - sh) / 2;
          }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
        };
        img.onerror = () => {};
        img.src = src;
        el.revealStage.classList.add("ready");
        el.revealStage.classList.remove("reveal");
        scrollToGenerator();
      });
      el.recentStrip.appendChild(btn);
    });
  }

  /* ---------- oração e versículo do dia ---------- */
  function initDaily() {
    if (!el.dailyVerseText || !el.dailyPrayerText) return;
    const dayIndex = Math.floor(Date.now() / 86400000);
    const verse = QUOTES.biblia[dayIndex % QUOTES.biblia.length];
    const prayer = DAILY_PRAYERS[dayIndex % DAILY_PRAYERS.length];

    const dateStr = new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    el.dailyDate.textContent = dateStr;

    el.dailyVerseText.textContent = "“" + verse.text + "”";
    el.dailyVerseAuthor.textContent = "— " + verse.author;
    el.dailyPrayerText.textContent = "“" + prayer.text + "”";
    el.dailyPrayerAuthor.textContent = "— " + prayer.author;

    el.dailyVerseUse.addEventListener("click", () => {
      const cat = QUOTE_CATEGORIES.find((c) => c.id === "biblia");
      state.category = cat;
      state.quote = { text: verse.text, author: verse.author, category: cat };
      renderPhrase();
      renderChips();
      scrollToGenerator();
      showToast("Versículo carregado no gerador. ✧", "ok");
    });

    el.dailyPrayerUse.addEventListener("click", () => {
      const cat = QUOTE_CATEGORIES.find((c) => c.id === "oracao");
      state.category = cat;
      state.quote = { text: prayer.text, author: prayer.author, category: cat };
      renderPhrase();
      renderChips();
      scrollToGenerator();
      showToast("Oração carregada no gerador. ✧", "ok");
    });
  }

  /* ---------- personalização de texto ---------- */
  async function redrawIfPossible() {
    if (!state.lastBlob || state.busy) return;
    try {
      await drawCard(state.lastBlob);
    } catch (e) {
      console.warn(e);
    }
  }

  /* ---------- paleta de cores rápidas ---------- */
  const PALETTE_COLORS = [
    "#ffffff", "#0d0c1a", "#ffd76a", "#ff5a5a", "#4d8dff", "#3ddc84",
    "#ff9ec4", "#b19bf5", "#ffa94d", "#7ad7e0", "#f6ecd8", "#4fcfb2",
  ];

  function buildPalettePop(pop, input) {
    if (!pop) return;
    PALETTE_COLORS.forEach((c) => {
      const s = document.createElement("button");
      s.type = "button";
      s.className = "palette-swatch";
      s.style.background = c;
      s.title = c;
      s.addEventListener("click", () => {
        input.value = c;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        pop.hidden = true;
        markPaletteActive(pop, c);
      });
      pop.appendChild(s);
    });
  }

  function markPaletteActive(pop, color) {
    const target = String(color || "").toLowerCase();
    [...(pop ? pop.querySelectorAll(".palette-swatch") : [])].forEach((s) => {
      s.classList.toggle("active", s.title.toLowerCase() === target);
    });
  }

  function wirePalettePickers() {
    const map = {
      text: "text-color",
      text2: "text-color2",
      textOutline: "text-outline",
      caption: "caption-color",
      caption2: "caption-color2",
      captionOutline: "caption-outline",
    };
    document.querySelectorAll(".palette-btn").forEach((btn) => {
      const input = document.getElementById(map[btn.dataset.palette]);
      if (!input) return;
      const pop = btn.parentElement.querySelector(".palette-pop");
      buildPalettePop(pop, input);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll(".palette-pop").forEach((p) => {
          if (p !== pop) p.hidden = true;
        });
        pop.hidden = !pop.hidden;
        if (!pop.hidden) markPaletteActive(pop, input.value);
      });
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".palette-pop") && !e.target.closest(".palette-btn")) {
        document.querySelectorAll(".palette-pop").forEach((p) => (p.hidden = true));
      }
    });
  }

  function wireTextOptions() {
    el.textColor.value = state.textColor;
    el.textEffect.value = state.textEffect;
    el.captionColor.value = state.captionColor;
    el.captionEffect.value = state.captionEffect;
    if (el.textColor2) el.textColor2.value = state.textColor2;
    if (el.textOutline) el.textOutline.value = state.textOutline;
    if (el.captionColor2) el.captionColor2.value = state.captionColor2;
    if (el.captionOutline) el.captionOutline.value = state.captionOutline;

    el.textColor.addEventListener("input", () => {
      state.textColor = el.textColor.value;
      redrawIfPossible();
    });
    el.textEffect.addEventListener("change", () => {
      state.textEffect = el.textEffect.value;
      toggleEffectRows();
      redrawIfPossible();
    });
    el.captionColor.addEventListener("input", () => {
      state.captionColor = el.captionColor.value;
      redrawIfPossible();
    });
    el.captionEffect.addEventListener("change", () => {
      state.captionEffect = el.captionEffect.value;
      toggleEffectRows();
      redrawIfPossible();
    });
    if (el.textColor2) {
      el.textColor2.addEventListener("input", () => {
        state.textColor2 = el.textColor2.value;
        redrawIfPossible();
      });
    }
    if (el.textOutline) {
      el.textOutline.addEventListener("input", () => {
        state.textOutline = el.textOutline.value;
        redrawIfPossible();
      });
    }
    if (el.captionColor2) {
      el.captionColor2.addEventListener("input", () => {
        state.captionColor2 = el.captionColor2.value;
        redrawIfPossible();
      });
    }
    if (el.captionOutline) {
      el.captionOutline.addEventListener("input", () => {
        state.captionOutline = el.captionOutline.value;
        redrawIfPossible();
      });
    }

    toggleEffectRows();
    wirePalettePickers();
  }

  function toggleEffectRows() {
    const g = (eff) => String(eff).includes("gradient");
    const o = (eff) => String(eff).includes("outline");
    if (el.textGradRow) el.textGradRow.hidden = !g(state.textEffect);
    if (el.textOutlineRow) el.textOutlineRow.hidden = !o(state.textEffect);
    if (el.captionGradRow) el.captionGradRow.hidden = !g(state.captionEffect);
    if (el.captionOutlineRow) el.captionOutlineRow.hidden = !o(state.captionEffect);
  }

  /* ---------- stats ---------- */
  function renderStats() {
    if (el.countPhrases) el.countPhrases.textContent = Object.values(QUOTES).reduce((a, l) => a + l.length, 0);
    if (el.countCategories) el.countCategories.textContent = QUOTE_CATEGORIES.length;
    if (el.countStyles) el.countStyles.textContent = Object.keys(ART_STYLES).length;
    if (el.countFormats) el.countFormats.textContent = Object.keys(FLAT_FORMATS).length;
  }

  /* ---------- init ---------- */
  async function init() {
    renderStats();
    state.quote = pickQuote(state.category);
    renderPhrase();
    renderChips();
    applyStageFormat();
    renderGallery();
    renderRecent();
    initDaily();
    wireTextOptions();
    renderUsedCount();

    el.newPhrase.addEventListener("click", () => {
      pickQuote(state.category);
      renderPhrase();
    });
    el.copyPhrase.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(state.quote.text + " — " + state.quote.author);
        showToast("Frase copiada. ✧", "ok");
      } catch (e) {
        showToast("Não foi possível copiar neste navegador.", "warn");
      }
    });
    if (el.copyCaption) {
      el.copyCaption.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(el.captionText.value);
          showToast("Legenda copiada para colar no Instagram. ✧", "ok");
        } catch (e) {
          el.captionText.select();
          showToast("Selecione e copie com Ctrl+C.", "warn");
        }
      });
    }
    if (el.refreshCaption) {
      el.refreshCaption.addEventListener("click", refreshCaption);
    }
    el.generate.addEventListener("click", handleGenerate);
    el.download.addEventListener("click", downloadCard);
    if (el.downloadMp4) el.downloadMp4.addEventListener("click", handleGenerateMp4);
    el.share.addEventListener("click", openShare);
    if (el.galleryMore) el.galleryMore.addEventListener("click", renderGallery);

    el.carousel.addEventListener("click", openCarousel);
    el.carouselModal.addEventListener("click", (e) => {
      if (e.target.closest("[data-carousel-close]")) closeCarousel();
    });
    el.carouselGenerate.addEventListener("click", handleCarouselGenerate);
    el.carouselZip.addEventListener("click", downloadCarouselZip);
    el.carouselCaption.addEventListener("click", copyCarouselCaption);

    el.shareModal.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) closeShare();
    });
    wireLegal();
    wireCookieBar();
    wireContact();
    wireBackTop();
    wireNavToggle();
    if (el.cookieAccept) el.cookieAccept.addEventListener("click", acceptCookies);
    if (el.cookieMore) {
      el.cookieMore.addEventListener("click", () => {
        openLegal("privacy");
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && el.shareModal.classList.contains("open")) closeShare();
      if (e.key === "Escape" && el.carouselModal.classList.contains("open")) closeCarousel();
      if (e.key === "Escape" && el.legalModal.classList.contains("open")) closeLegal();
      if (e.key === "Escape" && el.contactModal.classList.contains("open")) closeContact();
      if (e.key === "Escape" && el.siteNav.classList.contains("open")) setMenu(false);
      if (e.key === "Enter" && e.target === document.body) handleGenerate();
    });
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-share]");
      if (btn) handleShare(btn.dataset.share);
    });

    try {
      await Promise.all([
        document.fonts.load("500 40px 'Cormorant Garamond'"),
        document.fonts.load("600 20px 'Poppins'"),
      ]);
    } catch (e) {}

    initParticles();
    initScrollReveal();
    initButtonRipple();
  }

  /* ---------- floating particles background ---------- */
  function initParticles() {
    const canvas = document.createElement("canvas");
    canvas.className = "particles-canvas";
    document.body.prepend(canvas);
    const c = canvas.getContext("2d");
    let w, h, particles = [], running = false, rafId = 0;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const COUNT = Math.min(30, Math.floor(w / 40));
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -Math.random() * 0.18 - 0.06,
        alpha: Math.random() * 0.4 + 0.15,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    function draw() {
      c.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.012;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fillStyle = "rgba(230,195,90," + a + ")";
        c.fill();
      }
      if (running) rafId = requestAnimationFrame(draw);
    }

    function start() { if (!running) { running = true; draw(); } }
    function stop() { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }

    const visObs = new IntersectionObserver(([entry]) => { entry.isIntersecting ? start() : stop(); }, { threshold: 0 });
    visObs.observe(canvas);

    document.addEventListener("visibilitychange", () => { document.hidden ? stop() : start(); });
    start();
  }

  /* ---------- scroll reveal ---------- */
  function initScrollReveal() {
    const sections = document.querySelectorAll(".section");
    const reveals = document.querySelectorAll(
      ".gallery-card, .daily-card, .about-card, .stat, .hero-eyebrow, .hero p.sub, .hero-actions, .hero-stats"
    );

    sections.forEach((s) => s.classList.add("reveal-up"));
    reveals.forEach((el, i) => {
      el.classList.add("reveal-up");
      el.classList.add("delay-" + ((i % 4) + 1));
    });

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".reveal-up").forEach((el) => obs.observe(el));

    /* hero elements visible immediately */
    document.querySelectorAll(".hero .reveal-up").forEach((el) => {
      el.classList.add("visible");
    });
  }

  /* ---------- button ripple / glow tracking ---------- */
  function initButtonRipple() {
    let lastRipple = 0;
    document.addEventListener("mousemove", (e) => {
      const now = Date.now();
      if (now - lastRipple < 32) return;
      lastRipple = now;
      const btn = e.target.closest(".btn");
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      btn.style.setProperty("--x", x + "%");
      btn.style.setProperty("--y", y + "%");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
