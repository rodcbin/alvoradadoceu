/* =========================================================
   Alvorada do Céu — utilidades: loader, toast e helpers
   ========================================================= */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const LOADER_MSG = [
  "Convidando a luz para a tela…",
  "Suavizando as cores do céu…",
  "Misturando paz e pixels…",
  "Quase sussurrando a frase…",
  "Iluminando cada detalhe…",
  "Abrindo janelas para o amanhecer…",
];

const BUSY_PHASES = [
  "✧ fase 1 — saudando o silêncio",
  "✧ fase 2 — pintando a atmosfera",
  "✧ fase 3 — revelando a mensagem",
];

let loaderTimer = null;

function showLoader() {
  const loader = $("#loader");
  const msgEl = $("#loader-msg");
  const phaseEl = $("#loader-phase");
  if (!loader || !msgEl) return;
  loader.classList.add("active");
  const cycle = (i) => {
    if (msgEl) msgEl.textContent = LOADER_MSG[i % LOADER_MSG.length];
  };
  let i = 0;
  cycle(0);
  loaderTimer = setInterval(() => {
    i++;
    cycle(i);
    if (phaseEl) {
      const p = Math.min(BUSY_PHASES.length - 1, Math.floor(i / 2));
      phaseEl.textContent = BUSY_PHASES[p];
    }
  }, 2000);
}

function hideLoader() {
  if (loaderTimer) clearInterval(loaderTimer);
  loaderTimer = null;
  const loader = $("#loader");
  if (loader) loader.classList.remove("active");
}

let toastTimer = null;

function showToast(msg, type = "info") {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.className = "toast " + type + " show";
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = "toast " + type;
  }, 3800);
}

/* timeout para chamadas à API interna — evita travamento indefinido */
(function () {
  if (typeof window.fetch !== "function") return;
  const origFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    try {
      const url = typeof input === "string" ? input : (input && input.url) || "";
      if (url.indexOf("/api/") === 0 || url.indexOf(location.origin + "/api/") === 0) {
        init = Object.assign({}, init);
        if (!init.signal && typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
          init.signal = AbortSignal.timeout(45000);
        }
      }
    } catch (e) { /* segue sem timeout */ }
    return origFetch(input, init);
  };
})();
