# Alvorada do Céu ✧

Plataforma de conteúdo espiritual: gerador de imagens com frase, carrosséis para o feed e vídeo reels com narração — pronto para postar no Instagram.

## Estrutura

```
├── public/              # site (publicado no Netlify)
│   ├── index.html       # gerador de imagem + carrossel + reels
│   ├── reels.html       # estúdio de reels/carrosséis
│   ├── 404.html
│   ├── css/
│   └── js/
├── netlify/
│   └── functions/
│       └── api.mjs      # API serverless (substitui o server.js na nuvem)
├── server.js            # servidor local (Node, sem dependências além do TTS)
├── netlify.toml         # configuração de deploy Netlify
├── .env                 # segredos locais (NÃO vai para o git nem para o Netlify)
└── .env.example
```

## Rodar localmente

```bash
npm install
node server.js
# abra http://localhost:8001
```

## Hospedar no Netlify

1. Suba este repositório para o GitHub (o `.env` já está no `.gitignore` — nunca suba ele).
2. No [app.netlify.com](https://app.netlify.com): **Add new site → Import an existing project** e selecione o repo.
3. As configurações já vêm prontas pelo `netlify.toml` (publish = `public`, functions incluídas).
4. Configure as variáveis de ambiente em **Site configuration → Environment variables**:

| Variável | Obrigatória? | Para quê |
|---|---|---|
| `CF_ACCOUNT_ID` | sim | Imagens IA (Cloudflare FLUX) e texto IA |
| `CF_API_TOKEN` | sim | Idem |
| `PEXELS_API_KEY` | recomendado | Fotos/vídeos reais Pexels |
| `PIXABAY_API_KEY` | recomendado | Fotos/vídeos reais Pixabay |
| `FREE_AI_TOKEN` | opcional | Fonte extra de imagem |
| `G4F_URL` | opcional | Servidor g4f externo |

5. Deploy. Pronto — o site chama `/api/*`, que roda como função serverless.

> Sem nenhuma chave configurada o site ainda funciona: as fontes de imagem caem automaticamente para o Pollinations (gratuito) e depois para um gradiente local.

## Segurança

- A pasta publicada é apenas `public/` — código servidor e segredos ficam fora do ar.
- Headers de segurança (CSP, X-Frame-Options, etc.) aplicados via `netlify.toml`.
- Proxies de mídia só aceitam URLs dos CDNs permitidos (Pexels/Pixabay) — sem SSRF.
- Rate limit por IP nas rotas de IA (40 req/min local; por instância no Netlify).
- Timeout de 45s em todas as chamadas de API no navegador (sem travamentos).

## Downloads

Tudo é gerado no navegador (canvas + MediaRecorder): PNGs de slides, ZIP do carrossel (JSZip) e vídeo WebM/MP4. Nenhum arquivo passa pelo servidor.
