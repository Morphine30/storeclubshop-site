const API_URL = window.API_URL || 'http://localhost:3000';
let produtos = [];

document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  initNavAtivo();
  initStickyHeader();
  initBusca();
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
    <div class="product-card" data-cat="${escHtml(p.categoria || '')}" data-oferta="${p.precoAntigo ? '1' : '0'}" onclick="window.location.href='produto.html?id=${p.id}'" style="cursor:pointer;">
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
  // sincroniza o destaque no menu de cima
  document.querySelectorAll('nav a').forEach(l =>
    l.classList.toggle('active', l.dataset.cat === cat));

  // limpa a busca ao trocar de categoria
  const input = document.querySelector('.search-bar input');
  if (input) input.value = '';

  document.querySelectorAll('.product-card').forEach(card => {
    let mostrar;
    if (cat === 'todos')        mostrar = true;
    else if (cat === 'ofertas') mostrar = card.dataset.oferta === '1';
    else                        mostrar = card.dataset.cat === cat;
    card.style.display = mostrar ? '' : 'none';
  });

  // esconde seções (Mais Vendidos / Novidades) que ficaram sem produto visível
  document.querySelectorAll('.products-grid').forEach(grid => {
    const secao = grid.closest('.section');
    if (!secao) return;
    const algumVisivel = [...grid.querySelectorAll('.product-card')]
      .some(c => c.style.display !== 'none');
    secao.style.display = algumVisivel ? '' : 'none';
  });

  // aviso quando nenhuma categoria corresponde
  const total = [...document.querySelectorAll('.product-card')]
    .filter(c => c.style.display !== 'none').length;
  mostrarAvisoVazio(total === 0, cat);
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
    const term = input.value.toLowerCase().trim();
    // ao buscar, volta o menu para "Todos os Produtos"
    if (term) {
      document.querySelectorAll('nav a').forEach(l => l.classList.remove('active'));
      document.querySelector('nav a[data-cat="todos"]')?.classList.add('active');
    }
    document.querySelectorAll('.product-card').forEach(card => {
      const nome = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('.product-desc')?.textContent.toLowerCase() || '';
      card.style.display = (!term || nome.includes(term) || desc.includes(term)) ? '' : 'none';
    });
    // reexibe/esconde seções conforme o que sobrou visível
    document.querySelectorAll('.products-grid').forEach(grid => {
      const secao = grid.closest('.section');
      if (!secao) return;
      const algumVisivel = [...grid.querySelectorAll('.product-card')]
        .some(c => c.style.display !== 'none');
      secao.style.display = algumVisivel ? '' : 'none';
    });
    const aviso = document.getElementById('semProdutos');
    if (aviso) aviso.style.display = 'none';
  }

  btn?.addEventListener('click', filtrar);
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
