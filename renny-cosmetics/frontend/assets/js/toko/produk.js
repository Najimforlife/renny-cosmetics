/* =========================================================
   RENNY COSMETICS — TOKO: DETAIL PRODUK
   Halaman detail satu produk.
   ========================================================= */
'use strict';

// =========================================================
// DETAIL PRODUK
// =========================================================
function productHTML(p) {
  const d = discount(p);
  const cat = catById.get(p.cat);
  const shades = p._base ? ALL.filter((x) => x.id !== p.id && x.brand === p.brand && x._base === p._base).slice(0, 30) : [];
  const shadeIds = new Set(shades.map((x) => x.id));
  const similar = ALL.filter((x) => x.id !== p.id && !shadeIds.has(x.id) && x.cat === p.cat && x.sub === p.sub && x.brand !== p.brand).slice(0, 12);
  const sameBrand = ALL.filter((x) => x.id !== p.id && !shadeIds.has(x.id) && x.brand === p.brand && p.brand !== 'lainnya').slice(0, 12);
  const recent = getRecent().map((id) => byId.get(id)).filter((x) => x && x.active && x.id !== p.id).slice(0, 12);
  const wished = getWish().includes(p.id);

  let stockText = 'Ketersediaan stok dikonfirmasi admin lewat WhatsApp.';
  let stockCls = '';
  if (p.stock === 0) (stockText = 'Stok habis. Tanyakan jadwal restock ke admin.'), (stockCls = 'out');
  else if (p.stock != null && p.stock <= 5) (stockText = `Stok tinggal ${p.stock}, segera pesan.`), (stockCls = 'low');
  else if (p.stock != null) (stockText = 'Stok tersedia.'), (stockCls = 'ok');

  const max = p.stock != null ? Math.max(1, p.stock) : 99;
  const shadeLabel = (x) => x.name.slice(p._base.length).replace(/^[\s\-–]+/, '') || x.name;

  return `<div class="container product-page">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a> / <a href="#/produk?kat=${p.cat}">${esc(cat ? cat.name : 'Produk')}</a>${p.sub ? ` / <a href="#/produk?kat=${p.cat}&sub=${encodeURIComponent(p.sub)}">${esc(p.sub)}</a>` : ''}</nav>
    <div class="pd">
      <div class="pd-media">${visual(p)}${d ? `<span class="tag-off">-${d}%</span>` : ''}</div>
      <div class="pd-info">
        <a class="pd-brand" href="#/produk?brand=${encodeURIComponent(p.brand)}">${esc(brandName(p))}</a>
        <h1 class="pd-name">${esc(p.name)}</h1>
        <div class="pd-meta">
          ${p.sub ? `<a class="chip chip-sm" href="#/produk?kat=${p.cat}&sub=${encodeURIComponent(p.sub)}">${esc(p.sub)}</a>` : ''}
          ${p.reviews > 0 ? `<span class="stars">★ ${Number(p.rating).toFixed(1)}</span><span>(${p.reviews} ulasan)</span>` : ''}
          <span class="pd-sku">Kode: ${esc(p.id)}</span>
        </div>
        <div class="pd-price">
          <strong>${rupiah(p.price)}</strong>
          ${d ? `<s>${rupiah(p.compare)}</s><span class="tag-off static">Hemat ${d}%</span>` : ''}
        </div>
        <p class="pd-stock ${stockCls}">${stockText}</p>

        ${shades.length ? `<div class="shades">
          <p class="shades-title">Pilihan lain (${shades.length + 1})</p>
          <div class="shade-list">
            <span class="shade on" aria-current="true">${esc(shadeLabel(p))}</span>
            ${shades.map((x) => `<a class="shade${x.stock === 0 ? ' out' : ''}" href="#/p/${encodeURIComponent(x.id)}">${esc(shadeLabel(x))}</a>`).join('')}
          </div>
        </div>` : ''}

        <div class="pd-actions">
          <div class="qty">
            <button type="button" data-step="-1" aria-label="Kurangi jumlah">−</button>
            <input id="pdQty" type="number" min="1" max="${max}" value="1" aria-label="Jumlah" ${p.stock === 0 ? 'disabled' : ''}>
            <button type="button" data-step="1" aria-label="Tambah jumlah">+</button>
          </div>
          <button type="button" class="btn btn-primary" id="pdAdd" ${p.stock === 0 ? 'disabled' : ''}>Masukkan keranjang</button>
          <button type="button" class="icon-btn wish-lg${wished ? ' on' : ''}" data-wish="${esc(p.id)}" aria-pressed="${wished}" aria-label="${wished ? 'Hapus dari' : 'Simpan ke'} wishlist">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-8.6C1.2 8.3 3 5 6.3 5c2 0 3.2 1.1 3.9 2.2h3.6C14.5 6.1 15.7 5 17.7 5 21 5 22.8 8.3 21.2 11.4 19 15.6 12 20 12 20z"/></svg>
          </button>
        </div>
        <a class="btn btn-wa btn-block" id="pdWa" target="_blank" rel="noopener" href="#">Beli langsung via WhatsApp</a>

        <ul class="pd-perks">
          <li>${uiIcon('shield')} Dijamin original</li>
          <li>${uiIcon('cap')} Diskon mahasiswa ITK</li>
          <li>${uiIcon('truck')} Ambil di toko atau dikirim</li>
        </ul>

        <div class="pd-desc">
          <h2>Deskripsi</h2>
          <p>${p.desc ? esc(p.desc) : 'Deskripsi lengkap belum tersedia. Mau tahu manfaat, kandungan, atau shade yang cocok? Tanyakan langsung ke admin lewat WhatsApp.'}</p>
          ${p.howto ? `<h2>Cara pakai</h2><p>${esc(p.howto)}</p>` : ''}
        </div>
      </div>
    </div>

    ${sameBrand.length ? `<section class="section">${sectionHead(`Produk lain dari ${brandName(p)}`, '', `#/produk?brand=${encodeURIComponent(p.brand)}`)}${scrollerHTML(sameBrand)}</section>` : ''}
    ${similar.length ? `<section class="section">${sectionHead(`${p.sub || 'Produk'} dari brand lain`, '', `#/produk?kat=${p.cat}&sub=${encodeURIComponent(p.sub)}`)}${scrollerHTML(similar)}</section>` : ''}
    ${recent.length ? `<section class="section">${sectionHead('Terakhir kamu lihat', '', null)}${scrollerHTML(recent)}</section>` : ''}
  </div>`;
}

function afterProduct(p) {
  addRecent(p.id);
  const input = $('#pdQty');
  const waBtn = $('#pdWa');
  const updateWa = () => {
    const qty = Math.max(1, Number(input.value) || 1);
    waBtn.href = wa(
      [
        'Halo kak Renny Cosmetics, saya mau beli:',
        '',
        `${brandName(p)} - ${p.name}`,
        `Kode: ${p.id}`,
        `${qty} x ${rupiah(p.price)} = ${rupiah(p.price * qty)}`,
        '',
        'Apakah stoknya ada?',
      ].join('\n')
    );
  };
  updateWa();
  input.addEventListener('input', updateWa);
  $('.pd-actions').addEventListener('click', (e) => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    const max = Number(input.max) || 99;
    input.value = Math.min(max, Math.max(1, (Number(input.value) || 1) + Number(b.dataset.step)));
    updateWa();
  });
  $('#pdAdd').addEventListener('click', () => addToCart(p.id, Math.max(1, Number(input.value) || 1)));
}
