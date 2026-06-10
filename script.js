const API_URL = window.API_URL || 'http://localhost:3000';
let produtos = [];
let categoriasDB = [];   // categorias vindas de /api/categorias

// estado unificado de filtros (categoria + busca + preço + ordem)
const filtros = { categoria: 'todos', busca: '', precoMin: 0, precoMax: Infinity, ordem: 'padrao' };

document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  initNavAtivo();
  initStickyHeader();
  initBusca();
  initOrdenacao();
});

// ── Overlay "servidor acordando" ──
const MENSAGENS = [
  'Carregando os produtos... 🛒',
  'Buscando as melhores ofertas... 🔍',
  'Separando os itens mais virais... 🔥',
  'Preparando tudo pra você... ✨',
  'Quase lá... ⚡',
  'Só mais um instante... 📦',
];
let _overlayTimer = null, _msgTimer = null, _fillTimer = null, _msgIdx = 0;

function mostrarOverlay() {
  const el = document.getElementById('serverOverlay');
  if (!el) return;
  el.style.display = 'flex';
  _msgIdx = 0;
  document.getElementById('overlayMsg').textContent = MENSAGENS[0];

  let pct = 5;
  document.getElementById('overlayFill').style.width = pct + '%';

  _fillTimer = setInterval(() => {
    pct = Math.min(pct + (Math.random() * 4), 92);
    document.getElementById('overlayFill').style.width = pct + '%';
  }, 900);

  _msgTimer = setInterval(() => {
    _msgIdx = (_msgIdx + 1) % MENSAGENS.length;
    const msgEl = document.getElementById('overlayMsg');
    msgEl.style.opacity = '0';
    setTimeout(() => {
      msgEl.textContent = MENSAGENS[_msgIdx];
      msgEl.style.opacity = '1';
    }, 400);
  }, 3500);
}

function esconderOverlay() {
  clearInterval(_fillTimer);
  clearInterval(_msgTimer);
  const el = document.getElementById('serverOverlay');
  if (!el) return;
  document.getElementById('overlayFill').style.width = '100%';
  setTimeout(() => { el.style.display = 'none'; }, 500);
}

// ── Carregar produtos da API ──
async function carregarProdutos() {
  _overlayTimer = setTimeout(mostrarOverlay, 1500);
  try {
    const res = await fetch(`${API_URL}/api/produtos`);
    clearTimeout(_overlayTimer);
    esconderOverlay();
    if (!res.ok) throw new Error();
    produtos = await res.json();
    renderizarGrades();
    carregarDestaques();
    carregarCategorias();
  } catch {
    clearTimeout(_overlayTimer);
    esconderOverlay();
    bindBotoesComprar();
    initScrollReveal();
  }
}

function renderizarGrades() {
  const grids = document.querySelectorAll('.products-grid');
  const maisVendidos = produtos.filter(p => p.secao === 'mais-vendidos');
  const novidades    = produtos.filter(p => p.secao === 'novidades');

  if (grids[0]) grids[0].innerHTML = maisVendidos.map(renderCard).join('');
  if (grids[1]) grids[1].innerHTML = novidades.map(renderCard).join('');

  // guarda a posição original de cada card (usada na ordem "Relevância")
  document.querySelectorAll('.products-grid').forEach(grid => {
    [...grid.querySelectorAll('.product-card')].forEach((c, i) => c.dataset.pos = i);
  });

  atualizarContagemCategorias();
  configurarPrecoSlider();
  aplicarFiltros();
  initScrollReveal();
}

function renderCard(p) {
  const imgSrc = p.imagem
    ? (p.imagem.startsWith('http') ? p.imagem : `${API_URL}${p.imagem}`)
    : null;

  const imgHtml = imgSrc
    ? `<img src="${imgSrc.replace(/"/g, '%22')}" alt="${escHtml(p.nome)}">`
    : `<div class="card-emoji">${escHtml(p.emoji || '📦')}</div>`;

  const stars = '★'.repeat(p.estrelas) + '☆'.repeat(Math.max(0, 5 - p.estrelas));

  const linkAttr = p.linkPagamento
    ? `href="${p.linkPagamento.replace(/"/g, '%22')}" target="_blank" rel="noopener"`
    : `href="#" onclick="return false"`;

  return `
    <div class="product-card" data-cat="${escHtml(p.categoria || '')}" data-oferta="${p.precoAntigo ? '1' : '0'}" data-preco="${p.preco}" data-aval="${p.avaliacoes || 0}" data-id="${p.id}" onclick="window.location.href='produto.html?id=${p.id}'" style="cursor:pointer;">
      <div class="product-img">
        ${imgHtml}
        ${p.badge    ? `<span class="badge-hot">${escHtml(p.badge)}</span>`    : ''}
        ${p.badgeOff ? `<span class="badge-off">${escHtml(p.badgeOff)}</span>` : ''}
      </div>
      <div class="product-info">
        <div class="product-name">${escHtml(p.nome)}</div>
        <div class="product-desc">${escHtml(p.descricao)}</div>
        <div class="product-stars">${stars}<span>(${p.avaliacoes})</span></div>
        <div class="product-price">
          <span class="price-main">R$${p.preco.toFixed(2).replace('.', ',')}</span>
          ${p.precoAntigo ? `<span class="price-old">R$${p.precoAntigo.toFixed(2).replace('.', ',')}</span>` : ''}
        </div>
        <a class="btn-buy" ${linkAttr} onclick="event.stopPropagation()">🛒 Comprar Agora</a>
      </div>
    </div>`;
}

// ── Destaques do hero (configuráveis no admin) ──
async function carregarDestaques() {
  try {
    const res = await fetch(`${API_URL}/api/destaques`);
    if (!res.ok) return;
    const destaques = await res.json();
    renderHero(destaques);
  } catch { /* mantém o hero fixo do HTML se falhar */ }
}

function renderHero(destaques) {
  const wrap = document.getElementById('heroVisual');
  if (!wrap || !Array.isArray(destaques) || !destaques.length) return;

  // garante os 3 slots em ordem
  const slots = [0, 1, 2].map(slot =>
    destaques.find(d => d.slot === slot) || { slot, produtoId: null, tag: '' });

  // resolve o produto escolhido de cada slot
  const resolvidos = slots.map(d => ({ d, p: produtos.find(x => x.id === d.produtoId) || null }));

  // preenche slots vazios com produtos ainda não usados (hero sempre com 3 cards)
  const usados = new Set(resolvidos.filter(r => r.p).map(r => r.p.id));
  const restantes = produtos.filter(p => !usados.has(p.id));
  let ri = 0;
  resolvidos.forEach(r => { if (!r.p && restantes[ri]) r.p = restantes[ri++]; });

  const cards = resolvidos.map(({ d, p }) => {
    if (!p) return '';
    const big   = d.slot === 0 ? ' big' : '';
    const img   = p.imagem
      ? `<img src="${p.imagem.replace(/"/g, '%22')}" alt="${escHtml(p.nome)}">`
      : `<div class="card-emoji">${escHtml(p.emoji || '📦')}</div>`;
    const tag   = d.tag ? `<span class="tag">${escHtml(d.tag)}</span>` : '';
    const preco = d.slot === 0 ? `<span class="price-tag">R$${Math.round(p.preco)}</span>` : '';
    return `<div class="hero-card${big}" onclick="window.location.href='produto.html?id=${p.id}'" style="cursor:pointer;">${img}${tag}${preco}</div>`;
  });

  if (cards.some(c => c)) wrap.innerHTML = cards.join('');
}

// ── Categorias dinâmicas (menu + cards, configuráveis no admin) ──
async function carregarCategorias() {
  try {
    const res = await fetch(`${API_URL}/api/categorias`);
    if (res.ok) categoriasDB = await res.json();
  } catch { /* sem config: mantém o HTML estático como fallback */ }

  const cats = listaCategoriasSite();
  if (!cats.length) return;   // nada pra montar: mantém o HTML fixo (já vinculado no load)

  renderNav(cats);
  renderCatCards(cats);
  initNavAtivo();                 // religa os cliques nos elementos recém-criados
  atualizarContagemCategorias();  // aplica contagem e esconde categorias vazias
}

// Emojis-padrão das categorias legadas (usados enquanto não houver emoji/foto no banco)
const EMOJIS_PADRAO = {
  'Coleção Copa': '🏆', 'Beleza': '💄', 'Bem-Estar': '💪',
  'Eletrodomésticos': '🏠', 'Eletrônicos': '⚡', 'Casa e Cozinha': '🍳', 'Geral': '📦'
};

// Lista = categorias do banco + categorias que já existem nos produtos (nada some)
function listaCategoriasSite() {
  const map = new Map();
  categoriasDB.forEach(c => map.set(c.nome, {
    nome: c.nome, emoji: c.emoji || EMOJIS_PADRAO[c.nome] || '🏷️',
    imagem: c.imagem || null, ordem: c.ordem || 0
  }));
  produtos.forEach(p => {
    if (p.categoria && !map.has(p.categoria)) {
      map.set(p.categoria, {
        nome: p.categoria, emoji: EMOJIS_PADRAO[p.categoria] || '🏷️', imagem: null, ordem: 0
      });
    }
  });
  return [...map.values()].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));
}

function renderNav(cats) {
  const nav = document.querySelector('.nav-inner');
  if (!nav) return;
  const ativo = nav.querySelector('a.active')?.dataset.cat || 'todos';
  const links = cats.map(c =>
    `<a href="#produtos" data-cat="${escHtml(c.nome)}">${escHtml(c.nome)}</a>`).join('');
  nav.innerHTML =
    `<a href="#produtos" data-cat="todos">Todos os Produtos</a>` +
    links +
    `<a href="#produtos" data-cat="ofertas">Ofertas 🔥</a>`;
  // mantém o destaque na categoria que estava ativa
  nav.querySelectorAll('a').forEach(a =>
    a.classList.toggle('active', a.dataset.cat === ativo));
}

function renderCatCards(cats) {
  const grid = document.querySelector('.categories-grid');
  if (!grid) return;
  grid.innerHTML = cats.map(c => {
    const icon = c.imagem
      ? `<span class="cat-icon cat-icon-img"><img src="${c.imagem.replace(/"/g, '%22')}" alt="${escHtml(c.nome)}"></span>`
      : `<span class="cat-icon">${escHtml(c.emoji)}</span>`;
    return `<a href="#produtos" class="cat-card" data-cat="${escHtml(c.nome)}">${icon}<div class="cat-name">${escHtml(c.nome)}</div><div class="cat-count">0 produtos</div></a>`;
  }).join('');
}

function bindBotoesComprar() {
  document.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.textContent = '✅ Redirecionando...';
      setTimeout(() => { btn.textContent = '🛒 Comprar Agora'; }, 1500);
    });
  });
}

// ── Scroll reveal ──
function initScrollReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.product-card, .cat-card, .promo-banner').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity .5s ${(i % 4) * 80}ms ease, transform .5s ${(i % 4) * 80}ms ease`;
    obs.observe(el);
  });
}

// ── Nav ativo + filtro por categoria ──
function initNavAtivo() {
  // barra superior + cards da seção "Nossas Categorias"
  document.querySelectorAll('nav a[data-cat], .cat-card[data-cat]').forEach(el => {
    el.addEventListener('click', () => filtrarCategoria(el.dataset.cat));
  });
}

function filtrarCategoria(cat) {
  filtros.categoria = cat;
  filtros.busca = '';
  const input = document.querySelector('.search-bar input');
  if (input) input.value = '';
  // sincroniza o destaque no menu de cima
  document.querySelectorAll('nav a').forEach(l =>
    l.classList.toggle('active', l.dataset.cat === cat));
  aplicarFiltros();
}

// ── Aplica TODOS os filtros + ordenação de uma vez ──
function aplicarFiltros() {
  const term = filtros.busca.toLowerCase().trim();

  document.querySelectorAll('.products-grid').forEach(grid => {
    const cards = [...grid.querySelectorAll('.product-card')];

    // 1) visibilidade: categoria + busca + faixa de preço
    cards.forEach(card => {
      const cat = filtros.categoria;
      let okCat;
      if (cat === 'todos')        okCat = true;
      else if (cat === 'ofertas') okCat = card.dataset.oferta === '1';
      else                        okCat = card.dataset.cat === cat;

      const nome = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('.product-desc')?.textContent.toLowerCase() || '';
      const okBusca = !term || nome.includes(term) || desc.includes(term);

      const preco = parseFloat(card.dataset.preco) || 0;
      const okPreco = preco >= filtros.precoMin && preco <= filtros.precoMax;

      card.style.display = (okCat && okBusca && okPreco) ? '' : 'none';
    });

    // 2) ordenação (reordena os cards no DOM)
    cards.sort((a, b) => {
      switch (filtros.ordem) {
        case 'menor-preco': return (+a.dataset.preco) - (+b.dataset.preco);
        case 'maior-preco': return (+b.dataset.preco) - (+a.dataset.preco);
        case 'recentes':    return (+b.dataset.id)    - (+a.dataset.id);
        case 'avaliados':   return (+b.dataset.aval)  - (+a.dataset.aval);
        default:            return (+a.dataset.pos)   - (+b.dataset.pos); // Relevância = ordem original
      }
    }).forEach(c => grid.appendChild(c));

    // 3) esconde seção sem nenhum produto visível
    const secao = grid.closest('.section');
    if (secao) {
      const algum = cards.some(c => c.style.display !== 'none');
      secao.style.display = algum ? '' : 'none';
    }
  });

  // aviso quando nada corresponde
  const total = [...document.querySelectorAll('.product-card')]
    .filter(c => c.style.display !== 'none').length;
  mostrarAvisoVazio(total === 0, filtros.categoria);
}

// ── Menu "Ordenar por" ──
function initOrdenacao() {
  const sel = document.getElementById('ordenarPor');
  sel?.addEventListener('change', () => { filtros.ordem = sel.value; aplicarFiltros(); });
}

// ── Slider de preço (mín–máx) ──
function configurarPrecoSlider() {
  const elMin  = document.getElementById('precoMin');
  const elMax  = document.getElementById('precoMax');
  const label  = document.getElementById('precoLabel');
  const trilho = document.getElementById('precoTrilho');
  if (!elMin || !elMax) return;

  const precos = produtos.map(p => p.preco).filter(n => Number.isFinite(n));
  if (!precos.length) return;
  const min = Math.floor(Math.min(...precos));
  const max = Math.ceil(Math.max(...precos));

  [elMin, elMax].forEach(el => { el.min = min; el.max = max; el.step = 1; });
  elMin.value = min;
  elMax.value = max;
  filtros.precoMin = min;
  filtros.precoMax = max;

  function atualizar() {
    const lo = Math.min(+elMin.value, +elMax.value);
    const hi = Math.max(+elMin.value, +elMax.value);
    filtros.precoMin = lo;
    filtros.precoMax = hi;
    if (label) label.textContent = `R$${lo} – R$${hi}`;
    // preenche o trilho entre os dois thumbs
    if (trilho && max > min) {
      trilho.style.left  = ((lo - min) / (max - min) * 100) + '%';
      trilho.style.right = (100 - (hi - min) / (max - min) * 100) + '%';
    }
    aplicarFiltros();
  }
  elMin.addEventListener('input', atualizar);
  elMax.addEventListener('input', atualizar);
  atualizar();
}

// ── Contagem real de produtos por categoria ──
function atualizarContagemCategorias() {
  const contagem = {};
  produtos.forEach(p => {
    if (p.categoria) contagem[p.categoria] = (contagem[p.categoria] || 0) + 1;
  });

  // cards da seção "Nossas Categorias"
  document.querySelectorAll('.cat-card[data-cat]').forEach(card => {
    const n = contagem[card.dataset.cat] || 0;
    const el = card.querySelector('.cat-count');
    if (el) el.textContent = `${n} produto${n === 1 ? '' : 's'}`;
    card.style.display = n === 0 ? 'none' : '';   // esconde categoria sem produto
  });

  // menu superior: esconde categorias reais sem produto (mantém Todos/Ofertas)
  document.querySelectorAll('nav a[data-cat]').forEach(link => {
    const cat = link.dataset.cat;
    if (cat === 'todos' || cat === 'ofertas') return;
    link.style.display = (contagem[cat] || 0) === 0 ? 'none' : '';
  });
}

function mostrarAvisoVazio(vazio, cat) {
  let aviso = document.getElementById('semProdutos');
  if (!aviso) {
    aviso = document.createElement('div');
    aviso.id = 'semProdutos';
    aviso.style.cssText = 'text-align:center;padding:60px 20px;color:var(--muted);font-size:16px;';
    const ref = document.getElementById('produtos');
    if (ref) ref.parentNode.insertBefore(aviso, ref);
  }
  aviso.textContent = `Nenhum produto na categoria "${cat}" ainda. 😉`;
  aviso.style.display = vazio ? 'block' : 'none';
}

// ── Smooth scroll ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ── Sticky header ──
function initStickyHeader() {
  window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    header.style.boxShadow = window.scrollY > 10 ? '0 4px 24px rgba(0,0,0,.6)' : 'none';
  });
}

// ── Busca ──
function initBusca() {
  const input = document.querySelector('.search-bar input');
  const btn   = document.querySelector('.search-bar .search-btn');

  function filtrar() {
    filtros.busca = input.value;
    // ao buscar, volta o menu para "Todos os Produtos"
    if (input.value.trim()) {
      filtros.categoria = 'todos';
      document.querySelectorAll('nav a').forEach(l =>
        l.classList.toggle('active', l.dataset.cat === 'todos'));
    }
    aplicarFiltros();
  }

  btn?.addEventListener('click', filtrar);
  input?.addEventListener('input', filtrar);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') filtrar(); });
}

// ── Util ──
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
