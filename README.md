# Capão Black — site oficial

Site da banda em React (Vite). A API em Express roda como função serverless na Vercel (`api/index.js`) e os dados ficam no Neon Postgres. Todo o conteúdo é editável pela área administrativa.

## Publicar na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Na Vercel: **Add New > Project** e importe o repositório (as configurações vêm do `vercel.json`).
3. Em **Storage**, crie um banco **Neon** (ou conecte um existente) e vincule ao projeto. Isso cria a variável `DATABASE_URL`.
4. Em **Settings > Environment Variables**, adicione `ADMIN_USER`, `ADMIN_PASSWORD` e `JWT_SECRET`.
   Para gerar o segredo: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
5. Faça o deploy. Na primeira requisição as tabelas são criadas e o conteúdo inicial é inserido.

### Levar o conteúdo já cadastrado localmente

Com a `DATABASE_URL` do Neon no `.env`:

```bash
npm run db:import    # copia server/data/db.json e server/uploads/ para o banco
```

As URLs das imagens (`/uploads/...`) continuam iguais.

## Rodando localmente

```bash
npm install
cp .env.example .env      # preencha DATABASE_URL, ADMIN_USER e ADMIN_PASSWORD
npm run dev               # site em http://localhost:5173 (API em :3001)
```

O ambiente local usa o banco indicado em `DATABASE_URL`. Para não mexer no conteúdo publicado, crie uma *branch* no Neon e use a URL dela no `.env`.

## Área administrativa

- Acesse `/admin` (link "área da banda" no rodapé) e entre com `ADMIN_USER` / `ADMIN_PASSWORD`.
  Sem `ADMIN_PASSWORD` configurado, o login fica desativado.
- Com o login ativo, **cada seção do site mostra um botão "Editar"** que abre um painel lateral.
  O painel `/admin` reúne as mesmas seções, as mensagens do formulário de contato e um resumo.

O que pode ser editado:

| Seção | Conteúdo |
|---|---|
| Configurações | nome, texto e foto do topo, botão principal, e-mail, redes sociais, rodapé |
| Lançamentos | álbuns/EPs/singles: capa, data, faixas, player do Spotify, outros links |
| Agenda | shows futuros (passados vão para "shows anteriores" automaticamente), status, ingressos |
| Biografia | texto, foto, ficha rápida |
| Integrantes | nome, função, foto (sem nome = oculto para visitantes) |
| Fotos da banda | envio múltiplo com legenda e ordem |
| Ao vivo | galerias de shows com data, local, crédito e fotos |
| Letras | letra, faixa, lançamento, créditos (sem texto = oculta para visitantes) |
| Merch | "em breve" / aberta / oculta, produtos com preço, foto, estoque e link de compra |
| Mensagens | caixa de entrada do formulário de contato |

Seções vazias (fotos de shows, letras) não aparecem para visitantes até ganharem conteúdo.

## Onde ficam os dados

Tudo no Neon Postgres (tabelas criadas automaticamente por `server/db.js`):

- `content` — cada seção do site, em JSON (conteúdo inicial em `server/seed.js`)
- `messages` — formulário de contato
- `images` — fotos enviadas pelo admin, servidas em `/uploads/<arquivo>` com cache na CDN da Vercel
- `attempts` — limite de tentativas de login e de envio de mensagens

As imagens são reduzidas no navegador antes do envio (máx. 2000 px, até ~4 MB), por causa do limite de 4,5 MB por requisição da Vercel.
O plano gratuito do Neon tem 0,5 GB, o que comporta algumas centenas de fotos.

## Imagens da banda

`npm run images` regenera, a partir de `imagens/`, o logo branco com transparência, o emblema
(usado no favicon e no cabeçalho) e a foto da banda em três tamanhos em `public/img/`.
