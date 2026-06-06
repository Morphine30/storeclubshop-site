// ─────────────────────────────────────────────────────────────────
//  Após fazer deploy no Render, substitua a URL abaixo pela sua.
//  Em localhost funciona automaticamente sem precisar mudar nada.
// ─────────────────────────────────────────────────────────────────
window.API_URL = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
) ? 'http://localhost:3000' : 'https://SUA-API.onrender.com';
