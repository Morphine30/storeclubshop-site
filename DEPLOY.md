# Guia de Deploy — Story Club Shop (frontend)

Site **estático puro** (HTML/CSS/JS, sem build). Pasta de publicação: a raiz (`publish = "."`).

> ⚠️ O **backend** (API) é outro projeto, hospedado no Render: `https://minha-api-a6zk.onrender.com`.
> Este guia é só do **frontend** (a loja que o cliente vê).

---

## 1. Deploy normal (o jeito do dia a dia) — via Git/Netlify

Sempre que alterar arquivos do frontend:

```bash
cd "C:/Users/Morph/Desktop/storyclubshop-site_backup"
git add <arquivo>          # ex: git add style.css   (NÃO usar "git add ." sem cuidado)
git commit -m "descricao da mudanca"
git push origin main
```

O Netlify detecta o push e **redeploya sozinho em ~1 min**.
Conferir em: https://app.netlify.com → site `storyclub` → aba **Deploys**.

Depois de publicar, recarregar a loja com **Ctrl+F5** (PC) ou limpando cache no celular.

---

## 2. Deploy MANUAL (drag-and-drop) — plano B sem gastar build

Use quando o build do Netlify estiver pausado (limite do mês) ou o Git der problema.
**Não consome minutos de build.**

1. Acesse https://app.netlify.com e faça login.
2. Clique no site **storyclub**.
3. Vá na aba **Deploys**.
4. **Arraste a pasta inteira** `storyclubshop-site_backup` para a área que diz
   *"Drag and drop your site output folder here"*.
5. Pronto — publica na hora, sem build.

> Dica: antes de arrastar, garanta que `config.js` aponta pra API de produção
> (já faz isso automaticamente: usa Render quando não está em localhost).

---

## 3. Migração para Cloudflare Pages (banda ILIMITADA, grátis)

Plano de fuga definitivo se o Netlify ficar apertado. Cloudflare Pages tem
**banda ilimitada** no grátis — ideal pra loja com muito acesso.

### Opção A — conectando ao GitHub (recomendado, vira automático igual Netlify)

1. Crie/entre na conta em https://dash.cloudflare.com
2. Menu lateral: **Workers & Pages** → **Create application** → aba **Pages**.
3. **Connect to Git** → autorize o GitHub → escolha o repositório
   `Morphine30/storeclubshop-site`.
4. Configurações de build:
   - **Production branch:** `main`
   - **Build command:** *(deixar em branco — não tem build)*
   - **Build output directory:** `/`  (raiz)
5. **Save and Deploy**. Em ~1 min sai uma URL tipo
   `https://storeclubshop-site.pages.dev`.
6. A partir daí, **todo `git push` na main publica no Cloudflare também** (automático).

### Opção B — upload manual (sem Git)

1. **Workers & Pages** → **Create application** → **Pages** → **Upload assets**.
2. Arraste a pasta `storyclubshop-site_backup`.
3. Publica na hora.

### Apontar o domínio / trocar o link

- A URL nova será `*.pages.dev`. Para usar o mesmo endereço de antes, é só
  divulgar a URL do Cloudflare, OU
- Se tiver domínio próprio: **Pages → Custom domains → Set up a domain**.

### IMPORTANTE depois de migrar — liberar CORS no backend

O backend (Render) só aceita requisições do `FRONTEND_URL` cadastrado.
Se o endereço da loja mudar (ex: `*.pages.dev`), precisa atualizar no Render:

1. https://dashboard.render.com → serviço `minha-api`.
2. **Environment** → variável **`FRONTEND_URL`** → trocar para a nova URL
   (ex: `https://storeclubshop-site.pages.dev`).
3. Salvar → o Render reinicia sozinho.

Sem isso, a loja abre mas **não carrega os produtos** (bloqueio de CORS).

---

## Resumo rápido

| Situação | O que fazer |
|---|---|
| Mudança normal | `git push` → Netlify redeploya sozinho |
| Build do Netlify pausado | Arrastar pasta no Netlify (Deploys) |
| Netlify apertando de vez | Migrar pro Cloudflare Pages (banda ilimitada) |
| Trocou a URL da loja | Atualizar `FRONTEND_URL` no Render (senão CORS bloqueia) |

---

## Recursos (changelog)

- **Hero editável pelo admin:** no painel admin há a seção "⭐ Destaques do Hero" — escolha quais 3 produtos aparecem no banner inicial + a etiqueta de cada um (o 1º é o card grande, mostra o preço).
  - ⚠️ Exige o **backend deployado** (rota `/api/destaques`). Enquanto o backend não estiver atualizado, a home mantém os 3 cards fixos como fallback (não quebra).
  - Não precisa de nova variável de ambiente. A coleção `destaques` é criada sozinha no MongoDB no primeiro salvamento.
- **Fotos das categorias editáveis pelo admin:** seção "📸 Fotos das Categorias" no painel — suba uma foto por categoria (substitui o emoji nas cards da home). Usa Cloudinary (pasta `storeclubshop/categorias`). Rota `/api/categorias`. Sem foto = mantém o emoji. Exige backend deployado.
- **Filtro/ordenação na home:** menu "Ordenar por" (relevância, menor/maior preço, mais recentes, melhor avaliados) + slider de preço mín–máx. Tudo frontend.
- **Selos de confiança** na página do produto (abaixo do botão Comprar).
- **CORS multi-URL:** `FRONTEND_URL` no Render aceita várias URLs separadas por vírgula.
