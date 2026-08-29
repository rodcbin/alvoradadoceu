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

const https = require("https");
const http = require("http");
const crypto = require("crypto");

const PROVIDER_LABELS = {
  cloudflare: "Cloudflare Workers AI",
  openrouter: "OpenRouter (IA grátis)",
  mistral: "Mistral AI (IA grátis)",
  local: "Frases locais (offline)",
};

const MAX_QUANTIDADE = 30;
const MODO_ALTO_IMPACTO_TIPO = {};

/* ------------------------------------------------------------------ */
/* Categorias                                                          */
/* ------------------------------------------------------------------ */
const CATEGORIAS = [
  { id: "deus", label: "Deus", emoji: "✨", kw: "ceu luz maos em oracao, god sky light praying hands", tags: "#deus #fe #esperanca #oracao #alvoradadoceu" },
  { id: "jesus", label: "Jesus", emoji: "✝️", kw: "cruz luz por do sol, jesus cross sunset light", tags: "#jesus #deus #fe #salvacao #alvoradadoceu" },
  { id: "fe", label: "Fé", emoji: "🙌", kw: "maos orando ceu nuvens, faith praying hands sky", tags: "#fe #deus #oracao #esperanca #alvoradadoceu" },
  { id: "oracao", label: "Oração", emoji: "🙏", kw: "maos em oracao vela biblia, prayer hands candle bible", tags: "#oracao #fe #deus #paz #alvoradadoceu" },
  { id: "esperanca", label: "Esperança", emoji: "🌅", kw: "nascer do sol horizonte luz, hope sunrise horizon light", tags: "#esperanca #fe #deus #recomeco #alvoradadoceu" },
  { id: "paz", label: "Paz", emoji: "🕊️", kw: "mar calmo natureza tranquila, peace calm ocean nature", tags: "#paz #deus #fe #calma #alvoradadoceu" },
  { id: "reflexao", label: "Reflexão", emoji: "💭", kw: "silencio natureza contemplacao, reflection quiet nature", tags: "#reflexao #deus #fe #introspeccao #alvoradadoceu" },
  { id: "recomeco", label: "Recomeço", emoji: "🌱", kw: "amanhecer broto planta, new beginning sunrise sprout", tags: "#recomeco #esperanca #deus #novociclo #alvoradadoceu" },
  { id: "gratidao", label: "Gratidão", emoji: "🌻", kw: "maos agradecendo por do sol, thanksgiving sunset hands", tags: "#gratidao #deus #fe #oracao #alvoradadoceu" },
  { id: "familia", label: "Família", emoji: "👨‍👩‍👧", kw: "familia juntos natureza luz, family together light nature", tags: "#familia #amor #deus #protecao #alvoradadoceu" },
  { id: "protecao", label: "Proteção", emoji: "🛡️", kw: "anjo luz branca protecao, angel light protection", tags: "#protecao #deus #fe #salmo91 #alvoradadoceu" },
  { id: "ansiedade", label: "Ansiedade", emoji: "🌪️", kw: "mar calmo silencio paz, anxiety calm quiet peace", tags: "#ansiedade #paz #deus #calma #alvoradadoceu" },
  { id: "momentos-dificeis", label: "Momentos difíceis", emoji: "🌧️", kw: "tempestade luz arco-iris, storm rain light hope", tags: "#momentosdificeis #esperanca #deus #forca #alvoradadoceu" },
  { id: "amor-de-deus", label: "Amor de Deus", emoji: "💛", kw: "coracao luz ceu, god love heart sky light", tags: "#amordeDeus #deus #fe #gratidao #alvoradadoceu" },
  { id: "confianca", label: "Confiança", emoji: "🏔️", kw: "montanha estrada luz, trust mountain path light", tags: "#confianca #deus #fe #coragem #alvoradadoceu" },
  { id: "superacao", label: "Superação", emoji: "⛰️", kw: "montanha vitoria amanhecer, victory mountain sunrise", tags: "#superacao #fe #forca #deus #alvoradadoceu" },
  { id: "manha", label: "Mensagem da manhã", emoji: "☀️", kw: "amanhecer sol flores, good morning sunrise flowers", tags: "#bomdia #fe #deus #gratidao #alvoradadoceu" },
  { id: "noite", label: "Mensagem da noite", emoji: "🌆", kw: "por do sol silhueta, evening sunset silhouette", tags: "#boanoite #fe #deus #paz #alvoradadoceu" },
  { id: "dormir", label: "Antes de dormir", emoji: "🌙", kw: "lua estrelas ceu noturno, good night moon stars sky", tags: "#boanoite #paz #deus #fe #alvoradadoceu" },
  { id: "domingo", label: "Domingo", emoji: "⛪", kw: "igreja luz domingo, church light sunday", tags: "#domingo #deus #igreja #fe #alvoradadoceu" },
  { id: "segunda", label: "Segunda-feira", emoji: "📅", kw: "novo comeco amanhecer trabalho, monday new start", tags: "#segundafeira #recomeco #deus #fe #alvoradadoceu" },
  { id: "fim-de-semana", label: "Final de semana", emoji: "🏖️", kw: "natureza descanso familia, weekend rest nature", tags: "#fimdesemana #descanso #deus #fe #alvoradadoceu" },
  { id: "hoje", label: "Mensagem para hoje", emoji: "📌", kw: "hoje novo dia luz, today new day light", tags: "#hoje #deus #fe #reflexao #alvoradadoceu" },
  { id: "frase-impacto", label: "Frase de impacto", emoji: "⚡", kw: "luz raio ceu impacto, impact light sky", tags: "#frasedeimpacto #deus #fe #reflexao #alvoradadoceu" },
  { id: "reflexao-espiritual", label: "Reflexão espiritual", emoji: "📖", kw: "biblia luz janela, spiritual reflection bible light", tags: "#reflexao #espiritualidade #deus #fe #alvoradadoceu" },
  { id: "sofrendo", label: "Para quem está sofrendo", emoji: "💔", kw: "abraco luz amanhecer, comfort embrace light sunrise", tags: "#consolo #deus #fe #esperanca #alvoradadoceu" }
];

const CATEGORIA_POR_ID = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));

/* ------------------------------------------------------------------ */
/* Formatos (tipos de conteúdo) e tamanhos                             */
/* ------------------------------------------------------------------ */
const TIPOS = {
  curta: { label: "Frase curta", instrucao: "frase curta e direta" },
  muito_curta: { label: "Frase muito curta", instrucao: "frase bem curta (5 a 12 palavras), quase um sussurro que fica na mente" },
  impacto: { label: "Frase de impacto", instrucao: "frase de impacto, com gancho forte no início e final memorável" },
  emocional: { label: "Mensagem emocional", instrucao: "mensagem emocional, acolhedora, que pareça escrita para quem lê" },
  reflexao: { label: "Reflexão", instrucao: "uma reflexão breve, com uma virada de pensamento no final" },
  oracao: { label: "Oração curta", instrucao: "oração curta, natural, emocional, fácil de ler e de narrar, falando diretamente com Deus (ex.: \"Senhor, ...\")" },
  imagem: { label: "Mensagem para imagem", instrucao: "mensagem curta que fique bem sobreposta a uma imagem" },
  stories: { label: "Mensagem para Stories", instrucao: "mensagem curta e escaneável, ideal para o topo de um story" },
  reel: { label: "Mensagem para Reel", instrucao: "mensagem que aparece em texto na tela de um Reel" },
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
  return c ? c.kw : CATEGORIAS[2].kw;
}

function tagsFor(id) {
  const c = CATEGORIA_POR_ID[id];
  return c ? c.tags : CATEGORIAS[2].tags;
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

function localFrases(quantidade, categoria) {
  const cat = categoria === "todas" ? rand(CATEGORIAS).id : sanitizeCategoria(categoria);
  const pool = shuffle([...(CURATED[cat] || []), ...(CURATED.deus || []), ...GENERIC_POOL]);
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
  return phrases.map((frase) => ({ frase, legenda: "", palavra_chave: "" }));
}

function buildLegendaLocal(frase, categoria, tipo) {
  const catId = categoria === "todas" ? "fe" : sanitizeCategoria(categoria);
  const tagLinha = tagsFor(catId);
  const cta = tipo === "sequencia" || tipo === "reel" ? "Salve este Reel e compartilhe com quem precisa. 💛" : "Salve para guardar e compartilhe com quem precisa. 💛";
  return frase + "\n\n" + cta + "\n\nSiga @alvoradadoceu para reflexões diárias 🙏\n\n" + tagLinha;
}

/* ------------------------------------------------------------------ */
/* HTTP helpers                                                        */
/* ------------------------------------------------------------------ */
function request(url, options, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const isHttps = u.protocol === "https:";
    const lib = isHttps ? https : http;
    const timeout = options.timeout || 20000;
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + u.search,
        method: options.method || "GET",
        headers: Object.assign({ "User-Agent": UA }, options.headers || {}),
        rejectUnauthorized: options.rejectUnauthorized !== false
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks);
          let bodyStr = raw.toString("utf8");
          if (bodyStr.charCodeAt(0) === 0xfeff) bodyStr = bodyStr.slice(1);
          resolve({ status: res.statusCode || 0, headers: res.headers || {}, body: bodyStr });
        });
      }
    );
    req.setTimeout(timeout, () => req.destroy(new Error("Timeout após " + timeout + "ms")));
    req.on("error", (e) => reject(e));
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
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
  }, { model: CF_TEXT_MODEL, messages, temperature: 0.9, max_tokens: 2600 });
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
  }, { model: OPENROUTER_MODEL, messages, temperature: 0.9, max_tokens: 2600 });
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
  }, { model: MISTRAL_MODEL, messages, temperature: 0.9, max_tokens: 2600 });
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
  const { categoria, tipo, tamanho, altoImpacto, paraCompartilhar, quantidade, evitar } = opts;
  const catTexto = catLabel(categoria);

  const system = "Você é o copywriter da página cristã/espiritual \u201CAlvorada do Céu\u201D. " +
    "Especialista em frases virais para Instagram (Reels, Stories, posts), escritas em português do Brasil. " +
    "A voz é humana, acolhedora, emocional e reconfortante. Evite linguagem formal demais, clichês em excesso, " +
    "exageros e promessas religiosas absolutas. NUNCA invente citações bíblicas: se usar a Bíblia, use apenas " +
    "referências reais e conhecidas e deixe explícito que é uma citação; caso contrário, escreva frase autoral sem referência.";

  const linhas = ["Gere " + quantidade + " frase" + (quantidade > 1 ? "s" : "") + " para a " + catTexto + "."];
  linhas.push("Forma: " + (TIPOS[tipo] ? TIPOS[tipo].instrucao : TIPOS.curta.instrucao) + ".");
  linhas.push("Tamanho: " + (TAMANHOS[tamanho] ? TAMANHOS[tamanho].instrucao : TAMANHOS.curto.instrucao));

  if (altoImpacto) {
    linhas.push("MODO 🔥 ALTO IMPACTO: abra já na primeira frase com força e curiosidade; gere identificação " +
      "emocional imediata, contraste e esperança; sensação de mensagem pessoal; poucas palavras; alto potencial de " +
      "compartilhamento. Varie os começos (não usar sempre \u201Cvocê não está lendo isso por acaso\u201D).");
  }
  if (paraCompartilhar) {
    linhas.push("MODO 💌 PARA COMPARTILHAR: a mensagem principal deve permanecer emocional, mas dar vontade de a pessoa " +
      "enviar para alguém (ex.: \u201Cenvie para alguém que precisa lembrar que Deus cuida dela\u201D). Não transforme tudo em pedido; " +
      "no máximo um leve convite no fim, mantendo o texto de coração.");
  }

  linhas.push("Emocionalmente, a sensação desejada é: \u201CEu precisava ouvir isso hoje.\u201D");

  if (evitar && evitar.length) {
    linhas.push("NÃO repita frases nem estruturas parecidas com estas já geradas: \n" +
      evitar.slice(0, 8).map((f) => "  - " + f).join("\n"));
  }

  linhas.push("RESPONDA APENAS com blocos. Para cada frase, escreva um bloco separado por uma linha contendo somente: ---\n" +
    "Formato exato de cada bloco:\n" +
    "FRASE: <a frase, por extenso>\n" +
    "LEGENDA: <legenda curta p/ postar (1 a 3 linhas), com emojis, convite \u201CSiga @alvoradadoceu\u201D no fim e 5 hashtags relacionadas>\n" +
    "PALAVRA-CHAVE: <palavra-chave para buscar vídeo de fundo no Pixabay/Pexels, termos em português e inglês separados por vírgula, sem hashtags>");

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
          .map((obj) => ({
            frase: (obj.frase || obj.FRASE || obj.texto || obj.content || "").toString().trim(),
            legenda: (obj.legenda || obj.LEGENDA || "").toString().trim(),
            palavra_chave: (obj.palavra_chave || obj["palavra-chave"] || obj.PALAVRA_CHAVE || "").toString().trim()
          }))
          .filter((i) => i.frase);
        if (items.length) return items;
      }
    } catch {}
  }

  const items = [];
  let cur = null;

  const headerRe = /^\s*(FRASE|LEGENDA|PALAVRA-CHAVE|PALAVRA|TEXTO)\s*\d*\s*[:.-]\s*(.*)$/i;

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
      const field = /^FRASE/i.test(m[1]) ? "frase" : /^LEGENDA/i.test(m[1]) ? "legenda" : "palavra_chave";
      if (!cur) cur = { frase: "", legenda: "", palavra_chave: "" };
      if (!cur.frase && field !== "frase") { /* legenda veio antes: ok */ }
      cur[field] = (cur[field] ? cur[field] + "\n" : "") + m[2].trim();
      cur.ultimo = field;
      continue;
    }
    if (cur) {
      const campo = cur.ultimo || "frase";
      cur[campo] = (cur[campo] ? cur[campo] + "\n" : "") + t;
    } else if (quantidade > 1) {
      /* lista simples: cada linha é uma frase */
      items.push({ frase: t, legenda: "", palavra_chave: "" });
    }
  }
  if (cur && cur.frase) items.push(cur);

  if (!items.length && quantidade === 1 && cleaned.length) {
    items.push({ frase: cleaned, legenda: "", palavra_chave: "" });
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

function normalizeItems(items, categoria, keywordHint) {
  const catId = categoria === "todas" ? "fe" : sanitizeCategoria(categoria);
  return items.map((it) => {
    const frase = limparFrase(it.frase);
    const legenda = garantirHashtags((it.legenda || "").trim(), catId);
    const kw = (it.palavra_chave || "").trim();
    return {
      frase,
      legenda: legenda || buildLegendaLocal(frase, catId, "curta"),
      palavra_chave: kw || keywordHint || kwFor(catId)
    };
  });
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
  const tipo = Object.prototype.hasOwnProperty.call(TIPOS, opts.tipo) ? opts.tipo : "curta";
  const tamanho = Object.prototype.hasOwnProperty.call(TAMANHOS, opts.tamanho) ? opts.tamanho : "curto";
  const categoria = sanitizeCategoria(opts.categoria);
  const altoImpacto = opts.altoImpacto !== false;
  const paraCompartilhar = opts.paraCompartilhar === true;
  const escolha = String(opts.provider || "auto").toLowerCase().trim();
  const evitar = Array.isArray(opts.evitar)
    ? opts.evitar.map((s) => String(s).slice(0, 300)).filter((s) => s.trim())
    : [];

  /* Banco local escolhido manualmente: garante resposta imediata e offline */
  if (escolha === "local") {
    const locales = localFrases(quantidade, categoria);
    const itens = normalizeItems(locales, categoria, kwFor(categoria));
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

  const messages = buildMessages({ categoria, tipo, tamanho, altoImpacto, paraCompartilhar, quantidade, evitar });
  const erros = [];

  for (const provider of ordem) {
    try {
      const raw = await provider.fn(messages);
      let itens = extractItems(raw, quantidade);
      if (!itens.length) throw new Error("Não foi possível interpretar a resposta da IA.");
      itens = itens.filter((i) => i.frase.replace(/[""'\u201C\u201D\u2018\u2019]/g, "").trim().length > 2);
      if (!itens.length) throw new Error("Resposta sem frases válidas.");
      const extra = quantidade - itens.length;
      if (extra > 0) {
        const fraseExtra = localFrases(extra, categoria);
        itens = itens.concat(normalizeItems(fraseExtra, categoria, kwFor(categoria)));
      }
      itens = normalizeItems(itens.slice(0, quantidade), categoria, kwFor(categoria));
      return {
        ok: true,
        itens,
        categoria,
        categoriaLabel: categoria === "todas" ? "Todas as categorias" : catLabel(categoria),
        tipo,
        tamanho,
        quantidade: itens.length,
        provider: provider.id,
        providerLabel: PROVIDER_LABELS[provider.id]
      };
    } catch (e) {
      erros.push(provider.id + " => " + (e && e.message ? e.message : String(e)));
    }
  }

  const locales = localFrases(quantidade, categoria);
  const itens = normalizeItems(locales, categoria, kwFor(categoria));
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

module.exports = {
  generate,
  generatePhrase,
  configuredProviders,
  localFrases,
  buildMessages,
  extractItems,
  kwFor,
  tagsFor,
  PROVIDER_LABELS,
  CATEGORIAS,
  TIPOS,
  TAMANHOS,
  MAX_QUANTIDADE
};