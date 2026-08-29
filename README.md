# Alvorada do Céu — Gerador de Frases Espirituais

Um gerador de frases espirituais para **Instagram Reels** (e postagens em geral).
Cada geração entrega **três coisas prontas para usar**:

1. **Frase** — curta e de alto impacto, feita para prender a atenção, gerar comentário, compartilhamento e inscrição na página.
2. **Legenda** — pronta para colar na descrição do Reels (com emojis, CTA e hashtags).
3. **Palavra-chave** — para pesquisar o vídeo de fundo no **Pexels** ou **Pixabay**, com links diretos de busca.

Sem imagens, sem vídeos, sem complicação: texto puro gerado por IA.

## Recursos

- **27 opções de categoria** (26 temas + "Todas"), com chip rápido de seleção.
- **10 formatos**: frase curta, muito curta, impacto, emocional, reflexão, oração, para imagem, para Stories, para Reel e sequência para Reel.
- **4 tamanhos**: muito curto (5–12 palavras), curto (12–25), médio (25–45) e Reel em blocos (2–4).
- **Modo 🔥 Alto Impacto** (padrão) e **💌 Para Compartilhar**.
- **Lote de 1, 5, 10, 20 ou 30 frases** de uma vez.
- **Antirrepetição**: as últimas frases geradas são enviadas à IA para que ela não se repita.
- **⭐ Favoritos e banco de frases** (localStorage): salvar, marcar como utilizada, excluir, anotar observações e abrir de novo no gerador.
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

Deus, Jesus, Fé, Oração, Esperança, Paz, Reflexão, Recomeço, Gratidão, Família, Proteção, Ansiedade, Momentos difíceis, Amor de Deus, Confiança, Superação, Mensagem da manhã, Mensagem da noite, Antes de dormir, Domingo, Segunda-feira, Final de semana, Mensagem para hoje, Frase de impacto, Reflexão espiritual e Para quem está sofrendo.

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
├── public/                      # site estático (publicado no Netlify)
│   ├── index.html
│   ├── 404.html
│   ├── css/style.css
│   └── js/app.js
├── netlify/
│   └── functions/
│       ├── api.mjs            # API serverless (espelho do server.js)
│       └── core-ai.js         # motor de IA (Cloudflare + banco local)
├── server.js                  # servidor local + POST /api/frase + GET /api/status
├── netlify.toml               # configuração de deploy Netlify
├── .env                       # segredos locais (NUNCA suba no git)
└── .env.example
```

## Hospedar no Netlify

1. Suba o repositório no GitHub (o `.env` já está no `.gitignore`).
2. No [app.netlify.com](https://app.netlify.com): **Add new site → Import an existing project**.
3. Configure as variáveis no painel (**Site configuration → Environment variables**):

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
      "legenda": "A fé não é ver a saída. É confiar em quem mostra o caminho.\n\nSalve para guardar e compartilhe com quem precisa. 💛\n\nSiga @alvoradadoceu para reflexões diárias 🙏\n\n#fé #deus #oração #esperança #alvoradadoceu",
      "palavra_chave": "mãos orando céu nuvens, faith praying hands sky"
    }
  ],
  "categoria": "fe",
  "categoriaLabel": "Fé",
  "quantidade": 5,
  "provider": "cloudflare",
  "providerLabel": "Cloudflare Workers AI"
}
```

`GET /api/status` — diagnóstico dos provedores configurados.

## Observações (agosto/2026)

- O gerador usa **Cloudflare Workers AI** → **OpenRouter** → **Mistral AI** → **banco local** (Pollinations e ChatGptOss foram removidos por instabilidade/pagamento; GitHub Models foi desativado pela Microsoft em 30/07/2026, e a Cerebras deixou de ter faixa gratuita permanente).
- Sempre haverá resposta por causa do **banco local**. Para a melhor qualidade, use o **Cloudflare Workers AI** com token válido.