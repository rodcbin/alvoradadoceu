/* =========================================================
   Alvorada do Céu — Aba Perfil (crescimento)
   Capas de Destaques, bio que converte, nome pesquisável,
   plano dos 3 fixados e dicas de dono de página.
   ========================================================= */

/* ícones sagrados desenhados à mão em canvas (line-art dourado) */
const PERFIL_ICONS = [
  { id: "fe",       label: "Fé",        name: "Fé",         hint: "Cruz latina" },
  { id: "paz",      label: "Paz",       name: "Paz",        hint: "Pomba com ramo de oliveira" },
  { id: "oracao",   label: "Oração",    name: "Oração",     hint: "Mãos postas" },
  { id: "luz",      label: "Luz",       name: "Palavra",    hint: "Vela acesa" },
  { id: "graca",    label: "Graça",     name: "Comunhão",   hint: "Cálice e hóstia" },
  { id: "palavra",  label: "Palavra",   name: "Estudos",    hint: "Bíblia aberta" },
  { id: "milagre",  label: "Milagre",   name: "Testemunhos",hint: "Pães da multiplicação" },
  { id: "colheita", label: "Colheita",  name: "Gratidão",   hint: "Espiga de trigo" },
  { id: "esperanca",label: "Esperança", name: "Esperança",  hint: "Âncora da alma" },
  { id: "amor",     label: "Amor",      name: "Amor",       hint: "Coração" },
  { id: "natal",    label: "Natal",     name: "Natal",      hint: "Estrela de Belém" },
  { id: "reino",    label: "Reino",     name: "Reino",      hint: "Coroa" },
  { id: "alvorada", label: "Alvorada",  name: "Alvorada",   hint: "Sol nascente" },
  { id: "louvor",   label: "Louvor",    name: "Louvor",     hint: "Lira" },
  { id: "jesus",    label: "Jesus",     name: "Jesus",      hint: "Peixe ichthys" },
  { id: "eterno",   label: "Eterno",    name: "Eterno",     hint: "Cruz radiante" }
];

/* estilos de fundo das capas */
const PERFIL_STYLES = {
  dark:  { label: "⬛ Preto & Dourado", desc: "Fundo noite profunda com poeira dourada — o clássico que nunca falha." },
  light: { label: "⬜ Creme & Dourado", desc: "Papel creme suave — combina com perfis claros e minimalistas." },
  bible: { label: "📜 Página Bíblica",  desc: "Pergaminho envelhecido desenhado proceduralmente, um diferente do outro." },
  photo: { label: "📷 Foto de fundo",   desc: "Uma foto real (IA ou banco gratuito) aplica tom cinematográfico em todo o kit." },
  duo:   { label: "🌗 Degradê Duotone", desc: "Gradiente elegante em tons profundos — escolha a paleta abaixo." }
};

/* paletas duotone */
const PERFIL_PALETTES = [
  { id: "noite",  label: "Noite Azul",  top: "#1b1740", bottom: "#070612", glow: "#8b6fe8", ink: "#e8c55e" },
  { id: "vinho",  label: "Vinho & Rosé",top: "#3d1226", bottom: "#14060d", glow: "#e87fa8", ink: "#f0c987" },
  { id: "oliva",  label: "Oliva & Areia",top:"#22301f", bottom: "#0c110b", glow: "#a8c686", ink: "#ead9a8" },
  { id: "ambar",  label: "Âmbar",       top: "#33230d", bottom: "#120b04", glow: "#ffb84d", ink: "#ffd98e" },
  { id: "oceano", label: "Oceano",      top: "#0f2f3d", bottom: "#05121a", glow: "#5fc2d8", ink: "#ffe9b8" }
];

/* modo do texto gravado na capa */
const PERFIL_TEXTMODES = {
  none: { label: "Sem texto", desc: "Só o símbolo — o nome aparece sozinho embaixo do círculo no Instagram." },
  name: { label: "Com o nome", desc: "Grava o nome do destaque dentro da capa, em caixa alta com espaçamento dourado." }
};

/* fontes de imagem quando o estilo é foto */
const PERFIL_SOURCES = {
  auto:    { label: "✨ Automático", desc: "Tenta IA primeiro, depois bancos gratuitos. Sempre funciona." },
  cf:      { label: "☁️ Cloudflare FLUX", desc: "Arte exclusiva por IA — ninguém terá uma capa igual." },
  poll:    { label: "🌿 Pollinations", desc: "IA gratuita e ilimitada, estilo pictórico." },
  pexels:  { label: "📸 Pexels", desc: "Fotos reais profissionais, uso livre." },
  pixabay: { label: "🌊 Pixabay", desc: "Fotos reais do Pixabay, uso livre." }
};

/* temas de busca para a foto de fundo (um por capa, na ordem dos ícones) */
const PERFIL_PHOTO_THEMES = [
  "golden cross sunrise sky",
  "white dove flying golden light",
  "hands praying candle dark",
  "candle flame dark bokeh",
  "chalice wine golden",
  "open bible vintage light",
  "bread rustic table warm",
  "wheat field golden hour",
  "anchor rope sea dusk",
  "heart shape sunset clouds",
  "star night sky bright",
  "golden crown light",
  "sunrise over mountains mist",
  "harp strings golden light",
  "fish silver water light",
  "light rays through clouds"
];

/* fórmulas de bio — cada uma vira texto pronto ao combinar com os blocos */
const PERFIL_BIO_TEMPLATES = [
  ["🙏 {missao}", "📖 {promessa}", "👇 {cta}"],
  ["✝️ {missao}", "🌅 {promessa}", "📌 Salve este perfil: {cta}"],
  ["“{lema}”", "📖 Nova palavra todos os dias às 6h", "🙏 {cta}"],
  [{ t: "{pagina}" }, "Deus no comando ✝️", "👇 Comece por aqui:"],
  ["🌱 {missao}", "🔥 {promessa}", "💌 Envie para quem precisa: {cta}"]
];

const PERFIL_BIO_MISSOES = [
  "Espalhando a Palavra, uma frase por dia",
  "Alimento diário para a sua fé",
  "Versículos, orações e esperança toda manhã",
  "Aqui a sua alma respira"
];

const PERFIL_BIO_PROMESSAS = [
  "Uma promessa de Deus para o seu dia",
  "A misericórdia do Senhor se renova a cada manhã",
  "Tudo posso naquele que me fortalece",
  "Entrega o teu caminho ao Senhor e confia"
];

const PERFIL_BIO_CTAS = [
  "Receba a bênção de hoje 👇",
  "Toque no link e comece o dia com Deus",
  "Segue e ative as notificações 🔔",
  "Comente AMÉM e receba a palavra 👇"
];

const PERFIL_BIO_LEMAS = [
  "Lâmpada para os meus pés é a tua palavra",
  "O Senhor é o meu pastor e nada me faltará",
  "Esforcem-se e tenham bom ânimo",
  "Ame uns aos outros como eu os amei"
];

/* campo NOME (SEO do Instagram — aparece na busca) */
const PERFIL_NAME_KEYWORDS = [
  "Versículos Diários",
  "Palavra da Manhã",
  "Fé e Esperança",
  "Oração da Noite",
  "Frases Bíblicas",
  "Deus Primeiro"
];

/* pacote de hashtags para o primeiro comentário */
const PERFIL_HASHTAG_PACKS = [
  ["#deus", "#fé", "#versiculo", "#palavradedeus", "#biblia", "#espiritualidade", "#gratidao", "#oracao", "#jesuscristo", "#bomdia"],
  ["#deusnocomando", "#fe", "#evangelho", "#devocional", "#palavradoDia", "#amor", "#esperanca", "#bencao", "#igreja", "#reflexao"],
  ["#versiculododia", "#deusefiel", "#cristao", "#adoracao", "#louvor", "#vitoria", "#milagre", "#graca", "#espanto", "#alegria"]
];

/* plano dos 3 posts fixados — o roteiro do visitante */
const PERFIL_PINNED = [
  {
    icon: "🚪",
    title: "Fixado 1 · A porta de entrada",
    why: "É o primeiro post que quem visita vê. Apresente a página em 3 linhas e convide para fazer parte.",
    caption: "Seja muito bem-vindo(a) à nossa família de fé 🙏\n\nPor aqui você recebe toda manhã uma palavra da Bíblia para fortalecer o seu dia — versículo, oração e uma reflexão curta.\n\n✝️ Siga a página e ative as notificações para não perder a bênção de amanhã.\n\nComente AMÉM se você veio ficar. 💛"
  },
  {
    icon: "⭐",
    title: "Fixado 2 · O melhor post",
    why: "Coloque no fixados aquele card que mais alcançou. Prova social imediata: se quase todo mundo salvou, o visitante também vai.",
    caption: "A palavra mais amada da página ⭐\n\nMais de mil pessoas salvaram este versículo — e hoje ele é para você:\n\n“{versiculo}”\n\n📌 Salve também e volte a ler quando o coração pesar.\n💬 Marque alguém que precisa ler isso hoje."
  },
  {
    icon: "🧠",
    title: "Fixado 3 · O convite ao engajamento",
    why: "Um quiz ou desafio fixado mantém o comentário vivo mesmo semanas depois da publicação.",
    caption: "Você conhece mesmo a Palavra? 🧠\n\nEste quiz separou os leitores dos superficiais — até agora {acertos}% acertaram.\n\n👉 Role para cima, responda sem olhar os comentários e diga a sua pontuação aqui embaixo.\n\nNovo quiz toda terça! 🔔"
  }
];

/* ordem sugerida dos destaques no perfil (jornada do visitante) */
const PERFIL_ORDER_TIP = [
  "Comece Aqui", "Palavra", "Oração", "Paz",
  "Testemunhos", "Gratidão", "Louvor", "Eterno"
];

/* kit recomendado: 8 capas já nomeadas na ordem da jornada */
const PERFIL_RECOMMENDED = [
  { icon: "fe",       name: "Comece Aqui" },
  { icon: "palavra",  name: "Palavra" },
  { icon: "oracao",   name: "Oração" },
  { icon: "paz",      name: "Paz" },
  { icon: "milagre",  name: "Testemunhos" },
  { icon: "colheita", name: "Gratidão" },
  { icon: "louvor",   name: "Louvor" },
  { icon: "eterno",   name: "Eterno" }
];

/* foto de perfil a jogo: variantes e fundos (1080×1080) */
const AVATAR_VARIANTS = {
  sol:  { label: "☀️ Alvorada", desc: "O sol da marca nascendo sobre as águas" },
  cruz: { label: "✝️ Cruz Radiante", desc: "Cruz latina dentro do anel de luz" },
  pomba:{ label: "🕊️ Pomba", desc: "A pomba da paz em line-art dourado" }
};

const AVATAR_BACKGROUNDS = {
  noite: { label: "🌙 Noite", top: "#241e52", bottom: "#0c0a1e", glow: "#e8c55e", ink: "#f6dd94" },
  ouro:  { label: "✨ Dourado", top: "#3a2c10", bottom: "#14100a", glow: "#ffd98e", ink: "#ffe9b8" },
  creme: { label: "🤍 Creme", top: "#f7f1e1", bottom: "#d9caa5", glow: "#ffffff", ink: "#8a6d3b", light: true }
};

/* dicas de dono de página — foco em crescimento */
const PERFIL_GROWTH_TIPS = [
  { ico: "🧲", title: "Bio é filtro, não cartão", text: "Diga exatamente para quem a página é (“palavra da manhã pra quem tem pressa”). Quem se identifica segue; quem não, ia deixar de engajar depois." },
  { ico: "🔍", title: "Campo Nome é buscável", text: "O Instagram indexa o campo Nome, não o @. Coloque “| Versículos Diários” depois do seu nome e apareça nas buscas sem pagar nada." },
  { ico: "🗂️", title: "Destaques em ordem de jornada", text: "Da esquerda para a direita: Comece Aqui → Palavra → Oração → Testemunhos. O visitante lê da esquerda; conte a história nessa ordem." },
  { ico: "🎨", title: "Kit uniforme passa autoridade", text: "Mesma família visual em todas as capas = perfil profissional. Perfis organizados convertem 2 a 3x mais visitas em seguidores." },
  { ico: "📌", title: "Os 3 fixados vendem a página", text: "Porta de entrada + melhor post + desafio. Quem visita entende a proposta, vê a prova e já interage — tudo nos primeiros 10 segundos." },
  { ico: "⏱️", title: "Primeira hora é sagrada", text: "Responda TODO comentário logo após publicar. O algoritmo mede velocidade de resposta e empurra o post para mais gente." }
];
