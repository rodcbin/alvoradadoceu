/* ============================================================
 * Alvorada do Céu — Motor de geração de frases espirituais
 *
 * Provedores (em ordem de tentativa):
 *   1. Cloudflare Workers AI     (usa CF_ACCOUNT_ID + CF_API_TOKEN)
 *   2. OpenRouter                (usa OPENROUTER_API_KEY)
 *   3. Mistral AI                (usa MISTRAL_API_KEY)
 *   4. Banco local               (garantia offline)
 * ============================================================ */
"use strict";

const PROVIDER_LABELS = {
  cloudflare: "Cloudflare Workers AI",
  openrouter: "OpenRouter (IA grátis)",
  mistral: "Mistral AI (IA grátis)",
  local: "Frases locais (offline)",
};

const MAX_QUANTIDADE = 30;
const MAX_OUTPUT_TOKENS = 8192;
const MODO_ALTO_IMPACTO_TIPO = {};

/* ------------------------------------------------------------------ */
/* Categorias                                                          */
/* ------------------------------------------------------------------ */
const CATEGORIAS = [
  { id: "fe", label: "Fé", emoji: "🙌", kw: "maos orando ceu nuvens luz, faith praying hands sky light", tags: "#fe #deus #feemdeus #esperanca #alvoradadoceu" },
  { id: "oracao", label: "Oração", emoji: "🙏", kw: "maos em oracao vela biblia luz, prayer hands candle bible light", tags: "#oracao #deus #fe #devocional #alvoradadoceu" }
];

const CATEGORIA_POR_ID = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));

/* ------------------------------------------------------------------ */
/* Formatos (tipos de conteúdo) e tamanhos                             */
/* ------------------------------------------------------------------ */
const TIPOS = {
  impacto: { label: "Frase de impacto", instrucao: "frase de impacto, com gancho forte no início e final memorável" },
  sequencia: { label: "Sequência para Reel", instrucao: "sequência de 2 a 4 blocos curtos que aparecem um por vez na tela do Reel" }
};

const TAMANHOS = {
  muito_curto: { label: "Muito curto (5-12 palavras)", instrucao: "USE de 5 a 12 palavras no total." },
  curto: { label: "Curto (12-25 palavras)", instrucao: "USE de 12 a 25 palavras no total." },
  medio: { label: "Médio (25-45 palavras)", instrucao: "USE de 25 a 45 palavras no total." },
  reel: { label: "Reel (2-4 blocos)", instrucao: "ESCREVA de 2 a 4 blocos curtos, cada bloco em sua própria linha (sem numeração), que possam aparecer um por vez na tela. Cada bloco com no máximo 12 palavras." }
};

function sanitizeCategoria(id) {
  if (!id || id === "todas" || id === "todos") return "todas";
  return Object.prototype.hasOwnProperty.call(CATEGORIA_POR_ID, id) ? id : "todas";
}

function catLabel(id) {
  if (id === "todas") return "qualquer tema cristão/espiritual (escolha um foco natural em cada frase)";
  const c = CATEGORIA_POR_ID[id];
  return c ? c.label : "Fé";
}

function kwFor(id) {
  const c = CATEGORIA_POR_ID[id];
  return c ? c.kw : CATEGORIAS[0].kw;
}

function tagsFor(id) {
  const c = CATEGORIA_POR_ID[id];
  return c ? c.tags : CATEGORIAS[0].tags;
}

/* ================================================================== */
/* Gerador inteligente de conteúdo para Reels cristãos                */
/*                                                                     */
/* Pipeline: TEMA → EMOÇÃO → DOR/DESEJO → INTENÇÃO → FRASE →          */
/* LEGENDA → HASHTAGS → PALAVRAS-CHAVE                                 */
/* ================================================================== */

/* Hashtags genéricas de "caça ao alcance" — evitadas por padrão        */
const HASHTAGS_PROIBIDAS = [
  "viral", "fyp", "foryou", "fy", "explore", "trending", "instagood",
  "reels", "reelsinstagram", "reelsbrasil", "reelsbrasiloficial",
  "reel", "reelsbrasil", "dicasparavedio", "paravoce", "para-voce",
  "instagram", "instagood", "followforfollow", "tagsforlikes"
];

/* Chamadas manipulativas que nunca devem ser usadas                    */
const CTA_BANIDOS = [
  /comente\s*(a|o|:)?\s*am[eé]m/i,
  /digite\s+eu\s+creio/i,
  /digite\s+am[eé]m/i,
  /comente\s+eu\s+creio/i,
  /compartilhe\s+com\s+(10|20|5|3|7)\s+pessoas/i,
  /envie?\s+para\s+(10|20|5|3|7)\s+pessoas/i,
  /toque\s+duas\s+vezes/i
];

/* Formatos de abordagem da frase (variação para não parecer fórmula)   */
const FORMATOS_FRASE = [
  { id: "identificacao", label: "Identificação", instrucao: "IDENTIFICAÇÃO: uma frase que faz a pessoa pensar \u201Cisso sou eu\u201D — reconhecer a própria dor/esperança no primeiro segundo" },
  { id: "contraste", label: "Contraste", instrucao: "UM CONTRASTE entre o que parece (perda, silêncio, fim, fraqueza) e o que Deus está fazendo (vitória, presença, recomeço, força)" }
];

/* Formatos de legenda (estilos escolhidos pelo usuário)                */
const ESTILOS_LEGENDA = [
  { id: "curto", label: "Curta e viral", instrucao: "legenda RESUMIDA, de alto impacto: no máximo 4 linhas e ~30 palavras; 1.ª linha = gancho emocional que prende e gera identificação, depois 1-2 linhas de mensagem com força e 1 linha final de convite natural para seguir @alvoradadoceu. Tom direto, moderno e reverente, sem rodeios" },
  { id: "emocional", label: "Emocional e acolhedora", instrucao: "legenda emocional e acolhedora e RESUMIDA (~30-45 palavras): abre com uma cena/dor que toca (conexão), passa pela mensagem de Deus/fé/esperança, acolhe (você não está sozinho) e fecha com convite natural e VARIADO para seguir @alvoradadoceu" }
];

/* Intenções de engajamento (usadas internamente para guiar o texto)    */
const INTENCOES_ENGAJAMENTO = [
  { id: "share", label: "Compartilhamento", instrucao: "dar vontade de a pessoa enviar a mensagem a alguém que está precisando" },
  { id: "save", label: "Salvamento", instrucao: "dar vontade de salvar para reler quando precisar" },
  { id: "comment", label: "Comentário", instrucao: "despertar uma reflexão tão pessoal que a pessoa sinta vontade de responder nos comentários" },
  { id: "identification", label: "Identificação", instrucao: "fazer a pessoa sentir que a mensagem foi escrita para ela, \u201Cisso sou eu\u201D" }
];

const FORMATOS_FRASE_AUTO = "identificação, contraste";

/* ---------------------------------------------------------------- */
/* Banco inteligente de hashtags por categoria                       */
/* amplo = termo do nicho · nicho = categoria · especifico = subnicho */
/* ---------------------------------------------------------------- */
const FAMILIAS = {
  deus: {
    amplo: ["#Deus", "#Fé", "#Esperança"],
    nicho: ["#VidaComDeus", "#ConfieEmDeus"],
    especifico: ["#DeusNoComando", "#SilêncioDeDeus", "#AmorDeDeus", "#PresençaDeDeus", "#DeusSabe", "#FidelidadeDeDeus"],
    kwBase: ["Deus", "fé", "confiança em Deus", "silêncio de Deus", "esperar em Deus", "fidelidade de Deus", "oração", "propósito de Deus"],
    emo: { emocao: "confiança", necessidade: "força para esperar mesmo sem enxergar", dor: "sentir Deus distante ou em silêncio" },
    msg: [
      "Deus não está longe no meio da luta; Ele está mais perto exatamente onde dói.",
      "O que você não consegue entender hoje, Deus já enxergou por inteiro. Confie no processo dEle."
    ]
  },
  jesus: {
    amplo: ["#Jesus", "#Deus", "#Salvação"],
    nicho: ["#JesusTeAma", "#CaminhoDeCristo"],
    especifico: ["#AmorDeJesus", "#GraçaDeDeus", "#VidaComCristo", "#Evangelho", "#Redenção"],
    kwBase: ["Jesus", "salvação", "graça", "amor de Jesus", "redenção", "vida com Cristo", "perdão", "recomeço"],
    emo: { emocao: "acolhimento", necessidade: "pertencimento e perdão", dor: "cansaço, culpa e sensação de não ser o bastante" },
    msg: [
      "Jesus não acolhe quem é perfeito; Ele acolhe quem chega cansado e entrega o peso.",
      "Em Cristo, você não é o erro que cometeu: você é o filho que Ele veio buscar."
    ]
  },
  fe: {
    amplo: ["#Deus", "#Fé", "#Esperança"],
    nicho: ["#FéEmDeus", "#DeusNoComando", "#ConfiançaEmDeus"],
    especifico: ["#CrerSemVer", "#VidaComDeus", "#AcrediteEmDeus", "#Jesus", "#MilagresAcontecem"],
    kwBase: ["fé", "confiança", "crer sem ver", "espera em Deus", "coragem", "milagre", "Deus"],
    emo: { emocao: "esperança", necessidade: "segurança para crer sem ver", dor: "dúvida e insegurança" },
    msg: [
      "A fé não elimina a tempestade; ela te firma em quem já acalmou o mar.",
      "Nem todo passo é dado com tudo resolvido: a fé também caminha na incerteza."
    ]
  },
  oracao: {
    amplo: ["#Oração", "#Deus", "#Fé"],
    nicho: ["#Devocional", "#PalavraDeDeus", "#VidaDeOração"],
    especifico: ["#OraçãoDaManhã", "#OraçãoDaNoite", "#MomentoComDeus", "#ConversaComDeus", "#Paz"],
    kwBase: ["oração", "fé", "intimidade com Deus", "orar", "entrega", "Deus", "paz", "diálogo com Deus"],
    emo: { emocao: "paz", necessidade: "entregar o peso a Deus", dor: "angústia e noites em claro" },
    msg: [
      "A oração é o lugar onde a alma entrega o que as mãos não conseguem segurar.",
      "Conversar com Deus recoloca no coração a paz que o dia levou."
    ]
  },
  esperanca: {
    amplo: ["#Esperança", "#Deus", "#Fé"],
    nicho: ["#EsperançaEmDeus", "#UmNovoTempo"],
    especifico: ["#Recomeço", "#AmanhãMelhor", "#TempoDeDeus", "#MilagresAcontecem"],
    kwBase: ["esperança", "fé", "recomeço", "um novo tempo", "restauração", "amanhã", "Deus"],
    emo: { emocao: "esperança", necessidade: "renovar a fé no amanhã", dor: "desânimo depois de muitas tentativas" },
    msg: [
      "Esperança é saber que Deus ainda escreve o capítulo que você não vê.",
      "O dia de hoje não decide o fim da sua história; a promessa de Deus sim."
    ]
  },
  paz: {
    amplo: ["#Paz", "#Deus", "#Serenidade"],
    nicho: ["#PazDeDeus", "#PazInterior"],
    especifico: ["#DescansoEmDeus", "#CalmaNaTempestade", "#DeusTemControle", "#PazQueExcede"],
    kwBase: ["paz", "fé", "descanso", "ansiedade", "confiança em Deus", "Deus no controle", "serenidade"],
    emo: { emocao: "paz", necessidade: "aquietar a mente e o coração", dor: "correria mental e ansiedade" },
    msg: [
      "A paz de Deus não depende do silêncio lá fora; ela nasce dentro de quem confia.",
      "Quando a mente acelera, é hora de voltar para os braços de Deus e descansar."
    ]
  },
  reflexao: {
    amplo: ["#Reflexão", "#Deus", "#Fé"],
    nicho: ["#ReflexãoCristã", "#MomentoDeReflexão"],
    especifico: ["#Introspecção", "#AprenderComAVida", "#OlharParaDentro", "#PensandoAMais"],
    kwBase: ["reflexão", "Deus", "sentido da vida", "aprendizado", "introspecção", "fé", "propósito", "recomeço"],
    emo: { emocao: "serenidade", necessidade: "encontrar sentido", dor: "perguntas sem resposta" },
    msg: [
      "Talvez os dias difíceis estejam aqui para te ensinar a ouvir melhor a voz de Deus.",
      "A resposta que você procura talvez esteja no silêncio que você ainda não aceitou."
    ]
  },
  recomeco: {
    amplo: ["#Recomeço", "#Deus", "#Esperança"],
    nicho: ["#NovoCiclo", "#SegundaChance"],
    especifico: ["#NovoCapítulo", "#DeusFazAlgoNovo", "#RecomeçarComDeus", "#NovaHistória"],
    kwBase: ["recomeço", "recomeçar com Deus", "novo ciclo", "esperança", "renovação", "perdão", "propósito", "Deus"],
    emo: { emocao: "esperança", necessidade: "permissão para recomeçar", dor: "culpa e medo de falhar novamente" },
    msg: [
      "Recomeçar com Deus não é ignorar o passado; é receber dEle um coração renovado.",
      "O que parecia o fim pode ser exatamente o recomeço que Deus preparou."
    ]
  },
  gratidao: {
    amplo: ["#Gratidão", "#Deus", "#Fé"],
    nicho: ["#CoraçãoGrato", "#GratidãoSempre"],
    especifico: ["#BênçãosDeDeus", "#DeusÉFiel", "#AgradeçaSempre", "#MelhorAtitude"],
    kwBase: ["gratidão", "fé", "bênçãos de Deus", "reconhecimento", "alegria", "Deus", "contentamento"],
    emo: { emocao: "gratidão", necessidade: "enxergar o que já recebeu", dor: "foco excessivo no que falta" },
    msg: [
      "A gratidão muda a forma de enxergar o dia: quem agradece passa a ver o cuidado de Deus em cada detalhe.",
      "Existe bênção, sim — e ela vive na memória de quem aprende a ser grato."
    ]
  },
  familia: {
    amplo: ["#Família", "#Deus", "#Proteção"],
    nicho: ["#FamíliaQueOra", "#LaresQueOram"],
    especifico: ["#AmorEmFamília", "#DeusNoLar", "#UniãoEmFamília", "#ProteçãoDeDeus"],
    kwBase: ["família", "Deus", "proteção", "união", "oração em família", "amor", "lar", "fé"],
    emo: { emocao: "amor", necessidade: "proteger e unir a família", dor: "conflitos e preocupação com os seus" },
    msg: [
      "Uma família que ora permanece unida mesmo quando o vento tenta desviar o caminho.",
      "Que a paz de Deus governe cada lar que lê esta palavra hoje."
    ]
  },
  protecao: {
    amplo: ["#Proteção", "#Deus", "#Fé"],
    nicho: ["#Salmo91", "#ProteçãoDeDeus"],
    especifico: ["#DebaixoDasAsas", "#GuardadoPorDeus", "#AnjosDeDeus", "#DeusCuidaDeMim"],
    kwBase: ["proteção de Deus", "salmo 91", "fé", "segurança", "guardado por Deus", "Deus cuida", "ansiedade"],
    emo: { emocao: "segurança", necessidade: "sentir-se guardado", dor: "medo e sensação de ameaça" },
    msg: [
      "Deus guarda você mesmo quando você não percebe o perigo que passou.",
      "Debaixo do cuidado de Deus, nenhuma noite é longa demais."
    ]
  },
  ansiedade: {
    amplo: ["#Ansiedade", "#Paz", "#Deus"],
    nicho: ["#PazInterior", "#ConfieEmDeus"],
    especifico: ["#DeusCuidaDeVocê", "#SolteOControle", "#UmDiaDeCadaVez", "#DescansoEmDeus"],
    kwBase: ["ansiedade", "paz", "descansar em Deus", "confiança", "controle", "Deus no controle", "oração", "medo do futuro"],
    emo: { emocao: "ansiedade", necessidade: "descansar e soltar o controle", dor: "mente acelerada e medo do futuro" },
    msg: [
      "Ansiedade tenta roubar o hoje com medos de um amanhã que ainda é de Deus.",
      "Entregue a Deus o que você não consegue resolver e volte a respirar devagar."
    ]
  },
  "momentos-dificeis": {
    amplo: ["#MomentosDifíceis", "#Esperança", "#Força"],
    nicho: ["#FéNasDificuldades", "#DeusNaTempestade"],
    especifico: ["#ColoDeDeus", "#DeusEstáContigo", "#Restauração", "#PassandoPelaProvação"],
    kwBase: ["momento difícil", "fé", "força", "perseverança", "Deus está contigo", "provação", "esperança", "restauração"],
    emo: { emocao: "dor", necessidade: "consolo e força para continuar", dor: "sofrimento, lágrimas e esgotamento" },
    msg: [
      "A fase difícil não é o fim: é o lugar onde Deus constrói aquilo que ninguém vai conseguir explicar depois.",
      "Deus não desperdiça nenhuma lágrima — cada uma rega uma renovação."
    ]
  },
  "amor-de-deus": {
    amplo: ["#AmorDeDeus", "#Deus", "#Fé"],
    nicho: ["#DeusTeAma", "#JesusTeAma"],
    especifico: ["#AmorIncondicional", "#CuidadoDeDeus", "#GraçaDeDeus", "#DeusSeImporta"],
    kwBase: ["amor de Deus", "graça", "Deus te ama", "cuidado de Deus", "amor incondicional", "misericórdia", "fé"],
    emo: { emocao: "amor", necessidade: "sentir-se amado do jeito que é", dor: "invisibilidade e autocrítica" },
    msg: [
      "O amor de Deus não compete: Ele não ama por mérito, ama porque é quem é.",
      "Você pode estar longe de tudo, mas nunca longe do coração de Deus."
    ]
  },
  confianca: {
    amplo: ["#Confiança", "#Deus", "#Fé"],
    nicho: ["#ConfieEmDeus", "#DeusNoComando"],
    especifico: ["#ConfiarNoProcesso", "#EntregaTotal", "#DeusTemUmTempo", "#NoRitmoDeDeus"],
    kwBase: ["confiança em Deus", "entrega", "Deus no comando", "esperar no Senhor", "fé", "tempo de Deus", "direção"],
    emo: { emocao: "confiança", necessidade: "entregar o controle", dor: "precisar planejar tudo sozinho(a)" },
    msg: [
      "Confiar em Deus é entregar o mapa de uma viagem que só Ele conhece.",
      "Sua parte é dar o próximo passo; a de Deus é abrir o caminho."
    ]
  },
  superacao: {
    amplo: ["#Superação", "#Fé", "#Força"],
    nicho: ["#VitóriaEmDeus", "#ForçaParaContinuar"],
    especifico: ["#HistóriaDeVitória", "#LevantaESiga", "#DeusLutaPorVocê", "#NovaHistória"],
    kwBase: ["superação", "fé", "força", "vitória", "perseverança", "testemunho", "Deus", "milagre"],
    emo: { emocao: "coragem", necessidade: "lembrar que é mais forte do que pensa", dor: "sensação de fracasso e exaustão" },
    msg: [
      "A sua história de dor vai se tornar testemunho para quem está vivendo o agora.",
      "Você não chegou até aqui por acaso: há uma força invisível que vem de Deus."
    ]
  },
  manha: {
    amplo: ["#BomDia", "#Deus", "#Gratidão"],
    nicho: ["#OraçãoDaManhã", "#ComeçandoComDeus"],
    especifico: ["#BomDiaComDeus", "#UmNovoDia", "#GratidãoPelaVida", "#AmanhecerECrer"],
    kwBase: ["bom dia", "oração da manhã", "gratidão", "novo dia", "recomeço", "Deus", "fé", "propósito do dia"],
    emo: { emocao: "alegria", necessidade: "começar o dia com fé", dor: "cansaço e falta de ânimo ao acordar" },
    msg: [
      "Cada manhã é um lembrete do cuidado de Deus: hoje é um novo dia com novas chances.",
      "Comece o dia entregando a Deus o que você não consegue carregar."
    ]
  },
  noite: {
    amplo: ["#BoaNoite", "#Deus", "#Paz"],
    nicho: ["#OraçãoDaNoite", "#NoiteEmPaz"],
    especifico: ["#BoaNoiteComDeus", "#DescanseEmDeus", "#AgradeçaPeloDia", "#PazParaDormir"],
    kwBase: ["boa noite", "oração da noite", "paz", "descanso", "gratidão pelo dia", "Deus", "entrega"],
    emo: { emocao: "serenidade", necessidade: "fechar o dia em paz", dor: "mente que não desliga e arrependimentos" },
    msg: [
      "Antes de dormir, solte o peso nas mãos de Deus: Ele cuida da noite.",
      "O dia pode ter sido difícil, mas a paz de Deus pode encerrá-lo bem."
    ]
  },
  dormir: {
    amplo: ["#BoaNoite", "#Paz", "#Deus"],
    nicho: ["#DurmaEmPaz", "#DescanseEmDeus"],
    especifico: ["#PazParaDormir", "#DeusVelaPorVocê", "#OraçãoDaNoite", "#ConfieEmDeus"],
    kwBase: ["boa noite", "dormir em paz", "descanso", "Deus vela por você", "confiança", "oração da noite", "paz", "proteção"],
    emo: { emocao: "alívio", necessidade: "descansar sem medo", dor: "insônia e pensamentos que não param" },
    msg: [
      "Deus não dorme; pode descansar em paz, Ele vela por você.",
      "Amanhã é um novo capítulo — hoje descanse no cuidado de quem nunca falha."
    ]
  },
  domingo: {
    amplo: ["#Domingo", "#Deus", "#Igreja"],
    nicho: ["#DiaDoSenhor", "#DescansoEmDeus"],
    especifico: ["#DescansoDoCoração", "#HoraDeAdorar", "#DeusEmPrimeiro", "#LouvorEGratidão"],
    kwBase: ["domingo", "igreja", "adoração", "descanso", "fé", "Deus", "louvor", "gratidão"],
    emo: { emocao: "gratidão", necessidade: "recarregar a alma", dor: "esgotamento da rotina" },
    msg: [
      "O domingo é um convite para a alma descansar na presença de Deus.",
      "Há um descanso que só Deus oferece: ele não cabe na rotina, cabe no coração."
    ]
  },
  segunda: {
    amplo: ["#SegundaFeira", "#Recomeço", "#Deus"],
    nicho: ["#InícioDeSemana", "#FéParaASemana"],
    especifico: ["#SemanaDoSenhor", "#DeusVaiÀFrente", "#ForçaParaComeçar", "#NovoInício"],
    kwBase: ["segunda-feira", "novo começo", "semana", "coragem", "Deus", "fé", "recomeço", "propósito"],
    emo: { emocao: "coragem", necessidade: "ânimo para começar a semana", dor: "desânimo e peso da rotina" },
    msg: [
      "A semana pertence a Deus: comece ela confiando, não ansioso.",
      "Segunda também é dia de fé, de recomeço e de propósito."
    ]
  },
  "fim-de-semana": {
    amplo: ["#Descanso", "#Deus", "#Família"],
    nicho: ["#FimDeSemanaComDeus", "#TempoEmFamília"],
    especifico: ["#RecarregueAFé", "#PazEmFamília", "#AproveiteOsSeus", "#DescansoDeDeus"],
    kwBase: ["fim de semana", "descanso", "família", "Deus", "paz", "fé", "tempo com Deus", "recarregar"],
    emo: { emocao: "alegria", necessidade: "descansar de verdade", dor: "rotina exaustiva" },
    msg: [
      "Descansar também é parte do plano de Deus para a sua alma.",
      "Aproveite o fim de semana para recarregar a fé e a presença de Deus."
    ]
  },
  hoje: {
    amplo: ["#Hoje", "#Deus", "#Fé"],
    nicho: ["#MensagemParaHoje", "#PalavraDeHoje"],
    especifico: ["#DeusCuidaDeHoje", "#GraçaParaHoje", "#UmDiaDeCadaVez", "#VivaHoje"],
    kwBase: ["hoje", "palavra de hoje", "Deus", "fé", "graça de Deus", "provisão diária", "esperança", "um dia de cada vez"],
    emo: { emocao: "esperança", necessidade: "viver o presente com fé", dor: "preocupação excessiva com o futuro" },
    msg: [
      "Deus já providenciou o que você precisa para hoje; confie nisso.",
      "Viva o hoje com fé e deixe o amanhã nas mãos de quem conhece o futuro."
    ]
  },
  "frase-impacto": {
    amplo: ["#FraseDeImpacto", "#Deus", "#Fé"],
    nicho: ["#MensagemDeDeus", "#ReflexãoCristã"],
    especifico: ["#MensagemQueToca", "#FraseParaRefletir", "#MensagemDeEsperança", "#PalavraQueAcolhe"],
    kwBase: ["frase de impacto", "Deus", "fé", "reflexão", "mensagem de esperança", "recomeço", "motivação", "força"],
    emo: { emocao: "esperança", necessidade: "recomeçar confiante", dor: "desânimo e dúvidas" },
    msg: [
      "Mensagem rápida, mas que fica: Deus ainda não acabou a sua história.",
      "Que essa frase toque você hoje e mude a forma de olhar o seu dia."
    ]
  },
  "reflexao-espiritual": {
    amplo: ["#Espiritualidade", "#Deus", "#Fé"],
    nicho: ["#PalavraDeDeus", "#VidaEspiritual"],
    especifico: ["#CrescimentoEspiritual", "#AlmaEmPaz", "#PresençaDeDeus", "#DeCorpoEAlma"],
    kwBase: ["espiritualidade", "fé", "Deus", "palavra de Deus", "vida com Deus", "alma", "meditação", "oração"],
    emo: { emocao: "serenidade", necessidade: "conectar-se com Deus", dor: "vazio e agitação interna" },
    msg: [
      "A vida espiritual começa quando você aceita que não vive só do que vê.",
      "Deus fala baixo: quem desacelera, ouve."
    ]
  },
  sofrendo: {
    amplo: ["#Consolo", "#Deus", "#Esperança"],
    nicho: ["#CuraEmocional", "#DeusRestaura"],
    especifico: ["#ColoDeDeus", "#ChoreComDeus", "#Restauração", "#CuraDaAlma", "#DeusTeLevanta"],
    kwBase: ["dor", "consolo de Deus", "luto", "tristeza", "cura emocional", "restauração", "Deus cuida", "esperança"],
    emo: { emocao: "dor", necessidade: "consolo e acolhimento", dor: "sofrimento profundo e sensação de abandono" },
    msg: [
      "Pode doer agora; mas Deus recolhe cada lágrima e devolve em consolo.",
      "Você não precisa ser forte hoje: Deus é forte por você."
    ]
  }
};
FAMILIAS.todas = FAMILIAS.deus;

/* As 10 melhores hashtags do nicho (fé/spiritual) — alto alcance e relevância.
   Misturam 1 termo amplo + nicho + subnicho + contexto + a marca da página. */
const HASHTAGS_TOP10 = {
  fe: ["#Deus", "#Fé", "#FéEmDeus", "#DeusNoComando", "#Esperança", "#ConfiançaEmDeus", "#Jesus", "#CrerSemVer", "#VidaComDeus", "#alvoradadoceu"],
  oracao: ["#Oração", "#Deus", "#Fé", "#Devocional", "#PalavraDeDeus", "#OraçãoDaManhã", "#VidaDeOração", "#ConversaComDeus", "#Paz", "#alvoradadoceu"]
};

/* Detecção de contexto de publicação → hashtag específica (#5)         */
const CONTEXTO_TAGS = [
  { re: /manh[aã]|amanhecer|acordou|acordar/i, tags: ["#OraçãoDaManhã"] },
  { re: /noite|dormir|durma|descans[ae]|anoitecer|fechar o dia/i, tags: ["#OraçãoDaNoite"] },
  { re: /sil[eê]ncio/i, tags: ["#SilêncioDeDeus"] },
  { re: /l[áa]grima|choro|chorar/i, tags: ["#CuraEmocional"] },
  { re: /\bd[oó]r\b|sofr|machucado|ferid/i, tags: ["#ConsoloDeDeus"] },
  { re: /ansiedad|preocupad|receio|\bmedo\b/i, tags: ["#ConfieEmDeus"] },
  { re: /esperan/i, tags: ["#EsperançaEmDeus"] },
  { re: /\bamor\b|cora[çc][aã]o/i, tags: ["#AmorDeDeus"] },
  { re: /sonho|prop[óo]sito|chamado/i, tags: ["#PropósitoDeDeus"] },
  { re: /gratid[aã]o|obrigad|agradec/i, tags: ["#CoraçãoGrato"] },
  { re: /\bf[ée]\b|confiar|confian[iç]a|acreditar/i, tags: ["#FéEmDeus"] },
  { re: /milagre/i, tags: ["#MilagresAcontecem"] },
  { re: /restaur|renov|reconstru|curar|cura/i, tags: ["#DeusRestaura"] },
  { re: /fam[ií]lia|\bfilho\b|\bmarido\b|\besp[oó]sa?\b|\bm[aã]e\b|\bpai\b/i, tags: ["#Família"] },
  { re: /b[ií]blia|vers[ií]culo|salmo|palavra de deus|escritur/i, tags: ["#PalavraDeDeus"] },
  { re: /ora[çc][aã]o|orando|\borar\b|\bsenhor\b/i, tags: ["#VidaDeOração"] },
  { re: /\bport[ae]s?\b|fechou|fechad|abriu/i, tags: ["#DeusNoComando"] },
  { re: /cansad|fraqueza|sem for[çc]a|exausto|\bpeso\b/i, tags: ["#ColoDeDeus"] },
  { re: /vit[óo]ria|vencer|vencedor|supera/i, tags: ["#HistóriaDeVitória"] },
  { re: /\bpaz\b|calma|aquietar/i, tags: ["#PazDeDeus"] },
  { re: /amanh[aã]|novo dia|recome[çc]|renascer/i, tags: ["#NovoCiclo"] }
];

/* Detecção de contexto → palavras-chave de SEO                        */
const CONTEXTO_KW = [
  { re: /sil[eê]ncio/i, kw: ["silêncio de Deus", "ouvir a Deus"] },
  { re: /esperan/i, kw: ["esperança", "esperar em Deus"] },
  { re: /ansiedad|preocupad/i, kw: ["ansiedade", "confiança em Deus"] },
  { re: /\bmedo\b/i, kw: ["medo", "coragem"] },
  { re: /\bd[oó]r\b|sofr|triste|ferid/i, kw: ["dor", "consolo de Deus"] },
  { re: /l[áa]grima|choro/i, kw: ["cura emocional", "lágrimas"] },
  { re: /solid[aã]o|sozinh/i, kw: ["solidão", "presença de Deus"] },
  { re: /prop[óo]sito|sonho|chamad/i, kw: ["propósito de Deus", "sonhos"] },
  { re: /restaur|renov|reconstru|curar|cura/i, kw: ["restauração", "renovação"] },
  { re: /\bamor\b|cora[çc][aã]o/i, kw: ["amor de Deus"] },
  { re: /gratid[aã]o|obrigad|agradec/i, kw: ["gratidão a Deus", "bênçãos"] },
  { re: /milagre/i, kw: ["milagres", "fé"] },
  { re: /fam[ií]lia|\bfilho\b|\bmarido\b|\besp[oó]sa?\b|\bm[aã]e\b|\bpai\b/i, kw: ["família", "proteção da família"] },
  { re: /\bport[ae]s?\b|fechou|fechad/i, kw: ["portas abertas", "Deus no comando"] },
  { re: /\bcasa\b|\blar\b/i, kw: ["lar", "cuidado de Deus"] },
  { re: /b[ií]blia|vers[ií]culo|salmo|palavra de deus|escritur/i, kw: ["palavra de Deus", "bíblia"] },
  { re: /orar|orando|ora[çc][aã]o|\bsenhor\b/i, kw: ["oração", "intimidade com Deus"] },
  { re: /cansad|exausto|sem for[çc]a/i, kw: ["cansaço", "descansar em Deus"] },
  { re: /vit[óo]ria|vencer|supera/i, kw: ["vitória", "superação"] },
  { re: /amanh[aã]|amanhecer|novo dia/i, kw: ["novo dia", "recomeço"] }
];

/* Fragmentos genéricos de legenda (fallback offline)                  */
const LEGENDA_GENERICA = {
  conexao: [
    "Sabe aquele peso que você tenta esconder até de si mesmo? Deus já viu.",
    "Talvez você esteja vivendo uma fase que ninguém ao seu redor consegue entender.",
    "Nem todo mundo percebe, mas tem noites que parecem mais longas que as outras.",
    "Talvez hoje o silêncio esteja incomodando mais do que as respostas que você esperava.",
    "Existem batalhas que a gente luta por dentro e ninguém nem desconfia.",
    "Quando parece que tudo travou, é exatamente aí que Deus começa a mover.",
    "Você já sentiu que estava no limite, mas alguma coisa te fazia continuar?",
    "Tem gente que ora em silêncio e, mesmo assim, o coração grita."
  ],
  mensagem: [
    "Deus ainda está escrevendo a sua história, e Ele nunca te abandona no meio do caminho.",
    "Não é o fim: é mais um capítulo onde Deus está trabalhando coisas que você ainda vai entender.",
    "A esperança n'Ele renova as forças mesmo quando o corpo já não aguenta.",
    "A fé não elimina as perguntas; ela ensina a confiar mesmo sem respostas completas.",
    "Nenhuma oração é em vão: Deus responde no tempo certo, no jeito certo."
  ],
  acolhimento: [
    "Você não está sozinho(a): Deus conhece a sua história até o fim.",
    "Pode descansar: o cuidado de Deus alcança você onde você está agora.",
    "Não importa o tamanho do que você carrega, Deus oferece os braços pra aliviar.",
    "Há um plano maior do que os olhos conseguem ver hoje.",
    "Deus não mede distância: Ele chega no meio da tempestade."
  ],
  reflexao: [
    "Qual parte da sua vida você ainda não entregou nas mãos de Deus?",
    "O que você está esperando que Deus restaure na sua vida?",
    "Se Deus está trabalhando no seu silêncio, o que você está aprendendo com a espera?",
    "Em qual área você precisa soltar o controle e deixar Deus agir?",
    "Quem você conhece que também precisaria ouvir essa palavra hoje?"
  ],
  cta: [
    "Siga @alvoradadoceu para mais mensagens que tocam o coração. 🙏",
    "Siga @alvoradadoceu — reflexões diárias para alimentar a sua fé. 💛",
    "Se essa palavra alcançou você, envie para alguém que precisa ouvir. Siga @alvoradadoceu. 🙏",
    "Compartilhe essa esperança com quem você ama e siga @alvoradadoceu. ✨",
    "Continue firme! Siga @alvoradadoceu para receber uma palavra para cada dia. 🙌",
    ""
  ]
};

/* Palavras-chave gerais para completar qualquer tema                   */
const GERAL_KW_POOL = ["Deus", "fé", "esperança", "oração", "propósito", "confiança em Deus", "recomeço", "restauração"];

/* ---------------------------------------------------------------- */
/* Utilitários de variância e similaridade                           */
/* ---------------------------------------------------------------- */
function normTexto(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normKey(s) {
  return normTexto(s).replace(/[^a-z0-9#]/g, "");
}

function tokens(s) {
  return normTexto(s).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
}

function similaridadeNormalizada(a, b) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  const uniao = A.size + B.size - inter;
  return uniao ? inter / uniao : 1;
}

function hashFrase(s) {
  let h = 2166136261;
  const str = normTexto(s);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function limparHashtags(arr) {
  const out = [];
  const visto = new Set();
  for (const raw of arr || []) {
    const s = String(raw || "").trim();
    if (!s) continue;
    const nome = s.replace(/^#+/, "").trim();
    if (!nome) continue;
    if (HASHTAGS_PROIBIDAS.indexOf(nome.toLowerCase()) !== -1) continue;
    const key = normKey(nome);
    if (!key || visto.has(key)) continue;
    out.push("#" + nome.replace(/\s+/g, ""));
    visto.add(key);
  }
  return out.slice(0, 10);
}

function montarComDez(lista, poolExtras) {
  const out = lista.slice(0, 10);
  const visto = new Set(out.map((x) => normKey(String(x).replace(/^#+/, ""))));
  for (const raw of poolExtras || []) {
    if (out.length >= 10) break;
    const nome = String(raw || "").replace(/^#+/, "").replace(/\s+/g, "").trim();
    const k = normKey(nome);
    if (!k || !nome || visto.has(k)) continue;
    out.push("#" + nome);
    visto.add(k);
  }
  const temMarca = out.some((t) => normKey(String(t).replace(/^#+/, "")) === "alvoradadoceu");
  if (!temMarca && out.length < 10) out.push("#alvoradadoceu");
  else if (!temMarca && out.length === 10) out[out.length - 1] = "#alvoradadoceu";
  return out;
}

function detectarTagsContexto(texto) {
  const achadas = [];
  for (const regra of CONTEXTO_TAGS) {
    if (regra.re.test(texto)) achadas.push(regra.tags[0]);
  }
  return achadas.slice(0, 2);
}

function selecionarHashtags(catId, texto, evitar) {
  const f = FAMILIAS[catId] || FAMILIAS.deus;
  const h = hashFrase(texto);
  const combos = (evitar || [])
    .map((e) => (Array.isArray(e) ? e : []))
    .map((c) => c.map((x) => normKey(x)).filter(Boolean));
  const base = [].concat(f.amplo || []);
  if (base.length < 2) base.push(FAMILIAS.deus.amplo[0]);
  const extras = [].concat(f.nicho || [], f.especifico || [], detectarTagsContexto(texto));

  for (let off = 0; off < 6; off++) {
    const n = f.nicho || [];
    const e = f.especifico || [];
    const ctx = detectarTagsContexto(texto);
    const ordem = [
      n[(h + off) % (n.length || 1)],
      n[(h + off + 2) % (n.length || 1)],
      e[(h + off * 3 + 1) % (e.length || 1)],
      e[(h + off * 5 + 2) % (e.length || 1)],
      e[(h + off * 7 + 3) % (e.length || 1)],
      ctx[0],
      ctx[1]
    ].filter(Boolean);
    const cand = base.slice(0, 2).concat(ordem);
    const limpos = limparHashtags(cand);
    const chave = limpos.map((x) => normKey(x)).filter(Boolean).join("|");
    if (limpos.length >= 6 && !combos.some((c) => c.join("|") === chave)) {
      return montarComDez(limpos, extras);
    }
  }
  return montarComDez(limparHashtags(base), extras);
}

function derivarPalavrasChave(catId, frase, legenda, hashtags) {
  const f = FAMILIAS[catId] || FAMILIAS.deus;
  const texto = (frase || "") + " " + (legenda || "");
  const kw = [];
  for (const regra of CONTEXTO_KW) {
    if (regra.re.test(texto)) kw.push.apply(kw, regra.kw);
  }
  kw.push.apply(kw, f.kwBase || []);
  kw.push.apply(kw, GERAL_KW_POOL);

  const hsKeys = new Set((hashtags || []).map((x) => normKey(x)));
  const final = [];
  const visto = new Set();
  for (const k of kw) {
    const clean = String(k).trim();
    if (!clean) continue;
    const key = normKey(clean);
    if (!key || visto.has(key)) continue;
    if (hsKeys.has(key)) continue;
    visto.add(key);
    final.push(clean);
    if (final.length >= 8) break;
  }
  if (final.length < 5) {
    for (const k of GERAL_KW_POOL) {
      if (final.length >= 5) break;
      const key = normKey(k);
      if (!visto.has(key) && !hsKeys.has(key)) { visto.add(key); final.push(k); }
    }
  }
  return final.slice(0, 8);
}

function analisarContexto(catId) {
  const f = FAMILIAS[catId] || FAMILIAS.deus;
  return { catId, ...f.emo };
}

function buildLegendaLocal(frase, catId, variacao) {
  const v = Math.max(0, Number(variacao) || 0);
  const f = FAMILIAS[catId] || FAMILIAS.deus;
  const h = hashFrase(frase) + v;
  const g = LEGENDA_GENERICA;
  const mensagens = (f.msg && f.msg.length ? f.msg : g.mensagem);
  const parte = [
    g.conexao[h % g.conexao.length],
    mensagens[h % mensagens.length],
    g.acolhimento[(h + 1) % g.acolhimento.length]
  ];
  if (h % 3 !== 0) parte.push(g.reflexao[(h + 2) % g.reflexao.length]);
  const cta = g.cta[h % g.cta.length];
  if (cta) parte.push(cta);
  return parte.join("\n\n");
}

function legendaLocalVariada(frase, catId, legendaAtual) {
  const alvo = String(legendaAtual || "").replace(/\s+/g, " ").trim();
  for (let v = 1; v <= 6; v++) {
    const nova = buildLegendaLocal(frase, catId, v);
    if (nova.replace(/\s+/g, " ").trim() !== alvo) return { legenda: nova, variacao: v };
  }
  return { legenda: buildLegendaLocal(frase, catId, 7), variacao: 7 };
}

function montarItemLocal(frase, catId, evitar) {
  const legenda = buildLegendaLocal(frase, catId);
  const hashtags = selecionarHashtags(catId, frase + " " + legenda, evitar);
  const palavras_chave = derivarPalavrasChave(catId, frase, legenda, hashtags);
  return { frase, legenda, hashtags, palavras_chave, palavra_chave: kwFor(catId) };
}

function extrairHashtagsDoTexto(t) {
  const achadas = String(t || "").match(/[#\p{L}\p{N}_]+/gu) || [];
  const sem = String(t || "").replace(/[#\p{L}\p{N}_]+/g, " ");
  return {
    texto: sem.replace(/[ \t]{2,}/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim(),
    hashtags: achadas
  };
}

function splitHashtagsStr(s) {
  const m = String(s || "").match(/[#\p{L}\p{N}_]+/gu);
  return m ? m : [];
}

function splitKeywords(s) {
  return String(s || "").split(/[,\n;]+/).map((x) => x.trim()).filter(Boolean);
}

function normalizarEvitar(evitar) {
  const out = [];
  for (const e of evitar || []) {
    if (typeof e === "string") out.push({ frase: e, hashtags: [] });
    else if (e && typeof e === "object") {
      out.push({
        frase: String(e.frase || ""),
        hashtags: Array.isArray(e.hashtags) ? e.hashtags.map(String) : []
      });
    }
  }
  return out.slice(-10);
}

function validarItem(item, catId, evitar) {
  const probs = [];
  const f = String(item.frase || "").replace(/\s+/g, " ").trim();
  const l = String(item.legenda || "").trim();
  if (!f || f.split(/\s+/).length < 3) probs.push("frase-vazia-ou-curta");
  if (f.split(/\s+/).length > 45) probs.push("frase-longa");
  if (CTA_BANIDOS.some((r) => r.test(f))) probs.push("manipulacao-proibida");
  if (evitar && evitar.length) {
    for (const e of evitar) {
      const ef = String(e && e.frase ? e.frase : e || "");
      if (ef && f && similaridadeNormalizada(f, ef) > 0.72) {
        probs.push("frase-repetida");
        break;
      }
    }
  }
  const palLegenda = l ? l.split(/\s+/).length : 0;
  if (!l || palLegenda < 10) probs.push("legenda-curta");
  else if (palLegenda > 70) probs.push("legenda-longa");
  else {
    const primeira = f.split(/[.!?\n]/)[0].trim().toLowerCase();
    if (primeira.length > 22 && l.toLowerCase().indexOf(primeira) !== -1) probs.push("legenda-repete-frase");
  }
  const hs = item.hashtags || [];
  if (!hs.length || hs.length > 10) probs.push("hashtags");
  else {
    for (const h of hs) {
      const nome = String(h).replace(/^#/, "").trim().toLowerCase();
      if (!nome) probs.push("hashtag-invalida");
      else if (HASHTAGS_PROIBIDAS.indexOf(nome) !== -1) probs.push("hashtag-proibida");
    }
    if (new Set(hs.map((x) => normKey(x))).size !== hs.length) probs.push("hashtag-duplicada");
  }
  const kw = item.palavras_chave || [];
  if (kw.length < 5 || kw.length > 8) probs.push("palavras-chave");
  return probs;
}

function repararItem(item, catId, evitar) {
  const novo = Object.assign({}, item);
  const f = String(novo.frase || "");
  const l = String(novo.legenda || "");
  novo.hashtags = (novo.hashtags && novo.hashtags.length ? novo.hashtags : selecionarHashtags(catId, f + " " + l, evitar));
  novo.palavras_chave = derivarPalavrasChave(catId, f, l, novo.hashtags);
  if (!l || l.split(/\s+/).length < 10 || l.split(/\s+/).length > 70) novo.legenda = buildLegendaLocal(f, catId);
  novo.palavra_chave = novo.palavra_chave || kwFor(catId);
  return novo;
}

/* ------------------------------------------------------------------ */
/* Banco local de frases (garantia)                                    */
/* ------------------------------------------------------------------ */
const CURATED = {
  deus: [
    "Deus conhece o seu amanhã. Tudo o que Ele permite tem um propósito.",
    "Você pode não entender o caminho, mas quem segura a sua mão já viu o fim.",
    "Deus não está em silêncio por indiferença; Ele está trabalhando nos bastidores.",
    "Entregue a Deus o que pesa e veja o cuidado dEle chegar.",
    "Se Deus te trouxe até aqui, Ele não vai te soltar no meio do caminho.",
    "Você pode não ver a resposta, mas o tempo de Deus nunca chega fora de hora."
  ],
  jesus: [
    "Jesus acolhe quem está cansado. Leve a Ele o que ninguém mais segura.",
    "Em Cristo, o seu recomeço não é uma segunda chance: é uma nova vida.",
    "Se o mundo não te entende, lembre-se de quem te escolheu antes de você existir.",
    "A presença de Jesus transforma o dia mais cinza em amanhecer.",
    "Jesus carrega o que você não consegue. Solta, Ele cuida do resto.",
    "Não importa o tamanho da sua bagagem, o colo de Jesus sempre comporta você."
  ],
  fe: [
    "A fé não é ver a saída. É confiar em quem mostra o caminho.",
    "Mesmo quando você não sente, a sua fé continua cuidando do amanhã.",
    "Deus não pede que você resolva tudo hoje; pede apenas que confie.",
    "A fé abre portas que nem a sua lógica consegue ver.",
    "Sua fé não precisa ser grande, ela só precisa estar no lugar certo.",
    "Quando a fé assume o volante, a ansiedade perde o controle da direção."
  ],
  oracao: [
    "Senhor, acalma o coração de quem lê esta mensagem agora. Renova a esperança e lembra que ninguém caminha só.",
    "Ora, mesmo sem palavras: Deus entende o que o seu coração tenta dizer.",
    "Antes de dormir, entregue a Deus o que você não consegue resolver.",
    "A oração não muda a opinião de Deus; ela muda quem ora.",
    "Sempre que o mundo apertar, separe um minuto pra falar com Deus.",
    "A oração é o colo que a gente encontra sentado em qualquer lugar."
  ],
  esperanca: [
    "O choro pode durar uma noite, mas a alegria vem pela manhã.",
    "Amanhã nasce um novo dia, e com ele uma nova chance de recomeçar.",
    "Não desista: o melhor de Deus está logo além da curva.",
    "Esperança é acreditar que Deus ainda está escrevendo o capítulo final.",
    "A luz que você procura já está acesa no fim do teu caminho.",
    "Deus não tem pressa, mas nunca se atrasa pra quem espera n'Ele."
  ],
  paz: [
    "A paz que Deus dá não depende do que acontece lá fora.",
    "Pare de carregar amanhã hoje. Deus já cuidou do amanhã.",
    "Respira fundo. O mundo gira, mas Deus não se move nem falha.",
    "No meio da tempestade, há uma voz que sussurra: aquieta-te.",
    "Troca o barulho do mundo pela paz que Deus oferece em silêncio.",
    "Sua alma precisa de silêncio, não de mais problemas."
  ],
  reflexao: [
    "Talvez o que Deus esteja te tirando seja justamente o que te prendia.",
    "O silêncio também é resposta. E às vezes a resposta é esperar.",
    "Observe: os dias difíceis ensinam mais que os dias fáceis.",
    "Quem decide enxergar com o coração nunca anda completamente no escuro.",
    "Nem toda porta fechada é um fracasso; às vezes é Deus te protegendo.",
    "O que você recusa aprender hoje, a vida insiste em te ensinar até você aprender."
  ],
  recomeco: [
    "Recomeçar não é voltar ao início: é seguir com o que aprendeu.",
    "Deus não desperdiça a sua história. Cada recomeço tem um propósito.",
    "Hoje é o primeiro dia do que Deus ainda quer fazer com você.",
    "Não importa quantas vezes você caiu: importa que você ainda está de pé.",
    "Todo recomeço nasce de uma escolha: a de não desistir de você.",
    "O passado não define quem você vai ser a partir de hoje."
  ],
  gratidao: [
    "O que você agradece hoje, você multiplica amanhã.",
    "Comece reconhecendo as pequenas bênçãos: Deus mora nos detalhes.",
    "A gratidão é a porta que abre espaço para o que ainda virá.",
    "Seus problemas são grandes, mas suas bênçãos também. Não esqueça disso.",
    "Quem sabe dizer obrigado, sabe reconhecer o cuidado de Deus por toda parte.",
    "Agradeça pelo que você tem enquanto constrói o que deseja."
  ],
  familia: [
    "Que Deus proteja a sua família hoje, esteja você perto ou longe.",
    "Quem tem uma família unida na oração, carrega um tesouro invisível.",
    "O amor de casa é a primeira imagem que temos do amor de Deus.",
    "Não esqueça de quem orou por você desde o começo.",
    "A melhor herança que deixo aos meus é a fé que caminha com eles.",
    "Lar é onde a família ora junto e o amor cabe inteiro."
  ],
  protecao: [
    "O anjo do Senhor acampa ao redor de quem O ama.",
    "Você não precisa ver pra saber: tem alguém cuidando de você lá de cima.",
    "Debaixo das asas de Deus, nenhum mal te alcança.",
    "Durma tranquilo: a noite também está sob a guarda dEle.",
    "Enquanto você dorme, Deus vela por você e pelos seus.",
    "Não há perigo capaz de assustar quem caminha protegido por Deus."
  ],
  ansiedade: [
    "A ansiedade olha para o amanhã; a fé descansa nas mãos de Deus.",
    "O que você mais teme, Deus já viu. E já preparou a resposta.",
    "Não resolva hoje o que ainda nem aconteceu. Confie e respire.",
    "Você carrega peso demais nas costas. Deus se ofereceu a levar por você.",
    "Solte o controle que você nunca teve e abrace a paz que já é sua.",
    "Um dia de cada vez: Deus cuida do amanhã como cuidou do hoje."
  ],
  "momentos-dificeis": [
    "A dor não indica que Deus esqueceu você. Às vezes Ele está construindo.",
    "Os dias difíceis revelam a força que a gente nem sabia que tinha.",
    "Você não está sendo ignorado. Você está sendo preparado.",
    "Essa fase não é o fim da sua história; é o meio dela.",
    "A noite parece longa, mas o amanhecer de Deus não falha.",
    "Deus conhece a sua luta, e já está trabalhando nela."
  ],
  "amor-de-deus": [
    "O amor de Deus por você não depende do que você fez.",
    "Você é amado por quem você é, não pelo que você conquista.",
    "Mesmo quando você se sente invisível, Deus te carrega no olhar.",
    "Não há amor mais certo do que aquele que nunca desiste de você.",
    "Deus te ama num nível que nem o seu erro consegue alcançar.",
    "Nenhum começo é tarde demais para quem é amado por Deus."
  ],
  confianca: [
    "Confia no Senhor de todo o teu coração; Ele mostra o caminho.",
    "Sua parte é dar um passo; a parte de Deus é abrir o caminho.",
    "Não precisa entender a rota inteira. Basta confiar em quem te guia.",
    "O controle que você solta, Deus segura com firmeza.",
    "O que começa com fé, termina com testemunho.",
    "Confie no processo: Deus está trabalhando mesmo quando você não vê."
  ],
  superacao: [
    "A sua história de dor vai virar testemunho de vitória.",
    "Levanta, sacode a poeira e continua: Deus não te abandonou no meio.",
    "Você chegou até aqui. Isso já prova a força que carrega.",
    "O tamanho do seu problema não se compara ao tamanho do seu Deus.",
    "Toda luta vencida com Deus vira alicerce de uma vitória maior.",
    "Você não é o que aconteceu com você; você é o que Deus fará com você."
  ],
  manha: [
    "Bom dia! Este privilégio de acordar é mais uma chance de Deus para você.",
    "Comece o dia com fé: o que você não controla, Deus cuida.",
    "Que nesta manhã Deus renove suas forças e paz.",
    "Hoje também é um dia do Senhor. Agradeça e viva com propósito.",
    "Bom dia! Que hoje você enxergue o cuidado de Deus em cada detalhe.",
    "Acordar já é uma prova do amor de Deus por você."
  ],
  noite: [
    "Que sua noite seja leve: você fez o que pôde e Deus cuida do resto.",
    "O dia terminou, mas o cuidado de Deus continua.",
    "Descansa: a noite também está no calendário de Deus.",
    "Reveja o dia com gratidão e solte o que não deu certo.",
    "Boa noite! Amanhã Deus te espera com um novo capítulo.",
    "Solte o dia nas mãos de Deus e deixe a paz te abraçar."
  ],
  dormir: [
    "Antes de dormir, entregue a Deus aquilo que você não pode carregar.",
    "Durma em paz: o amanhã já está nas mãos de quem não dorme.",
    "Sua parte é descansar; a parte de Deus é guardar você.",
    "Amanhã é um novo dia. Hoje, apenas descanse no cuidado dEle.",
    "Dé um descanso à sua mente: Deus já está trabalhando.",
    "Fecha os olhos em paz, porque quem te guarda não fecha os seus."
  ],
  domingo: [
    "Que o domingo renove seu espírito e aproxime você de Deus.",
    "Dia de descanso e fé: deixe a alma ouvir o que o corpo nem percebe.",
    "Hoje é dia de virar o olhar para o alto e agradecer.",
    "Receba o domingo como um presente de Deus para a sua alma.",
    "Domingo é o dia de recarregar a alma na presença de Deus.",
    "Aproveite o descanso: até Deus descansou depois da obra pronta."
  ],
  segunda: [
    "Segunda-feira: novo dia, novas chances, mesma fé.",
    "Comece a semana com quem nunca falha: Deus vai à sua frente.",
    "Não comece o dia ansioso; comece agradecido.",
    "Essa semana também pertence a Deus. Caminhe nela com confiança.",
    "Que sua semana comece com Deus em primeiro lugar.",
    "Segunda é o dia de confiar de novo no cuidado de Deus pra semana toda."
  ],
  "fim-de-semana": [
    "Descanse de verdade: Deus validou o descanso antes do trabalho.",
    "Aproveite os seus: família e fé enchem o fim de semana de sentido.",
    "Final de semana é tempo de recarregar a alma.",
    "Que seu fim de semana tenha paz, sorrisos e a presença de Deus.",
    "Desliga o mundo por um instante e ouve Deus em silêncio.",
    "O fim de semana é um convite pra renovar o coração na fé."
  ],
  hoje: [
    "Hoje também é um capítulo que Deus está escrevendo com você.",
    "Não perca a esperança: o dia ainda pode surpreender você.",
    "Hoje, decida confiar mais um pouquinho em Deus.",
    "Tudo o que você precisa para hoje, Deus já providenciou.",
    "Não gaste o hoje se preocupando com um amanhã que ainda é de Deus.",
    "Hoje é o único dia que você tem: viva-o na paz de Deus."
  ],
  "frase-impacto": [
    "Você não está lendo isso por acaso.",
    "O que você está passando, já passou pelas mãos de Deus.",
    "Não desista justamente agora: a virada está mais perto do que parece.",
    "Deus sabe o que você não contou a ninguém.",
    "A sua luta tem data pra terminar, e o nome dela é vitória.",
    "Você foi escolhido pra vencer, não pra sofrer calado."
  ],
  "reflexao-espiritual": [
    "A alma também precisa de silêncio para ouvir a voz de Deus.",
    "Espiritualidade não é fugir da vida; é atravessar a vida com sentido.",
    "Deus fala baixo. Quem parar um pouco, ouve.",
    "Luz, fé e esperança: o essencial da alma não ocupa espaço na mala.",
    "Espiritualidade é saber que você não é só corpo: você é casa de Deus.",
    "Quando a alma está em paz, até o silêncio vira oração."
  ],
  sofrendo: [
    "Se dói muito, chore. Deus recolhe cada lágrima e não ignora nenhuma.",
    "Você não está sozinho nesta dor. Alguém já orou por você hoje.",
    "Essa dor não é o fim. Deus ainda tem consolo e renovo para você.",
    "Respira. Ele está contigo, mesmo quando você não sente.",
    "Você não precisa ser forte hoje. Deus é forte por você.",
    "Deixe Deus segurar você enquanto você não consegue se segurar."
  ]
};

const GENERIC_POOL = [
  "Envie para alguém que precisa lembrar: Deus está cuidando dela.",
  "Deus não te dá o que você não consegue carregar.",
  "A sua espera não é esquecimento; é preparação.",
  "Em paz me deito e logo adormeço, pois só tu, Senhor, me fazes viver em segurança. — Salmos 4:8",
  "Tudo posso naquele que me fortalece. — Filipenses 4:13",
  "Não tenha medo: a luz de Deus alcança onde a sua vista não alcança.",
  "Confie no processo silencioso de Deus.",
  "Quem ora não caminha sozinho.",
  "Chega uma hora em que a única resposta é: descansa em Deus.",
  "O amanhã pertence a Deus. Viva o hoje com fé.",
  "Você é mais forte do que acredita, porque não está só.",
  "Há paz reservada para quem entrega tudo nas mãos certas.",
  "Nada do que você passa fica sem propósito.",
  "Deus escreve certo por linhas que ainda não parecem retas.",
  "Se o silêncio te aflige, lembra: o silêncio de Deus é o Seu cuidado.",
  "Com Deus, até o recomeço é vitória.",
  "Cada lágrima molha a terra de um novo ciclo.",
  "Não compare a sua fase com a fase de ninguém: Deus é especialista em tempo.",
  "A fé faz o impossível caber na espera.",
  "Você não foi esquecido. Está apenas sendo preparado.",
  "O lugar mais seguro é onde a mão de Deus te alcança.",
  "O que começa em oração não termina em tragédia.",
  "Nasce da fé a força que você busca lá fora.",
  "Sua história ainda vai ter um final que louva a Deus.",
  "Antes de desistir, lembre que o autor do teu fim ainda está escrevendo.",
  "Quem caminha com Deus nunca caminha sem destino.",
  "Perto de Deus, até a espera tem propósito.",
  "Não há madrugada longa demais pra quem confia no amanhecer de Deus.",
  "O silêncio de Deus também é resposta que prepara a sua vitória.",
  "Descanse na promessa: o que Deus começou, Ele termina.",
  "Recomece hoje com a certeza de que Deus ainda não acabou com você.",
  "A tua bênção já está a caminho; não pare no meio da estrada.",
  "O cuidado de Deus não é barulhento, mas nunca falta.",
  "Não temas: quem faz as estrelas brilhar, cuida de você."
];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function localFrases(quantidade, categoria, evitar) {
  const cat = categoria === "todas" ? rand(CATEGORIAS).id : sanitizeCategoria(categoria);
  const pool = shuffle([...(CURATED[cat] || [])]).concat(shuffle([...(CURATED.deus || []), ...GENERIC_POOL]));
  const phrases = [];
  for (const p of pool) {
    if (phrases.length >= quantidade) break;
    if (!phrases.includes(p)) phrases.push(p);
  }
  /* top-up apenas em último caso (sem repetir a mesma frase em sequência) */
  let i = 0;
  while (phrases.length < quantidade && i < pool.length) {
    const cand = pool[i] + " 🙏";
    if (!phrases.includes(cand)) phrases.push(cand);
    i++;
  }
  const evitarCombos = (evitar || []).map((e) => Array.isArray(e?.hashtags) ? e.hashtags : []);
  return phrases.map((frase) => montarItemLocal(frase, cat, evitarCombos));
}

/* ------------------------------------------------------------------ */
/* HTTP helpers                                                        */
/* ------------------------------------------------------------------ */
async function request(url, options, body) {
  const timeout = options.timeout || 20000;
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const signal = controller ? controller.signal : undefined;
  const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
  let res;
  try {
    res = await fetch(url, {
      method: options.method || "GET",
      headers: Object.assign({ "User-Agent": UA }, options.headers || {}),
      body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
      signal,
    });
    const text = await res.text();
    let bodyStr = text;
    if (bodyStr.charCodeAt(0) === 0xfeff) bodyStr = bodyStr.slice(1);
    return { status: res.status || 0, headers: res.headers || {}, body: bodyStr };
  } catch (e) {
    if (e && (e.name === "AbortError" || e.message === "Timeout após " + timeout + "ms")) {
      throw new Error("Timeout após " + timeout + "ms");
    }
    throw e;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";

/* ------------------------------------------------------------------ */
/* Provedores                                                          */
/* ------------------------------------------------------------------ */
const CF_ACCOUNT = process.env.CF_ACCOUNT_ID || "";
const CF_TOKEN = process.env.CF_API_TOKEN || "";
const CF_TEXT_MODEL = process.env.CF_TEXT_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

async function cloudflare(messages) {
  if (!CF_ACCOUNT || !CF_TOKEN) throw new Error("Cloudflare não configurada (CF_ACCOUNT_ID / CF_API_TOKEN).");
  const url = "https://api.cloudflare.com/client/v4/accounts/" + encodeURIComponent(CF_ACCOUNT) + "/ai/v1/chat/completions";
  const res = await request(url, {
    method: "POST",
    timeout: 30000,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + CF_TOKEN }
  }, { model: CF_TEXT_MODEL, messages, temperature: 0.9, max_tokens: MAX_OUTPUT_TOKENS });
  if (res.status !== 200) throw new Error("Cloudflare HTTP " + res.status + ": " + res.body.slice(0, 160));
  let data;
  try { data = JSON.parse(res.body); } catch { throw new Error("Cloudflare: resposta inválida"); }
  if (!data || !data.choices || !data.choices.length) {
    throw new Error("Cloudflare: " + (data && data.errors ? JSON.stringify(data.errors).slice(0, 160) : "erro desconhecido"));
  }
  const text = ((data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "").trim();
  if (!text) throw new Error("Cloudflare: resposta vazia");
  return text;
}

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";

async function openrouter(messages) {
  if (!OPENROUTER_KEY) throw new Error("OpenRouter não configurado (OPENROUTER_API_KEY).");
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const res = await request(url, {
    method: "POST",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + OPENROUTER_KEY,
      "HTTP-Referer": "https://alvoradadoceu.com",
      "X-Title": "Alvorada do Ceu"
    }
  }, { model: OPENROUTER_MODEL, messages, temperature: 0.9, max_tokens: MAX_OUTPUT_TOKENS });
  if (res.status !== 200) throw new Error("OpenRouter HTTP " + res.status + ": " + res.body.slice(0, 160));
  let data;
  try { data = JSON.parse(res.body); } catch { throw new Error("OpenRouter: resposta inválida"); }
  if (!data || !data.choices || !data.choices.length) {
    throw new Error("OpenRouter: " + (data && data.error ? JSON.stringify(data.error).slice(0, 160) : "erro desconhecido"));
  }
  const text = ((data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "").trim();
  if (!text) throw new Error("OpenRouter: resposta vazia");
  return text;
}

const MISTRAL_KEY = process.env.MISTRAL_API_KEY || "";
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || "mistral-small-latest";

async function mistral(messages) {
  if (!MISTRAL_KEY) throw new Error("Mistral não configurado (MISTRAL_API_KEY).");
  const url = "https://api.mistral.ai/v1/chat/completions";
  const res = await request(url, {
    method: "POST",
    timeout: 30000,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + MISTRAL_KEY }
  }, { model: MISTRAL_MODEL, messages, temperature: 0.9, max_tokens: MAX_OUTPUT_TOKENS });
  if (res.status !== 200) throw new Error("Mistral HTTP " + res.status + ": " + res.body.slice(0, 160));
  let data;
  try { data = JSON.parse(res.body); } catch { throw new Error("Mistral: resposta inválida"); }
  if (!data || !data.choices || !data.choices.length) {
    throw new Error("Mistral: " + (data && data.message ? data.message : "erro desconhecido"));
  }
  const text = ((data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "").trim();
  if (!text) throw new Error("Mistral: resposta vazia");
  return text;
}

const PROVIDER_ORDER = [
  { id: "cloudflare", fn: cloudflare },
  { id: "openrouter", fn: openrouter },
  { id: "mistral", fn: mistral }
];

function configuredProviders() {
  return [
    { id: "cloudflare", label: PROVIDER_LABELS.cloudflare, ativo: !!(CF_ACCOUNT && CF_TOKEN) },
    { id: "openrouter", label: PROVIDER_LABELS.openrouter, ativo: !!OPENROUTER_KEY },
    { id: "mistral", label: PROVIDER_LABELS.mistral, ativo: !!MISTRAL_KEY },
    { id: "local", label: PROVIDER_LABELS.local, ativo: true }
  ];
}

/* ------------------------------------------------------------------ */
/* Prompt                                                              */
/* ------------------------------------------------------------------ */
function buildMessages(opts) {
  const { categoria, tipo, tamanho, quantidade, paraCompartilhar, estilo, abordagem, intencao, evitar, retry } = opts;
  const catId = (categoria === "todas") ? "deus" : sanitizeCategoria(categoria);
  const fml = FAMILIAS[catId] || FAMILIAS.deus;
  const emo = fml.emo || { emocao: "esperança", necessidade: "conforto e direção", dor: "momentos difíceis" };

  const system =
    "Você é o copywriter cristão da página \u201CAlvorada do Céu\u201D, especialista em conteúdo para Instagram Reels, " +
    "escrito em português do Brasil. A voz é humana, acolhedora, emocional e reconfortante — nunca formal ou religiosa demais. " +
    "Regras rígidas: " +
    "(1) frases e legendas SEMPRE originais — proibido copiar frases prontas da internet ou ceder a clichês como \u201CDeus está com você\u201D, \u201CTenha fé\u201D, \u201CDeus nunca te abandona\u201D (use-os raramente e com profundidade); " +
    "(2) proibido manipulação religiosa e pedidos artificiais de engajamento: nunca escreva \u201Ccomente AMÉM\u201D, \u201Cdigite EU CREIO\u201D, \u201Ccompartilhe com N pessoas\u201D ou \u201Ctoque duas vezes\u201D; " +
    "(3) proibido inventar citações bíblicas — se usar a Bíblia, use apenas referências reais e conhecidas e escreva em forma de citação; " +
    "(4) proibido afirmar números de volume, seguidores ou alcance de hashtags; " +
    "(5) a meta é conteúdo que gere identificação, compartilhamento e salvamento de forma natural, nunca forçado.";

  const linhas = [];
  linhas.push(
    "Crie " + quantidade + " publica" + (quantidade > 1 ? "ções" : "ção") + " cristã(s) para Reels sobre: " + catLabel(categoria) + "."
  );
  linhas.push(
    "Antes de escrever cada publicação, faça internamente esta sequência: TEMA \u2192 EMO\u00C7\u00C3O \u2192 DOR OU DESEJO DO P\u00DABLICO \u2192 INTEN\u00C7\u00C3O DE ENGAJAMENTO \u2192 FRASE DE IMPACTO \u2192 LEGENDA \u2192 HASHTAGS \u2192 PALAVRAS-CHAVE. Todos os 4 elementos de sa\u00EDda devem estar SEMANTICAMENTE conectados entre si."
  );
  linhas.push("EMO\u00C7\u00C3O predominante sugerida: " + emo.emocao + ". Necessidade emocional: " + emo.necessidade + ". Dor/problema do p\u00FAblico: " + emo.dor + ".");

  const intJ = INTENCOES_ENGAJAMENTO.find((i) => i.id === intencao);
  if (intJ) linhas.push("INTEN\u00C7\u00C3O DE ENGAJAMENTO principal deste lote: " + intJ.instrucao + ".");
  if (paraCompartilhar) linhas.push("Priorize dar vontade de compartilhar com algu\u00E9m, de forma natural e sem ordenar.");

  const forJ = FORMATOS_FRASE.find((f) => f.id === abordagem);
  if (forJ) linhas.push("FORMATO/ABORDAGEM da frase neste lote: " + forJ.instrucao + ".");
  else linhas.push("VARIEDADE DE FORMATO: alterne entre os formatos " + FORMATOS_FRASE_AUTO + " para que cada frase tenha estrutura diferente.");

  linhas.push("Tamanho da frase: " + (TAMANHOS[tamanho] ? TAMANHOS[tamanho].instrucao : TAMANHOS.curto.instrucao));

  linhas.push(
    "FRASE DE IMPACTO: curta, feita para prender nos primeiros segundos do Reel. Busque pelo menos um gatilho: " +
    "identifica\u00E7\u00E3o, curiosidade, emo\u00E7\u00E3o, esperan\u00E7a, contraste, reflex\u00E3o ou a sensa\u00E7\u00E3o de \u201Cisso foi escrito para mim\u201D. " +
    "Estruturas poss\u00EDveis (crie varia\u00E7\u00F5es originais, n\u00E3o copie): \u201CTalvez voc\u00EA precisava ouvir isso hoje...\u201D, " +
    "\u201CSe voc\u00EA est\u00E1 passando por isso, leia at\u00E9 o fim.\u201D, \u201CNem toda porta fechada \u00E9 uma perda.\u201D, " +
    "\u201CDeus pode estar trabalhando justamente onde voc\u00EA s\u00F3 enxerga sil\u00EAncio.\u201D, \u201CVoc\u00EA pediu um sinal? Talvez seja a resposta.\u201D"
  );

  const estJ = ESTILOS_LEGENDA.find((s) => s.id === estilo);
  linhas.push(
    "LEGENDA \u2014 REGRA DE OURO: RESUMIDA E VIRAL. No m\u00E1ximo 4 linhas e ~35 palavras no total (curta; n\u00E3o \u00E9 texto longo). " +
    (estJ && estJ.instrucao ? "Formato escolhido: " + estJ.instrucao + ". " : "Formato: gancho emocional \u2192 mensagem de impacto \u2192 convite natural para seguir. ") +
    "Sempre: 1.\u00AA linha \u00E9 o gancho que prende (identifica\u00E7\u00E3o ou contraste \u2014 nunca clich\u00EA tipo \u201CDeus est\u00E1 com voc\u00EA\u201D); depois 1-2 linhas de mensagem com for\u00E7a; voc\u00EA pode usar 1 linha de pergunta que gere coment\u00E1rio natural. " +
    "Depois de escrever, conte as palavras e ENCURTE: se passou de 35, corte. " +
    "N\u00C3O repita a FRASE na legenda; N\u00C3O coloque hashtags dentro da legenda; inclua de forma natural 1-2 das palavras de SEO: " +
    (fml.kwBase || []).slice(0, 4).join(", ") + " \u2014 sem keyword stuffing."
  );
  linhas.push(
    "Convite para seguir: em todos os itens, feche com um convite natural de no m\u00E1ximo 1 linha e VARIADO \u00E0 p\u00E1gina @alvoradadoceu " +
    "(ex.: \u201CSiga @alvoradadoceu para mais palavras que tocam o cora\u00E7\u00E3o \uD83D\uDE4F\u201D, \u201CReflex\u00F5es di\u00E1rias para alimentar a sua f\u00E9 \u2014 siga @alvoradadoceu \uD83D\uDC9B\u201D). Nunca repetir a mesma chamada em todos os itens."
  );
  linhas.push(
    "HASHTAGS: m\u00E1ximo 10 hashtags, todas integradas e RELEVANTES ao tema (n\u00E3o repita sempre as mesmas entre publica\u00E7\u00F5es). " +
    "Use como base as 10 de ALTO ALCANCE do nicho: " + (HASHTAGS_TOP10[catId] || HASHTAGS_TOP10.fe).join(" ") +
    ". Estruture: 2 termos amplos (#Deus, #F\u00E9), 2 da categoria (#F\u00E9EmDeus/#Devocional), 3 subnicho, 2 de contexto do texto, e sempre a marca #alvoradadoceu. " +
    "PROIBIDAS: #viral, #fyp, #fy, #foryou, #explore, #trending, #instagood, #reels."
  );
  linhas.push(
    "PALAVRAS-CHAVE: de 5 a 8 termos em portugu\u00EAs que representam o conte\u00FAdo real da publica\u00E7\u00E3o " +
    "(ex.: Deus, f\u00E9, sil\u00EAncio de Deus, esperan\u00E7a, prop\u00F3sito, confian\u00E7a em Deus, esperar em Deus). " +
    "Podem se parecer com as hashtags, mas reescreva de forma diferente (ex.: hashtag #F\u00E9EmDeus \u2192 palavra-chave \u201Cf\u00E9 em Deus\u201D)."
  );

  const tx = (evitar || []).map((e) => String(e && e.frase ? e.frase : e || "")).filter(Boolean).slice(0, 8);
  if (tx.length) {
    linhas.push("N\u00C3O repita frases nem estruturas parecidas com estas j\u00E1 publicadas:\n" + tx.map((f) => "  - " + f).join("\n"));
  }
  if (retry) {
    linhas.push(
      "A tentativa anterior foi rejeitada no controle de qualidade. Varie FRANCAMENTE a estrutura, os come\u00E7os e o vocabul\u00E1rio; " +
      "nada de frases clich\u00EA, legendas que repetem a frase ou hashtags irrelevantes."
    );
  }

  linhas.push(
    "RESPONDA APENAS com blocos. Para cada publica\u00E7\u00E3o escreva um bloco separado por uma linha contendo somente: ---\n" +
    "Formato exato de cada bloco:\n" +
    "FRASE: <frase de impacto, por extenso>\n" +
    "LEGENDA: <legenda curta e viral, SEM hashtags, com emojis, podendo ter linhas>\n" +
    "HASHTAGS: <at\u00E9 10 hashtags separadas por espa\u00E7o>\n" +
    "PALAVRAS-CHAVE: <5 a 8 termos em portugu\u00EAs separados por v\u00EDrgula>\n" +
    "V\u00CDDEO: <3-4 termos para buscar v\u00EDdeo de fundo no Pexels em portugu\u00EAs e ingl\u00EAs, separados por v\u00EDrgula>"
  );

  return [
    { role: "system", content: system },
    { role: "user", content: linhas.join("\n\n") }
  ];
}

function buildMessagesLegenda(opts) {
  const { frase, legendaAtual, categoria, estilo, intencao, evitar } = opts;
  const fml = FAMILIAS[categoria] || FAMILIAS.deus;
  const emo = fml.emo || {};

  const system =
    "Voc\u00EA \u00E9 o copywriter crist\u00E3o da p\u00E1gina \u201CAlvorada do C\u00E9u\u201D. Escreve legendas curtas, virais e humanas para Instagram Reels em portugu\u00EAs do Brasil. " +
    "Regras: legenda original, acolhedora, sem clich\u00EA; proibido \u201Ccomente AM\u00C9M\u201D, \u201Cdigite EU CREIO\u201D, \u201Ccompartilhe com N pessoas\u201D; " +
    "proibido inventar cita\u00E7\u00F5es b\u00EDblicas; n\u00E3o colocar hashtags dentro da legenda; n\u00E3o repetir a frase na legenda.";
  const linhas = [];
  linhas.push("Mantenha EXATAMENTE esta frase de impacto (n\u00E3o altere, n\u00E3o reescreva): \n\u201C" + frase + "\u201D");
  if (legendaAtual) linhas.push("Essa \u00E9 a legenda atual a ser SUBSTITU\u00CDDA por algo diferente (forma e tom):\n\u201C" + String(legendaAtual).slice(0, 600) + "\u201D");
  if (emo.emocao) linhas.push("Emo\u00E7\u00E3o a evocar: " + emo.emocao + ". Necessidade: " + emo.necessidade + ". Dor: " + emo.dor + ".");
  const estJ = ESTILOS_LEGENDA.find((s) => s.id === estilo);
  linhas.push(estJ && estJ.instrucao
    ? "Regra de ouro: a nova legenda deve ser CURTA e VIRAL \u2014 m\u00E1ximo 4 linhas e ~35 palavras. Formato: " + estJ.instrucao + ". Depois de escrever, conte e encurte se passou de 35."
    : "Regra de ouro: a nova legenda deve ser CURTA e VIRAL \u2014 m\u00E1ximo 4 linhas e ~35 palavras. Formato: gancho emocional \u2192 mensagem de impacto \u2192 convite natural para seguir.");
  const intJ = INTENCOES_ENGAJAMENTO.find((i) => i.id === intencao);
  if (intJ) linhas.push("Inten\u00E7\u00E3o de engajamento: " + intJ.instrucao + ".");
  linhas.push("Inclua de forma natural 1-2 das palavras de SEO do tema como: " + (fml.kwBase || []).slice(0, 4).join(", ") + ".");
  linhas.push("Encerre com um convite natural e novo para seguir @alvoradadoceu (n\u00E3o repita o convite da legenda anterior).");

  linhas.push(
    "RESPONDA APENAS com o bloco no formato exato:\n" +
    "FRASE: " + frase + "\n" +
    "LEGENDA: <nova legenda curta e viral, SEM hashtags>\n" +
    "HASHTAGS: <at\u00E9 10 hashtags relacionadas \u00E0 nova legenda, separadas por espa\u00E7o>\n" +
    "PALAVRAS-CHAVE: <5 a 8 termos em portugu\u00EAs separados por v\u00EDrgula>\n" +
    "V\u00CDDEO: <3-4 termos de v\u00EDdeo de fundo em portugu\u00EAs e ingl\u00EAs>"
  );
  return [
    { role: "system", content: system },
    { role: "user", content: linhas.join("\n\n") }
  ];
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */
function extractItems(text, quantidade) {
  const cleaned = String(text).replace(/```json/gi, "").replace(/```/g, "").trim();

  /* caso: array JSON */
  if (cleaned.startsWith("[")) {
    try {
      const arr = JSON.parse(cleaned);
      if (Array.isArray(arr)) {
        const items = arr
          .map((obj) => {
            const palavra_chave =
              String(obj.palavra_chave || obj["palavra-chave"] || obj.PALAVRA_CHAVE || obj.VIDEO || obj.video || "").trim();
            let hashtags = [];
            if (Array.isArray(obj.hashtags)) hashtags = obj.hashtags.map(String);
            else if (obj.HASHTAGS) hashtags = splitHashtagsStr(obj.HASHTAGS);
            let palavras_chave = [];
            const pkc = obj.palavras_chave || obj.PALAVRAS_CHAVE || obj.PALAVRAS || obj.keywords;
            if (Array.isArray(pkc)) palavras_chave = pkc.map(String).filter(Boolean);
            else if (typeof pkc === "string") palavras_chave = splitKeywords(pkc);
            return {
              frase: (obj.frase || obj.FRASE || obj.texto || obj.content || "").toString().trim(),
              legenda: (obj.legenda || obj.LEGENDA || "").toString().trim(),
              palavra_chave,
              hashtags,
              palavras_chave
            };
          })
          .filter((i) => i.frase);
        if (items.length) return items;
      }
    } catch {}
  }

  const items = [];
  let cur = null;

  const headerRe = /^\s*(FRASE|LEGENDA|HASHTAGS|PALAVRAS-CHAVES|PALAVRAS-CHAVE|KEYWORDS|PALAVRA-CHAVE|PALAVRAS|VIDEO|V[IÍ]DEO|MIDIA|TEXTO)\s*\d*\s*[:.-]\s*(.*)$/i;

  for (const line of cleaned.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    if (t === "---") {
      if (cur && cur.frase) items.push(cur);
      cur = null;
      continue;
    }
    const m = t.match(headerRe);
    if (m) {
      if (cur && cur.frase && /^FRASE/i.test(m[1]) && cur.ultimo === "frase") {
        items.push(cur);
        cur = null;
      }
      const field =
        /^FRASE/i.test(m[1]) || /^TEXTO/i.test(m[1]) ? "frase"
        : /^LEGENDA/i.test(m[1]) ? "legenda"
        : /^HASHTAGS/i.test(m[1]) ? "hashtags"
        : /^PALAVRAS/i.test(m[1]) || /^KEYWORDS/i.test(m[1]) ? "palavras_chave_raw"
        : /^VIDEO/i.test(m[1]) || /^V[IÍ]DEO/i.test(m[1]) || /^MIDIA/i.test(m[1]) || /^PALAVRA-CHAVE/i.test(m[1]) ? "palavra_chave"
        : "frase";
      if (!cur) cur = { frase: "", legenda: "", palavra_chave: "", hashtags: [], palavras_chave: [], ultimo: "" };
      if (field === "hashtags") cur.hashtags = cur.hashtags.concat(splitHashtagsStr(m[2]));
      else if (field === "palavras_chave_raw") cur.palavras_chave = cur.palavras_chave.concat(splitKeywords(m[2]));
      else cur[field] = (cur[field] ? cur[field] + "\n" : "") + m[2].trim();
      cur.ultimo = field;
      continue;
    }
    if (cur) {
      const campo = cur.ultimo || "frase";
      if (campo === "hashtags") cur.hashtags = cur.hashtags.concat(splitHashtagsStr(t));
      else if (campo === "palavras_chave_raw") cur.palavras_chave = cur.palavras_chave.concat(splitKeywords(t));
      else cur[campo] = (cur[campo] ? cur[campo] + "\n" : "") + t;
    } else if (quantidade > 1) {
      /* lista simples: cada linha é uma frase */
      items.push({ frase: t, legenda: "", palavra_chave: "", hashtags: [], palavras_chave: [] });
    }
  }
  if (cur && cur.frase) items.push(cur);

  if (!items.length && quantidade === 1 && cleaned.length) {
    items.push({ frase: cleaned, legenda: "", palavra_chave: "", hashtags: [], palavras_chave: [] });
  }

  return items;
}

function limparFrase(t) {
  return String(t || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`/g, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/^\s*[-•]\s*/gm, "")
    .trim();
}

function garantirHashtags(legenda, catId) {
  if (!legenda) return legenda;
  if (/#\w/.test(legenda)) return legenda;
  return legenda.replace(/\s*$/, "") + "\n\n" + tagsFor(catId);
}

function normalizeItems(items, categoria, keywordHint, evitar) {
  const catId = (categoria === "todas") ? "deus" : sanitizeCategoria(categoria);
  const kwHint = keywordHint || kwFor(catId);
  const evitarCombos = (evitar || []).map((e) => Array.isArray(e && e.hashtags) ? e.hashtags : []);
  return (items || []).map((it) => {
    const frase = limparFrase(it.frase);
    if (!frase) return null;
    const extra = extrairHashtagsDoTexto(String(it.legenda || ""));
    const legenda = extra.texto || buildLegendaLocal(frase, catId);
    let hs = limparHashtags([].concat(it.hashtags || [], extra.hashtags));
    const poolFam = FAMILIAS[catId] || FAMILIAS.deus;
    if (hs.length < 3) {
      hs = limparHashtags(hs.concat(selecionarHashtags(catId, frase + " " + legenda, evitarCombos)));
    } else {
      hs = montarComDez(hs, [].concat(poolFam.nicho || [], poolFam.especifico || [], detectarTagsContexto(frase + " " + legenda)));
    }
    const kws = (Array.isArray(it.palavras_chave) && it.palavras_chave.length)
      ? it.palavras_chave.map((x) => String(x).trim()).filter(Boolean)
      : [];
    const palavras_chave = (kws.length >= 5 ? kws : derivarPalavrasChave(catId, frase, legenda, hs)).slice(0, 8);
    return {
      frase,
      legenda,
      hashtags: hs,
      palavras_chave: palavras_chave.length >= 5 ? palavras_chave : derivarPalavrasChave(catId, frase, legenda, hs).slice(0, 8),
      palavra_chave: String(it.palavra_chave || "").trim() || kwHint
    };
  }).filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* API pública                                                         */
/* ------------------------------------------------------------------ */
function generatePhrase(opts) {
  return generate(opts);
}

async function generate(optsRaw) {
  const opts = optsRaw || {};
  const quantidade = Math.max(1, Math.min(MAX_QUANTIDADE, parseInt(opts.quantidade, 10) || 1));
  const tipo = Object.prototype.hasOwnProperty.call(TIPOS, opts.tipo) ? opts.tipo : "impacto";
  const tamanho = Object.prototype.hasOwnProperty.call(TAMANHOS, opts.tamanho) ? opts.tamanho : "curto";
  const categoria = sanitizeCategoria(opts.categoria);
  const catId = (categoria === "todas") ? "deus" : categoria;
  const paraCompartilhar = opts.paraCompartilhar === true;
  const estilo = ESTILOS_LEGENDA.some((s) => s.id === opts.estilo) ? opts.estilo : "curto";
  const abordagem = FORMATOS_FRASE.some((f) => f.id === opts.abordagem) ? opts.abordagem : "auto";
  const intencao = INTENCOES_ENGAJAMENTO.some((i) => i.id === opts.intencao) ? opts.intencao : "auto";
  const escolha = String(opts.provider || "auto").toLowerCase().trim();
  const evitar = normalizarEvitar(opts.evitar);

  /* Banco local escolhido manualmente: garante resposta imediata e offline */
  if (escolha === "local") {
    const locales = localFrases(quantidade, categoria, evitar);
    const itens = locales.map((i) => repararItem(i, catId, evitar)).slice(0, quantidade);
    return {
      ok: true,
      itens,
      categoria,
      categoriaLabel: categoria === "todas" ? "Todas as categorias" : catLabel(categoria),
      tipo,
      tamanho,
      quantidade: itens.length,
      provider: "local",
      providerLabel: PROVIDER_LABELS.local,
      manual: true
    };
  }

  /* Limita a ordem de tentativa conforme a escolha do usuário */
  const ordem =
    escolha === "auto" ? PROVIDER_ORDER
    : PROVIDER_ORDER.filter((p) => p.id === escolha);

  const baseOpts = { categoria, tipo, tamanho, paraCompartilhar, quantidade, estilo, abordagem, intencao, evitar };
  const messages = buildMessages(baseOpts);
  const erros = [];

  for (const provider of ordem) {
    try {
      const itensValidos = [];
      for (let t = 0; t < 2 && itensValidos.length < quantidade; t++) {
        const raw = t === 0 ? await provider.fn(messages) : await provider.fn(buildMessages(Object.assign({}, baseOpts, { retry: true })));
        let itens = extractItems(raw, quantidade);
        if (!itens.length) throw new Error("Não foi possível interpretar a resposta da IA.");
        itens = itens
          .filter((i) => i.frase.replace(/[""'\u201C\u201D\u2018\u2019]/g, "").trim().length > 2)
          .map((i) => normalizeItems([i], categoria, kwFor(categoria), evitar)[0]);
        for (const it of itens) {
          if (!it) continue;
          if (itensValidos.some((x) => similaridadeNormalizada(x.frase, it.frase) > 0.85)) continue;
          itensValidos.push(it);
        }
      }
      const validos = itensValidos.filter((i) => validarItem(i, catId, evitar).length === 0);
      if (validos.length) {
        let final = validos.slice(0, quantidade);
        if (final.length < quantidade) {
          const need = quantidade - final.length;
          final = final.concat(localFrases(need, categoria, evitar).map((i) => repararItem(i, catId, evitar)));
        }
        final = final.slice(0, quantidade);
        return {
          ok: true,
          itens: final,
          categoria,
          categoriaLabel: categoria === "todas" ? "Todas as categorias" : catLabel(categoria),
          tipo,
          tamanho,
          quantidade: final.length,
          provider: provider.id,
          providerLabel: PROVIDER_LABELS[provider.id]
        };
      }
    } catch (e) {
      erros.push(provider.id + " => " + (e && e.message ? e.message : String(e)));
    }
  }

  const locales = localFrases(quantidade, categoria, evitar);
  const itens = locales.map((i) => repararItem(i, catId, evitar)).slice(0, quantidade);
  return {
    ok: true,
    itens,
    categoria,
    categoriaLabel: categoria === "todas" ? "Todas as categorias" : catLabel(categoria),
    tipo,
    tamanho,
    quantidade: itens.length,
    provider: "local",
    providerLabel: PROVIDER_LABELS.local,
    fallbackReason: erros.join(" | ")
  };
}

/* ------------------------------------------------------------------ */
/* Gera uma legenda alternativa para uma frase já existente            */
/* ------------------------------------------------------------------ */
async function gerarLegenda(optsRaw) {
  const opts = optsRaw || {};
  const frase = String(opts.frase || "").trim();
  if (!frase) throw new Error("Frase de impacto obrigatória.");
  const categoria = sanitizeCategoria(opts.categoria);
  const catId = (categoria === "todas") ? "deus" : categoria;
  const estilo = ESTILOS_LEGENDA.some((s) => s.id === opts.estilo) ? opts.estilo : "curto";
  const intencao = INTENCOES_ENGAJAMENTO.some((i) => i.id === opts.intencao) ? opts.intencao : "auto";
  const escolha = String(opts.provider || "auto").toLowerCase().trim();
  const evitar = normalizarEvitar(opts.evitar);

  if (escolha === "local") {
    const variada = legendaLocalVariada(frase, catId, opts.legenda);
    return {
      ok: true,
      itens: [repararItem({ frase, legenda: variada.legenda, hashtags: [], palavras_chave: [] }, catId, evitar)],
      categoria,
      categoriaLabel: categoria === "todas" ? "Todas as categorias" : catLabel(categoria),
      provider: "local",
      providerLabel: PROVIDER_LABELS.local,
      manual: true
    };
  }

  const ordem = escolha === "auto" ? PROVIDER_ORDER : PROVIDER_ORDER.filter((p) => p.id === escolha);
  const messages = buildMessagesLegenda({ frase, legendaAtual: opts.legenda, categoria: catId, estilo, intencao, evitar });
  const erros = [];

  for (const provider of ordem) {
    try {
      const raw = await provider.fn(messages);
      let itens = extractItems(raw, 1).map((i) => normalizeItems([i], categoria, kwFor(categoria), evitar)[0]).filter(Boolean);
      if (!itens.length) throw new Error("Não foi possível interpretar a legenda recebida.");
      const item = Object.assign({}, itens[0], { frase });
      return {
        ok: true,
        itens: [repararItem(item, catId, evitar)],
        categoria,
        categoriaLabel: categoria === "todas" ? "Todas as categorias" : catLabel(categoria),
        provider: provider.id,
        providerLabel: PROVIDER_LABELS[provider.id]
      };
    } catch (e) {
      erros.push(provider.id + " => " + (e && e.message ? e.message : String(e)));
    }
  }

  const variada = legendaLocalVariada(frase, catId, opts.legenda);
  return {
    ok: true,
    itens: [repararItem({ frase, legenda: variada.legenda, hashtags: [], palavras_chave: [] }, catId, evitar)],
    categoria,
    categoriaLabel: categoria === "todas" ? "Todas as categorias" : catLabel(categoria),
    provider: "local",
    providerLabel: PROVIDER_LABELS.local,
    fallbackReason: erros.join(" | ")
  };
}

module.exports = {
  generate,
  generatePhrase,
  gerarLegenda,
  configuredProviders,
  localFrases,
  buildMessages,
  buildMessagesLegenda,
  extractItems,
  kwFor,
  tagsFor,
  validarItem,
  HASHTAGS_TOP10,
  PROVIDER_LABELS,
  CATEGORIAS,
  TIPOS,
  TAMANHOS,
  FORMATOS_FRASE,
  ESTILOS_LEGENDA,
  INTENCOES_ENGAJAMENTO,
  MAX_QUANTIDADE
};