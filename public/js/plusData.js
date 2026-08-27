/* =========================================================
   Alvorada do Céu — Aba Plus (Engajamento)
   3 formatos: Versículo Card, Mensagem de Deus, Cura e Libertação
   ========================================================= */

const PLUS_FORMATS = [
  {
    id: "versiculo",
    label: "📖 Versículo Card",
    desc: "Versículo em fundo escuro, claro ou página da bíblia. Salvamentos e compartilhamentos.",
    hint: "Alterne fundo preto e claro durante a semana para criar identidade no feed.",
  },
  {
    id: "mensagem",
    label: "✉️ Mensagem de Deus",
    desc: "\"Deus me mandou te lembrar disso\" — o formato mais compartilhado no privado.",
    hint: "Frases em segunda pessoa geram identificação imediata e disparos de compartilhamento.",
  },
  {
    id: "cura",
    label: "💗 Cura e Libertação",
    desc: "Declarações de cura interior e liberdade em Cristo — conteúdo que gera comentários emocionantes.",
    hint: "Responda os comentários com oração individual: transforma seguidores em comunidade fiel.",
  },
];

const PLUS_CARD_STYLES = {
  dark: { label: "⬛ Preto", desc: "Fundo preto com texto branco — elegância máxima" },
  light: { label: "⬜ Claro", desc: "Fundo claro com texto escuro — limpa o feed" },
  clean: { label: "⚪ Clean", desc: "Branco minimalista com linhas suaves — foco na Palavra" },
  navy: { label: "🔵 Marinho", desc: "Azul-marinho profundo com brilho dourado — serenidade nobre" },
  verde: { label: "🟢 Verde Esperança", desc: "Verde-esmeralda que remete à esperança e ao renovo" },
  roxo: { label: "🟣 Roxo", desc: "Gradiente roxo profundo com detalhes dourados — sofisticação" },
  bordo: { label: "🍷 Bordô", desc: "Vinho bordô nobre com reflexos dourados — reverência" },
  vip: { label: "👑 VIP Dourado", desc: "Preto nobre, moldura ornamentada e brilho premium" },
  classico: { label: "🏛️ Clássico", desc: "Creme e sépia com textura de tela — galeria de arte" },
  marmore: { label: "🪨 Mármore", desc: "Mármore claro com veios elegantes — sofisticação atemporal" },
  pergaminho: { label: "📜 Pergaminho", desc: "Rolo de pergaminho envelhecido com bordas enroladas" },
  biblepage: { label: "📖 Página da Bíblia", desc: "Página envelhecida desenhada, versículo tipografado" },
  photo: { label: "🖼️ Foto/IA", desc: "Foto real ou arte de IA com o versículo sobreposto" },
};

const PLUS_SIZES = {
  square: { label: "Post 1:1 · 1080×1080", w: 1080, h: 1080, desc: "Feed quadrado — clássico" },
  portrait: { label: "Post 4:5 · 1080×1350", w: 1080, h: 1350, desc: "Feed vertical — ocupa mais tela, alcance maior" },
  story: { label: "Story/Reels 9:16 · 1080×1920", w: 1080, h: 1920, desc: "Stories e capa de Reels — tela cheia" },
};

const PLUS_THEMES = [
  { id: "ceu", label: "Céu dourado", emoji: "☁️", query: "golden sky clouds sunrise rays", scene: "vast golden sky with dramatic glowing clouds at sunrise, soft god rays breaking through, heavenly peaceful atmosphere, vertical composition, no text" },
  { id: "natureza", label: "Natureza", emoji: "🌿", query: "forest morning mist sunbeams", scene: "lush green forest with soft morning mist, gentle sunbeams through the leaves, tranquil sacred nature, vertical composition, no text" },
  { id: "vela", label: "Vela", emoji: "🕯️", query: "candle flame warm dark bokeh", scene: "a single glowing candle flame in warm gentle darkness, golden bokeh, sacred peaceful mood, vertical composition, no text" },
  { id: "mar", label: "Mar", emoji: "🌊", query: "calm ocean waves golden hour", scene: "calm ocean waves at golden hour, glowing gentle horizon, serene peace, vertical composition, no text" },
  { id: "montanhas", label: "Montanhas", emoji: "🏔️", query: "mountain peaks sunrise clouds valley", scene: "majestic mountain peaks bathed in golden sunrise light, valley of soft clouds below, vertical composition, no text" },
  { id: "estrelas", label: "Céu estrelado", emoji: "🌌", query: "starry night sky milky way", scene: "starry night sky with the milky way over a peaceful valley, deep blues with warm golden horizon glow, vertical composition, no text" },
  { id: "pomba", label: "Pomba da paz", emoji: "🕊️", query: "white dove flying sky", scene: "a white dove flying in soft heavenly light, calm radiant sky, purity and peace, vertical composition, no text" },
  { id: "maos", label: "Mãos em oração", emoji: "🤲", query: "praying hands warm light", scene: "hands clasped in prayer bathed in warm heavenly light rays, sacred reverent mood, vertical composition, no text" },
  { id: "sunset", label: "Pôr do sol", emoji: "🌅", query: "golden sunset sky clouds", scene: "breathtaking golden sunset sky with warm orange and purple clouds, peaceful horizon, vertical composition, no text" },
  { id: "lavanda", label: "Lavanda", emoji: "💜", query: "lavender field purple golden light", scene: "endless purple lavender field in soft golden light, serene divine beauty, vertical composition, no text" },
  { id: "minimal", label: "Minimalista", emoji: "🖤", query: "golden light beam dark background minimal", scene: "single golden light beam on pure dark background, elegant minimalism, premium sacred atmosphere, vertical composition, no text" },
  { id: "roses", label: "Rosas", emoji: "🌹", query: "white golden roses dew light sacred", scene: "luminous white and golden roses in full bloom, soft heavenly light, dew drops, vertical composition, no text" },
  { id: "aurora", label: "Aurora Boreal", emoji: "🌌", query: "aurora borealis northern lights night sky", scene: "magnificent aurora borealis in deep night sky, vibrant green and purple lights, sacred cosmic wonder, vertical composition, no text" },
  { id: "galaxy", label: "Via Láctea", emoji: "🪐", query: "milky way galaxy stars night sky cosmic", scene: "stunning milky way galaxy stretching across night sky, cosmic divine vastness, stars and nebula, vertical composition, no text" },
  { id: "cherry", label: "Cherry Blossom", emoji: "🌸", query: "cherry blossom petals pink light", scene: "delicate pink cherry blossom petals falling in soft golden light, ethereal sacred beauty, spring renewal, vertical composition, no text" },
  { id: "cachoeira", label: "Cachoeira", emoji: "💧", query: "waterfall tropical forest misty peaceful", scene: "majestic waterfall cascading into crystal pool, lush green tropical forest, misty sacred atmosphere, vertical composition, no text" },
  { id: "vitral", label: "Vitral", emoji: "⛪", query: "stained glass window church light sacred", scene: "stunning stained glass window with divine light streaming through, sacred church interior, colorful spiritual radiance, vertical composition, no text" },
  { id: "trigo", label: "Campo de Trigo", emoji: "🌾", query: "golden wheat field sunset peaceful", scene: "golden wheat field swaying in gentle wind under warm sunset light, peaceful harvest, divine abundance, vertical composition, no text" },
  { id: "fogueira", label: "Fogueira", emoji: "🔥", query: "campfire night stars warm peaceful", scene: "warm glowing campfire under starry night sky, intimate sacred gathering atmosphere, warmth and reflection, vertical composition, no text" },
  { id: "nuvens", label: "Nuvens Douradas", emoji: "☁️", query: "golden clouds divine light heaven sky", scene: "dramatic golden clouds parting to reveal divine light from above, heavenly atmosphere, sacred sky, vertical composition, no text" },
];

const PLUS_SOURCES = {
  cloudflare: { label: "Cloudflare IA", desc: "Arte exclusiva gerada por IA (FLUX)" },
  pollinations: { label: "Pollinations IA", desc: "Arte exclusiva gerada por IA gratuita" },
  pexels: { label: "Pexels", desc: "Fotos reais profissionais gratuitas" },
  pixabay: { label: "Pixabay", desc: "Fotos reais gratuitas" },
};

const PLUS_VERSES = [
  { x: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.", ref: "Isaías 41:10" },
  { x: "O Senhor é o meu pastor; nada me faltará.", ref: "Salmos 23:1" },
  { x: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
  { x: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", ref: "Salmos 37:5" },
  { x: "Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.", ref: "Mateus 11:28" },
  { x: "O choro pode durar uma noite, mas a alegria vem ao amanhecer.", ref: "Salmos 30:5" },
  { x: "Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.", ref: "Salmos 119:105" },
  { x: "Aquietai-vos e sabei que eu sou Deus.", ref: "Salmos 46:10" },
  { x: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.", ref: "Provérbios 3:5-6" },
  { x: "Em paz me deito e logo pego no sono, porque só tu, Senhor, me fazes repousar seguro.", ref: "Salmos 4:8" },
  { x: "Buscai primeiro o reino de Deus e a sua justiça, e todas as demais coisas vos serão acrescentadas.", ref: "Mateus 6:33" },
  { x: "O Senhor é a minha luz e a minha salvação; a quem temerei?", ref: "Salmos 27:1" },
  { x: "As misericórdias do Senhor renovam-se cada manhã. Grande é a tua fidelidade.", ref: "Lamentações 3:22-23" },
  { x: "Sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.", ref: "Romanos 8:28" },
  { x: "No mundo tereis aflições, mas tende bom ânimo: eu venci o mundo.", ref: "João 16:33" },
  { x: "Ela está sentada à sombra do Onipotente; nada alcança quem mora no esconderijo do Altíssimo.", ref: "Salmos 91:1" },
  { x: "Deus é o nosso refúgio e a nossa fortaleza, sempre pronto para ajudar.", ref: "Salmos 46:1" },
  { x: "A paz de Deus excede todo entendimento.", ref: "Filipenses 4:7" },
];

const PLUS_CARD_KICKERS = ["Versículo do dia", "Palavra para hoje", "Guarda no coração", "A Palavra diz", "Para o seu momento"];

const PLUS_MESSAGES = [
  { x: "Aquela batalha que você trava em silêncio? Deus já viu, e a vitória já tem data marcada. Aguenta firme.", ref: "" },
  { x: "A porta que fechou para você estava te protegendo. Deus preparou outra maior — espere e verás.", ref: "" },
  { x: "Você não precisa ser forte hoje. Só precisa entregar. Deus sustenta o que você não consegue carregar.", ref: "Salmos 55:22" },
  { x: "O tempo de Deus não atrasa. O que você pediu com lágrimas vai chegar como resposta com alegria.", ref: "" },
  { x: "Deus viu cada lágrima escondida. Nenhuma foi desperdiçada: elas viraram sementes da sua próxima alegria.", ref: "" },
  { x: "Pare de correr atrás do que Deus já garantiu. Descansa: a promessa não depende só dos seus esforços.", ref: "" },
  { x: "Você recomeçou tantas vezes... desta vez Deus recomeça com você. E essa história vai ser diferente.", ref: "" },
  { x: "A ansiedade mente sobre o seu futuro. Deus escreveu dias de paz nele — confie até chegar lá.", ref: "" },
  { x: "Você está vendo isto não é por acaso. Deus tem um recado para o seu coração agora.", ref: "" },
  { x: "Enquanto você lê isso, Deus está preparando algo que vai compensar todo o tempo de espera.", ref: "" },
];

const PLUS_MESSAGE_HOOKS = [
  "Deus me mandou lembrar você disso",
  "Se você está vendo isto, não é por acaso",
  "Deus tem um recado para você hoje",
  "Esta mensagem chegou até você por um motivo",
  "Deus quer acalmar o seu coração agora",
  "Pare um minuto: Deus quer falar com você",
  "Você precisava ler exatamente isto hoje",
  "Deus preparou este recado para o seu dia",
];

const PLUS_CURA_POSTS = [
  { t: "Deus cura o que ninguém vê", x: "Aquela ferida que você esconde por trás do sorriso também interessa a Deus. Traz a ele agora: onde a medicina alcança, ele abençoa; onde ninguém alcança, ele cura." },
  { t: "Você está liberado(a)", x: "Em nome de Jesus, declara-se livre: livre do passado, da culpa e do medo que te prendia. Quem o Filho liberta é livre verdadeiramente. Recebe essa liberdade hoje." },
  { t: "O teu coração vai sarar", x: "Cicatriz não é sinal de derrota: é prova de que a ferida fechou. O tempo de Deus está costurando o teu interior com amor. Confia — a tua alma vai florescer de novo." },
  { t: "Corrente quebrada", x: "Toda herança de dor termina em ti. Em Cristo, tu és geração de bênção. Quebra o ciclo, renuncia a mentira e anda na liberdade de filho de Deus." },
  { t: "Entrega a dor nas mãos do Pai", x: "Abre as mãos agora e entrega: as memórias, as perguntas sem resposta e o cansaço da alma. Cuidar de ti é trabalho dEle — e ele nunca falha." },
  { t: "Nenhuma palavra te define", x: "Rejeição não define, fracasso não define, diagnóstico não define. Tu és obra-prima escrita pela mão de Deus. Levanta a cabeça: a tua identidade é eterna." },
  { t: "A cura começa agora", x: "Você não precisa esperar amanhã para começar a sarar. Deus está operando neste exato momento. Abre o coração e receba a restauração que já foi escrita sobre a sua vida." },
  { t: "Liberto(a) para viver", x: "Deus não te libertou para viver com medo. Caminhe na liberdade: sorria sem culpa, ame sem medo, viva sem correntes. A graça já fez o trabalho." },
];

/* legendas prontas por formato */
function plusCaptionFor(formatId, content) {
  const tags = [
    "#versiculododia","#palavradeDeus","#biblia","#fe","#deus","#jesus",
    "#oracao","#gratidao","#esperanca","#amor","#paz","#espiritualidade",
    "#palavradodia","#devocional","#cristao","#bendita","#evangelho",
  ].sort(() => Math.random() - 0.5).slice(0, 12);
  const follow = "🔔 Siga @alvoradadoceu para receber uma palavra todos os dias";
  const save = "📌 Salve para reler quando precisar";
  const lines = [];

  if (formatId === "versiculo") {
    lines.push("📖 " + content.ref);
    lines.push("");
    lines.push(content.x);
    lines.push("");
    lines.push("Guarde esta promessa no coração.");
    lines.push(save);
    lines.push("✨ Compartilhe com alguém que ama a Palavra");
    lines.push(follow);
  } else if (formatId === "mensagem") {
    lines.push("✉️ " + (content.hook || "Deus tem um recado para você"));
    lines.push("");
    lines.push(content.x + (content.ref ? " (" + content.ref + ")" : ""));
    lines.push("");
    lines.push("Se tocou o seu coração, era pra você mesmo.");
    lines.push("✨ Compartilhe — pode ser o recado de alguém");
    lines.push(save);
    lines.push(follow);
  } else if (formatId === "cura") {
    lines.push("💗 " + (content.t || "Cura e libertação"));
    lines.push("");
    lines.push(content.x);
    lines.push("");
    lines.push("👇 Comente EU RECEBO para declarar essa cura sobre a sua vida");
    lines.push("✨ Marque alguém que precisa dessa palavra hoje");
    lines.push(save);
    lines.push(follow);
  }

  lines.push("");
  lines.push(tags.join(" "));
  return lines.join("\n");
}
