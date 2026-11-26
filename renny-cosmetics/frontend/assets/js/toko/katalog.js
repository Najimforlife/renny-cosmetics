/* =========================================================
   RENNY COSMETICS — TOKO: KATALOG
   Daftar produk dengan filter kategori, jenis, brand, harga, dan urutan.
   ========================================================= */
'use strict';

// =========================================================
// KATALOG
// =========================================================
function readFilters(params) {
  const num = (v) => (v !== null && v !== '' && !isNaN(Number(v)) ? Number(v) : null);
  return {
    q: (params.get('q') || '').trim(),
    kat: params.get('kat') || '',
    sub: params.get('sub') || '',
    brand: params.get('brand') || '',
    min: num(params.get('min')),
    max: num(params.get('max')),
    diskon: params.get('diskon') === '1',
    unggulan: params.get('unggulan') === '1',
    urut: params.get('urut') || 'terbaru',
    hal: Math.max(1, parseInt(params.get('hal'), 10) || 1),
  };
}

function applyFilters(f, skip = {}) {
  const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  return ALL.filter((p) => {
    if (!skip.kat && f.kat && p.cat !== f.kat) return false;
    if (!skip.sub && f.sub && p.sub !== f.sub) return false;
    if (!skip.brand && f.brand && p.brand !== f.brand) return false;
    if (f.min != null && p.price < f.min) return false;
    if (f.max != null && p.price > f.max) return false;
    if (f.diskon && !(p.compare > p.price)) return false;
    if (f.unggulan && !p.featured) return false;
    for (const t of terms) if (!p._s.includes(t)) return false;
    return true;
  });
}

function hrefWith(f, patch) {
  const n = Object.assign({}, f, patch);
  if (!('hal' in patch)) n.hal = 1;
  const sp = new URLSearchParams();
  if (n.q) sp.set('q', n.q);
  if (n.kat) sp.set('kat', n.kat);
  if (n.sub) sp.set('sub', n.sub);
  if (n.brand) sp.set('brand', n.brand);
  if (n.min != null) sp.set('min', n.min);
  if (n.max != null) sp.set('max', n.max);
  if (n.diskon) sp.set('diskon', '1');
  if (n.unggulan) sp.set('unggulan', '1');
  if (n.urut && n.urut !== 'terbaru') sp.set('urut', n.urut);
  if (n.hal > 1) sp.set('hal', n.hal);
  const qs = sp.toString();
  return '#/produk' + (qs ? '?' + qs : '');
}

const SORTERS = {
  terbaru: (a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0),
  termurah: (a, b) => a.price - b.price,
  termahal: (a, b) => b.price - a.price,
  az: (a, b) => a.name.localeCompare(b.name, 'id'),
  diskon: (a, b) => discount(b) - discount(a),
};

function countBy(list, key) {
  const m = new Map();
  list.forEach((p) => m.set(p[key], (m.get(p[key]) || 0) + 1));
  return m;
}

function catalogHTML(params) {
  const f = readFilters(params);
  const results = applyFilters(f).sort(SORTERS[f.urut] || SORTERS.terbaru);
  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const page = Math.min(f.hal, totalPages);
  const pageItems = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const catCounts = countBy(applyFilters(f, { kat: true, sub: true }), 'cat');
  const subCounts = f.kat ? countBy(applyFilters(f, { sub: true }), 'sub') : new Map();
  const brandCounts = countBy(applyFilters(f, { brand: true }), 'brand');
  const brandList = [...brandCounts.entries()]
    .map(([id, n]) => ({ id, n, name: (brandById.get(id) || {}).name || 'Tanpa brand' }))
    .sort((a, b) => b.n - a.n);

  const cat = catById.get(f.kat);
  const brand = brandById.get(f.brand);
  const heading = f.q ? `Hasil pencarian “${f.q}”` : brand ? brand.name : f.sub || (cat ? cat.name : f.unggulan ? 'Pilihan Renny' : f.diskon ? 'Produk diskon' : 'Semua produk');

  const chips = [
    f.q && ['q', `“${f.q}”`],
    cat && ['kat', cat.name],
    f.sub && ['sub', f.sub],
    brand && ['brand', brand.name],
    f.min != null && ['min', `Min ${rupiah(f.min)}`],
    f.max != null && ['max', `Maks ${rupiah(f.max)}`],
    f.diskon && ['diskon', 'Sedang diskon'],
    f.unggulan && ['unggulan', 'Pilihan Renny'],
  ].filter(Boolean);

  const pager = () => {
    if (totalPages <= 1) return '';
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
      else if (pages[pages.length - 1] !== '…') pages.push('…');
    }
    return `<nav class="pager" aria-label="Halaman">
      ${page > 1 ? `<a href="${hrefWith(f, { hal: page - 1 })}" aria-label="Halaman sebelumnya">‹</a>` : '<span class="off">‹</span>'}
      ${pages.map((n) => (n === '…' ? '<span class="dots">…</span>' : `<a href="${hrefWith(f, { hal: n })}" ${n === page ? 'aria-current="page" class="on"' : ''}>${n}</a>`)).join('')}
      ${page < totalPages ? `<a href="${hrefWith(f, { hal: page + 1 })}" aria-label="Halaman berikutnya">›</a>` : '<span class="off">›</span>'}
    </nav>`;
  };

  return `<div class="container catalog-page">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a> / <a href="#/produk">Produk</a>${cat ? ` / <a href="#/produk?kat=${cat.id}">${esc(cat.name)}</a>` : ''}${f.sub ? ` / ${esc(f.sub)}` : ''}</nav>
    <div class="catalog-head">
      <div>
        <h1>${esc(heading)}</h1>
        <p>${results.length.toLocaleString('id-ID')} produk${cat && !f.sub && !f.q ? ` · ${esc(cat.desc || '')}` : ''}</p>
      </div>
      <div class="catalog-tools">
        <button type="button" class="btn btn-ghost btn-sm filter-open" id="filterOpen">Filter</button>
        <label class="sort">Urutkan
          <select id="sortSelect">
            ${[['terbaru', 'Terbaru'], ['termurah', 'Harga terendah'], ['termahal', 'Harga tertinggi'], ['diskon', 'Diskon terbesar'], ['az', 'Nama A–Z']]
              .map(([v, l]) => `<option value="${v}" ${f.urut === v ? 'selected' : ''}>${l}</option>`)
              .join('')}
          </select>
        </label>
      </div>
    </div>

    <div class="catalog-grid">
      <aside class="filters" id="filters" aria-label="Filter produk">
        <div class="filters-head">
          <h2>Filter</h2>
          <button type="button" class="icon-btn" id="filterClose" aria-label="Tutup filter">✕</button>
        </div>

        <div class="fgroup">
          <h3>Kategori</h3>
          <a class="fopt${!f.kat ? ' on' : ''}" href="${hrefWith(f, { kat: '', sub: '' })}">Semua kategori</a>
          ${D.categories
            .filter((c) => catCounts.get(c.id) || f.kat === c.id)
            .map((c) => `<a class="fopt${f.kat === c.id ? ' on' : ''}" href="${hrefWith(f, { kat: c.id, sub: '' })}"><span>${esc(c.name)}</span><span class="n">${(catCounts.get(c.id) || 0).toLocaleString('id-ID')}</span></a>`)
            .join('')}
        </div>

        ${subCounts.size > 1 || f.sub ? `
        <div class="fgroup">
          <h3>Jenis</h3>
          <a class="fopt${!f.sub ? ' on' : ''}" href="${hrefWith(f, { sub: '' })}">Semua jenis</a>
          ${[...subCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([sub, n]) => `<a class="fopt${f.sub === sub ? ' on' : ''}" href="${hrefWith(f, { sub })}"><span>${esc(sub)}</span><span class="n">${n.toLocaleString('id-ID')}</span></a>`)
            .join('')}
        </div>` : ''}

        <div class="fgroup">
          <h3>Brand</h3>
          <input type="search" class="input input-sm" id="brandFilter" placeholder="Cari brand" aria-label="Cari brand di filter">
          <div class="brand-opts" id="brandOpts">
            <a class="fopt${!f.brand ? ' on' : ''}" href="${hrefWith(f, { brand: '' })}">Semua brand</a>
            ${brandList
              .map((b, i) => `<a class="fopt${f.brand === b.id ? ' on' : ''}${i >= 12 && f.brand !== b.id ? ' more' : ''}" data-name="${esc(b.name.toLowerCase())}" href="${hrefWith(f, { brand: b.id })}"><span>${esc(b.name)}</span><span class="n">${b.n.toLocaleString('id-ID')}</span></a>`)
              .join('')}
          </div>
          ${brandList.length > 12 ? `<button type="button" class="link-btn" id="brandMore">Lihat semua (${brandList.length})</button>` : ''}
        </div>

        <form class="fgroup" id="priceForm">
          <h3>Harga</h3>
          <div class="price-row">
            <input class="input input-sm" type="number" name="min" min="0" step="1000" inputmode="numeric" placeholder="Min" aria-label="Harga minimum" value="${f.min ?? ''}">
            <span>–</span>
            <input class="input input-sm" type="number" name="max" min="0" step="1000" inputmode="numeric" placeholder="Maks" aria-label="Harga maksimum" value="${f.max ?? ''}">
          </div>
          <div class="price-quick">
            ${[[0, 50000, '< 50rb'], [50000, 100000, '50–100rb'], [100000, 200000, '100–200rb'], [200000, null, '> 200rb']]
              .map(([a, b, l]) => `<a class="chip chip-sm" href="${hrefWith(f, { min: a || null, max: b })}">${l}</a>`)
              .join('')}
          </div>
          <label class="check"><input type="checkbox" name="diskon" ${f.diskon ? 'checked' : ''}> Sedang diskon</label>
          <button type="submit" class="btn btn-primary btn-sm btn-block">Terapkan</button>
        </form>
        <a class="btn btn-ghost btn-sm btn-block" href="#/produk">Reset semua filter</a>
      </aside>

      <div>
        ${chips.length ? `<div class="chips">${chips.map(([k, l]) => `<a class="chip on" href="${hrefWith(f, { [k]: k === 'min' || k === 'max' ? null : k === 'diskon' || k === 'unggulan' ? false : '', ...(k === 'kat' ? { sub: '' } : {}) })}">${esc(l)} ✕</a>`).join('')}</div>` : ''}
        ${pageItems.length
          ? gridHTML(pageItems) + pager()
          : `<div class="empty">
              <h2>Produk tidak ditemukan</h2>
              <p>Coba kata kunci lain atau kurangi filter. Produk yang kamu cari mungkin ada di toko, tanyakan ke admin.</p>
              <div class="btn-row center">
                <a class="btn btn-ghost" href="#/produk">Lihat semua produk</a>
                <a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(wa(`Halo kak, ada produk ${f.q || ''} nggak?`))}">Tanya via WhatsApp</a>
              </div>
            </div>`}
      </div>
    </div>
  </div>`;
}

function afterCatalog(params) {
  const f = readFilters(params);
  $('#sortSelect').addEventListener('change', (e) => go(hrefWith(f, { urut: e.target.value })));
  $('#priceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const n = (v) => (v === '' || v == null ? null : Math.max(0, Number(v)));
    go(hrefWith(f, { min: n(fd.get('min')), max: n(fd.get('max')), diskon: fd.get('diskon') === 'on' }));
  });
  const opts = $('#brandOpts');
  const more = $('#brandMore');
  let expanded = false;
  more?.addEventListener('click', () => {
    expanded = !expanded;
    opts.classList.toggle('expanded', expanded);
    more.textContent = expanded ? 'Tampilkan lebih sedikit' : `Lihat semua (${$$('.fopt[data-name]', opts).length})`;
  });
  $('#brandFilter').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    opts.classList.toggle('searching', !!q);
    $$('.fopt[data-name]', opts).forEach((a) => (a.hidden = q && !a.dataset.name.includes(q)));
  });
  const panel = $('#filters');
  $('#filterOpen').addEventListener('click', () => panel.classList.add('open'));
  $('#filterClose').addEventListener('click', () => panel.classList.remove('open'));
}
