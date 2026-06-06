const API_URL = window.API_URL || 'http://localhost:3000';
let produtos = [];
let carrinho = JSON.parse(localStorage.getItem('storyclub_carrinho') || '[]');

// ── Bootstrap ──
document.addEventListener('DOMContentLoaded', () => {
  injetarCartSidebar();
  bindCartBtn();
  carregarProdutos();
  atualizarBadge();
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
    // API offline: mantém HTML estático e só vincula eventos
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

  document.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', () => adicionarAoCarrinho(parseInt(btn.dataset.id)));
  });

  initScrollReveal();
}

function renderCard(p) {
  const imgSrc = p.imagem
    ? (p.imagem.startsWith('http') ? p.imagem : `${API_URL}${p.imagem}`)
    : null;
  const imgHtml = imgSrc
    ? `<img src="${imgSrc}" alt="${escHtml(p.nome)}">`
    : p.emoji || '📦';
  const stars = '★'.repeat(p.estrelas) + '☆'.repeat(Math.max(0, 5 - p.estrelas));

  return `
    <div class="product-card">
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
        ${p.parcelas ? `<div class="price-installment">ou ${escHtml(p.parcelas)}</div>` : ''}
        <button class="btn-buy" data-id="${p.id}">🛒 Comprar Agora</button>
      </div>
    </div>`;
}

// ── Carrinho ──
function adicionarAoCarrinho(id) {
  const produto = produtos.find(p => p.id === id);
  if (!produto) return;

  const idx = carrinho.findIndex(c => c.id === id);
  if (idx >= 0) carrinho[idx].quantidade++;
  else carrinho.push({ id, quantidade: 1 });

  salvarCarrinho();
  atualizarBadge();
  renderCarrinho();
  mostrarToast(`✅ ${produto.nome} adicionado!`);
}

function removerDoCarrinho(id) {
  carrinho = carrinho.filter(c => c.id !== id);
  salvarCarrinho();
  atualizarBadge();
  renderCarrinho();
}

function alterarQtd(id, delta) {
  const idx = carrinho.findIndex(c => c.id === id);
  if (idx === -1) return;
  carrinho[idx].quantidade += delta;
  if (carrinho[idx].quantidade <= 0) carrinho.splice(idx, 1);
  salvarCarrinho();
  atualizarBadge();
  renderCarrinho();
}

function salvarCarrinho() {
  localStorage.setItem('storyclub_carrinho', JSON.stringify(carrinho));
}

function atualizarBadge() {
  const total = carrinho.reduce((s, c) => s + c.quantidade, 0);
  document.querySelectorAll('.cart-badge').forEach(b => b.textContent = total);
}

function renderCarrinho() {
  const content = document.getElementById('cartContent');
  const empty   = document.getElementById('cartEmpty');
  const footer  = document.getElementById('cartFooter');

  if (carrinho.length === 0) {
    content.innerHTML = '';
    empty.classList.remove('hidden');
    footer.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  footer.classList.remove('hidden');

  content.innerHTML = carrinho.map(item => {
    const p = produtos.find(pr => pr.id === item.id);
    if (!p) return '';
    const cartImgSrc = p.imagem
      ? (p.imagem.startsWith('http') ? p.imagem : `${API_URL}${p.imagem}`)
      : null;
    const imgHtml = cartImgSrc
      ? `<img src="${cartImgSrc}" alt="${escHtml(p.nome)}">`
      : `<span class="cart-item-emoji">${p.emoji || '📦'}</span>`;

    return `
      <div class="cart-item">
        <div class="cart-item-img">${imgHtml}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${escHtml(p.nome)}</div>
          <div class="cart-item-price">R$${(p.preco * item.quantidade).toFixed(2).replace('.', ',')}</div>
          <div class="cart-item-controls">
            <button onclick="alterarQtd(${p.id}, -1)">−</button>
            <span>${item.quantidade}</span>
            <button onclick="alterarQtd(${p.id}, +1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removerDoCarrinho(${p.id})">✕</button>
      </div>`;
  }).join('');

  const total = carrinho.reduce((s, item) => {
    const p = produtos.find(pr => pr.id === item.id);
    return s + (p ? p.preco * item.quantidade : 0);
  }, 0);

  document.getElementById('cartTotalVal').textContent = `R$${total.toFixed(2).replace('.', ',')}`;
}

function abrirCarrinho() {
  renderCarrinho();
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharCarrinho() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Checkout MercadoPago ──
async function iniciarCheckout() {
  if (carrinho.length === 0) return;

  const btn = document.getElementById('btnCheckout');
  btn.textContent = '⏳ Aguarde...';
  btn.disabled = true;

  try {
    const itens = carrinho.map(item => {
      const p = produtos.find(pr => pr.id === item.id);
      return { id: p.id, nome: p.nome, preco: p.preco, quantidade: item.quantidade };
    });

    const res = await fetch(`${API_URL}/api/pagamento/criar-preferencia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens, urlBase: window.location.origin })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || 'Erro desconhecido');

    // sandbox_init_point para testes; mude para init_point em produção
    window.location.href = data.sandbox_init_point;
  } catch (err) {
    mostrarToast('❌ Erro ao abrir pagamento: ' + err.message, 'erro');
    btn.textContent = '💳 Finalizar Compra';
    btn.disabled = false;
  }
}

// ── Injetar cart sidebar no DOM ──
function injetarCartSidebar() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="cart-overlay" id="cartOverlay"></div>
    <div class="cart-sidebar" id="cartSidebar">
      <div class="cart-header">
        <h3>🛒 Carrinho</h3>
        <button class="cart-close" id="cartClose">✕</button>
      </div>
      <div class="cart-body">
        <div id="cartContent"></div>
        <div class="cart-empty hidden" id="cartEmpty">
          <div class="cart-empty-icon">🛒</div>
          <p>Seu carrinho está vazio</p>
          <a href="#produtos" id="cartVerProdutos">Ver Produtos</a>
        </div>
      </div>
      <div class="cart-footer hidden" id="cartFooter">
        <div class="cart-total-row">
          <span>Total:</span>
          <span id="cartTotalVal">R$0,00</span>
        </div>
        <button class="btn-checkout" id="btnCheckout" onclick="iniciarCheckout()">
          💳 Finalizar Compra
        </button>
      </div>
    </div>
    <div class="toast-container" id="toastContainer"></div>
  `);

  document.getElementById('cartClose').addEventListener('click', fecharCarrinho);
  document.getElementById('cartOverlay').addEventListener('click', fecharCarrinho);
  document.getElementById('cartVerProdutos')?.addEventListener('click', fecharCarrinho);
}

function bindCartBtn() {
  document.querySelector('.cart-btn')?.addEventListener('click', e => {
    e.preventDefault();
    abrirCarrinho();
  });
}

function bindBotoesComprar() {
  document.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.textContent = '✅ Adicionado!';
      btn.style.background = '#00c44f';
      setTimeout(() => { btn.textContent = '🛒 Comprar Agora'; btn.style.background = ''; }, 1500);
    });
  });
}

// ── Toast ──
function mostrarToast(msg, tipo = 'ok') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
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
