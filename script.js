const API_URL = window.API_URL || 'http://localhost:3000';
let produtos = [];

document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  initNavAtivo();
  initStickyHeader();
  initBusca();
});

// ── Carregar produtos da API ──
async function carregarProdutos() {
  try {
    const res = await fetch(`${API_URL}/api/produtos`);
    if (!res.ok) throw new Error();
    produtos = await res.json();
    renderizarGrades();
  } catch {
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
    <div class="product-card" onclick="window.location.href='produto.html?id=${p.id}'" style="cursor:pointer;">
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

// ── Nav ativo ──
function initNavAtivo() {
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('nav a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
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
    document.querySelectorAll('.product-card').forEach(card => {
      const nome = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('.product-desc')?.textContent.toLowerCase() || '';
      card.style.display = (!term || nome.includes(term) || desc.includes(term)) ? '' : 'none';
    });
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
