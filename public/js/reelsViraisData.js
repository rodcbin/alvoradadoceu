/* =========================================================
   Alvorada do Céu — Reels Virais (9:16)
   Banco de dados: 5 categorias virais, prompts, legendas,
   hooks, templates de notificação iOS, quiz, etc.
   ========================================================= */

const RV_TEMPLATES = [
  {
    id: "oracao-retencao",
    label: "Oração de Retenção",
    emoji: "🛡️",
    desc: "Oração poderosa para reter bênçãos e proteger a família — formato que gera milhares de salvamentos.",
    hook: "TODO MUNDO PRECISA DESTA ORAÇÃO",
    duration: 7,
    hashtags: ["#oracaoderetencao", "#protecao", "#fe", "#deus", "#reels", "#viral"],
    captionTemplate: "🛡️ {hook}\n\n{text}\n\nComente AMÉM para ativar esta oração na sua vida 🙏\nSalve para rezar sempre que precisar 💛\nCompartilhe com quem precisa de proteção ✨\n\n{hashtags}",
    scenes: [
      "powerful golden shield of divine light radiating in darkness, sacred protection aura, heavenly rays, vertical composition, no text",
      "glowing hands of God reaching down with golden light, protective divine presence, ethereal mist, vertical composition, no text",
      "ancient stone tower bathed in warm heavenly light, fortress of faith, sacred atmosphere, vertical composition, no text",
    ],
  },
  {
    id: "quiz-biblico",
    label: "Quiz Bíblico",
    emoji: "❓",
    desc: "Pergunta bíblica com alternativas — gera enxurrada de comentários e compartilhamentos.",
    hook: "VOCÊ SABIA A RESPOSTA?",
    duration: 8,
    hashtags: ["#quizbiblico", "#biblia", "#sabedoria", "#desafio", "#reels", "#viral"],
    captionTemplate: "❓ {hook}\n\n{text}\n\n👇 Comente a resposta aqui embaixo!\nQuem acertar é porque realmente conhece a Palavra 📖\nSalve para testar seus amigos! ✨\n\n{hashtags}",
    scenes: [
      "open ancient Bible with golden light illuminating pages, sacred knowledge, warm candlelight, vertical composition, no text",
      "majestic library with golden light rays through stained glass, wisdom and knowledge, sacred atmosphere, vertical composition, no text",
      "golden question mark formed by light particles in dark sacred space, mystery and discovery, vertical composition, no text",
    ],
  },
  {
    id: "notificacao-ios",
    label: "Notificação iOS",
    emoji: "📱",
    desc: "Mensagem estilo notificação do celular — formato viral que parede o scroll imediatamente.",
    hook: "DEUS ESTÁ TE ENVIANDO UMA MENSAGEM",
    duration: 6,
    hashtags: ["#notificacaodedeus", "#mensagembiblica", "#fe", "#deus", "#reels", "#viral"],
    captionTemplate: "📱 {hook}\n\n{text}\n\nAtive as notificações 🔔 para receber a Palavra todos os dias!\nComente AMÉM se você recebeu esta mensagem 🙏\n\n{hashtags}",
    scenes: [
      "soft blurred warm bokeh lights on dark background, notification glow effect, modern tech feel, vertical composition, no text",
      "gentle morning light through window on dark desk with phone, peaceful modern morning, vertical composition, no text",
      "soft purple and gold gradient abstract background, ethereal notification glow, vertical composition, no text",
    ],
  },
  {
    id: "contraste-emocional",
    label: "Contraste Emocional",
    emoji: "💔",
    desc: "Antes e depois da fé — formato que gera identificação profunda e compartilhamentos massivos.",
    hook: "ANTES E DEPOIS DE CRISTO",
    duration: 9,
    hashtags: ["#testemunho", "#antesedepois", "#transformacao", "#fe", "#reels", "#viral"],
    captionTemplate: "💔✨ {hook}\n\n{text}\n\nSe você está passando pelo 'antes', saiba: o 'depois' já está a caminho 🙏\nComente EU RECEBO se essa palavra é para você!\nCompartilhe com quem precisa ouvir isso hoje ✨\n\n{hashtags}",
    scenes: [
      "dark stormy sky transitioning to brilliant golden sunrise, hope after darkness, dramatic contrast, vertical composition, no text",
      "wilting flower reviving with golden divine light, transformation and renewal, sacred beauty, vertical composition, no text",
      "broken chain with golden light bursting through, freedom and liberation, divine power, vertical composition, no text",
    ],
  },
  {
    id: "reflexao-minimalista",
    label: "Reflexão Minimalista",
    emoji: "✨",
    desc: "Frase curta e poderosa sobre fundo clean — formato premium que gera salvamentos em massa.",
    hook: "LEIA ISSO 3 VEZES",
    duration: 6,
    hashtags: ["#reflexao", "#sabedoria", "#fe", "#vidacrista", "#reels", "#viral"],
    captionTemplate: "✨ {hook}\n\n{text}\n\nLeia de novo. Guarde no coração. 💛\nComente AMÉM se tocou fundo 🙏\nSalve para reler quando precisar 📌\n\n{hashtags}",
    scenes: [
      "minimalist golden light beam on pure dark background, single ray of divine light, elegant simplicity, vertical composition, no text",
      "soft golden gradient fading into darkness, zen peaceful minimalism, premium refined atmosphere, vertical composition, no text",
      "single golden feather floating in soft heavenly light, peace and grace, minimal sacred beauty, vertical composition, no text",
    ],
  },
];

/* ---------- conteúdo por template ---------- */

const RV_ORACAO_RETENCAO = [
  {
    t: "Proteção para a família",
    text: "Senhor, eu cobro com o teu sangue a minha família inteira. Que nenhum mal se aproxime, nenhuma doença tome conta e nenhuma tristeza entre na nossa casa. Tua mão poderosa nos protege a cada passo. Amém.",
  },
  {
    t: "Retenção de bênçãos",
    text: "Pai, eu retenho todas as bênçãos que tens para mim e para a minha casa. Que nada do bem que Deus preparou se perca no caminho. Guarda, protege e mantém tudo o que é nosso sob o teu cuidado. Amém.",
  },
  {
    t: "Escudo de fé",
    text: "Espírito Santo, levanta o escudo de fé sobre a minha vida. Afasta todo pensamento de medo, toda língua de maldição e todo plano do inimigo. Eu caminho protegido pela graça de Deus. Amém.",
  },
  {
    t: "Proteção espiritual",
    text: "Deus, coloca teus anjos de guarda ao redor da minha casa, do meu trabalho e de cada pessoa que eu amo. Que nenhum acidente, doença ou perigo nos alcance. Tua proteção é nosso refúgio. Amém.",
  },
  {
    t: "Cobertura divina",
    text: "Senhor, eu peço a tua cobertura divina sobre cada dia desta semana. Onde eu pisar, que a tua graça me preceda. Onde eu falar, que a tua sabedoria me guie. Onde eu repousar, que a tua paz me cubra. Amém.",
  },
  {
    t: "Retoque de proteção",
    text: "Pai, eu declaro: nenhuma arma formada contra mim e minha família vai prosperar. Tua palavra é o meu escudo, tua promessa é a minha fortaleza. Em nome de Jesus, eu estou seguro. Amém.",
  },
  {
    t: "Mãos que protegem",
    text: "Deus, usa as tuas mãos poderosas para me guiar e me proteger. Quando o caminho for escuro, ilumina meus passos. Quando o medo vier, lembra-me de que tu estás comigo. Eu confio em ti. Amém.",
  },
  {
    t: "Água viva protege",
    text: "Senhor, faz brotar a tua águas vivas sobre a minha vida para lavar todo mal, afastar toda praga e renovar toda esperança. Que a tua água sagrada me purifique e proteja. Amém.",
  },
  {
    t: "Portão cerrado",
    text: "Deus, fecha todas as portas que não és tu que abriu. E abre as portas que o inimigo quer trancar. Guia o meu caminho e protege a minha família de todo mal visível e invisível. Amém.",
  },
  {
    t: "Anjos de guarda",
    text: "Senhor, despacha os teus anjos de guarda para watch sobre cada filho, cada filha, cada neto da minha família. Que nenhumolho malicioso nos enxergue e nenhum plano negro se cumpra contra nós. Amém.",
  },
];

const RV_QUIZ_BIBLICO = [
  {
    t: "Salmos 23",
    text: "Qual versículo diz: \"O Senhor é o meu pastor; nada me faltará\"?\n\nA) João 3:16\nB) Salmos 23:1\nC) Filipenses 4:13\n\n👆 Responda nos comentários!",
  },
  {
    t: "Multiplicação dos pães",
    text: "Quantos pães Jesus usou para alimentar 5.000 pessoas?\n\nA) 2 pães e 5 peixes\nB) 7 pães e alguns peixes\nC) 5 pães e 2 peixes\n\n👆 Responda nos comentários!",
  },
  {
    t: "A criação",
    text: "Em quantos dias Deus criou o mundo segundo a Bíblia?\n\nA) 5 dias\nB) 6 dias\nC) 7 dias\n\n👆 Responda nos comentários!",
  },
  {
    t: "José no Egito",
    text: "Quantos irmãos José tinha?\n\nA) 10\nB) 11\nC) 12\n\n👆 Responda nos comentários!",
  },
  {
    t: "Moisés no deserto",
    text: "Quantos anos Israel vagou no deserto?\n\nA) 10 anos\nB) 30 anos\nC) 40 anos\n\n👆 Responda nos comentários!",
  },
  {
    t: "Davi e Golias",
    text: "Que arma Davi usou contra Golias?\n\nA) Espada\nB) Funda e pedra\nC) Arco e flecha\n\n👆 Responda nos comentários!",
  },
  {
    t: "Jesus na cruz",
    text: "\"Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus\" está em:\n\nA) 1 Tessalonicenses 5:18\nB) Romanos 8:28\nC) Filipenses 4:6\n\n👆 Responda nos comentários!",
  },
  {
    t: "A torre de Babel",
    text: "Por que Deus confundiu as línguas na torre de Babel?\n\nA) Porque construíram sem autorização\nB) Porque tinham orgulho e se julgavam donos da verdade\nC) Porque não rezavam\n\n👆 Responda nos comentários!",
  },
  {
    t: "Rute e Noemi",
    text: "Rute era:\n\nA) A sogra de Noemi\nB) A nora de Noemi\nC) A mãe de Noemi\n\n👆 Responda nos comentários!",
  },
  {
    t: "Jonas e a baleia",
    text: "Quantos dias Jonas ficou na barriga da baleia?\n\nA) 1 dia\nB) 3 dias\nC) 7 dias\n\n👆 Responda nos comentários!",
  },
];

const RV_NOTIFICACAO_IOS = [
  {
    t: "Mensagem de Deus",
    text: "📱 Notificação de Deus:\n\n\"Eu sei que você está cansado, mas não desista. Eu estou trabalhando nos bastidores da sua vida. Confia em mim.\"\n\n— Jeremias 29:11",
  },
  {
    t: "Alerta celestial",
    text: "📱 Deus quer que você saiba:\n\n\"Não tenha medo, porque eu sou contigo. Não se assombre, porque eu sou o teu Deus. Eu te fortaleço e te ajudo.\"\n\n— Isaías 41:10",
  },
  {
    t: "Mensagem urgente",
    text: "📱 Notificação especial de Deus:\n\n\"Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso.\"\n\n— Mateus 11:28",
  },
  {
    t: "Lembrete divino",
    text: "📱 Lembrete de Deus para você:\n\n\"Não se preocupem com nada, mas em tudo façam pedido a Deus em oração, com ações de graça.\"\n\n— Filipenses 4:6",
  },
  {
    t: "Atualização de fé",
    text: "📱 Nova atualização disponível:\n\n\"Deus é o nosso refúgio e a nossa fortaleza, sempre pronto para nos ajudar nas dificuldades.\"\n\n— Salmos 46:1",
  },
  {
    t: "Mensagem de amor",
    text: "📱 DM de Deus:\n\n\"Eu te amo com amor eterno. Por isso, te mantenho o meu amor.\"\n\n— Jeremias 31:3",
  },
  {
    t: "Aviso de proteção",
    text: "📱 Deus está te protegendo:\n\n\"O que habita no esconderijo do Altíssimo descansará à sombra do Onipotente.\"\n\n— Salmos 91:1",
  },
  {
    t: "Convite divino",
    text: "📱 Deus te convida:\n\n\"Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.\"\n\n— Salmos 37:5",
  },
  {
    t: "Confirmação de fé",
    text: "📱 Confirmação de Deus:\n\n\"Tudo posso naquele que me fortalece.\"\n\n— Filipenses 4:13",
  },
  {
    t: "Atualização de paz",
    text: "📱 Deus está te mandando paz:\n\n\"Deixo-vos a paz, a minha paz vos dou. Não a dou como o mundo a dá.\"\n\n— João 14:27",
  },
];

const RV_CONTRASTE_EMOCIONAL = [
  {
    t: "Ansiedade vs Paz",
    text: "💔 ANTES: Preso na ansiedade, sem saber o dia de amanhã, acordando com medo.\n\n✨ DEPOIS: Entregando tudo a Deus, dormindo em paz, acordando com esperança.\n\nA transformação começa quando você entrega. 🙏",
  },
  {
    t: " solidão vs Amor",
    text: "💔 ANTES: Sentindo-se sozinho em meio a multidão, buscando amor em lugares errados.\n\n✨ DEPOIS: Encontrando no amor de Deus tudo o que faltava — completo, amado, pertencente.\n\nEle te ama como ninguém. 💛",
  },
  {
    t: "Medo vs Coragem",
    text: "💔 ANTES: Paralisado pelo medo de errar, de tentar, de viver.\n\n✨ DEPOIS: Andando com coragem porque Deus está adiante, abrindo portas que eu nem imaginava.\n\nO teu medo vai virar vitória. 🙏",
  },
  {
    t: "Dívida vs Provisão",
    text: "💔 ANTES: Conta no vermelho, aperto no final do mês, desespero silencioso.\n\n✨ DEPOIS: Deus proviu na hora certa, no lugar certo, do jeito que eu nunca imaginaria.\n\nEle é o Deus que nunca falta. ✨",
  },
  {
    t: "Mágoa vs Perdão",
    text: "💔 ANTES: Carregando mágoa como pedra no peito, esperando que o outro sentisse o peso.\n\n✨ DEPOIS: Perdoei, soltei, respirei. O perdão não libera quem feriu — liberta quem foi ferido.\n\nSolta essa pedra hoje. 🎈",
  },
  {
    t: "Desespero vs Esperança",
    text: "💔 ANTES: No fundo do poço, sem ver saída, sem forças para gritar.\n\n✨ DEPOIS: Deus me ergueu do poço, pôs meus pés sobre a rocha e renovou a minha esperança.\n\nNão desista: o poço também é lugar de milagre. 🙏",
  },
  {
    t: "Perda vs Restauração",
    text: "💔 ANTES: Perdi tudo o que achei que era essencial — trabalho, relacionamento, direção.\n\n✨ DEPOIS: Deus restaurou com juros: trouxe o que eu não sabia que merecia.\n\nEle devolve os anos que o gafanhoto comeu. 🌱",
  },
  {
    t: "Escuridão vs Luz",
    text: "💔 ANTES: Vivia na escuridão dos próprios erros, sem saber como recomeçar.\n\n✨ DEPOIS: A luz de Deus entrou no meu quarto mais escuro e fez tudo se tornar novo.\n\nEle é a luz que não se apaga. 🕯️",
  },
  {
    t: "Fracasso vs Propósito",
    text: "💔 ANTES: Fracassei onde todo mundo esperava que eu vencesse. Senti vergonha.\n\n✨ DEPOIS: Deus usou o meu fracasso para me colocar no lugar exato onde eu deveria estar.\n\nO teu fracasso pode ser o início do teu propósito. 🔥",
  },
  {
    t: "Cansaço vs Descanso",
    text: "💔 ANTES: Lutando sozinho, sem pedir ajuda, sem saber que descansar também é fé.\n\n✨ DEPOIS: Entendi que descansar nos braços de Deus é o maior ato de confiança.\n\nHoje, permita-se parar. Ele cuida. 🛏️",
  },
];

const RV_REFLEXAO_MINIMALISTA = [
  {
    t: "O peso do perdão",
    text: "Guardar mágoa é carregar uma pedra dentro do peito\ne esperar que o outro sinta o peso.\n\nPerdoar não é liberar quem feriu.\nÉ libertar a si mesmo.",
  },
  {
    t: "Tempo é vida",
    text: "Cada dia que passa não volta mais.\n\nNão adie o perdão, a ligação\npara quem ama, o obrigado\ne o eu te amo.\n\nUse o tempo com amor.",
  },
  {
    t: "Silêncio que ensina",
    text: "Deus costuma falar baixo,\nno silêncio do coração.\n\nReserve cinco minutos do dia\npara ficar quieto diante dele.\n\nO céu conversa com quem escuta.",
  },
  {
    t: "Raízes e frutos",
    text: "Ninguém vê as raízes de uma árvore,\nmas são elas que sustentam os frutos.\n\nA sua fé no silêncio,\na oração escondida,\no serviço discreto —\nessas são as raízes.\n\nOs frutos vão aparecer.",
  },
  {
    t: "O que realmente importa",
    text: "No fim da vida, ninguém vai lembrar\ndas pressas, das brigas ou dos bens.\n\nVai lembrar dos abraços,\ndas manhãs em paz\ne do amor dado.\n\nComece hoje a viver\naquilo que vai importar amanhã.",
  },
  {
    t: "Espelho da alma",
    text: "Antes de julgar o outro,\nolhe no espelho:\ntambém erramos.\n\nA compaixão começa\nquando lembramos\nque somos iguais\nna fraqueza\ne irmãos na busca por Deus.",
  },
  {
    t: "Menos é mais",
    text: "Quanto menos você carrega,\nmais leve o coração fica.\n\nSolte a necessidade\nde ter razão.\nSolte o medo\nde ser vulnerável.\n\nEm Deus,\no vazio vira espaço\npara a graça.",
  },
  {
    t: "Agir com fé",
    text: "Fé não é ver o caminho\nantes de caminhar.\n\nFé é dar o primeiro passo\nmesmo no escuro,\nsabendo que Deus\njá trilhou o caminho\nantes de você.",
  },
  {
    t: "Gratidão transforma",
    text: "A gratidão não muda o que aconteceu.\nMuda como você sente o que aconteceu.\n\nAgradeça não porque tudo está bem,\nmas porque Deus está no controle.\n\nIsso muda tudo.",
  },
  {
    t: "Lua e Deus",
    text: "A lua não se preocupa\ncom a escuridão.\nEla simplesmente brilha.\n\nVocê também não precisa\nentender tudo.\nApenas brilhe.\nDeus cuida da noite.",
  },
];

const RV_CONTENT_BY_TEMPLATE = {
  "oracao-retencao": RV_ORACAO_RETENCAO,
  "quiz-biblico": RV_QUIZ_BIBLICO,
  "notificacao-ios": RV_NOTIFICACAO_IOS,
  "contraste-emocional": RV_CONTRASTE_EMOCIONAL,
  "reflexao-minimalista": RV_REFLEXAO_MINIMALISTA,
};

const RV_BG_THEMES = [
  {
    id: "golden-light",
    label: "Luz Dourada",
    emoji: "☀️",
    scene: "warm golden divine light rays through clouds, sacred heavenly atmosphere, soft glow, vertical composition, no text",
  },
  {
    id: "dark-sky",
    label: "Céu Noturno",
    emoji: "🌙",
    scene: "deep midnight sky with soft golden stars, peaceful serene night, divine stillness, vertical composition, no text",
  },
  {
    id: "candle",
    label: "Vela Sagrada",
    emoji: "🕯️",
    scene: "single warm candle flame in sacred darkness, golden bokeh, intimate prayerful atmosphere, vertical composition, no text",
  },
  {
    id: "nature-mist",
    label: "Neblina",
    emoji: "🌿",
    scene: "enchanted misty forest with soft golden light rays, peaceful serene nature, morning dew, vertical composition, no text",
  },
  {
    id: "ocean-calm",
    label: "Mar Sereno",
    emoji: "🌊",
    scene: "calm ocean waves at golden hour, soft horizon glow, eternal peaceful sea, vertical composition, no text",
  },
  {
    id: "roses",
    label: "Rosas Celestiais",
    emoji: "🌹",
    scene: "luminous white and golden roses in full bloom, soft heavenly light, dew drops catching divine radiance, vertical composition, no text",
  },
  {
    id: "mountain",
    label: "Montanhas",
    emoji: "🏔️",
    scene: "majestic mountain peaks bathed in golden sunrise light, valley of clouds below, breathtaking sacred stillness, vertical composition, no text",
  },
  {
    id: "minimal-dark",
    label: "Minimalista",
    emoji: "🖤",
    scene: "single golden light beam on pure dark background, elegant minimalism, premium sacred atmosphere, vertical composition, no text",
  },
];

const RV_STYLES = {
  cinematic: { label: "Cinematográfico", prompt: "cinematic lighting, photorealistic, dramatic depth of field, ultra detailed, award winning photography" },
  watercolor: { label: "Aquarela", prompt: "delicate watercolor painting, soft ethereal washes of color, luminous white space, artistic, subtle gold accents" },
  celestial: { label: "Celestial", prompt: "angelic ethereal glow, heavenly light rays, luminous dreamlike atmosphere, divine radiance, breathtaking" },
  minimal: { label: "Minimalista", prompt: "minimalist composition, clean elegant negative space, soft luminous gradients, premium refined design" },
  golden: { label: "Dourado", prompt: "warm golden light, rich golden tones, sacred divine atmosphere, luminous warm glow, premium quality" },
};

const RV_IMAGE_SOURCES = {
  cloudflare: { label: "Cloudflare IA", desc: "Arte exclusiva gerada por IA (FLUX)" },
  pollinations: { label: "Pollinations IA", desc: "Arte exclusiva gerada por IA gratuita" },
  pexels: { label: "Pexels", desc: "Fotos reais profissionais gratuitas" },
  pixabay: { label: "Pixabay", desc: "Fotos reais gratuitas" },
};

const RV_STOCK_QUERIES = {
  "golden-light": "golden light rays divine heaven",
  "dark-sky": "starry night sky milky way peaceful",
  "candle": "candle flame warm dark bokeh sacred",
  "nature-mist": "forest mist morning light rays",
  "ocean-calm": "calm ocean waves golden hour sunset",
  "roses": "white golden roses dew light sacred",
  "mountain": "mountain peaks sunrise clouds sacred",
  "minimal-dark": "golden light beam dark background minimal",
};
