(function () {
  "use strict";

  var CATEGORIAS = [
    { id: "fe", label: "Fé", emoji: "🙌" },
    { id: "oracao", label: "Oração", emoji: "🙏" }
  ];

  var TIPOS = [
    { id: "impacto", label: "Frase de impacto" },
    { id: "sequencia", label: "Sequência para Reel" }
  ];

  var TAMANHOS = [
    { id: "curto", label: "Curto (12–25 palavras)" },
    { id: "reel", label: "Reel (2–4 blocos)" }
  ];

  var ESTILOS = [
    { id: "curto", label: "Curta e viral (recomendado)" },
    { id: "emocional", label: "Emocional e acolhedora" }
  ];

  var ABORDAGENS = [
    { id: "identificacao", label: "Identificação (isso sou eu)" },
    { id: "contraste", label: "Contraste (luta × vitória)" }
  ];

  var INTENCOES = [
    { id: "auto", label: "Automático" },
    { id: "identification", label: "Identificação (isso sou eu)" },
    { id: "share", label: "Compartilhamento" },
    { id: "save", label: "Salvamento" },
    { id: "comment", label: "Comentário" }
  ];

  var QUANTIDADES = [1, 5, 10, 20, 30];

  var TOP10_HASHTAGS = {
    fe: ["#Deus", "#Fé", "#FéEmDeus", "#DeusNoComando", "#Esperança", "#ConfiançaEmDeus", "#Jesus", "#CrerSemVer", "#VidaComDeus", "#alvoradadoceu"],
    oracao: ["#Oração", "#Deus", "#Fé", "#Devocional", "#PalavraDeDeus", "#OraçãoDaManhã", "#VidaDeOração", "#ConversaComDeus", "#Paz", "#alvoradadoceu"]
  };

  var IAs = [
    { id: "auto", label: "Automático (Cloudflare → OpenRouter → Mistral → banco local)" },
    { id: "cloudflare", label: "Cloudflare Workers AI" },
    { id: "openrouter", label: "OpenRouter (IA grátis)" },
    { id: "mistral", label: "Mistral AI (IA grátis)" },
    { id: "local", label: "Banco local (offline)" }
  ];

  var LS_BANCO = "alvorada_banco";
  var LS_HIST = "alvorada_historico";
  var LS_CFG = "alvorada_config";
  var LS_AVISO = "alvorada_aviso_ia";

  var $ = function (id) { return document.getElementById(id); };

  var gerando = false;

  var state = lerConfig();

  function lerConfig() {
    var tem = function (arr, id) {
      return id && arr.some(function (x) { return x.id === id; }) ? id : "";
    };
    try {
      var cfg = JSON.parse(localStorage.getItem(LS_CFG)) || {};
      var q = parseInt(cfg.quantidade, 10) || 1;
      if (QUANTIDADES.indexOf(q) === -1) q = 1;
      return {
        categoria: tem(CATEGORIAS, cfg.categoria) || "fe",
        tipo: tem(TIPOS, cfg.tipo) || "impacto",
        tamanho: tem(TAMANHOS, cfg.tamanho) || "curto",
        altoImpacto: cfg.altoImpacto !== false,
        paraCompartilhar: !!cfg.paraCompartilhar,
        provider: tem(IAs, cfg.provider) || "auto",
        quantidade: q,
        estilo: tem(ESTILOS, cfg.estilo) || "curto",
        abordagem: tem(ABORDAGENS, cfg.abordagem) || "identificacao",
        intencao: tem(INTENCOES, cfg.intencao) || "auto"
      };
    } catch (e) {
      return { categoria: "fe", tipo: "impacto", tamanho: "curto", altoImpacto: true, paraCompartilhar: false, provider: "auto", quantidade: 1, estilo: "curto", abordagem: "identificacao", intencao: "auto" };
    }
  }

  function salvarConfig() {
    try {
      localStorage.setItem(LS_CFG, JSON.stringify(state));
    } catch (e) { /* sem armazenamento */ }
  }

  function lerBanco() {
    try {
      var arr = JSON.parse(localStorage.getItem(LS_BANCO));
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function gravarBanco(arr) {
    try { localStorage.setItem(LS_BANCO, JSON.stringify(arr)); } catch (e) { /* vazio */ }
    atualizarContadorFavoritos();
  }

  function lerHistorico() {
    try {
      var arr = JSON.parse(localStorage.getItem(LS_HIST));
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function registrarHistorico(itens) {
    var h = lerHistorico();
    (itens || []).filter(Boolean).forEach(function (f) {
      var reg = typeof f === "string" ? { frase: f, hashtags: [] } : f;
      if (!reg || !reg.frase) return;
      h.push({ frase: reg.frase, hashtags: Array.isArray(reg.hashtags) ? reg.hashtags : [] });
    });
    var unico = [];
    h.filter(Boolean).forEach(function (f) {
      var cf = String(f.frase).replace(/\s+/g, " ").toLowerCase().slice(0, 80);
      if (unico.indexOf(cf) === -1) unico.push(f);
    });
    var cortado = unico.slice(-40);
    try { localStorage.setItem(LS_HIST, JSON.stringify(cortado)); } catch (e) { /* vazio */ }
  }

  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function uid() {
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function catInfo(id) {
    for (var i = 0; i < CATEGORIAS.length; i++) {
      if (CATEGORIAS[i].id === id) return CATEGORIAS[i];
    }
    return CATEGORIAS[0];
  }

  function badgeCat(id) {
    var c = catInfo(id);
    return c.emoji + " " + c.label;
  }

  /* ================================================================ */
  /*  Montagem dos controles                                          */
  /* ================================================================ */

  function montarChips() {
    var chips = $("chips");
    chips.innerHTML = "";
    CATEGORIAS.forEach(function (cat) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (cat.id === state.categoria ? " ativo" : "");
      b.textContent = cat.emoji + " " + cat.label;
      b.addEventListener("click", function () {
        state.categoria = cat.id;
        salvarConfig();
        remarcarChips();
        renderTop10();
      });
      chips.appendChild(b);
    });
  }

  function renderTop10() {
    var lista = TOP10_HASHTAGS[state.categoria] || TOP10_HASHTAGS.fe;
    var el = $("top10Lista");
    if (!el) return;
    el.innerHTML = lista.map(function (t) {
      return '<span class="top10-tag">' + esc(t) + '</span>';
    }).join("");
  }

  function remarcarChips() {
    var chips = $("chips");
    for (var i = 0; i < CATEGORIAS.length; i++) {
      chips.children[i].classList.toggle("ativo", CATEGORIAS[i].id === state.categoria);
    }
  }

  function montarSelecao(id, lista, valor) {
    var sel = $(id);
    lista.forEach(function (item) {
      var o = document.createElement("option");
      o.value = item.id;
      o.textContent = item.label;
      sel.appendChild(o);
    });
    sel.value = valor;
  }

  function montarSegmentos() {
    var seg = $("segmentos");
    QUANTIDADES.forEach(function (q) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "seg" + (q === state.quantidade ? " ativo" : "");
      b.textContent = String(q);
      b.addEventListener("click", function () {
        state.quantidade = q;
        salvarConfig();
        for (var i = 0; i < seg.children.length; i++) {
          seg.children[i].classList.toggle("ativo", QUANTIDADES[i] === q);
        }
        $("labelBtnGerar").textContent = "Gerar " + (q === 1 ? "frase" : q + " frases");
      });
      seg.appendChild(b);
    });
  }

  /* ================================================================ */
  /*  Geração                                                          */
  /* ================================================================ */

  function statusMsg(texto, tipo) {
    var s = $("status");
    s.className = "status";
    s.innerHTML = "";
    s.textContent = texto || "";
    if (tipo) s.classList.add(tipo);
  }

  function toast(texto, erro) {
    var t = $("toast");
    t.textContent = texto;
    t.className = "toast mostrar" + (erro ? " erro" : "");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { t.className = "toast"; }, 2600);
  }

  function gerar() {
    if (gerando) return;
    gerando = true;

    var btn = $("btnGerar");
    btn.disabled = true;
    $("listaResultados").innerHTML = skeletonHTML(state.quantidade);
    statusMsg("Gerando com IA, aguarde um instante…");

    var evitar = lerHistorico().slice(-8);

    fetch("/api/frase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoria: state.categoria,
        tipo: state.tipo,
        tamanho: state.tamanho,
        altoImpacto: state.altoImpacto,
        paraCompartilhar: state.paraCompartilhar,
        provider: state.provider,
        quantidade: state.quantidade,
        estilo: state.estilo,
        abordagem: state.abordagem,
        intencao: state.intencao,
        evitar: evitar
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data.ok) {
          throw new Error((data && data.error) || "Erro ao gerar as frases.");
        }
        registrarHistorico(data.itens.map(function (i) { return i.frase; }));
        renderizarResultados(data);
        if (data.provider === "local") {
          if (data.manual) {
            statusMsg("Frases do banco local (" + data.quantidade + " gerada" + (data.quantidade > 1 ? "s" : "") + ").", "ok");
          } else {
            statusMsg("Geradas pelo banco local (as IAs não responderam agora).", "ok");
            mostrarAvisoIA();
          }
        } else {
          statusMsg(String(data.quantidade) + " frase" + (data.quantidade > 1 ? "s" : "") + " gerada" + (data.quantidade > 1 ? "s" : "") + " por " + data.providerLabel + ".", "ok");
        }
      })
      .catch(function () {
        statusMsg("Não foi possível gerar agora. Tente novamente em alguns segundos.", "erro");
        $("listaResultados").innerHTML = "";
      })
      .then(function () {
        gerando = false;
        btn.disabled = false;
      });
  }

  function mostrarAvisoIA() {
    try {
      if (localStorage.getItem(LS_AVISO)) return;
      localStorage.setItem(LS_AVISO, "1");
    } catch (e) { /* vazio */ }
    toast("As IAs de rede gratuitas estão instáveis hoje. As frases continuam vindo do banco local. 💛");
  }

  function skeletonHTML(q) {
    var out = "";
    for (var i = 0; i < Math.min(q, 5); i++) out += '<div class="skeleton"><div class="skeleton-linha"></div><div class="skeleton-linha" style="width:70%"></div></div>';
    return out;
  }

  /* ================================================================ */
  /*  Renderização de um cartão de frase                               */
  /* ================================================================ */

  function cardHTML(item) {
    var salva = !!item.id;
    return (
      '<article class="frase-cartao' + (item.utilizada ? " utilizada" : "") + '" data-id="' + esc(item.id || "") + '" data-salva="' + (salva ? "1" : "0") + '">' +
        '<div class="frase-topo">' +
          '<div>' +
            '<span class="frase-badge">' + esc(item.badge || badgeCat(item.categoria)) + '</span>' +
            (item.utilizada ? '<span class="tag-utilizada">Utilizada</span>' : "") +
            (salva ? '<span class="tag-salva">Salva</span>' : "") +
          '</div>' +
          '<div class="frase-acoes">' +
            '<button type="button" class="btn-icone" data-acao="favoritar" data-salva="' + (salva ? "1" : "0") + '" title="' + (salva && item.favorita ? "Remover dos favoritos" : "Salvar nos favoritos") + '">' + (salva && item.favorita ? "★" : "☆") + '</button>' +
            '<button type="button" class="btn-icone' + (item.utilizada ? " on" : "") + '" data-acao="utilizada" title="Marcar como utilizada">✔</button>' +
            '<button type="button" class="btn-icone" data-acao="copiar-tudo" title="Copiar tudo (frase + legenda + hashtags + palavras-chave)">📑</button>' +
            '<button type="button" class="btn-icone" data-acao="copiar" title="Copiar frase">📋</button>' +
            '<button type="button" class="btn-icone" data-acao="gerar-outra" title="Gerar outra frase" style="' + (state.quantidade !== 1 ? "display:none" : "") + '">🔄</button>' +
            '<button type="button" class="btn-icone" data-acao="abrir" title="Abrir no gerador" style="' + (salva ? "" : "display:none") + '">↩</button>' +
            '<button type="button" class="btn-icone" data-acao="excluir" title="Excluir">🗑</button>' +
          '</div>' +
        '</div>' +
        '<textarea class="frase-texto" rows="3" spellcheck="false" placeholder="Sua frase…"></textarea>' +
        '<button type="button" class="det-alterno" data-acao="detalhes">Legenda + hashtags + palavras-chave ▾</button>' +
        '<div class="detalhes">' +
          '<div class="linha-legenda">' +
            '<span class="rotulo rotulo-det">Legenda</span>' +
            '<button type="button" class="botao-secundario" data-acao="outra-legenda" title="Gerar outra versão desta legenda">✨ Gerar outra legenda</button>' +
          '</div>' +
          '<textarea class="legenda-input" rows="4" spellcheck="false" placeholder="Legenda pronta para o post…"></textarea>' +
          '<span class="rotulo rotulo-det">Hashtags das 10 melhores do nicho</span>' +
          '<div class="campo-palavra">' +
            '<input class="hashtags-input" spellcheck="false" placeholder="#Deus #Fé #Oração…" />' +
            '<button type="button" class="btn-icone" data-acao="copiar-hashtags" title="Copiar hashtags">📋</button>' +
          '</div>' +
          '<span class="rotulo rotulo-det">Palavras-chave (SEO)</span>' +
          '<div class="campo-palavra">' +
            '<input class="palavras-key-input" spellcheck="false" placeholder="Deus, fé, esperança…" />' +
            '<button type="button" class="btn-icone" data-acao="copiar-palavras" title="Copiar palavras-chave">📋</button>' +
          '</div>' +
          '<span class="rotulo rotulo-det">Vídeo de fundo (Pexels/Pixabay)</span>' +
          '<div class="campo-palavra">' +
            '<input class="palavra-input" spellcheck="false" />' +
            '<button type="button" class="btn-icone" data-acao="copiar-palavra" title="Copiar termos do vídeo">📋</button>' +
          '</div>' +
          '<div class="botoes-busca">' +
            '<a class="botao-busca botao-pexels" href="#" target="_blank" rel="noopener noreferrer">Pesquisar no Pexels</a>' +
            '<a class="botao-busca botao-pixabay" href="#" target="_blank" rel="noopener noreferrer">Pesquisar no Pixabay</a>' +
          '</div>' +
          '<span class="rotulo rotulo-det">Observação</span>' +
          '<input class="obs-input" placeholder="Sua anotação (estilo, quando publicar, reação…)"/>' +
        '</div>' +
        '<div class="frase-rodape">' +
          '<span class="data-reg">' + esc(item.data || "") + '</span>' +
          '<span class="prova" style="font-style:italic"></span>' +
        '</div>' +
      '</article>'
    );
  }

  function preencherCard(article, item) {
    article.querySelector(".frase-texto").value = item.frase || "";
    article.querySelector(".legenda-input").value = item.legenda || "";
    article.querySelector(".hashtags-input").value = hashtagsParaTexto(item.hashtags) || "";
    article.querySelector(".palavras-key-input").value = palavrasParaTexto(item.palavras_chave) || "";
    article.querySelector(".palavra-input").value = item.palavra_chave || "";
    article.querySelector(".obs-input").value = item.observacao || "";
    article.querySelector(".data-reg").textContent = item.data || "";
    atualizarLinks(article, item.palavra_chave || "");
  }

  function hashtagsParaTexto(arr) {
    return (Array.isArray(arr) ? arr : []).join(" ");
  }

  function palavrasParaTexto(arr) {
    return (Array.isArray(arr) ? arr : []).join(", ");
  }

  function parsearHashtags(texto) {
    var tokens = String(texto || "").split(/[\s,;]+/).map(function (t) { return t.trim(); }).filter(Boolean).slice(0, 10);
    var out = [];
    var visto = {};
    tokens.forEach(function (t) {
      var nome = t.replace(/^#+/, "").trim();
      if (!nome) return;
      var chave = nome.toLowerCase().replace(/[\s_]/g, "");
      if (visto[chave]) return;
      visto[chave] = 1;
      out.push("#" + nome);
    });
    return out;
  }

  function parsearPalavras(texto) {
    return String(texto || "").split(/[,\n;]+/).map(function (t) { return t.trim(); }).filter(Boolean).slice(0, 8);
  }

  function atualizarLinks(article, palavra) {
    var q = encodeURIComponent(palavra || "");
    article.querySelector(".botao-pexels").href = "https://www.pexels.com/search/videos/" + q + "/";
    article.querySelector(".botao-pixabay").href = "https://pixabay.com/videos/search/" + q + "/";
  }

  function renderizarResultados(data) {
    var lista = $("listaResultados");
    lista.innerHTML = "";
    var self = this;
    data.itens.forEach(function (it) {
      var article = document.createElement("div");
      article.innerHTML = cardHTML({
        id: "",
        frase: it.frase,
        legenda: it.legenda,
        hashtags: it.hashtags,
        palavras_chave: it.palavras_chave,
        palavra_chave: it.palavra_chave,
        categoria: data.categoria,
        utilizada: false,
        favorita: false
      });
      preencherCard(article, {
        frase: it.frase, legenda: it.legenda,
        hashtags: it.hashtags, palavras_chave: it.palavras_chave,
        palavra_chave: it.palavra_chave,
        data: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
      });
      lista.appendChild(article);
    });
    $("listaResultados").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ================================================================ */
  /*  Ações dos cartões (delegação)                                   */
  /* ================================================================ */

  var ACOES = {};
  ACOES.gerador = null;
  ACOES.banco = null;

  function registrarAcoes(listaEl, contexto, filtroAtual) {
    listaEl.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-acao]");
      if (!btn) return;
      var article = ev.target.closest(".frase-cartao");
      if (!article) return;
      var acao = btn.getAttribute("data-acao");
      handleAcao(acao, article, contexto, filtroAtual);
    });
    listaEl.addEventListener("input", function (ev) {
      if (ev.target.classList.contains("frase-texto")) {
        var article = ev.target.closest(".frase-cartao");
        article.querySelector(".prova").textContent = "";
      }
      if (ev.target.closest && ev.target.closest(".frase-cartao")) {
        syncBancoFromCard(ev.target.closest(".frase-cartao"));
      }
    });
  }

  function itemAtual(article) {
    return {
      id: article.getAttribute("data-id") || "",
      frase: article.querySelector(".frase-texto").value,
      legenda: article.querySelector(".legenda-input").value,
      hashtags: parsearHashtags(article.querySelector(".hashtags-input").value),
      palavras_chave: parsearPalavras(article.querySelector(".palavras-key-input").value),
      palavra_chave: article.querySelector(".palavra-input").value,
      observacao: article.querySelector(".obs-input").value
    };
  }

  function handleAcao(acao, article, contexto, filtroAtual) {
    var item = itemAtual(article);
    switch (acao) {
      case "detalhes":
        article.querySelector(".detalhes").classList.toggle("aberto");
        btnDecor(article, "detalhes");
        break;
      case "favoritar":
        toggleFavoritar(article, item);
        if (contexto === "banco") renderBanco(obterFiltroAtual());
        break;
      case "utilizada":
        toggleUtilizada(article, item, contexto);
        break;
      case "copiar":
        copiarTexto(item.frase);
        break;
      case "copiar-tudo":
        copiarTudo(item);
        break;
      case "copiar-hashtags":
        copiarTexto((item.hashtags || []).join(" "));
        break;
      case "copiar-palavras":
        copiarTexto((item.palavras_chave || []).join(", "));
        break;
      case "copiar-palavra":
        copiarTexto(item.palavra_chave);
        break;
      case "outra-legenda":
        gerarOutraLegenda(article, item);
        break;
      case "gerar-outra":
        gerarOutra(article, item);
        break;
      case "abrir":
        abrirNoGerador(item);
        break;
      case "excluir":
        excluir(article, item, contexto, filtroAtual);
        break;
    }
  }

  function btnDecor(article, name) {
    var btn = article.querySelector('[data-acao="' + name + '"]');
    if (btn && name === "detalhes" && article.querySelector(".detalhes").classList.contains("aberto")) {
      btn.textContent = "Legenda + hashtags + palavras-chave ▴";
    } else if (btn && name === "detalhes") {
      btn.textContent = "Legenda + hashtags + palavras-chave ▾";
    }
  }

  function copiarTudo(item) {
    var texto =
      "Frase de impacto:\n" + (item.frase || "") +
      "\n\nLegenda:\n" + (item.legenda || "") +
      "\n\nHashtags:\n" + (item.hashtags || []).join(" ") +
      "\n\nPalavras-chave:\n" + (item.palavras_chave || []).join(", ");
    copiarTexto(texto.trim());
  }

  function toggleFavoritar(article, item) {
    var favorita = article.getAttribute("data-salva") === "1" &&
      (article.querySelector('[data-acao="favoritar"]').textContent === "★");
    var banco = lerBanco();

    if (!article.getAttribute("data-id")) {
      /* novo registro no banco */
      var record = {
        id: uid(),
        frase: item.frase,
        legenda: item.legenda,
        hashtags: item.hashtags,
        palavras_chave: item.palavras_chave,
        palavra_chave: item.palavra_chave,
        observacao: item.observacao,
        categoria: state.categoria,
        badge: badgeCat(state.categoria),
        tipo: state.tipo,
        size: state.tamanho,
        data: new Date().toISOString(),
        favorita: true,
        utilizada: false
      };
      banco.push(record);
      gravarBanco(banco);
      article.setAttribute("data-id", record.id);
      article.setAttribute("data-salva", "1");
      article.querySelector('[data-acao="favoritar"]').setAttribute("data-salva", "1");
      article.querySelector('[data-acao="favoritar"]').textContent = "★";
      article.querySelector('[data-acao="favoritar"]').classList.add("on");
      article.querySelector('[data-acao="favoritar"]').title = "Remover dos favoritos";
      article.querySelector('[data-acao="abrir"]').style.display = "";
      var badge = article.querySelector(".tag-salva");
      if (!badge) {
        var span = document.createElement("span");
        span.className = "tag-salva";
        span.textContent = "Salva";
        article.querySelector(".frase-topo > div:first-child").appendChild(span);
      }
      toast("Salva nos favoritos ⭐");
    } else {
      for (var i = 0; i < banco.length; i++) {
        if (banco[i].id === article.getAttribute("data-id")) {
          banco[i].favorita = !banco[i].favorita;
          var btn = article.querySelector('[data-acao="favoritar"]');
          if (banco[i].favorita) {
            btn.textContent = "★";
            btn.classList.add("on");
            btn.title = "Remover dos favoritos";
            toast("Adicionada aos favoritos ⭐");
          } else {
            btn.textContent = "☆";
            btn.classList.remove("on");
            btn.title = "Salvar nos favoritos";
            toast("Removida dos favoritos");
          }
          break;
        }
      }
      gravarBanco(banco);
    }
  }

  function toggleUtilizada(article, item, contexto) {
    if (article.getAttribute("data-id")) {
      var banco = lerBanco();
      for (var i = 0; i < banco.length; i++) {
        if (banco[i].id === article.getAttribute("data-id")) {
          banco[i].utilizada = !banco[i].utilizada;
          break;
        }
      }
      gravarBanco(banco);
      var reg = banco.filter(function (r) { return r.id === article.getAttribute("data-id"); })[0];
      if (!reg) return;
      var utilizada = reg.utilizada;
      article.classList.toggle("utilizada", utilizada);
      article.querySelector('[data-acao="utilizada"]').classList.toggle("on", utilizada);
      var tag = article.querySelector(".tag-utilizada");
      if (utilizada && !tag) {
        var span = document.createElement("span");
        span.className = "tag-utilizada";
        span.textContent = "Utilizada";
        article.querySelector(".frase-topo > div:first-child").appendChild(span);
      } else if (!utilizada && tag) {
        tag.remove();
      }
      toast(utilizada ? "Marcada como utilizada ✔" : "Removida da marcação de utilizada");
      if (contexto === "banco") renderBanco(obterFiltroAtual());
      return;
    }
    article.classList.toggle("utilizada");
    var marcada = article.classList.contains("utilizada");
    article.querySelector('[data-acao="utilizada"]').classList.toggle("on", marcada);
    toast(marcada ? "Marcada como utilizada ✔" : "Marcação removida");
  }

  function syncBancoFromCard(article) {
    var id = article.getAttribute("data-id");
    if (!id) {
      article.querySelector(".prova").textContent = "Não salva — toque em ☆ para guardar.";
      return;
    }
    var banco = lerBanco();
    var idx = -1;
    for (var i = 0; i < banco.length; i++) {
      if (banco[i].id === id) { idx = i; break; }
    }
    if (idx === -1) { return; }
    banco[idx].frase = article.querySelector(".frase-texto").value;
    banco[idx].legenda = article.querySelector(".legenda-input").value;
    banco[idx].palavra_chave = article.querySelector(".palavra-input").value;
    banco[idx].hashtags = parsearHashtags(article.querySelector(".hashtags-input").value);
    banco[idx].palavras_chave = parsearPalavras(article.querySelector(".palavras-key-input").value);
    banco[idx].observacao = article.querySelector(".obs-input").value;
    gravarBanco(banco);
    article.querySelector(".prova").textContent = "Salva e atualizada ✓";
    atualizarLinks(article, banco[idx].palavra_chave);
  }

  function gerarOutra(article, item) {
    if (article.getAttribute("data-id")) {
      toast("Isso é uma salva. Use ↩ para voltar ao gerador e criar uma nova.", true);
      return;
    }
    gerando = true;
    var btn = $("btnGerar");
    var original = btn.disabled;
    btn.disabled = true;
    article.querySelector(".prova").textContent = "Gerando…";
    fetch("/api/frase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoria: state.categoria,
        tipo: state.tipo,
        tamanho: state.tamanho,
        altoImpacto: state.altoImpacto,
        paraCompartilhar: state.paraCompartilhar,
        provider: state.provider,
        quantidade: 1,
        estilo: state.estilo,
        abordagem: state.abordagem,
        intencao: state.intencao,
        evitar: [item]
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data.ok) throw new Error("erro");
        var it = data.itens[0];
        registrarHistorico([it]);
        preencherCard(article, it);
        btnDecor(article, "detalhes");
        article.querySelector(".prova").textContent = "Gerada por " + data.providerLabel;
      })
      .catch(function () {
        article.querySelector(".prova").textContent = "Não consegui gerar outra agora 😔";
      })
      .then(function () {
        gerando = false;
        btn.disabled = original;
      });
  }

  function gerarOutraLegenda(article, item) {
    gerando = true;
    var btn = $("btnGerar");
    var original = btn.disabled;
    btn.disabled = true;
    article.querySelector(".prova").textContent = "Gerando nova legenda…";
    fetch("/api/legenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoria: state.categoria,
        frase: item.frase,
        legenda: item.legenda,
        estilo: state.estilo,
        intencao: state.intencao,
        provider: state.provider,
        evitar: [item]
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data.ok) throw new Error("erro");
        var it = data.itens[0];
        it.frase = item.frase;
        preencherCard(article, it);
        article.querySelector(".prova").textContent = "Nova legenda pronta (" + data.providerLabel + ") ✨";
      })
      .catch(function () {
        article.querySelector(".prova").textContent = "Não consegui gerar outra legenda agora 😔";
      })
      .then(function () {
        gerando = false;
        btn.disabled = original;
      });
  }

  function abrirNoGerador(item) {
    /* copia o registro como um cartão novo editável no gerador */
    irParaAba("gerador");
    var lista = $("listaResultados");
    var article = document.createElement("div");
    article.innerHTML = cardHTML({
      id: "", frase: item.frase, legenda: item.legenda,
      hashtags: item.hashtags, palavras_chave: item.palavras_chave,
      palavra_chave: item.palavra_chave,
      categoria: state.categoria, utilizada: false, favorita: false
    });
    preencherCard(article, {
      frase: item.frase, legenda: item.legenda,
      hashtags: item.hashtags, palavras_chave: item.palavras_chave,
      palavra_chave: item.palavra_chave, data: ""
    });
    lista.innerHTML = "";
    lista.appendChild(article);
    toast("Cartão aberto no gerador. Edite e salve se quiser.");
  }

  function excluir(article, item, contexto, filtroAtual) {
    var id = article.getAttribute("data-id");
    if (id) {
      var banco = lerBanco();
      var nova = banco.filter(function (r) { return r.id !== id; });
      gravarBanco(nova);
      toast("Removida do banco 🗑");
      if (contexto === "banco") {
        renderBanco(filtroAtual);
        return;
      }
    }
    article.remove();
  }

  function copiarTexto(texto) {
    if (!texto) { toast("Nada para copiar.", true); return; }
    var ok = function () { toast("Copiado! 📋"); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok).catch(function () { copiarFallback(texto, ok); });
    } else {
      copiarFallback(texto, ok);
    }
  }

  function copiarFallback(texto, ok) {
    var ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); ok(); } catch (e) { /* vazio */ }
    document.body.removeChild(ta);
  }

  /* ================================================================ */
  /*  Abas + banco de favoritos                                        */
  /* ================================================================ */

  function irParaAba(nome) {
    var ger = nome === "gerador";
    $("painelGerador").classList.toggle("oculto", !ger);
    $("painelFavoritos").classList.toggle("oculto", ger);
    $("abaGerador").classList.toggle("ativo", ger);
    $("abaFavoritos").classList.toggle("ativo", !ger);
    $("abaGerador").setAttribute("aria-selected", ger ? "true" : "false");
    $("abaFavoritos").setAttribute("aria-selected", ger ? "false" : "true");
    if (!ger) renderBanco(obterFiltroAtual());
  }

  function atualizarContadorFavoritos() {
    var banco = lerBanco();
    var n = banco.filter(function (r) { return r.favorita; }).length;
    $("contFavoritos").textContent = String(n);
  }

  function obterFiltroAtual() {
    var seg = $("filtroBanco");
    for (var i = 0; i < seg.children.length; i++) {
      if (seg.children[i].classList.contains("ativo")) {
        return seg.children[i].getAttribute("data-filtro");
      }
    }
    return "favoritas";
  }

  function renderBanco(filtro) {
    var lista = $("listaBanco");
    var banco = lerBanco().slice().reverse();
    var filtrados = banco.filter(function (r) {
      if (filtro === "favoritas") return r.favorita;
      if (filtro === "utilizadas") return r.utilizada;
      return true;
    });

    if (!filtrados.length) {
      lista.innerHTML = '<div class="lista-vazia">' +
        (banco.length ? "Nada aqui neste filtro ainda." : "Seu banco está vazio. Gere frases e toque na estrela ⭐ de um cartão para guardar aqui.") +
        '</div>';
      return;
    }

    lista.innerHTML = "";
    var self = this;
    filtrados.forEach(function (r) {
      var article = document.createElement("div");
      article.innerHTML = cardHTML({
        id: r.id, frase: r.frase, legenda: r.legenda,
        hashtags: r.hashtags, palavras_chave: r.palavras_chave,
        palavra_chave: r.palavra_chave,
        categoria: r.categoria, utilizada: r.utilizada, favorita: r.favorita,
        badge: r.badge, observacao: r.observacao, data: r.data
      });
      preencherCard(article, {
        frase: r.frase, legenda: r.legenda,
        hashtags: r.hashtags, palavras_chave: r.palavras_chave,
        palavra_chave: r.palavra_chave,
        observacao: r.observacao,
        data: formatarData(r.data)
      });
      lista.appendChild(article);
    });
  }

  function formatarData(iso) {
    if (!iso) return "";
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
    } catch (e) { return ""; }
  }

  /* ================================================================ */
  /*  Inicialização                                                    */
  /* ================================================================ */

  montarChips();
  renderTop10();
  montarSelecao("selTipo", TIPOS, state.tipo);
  montarSelecao("selTamanho", TAMANHOS, state.tamanho);
  montarSelecao("selIA", IAs, state.provider);
  montarSelecao("selEstilo", ESTILOS, state.estilo);
  montarSelecao("selAbordagem", ABORDAGENS, state.abordagem);
  montarSelecao("selIntencao", INTENCOES, state.intencao);
  montarSegmentos();

  $("selTipo").addEventListener("change", function () {
    state.tipo = this.value;
    salvarConfig();
  });
  $("selTamanho").addEventListener("change", function () {
    state.tamanho = this.value;
    salvarConfig();
  });
  $("selIA").addEventListener("change", function () {
    state.provider = this.value;
    salvarConfig();
  });
  $("selEstilo").addEventListener("change", function () {
    state.estilo = this.value;
    salvarConfig();
  });
  $("selAbordagem").addEventListener("change", function () {
    state.abordagem = this.value;
    salvarConfig();
  });
  $("selIntencao").addEventListener("change", function () {
    state.intencao = this.value;
    salvarConfig();
  });

  function syncModos() {
    $("modoAlto").checked = state.altoImpacto;
    $("modoAlto").closest(".modo").classList.toggle("ativo", state.altoImpacto);
    $("modoCompartilhar").checked = state.paraCompartilhar;
    $("modoCompartilhar").closest(".modo").classList.toggle("ativo", state.paraCompartilhar);
  }
  syncModos();

  $("modoAlto").addEventListener("change", function () {
    state.altoImpacto = this.checked;
    salvarConfig();
    syncModos();
  });
  $("modoCompartilhar").addEventListener("change", function () {
    state.paraCompartilhar = this.checked;
    salvarConfig();
    syncModos();
  });

  $("labelBtnGerar").textContent = "Gerar " + (state.quantidade === 1 ? "frase" : state.quantidade + " frases");
  $("btnGerar").addEventListener("click", gerar);

  $("abaGerador").addEventListener("click", function () { irParaAba("gerador"); });
  $("abaFavoritos").addEventListener("click", function () { irParaAba("favoritos"); });

  $("filtroBanco").addEventListener("click", function (ev) {
    var b = ev.target.closest(".seg");
    if (!b) return;
    for (var i = 0; i < $("filtroBanco").children.length; i++) {
      $("filtroBanco").children[i].classList.toggle("ativo", $("filtroBanco").children[i] === b);
    }
    renderBanco(b.getAttribute("data-filtro"));
  });

  $("btnCopiarTop10").addEventListener("click", function () {
    var lista = TOP10_HASHTAGS[state.categoria] || TOP10_HASHTAGS.fe;
    copiarTexto(lista.join(" "));
  });

  registrarAcoes($("listaResultados"), "gerador");
  registrarAcoes($("listaBanco"), "banco");

  atualizarContadorFavoritos();

  /* gera a primeira leva ao abrir */
  gerar();
})();