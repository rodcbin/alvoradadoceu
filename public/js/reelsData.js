/* =========================================================
   Alvorada do Céu — Reels (9:16)
   Banco de frases curtas, orações e versículos virais
   ========================================================= */

const REELS_CATEGORIES = [
  { id: "oracao", label: "Orações", emoji: "🙏" },
  { id: "versiculo", label: "Versículos", emoji: "📖" },
  { id: "afirmacao", label: "Afirmações", emoji: "✨" },
  { id: "reflexao", label: "Reflexões", emoji: "💭" },
  { id: "promessa", label: "Promessas", emoji: "🕊️" },
  { id: "aviso", label: "Avisos Divinos", emoji: "🔔" },
];

const REELS_PHRASES = {
  oracao: [
    { text: "Senhor, guarda a minha família\nem teu sangue poderoso.", tag: "Proteção" },
    { text: "Pai, eu retenho todas as bênçãos\nque tens para mim.\nNada do bem se perde.", tag: "Retenção" },
    { text: "Espírito Santo,\nlevanta o escudo de fé\nsobre a minha vida.", tag: "Escudo" },
    { text: "Deus, coloca teus anjos\nao redor da minha casa.\nQue nenhum mal nos alcance.", tag: "Anjos" },
    { text: "Senhor,\nfaz brotar as tuas águas vivas\nsobre a minha vida.\nLava todo mal, renova toda esperança.", tag: "Água Viva" },
    { text: "Deus,\nfecha todas as portas\nque não foste tu que abriste.\nE abre as que o inimigo quer trancar.", tag: "Portões" },
    { text: "Pai, eu declaro:\nnenhuma arma formada contra mim\nvai prosperar.\nEm nome de Jesus, estou seguro.", tag: "Declaração" },
    { text: "Senhor,\nusa as tuas mãos poderosas\npara me guiar e me proteger.\nQuando o medo vier, lembra-me\nde que tu estás comigo.", tag: "Mãos" },
    { text: "Deus,\npeço a tua cobertura divina\nsobre cada dia desta semana.\nOnde eu pisar,\nque a tua graça me preceda.", tag: "Cobertura" },
    { text: "Senhor,\nEu não sei o amanhã,\nmas sei quem segura\no amanhã. E é você.", tag: "Entrega" },
  ],
  versiculo: [
    { text: "O Senhor é o meu pastor;\nnada me faltará.", tag: "Salmos 23:1" },
    { text: "Porque eu bem sei os pensamentos\nque penso de vocês,\npensamentos de paz\ne não de mal.", tag: "Jeremias 29:11" },
    { text: "Não tenha medo,\nporque eu sou contigo.\nEu te fortaleço e te ajudo.", tag: "Isaías 41:10" },
    { text: "Tudo posso naquele\nque me fortalece.", tag: "Filipenses 4:13" },
    { text: "Entregue ao Senhor o teu caminho,\nconfia nele,\ne ele tudo fará.", tag: "Salmos 37:5" },
    { text: "Deus é o nosso refúgio\ne a nossa fortaleza,\nsempre pronto para ajudar.", tag: "Salmos 46:1" },
    { text: "Venham a mim todos os que\nestão cansados e sobrecarregados,\ne eu darei descanso.", tag: "Mateus 11:28" },
    { text: "A paz de Deus excede\ntodo entendimento.", tag: "Filipenses 4:7" },
    { text: "O que habita no esconderijo\ndo Altíssimo\ndescansará à sombra\ndo Onipotente.", tag: "Salmos 91:1" },
    { text: "Deixo-vos a paz,\na minha paz vos dou.\nNão a dou como o mundo a dá.", tag: "João 14:27" },
  ],
  afirmacao: [
    { text: "EU NÃO ANDO SOZINHO.\nDeus vai adiante de mim.", tag: "Coragem" },
    { text: "EU RECEBO.\nO que Deus preparou\né maior do que eu penso.", tag: "Receber" },
    { text: "O MEU AMANHÃ\nestá nas mãos de Deus.\nNão preciso ter medo.", tag: "Fé" },
    { text: "EU SOU FILHO(A) DE DEUS.\nNenhuma opinião humana\ndefine o meu valor.", tag: "Identidade" },
    { text: "HOJE eu escolho a paz.\nNão o medo.\nNão a ansiedade.\nA PAZ DE DEUS.", tag: "Escolha" },
    { text: "DEUS ESTÁ TRABALHANDO\nnos bastidores da minha vida.\nMesmo quando eu não vejo.", tag: "Confiança" },
    { text: "EU SOU PROTEGIDO(A).\nNenhum olho malicioso\nalcança o que Deus guarda.", tag: "Proteção" },
    { text: "A MINHA VITÓRIA\njá foi declarada no céu.\nEu só preciso caminhar.", tag: "Vitória" },
    { text: "EU NÃO ME ALARMO.\nDeus nunca chega atrasado.\nNunca.", tag: "Paz" },
    { text: "A GRAÇA DE DEUS\né suficiente para mim.\nEm toda fraqueza,\nela se aperfeiçoa.", tag: "Graça" },
  ],
  reflexao: [
    { text: "Guardar mágoa é carregar\numa pedra dentro do peito\ne esperar que o outro\nsinta o peso.\n\nPerdoar é libertar\na si mesmo.", tag: "Perdão" },
    { text: "Cada dia que passa\nnão volta mais.\n\nNão adie o perdão,\na ligação para quem ama,\no obrigado\ne o eu te amo.", tag: "Tempo" },
    { text: "Deus costuma falar baixo,\nno silêncio do coração.\n\nReserve cinco minutos do dia\npara ficar quieto\ndiante dele.", tag: "Silêncio" },
    { text: "Ninguém vê as raízes\nde uma árvore,\nmas são elas que sustentam\nos frutos.\n\nA sua fé no silêncio,\na oração escondida —\nessas são as raízes.", tag: "Raízes" },
    { text: "No fim da vida,\nninguém vai lembrar\ndas pressas, das brigas\nou dos bens.\n\nVai lembrar dos abraços\ne do amor dado.\n\nComece hoje a viver\naquilo que vai importar\namanhã.", tag: "Prioridades" },
    { text: "Fé não é ver o caminho\nantes de caminhar.\n\nFé é dar o primeiro passo\nmesmo no escuro,\nsabendo que Deus\njá trilhou o caminho\nantes de você.", tag: "Fé" },
    { text: "A gratidão não muda\no que aconteceu.\nMuda como você sente\no que aconteceu.\n\nAgradeça não porque\ntudo está bem,\nmas porque Deus\nestá no controle.", tag: "Gratidão" },
    { text: "Quanto menos você carrega,\nmais leve o coração fica.\n\nSolte a necessidade\nde ter razão.\nEm Deus,\no vazio vira espaço\npara a graça.", tag: "Leveza" },
  ],
  promessa: [
    { text: "DEUS VAI RESTAURAR\ntudo o que o inimigo\ntentou tirar de você.\nEle é fiel.", tag: "Restauração" },
    { text: "A PORTA QUE Deus\nestá abrindo para você,\nnenhuma força na terra\nconsegue fechar.", tag: "Portas" },
    { text: "VEM UM TEMPO DE COLHER\no que você plantou\ncom lágrimas.\nDeus não se esquece\ndas suas sementes.", tag: "Colheita" },
    { text: "ONDE TEM ESCURIDÃO,\nDeus vai colocar\na sua luz.\nOnde tem luto,\nDeus vai colocar\nalegria.\nIsaías 61:3.", tag: "Luz" },
    { text: "DEUS PREPAROU UMA MESA\ndiante dos seus inimigos.\nNão se preocupe com quem\ncriticou o seu caminho.\nDeus vai lidar com isso.", tag: "Mesa" },
    { text: "O QUE ESTÁ POR VIR\né maior do que\no que ficou pra trás.\nDeus está te levando\npara um lugar melhor.", tag: "Futuro" },
    { text: "DEUS VAI USAR\no que o mundo descartou.\nO que outros julgaram fraco,\nDeus vai transformar\nna maior vitória.", tag: "Força" },
    { text: "NÃO DESISTA AGORA.\nVocê está mais perto\ndo milagre do que imagina.\nDeus está terminando\na obra que começou em você.", tag: "Perseverança" },
  ],
  aviso: [
    { text: "SE DEUS BLOQUEOU,\nnão tente abrir.\nEle não tira\npara te machucar.\nTira para te proteger.", tag: "Proteção" },
    { text: "DEIXE DE SE COMPARAR.\nDeus não te fez\npara ser cópia.\nTe fez para ser\na única versão\nde você que existe.", tag: "Identidade" },
    { text: "O INIMIGO VAI\nte dizer que você não consegue.\nMas Deus já disse:\nEu sou contigo.\nQuem você vai acreditar?", tag: "Vozes" },
    { text: "CUIDADO COM O QUE\nvocê faz quando ninguém\nestá olhando.\nDeus sempre está.", tag: "Integridade" },
    { text: "SE VOCÊ ESTÁ SE AFASTANDO\nde Deus,\nlembre-se:\na graça ainda te espera.\nVolte enquanto há tempo.", tag: "Volta" },
    { text: "NÃO TENTE FAZER\nsozinho o que Deus\nchamou você para fazer\ncom Ele.\nA carga leve\ncomeça na dependência.", tag: "Dependência" },
  ],
};

const REELS_BG_THEMES = [
  { id: "golden-light", label: "Luz Dourada", emoji: "☀️",
    scene: "warm golden divine light rays through clouds, sacred heavenly atmosphere, soft glow, vertical composition, no text",
    query: "golden light rays divine heaven" },
  { id: "dark-sky", label: "Céu Noturno", emoji: "🌙",
    scene: "deep midnight sky with soft golden stars, peaceful serene night, divine stillness, vertical composition, no text",
    query: "starry night sky milky way peaceful" },
  { id: "candle", label: "Vela Sagrada", emoji: "🕯️",
    scene: "single warm candle flame in sacred darkness, golden bokeh, intimate prayerful atmosphere, vertical composition, no text",
    query: "candle flame warm dark bokeh sacred" },
  { id: "nature", label: "Natureza", emoji: "🌿",
    scene: "enchanted misty forest with soft golden light rays, peaceful serene nature, morning dew, vertical composition, no text",
    query: "forest mist morning light rays" },
  { id: "ocean", label: "Mar Sereno", emoji: "🌊",
    scene: "calm ocean waves at golden hour, soft horizon glow, eternal peaceful sea, vertical composition, no text",
    query: "calm ocean waves golden hour sunset" },
  { id: "minimal", label: "Minimalista", emoji: "🖤",
    scene: "single golden light beam on pure dark background, elegant minimalism, premium sacred atmosphere, vertical composition, no text",
    query: "golden light beam dark background minimal" },
  { id: "roses", label: "Rosas", emoji: "🌹",
    scene: "luminous white and golden roses in full bloom, soft heavenly light, dew drops, vertical composition, no text",
    query: "white golden roses dew light sacred" },
  { id: "mountain", label: "Montanhas", emoji: "🏔️",
    scene: "majestic mountain peaks bathed in golden sunrise light, valley of clouds, breathtaking sacred stillness, vertical composition, no text",
    query: "mountain peaks sunrise clouds sacred" },
];

const REELS_STYLES = {
  cinematic: { label: "Cinematográfico", prompt: "cinematic lighting, photorealistic, dramatic depth of field, ultra detailed, award winning photography" },
  watercolor: { label: "Aquarela", prompt: "delicate watercolor painting, soft ethereal washes of color, luminous white space, artistic, subtle gold accents" },
  celestial: { label: "Celestial", prompt: "angelic ethereal glow, heavenly light rays, luminous dreamlike atmosphere, divine radiance, breathtaking" },
  minimal: { label: "Minimalista", prompt: "minimalist composition, clean elegant negative space, soft luminous gradients, premium refined design" },
  golden: { label: "Dourado", prompt: "warm golden light, rich golden tones, sacred divine atmosphere, luminous warm glow, premium quality" },
};

const REELS_SOURCES = {
  cloudflare: { label: "Cloudflare IA", desc: "Arte exclusiva gerada por IA (FLUX)" },
  pollinations: { label: "Pollinations IA", desc: "Arte exclusiva gerada por IA gratuita" },
  pexels: { label: "Pexels", desc: "Fotos reais profissionais gratuitas" },
  pixabay: { label: "Pixabay", desc: "Fotos reais gratuitas" },
};
