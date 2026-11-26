/* =========================================================
   RENNY COSMETICS — TOKO: PENCARIAN
   Kolom cari dan saran produk saat mengetik.
   ========================================================= */
'use strict';

// =========================================================
// PENCARIAN + SARAN
// =========================================================
let suggestTimer;
function closeSuggest() {
  const box = $('#suggest');
  box.hidden = true;
  $('#searchInput').setAttribute('aria-expanded', 'false');
}

function renderSuggest(q) {
  const box = $('#suggest');
  const t = q.toLowerCase().trim();
  if (t.length < 2) return closeSuggest();
  const terms = t.split(/\s+/);
  const brands = D.brands.filter((b) => b.id !== 'lainnya' && b.name.toLowerCase().includes(t)).slice(0, 3);
  const products = [];
  for (const p of NEWEST) {
    if (terms.every((x) => p._s.includes(x))) products.push(p);
    if (products.length >= 6) break;
  }
  if (!brands.length && !products.length) {
    box.innerHTML = `<p class="sg-empty">Tidak ada hasil untuk “${esc(q)}”</p>`;
  } else {
    box.innerHTML =
      brands.map((b) => `<a class="sg-row" href="#/produk?brand=${encodeURIComponent(b.id)}"><span class="sg-tag">Brand</span>${esc(b.name)}</a>`).join('') +
      products
        .map((p) => `<a class="sg-row" href="#/p/${encodeURIComponent(p.id)}"><span class="sg-thumb">${visual(p)}</span><span><small>${esc(brandName(p))}</small>${esc(p.name)}</span><b>${rupiah(p.price)}</b></a>`)
        .join('') +
      `<a class="sg-row sg-all" href="#/produk?q=${encodeURIComponent(q.trim())}">Lihat semua hasil untuk “${esc(q.trim())}”</a>`;
  }
  box.hidden = false;
  $('#searchInput').setAttribute('aria-expanded', 'true');
}
