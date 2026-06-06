# Story Club Shop — Frontend

Site de e-commerce de produtos virais. Produtos dinâmicos, carrinho completo e checkout com MercadoPago.

## Stack

- **Frontend:** HTML5 + CSS3 + JavaScript (vanilla)
- **Fontes:** Google Fonts (Bebas Neue, Barlow Condensed, Barlow)
- **Servidor de dev:** Live Server (VS Code)
- **Deploy:** Netlify

## Funcionalidades

### Site principal (`index.html`)
- Produtos carregados dinamicamente da API
- Fallback para HTML estático se a API estiver offline
- Busca em tempo real por nome ou descrição
- Carrinho persistente (localStorage) com sidebar animada
- Controles de quantidade por item no carrinho
- Checkout integrado com MercadoPago (redireciona para pagamento)
- Notificações toast ao adicionar produtos
- Scroll reveal suave nos cards

### Painel admin (`admin.html`)
- Lista todos os produtos cadastrados no banco
- Formulário para adicionar novo produto
- Upload de imagem com preview antes de salvar
- Edição completa de qualquer produto
- Exclusão com confirmação
- Modo edição/adição com troca automática

## Estrutura de arquivos

```
storeclubshop-site/
├── index.html       # Site principal
├── admin.html       # Painel de administração
├── style.css        # Estilos globais + cart sidebar + toast
├── script.js        # Produtos dinâmicos, carrinho, checkout
├── config.js        # URL da API (auto-detecta local vs produção)
├── netlify.toml     # Configuração de deploy e headers de segurança
└── README.md
```

## Como rodar localmente

**Pré-requisitos:** VS Code com extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) instalada e a API rodando em `localhost:3000`.

1. Clone o repositório:
```bash
git clone https://github.com/SEU_USUARIO/storeclubshop-site.git
```

2. Abra a pasta no VS Code

3. Clique em **Go Live** (canto inferior direito)

4. O site abre em `http://127.0.0.1:5500`

> O `config.js` detecta automaticamente que está em localhost e usa `http://localhost:3000` como API. Não é necessário nenhuma configuração adicional para desenvolvimento.

## Configuração para produção

Após fazer o deploy da API no Render, edite o arquivo `config.js`:

```js
// Substitua pela URL real do seu serviço no Render
window.API_URL = ... : 'https://SUA-API.onrender.com';
```

Depois envie a atualização:
```bash
git add config.js
git commit -m "configurar URL da API"
git push
```

O Netlify republica automaticamente em 1–2 minutos.

## Deploy no Netlify

1. Suba este repositório no GitHub (visibilidade: **Public**)
2. Acesse [app.netlify.com](https://app.netlify.com)
3. Clique em **Add new site → Import an existing project**
4. Conecte ao GitHub e selecione `storeclubshop-site`
5. Configure:
   - **Build command:** *(deixe vazio)*
   - **Publish directory:** `.`
6. Clique em **Deploy site**

O site estará no ar em menos de 2 minutos.

## Variáveis da API esperadas

O frontend consome os seguintes endpoints da API:

| Endpoint | Uso |
|---|---|
| `GET /api/produtos` | Carrega os produtos nas grades |
| `POST /api/produtos` | Admin — adiciona produto |
| `PUT /api/produtos/:id` | Admin — atualiza produto |
| `DELETE /api/produtos/:id` | Admin — remove produto |
| `POST /api/pagamento/criar-preferencia` | Checkout MercadoPago |

## Tema visual

| Variável | Valor | Uso |
|---|---|---|
| `--verde` | `#00ff6a` | Destaque principal, preços, botões |
| `--amarelo` | `#ffe600` | Subtítulos hero |
| `--laranja` | `#ff6a00` | Badges de produto |
| `--dark` | `#0a0a0a` | Background |
| `--card` | `#141414` | Cards de produto |

## Licença

MIT
