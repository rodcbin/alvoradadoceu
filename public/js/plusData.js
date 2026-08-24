/* =========================================================
   Alvorada do Céu — Aba Plus (Engajamento)
   Banco de conteúdo: formatos de post, estilos de card,
   quiz bíblico, orações AMÉM, ganchos, stories interativos
   e o mix semanal de publicações.
   ========================================================= */

/* formatos de post disponíveis na aba Plus */
const PLUS_FORMATS = [
  {
    id: "versiculo",
    label: "📖 Versículo Card",
    desc: "Versículo em fundo preto, claro ou página da bíblia. Salvamentos e compartilhamentos.",
    hint: "O clássico do nicho: alterne fundo preto e claro durante a semana para criar identidade no feed.",
    multi: false,
  },
  {
    id: "amem",
    label: "🙏 Diga AMÉM",
    desc: "Oração curta com convite para comentar AMÉM — o comentário mais fácil de escalar.",
    hint: "Responda todos os AMÉM com uma bênção: cada resposta empurra o post para mais pessoas.",
    multi: true,
  },
  {
    id: "marque",
    label: "💌 Marque alguém",
    desc: "\"Marque alguém que precisa ler isso\" — marcações trazem alcance novo sem depender do algoritmo.",
    hint: "Cada amigo marcado é um visitante novo no perfil. Use 1 a 2 vezes por semana.",
    multi: false,
  },
  {
    id: "mensagem",
    label: "✉️ Mensagem de Deus",
    desc: "\"Deus me mandou te lembrar disso\" — o formato mais compartilhado no privado.",
    hint: "Frases em segunda pessoa geram identificação imediata e disparos de compartilhamento.",
    multi: false,
  },
  {
    id: "quiz",
    label: "🧠 Quiz Bíblico",
    desc: "Carrossel \"Complete o versículo\": pergunta, resposta e CTA. Enxurrada de respostas nos comentários.",
    hint: "Publique 1x por semana: quem erra comenta de novo para conferir, e o engajamento dobra.",
    multi: true,
  },
  {
    id: "carrossel",
    label: "🎠 Carrossel de Palavras",
    desc: "Série de 6 a 8 slides sobre um tema (paz, ansiedade, gratidão…): capa, versículos e slide final de CTA.",
    hint: "Carrossel é o formato com mais salvamentos do Instagram. Cada slide é um versículo — arraste e salve.",
    multi: true,
  },
  {
    id: "story",
    label: "📱 Story Interativo",
    desc: "Enquete, caixinha de perguntas e escala emocional prontos para postar nos stories.",
    hint: "Story interativo todo dia aquece o algoritmo do perfil inteiro — use antes do post principal.",
    multi: true,
  },
  {
    id: "semana",
    label: "🗓️ Mix Semanal",
    desc: "Planner com o mix de publicações da semana: dia, formato, horário e objetivo de cada post.",
    hint: "Gere o plano, siga a ordem e marque o que já postou. Constância é o que cria seguidor fiel.",
    multi: false,
  },
];

/* séries de carrossel — um tema, vários versículos, capa + CTA */
const PLUS_CAROUSELS = [
  {
    id: "paz",
    title: "Paz em dias difíceis",
    kicker: "Série de paz",
    verses: [
      { x: "Deixo-vos a paz, a minha paz vos dou.", ref: "João 14:27" },
      { x: "E a paz de Deus guardará os vossos corações.", ref: "Filipenses 4:7" },
      { x: "Em mim tendes paz no mundo.", ref: "João 16:33" },
      { x: "O Senhor te abençoe e lhe dê a paz.", ref: "Números 6:26" },
      { x: "Bem-aventurados os pacificadores.", ref: "Mateus 5:9" },
      { x: "A paz lhes concedo; a minha paz vos dou.", ref: "João 14:27" },
    ],
  },
  {
    id: "ansiedade",
    title: "Contra a ansiedade",
    kicker: "Série de confiança",
    verses: [
      { x: "Lançai sobre ele toda a vossa ansiedade.", ref: "1 Pedro 5:7" },
      { x: "Não andeis ansiosos por coisa alguma.", ref: "Filipenses 4:6" },
      { x: "Não vos afanais pelo amanhã.", ref: "Mateus 6:34" },
      { x: "Entrega o teu caminho ao Senhor; confia nele.", ref: "Salmos 37:5" },
      { x: "Deixai que a paz de Cristo seja árbitro em vossos corações.", ref: "Colossenses 3:15" },
      { x: "Amanhã fareis melhor, se o Senhor quiser.", ref: "Tiago 4:15" },
    ],
  },
  {
    id: "gratidao",
    title: "Coração agradecido",
    kicker: "Série de gratidão",
    verses: [
      { x: "Rendei graças em todas as coisas.", ref: "1 Tessalonicenses 5:18" },
      { x: "Entrai pelas suas portas com ações de graças.", ref: "Salmos 100:4" },
      { x: "Tudo o que existe, recebeu do Senhor.", ref: "Tiago 1:17" },
      { x: "Bendize, ó minha alma, ao Senhor.", ref: "Salmos 103:2" },
      { x: "Em tudo somos mais que vencedores.", ref: "Romanos 8:37" },
      { x: "O Senhor é bom, eterna é a sua misericórdia.", ref: "Salmos 136:1" },
    ],
  },
  {
    id: "forca",
    title: "Força para recomeçar",
    kicker: "Série de coragem",
    verses: [
      { x: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
      { x: "Esforça-te e tem bom ânimo!", ref: "Josué 1:9" },
      { x: "O Senhor é a minha luz e a minha salvação.", ref: "Salmos 27:1" },
      { x: "Vinde a mim todos os que estais cansados.", ref: "Mateus 11:28" },
      { x: "As suas misericórdias se renovam a cada manhã.", ref: "Lamentações 3:22-23" },
      { x: "Quando sou fraco, então sou forte.", ref: "2 Coríntios 12:10" },
    ],
  },
  {
    id: "amor",
    title: "O amor de Deus por você",
    kicker: "Série de amor",
    verses: [
      { x: "Deus amou o mundo de tal maneira que deu o seu Filho.", ref: "João 3:16" },
      { x: "Ame uns aos outros como eu vos amei.", ref: "João 15:12" },
      { x: "Com amor eterno eu te amei.", ref: "Jeremias 31:3" },
      { x: "O amor jamais acaba.", ref: "1 Coríntios 13:8" },
      { x: "Somos chamados filhos de Deus.", ref: "1 João 3:1" },
      { x: "Acima de tudo, revesti-vos do amor.", ref: "Colossenses 3:14" },
    ],
  },
  {
    id: "proposito",
    title: "Deus tem um propósito",
    kicker: "Série de propósito",
    verses: [
      { x: "Eu sei os planos que tenho para vocês.", ref: "Jeremias 29:11" },
      { x: "Todas as coisas cooperam para o bem.", ref: "Romanos 8:28" },
      { x: "Antes de formar-te no ventre, te conheci.", ref: "Jeremias 1:5" },
      { x: "Para tudo há a sua ocasião.", ref: "Eclesiastes 3:1" },
      { x: "Os passos do homem são dirigidos pelo Senhor.", ref: "Salmos 37:23" },
      { x: "Fiel é aquele que vos chama.", ref: "1 Tessalonicenses 5:24" },
    ],
  },
];

/* estilos visuais do versículo card */
const PLUS_CARD_STYLES = {
  dark: { label: "⬛ Preto", desc: "Fundo preto com texto branco — elegância máxima" },
  light: { label: "⬜ Claro", desc: "Fundo claro com texto escuro — o inverso, limpa o feed" },
  biblepage: { label: "📜 Página da Bíblia", desc: "Página envelhecida desenhada, versículo tipografado" },
  photo: { label: "🖼️ Foto/IA", desc: "Foto real ou arte de IA com o versículo sobreposto" },
};

/* formatos/tamanhos exportados — resoluções oficiais do Instagram */
const PLUS_SIZES = {
  square: { label: "Post 1:1 · 1080×1080", w: 1080, h: 1080, desc: "Feed quadrado — clássico" },
  portrait: { label: "Post 4:5 · 1080×1350", w: 1080, h: 1350, desc: "Feed vertical — ocupa mais tela, alcance maior" },
  story: { label: "Story/Reels 9:16 · 1080×1920", w: 1080, h: 1920, desc: "Stories e capa de Reels — tela cheia" },
};

/* temas de fundo (mesma linguagem da aba Reels) */
const PLUS_THEMES = [
  { id: "ceu", label: "Céu dourado", emoji: "☁️", query: "golden sky clouds sunrise rays", scene: "vast golden sky with dramatic glowing clouds at sunrise, soft god rays breaking through, heavenly peaceful atmosphere, vertical composition, no text" },
  { id: "natureza", label: "Natureza", emoji: "🌿", query: "forest morning mist sunbeams", scene: "lush green forest with soft morning mist, gentle sunbeams through the leaves, tranquil sacred nature, vertical composition, no text" },
  { id: "vela", label: "Vela", emoji: "🕯️", query: "candle flame warm dark bokeh", scene: "a single glowing candle flame in warm gentle darkness, golden bokeh, sacred peaceful mood, vertical composition, no text" },
  { id: "mar", label: "Mar", emoji: "🌊", query: "calm ocean waves golden hour", scene: "calm ocean waves at golden hour, glowing gentle horizon, serene peace, vertical composition, no text" },
  { id: "montanhas", label: "Montanhas", emoji: "🏔️", query: "mountain peaks sunrise clouds valley", scene: "majestic mountain peaks bathed in golden sunrise light, valley of soft clouds below, vertical composition, no text" },
  { id: "estrelas", label: "Céu estrelado", emoji: "🌌", query: "starry night sky milky way", scene: "starry night sky with the milky way over a peaceful valley, deep blues with warm golden horizon glow, vertical composition, no text" },
  { id: "pomba", label: "Pomba da paz", emoji: "🕊️", query: "white dove flying sky", scene: "a white dove flying in soft heavenly light, calm radiant sky, purity and peace, vertical composition, no text" },
  { id: "maos", label: "Mãos em oração", emoji: "🤲", query: "praying hands warm light", scene: "hands clasped in prayer bathed in warm heavenly light rays, sacred reverent mood, vertical composition, no text" },
];

/* fontes de imagem (com fallback automático entre elas) */
const PLUS_SOURCES = {
  cloudflare: { label: "Cloudflare IA", desc: "Arte exclusiva gerada por IA (FLUX)" },
  pollinations: { label: "Pollinations IA", desc: "Arte exclusiva gerada por IA gratuita" },
  pexels: { label: "Pexels", desc: "Fotos reais profissionais gratuitas" },
  pixabay: { label: "Pixabay", desc: "Fotos reais gratuitas" },
};

/* versículos completos do card (reuso do acervo + extras) */
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
];

/* kickers do versículo card */
const PLUS_CARD_KICKERS = ["Versículo do dia", "Palavra para hoje", "Guarda no coração", "A Palavra diz", "Para o seu momento"];

/* quiz bíblico — complete o versículo */
const PLUS_QUIZ = [
  { q: "Tudo posso naquele que me ___.", answer: "fortalece", verse: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
  { q: "O Senhor é o meu ___; nada me faltará.", answer: "pastor", verse: "O Senhor é o meu pastor; nada me faltará.", ref: "Salmos 23:1" },
  { q: "Aquietai-vos e sabei que eu sou ___.", answer: "Deus", verse: "Aquietai-vos e sabei que eu sou Deus.", ref: "Salmos 46:10" },
  { q: "Lâmpada para os meus pés é a tua ___.", answer: "palavra", verse: "Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.", ref: "Salmos 119:105" },
  { q: "Entrega o teu caminho ao Senhor; ___ nele, e ele tudo fará.", answer: "confia", verse: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", ref: "Salmos 37:5" },
  { q: "Vinde a mim, todos os que estais cansados e ___.", answer: "sobrecarregados", verse: "Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.", ref: "Mateus 11:28" },
  { q: "Não temas, porque eu sou ___.", answer: "contigo", verse: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.", ref: "Isaías 41:10" },
  { q: "O choro pode durar uma noite, mas a ___ vem ao amanhecer.", answer: "alegria", verse: "O choro pode durar uma noite, mas a alegria vem ao amanhecer.", ref: "Salmos 30:5" },
  { q: "Confia no Senhor de todo o teu ___.", answer: "coração", verse: "Confia no Senhor de todo o teu coração.", ref: "Provérbios 3:5" },
  { q: "Em paz me deito e logo pego no ___.", answer: "sono", verse: "Em paz me deito e logo pego no sono, porque só tu, Senhor, me fazes repousar seguro.", ref: "Salmos 4:8" },
  { q: "Pedi, e dar-se-vos-á; buscai, e ___.", answer: "encontrareis", verse: "Pedi, e dar-se-vos-á; buscai, e encontrareis; batei, e abrir-se-vos-á.", ref: "Mateus 7:7" },
  { q: "O amor é paciente, o amor é ___.", answer: "bondoso", verse: "O amor é paciente, o amor é bondoso. O amor nunca falha.", ref: "1 Coríntios 13:4,8" },
];

/* orações curtas para o formato "Diga AMÉM" */
const PLUS_AMEN_PRAYERS = [
  { t: "Oração de gratidão", x: "Senhor, obrigado pelo dia de hoje: pelo pão, pela saúde e pelas pessoas que amo. Que eu nunca me acostume com as tuas bênçãos pequenas. Amém." },
  { t: "Oração de proteção", x: "Deus, guarda a minha casa esta noite. Protege quem eu amo, acalma o meu coração e renova as minhas forças para amanhã. Amém." },
  { t: "Oração de entrega", x: "Pai, eu entrego nas tuas mãos aquilo que não consigo resolver sozinho(a). Toma conta de tudo enquanto eu descanso. Amém." },
  { t: "Oração pela família", x: "Senhor, abençoa a minha família: une o que andou distante, cura o que dói e enche a nossa casa da tua paz. Amém." },
  { t: "Oração do trabalho", x: "Deus, ilumina o meu trabalho. Que as minhas mãos sejam abençoadas e o meu esforço abra portas. Eu confio em ti. Amém." },
  { t: "Oração de cura", x: "Jesus, toca agora o lugar que dói dentro de mim. Cura o corpo, acalma a mente e restaura o coração. Amém." },
  { t: "Oração de fé", x: "Senhor, aumenta a minha fé. Onde há medo, planta coragem; onde há dúvida, planta certeza. Eu creio em ti. Amém." },
  { t: "Oração pelo perdão", x: "Pai, livra-me de toda mágoa. Ensina-me a perdoar como sou perdoado(a) e a recomeçar leve. Amém." },
  { t: "Oração de boa noite", x: "Boa noite, meu Deus. Obrigado pelo dia que passou; entrego a ti o dia que vem. Em paz eu durmo, porque tu velas por mim. Amém." },
  { t: "Oração de bom dia", x: "Bom dia, Senhor! Obrigado por mais um amanhecer. Guia os meus passos e faz de mim canal da tua paz. Amém." },
];

/* ganchos do formato "Mensagem de Deus" (share-bait) */
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

/* mensagens do share-bait */
const PLUS_MESSAGES = [
  { x: "Aquela batalha que você trava em silêncio? Deus já viu, e a vitória já tem data marcada. Aguenta firme.", ref: "" },
  { x: "A porta que fechou para você estava te protegendo. Deus preparou outra maior — espere e verás.", ref: "" },
  { x: "Você não precisa ser forte hoje. Só precisa entregar. Deus sustenta o que você não consegue carregar.", ref: "Salmos 55:22" },
  { x: "O tempo de Deus não atrasa. O que você pediu com lágrimas vai chegar como resposta com alegria.", ref: "" },
  { x: "Deus viu cada lágrima escondida. Nenhuma foi desperdiçada: elas viraram sementes da sua próxima alegria.", ref: "" },
  { x: "Pare de correr atrás do que Deus já garantiu. Descansa: a promessa não depende só dos seus esforços.", ref: "" },
  { x: "Você recomeçou tantas vezes... desta vez Deus recomeça com você. E essa história vai ser diferente.", ref: "" },
  { x: "A ansiedade mente sobre o seu futuro. Deus escreveu dias de paz nele — confie até chegar lá.", ref: "" },
];

/* linhas do formato "Marque alguém" */
const PLUS_MARK_LINES = [
  { head: "Marque alguém que precisa ler isso", sub: "pode ser exatamente a palavra do dia dessa pessoa 💛" },
  { head: "Envie para alguém que você ama", sub: "abençoe alguém hoje com esta palavra ✨" },
  { head: "Marque alguém que é luz na sua vida", sub: "e diga o quanto essa pessoa faz diferença 🌟" },
  { head: "Compartilhe com quem está lutando", sub: "essa pessoa precisa saber: ela não está sozinha 🤝" },
  { head: "Marque alguém que Deus colocou no seu caminho", sub: "amizade abençoada também é bênção de Deus 💫" },
];

/* textos curtos que acompanham o marquee */
const PLUS_MARK_TEXTS = [
  "Deus usa pequenos gestos para transformar grandes histórias. A sua marcação pode ser a resposta da oração de alguém.",
  "Antes de rolar a tela, pense: quem precisa ouvir isso hoje? Marque e abençoe.",
  "Uma simples marcação pode virar a virada da semana de alguém. Faça acontecer.",
  "Se lembrou de alguém enquanto lia, não é coincidência. Marque agora.",
];

/* stories interativos — templates de sticker */
const PLUS_STORIES = [
  {
    id: "poll",
    label: "Enquete Sim/Não",
    question: "Você está entregando tudo nas mãos de Deus?",
    options: ["Sim, todo dia 🙏", "Estou aprendendo 💭"],
    hint: "Enquete de 2 opções: todo mundo vota sem pensar — engajamento garantido.",
  },
  {
    id: "choice",
    label: "Qual dos dois?",
    question: "O que sua alma mais precisa hoje?",
    options: ["Paz 🕊️", "Força 💪"],
    hint: "Escolhas binárias geram respostas em cadeia — responda quem votar com um versículo.",
  },
  {
    id: "ask",
    label: "Caixinha de perguntas",
    question: "Qual versículo te sustentou esse ano?",
    options: [],
    hint: "As respostas da caixinha rendem conteúdo pronto por semanas: repost as melhores.",
  },
  {
    id: "scale",
    label: "Escala emocional",
    question: "Quanta paz você sente neste momento?",
    options: ["Nenhuma 😔", "Um pouco 🌤️", "Muita 🌈"],
    hint: "Escalas revelam como o público está — e dão ideia de conteúdo para o próximo post.",
  },
  {
    id: "quizstory",
    label: "Mini quiz",
    question: "\"Tudo posso naquele que me fortalece\" está em qual livro?",
    options: ["Filipenses 📖", "Salmos 📜"],
    hint: "Quiz nos stories treina o público para o quiz do feed — poste no dia anterior.",
  },
  {
    id: "pray",
    label: "Pedido de oração",
    question: "Posso orar por você hoje?",
    options: ["Sim 🙌", "Só responde AMÉM"],
    hint: "Responda cada pedido com uma bênção personalizada: cria vínculo profundo.",
  },
];

/* =========================================================
   MIX SEMANAL — planner de publicações
   Cada slot lista opções; o gerador sorteia 1 por dia
   garantindo variedade de objetivos.
   ========================================================= */

const PLUS_WEEK_GOALS = {
  comentario: { label: "Comentários", emoji: "💬" },
  salvar: { label: "Salvamentos", emoji: "📌" },
  compartilhar: { label: "Compartilhamentos", emoji: "✨" },
  seguir: { label: "Seguidores", emoji: "🔔" },
  alcance: { label: "Alcance", emoji: "📈" },
};

/* tool indica onde gerar: plus (esta aba), reels (aba Reels), frase (aba Frases) */
const PLUS_WEEK_POOL = {
  seg: [
    { e: "🌅", label: "Oração da manhã", detail: "Reels narrado ou card AMÉM", hour: "06h–08h", goal: "comentario", tool: "plus" },
    { e: "📖", label: "Versículo Card preto", detail: "Abrir a semana com a Palavra", hour: "07h–09h", goal: "salvar", tool: "plus" },
    { e: "🙏", label: "Diga AMÉM", detail: "Oração curta + pedido de comentário", hour: "06h–08h", goal: "comentario", tool: "plus" },
  ],
  ter: [
    { e: "🧠", label: "Quiz Bíblico", detail: "Complete o versículo (carrossel)", hour: "12h–13h", goal: "comentario", tool: "plus" },
    { e: "📱", label: "Story enquete", detail: "Aquecer o público antes do quiz", hour: "09h–10h", goal: "alcance", tool: "plus" },
    { e: "💬", label: "Frases do dia", detail: "Carrossel clássico do acervo", hour: "18h–20h", goal: "salvar", tool: "reels" },
  ],
  qua: [
    { e: "✉️", label: "Mensagem de Deus", detail: "Share-bait em segunda pessoa", hour: "20h–22h", goal: "compartilhar", tool: "plus" },
    { e: "💛", label: "Versículos para a ansiedade", detail: "Lista numerada para salvar", hour: "19h–21h", goal: "salvar", tool: "reels" },
    { e: "📜", label: "Página da Bíblia", detail: "Versículo estilo página antiga", hour: "12h–13h", goal: "salvar", tool: "plus" },
  ],
  qui: [
    { e: "💌", label: "Marque alguém", detail: "\"Marque quem precisa ler isso\"", hour: "18h–20h", goal: "alcance", tool: "plus" },
    { e: "✨", label: "Testemunho", detail: "História de fé narrada", hour: "20h–22h", goal: "compartilhar", tool: "reels" },
    { e: "🕊️", label: "Story caixinha", detail: "Pergunte algo aos seguidores", hour: "12h–14h", goal: "comentario", tool: "plus" },
  ],
  sex: [
    { e: "🌙", label: "Oração da noite", detail: "Fechar a semana em oração", hour: "21h–22h", goal: "comentario", tool: "reels" },
    { e: "🙏", label: "Diga AMÉM", detail: "Oração de gratidão pela semana", hour: "20h–21h", goal: "comentario", tool: "plus" },
    { e: "🌟", label: "Milagre do dia", detail: "Palavra de fé e expectativa", hour: "18h–19h", goal: "compartilhar", tool: "frase" },
  ],
  sab: [
    { e: "🎲", label: "Escolha um número", detail: "O rei do engajamento", hour: "11h–13h", goal: "comentario", tool: "reels" },
    { e: "💌", label: "Marque alguém", detail: "Edição fim de semana", hour: "15h–17h", goal: "alcance", tool: "plus" },
    { e: "🖼️", label: "Imagem com frase", detail: "Frase bonita com foto real", hour: "12h–14h", goal: "salvar", tool: "frase" },
  ],
  dom: [
    { e: "👑", label: "Versículo dominical", detail: "Card claro + série semanal", hour: "08h–10h", goal: "seguir", tool: "plus" },
    { e: "🙌", label: "Louvor e agradecimento", detail: "Reels de louvor", hour: "09h–11h", goal: "seguir", tool: "reels" },
    { e: "🔔", label: "Recap da semana", detail: "Melhores momentos + convite a seguir", hour: "18h–20h", goal: "seguir", tool: "plus" },
  ],
};

const PLUS_WEEK_DAYS = [
  { id: "seg", label: "Segunda" },
  { id: "ter", label: "Terça" },
  { id: "qua", label: "Quarta" },
  { id: "qui", label: "Quinta" },
  { id: "sex", label: "Sexta" },
  { id: "sab", label: "Sábado" },
  { id: "dom", label: "Domingo" },
];

/* hashtags base da aba Plus (mistura com as das outras abas) */
const PLUS_HASHTAGS = [
  "#versiculododia", "#palavradeDeus", "#biblia", "#fe", "#deus", "#jesus",
  "#oracao", "#gratidao", "#esperanca", "#amor", "#paz", "#espiritualidade",
  "#palavradodia", "#devocional", "#cristao", "#bendita", "#evangelho",
];

/* legendas prontas por formato */
function plusCaptionFor(formatId, content) {
  const tags = PLUS_HASHTAGS.slice().sort(() => Math.random() - 0.5).slice(0, 12);
  const follow = "🔔 Siga @alvoradadoceu para receber uma palavra todos os dias";
  const save = "📌 Salve para reler quando precisar";
  const lines = [];

  if (formatId === "versiculo") {
    lines.push("📖 " + content.ref);
    lines.push("");
    lines.push(content.x);
    lines.push("");
    lines.push("\"Lâmpada para os meus pés é a tua palavra.\" Guarde esta promessa no coração.");
    lines.push(save);
    lines.push("✨ Compartilhe com alguém que ama a Palavra");
    lines.push(follow);
  } else if (formatId === "amem") {
    lines.push("🙏 " + (content.t || "Oração do dia"));
    lines.push("");
    lines.push(content.x);
    lines.push("");
    lines.push("👇 Comente AMÉM para declarar esta oração");
    lines.push("Eu respondo cada AMÉM com uma bênção!");
    lines.push(follow);
  } else if (formatId === "marque") {
    lines.push("💌 " + content.head);
    lines.push("");
    lines.push(content.x || content.sub);
    lines.push("");
    lines.push("👇 Marque nos comentários quem precisa ler isso");
    lines.push(save);
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
  } else if (formatId === "quiz") {
    lines.push("🧠 Quiz Bíblico: complete o versículo!");
    lines.push("");
    lines.push(content.q);
    lines.push("");
    lines.push("👇 Comenta a resposta antes de deslizar para conferir!");
    lines.push("Acertou? Comenta \"ACERTEI\" 🙌");
    lines.push(save);
    lines.push(follow);
  } else if (formatId === "carrossel") {
    const title = content.title || "Palavras para o seu coração";
    lines.push("🎠 " + title + " — um carrossel para guardar no coração");
    lines.push("");
    (content.verses || []).forEach((v) => {
      lines.push("📖 " + v.x + " (" + v.ref + ")");
    });
    lines.push("");
    lines.push("➡️ Arraste para o lado e deixe a Palavra te alcançar.");
    lines.push("📌 Salve este carrossel para reler nos dias difíceis");
    lines.push("✨ Marque alguém que precisa dessas palavras");
    lines.push(follow);
  } else if (formatId === "story") {
    lines.push("📱 Story interativo pronto:");
    lines.push("");
    lines.push(content.question);
    if (content.options && content.options.length) {
      lines.push("Opções: " + content.options.join("  ·  "));
    }
    lines.push("");
    lines.push("Cole nos stories e responda todo mundo que interagir.");
  } else if (formatId === "semana") {
    return content.text || "";
  }

  lines.push("");
  lines.push(tags.join(" "));
  return lines.join("\n");
}
