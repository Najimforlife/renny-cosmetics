/* =========================================================
   RENNY COSMETICS — TOKO: HALAMAN LAIN
   Halaman semua brand, wishlist, dan bantuan (ongkir, pembayaran, FAQ).
   ========================================================= */
'use strict';

// =========================================================
// HALAMAN BRAND, WISHLIST, BANTUAN
// =========================================================
function brandsHTML() {
  const counts = countBy(ALL, 'brand');
  const list = D.brands.filter((b) => counts.get(b.id)).sort((a, b) => (a.id === 'lainnya' ? 1 : b.id === 'lainnya' ? -1 : a.name.localeCompare(b.name, 'id')));
  const groups = {};
  list.forEach((b) => {
    const k = b.id === 'lainnya' ? '#' : /[a-z]/i.test(b.name[0]) ? b.name[0].toUpperCase() : '#';
    (groups[k] = groups[k] || []).push(b);
  });
  const keys = Object.keys(groups).sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)));
  return `<div class="container page">
    <nav class="crumbs"><a href="#/">Beranda</a> / Brand</nav>
    <div class="page-head">
      <h1>Semua brand</h1>
      <p>${list.length.toLocaleString('id-ID')} brand tersedia di Renny Cosmetics.</p>
      <input type="search" class="input" id="brandSearch" placeholder="Cari brand, misal Wardah" aria-label="Cari brand">
    </div>
    <nav class="az" aria-label="Huruf">${keys.map((k) => `<a href="#/brand" data-jump="${k}">${k}</a>`).join('')}</nav>
    ${keys
      .map(
        (k) => `<section class="az-group" id="az-${k === '#' ? 'lain' : k}">
          <h2>${k}</h2>
          <div class="az-list">${groups[k].map((b) => `<a href="#/produk?brand=${encodeURIComponent(b.id)}" data-name="${esc(b.name.toLowerCase())}">${b.logo ? `<img src="${esc(b.logo)}" alt="" loading="lazy">` : ''}<span>${esc(b.name)}</span><span class="n">${counts.get(b.id)}</span></a>`).join('')}</div>
        </section>`
      )
      .join('')}
  </div>`;
}

function afterBrands() {
  $('#brandSearch').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    $$('.az-group').forEach((g) => {
      let any = false;
      $$('a[data-name]', g).forEach((a) => {
        const show = !q || a.dataset.name.includes(q);
        a.hidden = !show;
        any = any || show;
      });
      g.hidden = !any;
    });
  });
  $('.az').addEventListener('click', (e) => {
    const a = e.target.closest('[data-jump]');
    if (!a) return;
    e.preventDefault();
    const k = a.dataset.jump;
    document.getElementById('az-' + (k === '#' ? 'lain' : k))?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

function wishlistHTML() {
  const list = getWish().map((id) => byId.get(id)).filter((p) => p && p.active);
  return `<div class="container page">
    <nav class="crumbs"><a href="#/">Beranda</a> / Wishlist</nav>
    <div class="page-head"><h1>Wishlist</h1><p>Produk yang kamu simpan di browser ini.</p></div>
    ${list.length
      ? gridHTML(list)
      : `<div class="empty"><h2>Wishlist masih kosong</h2><p>Klik ikon hati di produk untuk menyimpan produk yang kamu incar.</p><a class="btn btn-primary" href="#/produk">Lihat produk</a></div>`}
  </div>`;
}

function helpHTML() {
  const s = settings();
  const faqs = D.faqs.filter((f) => f.visible);
  const ask = (t) => esc(wa(`Halo kak Renny Cosmetics, saya mau tanya soal ${t}.`));
  return `<div class="container page">
    <nav class="crumbs"><a href="#/">Beranda</a> / Bantuan</nav>
    <div class="page-head"><h1>Bantuan</h1><p>Semua yang perlu kamu tahu sebelum belanja.</p></div>
    <div class="help-grid">
      <div class="help-card">
        ${uiIcon('bag')}
        <h2>Cara belanja</h2>
        <ol>
          <li>Pilih produk lalu klik “+ Keranjang”.</li>
          <li>Buka keranjang, cek jumlah dan total.</li>
          <li>Klik “Lanjut pesan via WhatsApp”, isi nama dan cara terima.</li>
          <li>Admin membalas dengan konfirmasi stok, ongkir, dan cara bayar.</li>
        </ol>
      </div>
      <div class="help-card">
        ${uiIcon('truck')}
        <h2>Ongkos kirim</h2>
        ${s.shippingInfo ? `<p class="pre">${esc(s.shippingInfo)}</p>` : `<p>Ongkir dihitung sesuai alamat dan disampaikan admin saat konfirmasi pesanan. <a class="link" href="${ask('ongkir')}" target="_blank" rel="noopener">Tanya admin</a></p>`}
      </div>
      <div class="help-card">
        ${uiIcon('card')}
        <h2>Pembayaran</h2>
        ${s.paymentInfo ? `<p class="pre">${esc(s.paymentInfo)}</p>` : `<p>Cara pembayaran disampaikan admin saat konfirmasi pesanan. <a class="link" href="${ask('pembayaran')}" target="_blank" rel="noopener">Tanya admin</a></p>`}
      </div>
    </div>
    ${faqs.length ? `<section class="section">
      <h2 class="h2">Pertanyaan yang sering ditanyakan</h2>
      <div class="faq">${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p class="pre">${esc(f.a)}</p></details>`).join('')}</div>
    </section>` : ''}
    <p class="help-more">Pertanyaanmu belum terjawab? <a class="link" href="${esc(wa('Halo kak Renny Cosmetics, saya mau tanya.'))}" target="_blank" rel="noopener">Chat admin di WhatsApp</a></p>
  </div>`;
}

function notFoundHTML() {
  return `<div class="container page"><div class="empty"><h2>Halaman tidak ditemukan</h2><p>Produk atau halaman ini mungkin sudah tidak tersedia.</p><a class="btn btn-primary" href="#/produk">Lihat produk</a></div></div>`;
}

// ikon kecil UI
function uiIcon(name) {
  const paths = {
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    cap: '<path d="M2 9 12 4l10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    truck: '<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    store: '<path d="M4 9h16l-1-5H5z"/><path d="M5 9v11h14V9"/><path d="M10 20v-6h4v6"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.4A8 8 0 1 1 21 12z"/>',
    bag: '<path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',
  };
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.shield}</svg>`;
}
