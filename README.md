# Alvorada do Céu — Gerador de Frases Espirituais

Um gerador de frases espirituais para **Instagram Reels** (e postagens em geral).
Cada geração entrega **quatro coisas prontas para usar**:

1. **Frase** — de alto impacto, feita para prender a atenção, gerar identificação, compartilhamento e inscrição na página.
2. **Legenda** — com estrutura **conexão → mensagem → acolhimento → (reflexão/pergunta)** + convite natural para seguir @alvoradadoceu.
3. **Hashtags** — máximo 5, relevantes ao tema (sem #viral/#fyp/#reels), derivadas de um banco inteligente por categoria.
4. **Palavras-chave** — 5 a 8 termos de SEO, conectados ao conteúdo; além do termo para buscar o vídeo de fundo no **Pexels** ou **Pixabay**, com links diretos.

Sem imagens, sem vídeos, sem complicação: texto puro gerado por IA.

## Recursos

- **2 categorias focadas no que mais viraliza no nicho**: Fé e Oração, com chip rápido de seleção.
- **2 formatos**: Frase de impacto e Sequência para Reel (os mais usados em Reels cristãos).
- **2 tamanhos** (o padrão de Reels): Curto (frase em 1 linha para o vídeo) e Reel em blocos (frases em sequência).
- **2 abordagens de frase**: Identificação ("isso sou eu") e Contraste (luta × vitória) — os ganchos que prendem no 1º segundo.
- **2 estilos de legenda**: Curta e viral (resumida, alto impacto) e Emocional e acolhedora.
- **🎯 As 10 melhores hashtags do nicho**: bloco com as 10 hashtags de alto alcance por categoria (botão copiar) — a base para o algoritmo mostrar o Reels ao público certo.
- **Hashtags por post**: até 10 tags otimizadas (amplo → nicho → subnicho → contexto → marca), sem #viral/#fyp que atraem o público errado.
- **Legendas curtas e virais**: a IA é instruída a gerar no máximo ~35 palavras, com gancho emocional no 1º segundo, para compartilhamento e salvamento naturais.
- **Intenção de engajamento**: identificação, compartilhamento, salvamento, comentário (ou automático) — usada internamente para a IA orientar o texto.
- **Pipeline semântico**: TEMA → EMOÇÃO → DOR/DESEJO → INTENÇÃO → FRASE → LEGENDA → HASHTAGS → PALAVRAS-CHAVE, tudo conectado.
- **Modo 🔥 Alto Impacto** (padrão) e **💌 Para Compartilhar**.
- **Lote de 1, 5, 10, 20 ou 30 frases** de uma vez.
- **✨ Gerar outra legenda**: botão em cada cartão que cria uma nova versão da legenda mantendo a mesma frase (rota `POST /api/legenda`).
- **Copy de tudo**: botão 📑 que copia frase + legenda + hashtags + palavras-chave no formato final.
- **Antirrepetição**: o histórico (frase + hashtags) é enviado à IA para que ela não repita conteúdo.
- **⭐ Favoritos e banco de frases** (localStorage): salvar, marcar como utilizada, excluir, anotar observações e abrir de novo no gerador — incluindo hashtags e palavras-chave.
- Sempre **responde**: se nenhuma IA responder, usa o banco local de frases.

> Seus dados ficam apenas no navegador do visitante — não há servidor de banco de dados.

## Como funciona a IA

O texto é gerado por IA em cascata: **Cloudflare Workers AI** (principal) → **OpenRouter** (backup grátis) → **Mistral AI** (backup grátis) → banco local de frases. Assim, se um provedor gratuito falhar ou estiver instável, o próximo entra na fila; o botão sempre responde.

| Prioridade | Provedor | Chave de API? | Observação |
|---|---|---|---|
| 1 | **Cloudflare Workers AI** | Sim — `CF_ACCOUNT_ID` + `CF_API_TOKEN` | Motor principal, configurado no `.env` |
| 2 | **OpenRouter** | Sim — `OPENROUTER_API_KEY` | Backup grátis (~50 req/dia, 20 req/min; +1.000/dia com top-up de $10). Muitos modelos `:free` |
| 3 | **Mistral AI** | Sim — `MISTRAL_API_KEY` | Backup grátis (~1B tokens/mês, sem cartão; verificação por telefone). Ótimo em português |
| 4 | **Banco local** | Não | Garantia offline — sempre há resposta |

> As chaves ficam só no servidor/`.env` — o navegador do visitante nunca as vê.

> &#9888;&#65039; Atenção: se a página mostrar "banco local", significa que nenhuma das IAs de rede respondeu neste momento — a experiência continua completa com o banco local. Para usar a IA de rede, gere tokens válidos: Cloudflare (dash.cloudflare.com → API Tokens → Create Token, permissão **Workers AI: Edit**), OpenRouter (openrouter.ai → Keys) e/ou Mistral (console.mistral.ai → API Keys).

## Categorias

**Fé** e **Oração** — as duas categorias com maior taxa de compartilhamento, salvamento e comentários em Reels cristãos. O conteúdo é gerado para prender no primeiro segundo (identificação/contraste), emocionar e fechar com convite natural para seguir @alvoradadoceu.

### As 10 melhores hashtags do nicho

| Fé | Oração |
|---|---|
| #Deus, #Fé, #FéEmDeus, #DeusNoComando, #Esperança, #ConfiançaEmDeus, #Jesus, #CrerSemVer, #VidaComDeus, #alvoradadoceu | #Oração, #Deus, #Fé, #Devocional, #PalavraDeDeus, #OraçãoDaManhã, #VidaDeOração, #ConversaComDeus, #Paz, #alvoradadoceu |

Cada post entregue já vem com **até 10 hashtags otimizadas** (2 amplas + 2 de nicho + 3 de subnicho + 2 de contexto + a marca) para o Reels ser mostrado ao público certo. Evite #viral, #fyp, #paravoce: atraem curiosos, não seguidores do nicho.

## Rodar localmente

```bash
node server.js
# ou: npm start
# abra http://localhost:8001
```

Diagnóstico dos provedores:

```bash
curl http://localhost:8001/api/status
```

## Estrutura

```
├── public/                        # site estático (output do build)
│   ├── index.html
│   ├── 404.html
│   ├── css/style.css
│   ├── js/app.js
│   ├── _headers                  # headers de segurança + cache
│   └── _redirects                # bloqueio de caminhos sensíveis
├── functions/
│   ├── api/
│   │   ├── frase.js             # POST /api/frase
│   │   ├── legenda.js           # POST /api/legenda
│   │   └── status.js            # GET /api/status
│   └── _lib/
│       ├── core-ai.js           # motor de IA (Cloudflare + trabalho + banco local)
│       └── load-core.mjs        # injeta env e carrega o core (nodejs_compat)
├── server.js                     # servidor local (dev) + mesmas rotas /api
├── wrangler.toml                 # configuração de deploy Cloudflare Pages
├── .env                          # segredos locais (NUNCA suba no git)
└── .env.example
```

## Hospedar no Cloudflare Pages

1. Suba o repositório no GitHub (o `.env` já está no `.gitignore`).
2. No [dash.cloudflare.com](https://dash.cloudflare.com): **Workers & Pages → Create → Pages → Connect to Git** e escolha o repositório.
3. Na configuração de build use:
   - **Build command:** `npm ci --omit=dev || npm install --omit=dev`
   - **Build output directory:** `public`
   - O `wrangler.toml` já define `build.command` e `output_directory`; se o painel não os detectar, preencha à mão.
4. Ative o **Node.js compatibility**: **Settings → Functions → Compatibility flags** e adicione `nodejs_compat` (ou defina `compatibility_flags` no `wrangler.toml`, já incluído).
5. Configure as **variáveis de ambiente** (secrets): **Settings → Variables and Secrets**:

| Variável | Obrigatória? | Para quê |
|---|---|---|
| `CF_ACCOUNT_ID` | Não* | Cloudflare Workers AI (sem ela cai para OpenRouter/Mistral/banco) |
| `CF_API_TOKEN` | Não* | Token da Cloudflare (permissão Workers AI: Edit) |
| `CF_TEXT_MODEL` | Não | Modelo Cloudflare (padrão `@cf/meta/llama-3.3-70b-instruct-fp8-fast`) |
| `OPENROUTER_API_KEY` | Não* | Backup grátis do OpenRouter |
| `OPENROUTER_MODEL` | Não | Modelo (padrão `nvidia/nemotron-3-ultra-550b-a55b:free`) |
| `MISTRAL_API_KEY` | Não* | Backup grátis do Mistral AI |
| `MISTRAL_MODEL` | Não | Modelo (padrão `mistral-small-latest`) |

\* Nenhuma é obrigatória: sem nenhuma chave o app continua funcionando com o banco local.

> Com o flag `nodejs_compat`, essas variáveis ficam disponíveis dentro da função via `process.env`, 
> que é como o `core-ai.js` as lê — não é preciso alterar o motor de IA.

### Rodar as funções localmente (com wrangler)

Depois de `npm install`, copie suas chaves para `.dev.vars` (mesmo formato do `.env`) e rode:

```bash
npx wrangler pages dev public
```

Isso serve as funções de `functions/` mais o `public/` em `http://localhost:8788`.

### Deploy manual via CLI (opcional)

```bash
npm run pages:deploy
```

## API

## API

`POST /api/frase` — corpo:

```json
{
  "categoria": "fe",
  "tipo": "curta",
  "tamanho": "curto",
  "altoImpacto": true,
  "paraCompartilhar": false,
  "quantidade": 5,
  "estilo": "auto",
  "abordagem": "auto",
  "intencao": "auto",
  "evitar": ["frase já vista pelo usuário, para a IA não repetir"]
}
```

Resposta:

```json
{
  "ok": true,
  "itens": [
    {
      "frase": "A fé não é ver a saída. É confiar em quem mostra o caminho.",
      "legenda": "Sabe aquele peso que você tenta esconder até de si mesmo? Deus já viu.\n\nA fé ensina a confiar mesmo sem respostas completas.\n\nSiga @alvoradadoceu para mais palavras que tocam o coração. 🙏",
      "hashtags": ["#Deus", "#Fé", "#FéEmDeus", "#DeusNoComando", "#Esperança", "#ConfiançaEmDeus", "#CrerSemVer", "#VidaComDeus", "#EsperançaEmDeus", "#alvoradadoceu"],
      "palavras_chave": ["fé", "confiança em Deus", "esperança", "oração", "Deus", "paz", "entrega"],
      "palavra_chave": "mãos orando céu nuvens luz, faith praying hands sky light"
    }
  ],
  "categoria": "fe",
  "categoriaLabel": "Fé",
  "quantidade": 1,
  "provider": "cloudflare",
  "providerLabel": "Cloudflare Workers AI"
}
```

`POST /api/legenda` — gera outra versão da legenda mantendo a frase (`frase` obrigatória; opcionais `legenda`, `categoria`, `estilo`, `intencao`, `provider`, `evitar`).

`GET /api/status` — diagnóstico dos provedores configurados.

## Observações (agosto/2026)

- O gerador usa **Cloudflare Workers AI** → **OpenRouter** → **Mistral AI** → **banco local** (Pollinations e ChatGptOss foram removidos por instabilidade/pagamento; GitHub Models foi desativado pela Microsoft em 30/07/2026, e a Cerebras deixou de ter faixa gratuita permanente).
- Sempre haverá resposta por causa do **banco local**. Para a melhor qualidade, use o **Cloudflare Workers AI** com token válido.