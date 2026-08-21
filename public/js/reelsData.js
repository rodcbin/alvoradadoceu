/* =========================================================
   Alvorada do Céu — Estúdio de Reels
   Banco de conteúdo: tipos, temas, vozes, orações,
   salmos, parábolas, hashtags e legendas prontas.
   ========================================================= */

const REELS_TYPES = [
  {
    id: "oracao-manha",
    label: "Oração da manhã",
    emoji: "🌅",
    cta: "AMÉM",
    hook: "Oração da manhã para começar o dia com Deus",
    hashtags: ["#bomdia", "#oracaodamanha", "#amanhecer", "#deusnocomando"],
  },
  {
    id: "oracao-noite",
    label: "Oração da noite",
    emoji: "🌙",
    cta: "AMÉM",
    hook: "Oração da noite para dormir em paz",
    hashtags: ["#boanoite", "#oracaodanoite", "#descanso", "#gratidao"],
  },
  {
    id: "versiculo",
    label: "Salmo / Versículo",
    emoji: "📖",
    cta: "AMÉM",
    hook: "Um versículo para acalmar o seu coração",
    hashtags: ["#versiculododia", "#versiculos", "#palavradehoje", "#biblia"],
  },
  {
    id: "parabola",
    label: "Parábola",
    emoji: "✨",
    cta: "GLÓRIA",
    hook: "Uma parábola que vai tocar o seu coração",
    hashtags: ["#parabola", "#ensinamentos", "#parabolasdejesus", "#reflexao"],
  },
  {
    id: "livre",
    label: "Oração livre",
    emoji: "🙏",
    cta: "AMÉM",
    hook: "Uma oração para o seu momento",
    hashtags: ["#oracao", "#fe", "#deus", "#paz"],
  },
  {
    id: "testemunho",
    label: "Testemunho",
    emoji: "✨",
    cta: "GLÓRIA",
    hook: "Um testemunho de fé que vai fortalecer sua jornada",
    hashtags: ["#testemunho", "#deusnacomunidade", "#fe", "#milagre"],
  },
  {
    id: "reflexao",
    label: "Reflexão",
    emoji: "🤔",
    cta: "AMÉM",
    hook: "Uma reflexão para iluminar seu coração",
    hashtags: ["#reflexao", "#pensamento", "#espiritualidade", "#sabedoria"],
  },
  {
    id: "consolo",
    label: "Palavra de consolo",
    emoji: "💛",
    cta: "AMÉM",
    hook: "Uma palavra para quem precisa de conforto hoje",
    hashtags: ["#consolo", "#conforto", "#paz", "#deus"],
  },
  {
    id: "milagre",
    label: "Milagre do dia",
    emoji: "🌟",
    cta: "GLÓRIA",
    hook: "Um milagre que acontece quando você confia em Deus",
    hashtags: ["#milagre", "#deus", "#fé", "#testemunho"],
  },
];

const REELS_THEMES = [
  {
    id: "natureza",
    label: "Natureza",
    emoji: "🌿",
    scene: "lush green forest with soft morning mist, gentle sunbeams through the leaves, a calm waterfall in the distance, tranquil sacred nature, vertical composition, no text",
    motion: "slow gentle camera push-in, leaves swaying softly, mist drifting, serene peaceful atmosphere",
  },
  {
    id: "ceu",
    label: "Céu dourado",
    emoji: "☁️",
    scene: "vast golden sky with dramatic glowing clouds at sunrise, soft god rays breaking through, heavenly peaceful atmosphere, vertical composition, no text",
    motion: "slow drift through the clouds, light rays pulsing softly, ethereal calm",
  },
  {
    id: "vela",
    label: "Vela",
    emoji: "🕯️",
    scene: "a single glowing candle flame in warm gentle darkness, golden bokeh, sacred peaceful mood, soft flickering light, vertical composition, no text",
    motion: "candle flame gently flickering, warm light breathing softly, intimate serene mood",
  },
  {
    id: "mar",
    label: "Mar",
    emoji: "🌊",
    scene: "calm ocean waves at golden hour, glowing gentle horizon, soft reflections of the sun on the water, endless serene peace, vertical composition, no text",
    motion: "gentle waves rolling slowly, sun glitter shimmering on the water, calm breathing rhythm",
  },
  {
    id: "montanhas",
    label: "Montanhas",
    emoji: "🏔️",
    scene: "majestic mountain peaks bathed in golden sunrise light, a valley of soft clouds below, breathtaking scale, sacred stillness, vertical composition, no text",
    motion: "slow aerial glide over the peaks, clouds drifting, warm light spreading",
  },
  {
    id: "estrelas",
    label: "Céu estrelado",
    emoji: "🌌",
    scene: "starry night sky with the milky way over a peaceful valley, deep blues with a warm golden glow on the horizon, mystical serene atmosphere, vertical composition, no text",
    motion: "stars softly twinkling, slow drift across the galaxy, tranquil night calm",
  },
  {
    id: "amanhecer",
    label: "Amanhecer",
    emoji: "🌄",
    scene: "soft pastel dawn over rolling hills, gentle mist rising, fresh hopeful morning light, birds in the distance, vertical composition, no text",
    motion: "slow warm light expanding, mist drifting, a new day gently awakening",
  },
  {
    id: "floresta",
    label: "Floresta encantada",
    emoji: "🌲",
    scene: "enchanted misty forest with glowing golden light rays, peaceful ferns and floating dust particles, dreamy spiritual atmosphere, vertical composition, no text",
    motion: "softly floating forward through the forest, light rays shimmering, magical calm",
  },
  {
    id: "pomba",
    label: "Pomba da paz",
    emoji: "🕊️",
    scene: "a white dove flying in soft heavenly light, calm radiant sky, purity and peace, gentle glowing clouds, vertical composition, no text",
    motion: "dove gliding gracefully, feathers catching the light, serene holy calm",
  },
  {
    id: "maos",
    label: "Mãos em oração",
    emoji: "🤲",
    scene: "hands clasped in prayer bathed in warm heavenly light rays, sacred reverent mood, soft glowing bokeh, vertical composition, no text",
    motion: "god rays slowly moving, warm glow breathing, intimate prayerful stillness",
  },
  {
    id: "chamas",
    label: "Chamas sagradas",
    emoji: "🔥",
    scene: "sacred golden fire flames dancing in darkness, warm divine radiance, spiritual purification atmosphere, glowing embers floating upward, vertical composition, no text",
    motion: "flames dancing slowly upward, warm glow breathing, sacred fire energy, embers drifting peacefully",
  },
  {
    id: "rio",
    label: "Rio de vida",
    emoji: "💧",
    scene: "crystal clear river flowing through a lush green valley, sunlight reflecting on water, peaceful life-giving water, birds in the sky, vertical composition, no text",
    motion: "gentle water flowing, sunlight sparkling on the surface, peaceful continuous movement",
  },
  {
    id: "arvore",
    label: "Árvore da vida",
    emoji: "🌳",
    scene: "majestic ancient tree with golden light filtering through leaves, strong roots and wide branches, peaceful sacred nature, soft dappled light, vertical composition, no text",
    motion: "leaves gently swaying, light filtering through branches, peaceful nature breathing",
  },
  {
    id: "rosas",
    label: "Rosas celestiais",
    emoji: "🌹",
    scene: "luminous white and golden roses in full bloom, soft heavenly light, dew drops catching divine radiance, peaceful sacred beauty, vertical composition, no text",
    motion: "petals gently opening, dew drops glistening, soft light pulsing through flowers",
  },
  {
    id: "portao",
    label: "Portal celestial",
    emoji: "🚪",
    scene: "a magnificent golden gate opening into brilliant heavenly light, divine portal, ethereal mist, sacred mysterious atmosphere, vertical composition, no text",
    motion: "gates slowly opening, light flooding outward, divine radiance expanding",
  },
];

const REELS_STYLES = {
  cinematic: { label: "Cinematográfico", prompt: "cinematic lighting, photorealistic, dramatic depth of field, ultra detailed, award winning photography" },
  watercolor: { label: "Aquarela", prompt: "delicate watercolor painting, soft ethereal washes of color, luminous white space, artistic, subtle gold accents" },
  angelic: { label: "Celestial", prompt: "angelic ethereal glow, heavenly light rays, luminous dreamlike atmosphere, divine radiance, breathtaking" },
  minimal: { label: "Minimalista", prompt: "minimalist composition, clean elegant negative space, soft luminous gradients, premium refined design" },
  moonlight: { label: "Luar", prompt: "luminous moonlight scene, deep midnight blues with silver highlights, tranquil glowing atmosphere, ethereal" },
  vintage: { label: "Vintage dourado", prompt: "warm vintage romantic painting, soft sepia and cream tones, gentle golden light, timeless nostalgic atmosphere" },
};

const REELS_VOICES = [
  { id: "camila", label: "Camila — suave", gender: "F", tag: "jovem", desc: "Voz feminina suave e jovem, acolhedora" },
  { id: "elza", label: "Elza — madura", gender: "F", tag: "senhora", desc: "Voz feminina madura, calma e serena" },
  { id: "vitoria", label: "Vitória — clara", gender: "F", tag: "jovem", desc: "Voz feminina clara e vibrante" },
  { id: "ricardo", label: "Ricardo — jovem", gender: "M", tag: "jovem", desc: "Voz masculina jovem e energética" },
  { id: "cid", label: "Thiago — grave", gender: "M", tag: "senhor", desc: "Voz masculina grave e profunda, estilo narração" },
  { id: "antonio", label: "Antônio — firme", gender: "M", tag: "formal", desc: "Voz masculina séria e articulada" },
  { id: "none", label: "Sem narração", gender: "-", tag: "só texto", desc: "Apenas texto na tela" },
];

const REELS_HASHTAGS_BASE = [
  "#oracao", "#fe", "#deus", "#jesus", "#espiritualidade", "#paz",
  "#gratidao", "#biblia", "#esperanca", "#amor", "#proposito", "#reels",
  "#instagram", "#oracaododia",
  "#milagre", "#testemunho", "#consolo", "#louvor", "#cristo",
  "#pazinterior", "#sabedoriadedeus", "#fortalezaemdeus", "#amordeus",
  "#vidadeDeus", "#espiritualidadeCrista", "#oraçãododia",
];

const REELS_MORNING = [
  { t: "Bom dia, Senhor", e: "🌅", x: "Bom dia, Senhor. Eu entrego em tuas mãos este novo dia. Abençoa os meus passos, guarda os meus pensamentos e faz de mim um instrumento da tua paz. Que eu encontre, em cada pessoa, um motivo para amar e para servir. Amém." },
  { t: "O presente do amanhecer", e: "🌤️", x: "Pai, obrigado pelo presente deste amanhecer. Renova as minhas forças, clareia as minhas ideias e enche o meu coração de esperança. Que tudo o que eu fizer hoje seja para a tua glória e para o bem de quem caminha comigo. Amém." },
  { t: "Sabedoria para o dia", e: "🕊️", x: "Senhor, neste início de dia eu te peço sabedoria nas decisões, paciência nos desafios e gratidão em cada detalhe. Cuida de quem acordou ao meu lado e de quem está longe. Que a tua paz me acompanhe do amanhecer ao anoitecer. Amém." },
  { t: "Confiança antes da agenda", e: "🙏", x: "Bom dia, Deus. Antes de qualquer agenda, eu quero descansar em ti. Guia o meu trabalho, protege o meu caminho e afasta do meu coração toda ansiedade. Hoje eu escolho a confiança e a serenidade. Amém." },
  { t: "Primeira palavra de louvor", e: "🌻", x: "Pai amado, obrigado por mais uma manhã. Que a minha primeira palavra seja de louvor e a minha última de gratidão. Abençoa a minha casa, o meu trabalho e as pessoas que eu vou encontrar. Faze de mim uma bênção hoje. Amém." },
  { t: "Hoje com fé", e: "✨", x: "Senhor, que este dia comece com fé, continue com esperança e termine com gratidão. Dá-me olhos para ver o teu cuidado nas pequenas coisas e coragem para as grandes. Eu confio o meu hoje a ti. Amém." },
  { t: "Graça para perdoar", e: "🕊️", x: "Senhor, neste novo dia dá-me a graça de perdoar quem me feriu e de pedir perdão a quem eu feri. Limpa o meu coração e faze-o morada do teu amor. Que eu caminhe leve, livre de mágoas, cheio da tua paz. Amém." },
  { t: "Abençoar os passos", e: "👣", x: "Pai, abençoa cada passo que eu der hoje. Que os meus pés caminhem por caminhos de justiça e os meus olhos vejam oportunidades de amor. Usa a minha vida como ferramenta do teu bem. Amém." },
  { t: "Sabedoria nos trabalhos", e: "💼", x: "Deus, ilumina o meu trabalho hoje. Que eu faça tudo com excelência, sem pressa e sem ansiedade. Abençoa os meus colegas e guia as minhas decisões. Que o fruto do meu esforço seja para a tua glória. Amém." },
  { t: "Luz nos pensamentos", e: "💡", x: "Senhor, guarda os meus pensamentos hoje. Afasta de mim os pensamentos de medo, dúvida e negatividade. Enche a minha mente com palavras de fé e esperança. Que eu pense como tu pensas e ame como tu amas. Amém." },
  { t: "Força para quem ama", e: "💪", x: "Pai, dá-me força para amar mesmo quando é difícil, perdoar mesmo quando dói e servir mesmo quando ninguém vê. Que o teu amor transborde da minha vida e alcance quem precisa. Amém." },
  { t: "Acolher os que chegam", e: "🤝", x: "Senhor, prepara o meu coração para acolher as pessoas que vou encontrar hoje. Que eu tenha palavras certas, olhos gentis e mãos generosas. Faze de mim um porto seguro para quem chega cansado. Amém." },
  { t: "Gratidão ao despertar", e: "🌅", x: "Pai, obrigado por este novo dia que começa. Antes de qualquer pressa, eu quero agradecer: pela vida, pela saúde, pelo teto e pelo pão. Que a gratidão seja a primeira música do meu coração hoje. Amém." },
  { t: "Entrega da manhã", e: "🤲", x: "Senhor, na primeira hora do dia eu te entrego tudo o que sou e tudo o que tenho. Toma o meu trabalho, os meus planos e as minhas preocupações. Eu confio: contigo, este dia será maior do que os meus medos. Amém." },
  { t: "Bênção para a família", e: "👨‍👩‍👧‍👦", x: "Deus, abençoa a minha família nesta manhã. Guarda cada pessoa que sai de casa, protege cada passo e traz todos de volta em paz. Que o nosso lar seja hoje morada do teu amor. Amém." },
  { t: "Passos guiados", e: "👣", x: "Espírito Santo, guia os meus passos de hoje. Onde eu deva falar, dá-me palavras; onde eu deva calar, dá-me sabedoria; onde eu deva agir, dá-me coragem. Que nenhum passo meu saia do teu caminho. Amém." },
  { t: "Coragem para começar", e: "☀️", x: "Senhor, dá-me coragem para começar este dia sem medo. Se vier dificuldade, lembra-me de que tu já estás adiante. Se vier cansaço, renova as minhas forças. Eu começo contigo e termino contigo. Amém." },
  { t: "Semente de bondade", e: "🌱", x: "Pai, que eu plante bondade hoje: um sorriso, uma palavra boa, um gesto de ajuda. Que as pequenas sementes deste dia floresçam em bênçãos para outras vidas. Faze de mim semeador do teu amor. Amém." },
  { t: "Alegria simples", e: "😊", x: "Senhor, ensina-me a encontrar alegria nas coisas simples desta manhã: o café, o sol, um abraço, um bom dia. Que eu não deixe passar despercebida nenhuma das tuas bênçãos pequenas. Amém." },
  { t: "Guarda dos pensamentos", e: "🛡️", x: "Deus, guarda a minha mente desde cedo. Que os primeiros pensamentos deste dia sejam de fé e não de medo, de esperança e não de ansiedade. Protege o meu coração e enche-o da tua paz. Amém." },
];

const REELS_NIGHT = [
  { t: "Obrigado pelo dia", e: "🌙", x: "Senhor, ao fim deste dia eu te agradeço por tudo o que vivi. Perdoa as minhas falhas, guarda o meu sono e vela por quem eu amo. Livra-me da ansiedade e faz-me descansar na certeza de que estás no controle. Amém." },
  { t: "Entrego o que passou", e: "⭐", x: "Pai, obrigado pelo dia que passou. Eu entrego em tuas mãos as preocupações, as vitórias e os sonhos que ainda virão. Faz-me dormir em paz e acordar com esperança. Amém." },
  { t: "Velai por esta noite", e: "🌃", x: "Senhor, vela por esta noite. Protege a minha casa, abençoa a minha família e acalma o meu coração. Que o teu silêncio me ensine a descansar e a tua presença me acompanhe até o amanhecer. Amém." },
  { t: "Fidelidade de mais um dia", e: "💛", x: "Deus, obrigado pela tua fidelidade de mais um dia. Perdoa as minhas palavras apressadas e os meus pensamentos distraídos. Concede-me um sono tranquilo e renova as minhas forças para o amanhã. Amém." },
  { t: "Tu és o meu refúgio", e: "🕊️", x: "Senhor, ao deitar-me eu lembro: tu és o meu refúgio. Guarda os meus sonhos, protege os meus passos e sustenta os que estão velando por mim. Em paz eu me deito e descanso seguro. Amém." },
  { t: "Amanhã virá com graça", e: "🌜", x: "Pai, antes de dormir eu te entrego tudo: as alegrias, os desafios e as pessoas que carrego no coração. Que a noite seja leve e o amanhã chegue com a tua graça. Amém." },
  { t: "Perdoar antes de dormir", e: "💛", x: "Senhor, antes de dormir eu te peço: perdoa a quem me magoou hoje e me livra de qualquer mágoa que eu guarde. Limpa o meu coração, como quem lava roupa branca. Que eu durma em paz e acorde perdoado. Amém." },
  { t: "Entregue aos sonhos", e: "🌌", x: "Pai, entrega os meus sonhos aos teus anjos. Guarda a minha mente dos pesadelos e preenche a minha noite com a tua paz. Que eu descanse com a certeza de que amanhã será um dia novo de graça. Amém." },
  { t: "Agradecendo o que vivi", e: "🌙", x: "Deus, obrigado por cada momento deste dia: pelas alegrias, pelas lições e pelas pessoas que cruzaram o meu caminho. Guarda tudo na tua memória e prepara o amanhã com o teu amor. Amém." },
  { t: "Silêncio sagrado", e: "🤫", x: "Senhor, neste silêncio da noite eu te escuto. Fala comigo no quieto do coração. Ensina-me a descansar sem medo, a dormir sem ansiedade e a confiar sem medida. Tu és o meu sono seguro. Amém." },
  { t: "Vigia pela minha família", e: "👨‍👩‍👧‍👦", x: "Pai, vela por cada pessoa da minha família esta noite. Protege os que dormem, acalma os que preocupam e guarda os que velam. Que a tua presença preencha cada quarto e cada coração. Amém." },
  { t: "O amanhã é teu", e: "🌅", x: "Senhor, eu não sei o que trará o amanhã, mas sei que tu já estás lá. Por isso durmo em paz, sabendo que os meus passos estão nas tuas mãos. Boa noite, meu Deus. Amém." },
  { t: "Exame do dia", e: "🔍", x: "Senhor, antes de dormir eu repasso o meu dia contigo. Onde eu acertei, obrigado; onde eu falhei, perdoa. Ensina-me a crescer de cada dia sem me condenar, porque o teu amor é maior que os meus erros. Amém." },
  { t: "Descanso dos cansados", e: "😴", x: "Pai, eu chego ao fim deste dia cansado, mas em paz. Tu conheces cada esforço e cada batalha silenciosa. Agora eu descanso: tu velas por mim, e o teu cuidado não dorme. Amém." },
  { t: "Confiar o futuro", e: "🌠", x: "Senhor, entrego a ti o amanhã antes mesmo de ele chegar. Os meus planos, os meus sonhos e as minhas dúvidas estão nas tuas mãos. Que eu durma leve, sabendo que o futuro é teu. Amém." },
  { t: "Perdão noturno", e: "🕯️", x: "Deus, se hoje eu feri alguém com palavras ou atitudes, perdoa-me e me dá coragem de consertar amanhã. E se alguém me feriu, cura a minha mágoa nesta noite. Eu quero dormir com o coração limpo. Amém." },
  { t: "Gratidão pelas pessoas", e: "💛", x: "Obrigado, Senhor, pelas pessoas que cruzaram o meu caminho hoje: as que me ajudaram, as que me ensinaram e até as que me desafiaram. Cada encontro foi uma oportunidade de amar. Abençoa todos eles. Amém." },
  { t: "Sono de criança", e: "🧸", x: "Senhor, faz o meu sono ser como o de uma criança: tranquilo, confiante e profundo. Tira do meu peito toda inquietação e me lembra de que sou cuidado por ti, do primeiro suspiro ao último. Amém." },
  { t: "Luz na escuridão", e: "✨", x: "Mesmo na escuridão do quarto, tu és a minha luz, Senhor. Se pensamentos difíceis vierem nesta noite, ilumina-os com a tua paz. Eu não temo, porque tu estás comigo. Amém." },
  { t: "Vigília dos anjos", e: "👼", x: "Anjo da Guarda, fica velando esta noite pela minha casa e pelos que amo. Afasta todo mal, guarda cada sono e apresenta a Deus as nossas orações. Que acordemos amanhã renovados. Amém." },
];

const REELS_VERSES = [
  { t: "O Senhor é o meu pastor", e: "🌿", x: "O Senhor é o meu pastor; nada me faltará. Ele me faz repousar em pastos verdejantes e me conduz junto às águas tranquilas.", ref: "Salmos 23:1-2", refSpoken: "Salmos, capítulo vinte e três, versículos um e dois." },
  { t: "Não temas, porque eu sou contigo", e: "🕊️", x: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, te ajudo e te sustento com a minha mão fiel.", ref: "Isaías 41:10", refSpoken: "Isaías, capítulo quarenta e um, versículo dez." },
  { t: "Entrega o teu caminho ao Senhor", e: "🌅", x: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", ref: "Salmos 37:5", refSpoken: "Salmos, capítulo trinta e sete, versículo cinco." },
  { t: "Tudo posso naquele que me fortalece", e: "💪", x: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13", refSpoken: "Filipenses, capítulo quatro, versículo treze." },
  { t: "Vinde a mim", e: "🤍", x: "Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.", ref: "Mateus 11:28", refSpoken: "Mateus, capítulo onze, versículo vinte e oito." },
  { t: "A alegria do Senhor é a vossa força", e: "😊", x: "A alegria do Senhor é a vossa força.", ref: "Neemias 8:10", refSpoken: "Neemias, capítulo oito, versículo dez." },
  { t: "Pedi, buscai, batei", e: "🙏", x: "Pedi, e dar-se-vos-á; buscai, e encontrareis; batei, e abrir-se-vos-á.", ref: "Mateus 7:7", refSpoken: "Mateus, capítulo sete, versículo sete." },
  { t: "Lâmpada para os meus pés", e: "🕯️", x: "Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.", ref: "Salmos 119:105", refSpoken: "Salmos, capítulo cento e dezenove, versículo cento e cinco." },
  { t: "Esforça-te e tem bom ânimo", e: "🏔️", x: "Esforça-te e tem bom ânimo; não pasmes, nem te espantes, porque o Senhor, teu Deus, é contigo por onde quer que andares.", ref: "Josué 1:9", refSpoken: "Josué, capítulo um, versículo nove." },
  { t: "Em paz me deito", e: "🌙", x: "Em paz me deito e logo pego no sono, porque só tu, Senhor, me fazes repousar seguro.", ref: "Salmos 4:8", refSpoken: "Salmos, capítulo quatro, versículo oito." },
  { t: "A alegria vem ao amanhecer", e: "🌄", x: "O choro pode durar uma noite, mas a alegria vem ao amanhecer.", ref: "Salmos 30:5", refSpoken: "Salmos, capítulo trinta, versículo cinco." },
  { t: "Buscai primeiro o reino de Deus", e: "👑", x: "Buscai primeiro o reino de Deus e a sua justiça, e todas as demais coisas vos serão acrescentadas.", ref: "Mateus 6:33", refSpoken: "Mateus, capítulo seis, versículo trinta e três." },
  { t: "O Senhor é a minha luz", e: "🕯️", x: "O Senhor é a minha luz e a minha salvação; a quem temerei?", ref: "Salmos 27:1", refSpoken: "Salmos, capítulo vinte e sete, versículo um." },
  { t: "Deus é a nossa morada", e: "🏠", x: "Morada do Senhor é o refúgio do Altíssimo, que habita à sombra do Onipotente.", ref: "Salmos 91:1", refSpoken: "Salmos, capítulo noventa e um, versículo um." },
  { t: "O meu Deus suprirá", e: "✨", x: "E o meu Deus suprirá todas as vossas necessidades segundo a sua riqueza, em glória, em Cristo Jesus.", ref: "Filipenses 4:19", refSpoken: "Filipenses, capítulo quatro, versículo dezenove." },
  { t: "Cristo é a minha paz", e: "🕊️", x: "Porque ele é a nossa paz.", ref: "Efésios 2:14", refSpoken: "Efésios, capítulo dois, versículo catorze." },
  { t: "Alegria no Senhor", e: "😊", x: "Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos.", ref: "Filipenses 4:4", refSpoken: "Filipenses, capítulo quatro, versículo quatro." },
  { t: "Fonte de água viva", e: "💧", x: "Se alguém tem sede, venha a mim e beba. Quem crê em mim, rios de água viva correrão do seu interior.", ref: "João 7:37-38", refSpoken: "João, capítulo sete, versículos trinta e sete e trinta e oito." },
  { t: "A mão do Senhor", e: "🤲", x: "A mão do Senhor fez tudo isto.", ref: "Salmos 109:27", refSpoken: "Salmos, capítulo cento e nove, versículo vinte e sete." },
  { t: "Ele me sustenta", e: "💪", x: "O Senhor é o sustento da minha vida; de quem terei medo?", ref: "Salmos 27:1", refSpoken: "Salmos, capítulo vinte e sete, versículo um." },
  { t: "O amor não falha", e: "❤️", x: "O amor é paciente, o amor é bondoso; não inveja, não se vangloria, não se orgulha. O amor nunca falha.", ref: "1 Coríntios 13:4,8", refSpoken: "Primeira Coríntios, capítulo treze, versículos quatro e oito." },
  { t: "Deus ouve a oração", e: "🙏", x: "Clamai a mim, e responderei; anunciar-vos-ei coisas grandes e firmes, que não sabiais.", ref: "Jeremias 33:3", refSpoken: "Jeremias, capítulo trinta e três, versículo três." },
  { t: "O socorro vem do Senhor", e: "⛰️", x: "Elevo os meus olhos para os montes: de onde me virá o socorro? O meu socorro vem do Senhor, que fez o céu e a terra.", ref: "Salmos 121:1-2", refSpoken: "Salmos, capítulo cento e vinte e um, versículos um e dois." },
  { t: "Tu és meu", e: "🤍", x: "Não temas, porque eu te resgatei; chamei-te pelo teu nome; tu és meu.", ref: "Isaías 43:1", refSpoken: "Isaías, capítulo quarenta e três, versículo um." },
  { t: "Misericórdias novas", e: "🌅", x: "As misericórdias do Senhor são a causa de não sermos consumidos; renovam-se cada manhã. Grande é a tua fidelidade.", ref: "Lamentações 3:22-23", refSpoken: "Lamentações, capítulo três, versículos vinte e dois e vinte e três." },
  { t: "Tende bom ânimo", e: "🕊️", x: "No mundo tereis aflições, mas tende bom ânimo: eu venci o mundo.", ref: "João 16:33", refSpoken: "João, capítulo dezesseis, versículo trinta e três." },
  { t: "Aquietai-vos", e: "🤫", x: "Aquietai-vos e sabei que eu sou Deus.", ref: "Salmos 46:10", refSpoken: "Salmos, capítulo quarenta e seis, versículo dez." },
  { t: "Ele endireita as veredas", e: "🛤️", x: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento; reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.", ref: "Provérbios 3:5-6", refSpoken: "Provérbios, capítulo três, versículos cinco e seis." },
  { t: "Deus no meio de ti", e: "💛", x: "O Senhor, teu Deus, está no meio de ti, poderoso para salvar; ele se deleitará em ti com alegria.", ref: "Sofonias 3:17", refSpoken: "Sofonias, capítulo três, versículo dezessete." },
  { t: "Tudo contribui para o bem", e: "✨", x: "Sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.", ref: "Romanos 8:28", refSpoken: "Romanos, capítulo oito, versículo vinte e oito." },
];

const REELS_PARABLES = [
  { t: "O filho pródigo", e: "🏡", x: "Um pai tinha dois filhos. O mais novo pediu sua herança, partiu e desperdiçou tudo. Quando tocou o fundo do poço, lembrou-se do pai e decidiu voltar. De longe, o pai correu ao seu encontro, abraçou-o e fez festa. Assim é o coração de Deus: mesmo quando erramos, ele nos espera de braços abertos para recomeçar." },
  { t: "O bom samaritano", e: "🤝", x: "Um homem foi ferido à beira do caminho. Religiosos passaram e não o ajudaram. Mas um samaritano, o último que se esperava, parou, cuidou das suas feridas e pagou a sua estadia. A lição é clara: o próximo é aquele que se aproxima e ajuda, sem olhar de onde veio." },
  { t: "A ovelha perdida", e: "🐑", x: "Um pastor tinha cem ovelhas. Quando uma se perdeu, deixou as noventa e nove e foi procurar a que faltava. Ao encontrá-la, colocou-a nos ombros com alegria e celebrou. Deus faz o mesmo por cada um de nós: cada alma tem um valor imenso, e nenhuma é esquecida." },
  { t: "O semeador", e: "🌱", x: "Um semeador lançou sementes. Umas caíram no caminho e foram pisadas; outras, entre pedras, secaram; outras, entre espinhos, foram sufocadas. Mas as que caíram em terra boa deram frutos abundantes. A semente é a palavra de Deus: o coração aberto é a terra boa onde tudo floresce." },
  { t: "A pérola de grande valor", e: "💎", x: "Um mercador procurava belas pérolas. Quando encontrou uma de valor imenso, vendeu tudo o que tinha para comprá-la. O reino de Deus é assim: quem o descobre verdadeiramente, entrega tudo com alegria, porque nada se compara a essa riqueza." },
  { t: "O grão de mostarda", e: "🌳", x: "O reino de Deus é como um grão de mostarda: a menor de todas as sementes. Mas, plantado, cresce e se torna grande, e as aves do céu fazem ninhos à sua sombra. Uma fé pequena, bem plantada no coração, cresce além de toda medida." },
  { t: "O servo implacável", e: "⚖️", x: "Um servo devia uma dívida enorme e foi perdoado pelo seu senhor. Mas, ao sair, cobrou do seu companheiro uma dívida pequena e não teve piedade. O senhor, sabendo disso, o repreendeu. Quem muito recebeu de Deus, deve muito perdoar." },
  { t: "O fariseu e o publicano", e: "🙏", x: "Dois homens subiram ao templo para orar. O fariseu se gabava de ser justo. O publicano, humilhado, apenas dizia: tem piedade de mim, pecador. E Jesus ensinou que foi este quem voltou para casa justificado, porque quem se humilha será exaltado." },
  { t: "A moeda perdida", e: "🪙", x: "Uma mulher tinha dez moedas. Perdeu uma, acendeu a lâmpada, varreu a casa e procurou com cuidado até encontrá-la. Depois reuniu as amigas para celebrar. Há alegria no céu por uma única pessoa que se encontra com Deus." },
  { t: "O tesouro escondido", e: "🗝️", x: "Um homem encontrou um tesouro escondido num campo. Cheio de alegria, vendeu tudo o que tinha para comprar aquele campo. Quando encontramos o amor de Deus, entendemos: vale a pena trocar o que somos por tudo o que podemos ser." },
  { t: "Os talentos", e: "💰", x: "Um senhor deu talents aos seus servos: cinco, dois e um. O que recebeu cinco dobrou; o que recebeu dois dobrou; mas o que recebeu um enterrou e perdeu tudo. A lição é clara: Deus espera que usemos os dons que nos deu, não que os escondamos por medo." },
  { t: "As virgens prudentes", e: "🪔", x: "Dez virgens esperavam o noivo. Cinco levaram óleo extra; cinco não. Quando o noivo tardou, as imprudentes ficaram sem luz. A moral é: esteja sempre preparado, porque o tempo de Deus pode ser diferente do nosso." },
  { t: "A colheita grande", e: "🌾", x: "Jesus olhou para a multidão e teve compaixão, porque eram como ovelhas sem pastor. Disse aos discípulos: a colheita é grande, mas os obreiros são poucos. Ore para que mande operários para a sua colheita." },
  { t: "Os dois construtores", e: "🏗️", x: "Um construiu sua casa sobre a rocha; outro, sobre a areia. Quando veio a chuva, a casa sobre a rocha permaneceu; a casa sobre a areia desabou. Quem ouve a palavra de Deus e pratica é como o homem sábio que construiu sobre a rocha." },
  { t: "O bom pastor", e: "🐑", x: "O bom pastor dá a sua vida pelas ovelhas. Quando o lobo vem, o mercenário foge porque não se importa com as ovelhas. Mas o bom pastor conhece cada uma pelo nome e conduz a um lugar seguro." },
  { t: "Os trabalhadores da vinha", e: "🍇", x: "Um dono de vinha contratou trabalhadores em diferentes horas do dia. Ao final, pagou a todos por igual. Os primeiros reclamaram, mas ele respondeu: não tenho direito de fazer o que quero com o que é meu? A generosidade de Deus não segue os nossos cálculos: ele dá por amor, não por merecimento." },
  { t: "O banquete de casamento", e: "👑", x: "Um rei preparou o banquete de casamento do seu filho e chamou os convidados. Mas ninguém quis ir. Então o rei mandou seus servos chamar todos que encontrassem pela rua, bons e maus, e a festa ficou cheia. Deus chama a todos para a festa do seu amor: ninguém está de fora se não quiser." },
  { t: "O juiz e a viúva", e: "⚖️", x: "Numa cidade havia um juiz que não temia a Deus nem respeitava pessoas. Uma viúva pobre insistia com ele: faze-me justiça! Cansado, o juiz atendeu só para ela parar. Jesus ensinou: se até o juiz injusto atendeu, quanto mais Deus atenderá os seus que clamam a ele dia e noite. Ore sempre, sem desanimar." },
  { t: "A figueira cuidada", e: "🌳", x: "Um homem tinha uma figueira que dava frutos há três anos e decidiu cortá-la. Mas o jardineiro pediu: deixe-a mais um ano; eu vou adubar e cuidar, talvez ainda dê fruto. Deus é assim conosco: paciente, cuidando, acreditando no nosso crescimento mesmo quando ninguém mais acredita." },
  { t: "O amigo importuno", e: "🚪", x: "Um amigo chegou à meia-noite pedindo pão. O vizinho disse: não incomode, estamos dormindo. Mas, pela insistência dele, levantou-se e deu tudo o que precisava. Jesus concluiu: pedi, buscai, batei. A oração insistente abre portas que o desânimo mantinha fechadas." },
];

const REELS_FREE_PRAYERS = [
  { t: "Com o coração aberto", e: "🙏", x: "Senhor, eu venho diante de ti com o coração aberto. Sei que tu me conheces melhor do que eu mesmo. Acolhe as minhas alegrias e as minhas dores, orienta as minhas escolhas e dá-me a paz que o mundo não pode dar. Eu confio em ti. Amém." },
  { t: "Refúgio e fortaleza", e: "🏔️", x: "Deus, tu és o meu refúgio e a minha fortaleza. Quando o medo apertar, lembra-me da tua presença. Quando a dúvida chegar, renova a minha fé. Guia os meus passos e faz-me instrumento do teu amor. Amém." },
  { t: "Nunca desistir de mim", e: "💛", x: "Pai, obrigado por nunca desistires de mim. Ajuda-me a enxergar as bênçãos mesmo nos dias difíceis, a perdoar como sou perdoado e a amar como sou amado. Que a tua luz brilhe através da minha vida. Amém." },
  { t: "O amanhã está seguro", e: "✨", x: "Senhor, eu não sei tudo o que o amanhã reserva, mas sei quem caminha comigo. Por isso eu descanso: o meu hoje e o meu amanhã estão seguros em tuas mãos. Dá-me fé para seguir e paz para esperar. Amém." },
  { t: "Instrumento de paz", e: "🕊️", x: "Senhor, faze de mim um instrumento da tua paz. Onde houver tristeza, que eu leve alegria; onde houver dúvida, que eu leve fé; onde houver desespero, que eu leve esperança. Porque é dando que se recebe, e amando que se encontra o amor. Amém." },
  { t: "Fé que move montanhas", e: "🏔️", x: "Senhor, dá-me uma fé que move montanhas. Uma fé que não duvida das tuas promessas, que não se rende diante dos obstáculos e que não desiste quando o caminho é longo. Que a minha fé seja maior do que os meus medos. Amém." },
  { t: "Luz no escuro", e: "🔦", x: "Deus, quando o escuro parecer vencer, lembra-me de que tu és a luz que não se apaga. Ilumina o meu caminho, acalma o meu coração e mostra-me o próximo passo. Eu confio na tua luz. Amém." },
  { t: "Um coração grato", e: "💛", x: "Pai, faze do meu coração um altar de gratidão. Que eu agradeça não só pelas grandes bênçãos, mas pelas pequenas coisas do dia a dia. Transforma a minha queixa em louvor e a minha ansiedade em paz. Amém." },
  { t: "Paz no tumulto", e: "🌊", x: "Senhor, mesmo quando o mundo grita, faz-me ouvir o teu sussurro. Dá-me paz no tumulto, calma na tempestade e serenidade no caos. Tu és o Deus que acalma os mares e os corações. Amém." },
  { t: "Deus é suficiente", e: "✝️", x: "Deus, tu és suficiente. Não preciso de mais nada senão da tua presença. Enche o que está vazio, cura o que está ferido e fortalece o que está fraco. Em ti, tudo se restaura. Amém." },
  { t: "Renova o meu espírito", e: "🔄", x: "Senhor, renova o meu espírito neste dia. Onde houve desânimo, planta esperança; onde houve dureza, planta mansidão; onde houve cansaço, planta descanso. Faze de mim uma criatura nova. Amém." },
  { t: "Família em tuas mãos", e: "👨‍👩‍👧‍👦", x: "Pai, coloco a minha família em tuas mãos. Cura as feridas que ninguém vê, une o que andou distante e abençoa cada mesa, cada quarto e cada coração da nossa casa. Que ninguém da minha família se perca do teu amor. Amém." },
  { t: "Cura interior", e: "💗", x: "Jesus, tu conheces as feridas que eu escondo por trás de um sorriso. Toca agora o que dói dentro de mim. Cura memórias, acalma medos e me ensina a me perdoar também. Eu quero ser livre para amar de novo. Amém." },
  { t: "Gratidão pelo simples", e: "🍞", x: "Senhor, obrigado pelo pão de cada dia, pela água, pelo trabalho e pelo sono em paz. Que eu nunca me acostume com as bênçãos simples nem deixe de agradecer por elas. Um coração grato é o teu templo favorito. Amém." },
  { t: "Coragem para mudar", e: "🌱", x: "Deus, dá-me coragem para mudar o que precisa mudar em mim. Não deixes que eu me acomode naquilo que me faz mal. Ajuda-me a dar o primeiro passo, mesmo pequeno, porque contigo todo começo é semente de vitória. Amém." },
  { t: "Presença em cada hora", e: "⏰", x: "Senhor, caminha comigo em cada hora deste dia: no despertar, no trabalho, nas conversas e no descanso. Que eu não faça nada sozinho, porque sem ti nada sou, mas contigo tudo é possível. Amém." },
  { t: "Paz para decidir", e: "🧭", x: "Espírito Santo, ilumina as minhas decisões. Onde há dois caminhos, mostra-me o teu; onde há dúvida, dá-me paz; onde há escolha difícil, dá-me sabedoria. Que a minha decisão de hoje seja bênção no meu amanhã. Amém." },
  { t: "Bênção para quem reza", e: "🙌", x: "Deus, abençoa quem está rezando agora esta oração. Abre portas, cura feridas, devolve sonhos e enche de paz o coração que te busca. Que esta pessoa sinta hoje, de forma real, o quanto és amor. Amém." },
];

const REELS_TESTIMONIES = [
  { t: "Eu era perdido, fui encontrado", e: "✨", x: "Eu andava sem rumo, procurando paz em tudo e em todos, e não encontrava. Até que um dia me ajoelhei e disse: Senhor, se tu existes, me encontra. E ele encontrou. Hoje eu sei: ninguém busca a Deus sem antes ser encontrado por ele." },
  { t: "Deus provou no deserto", e: "🏜️", x: "Passei por um deserto que ninguém via: perdas, dívidas, noites de choro. Foi ali, quando tudo faltava, que Deus mais se aproximou. O deserto não foi castigo; foi o lugar onde aprendi que ele basta. Se você está no deserto, não desista: é ali que o milagre começa." },
  { t: "A porta que Deus fechou", e: "🚪", x: "Eu queria tanto aquela oportunidade. Rezei, lutei, e a porta se fechou. Chorei por semanas. Mas Deus tinha outra porta escondida, melhor do que eu sonhava. Hoje agradeço pelo não que recebi. Confia: quando Deus fecha, é porque está guardando algo maior para ti." },
  { t: "Curado pela fé", e: "💗", x: "O diagnóstico tirou o chão dos meus pés, mas a oração da minha família segurou o meu coração. Cada tratamento, eu levava nas mãos de Deus. Hoje estou aqui, inteiro, contando que ele sustentou a minha vida. A fé não substitui o remédio; ela caminha junto com a cura." },
  { t: "A oração respondida", e: "🙏", x: "Por anos eu pedi a mesma coisa na mesma oração. Quase desisti. Mas um dia, do nada, a resposta chegou: completa, no tempo certo, do jeito que eu nunca imaginaria. Deus não esquece nenhum pedido seu. Continua pedindo: a resposta já está a caminho." },
  { t: "Do medo à missão", e: "🔥", x: "Eu vivia preso ao medo: medo de errar, de falar, de tentar. Até que entendi que Deus não me deu espírito de temor, mas de força e amor. Comecei pequeno, tremendo, mas comecei. Hoje sirvo onde antes eu tinha pavor. O teu medo também vai virar missão." },
];

const REELS_REFLECTIONS = [
  { t: "O que realmente importa", e: "🤔", x: "No fim da vida, ninguém vai lembrar das pressas, das brigas ou dos bens acumulados. Vai lembrar dos abraços, das manhãs em paz e do amor dado. Que tal começar a viver hoje aquilo que realmente vai importar amanhã?" },
  { t: "Tempo é vida", e: "⏳", x: "Cada dia que passa não volta mais. Não adie o perdão, a ligação para quem ama, o obrigado e o eu te amo. O tempo é o único tesouro que gastamos sem poder comprar de volta. Use-o com amor." },
  { t: "O peso do perdão", e: "🎈", x: "Guardar mágoa é carregar uma pedra dentro do peito e esperar que o outro sinta o peso. Perdoar não é liberar quem feriu; é libertar a si mesmo. Solta essa pedra hoje: o teu coração precisa de espaço leve para respirar." },
  { t: "Raízes e frutos", e: "🌳", x: "Ninguém vê as raízes de uma árvore, mas são elas que sustentam os frutos. Sua vida com Deus é assim: a oração escondida, a fé silenciosa e o serviço discreto são as raízes. Os frutos vão aparecer no tempo certo." },
  { t: "Silêncio que ensina", e: "🤫", x: "Vivemos cercados de barulho: notificações, pressa, vozes por todos os lados. Mas Deus costuma falar baixo, no silêncio. Reserve cinco minutos do seu dia para ficar quieto diante dele. Você vai descobrir que o céu conversa com quem escuta." },
  { t: "Espelho da alma", e: "🪞", x: "Antes de julgar o outro, olhe no espelho: também erramos, também precisamos de paciência e perdão. A compaixão começa quando lembramos que somos iguais na fraqueza e irmãos na busca por Deus." },
];

const REELS_COMFORT = [
  { t: "Para quem está triste", e: "💙", x: "Se hoje o peito está apertado, saiba: você não precisa fingir que está bem. Deus acolhe até os seus silêncios. Chora se precisar, mas não desiste. A tristeza é visita; o amor de Deus é morada. Isso vai passar." },
  { t: "Deus vê suas lágrimas", e: "😢", x: "Existe uma lágrima que só você conhece, chorada no escuro, sem testemunhas. Pois bem: Deus viu cada gota e guardou cada uma delas. Nada do que você sofreu será desperdiçado. Ele transforma lágrimas em sementes de alegria." },
  { t: "Você não está sozinho", e: "🤝", x: "Talvez esteja lendo isso sentindo que ninguém entende a sua dor. Mas há Alguém que conhece cada detalhe e nunca te deixou um segundo. Estende a mão: Deus está mais perto agora do que nunca. Peça ajuda, converse com ele agora." },
  { t: "Depois da tempestade", e: "🌈", x: "A tempestade que você enfrenta hoje não é eterna. O vento vai parar, o céu vai abrir e você vai ver cores que a dor escondia. Segura firme: depois da chuva sempre vem o arco-íris da promessa de Deus." },
  { t: "Descanse em Deus", e: "🛏️", x: "Você tem lutado tanto que esqueceu de descansar. Hoje, permita-se parar. Coloque nos braços de Deus aquilo que não consegue resolver. Descansar também é um ato de fé: significa confiar que ele cuida enquanto você dorme." },
  { t: "A ferida que sara", e: "🩹", x: "Toda ferida tocada pelo amor de Deus vira cicatriz, e toda cicatriz vira história de superação. Um dia você vai olhar para trás e ver que a dor que quase te venceu foi o lugar onde a graça mais brilhou." },
];

const REELS_MIRACLES = [
  { t: "Deus ainda faz milagres", e: "✨", x: "O Deus que abriu o mar, curou leprosos e ressuscitou mortos é o mesmo de hoje. Ele não mudou, não envelheceu e não perdeu poder. O milagre que você espera pode estar a um passo de fé de distância. Creia: Deus ainda faz milagres." },
  { t: "O pão de cada dia", e: "🍞", x: "Quantas vezes o alimento chegou na hora certa? Quantas vezes a solução apareceu no último minuto? Talvez você esteja tão acostumado aos milagres pequenos que deixou de percebê-los. O pão de cada dia é milagre diário disfarçado de rotina." },
  { t: "Água no deserto", e: "💧", x: "Israel teve sede no deserto, e Deus fez brotar água da rocha. Qual é a sua sede hoje? De emprego, de cura, de paz? A rocha continua a mesma: Cristo. Bate nele com a oração, e a água vai jorrar no lugar mais seco da sua vida." },
  { t: "Ressurreição de sonhos", e: "🌱", x: "Aquele sonho que você enterrou por achar impossível: Deus ainda pode ressuscitá-lo. Ossos secos voltaram a viver diante do profeta; o seu sonho também pode. Profetize de novo, ore de novo, plante de novo. O tempo de Deus ressuscita o que parecia morto." },
  { t: "O mar se abriu", e: "🌊", x: "De frente, o mar; atrás, o exército. Israel não tinha para onde correr, e foi justamente ali que Deus agiu. Às vezes o impossível é o cenário escolhido por Deus para mostrar o seu poder. Se hoje não há saída visível, prepare-se: o mar vai se abrir." },
  { t: "Milagre disfarçado de tempo", e: "⏰", x: "Nem todo milagre é instantâneo. Alguns chegam devagar, como a cura que vem dia após dia, a reconciliação que se constrói, a prosperidade que cresce. Não despreze o processo: o tempo nas mãos de Deus é milagre acontecendo em câmera lenta." },
];

/* =========================================================
   Carrosséis — modelos de alta conversão para o nicho de fé
   ========================================================= */

/* ganchos de capa que param o scroll */
const CAROUSEL_HOOKS = [
  "Pare! Deus tem uma palavra para você hoje",
  "Não deslize rápido — leia até o fim",
  "Se você está vendo isso, é porque Deus quer te falar",
  "Esta mensagem chegou até você por um motivo",
  "Alguém precisa ler isso hoje — talvez seja você",
  "Deus me mandou lembrar você disso",
  "Guarde estas palavras no seu coração",
  "A resposta da sua oração começa aqui",
];

/* mensagens curtas do carrossel "Escolha um número" (rei do engajamento) */
const CAROUSEL_QUIZ_MESSAGES = [
  { e: "🕊️", x: "A paz de Deus vai guardar o seu coração hoje. O que te preocupa está nas mãos dele." },
  { e: "🌅", x: "Um novo começo está chegando na sua vida. O que ficou para trás não define o que vem pela frente." },
  { e: "💛", x: "Você é mais amado do que imagina. Deus cuida dos detalhes da sua vida mesmo quando você não percebe." },
  { e: "✨", x: "A resposta que você espera já está a caminho. Aguente firme mais um pouco: a promessa se cumpre." },
  { e: "🙏", x: "Deus viu cada lágrima secreta. Nenhuma delas foi em vão — a alegria está prestes a visitar você." },
  { e: "🌱", x: "Este é o seu tempo de florescer. O que era deserto vai virar jardim nas mãos do Pai." },
  { e: "🛡️", x: "Não tenha medo: você está protegido. Nada alcança quem vive debaixo das asas do Altíssimo." },
  { e: "💫", x: "Aquela porta fechada estava te protegendo. Deus preparou algo maior do que o seu pedido." },
  { e: "🔥", x: "Reacenda a fé: o mesmo Deus que agiu na sua vida antes vai agir de novo. Confia e segue." },
  { e: "🌊", x: "Entrega a ansiedade: o mar agitado vai se acalmar quando você deixar Deus ser Deus na sua vida." },
  { e: "👑", x: "Você é filho(a) do Rei. Levanta a cabeça: a tua história tem valor eterno e um propósito lindo." },
  { e: "🕯️", x: "Mesmo na noite mais escura, uma vela acesa muda tudo. A tua luz não se apagou — ela está apenas começando." },
];

/* decks de lista numerada ("X coisas que...") — 10 itens cada */
const CAROUSEL_LIST_DECKS = [
  {
    t: "7 promessas de Deus para a sua vida",
    e: "✨",
    hook: "Promessas que sustentam a alma — salve para reler",
    items: [
      "Eu nunca te deixarei nem te abandonarei.",
      "Os teus planos são de paz e não de mal.",
      "A minha força basta para os seus dias fracos.",
      "Vou renovar as tuas forças como a da águia.",
      "Nenhuma arma contra ti prosperará.",
      "Tudo contribui para o bem de quem me ama.",
      "A tua alegria ninguém tira de você.",
      "Eu serei o teu refúgio na tempestade.",
      "O que pedires com fé, recebereis.",
      "Guardarei a tua alma de todo o mal.",
    ],
  },
  {
    t: "Versículos para a ansiedade",
    e: "💛",
    hook: "Para o coração ansioso — deslize e respire",
    items: [
      "Lança sobre o Senhor a tua ansiedade, e ele te susterá.",
      "Não andeis ansiosos com coisa alguma; entregue tudo em oração.",
      "Aquietai-vos e sabei que eu sou Deus.",
      "Em paz me deito, porque só tu me fazes repousar seguro.",
      "Deixo-vos a paz, a minha paz vos dou.",
      "Não temas, porque eu sou contigo.",
      "O Senhor é o meu pastor: nada me faltará.",
      "Confia no Senhor de todo o teu coração.",
      "A paz de Deus guardará o vosso coração.",
      "Venham a mim os cansados, e eu vos aliviarei.",
    ],
  },
  {
    t: "Motivos para agradecer a Deus hoje",
    e: "🙏",
    hook: "A gratidão multiplica as bênçãos — conte comigo",
    items: [
      "Pelo dom da vida e por mais um dia de recomeço.",
      "Pela saúde, mesmo que ela precise de cuidados.",
      "Pela família que torce por você em silêncio.",
      "Pelo pão de cada dia que nunca faltou.",
      "Pelos amigos que viram irmãos no caminho.",
      "Pelas batalhas vencidas que você nem percebeu.",
      "Pelo perdão que nos ensina a recomeçar.",
      "Pela natureza que prega louvor todos os dias.",
      "Pela esperança que se renova a cada manhã.",
      "Porque o amor de Deus nunca falha.",
    ],
  },
  {
    t: "Verdades de Deus sobre você",
    e: "💫",
    hook: "Declare isto sobre a sua vida hoje",
    items: [
      "Você foi criado de propósito, para um propósito.",
      "Você é amado antes de merecer.",
      "Você é perdoado: o passado não te define.",
      "Você é mais forte do que a sua luta de hoje.",
      "Você nunca caminha sozinho.",
      "Você foi escolhido para esta geração.",
      "Você tem dons que o mundo precisa conhecer.",
      "Você é obra das mãos de Deus: nada de errado aqui.",
      "Você é herdeiro de promessas eternas.",
      "Você é luz — e a escuridão não vence a luz.",
    ],
  },
  {
    t: "Bênçãos para declarar sobre a sua semana",
    e: "🌅",
    hook: "Declaração de fé — comente AMÉM para receber",
    items: [
      "Esta semana eu ando pela paz, não pela pressa.",
      "As minhas mãos serão abençoadas no trabalho.",
      "A minha casa é morada de amor e proteção.",
      "Nenhum mal vai me alcançar nesta jornada.",
      "Eu semeio bondade e colho oportunidades.",
      "A minha família está guardada pelo Altíssimo.",
      "Onde eu pisar, deixo um rastro de esperança.",
      "A minha saúde se fortalece a cada dia.",
      "Eu perdoo rápido e carrego leve.",
      "O amor de Deus me cerca de manhã à noite.",
    ],
  },
];

/* linhas de CTA para o slide final */
const CAROUSEL_CTA_LINES = [
  ["🙏 Comente AMÉM", "para declarar essa palavra"],
  ["📌 Salve este post", "para reler quando precisar"],
  ["✨ Compartilhe", "com alguém que precisa ouvir isso"],
  ["💛 Siga @alvoradadoceu", "para receber fé todos os dias"],
];

const REELS_CONTENT_BY_TYPE = {
  "oracao-manha": REELS_MORNING,
  "oracao-noite": REELS_NIGHT,
  versiculo: REELS_VERSES,
  parabola: REELS_PARABLES,
  livre: REELS_FREE_PRAYERS,
  testemunho: REELS_TESTIMONIES,
  reflexao: REELS_REFLECTIONS,
  consolo: REELS_COMFORT,
  milagre: REELS_MIRACLES,
};

const REELS_USED_KEY = "alvorada_reels_used_v1";

function reelsGetUsed() {
  try { return JSON.parse(localStorage.getItem(REELS_USED_KEY) || "[]"); } catch (e) { return []; }
}

function reelsMarkUsed(title) {
  const used = reelsGetUsed();
  if (!used.includes(title)) {
    used.push(title);
    try { localStorage.setItem(REELS_USED_KEY, JSON.stringify(used)); } catch (e) {}
  }
}

function reelsClearUsed() {
  try { localStorage.removeItem(REELS_USED_KEY); } catch (e) {}
}

function reelsContentForType(typeId) {
  const pool = REELS_CONTENT_BY_TYPE[typeId] || REELS_FREE_PRAYERS;
  const used = reelsGetUsed();
  const available = pool.filter((c) => !used.includes(c.t));
  let pick;
  if (available.length > 0) {
    pick = randomItem(available);
  } else {
    pick = randomItem(pool);
    if (typeof showToast === "function") showToast("Todo o conteúdo deste tipo já foi usado. Reiniciando ciclo.", "warn");
    reelsClearUsed();
  }
  reelsMarkUsed(pick.t);
  return pick;
}

function reelsTypeById(typeId) {
  return REELS_TYPES.find((t) => t.id === typeId) || REELS_TYPES[0];
}

function reelsHashtags(typeId, content) {
  const type = reelsTypeById(typeId);
  const set = REELS_HASHTAGS_BASE.slice();
  set.push.apply(set, type.hashtags);
  if (content && content.tags) set.push.apply(set, content.tags);
  return Array.from(new Set(set)).slice(0, 18);
}

function reelsBuildCaption(content, type) {
  const hook = content.h || type.hook || reelsTypeById(type.id).hook;
  const ref = content.ref ? " " + content.ref : "";
  const lines = [
    (content.e || type.emoji) + " " + hook,
    "",
    content.x + ref,
    "",
    "Comente " + type.cta + " se essa mensagem tocou seu coração 🙏",
    "Salve para ouvir quando precisar 💛",
    "Compartilhe com alguém que precisa hoje ✨",
  ];
  lines.push("");
  lines.push(reelsHashtags(type.id, content).join(" "));
  return lines.join("\n");
}

function reelsBuildImagePrompt(theme, style) {
  return (
    "breathtaking ultra-high-quality spiritual artwork, absolutely no text, no letters, no words, no watermark, no signature, " +
    theme.scene +
    ", " +
    style.prompt +
    ", majestic atmosphere, luminous divine radiance, exquisite detail, perfect balanced composition, professional color grading, cinematic depth of field, sharp crisp focus, vibrant rich colors, masterpiece, 8k, award winning, high quality art"
  );
}
