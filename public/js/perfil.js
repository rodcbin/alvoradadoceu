/* =========================================================
   Alvorada do Céu — Aba Perfil
   Capas de Destaques desenhadas em canvas + kit de conversão
   (bio, nome de busca, fixados e mockup do perfil).
   ========================================================= */
(function () {
  "use strict";

  const FW = 1080;
  const FH = 1920;
  const RING_R = 330;

  const state = {
    busy: false,
    style: "dark",
    palette: "noite",
    source: "auto",
    textMode: "none",
    icons: [],
    names: {},
    slides: [],
    bgImg: null,
    av: { variant: "sol", bg: "noite" },
    avatarBlob: null
  };

  const el = {};

  /* helpers locais (shuffle/sleep não existem no utils) */
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* =========================================================
     HELPERS DE UI
     ========================================================= */

  async function ensureCanvasFonts() {
    try {
      await Promise.all([
        document.fonts.load('600 46px Poppins'),
        document.fonts.load('700 90px "Playfair Display"'),
        document.fonts.load('500 30px Poppins')
      ]);
      await document.fonts.ready;
    } catch (e) { /* segue com fallback */ }
  }

  /* =========================================================
     ÍCONES — line-art sagrado desenhado traço a traço
     Cada função recebe ctx já transladado ao centro e u (lado da caixa).
     O traço (strokeStyle/lineWidth) já vem configurado de fora.
     ========================================================= */
  const ICON_DRAWERS = {
    fe(ctx, u) {
      ctx.beginPath();
      ctx.moveTo(0, -u * 0.42);
      ctx.lineTo(0, u * 0.46);
      ctx.moveTo(-u * 0.24, -u * 0.13);
      ctx.lineTo(u * 0.24, -u * 0.13);
      ctx.stroke();
      /* brilho: pontinho acima da cruz */
      dot(ctx, 0, -u * 0.52, u * 0.018);
    },

    paz(ctx, u) {
      ctx.beginPath();
      ctx.moveTo(u * 0.38, -u * 0.06);
      ctx.bezierCurveTo(u * 0.22, -u * 0.20, -u * 0.02, -u * 0.16, -u * 0.18, -u * 0.04);
      ctx.quadraticCurveTo(-u * 0.34, u * 0.06, -u * 0.42, u * 0.12);
      ctx.moveTo(-u * 0.40, u * 0.20);
      ctx.quadraticCurveTo(-u * 0.10, u * 0.20, u * 0.16, u * 0.06);
      ctx.quadraticCurveTo(u * 0.28, -u * 0.01, u * 0.38, -u * 0.06);
      ctx.stroke();
      /* asa levantada */
      ctx.beginPath();
      ctx.moveTo(-u * 0.04, -u * 0.10);
      ctx.quadraticCurveTo(-u * 0.06, -u * 0.34, -u * 0.26, -u * 0.42);
      ctx.quadraticCurveTo(-u * 0.26, -u * 0.20, -u * 0.12, -u * 0.08);
      ctx.stroke();
      /* olho */
      dot(ctx, u * 0.24, -u * 0.095, u * 0.016);
      /* ramo de oliveira no bico */
      ctx.beginPath();
      ctx.moveTo(u * 0.34, u * 0.02);
      ctx.quadraticCurveTo(u * 0.42, u * 0.10, u * 0.50, u * 0.22);
      ctx.stroke();
      leaf(ctx, u * 0.43, u * 0.115, -0.5, u * 0.075, u * 0.032);
      leaf(ctx, u * 0.49, u * 0.19, 0.9, u * 0.075, u * 0.032);
    },

    oracao(ctx, u) {
      ctx.beginPath();
      ctx.moveTo(-u * 0.30, u * 0.44);
      ctx.bezierCurveTo(-u * 0.27, u * 0.10, -u * 0.14, -u * 0.22, -u * 0.02, -u * 0.40);
      ctx.moveTo(u * 0.30, u * 0.44);
      ctx.bezierCurveTo(u * 0.27, u * 0.10, u * 0.14, -u * 0.22, u * 0.02, -u * 0.40);
      ctx.stroke();
      /* costura central das mãos */
      ctx.beginPath();
      ctx.moveTo(0, -u * 0.32);
      ctx.lineTo(0, u * 0.22);
      ctx.stroke();
      /* punhos */
      ctx.beginPath();
      ctx.moveTo(-u * 0.30, u * 0.44);
      ctx.quadraticCurveTo(-u * 0.17, u * 0.53, -u * 0.03, u * 0.47);
      ctx.moveTo(u * 0.30, u * 0.44);
      ctx.quadraticCurveTo(u * 0.17, u * 0.53, u * 0.03, u * 0.47);
      ctx.stroke();
      /* pequena cruz acima dos dedos */
      ctx.beginPath();
      ctx.moveTo(0, -u * 0.48);
      ctx.lineTo(0, -u * 0.60);
      ctx.moveTo(-u * 0.05, -u * 0.54);
      ctx.lineTo(u * 0.05, -u * 0.54);
      ctx.stroke();
    },

    luz(ctx, u) {
      /* corpo da vela */
      rr(ctx, -u * 0.14, u * 0.02, u * 0.28, u * 0.40, u * 0.04);
      ctx.stroke();
      /* pavio */
      ctx.beginPath();
      ctx.moveTo(0, u * 0.02);
      ctx.quadraticCurveTo(u * 0.02, -u * 0.03, 0, -u * 0.07);
      ctx.stroke();
      /* chama externa e interna */
      flame(ctx, 0, -u * 0.07, u * 0.11, u * 0.37);
      ctx.save();
      ctx.globalAlpha *= 0.65;
      flame(ctx, 0, -u * 0.09, u * 0.055, u * 0.20);
      ctx.restore();
      /* pratinho */
      ctx.beginPath();
      ctx.moveTo(-u * 0.24, u * 0.44);
      ctx.lineTo(u * 0.24, u * 0.44);
      ctx.stroke();
      /* fagulhas */
      sparkle(ctx, -u * 0.22, -u * 0.30, u * 0.045);
      sparkle(ctx, u * 0.24, -u * 0.36, u * 0.036);
      sparkle(ctx, u * 0.16, -u * 0.50, u * 0.026);
    },

    graca(ctx, u) {
      /* bojo do cálice */
      ctx.beginPath();
      ctx.moveTo(-u * 0.26, -u * 0.30);
      ctx.bezierCurveTo(-u * 0.25, -u * 0.04, -u * 0.11, u * 0.06, 0, u * 0.06);
      ctx.bezierCurveTo(u * 0.11, u * 0.06, u * 0.25, -u * 0.04, u * 0.26, -u * 0.30);
      ctx.closePath();
      ctx.stroke();
      /* haste e pé */
      ctx.beginPath();
      ctx.moveTo(0, u * 0.06);
      ctx.lineTo(0, u * 0.30);
      ctx.moveTo(-u * 0.17, u * 0.38);
      ctx.quadraticCurveTo(0, u * 0.29, u * 0.17, u * 0.38);
      ctx.stroke();
      /* hóstia com cruzinha */
      ctx.beginPath();
      ctx.arc(0, -u * 0.44, u * 0.09, 0, Math.PI * 2);
      ctx.stroke();
      ctx.save();
      ctx.globalAlpha *= 0.8;
      ctx.lineWidth *= 0.7;
      ctx.beginPath();
      ctx.moveTo(0, -u * 0.49);
      ctx.lineTo(0, -u * 0.39);
      ctx.moveTo(-u * 0.035, -u * 0.465);
      ctx.lineTo(u * 0.035, -u * 0.465);
      ctx.stroke();
      ctx.restore();
    },

    palavra(ctx, u) {
      /* lombada */
      ctx.beginPath();
      ctx.moveTo(0, -u * 0.26);
      ctx.lineTo(0, u * 0.30);
      ctx.stroke();
      /* capa esquerda e direita */
      ctx.beginPath();
      ctx.moveTo(0, -u * 0.26);
      ctx.bezierCurveTo(-u * 0.12, -u * 0.35, -u * 0.30, -u * 0.34, -u * 0.42, -u * 0.25);
      ctx.lineTo(-u * 0.42, u * 0.24);
      ctx.bezierCurveTo(-u * 0.28, u * 0.17, -u * 0.10, u * 0.20, 0, u * 0.30);
      ctx.moveTo(0, -u * 0.26);
      ctx.bezierCurveTo(u * 0.12, -u * 0.35, u * 0.30, -u * 0.34, u * 0.42, -u * 0.25);
      ctx.lineTo(u * 0.42, u * 0.24);
      ctx.bezierCurveTo(u * 0.28, u * 0.17, u * 0.10, u * 0.20, 0, u * 0.30);
      ctx.stroke();
      /* linhas de texto */
      ctx.save();
      ctx.globalAlpha *= 0.75;
      ctx.lineWidth *= 0.55;
      ctx.beginPath();
      ctx.moveTo(-u * 0.33, -u * 0.10); ctx.lineTo(-u * 0.10, -u * 0.14);
      ctx.moveTo(-u * 0.33, u * 0.00);  ctx.lineTo(-u * 0.10, -u * 0.04);
      ctx.moveTo(u * 0.10, -u * 0.14);  ctx.lineTo(u * 0.33, -u * 0.10);
      ctx.moveTo(u * 0.10, -u * 0.04);  ctx.lineTo(u * 0.33, u * 0.00);
      ctx.stroke();
      ctx.restore();
      /* fitinha */
      ctx.beginPath();
      ctx.moveTo(u * 0.10, u * 0.225);
      ctx.lineTo(u * 0.10, u * 0.40);
      ctx.lineTo(u * 0.155, u * 0.345);
      ctx.lineTo(u * 0.21, u * 0.40);
      ctx.lineTo(u * 0.21, u * 0.185);
      ctx.stroke();
    },

    milagre(ctx, u) {
      loaf(ctx, -u * 0.08, u * 0.10, u * 0.27, u * 0.135, -0.32, 3);
      loaf(ctx, u * 0.20, -u * 0.14, u * 0.175, u * 0.09, 0.26, 2);
      /* migalhas */
      dot(ctx, u * 0.34, u * 0.22, u * 0.014);
      dot(ctx, -u * 0.34, -u * 0.16, u * 0.014);
      dot(ctx, -u * 0.40, u * 0.30, u * 0.010);
    },

    colheita(ctx, u) {
      /* haste */
      ctx.beginPath();
      ctx.moveTo(0, u * 0.46);
      ctx.lineTo(0, -u * 0.12);
      ctx.stroke();
      /* grãos aos pares + topo */
      const ys = [-0.16, -0.26, -0.36];
      ys.forEach((y) => {
        ell(ctx, -u * 0.055, u * y, u * 0.042, u * 0.085, -0.45);
        ctx.stroke();
        ell(ctx, u * 0.055, u * y, u * 0.042, u * 0.085, 0.45);
        ctx.stroke();
      });
      ell(ctx, 0, -u * 0.46, u * 0.045, u * 0.09, 0);
      ctx.stroke();
      /* folha */
      ctx.beginPath();
      ctx.moveTo(0, u * 0.20);
      ctx.quadraticCurveTo(-u * 0.16, u * 0.16, -u * 0.21, u * 0.01);
      ctx.quadraticCurveTo(-u * 0.10, u * 0.07, 0, u * 0.13);
      ctx.stroke();
    },

    esperanca(ctx, u) {
      /* argola */
      ctx.beginPath();
      ctx.arc(0, -u * 0.365, u * 0.075, 0, Math.PI * 2);
      ctx.stroke();
      /* haste e travessa */
      ctx.beginPath();
      ctx.moveTo(0, -u * 0.29);
      ctx.lineTo(0, u * 0.31);
      ctx.moveTo(-u * 0.21, -u * 0.14);
      ctx.lineTo(u * 0.21, -u * 0.14);
      ctx.stroke();
      dot(ctx, -u * 0.235, -u * 0.14, u * 0.02);
      dot(ctx, u * 0.235, -u * 0.14, u * 0.02);
      /* unhas */
      ctx.beginPath();
      ctx.moveTo(-u * 0.28, u * 0.05);
      ctx.quadraticCurveTo(-u * 0.245, u * 0.335, 0, u * 0.36);
      ctx.quadraticCurveTo(u * 0.245, u * 0.335, u * 0.28, u * 0.05);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-u * 0.28, u * 0.05);
      ctx.lineTo(-u * 0.365, u * 0.135);
      ctx.moveTo(u * 0.28, u * 0.05);
      ctx.lineTo(u * 0.365, u * 0.135);
      ctx.stroke();
    },

    amor(ctx, u) {
      ctx.beginPath();
      ctx.moveTo(0, u * 0.36);
      ctx.bezierCurveTo(-u * 0.46, u * 0.04, -u * 0.32, -u * 0.36, 0, -u * 0.14);
      ctx.bezierCurveTo(u * 0.32, -u * 0.36, u * 0.46, u * 0.04, 0, u * 0.36);
      ctx.closePath();
      ctx.stroke();
      dot(ctx, -u * 0.16, -u * 0.40, u * 0.016);
      dot(ctx, 0, -u * 0.46, u * 0.02);
      dot(ctx, u * 0.16, -u * 0.40, u * 0.016);
    },

    natal(ctx, u) {
      ctx.beginPath();
      ctx.moveTo(0, -u * 0.46);
      ctx.quadraticCurveTo(u * 0.045, -u * 0.05, u * 0.30, 0);
      ctx.quadraticCurveTo(u * 0.045, u * 0.05, 0, u * 0.46);
      ctx.quadraticCurveTo(-u * 0.045, u * 0.05, -u * 0.30, 0);
      ctx.quadraticCurveTo(-u * 0.045, -u * 0.05, 0, -u * 0.46);
      ctx.closePath();
      ctx.stroke();
      /* raios diagonais curtos */
      ctx.save();
      ctx.globalAlpha *= 0.7;
      ctx.beginPath();
      ctx.moveTo(u * 0.10, -u * 0.10); ctx.lineTo(u * 0.17, -u * 0.17);
      ctx.moveTo(-u * 0.10, -u * 0.10); ctx.lineTo(-u * 0.17, -u * 0.17);
      ctx.moveTo(u * 0.10, u * 0.10);  ctx.lineTo(u * 0.17, u * 0.17);
      ctx.moveTo(-u * 0.10, u * 0.10); ctx.lineTo(-u * 0.17, u * 0.17);
      ctx.stroke();
      ctx.restore();
    },

    reino(ctx, u) {
      /* banda */
      rr(ctx, -u * 0.30, u * 0.22, u * 0.60, u * 0.14, u * 0.03);
      ctx.stroke();
      /* picos */
      ctx.beginPath();
      ctx.moveTo(-u * 0.30, u * 0.22);
      ctx.lineTo(-u * 0.30, -u * 0.10);
      ctx.lineTo(-u * 0.125, u * 0.055);
      ctx.lineTo(0, -u * 0.24);
      ctx.lineTo(u * 0.125, u * 0.055);
      ctx.lineTo(u * 0.30, -u * 0.10);
      ctx.lineTo(u * 0.30, u * 0.22);
      ctx.stroke();
      /* esferas das pontas */
      dot(ctx, -u * 0.30, -u * 0.165, u * 0.028);
      dot(ctx, 0, -u * 0.305, u * 0.028);
      dot(ctx, u * 0.30, -u * 0.165, u * 0.028);
      /* joias da banda */
      dot(ctx, -u * 0.12, u * 0.29, u * 0.014);
      dot(ctx, 0, u * 0.29, u * 0.018);
      dot(ctx, u * 0.12, u * 0.29, u * 0.014);
    },

    alvorada(ctx, u) {
      const cy = u * 0.16;
      /* sol nascendo */
      ctx.beginPath();
      ctx.arc(0, cy, u * 0.21, Math.PI, Math.PI * 2);
      ctx.stroke();
      /* raios */
      [233, 251, 270, 289, 307].forEach((deg) => {
        const rad = (deg * Math.PI) / 180;
        const c = Math.cos(rad), s = Math.sin(rad);
        ctx.beginPath();
        ctx.moveTo(c * u * 0.28, cy + s * u * 0.28);
        ctx.lineTo(c * u * 0.40, cy + s * u * 0.40);
        ctx.stroke();
      });
      /* mar */
      ctx.beginPath();
      ctx.moveTo(-u * 0.44, cy + u * 0.10);
      ctx.quadraticCurveTo(-u * 0.22, cy + u * 0.20, 0, cy + u * 0.10);
      ctx.quadraticCurveTo(u * 0.22, cy + u * 0.20, u * 0.44, cy + u * 0.10);
      ctx.moveTo(-u * 0.30, cy + u * 0.26);
      ctx.quadraticCurveTo(-u * 0.15, cy + u * 0.33, 0, cy + u * 0.26);
      ctx.quadraticCurveTo(u * 0.15, cy + u * 0.33, u * 0.30, cy + u * 0.26);
      ctx.stroke();
    },

    louvor(ctx, u) {
      /* braços da lira */
      ctx.beginPath();
      ctx.moveTo(-u * 0.25, u * 0.34);
      ctx.bezierCurveTo(-u * 0.34, -u * 0.06, -u * 0.20, -u * 0.38, 0, -u * 0.38);
      ctx.bezierCurveTo(u * 0.20, -u * 0.38, u * 0.34, -u * 0.06, u * 0.25, u * 0.34);
      ctx.stroke();
      /* base */
      ctx.beginPath();
      ctx.moveTo(-u * 0.25, u * 0.34);
      ctx.quadraticCurveTo(0, u * 0.44, u * 0.25, u * 0.34);
      ctx.stroke();
      /* travessa */
      ctx.beginPath();
      ctx.moveTo(-u * 0.235, -u * 0.255);
      ctx.quadraticCurveTo(0, -u * 0.315, u * 0.235, -u * 0.255);
      ctx.stroke();
      /* cordas */
      [-0.145, -0.05, 0.05, 0.145].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(u * x, -u * 0.285);
        ctx.lineTo(u * x, u * 0.335);
        ctx.stroke();
      });
    },

    jesus(ctx, u) {
      /* ichthys: dois arcos cruzados */
      ctx.beginPath();
      ctx.moveTo(-u * 0.38, u * 0.02);
      ctx.quadraticCurveTo(0, -u * 0.36, u * 0.28, -u * 0.01);
      ctx.moveTo(-u * 0.38, u * 0.02);
      ctx.quadraticCurveTo(0, u * 0.32, u * 0.28, -u * 0.01);
      ctx.stroke();
      /* cauda */
      ctx.beginPath();
      ctx.moveTo(u * 0.28, -u * 0.01);
      ctx.lineTo(u * 0.47, -u * 0.17);
      ctx.moveTo(u * 0.28, -u * 0.01);
      ctx.lineTo(u * 0.47, u * 0.15);
      ctx.stroke();
      dot(ctx, -u * 0.20, -u * 0.055, u * 0.016);
    },

    eterno(ctx, u) {
      /* cruz dentro do círculo radiante */
      ctx.beginPath();
      ctx.arc(0, 0, u * 0.30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -u * 0.42);
      ctx.lineTo(0, u * 0.42);
      ctx.moveTo(-u * 0.22, -u * 0.12);
      ctx.lineTo(u * 0.22, -u * 0.12);
      ctx.stroke();
      [0, 45, 90, 135].forEach((deg) => {
        const rad = (deg * Math.PI) / 180;
        const c = Math.cos(rad), s = Math.sin(rad);
        ctx.beginPath();
        ctx.moveTo(c * u * 0.36, s * u * 0.36);
        ctx.lineTo(c * u * 0.45, s * u * 0.45);
        ctx.moveTo(-c * u * 0.36, -s * u * 0.36);
        ctx.lineTo(-c * u * 0.45, -s * u * 0.45);
        ctx.stroke();
      });
    }
  };

  /* pequenos primitivos usados pelos ícones */
  function dot(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function ell(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  }
  function leaf(ctx, x, y, rot, len, wid) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.6, -wid, len, 0);
    ctx.quadraticCurveTo(len * 0.6, wid, 0, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  function flame(ctx, cx, cy, rw, rh) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(cx + rw, cy - rh * 0.32, cx + rw * 0.72, cy - rh * 0.82, cx, cy - rh);
    ctx.bezierCurveTo(cx - rw * 0.72, cy - rh * 0.82, cx - rw, cy - rh * 0.32, cx, cy);
    ctx.closePath();
    ctx.stroke();
  }
  function sparkle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.35, y - r * 0.35);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x + r * 0.35, y + r * 0.35);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r * 0.35, y + r * 0.35);
    ctx.lineTo(x - r, y);
    ctx.lineTo(x - r * 0.35, y - r * 0.35);
    ctx.closePath();
    ctx.stroke();
  }
  function loaf(ctx, cx, cy, rx, ry, rot, scores) {
    ell(ctx, cx, cy, rx, ry, rot);
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.globalAlpha *= 0.75;
    ctx.lineWidth *= 0.6;
    for (let i = 0; i < scores; i++) {
      const sx = -rx * 0.5 + (i * rx) / scores;
      ctx.beginPath();
      ctx.moveTo(sx, -ry * 0.55);
      ctx.lineTo(sx + rx * 0.12, -ry * 0.15);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* desenha um ícone qualquer num canvas pequeno (chips do seletor) */
  function renderIconPreview(canvas, iconId) {
    const s = 88;
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, s, s);
    ctx.translate(s / 2, s / 2);
    ctx.strokeStyle = "#e8c55e";
    ctx.fillStyle = "#e8c55e";
    ctx.lineWidth = s * 0.05;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const fn = ICON_DRAWERS[iconId];
    if (fn) fn(ctx, s * 0.86);
  }

  /* =========================================================
     FUNDOS DAS CAPAS
     ========================================================= */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
  }

  function goldStroke(ctx, y0, y1, dark) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    if (dark) {
      g.addColorStop(0, "#f6dd94");
      g.addColorStop(0.5, "#e8c55e");
      g.addColorStop(1, "#c79b3a");
    } else {
      g.addColorStop(0, "#b98a2e");
      g.addColorStop(0.5, "#8f6a1f");
      g.addColorStop(1, "#6f520f");
    }
    return g;
  }

  function paintDarkBase(ctx) {
    const g = ctx.createRadialGradient(FW / 2, FH * 0.42, 80, FW / 2, FH * 0.5, FH * 0.72);
    g.addColorStop(0, "#171331");
    g.addColorStop(0.55, "#0d0a20");
    g.addColorStop(1, "#05040c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FW, FH);
    /* poeira dourada */
    const rnd = mulberry32(77);
    for (let i = 0; i < 130; i++) {
      const x = rnd() * FW, y = rnd() * FH;
      const r = rnd() * 2.2 + 0.4;
      ctx.globalAlpha = rnd() * 0.35 + 0.04;
      ctx.fillStyle = rnd() > 0.25 ? "#e8c55e" : "#fff9e3";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function paintLightBase(ctx) {
    ctx.fillStyle = "#f6efdd";
    ctx.fillRect(0, 0, FW, FH);
    const g = ctx.createRadialGradient(FW / 2, FH * 0.4, 120, FW / 2, FH * 0.5, FH * 0.7);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(196,168,106,0.16)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FW, FH);
    const rnd = mulberry32(21);
    ctx.fillStyle = "#8a6d3b";
    for (let i = 0; i < 90; i++) {
      ctx.globalAlpha = rnd() * 0.05;
      ctx.beginPath();
      ctx.arc(rnd() * FW, rnd() * FH, rnd() * 1.6 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function paintBibleBase(ctx, seed) {
    ctx.fillStyle = "#efe4c8";
    ctx.fillRect(0, 0, FW, FH);
    const rnd = mulberry32(seed || 5);
    /* manchas de envelhecimento */
    for (let i = 0; i < 26; i++) {
      const x = rnd() * FW, y = rnd() * FH, r = 60 + rnd() * 190;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const warm = rnd() > 0.5 ? "176,140,74" : "150,118,62";
      g.addColorStop(0, "rgba(" + warm + "," + (rnd() * 0.10 + 0.03).toFixed(3) + ")");
      g.addColorStop(1, "rgba(" + warm + ",0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    /* vinhetas de borda */
    const vg = ctx.createLinearGradient(0, 0, FW, 0);
    vg.addColorStop(0, "rgba(120,90,40,0.14)");
    vg.addColorStop(0.08, "rgba(120,90,40,0)");
    vg.addColorStop(0.92, "rgba(120,90,40,0)");
    vg.addColorStop(1, "rgba(120,90,40,0.14)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, FW, FH);
    /* pontinhos de foxing */
    ctx.fillStyle = "#7a5c26";
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = rnd() * 0.09;
      ctx.beginPath();
      ctx.arc(rnd() * FW, rnd() * FH, rnd() * 1.8 + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function paintDuoBase(ctx, palette) {
    const g = ctx.createLinearGradient(0, 0, FW * 0.25, FH);
    g.addColorStop(0, palette.top);
    g.addColorStop(1, palette.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FW, FH);
    /* brilho suave atrás do anel */
    const glow = ctx.createRadialGradient(FW / 2, FH * 0.46, 40, FW / 2, FH * 0.46, 560);
    glow.addColorStop(0, hexA(palette.glow, 0.30));
    glow.addColorStop(1, hexA(palette.glow, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, FW, FH);
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  function paintPhotoBase(ctx, img) {
    const scale = Math.max(FW / img.width, FH / img.height);
    const w = img.width * scale, h = img.height * scale;
    ctx.drawImage(img, (FW - w) / 2, (FH - h) / 2, w, h);
    const sc = ctx.createLinearGradient(0, 0, 0, FH);
    sc.addColorStop(0, "rgba(5,4,12,0.55)");
    sc.addColorStop(0.5, "rgba(5,4,12,0.38)");
    sc.addColorStop(1, "rgba(5,4,12,0.68)");
    ctx.fillStyle = sc;
    ctx.fillRect(0, 0, FW, FH);
  }

  /* ornamentos comuns a todos os estilos */
  function paintFrameAndFlourish(ctx, ink, alphaMul) {
    const a = alphaMul == null ? 1 : alphaMul;
    ctx.save();
    ctx.strokeStyle = ink;
    ctx.lineCap = "round";
    /* moldura dupla */
    ctx.globalAlpha = 0.35 * a;
    ctx.lineWidth = 3;
    ctx.strokeRect(46, 46, FW - 92, FH - 92);
    ctx.globalAlpha = 0.16 * a;
    ctx.lineWidth = 2;
    ctx.strokeRect(62, 62, FW - 124, FH - 124);
    /* cantos em L */
    ctx.globalAlpha = 0.85 * a;
    ctx.lineWidth = 5;
    const L = 92, o = 84;
    [[o, o, 1, 1], [FW - o, o, -1, 1], [o, FH - o, 1, -1], [FW - o, FH - o, -1, -1]].forEach(([x, y, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(x + sx * L, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + sy * L);
      ctx.stroke();
      ctx.globalAlpha = 0.4 * a;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + sx * (L - 18), y + sy * 12);
      ctx.lineTo(x + sx * 12, y + sy * (L - 18));
      ctx.stroke();
      ctx.globalAlpha = 0.85 * a;
      ctx.lineWidth = 5;
    });
    ctx.restore();
  }

  /* =========================================================
     A CAPA COMPLETA (1080×1920)
     ========================================================= */
  function drawCover(ctx, icon, index, opts) {
    const style = opts.style;
    const isDarkInk = style === "dark" || style === "duo" || style === "photo";
    const pal = opts.palette;

    /* fundo */
    if (style === "dark") paintDarkBase(ctx);
    else if (style === "light") paintLightBase(ctx);
    else if (style === "bible") paintBibleBase(ctx, 1000 + index * 97);
    else if (style === "duo") paintDuoBase(ctx, pal);
    else if (style === "photo") {
      if (opts.bgImg) paintPhotoBase(ctx, opts.bgImg);
      else paintDuoBase(ctx, pal);
    }

    const cy = FH * 0.46;
    const cx = FW / 2;

    /* disco interno levemente protegido */
    ctx.save();
    const disc = ctx.createRadialGradient(cx, cy, RING_R * 0.2, cx, cy, RING_R);
    if (isDarkInk) {
      disc.addColorStop(0, "rgba(4,3,10,0.42)");
      disc.addColorStop(1, "rgba(4,3,10,0.12)");
    } else {
      disc.addColorStop(0, "rgba(255,252,240,0.5)");
      disc.addColorStop(1, "rgba(255,252,240,0.12)");
    }
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(cx, cy, RING_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* anéis dourados */
    const ringGrad = goldStroke(ctx, cy - RING_R, cy + RING_R, isDarkInk);
    ctx.strokeStyle = isDarkInk ? ringGrad : goldStroke(ctx, cy - RING_R, cy + RING_R, false);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, RING_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(cx, cy, RING_R - 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([2, 16]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, RING_R + 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    /* ícone */
    ctx.save();
    ctx.translate(cx, cy - (opts.textMode === "name" ? 26 : 0));
    const iconSize = 330;
    ctx.strokeStyle = goldStroke(ctx, -iconSize / 2, iconSize / 2, isDarkInk);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = iconSize * 0.052;
    const fn = ICON_DRAWERS[icon.id];
    if (fn) fn(ctx, iconSize);
    ctx.restore();

    /* nome gravado */
    if (opts.textMode === "name") {
      const label = (opts.name || icon.name || icon.label).toUpperCase();
      ctx.save();
      ctx.font = '600 44px Poppins, sans-serif';
      try { ctx.letterSpacing = "10px"; } catch (e) { /* navegador antigo */ }
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = goldStroke(ctx, cy + 180, cy + 250, isDarkInk);
      let text = label;
      while (ctx.measureText(text).width > RING_R * 1.55 && text.length > 4) text = text.slice(0, -1);
      ctx.fillText(text, cx, cy + 218);
      /* filete sob o nome */
      const tw = Math.min(ctx.measureText(text).width + 40, RING_R * 1.7);
      ctx.strokeStyle = ctx.fillStyle;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - tw / 2, cy + 256);
      ctx.lineTo(cx + tw / 2, cy + 256);
      ctx.stroke();
      ctx.restore();
    }

    /* molduras e assinatura */
    const frameInk = isDarkInk ? "#e8c55e" : "#8a6d3b";
    paintFrameAndFlourish(ctx, frameInk);

    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.font = '500 26px Poppins, sans-serif';
    try { ctx.letterSpacing = "8px"; } catch (e) {}
    ctx.textAlign = "center";
    ctx.fillStyle = frameInk;
    ctx.fillText("ALVORADA DO CÉU ✧", FW / 2, FH - 108);
    ctx.restore();
  }

  /* =========================================================
     FONTES DE IMAGEM (estilo foto)
     ========================================================= */
  function loadImg(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("imagem falhou"));
      img.src = url;
    });
  }
  async function cfImage(prompt) {
    const res = await fetch("/api/cf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, steps: 24 })
    });
    if (!res.ok) throw new Error("cf indisponível");
    const data = await res.json();
    return loadImg(data.image || data.url);
  }
  async function pollImage(prompt) {
    return loadImg("/api/image?prompt=" + encodeURIComponent(prompt) + "&width=900&height=1600&nologo=true&seed=" + Math.floor(Math.random() * 99999));
  }
  async function stockPhoto(provider, query) {
    const base = provider === "pexels" ? "/api/pexels" : "/api/pixabay";
    const extra = provider === "pixabay" ? "&min_width=800&min_height=1200" : "&orientation=portrait";
    const res = await fetch(base + "/photos?q=" + encodeURIComponent(query) + "&per_page=12" + extra);
    if (!res.ok) throw new Error(provider + " indisponível");
    const data = await res.json();
    const hits = data.photos || data.hits || [];
    if (!hits.length) throw new Error(provider + " sem resultados");
    const pick = hits[Math.floor(Math.random() * Math.min(hits.length, 6))];
    const big = (pick.src && (pick.src.large2x || pick.src.large || pick.src.original)) || pick.webformatURL || pick.largeImageURL;
    return loadImg(base + "/proxy?url=" + encodeURIComponent(big));
  }

  async function fetchKitBackground(statusFn) {
    const order = {
      auto: ["cf", "poll", "pexels", "pixabay"],
      cf: ["cf", "poll", "pexels"],
      poll: ["poll", "pexels", "pixabay"],
      pexels: ["pexels", "pixabay", "poll"],
      pixabay: ["pixabay", "pexels", "poll"]
    }[state.source] || ["poll", "pexels"];
    const theme = PERFIL_PHOTO_THEMES[Math.floor(Math.random() * PERFIL_PHOTO_THEMES.length)];
    const prompt = theme + ", cinematic golden light, spiritual, elegant, vertical";
    for (const src of order) {
      try {
        statusFn && statusFn(src === "cf" ? "Criando arte com Cloudflare FLUX…" : src === "poll" ? "Criando arte com IA…" : "Buscando foto em " + src + "…");
        let img;
        if (src === "cf") img = await cfImage(prompt);
        else if (src === "poll") img = await pollImage(prompt);
        else img = await stockPhoto(src, theme);
        if (img) return img;
      } catch (e) { /* tenta a próxima fonte */ }
    }
    return null;
  }

  /* =========================================================
     GERAÇÃO DO KIT
     ========================================================= */
  function setProgress(pct, msg) {
    el.progressRow.classList.add("show");
    el.progressFill.style.width = pct + "%";
    el.progressStatus.textContent = msg;
  }
  function hideProgress() {
    el.progressRow.classList.remove("show");
    el.progressFill.style.width = "0%";
  }

  async function handleGenerate(silentToast) {
    if (state.busy) return;
    if (!state.icons.length) {
      showToast("Escolha pelo menos um símbolo para a capa. ✨", "warn");
      return;
    }
    state.busy = true;
    el.btnGenerate.disabled = true;
    el.btnDownload.disabled = true;
    el.strip.hidden = true;
    el.strip.innerHTML = "";
    el.canvas.hidden = false;
    el.placeholder.hidden = true;
    state.slides = [];

    await ensureCanvasFonts();
    setProgress(4, "Preparando o ateliê…");

    /* uma única foto para o kit inteiro — coesão visual */
    let bgImg = null;
    if (state.style === "photo") {
      bgImg = await fetchKitBackground((m) => setProgress(8, m));
      if (!bgImg) showToast("Foto indisponível — usando degradê duotone como plano B. 🌗", "warn");
    }
    state.bgImg = bgImg;

    const pal = PERFIL_PALETTES.find((p) => p.id === state.palette) || PERFIL_PALETTES[0];
    const total = state.icons.length;
    const offscreen = document.createElement("canvas");

    try {
      for (let i = 0; i < total; i++) {
        const icon = state.icons[i];
        setProgress(10 + (i / total) * 78, "Desenhando capa " + (i + 1) + " de " + total + " — " + icon.label + "…");

        offscreen.width = FW;
        offscreen.height = FH;
        const ctx = offscreen.getContext("2d");
        drawCover(ctx, icon, i, {
          style: state.style,
          palette: pal,
          bgImg: bgImg,
          textMode: state.textMode,
          name: state.names[icon.id]
        });

        /* mostra a primeira na hora */
        if (i === 0) {
          el.canvas.width = FW;
          el.canvas.height = FH;
          el.stage.style.aspectRatio = FW + "/" + FH;
          el.canvas.getContext("2d").drawImage(offscreen, 0, 0);
        }
        state.slides.push({
          url: offscreen.toDataURL("image/png"),
          name: state.names[icon.id] || icon.name || icon.label,
          file: "destaque-" + slug(icon.id) + ".png"
        });
        await sleep(30);
      }

      setProgress(94, "Finalizando o kit…");
      finishWithSlides();
      renderMockHighlights();
      setProgress(100, "Kit pronto! 🎉");
      setTimeout(hideProgress, 900);
      if (!silentToast) showToast(total + " capas geradas — baixe todas e monte os seus Destaques. 👑", "ok");
    } catch (err) {
      console.error("perfil:", err);
      setProgress(0, "");
      hideProgress();
      el.canvas.hidden = true;
      el.placeholder.hidden = false;
      showToast("Algo falhou ao desenhar. Tente novamente.", "warn");
    } finally {
      state.busy = false;
      el.btnGenerate.disabled = false;
    }
  }

  function slug(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "capa";
  }

  function finishWithSlides() {
    el.strip.hidden = false;
    el.strip.innerHTML = "";
    state.slides.forEach((sl, idx) => {
      const thumb = document.createElement("div");
      thumb.className = "cs-thumb reveal-up visible";
      thumb.style.aspectRatio = "9 / 16";
      const img = document.createElement("img");
      img.src = sl.url;
      img.alt = sl.name;
      const num = document.createElement("span");
      num.className = "cs-num";
      num.textContent = String(idx + 1);
      const dl = document.createElement("button");
      dl.type = "button";
      dl.className = "cs-dl";
      dl.textContent = "⬇ " + sl.name;
      dl.addEventListener("click", () => {
        triggerDownload(sl.url, sl.file);
        showToast("Capa baixada: " + sl.file, "ok");
      });
      thumb.appendChild(img);
      thumb.appendChild(num);
      thumb.appendChild(dl);
      el.strip.appendChild(thumb);
    });
    el.btnDownload.disabled = false;
    el.downloadNote.hidden = false;
  }

  function triggerDownload(dataUrl, filename) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function downloadAll() {
    if (!state.slides.length) return;
    el.btnDownload.disabled = true;
    showToast("Baixando " + state.slides.length + " capas…", "ok");
    for (const sl of state.slides) {
      triggerDownload(sl.url, sl.file);
      await sleep(420);
    }
    el.btnDownload.disabled = false;
    el.downloadNote.textContent = state.slides.length + " capas salvas. No Instagram: Editar destaque → Editar capa → escolher imagem.";
  }

  /* =========================================================
     MOCKUP DO PERFIL
     ========================================================= */
  function renderMockHighlights() {
    el.mockHighlights.innerHTML = "";
    if (!state.slides.length) {
      PERFIL_ORDER_TIP.slice(0, 8).forEach((label) => {
        const item = document.createElement("div");
        item.className = "mh-item";
        const ring = document.createElement("div");
        ring.className = "mh-ring";
        const empty = document.createElement("div");
        empty.className = "mh-empty";
        empty.textContent = label;
        ring.appendChild(empty);
        const input = document.createElement("input");
        input.className = "mh-name";
        input.value = label;
        input.readOnly = true;
        item.appendChild(ring);
        item.appendChild(input);
        el.mockHighlights.appendChild(item);
      });
      return;
    }
    state.slides.forEach((sl, idx) => {
      const icon = state.icons[idx];
      const item = document.createElement("div");
      item.className = "mh-item";
      const ring = document.createElement("div");
      ring.className = "mh-ring";
      const img = document.createElement("img");
      img.src = sl.url;
      img.alt = sl.name;
      ring.appendChild(img);
      const input = document.createElement("input");
      input.className = "mh-name";
      input.value = sl.name;
      input.setAttribute("aria-label", "Nome do destaque");
      input.addEventListener("input", () => {
        sl.name = input.value.trim() || sl.name;
        if (icon) state.names[icon.id] = sl.name;
        saveNamesText();
      });
      item.appendChild(ring);
      item.appendChild(input);
      el.mockHighlights.appendChild(item);
    });
  }

  function saveNamesText() {
    el.namesText.value = state.icons.map((ic) => state.names[ic.id] || ic.name || ic.label).join("\n");
  }

  /* =========================================================
     BIO · NOME · HASHTAGS · FIXADOS
     ========================================================= */
  function buildBio() {
    const tpl = randomItem(PERFIL_BIO_TEMPLATES);
    return tpl.map((line) => {
      const obj = typeof line === "string" ? { t: line } : line;
      return obj.t
        .replace("{missao}", randomItem(PERFIL_BIO_MISSOES))
        .replace("{promessa}", randomItem(PERFIL_BIO_PROMESSAS))
        .replace("{cta}", randomItem(PERFIL_BIO_CTAS))
        .replace("{lema}", randomItem(PERFIL_BIO_LEMAS))
        .replace("{pagina}", "Alvorada do Céu ✝️");
    }).join("\n");
  }

  function refreshBioCount() {
    const len = el.bioText.value.length;
    el.bioCount.textContent = len + " / 150";
    el.bioCount.classList.toggle("over", len > 150);
  }

  function refreshMockBio() {
    el.mockBio.textContent = el.bioText.value.trim() || "Gere a sua bio abaixo e ela aparece aqui.";
  }

  function buildTags() {
    const pack = randomItem(PERFIL_HASHTAG_PACKS);
    return pack.join(" ");
  }

  async function copyText(text, okMsg) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(okMsg, "ok");
    } catch (e) {
      showToast("Não consegui copiar — selecione e copie manualmente.", "warn");
    }
  }

  function renderPinned() {
    el.pinnedGrid.innerHTML = "";
    PERFIL_PINNED.forEach((pin) => {
      const card = document.createElement("div");
      card.className = "tip reveal-up delay-1";
      const ico = document.createElement("span");
      ico.className = "t-ico";
      ico.textContent = pin.icon;
      const h = document.createElement("h4");
      h.textContent = pin.title;
      const why = document.createElement("p");
      why.textContent = pin.why;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-ghost btn-sm btn-copy-pin";
      btn.textContent = "⧉ Copiar legenda sugerida";
      btn.addEventListener("click", () => copyText(pin.caption, "Legenda copiada — cole no post fixado. 📌"));
      card.appendChild(ico);
      card.appendChild(h);
      card.appendChild(why);
      card.appendChild(btn);
      el.pinnedGrid.appendChild(card);
    });
  }

  function renderGrowthTips() {
    el.growthTips.innerHTML = "";
    PERFIL_GROWTH_TIPS.forEach((tip, i) => {
      const card = document.createElement("div");
      card.className = "tip reveal-up" + (i % 2 ? " delay-2" : " delay-1");
      const ico = document.createElement("span");
      ico.className = "t-ico";
      ico.textContent = tip.ico;
      const h = document.createElement("h4");
      h.textContent = tip.title;
      const p = document.createElement("p");
      p.textContent = tip.text;
      card.appendChild(ico);
      card.appendChild(h);
      card.appendChild(p);
      el.growthTips.appendChild(card);
    });
  }

  function renderOrderStrip() {
    el.orderStrip.innerHTML = "";
    PERFIL_ORDER_TIP.forEach((label, i) => {
      const pill = document.createElement("span");
      pill.className = "order-pill";
      pill.textContent = (i + 1) + " · " + label;
      el.orderStrip.appendChild(pill);
      if (i < PERFIL_ORDER_TIP.length - 1) {
        const arrow = document.createElement("span");
        arrow.className = "order-arrow";
        arrow.textContent = "→";
        el.orderStrip.appendChild(arrow);
      }
    });
  }

  /* =========================================================
     CHIPS / ESTADO
     ========================================================= */
  function makeChip(label, cls) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls || "chip";
    b.innerHTML = label;
    return b;
  }

  function renderChips() {
    /* estilos */
    el.styleChips.innerHTML = "";
    Object.entries(PERFIL_STYLES).forEach(([k, s]) => {
      const b = makeChip(s.label);
      if (k === state.style) b.classList.add("active");
      b.title = s.desc;
      b.addEventListener("click", () => { state.style = k; renderChips(); savePrefs(); });
      el.styleChips.appendChild(b);
    });
    const st = PERFIL_STYLES[state.style];
    el.styleHint.textContent = "✦ " + st.desc;
    el.paletteOptions.hidden = state.style !== "duo";
    el.sourceOptions.hidden = state.style !== "photo";

    /* paletas */
    el.paletteChips.innerHTML = "";
    PERFIL_PALETTES.forEach((p) => {
      const b = makeChip(p.label);
      if (p.id === state.palette) b.classList.add("active");
      b.addEventListener("click", () => { state.palette = p.id; renderChips(); savePrefs(); });
      el.paletteChips.appendChild(b);
    });

    /* fontes de foto */
    el.sourceChips.innerHTML = "";
    Object.entries(PERFIL_SOURCES).forEach(([k, s]) => {
      const b = makeChip(s.label);
      if (k === state.source) b.classList.add("active");
      b.title = s.desc;
      b.addEventListener("click", () => { state.source = k; renderChips(); savePrefs(); });
      el.sourceChips.appendChild(b);
    });

    /* grade de ícones */
    el.iconGrid.innerHTML = "";
    PERFIL_ICONS.forEach((icon) => {
      const b = makeChip("", "icon-chip" + (state.icons.some((i) => i.id === icon.id) ? " active" : ""));
      b.title = icon.hint;
      const cv = document.createElement("canvas");
      cv.width = 88; cv.height = 88;
      renderIconPreview(cv, icon.id);
      const span = document.createElement("span");
      span.textContent = icon.label;
      b.appendChild(cv);
      b.appendChild(span);
      b.addEventListener("click", () => {
        const found = state.icons.findIndex((i) => i.id === icon.id);
        if (found >= 0) state.icons.splice(found, 1);
        else state.icons.push(icon);
        b.classList.toggle("active");
        updateIconCount();
        saveNamesText();
        savePrefs();
      });
      el.iconGrid.appendChild(b);
    });
    updateIconCount();

    /* texto na capa */
    el.textmodeChips.innerHTML = "";
    Object.entries(PERFIL_TEXTMODES).forEach(([k, tm]) => {
      const b = makeChip(tm.label);
      if (k === state.textMode) b.classList.add("active");
      b.title = tm.desc;
      b.addEventListener("click", () => { state.textMode = k; renderChips(); savePrefs(); });
      el.textmodeChips.appendChild(b);
    });
    el.namesBox.hidden = state.textMode !== "name";
    updateEngineNote();
  }

  function updateIconCount() {
    el.iconCount.textContent = state.icons.length
      ? "✦ " + state.icons.length + (state.icons.length === 1 ? " símbolo selecionado" : " símbolos selecionados") + " — cada um vira uma capa."
      : "✦ Selecione de 4 a 8 símbolos: destaques demais viram poluição.";
  }

  function updateEngineNote() {
    const parts = [];
    parts.push(PERFIL_STYLES[state.style].label.replace(/^[^\s]+\s/, ""));
    if (state.style === "duo") {
      const pal = PERFIL_PALETTES.find((p) => p.id === state.palette);
      if (pal) parts.push(pal.label);
    }
    parts.push(state.icons.length + " capas");
    parts.push(PERFIL_TEXTMODES[state.textMode].label.toLowerCase());
    el.engineNote.textContent = parts.join(" · ") + " · PNG 1080×1920";
  }

  function renderNameKeywords() {
    el.nameChips.innerHTML = "";
    PERFIL_NAME_KEYWORDS.forEach((kw) => {
      const b = makeChip(kw);
      b.addEventListener("click", () => {
        copyText("Seu Nome | " + kw, 'Copiado! Cole no campo Nome do perfil e troque "Seu Nome". 🔍');
      });
      el.nameChips.appendChild(b);
    });
  }

  /* =========================================================
     SURPRESA
     ========================================================= */
  async function surprise(fromHero) {
    if (state.busy) return;
    state.style = randomItem(Object.keys(PERFIL_STYLES));
    state.palette = randomItem(PERFIL_PALETTES).id;
    state.source = "auto";
    state.textMode = randomItem(["none", "none", "name"]);
    const count = 4 + Math.floor(Math.random() * 3);
    state.icons = shuffle(PERFIL_ICONS.slice()).slice(0, count);
    state.icons.forEach((ic) => { delete state.names[ic.id]; });
    savePrefs();
    renderChips();
    saveNamesText();
    if (fromHero) $("#estudio").scrollIntoView({ behavior: "smooth" });
    showToast("Sorteei " + count + " símbolos num kit " + PERFIL_STYLES[state.style].label.replace(/^[^\s]+\s/, "") + ". Gerando… 🎲", "ok");
    await sleep(350);
    handleGenerate(true);
  }

  /* =========================================================
     KIT RECOMENDADO
     ========================================================= */
  async function applyRecommendedKit() {
    if (state.busy) return;
    state.icons = PERFIL_RECOMMENDED.map((r) => {
      const base = PERFIL_ICONS.find((i) => i.id === r.icon);
      return base ? Object.assign({}, base) : null;
    }).filter(Boolean);
    state.icons.forEach((ic) => {
      const r = PERFIL_RECOMMENDED.find((x) => x.icon === ic.id);
      if (r) state.names[ic.id] = r.name;
    });
    state.textMode = "name";
    savePrefs();
    renderChips();
    saveNamesText();
    showToast("Kit da jornada montado: 8 capas nomeadas. Gerando… ✨", "ok");
    await sleep(300);
    handleGenerate(true);
  }

  /* =========================================================
     AVATAR 1080×1080
     ========================================================= */
  function drawSunIcon(ctx, u) {
    /* sol da marca: disco, raios e mar logo abaixo */
    ctx.beginPath();
    ctx.arc(0, -u * 0.06, u * 0.20, 0, Math.PI * 2);
    ctx.stroke();
    [150, 170, 190, 210, 230, 250, 270, 290, 310].forEach((deg) => {
      const rad = (deg * Math.PI) / 180;
      const c = Math.cos(rad), s = Math.sin(rad);
      ctx.beginPath();
      ctx.moveTo(c * u * 0.27, -u * 0.06 + s * u * 0.27);
      ctx.lineTo(c * u * 0.36, -u * 0.06 + s * u * 0.36);
      ctx.stroke();
    });
    /* montanhas/mar */
    ctx.beginPath();
    ctx.moveTo(-u * 0.40, u * 0.30);
    ctx.lineTo(-u * 0.16, u * 0.02);
    ctx.lineTo(-u * 0.04, u * 0.16);
    ctx.moveTo(u * 0.40, u * 0.30);
    ctx.lineTo(u * 0.18, u * 0.05);
    ctx.lineTo(u * 0.06, u * 0.18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-u * 0.42, u * 0.34);
    ctx.quadraticCurveTo(-u * 0.21, u * 0.42, 0, u * 0.34);
    ctx.quadraticCurveTo(u * 0.21, u * 0.42, u * 0.42, u * 0.34);
    ctx.stroke();
  }

  function drawAvatar(ctx, S) {
    const bg = AVATAR_BACKGROUNDS[state.av.bg] || AVATAR_BACKGROUNDS.noite;
    const lightBg = !!bg.light;

    /* fundo */
    const g = ctx.createLinearGradient(0, 0, S * 0.2, S);
    g.addColorStop(0, bg.top);
    g.addColorStop(1, bg.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);

    /* brilho central */
    const glow = ctx.createRadialGradient(S / 2, S * 0.48, 30, S / 2, S * 0.48, S * 0.52);
    glow.addColorStop(0, hexA(bg.glow, lightBg ? 0.5 : 0.3));
    glow.addColorStop(1, hexA(bg.glow, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, S, S);

    const cx = S / 2, cy = S * 0.47;

    /* anel duplo */
    const ringGrad = ctx.createLinearGradient(0, cy - 440, 0, cy + 440);
    ringGrad.addColorStop(0, bg.ink);
    ringGrad.addColorStop(1, hexA(bg.ink, 0.55));
    ctx.strokeStyle = ringGrad;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, 430, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 396, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    /* pontinhos orbitando o anel */
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8 + Math.PI / 8;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * 462, cy + Math.sin(ang) * 462, 5, 0, Math.PI * 2);
      ctx.fillStyle = hexA(bg.ink, 0.55);
      ctx.fill();
    }

    /* símbolo */
    ctx.save();
    ctx.translate(cx, cy);
    const iconSize = 470;
    const inkGrad = ctx.createLinearGradient(0, -iconSize / 2, 0, iconSize / 2);
    inkGrad.addColorStop(0, lightBg ? "#a37c22" : bg.ink);
    inkGrad.addColorStop(1, lightBg ? "#6f520f" : hexA(bg.ink, 0.72));
    ctx.strokeStyle = inkGrad;
    ctx.fillStyle = inkGrad;
    ctx.lineWidth = iconSize * 0.05;
    if (state.av.variant === "sol") drawSunIcon(ctx, iconSize);
    else ICON_DRAWERS[state.av.variant === "cruz" ? "fe" : "paz"](ctx, iconSize);
    ctx.restore();

    /* assinatura discreta */
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.font = '600 34px Poppins, sans-serif';
    try { ctx.letterSpacing = "10px"; } catch (e) {}
    ctx.textAlign = "center";
    ctx.fillStyle = hexA(bg.ink, 0.9);
    ctx.fillText("ALVORADA", S / 2, S - 96);
    ctx.restore();
  }

  async function generateAvatar() {
    el.avCanvas.hidden = false;
    el.avPlaceholder.hidden = true;
    await ensureCanvasFonts();
    el.avCanvas.width = 1080;
    el.avCanvas.height = 1080;
    el.avatarStage.style.aspectRatio = "1080/1080";
    drawAvatar(el.avCanvas.getContext("2d"), 1080);
    el.avCanvas.toBlob((b) => {
      if (b) {
        state.avatarBlob = b;
        el.btnAvatarDownload.disabled = false;
      }
    }, "image/png", 1);
    showToast("Avatar pronto — baixe e atualize a foto do perfil. ☀️", "ok");
  }

  function renderAvatarChips() {
    el.avVariantChips.innerHTML = "";
    Object.entries(AVATAR_VARIANTS).forEach(([k, v]) => {
      const b = makeChip(v.label);
      if (k === state.av.variant) b.classList.add("active");
      b.title = v.desc;
      b.addEventListener("click", () => { state.av.variant = k; renderAvatarChips(); });
      el.avVariantChips.appendChild(b);
    });
    el.avBgChips.innerHTML = "";
    Object.entries(AVATAR_BACKGROUNDS).forEach(([k, bgi]) => {
      const b = makeChip(bgi.label);
      if (k === state.av.bg) b.classList.add("active");
      b.addEventListener("click", () => { state.av.bg = k; renderAvatarChips(); });
      el.avBgChips.appendChild(b);
    });
  }

  /* =========================================================
     PREFS
     ========================================================= */
  const PREFS_KEY = "alvorada_perfil_prefs_v1";
  function savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({
        style: state.style,
        palette: state.palette,
        source: state.source,
        textMode: state.textMode,
        icons: state.icons.map((i) => i.id)
      }));
    } catch (e) {}
  }
  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (PERFIL_STYLES[p.style]) state.style = p.style;
      if (PERFIL_PALETTES.some((x) => x.id === p.palette)) state.palette = p.palette;
      if (PERFIL_SOURCES[p.source]) state.source = p.source;
      if (PERFIL_TEXTMODES[p.textMode]) state.textMode = p.textMode;
      if (Array.isArray(p.icons)) {
        state.icons = p.icons.map((id) => PERFIL_ICONS.find((i) => i.id === id)).filter(Boolean);
      }
    } catch (e) {}
    if (!state.icons.length) {
      state.icons = PERFIL_ICONS.filter((i) => ["fe", "paz", "oracao", "palavra", "esperanca", "alvorada"].includes(i.id));
    }
  }

  /* =========================================================
     SCROLL REVEAL
     ========================================================= */
  function initScrollReveal() {
    const els = $$(".reveal-up");
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14 });
    els.forEach((e) => io.observe(e));
  }

  /* =========================================================
     INIT
     ========================================================= */
  function cacheEls() {
    el.styleChips = $("#style-chips");
    el.styleHint = $("#style-hint");
    el.paletteOptions = $("#palette-options");
    el.paletteChips = $("#palette-chips");
    el.sourceOptions = $("#source-options");
    el.sourceChips = $("#source-chips");
    el.iconGrid = $("#icon-grid");
    el.iconCount = $("#icon-count");
    el.textmodeChips = $("#textmode-chips");
    el.namesBox = $("#names-box");
    el.namesText = $("#names-text");
    el.engineNote = $("#engine-note");
    el.btnGenerate = $("#btn-generate");
    el.btnSurprise = $("#btn-surprise");
    el.btnSurpriseHero = $("#btn-surprise-hero");
    el.stage = $("#perfil-stage");
    el.placeholder = $("#stage-placeholder");
    el.canvas = $("#perfil-canvas");
    el.progressRow = $("#progress-row");
    el.progressFill = $("#progress-fill");
    el.progressStatus = $("#progress-status");
    el.strip = $("#perfil-strip");
    el.btnDownload = $("#btn-download");
    el.downloadNote = $("#download-note");
    el.mockHighlights = $("#mock-highlights");
    el.mockHandle = $("#mock-handle");
    el.mockBio = $("#mock-bio");
    el.nameChips = $("#name-chips");
    el.bioText = $("#bio-text");
    el.bioCount = $("#bio-count");
    el.btnNewBio = $("#btn-new-bio");
    el.btnCopyBio = $("#btn-copy-bio");
    el.tagsText = $("#tags-text");
    el.btnCopyTags = $("#btn-copy-tags");
    el.pinnedGrid = $("#pinned-grid");
    el.growthTips = $("#growth-tips");
    el.orderStrip = $("#order-strip");
    el.btnKit = $("#btn-kit");
    el.avVariantChips = $("#av-variant-chips");
    el.avBgChips = $("#av-bg-chips");
    el.btnAvatarGenerate = $("#btn-avatar-generate");
    el.btnAvatarDownload = $("#btn-avatar-download");
    el.avatarStage = $("#avatar-stage");
    el.avPlaceholder = $("#av-placeholder");
    el.avCanvas = $("#av-canvas");
  }

  function init() {
    cacheEls();
    loadPrefs();
    renderChips();
    saveNamesText();
    renderMockHighlights();
    renderNameKeywords();
    renderPinned();
    renderGrowthTips();
    renderOrderStrip();

    el.namesText.addEventListener("input", () => {
      const lines = el.namesText.value.split("\n");
      state.icons.forEach((ic, i) => {
        if (lines[i] != null && lines[i].trim()) state.names[ic.id] = lines[i].trim();
        else delete state.names[ic.id];
      });
    });

    el.btnGenerate.addEventListener("click", () => handleGenerate(false));
    el.btnSurprise.addEventListener("click", () => surprise(false));
    if (el.btnSurpriseHero) el.btnSurpriseHero.addEventListener("click", () => surprise(true));
    el.btnDownload.addEventListener("click", downloadAll);

    el.btnNewBio.addEventListener("click", () => {
      el.bioText.value = buildBio();
      refreshBioCount();
      refreshMockBio();
    });
    el.bioText.addEventListener("input", () => {
      refreshBioCount();
      refreshMockBio();
    });
    el.btnCopyBio.addEventListener("click", () => copyText(el.bioText.value, "Bio copiada — cole em Editar perfil. 🧲"));
    el.btnCopyTags.addEventListener("click", () => copyText(el.tagsText.value, "Hashtags copiadas — cole no primeiro comentário. #"));

    /* já entrega uma bio e um pacote de hashtags prontos ao abrir */
    if (!el.bioText.value.trim()) {
      el.bioText.value = buildBio();
      el.tagsText.value = buildTags();
      refreshBioCount();
      refreshMockBio();
    }

    if (el.btnKit) el.btnKit.addEventListener("click", applyRecommendedKit);

    if (el.avVariantChips && el.avBgChips) {
      renderAvatarChips();
      if (el.btnAvatarGenerate) el.btnAvatarGenerate.addEventListener("click", generateAvatar);
      if (el.btnAvatarDownload) {
        el.btnAvatarDownload.addEventListener("click", () => {
          if (!state.avatarBlob) return;
          triggerDownload(state.avatarBlob, "avatar-alvorada-1080.png");
          showToast("Avatar salvo! Atualize a foto do perfil. ☀️", "ok");
        });
      }
    }

    initScrollReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
