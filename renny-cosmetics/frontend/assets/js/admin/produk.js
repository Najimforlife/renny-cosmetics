/* =========================================================
   RENNY COSMETICS — ADMIN: PRODUK
   CRUD produk, filter, aksi massal, upload foto.
   ========================================================= */
'use strict';

// =========================================================
// PRODUK
// =========================================================
const prodState = { q: '', cat: '', brand: '', status: '', page: 1, selected: new Set() };

function filteredProducts() {
  const st = prodState;
  const terms = st.q.toLowerCase().split(/\s+/).filter(Boolean);
  return PRODUCTS.filter((p) => {
    if (st.cat && p.cat !== st.cat) return false;
    if (st.brand && p.brand !== st.brand) return false;
    switch (st.status) {
      case 'aktif': if (!p.active) return false; break;
      case 'nonaktif': if (p.active) return false; break;
      case 'unggulan': if (!p.featured) return false; break;
      case 'flash': if (!p.flash) return false; break;
      case 'diskon': if (!(p.compare > p.price)) return false; break;
      case 'foto': if (p.img) return false; break;
      case 'adafoto': if (!p.img) return false; break;
      case 'stok0': if (p.stock !== 0) return false; break;
    }
    if (terms.length) {
      const s = `${p.name} ${brandName(p.brand)} ${p.id} ${p.sub}`.toLowerCase();
      for (const t of terms) if (!s.includes(t)) return false;
    }
    return true;
  });
}

function viewProducts(el) {
  const st = prodState;
  el.innerHTML =
    head('Produk', `${PRODUCTS.length.toLocaleString('id-ID')} produk di database. Data awal dari daftar item iPOS.`, '<button type="button" class="btn btn-primary" id="addProduct">+ Tambah produk</button>') +
    `<div class="panel">
      <div class="toolbar">
        <input type="search" class="input input-sm" id="pq" placeholder="Cari nama, brand, atau kode barang" value="${esc(st.q)}" aria-label="Cari produk">
        <select class="input input-sm" id="pcat" aria-label="Filter kategori"><option value="">Semua kategori</option>${CATS.map((c) => `<option value="${esc(c.id)}" ${st.cat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        <select class="input input-sm" id="pbrand" aria-label="Filter brand"><option value="">Semua brand</option>${[...BRANDS].sort((a, b) => a.name.localeCompare(b.name)).map((b) => `<option value="${esc(b.id)}" ${st.brand === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select>
        <select class="input input-sm" id="pstatus" aria-label="Filter status">
          ${[['', 'Semua status'], ['aktif', 'Aktif'], ['nonaktif', 'Nonaktif'], ['unggulan', 'Pilihan Renny'], ['flash', 'Ikut flash sale'], ['diskon', 'Ada harga coret'], ['foto', 'Belum ada foto'], ['adafoto', 'Sudah ada foto'], ['stok0', 'Stok habis']]
            .map(([v, l]) => `<option value="${v}" ${st.status === v ? 'selected' : ''}>${l}</option>`)
            .join('')}
        </select>
      </div>
      <div class="bulk" id="bulk" hidden>
        <span id="bulkCount"></span>
        <button type="button" class="btn btn-ghost btn-sm" data-bulk="aktif">Aktifkan</button>
        <button type="button" class="btn btn-ghost btn-sm" data-bulk="nonaktif">Nonaktifkan</button>
        <button type="button" class="btn btn-ghost btn-sm" data-bulk="unggulan">Jadikan Pilihan Renny</button>
        <button type="button" class="btn btn-ghost btn-sm" data-bulk="bukan-unggulan">Hapus dari Pilihan Renny</button>
        <button type="button" class="btn btn-ghost btn-sm danger" data-bulk="hapus">Hapus</button>
        <button type="button" class="link-btn" data-bulk="clear">Batal pilih</button>
      </div>
      <div id="ptable"></div>
    </div>`;

  const rerender = () => {
    st.page = 1;
    renderProductTable();
  };
  let t;
  $('#pq').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => ((st.q = e.target.value.trim()), rerender()), 250);
  });
  $('#pcat').addEventListener('change', (e) => ((st.cat = e.target.value), rerender()));
  $('#pbrand').addEventListener('change', (e) => ((st.brand = e.target.value), rerender()));
  $('#pstatus').addEventListener('change', (e) => ((st.status = e.target.value), rerender()));
  $('#addProduct').addEventListener('click', () => editProduct(null));
  $('#bulk').addEventListener('click', onBulk);
  $('#ptable').addEventListener('click', onProductTableClick);
  el.addEventListener('change', (e) => {
    if (e.target.matches('[data-sel]')) {
      e.target.checked ? st.selected.add(e.target.dataset.sel) : st.selected.delete(e.target.dataset.sel);
      updateBulk();
    } else if (e.target.id === 'selAll') {
      $$('[data-sel]', el).forEach((c) => {
        c.checked = e.target.checked;
        e.target.checked ? st.selected.add(c.dataset.sel) : st.selected.delete(c.dataset.sel);
      });
      updateBulk();
    }
  });
  renderProductTable();
}

function updateBulk() {
  const n = prodState.selected.size;
  $('#bulk').hidden = !n;
  $('#bulkCount').textContent = `${n} produk dipilih`;
}

function renderProductTable() {
  const st = prodState;
  const list = filteredProducts().sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0));
  const total = Math.max(1, Math.ceil(list.length / PER_PAGE));
  st.page = Math.min(st.page, total);
  const rows = list.slice((st.page - 1) * PER_PAGE, st.page * PER_PAGE);
  $('#ptable').innerHTML = `
    <p class="table-info">${list.length.toLocaleString('id-ID')} produk cocok</p>
    <div class="table-wrap">
      <table class="table">
        <thead><tr>
          <th class="w-check"><input type="checkbox" id="selAll" aria-label="Pilih semua di halaman ini"></th>
          <th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th><span class="sr-only">Aksi</span></th>
        </tr></thead>
        <tbody>
          ${rows
            .map((p) => {
              const d = discount(p);
              return `<tr class="${p.active ? '' : 'row-off'}">
                <td class="w-check"><input type="checkbox" data-sel="${esc(p.id)}" ${st.selected.has(p.id) ? 'checked' : ''} aria-label="Pilih ${esc(p.name)}"></td>
                <td><div class="prod-cell"><div class="thumb">${visual(p)}</div><div><strong>${esc(p.name)}</strong><small>${esc(brandName(p.brand))} · ${esc(p.id)}</small></div></div></td>
                <td><span>${esc(catName(p.cat))}</span><small>${esc(p.sub)}</small></td>
                <td class="nowrap"><strong>${rupiah(p.price)}</strong>${d ? `<small><s>${rupiah(p.compare)}</s> −${d}%</small>` : ''}</td>
                <td>${p.stock == null ? '<span class="muted" title="Dikonfirmasi lewat WhatsApp">—</span>' : p.stock === 0 ? '<span class="bad">Habis</span>' : p.stock}</td>
                <td><div class="badges">
                  <span class="b ${p.active ? 'b-ok' : 'b-off'}">${p.active ? 'Aktif' : 'Nonaktif'}</span>
                  ${p.featured ? '<span class="b b-pink">Pilihan</span>' : ''}
                  ${p.flash ? '<span class="b b-dark">Flash</span>' : ''}
                </div></td>
                <td><div class="row-actions">
                  <button type="button" class="btn btn-ghost btn-sm" data-edit="${esc(p.id)}">Edit</button>
                  <button type="button" class="btn btn-ghost btn-sm danger" data-del="${esc(p.id)}">Hapus</button>
                </div></td>
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>
    ${rows.length ? '' : '<p class="table-empty">Tidak ada produk yang cocok. Ubah kata kunci atau filter.</p>'}
    ${pagerHTML(st.page, total, 'data-page')}`;
  updateBulk();
}

async function onProductTableClick(e) {
  const b = e.target.closest('[data-edit],[data-del],[data-page]');
  if (!b) return;
  if (b.dataset.edit) return editProduct(byId.get(b.dataset.edit));
  if (b.dataset.page) {
    prodState.page = Number(b.dataset.page);
    renderProductTable();
    return $('#ptable').scrollIntoView({ block: 'start' });
  }
  const p = byId.get(b.dataset.del);
  if (!(await confirmBox('Hapus produk?', `${brandName(p.brand)} ${p.name} akan dihapus dari website. Data di iPOS tidak terpengaruh. Kalau hanya ingin disembunyikan, pilih "Nonaktifkan".`))) return;
  try {
    await api(`admin/produk.php?id=${encodeURIComponent(p.id)}`, { method: 'DELETE' });
    PRODUCTS = PRODUCTS.filter((x) => x.id !== p.id);
    byId.delete(p.id);
    prodState.selected.delete(p.id);
    renderProductTable();
    toast('Produk dihapus');
  } catch (err) {
    toastErr(err);
  }
}

async function onBulk(e) {
  const b = e.target.closest('[data-bulk]');
  if (!b) return;
  const ids = [...prodState.selected];
  const op = b.dataset.bulk;
  if (op === 'clear') {
    prodState.selected.clear();
    return renderProductTable();
  }
  if (op === 'hapus' && !(await confirmBox('Hapus produk terpilih?', `${ids.length} produk akan dihapus dari website.`))) return;
  try {
    const r = await api('admin/produk.php?action=massal', { method: 'POST', body: { ids, op } });
    ids.forEach((id) => {
      const p = byId.get(id);
      if (!p) return;
      if (op === 'aktif') p.active = true;
      if (op === 'nonaktif') p.active = false;
      if (op === 'unggulan') p.featured = true;
      if (op === 'bukan-unggulan') p.featured = false;
      if (op === 'hapus') byId.delete(id);
    });
    if (op === 'hapus') PRODUCTS = PRODUCTS.filter((p) => byId.has(p.id));
    prodState.selected.clear();
    renderProductTable();
    toast(r.message);
  } catch (err) {
    toastErr(err);
  }
}

function editProduct(p) {
  const isNew = !p;
  p = p || { id: '', name: '', brand: '', cat: CATS[0]?.id || 'skincare', sub: '', price: '', compare: 0, stock: null, img: '', desc: '', howto: '', active: true, featured: false, flash: false, rating: 0, reviews: 0 };
  let img = p.img;
  const subsOf = (cat) => [...new Set(PRODUCTS.filter((x) => x.cat === cat).map((x) => x.sub).filter(Boolean))].sort();

  openForm({
    title: isNew ? 'Tambah produk' : 'Edit produk',
    submit: isNew ? 'Simpan produk' : 'Simpan perubahan',
    wide: true,
    body: `<div class="form-grid">
      <div class="field">
        <label for="f-id">Kode barang (sama dengan iPOS)</label>
        <input id="f-id" name="id" value="${esc(p.id)}" ${isNew ? '' : 'readonly'} placeholder="Contoh: 8993137743198">
        <p class="hint">${isNew ? 'Pakai kode/barcode yang sama dengan iPOS supaya stok bisa disinkronkan.' : 'Kode tidak bisa diubah.'}</p>
      </div>
      <div class="field">
        <label for="f-brand">Brand</label>
        <input id="f-brand" name="brand" list="brandList" value="${esc(p.brand ? brandName(p.brand) : '')}" placeholder="Ketik atau pilih brand">
        <datalist id="brandList">${BRANDS.map((b) => `<option value="${esc(b.name)}">`).join('')}</datalist>
        <p class="hint">Brand baru otomatis ditambahkan.</p>
      </div>
      <div class="field span-2">
        <label for="f-name">Nama produk (tanpa nama brand)</label>
        <input id="f-name" name="name" value="${esc(p.name)}" maxlength="200" placeholder="Contoh: 5X Ceramide Barrier Repair Moisture Gel 30g">
      </div>
      <div class="field">
        <label for="f-cat">Kategori</label>
        <select id="f-cat" name="cat">${CATS.map((c) => `<option value="${esc(c.id)}" ${p.cat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label for="f-sub">Jenis</label>
        <input id="f-sub" name="sub" list="subList" value="${esc(p.sub)}" placeholder="Contoh: Serum">
        <datalist id="subList">${subsOf(p.cat).map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
      </div>
      <div class="field">
        <label for="f-price">Harga jual (Rp)</label>
        <input id="f-price" name="price" type="number" min="0" inputmode="numeric" value="${p.price === '' ? '' : p.price}">
      </div>
      <div class="field">
        <label for="f-compare">Harga coret (Rp)</label>
        <input id="f-compare" name="compare" type="number" min="0" inputmode="numeric" value="${p.compare || ''}" placeholder="Kosongkan kalau tidak diskon">
      </div>
      <div class="field">
        <label for="f-stock">Stok</label>
        <input id="f-stock" name="stock" type="number" min="0" inputmode="numeric" value="${p.stock == null ? '' : p.stock}" placeholder="Kosong = konfirmasi via WA">
        <p class="hint">Kosongkan kalau stok tidak dilacak di website.</p>
      </div>
      <div class="field">
        <span class="label">Rating & jumlah ulasan</span>
        <div class="two">
          <input name="rating" type="number" min="0" max="5" step="0.1" value="${p.rating || ''}" placeholder="4.8" aria-label="Rating">
          <input name="reviews" type="number" min="0" value="${p.reviews || ''}" placeholder="0" aria-label="Jumlah ulasan">
        </div>
        <p class="hint">Isi hanya dari ulasan asli pembeli. Kosong = tidak tampil.</p>
      </div>
      <div class="field span-2">
        <span class="label">Foto produk</span>
        <div class="img-input">
          <div class="img-preview" id="imgPreview"></div>
          <div class="img-controls">
            <label class="btn btn-ghost btn-sm">Upload foto<input type="file" id="f-file" accept="image/*" hidden></label>
            <input type="hidden" name="img" id="f-img" value="${esc(img)}">
            <p class="hint" id="imgStatus">${img ? 'Foto sudah ada.' : 'Belum ada foto. Website memakai ilustrasi otomatis.'}</p>
            <button type="button" class="link-btn" id="imgRemove">Hapus foto</button>
          </div>
        </div>
      </div>
      <div class="field span-2">
        <label for="f-desc">Deskripsi</label>
        <textarea id="f-desc" name="desc" rows="4" placeholder="Manfaat, kandungan utama, cocok untuk jenis kulit apa">${esc(p.desc)}</textarea>
      </div>
      <div class="field span-2">
        <label for="f-howto">Cara pakai</label>
        <textarea id="f-howto" name="howto" rows="2">${esc(p.howto)}</textarea>
      </div>
      <div class="field span-2 checks">
        <label class="check"><input type="checkbox" name="active" ${p.active ? 'checked' : ''}> Aktif (tampil di toko)</label>
        <label class="check"><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}> Pilihan Renny (tampil di beranda)</label>
        <label class="check"><input type="checkbox" name="flash" ${p.flash ? 'checked' : ''}> Ikut flash sale (wajib ada harga coret)</label>
      </div>
    </div>`,
    onOpen: (form) => {
      const prev = () => {
        $('#imgPreview').innerHTML = visual({ ...p, img, brand: p.brand || 'x', cat: form.elements.cat.value });
        $('#imgRemove').hidden = !img;
        $('#f-img').value = img;
      };
      prev();
      $('#f-file').addEventListener('change', async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        $('#imgStatus').textContent = 'Mengupload...';
        try {
          img = await uploadImage(f, 'produk');
          $('#imgStatus').textContent = 'Foto terupload. Klik simpan untuk menerapkan.';
          prev();
        } catch (err) {
          $('#imgStatus').textContent = err.message;
        }
        e.target.value = '';
      });
      $('#imgRemove').addEventListener('click', () => {
        img = '';
        $('#imgStatus').textContent = 'Foto dihapus. Klik simpan untuk menerapkan.';
        prev();
      });
      form.elements.cat.addEventListener('change', (e) => {
        $('#subList').innerHTML = subsOf(e.target.value).map((s) => `<option value="${esc(s)}">`).join('');
        prev();
      });
    },
    onSubmit: async (d) => {
      const body = { ...d, compare: d.compare || 0, rating: d.rating || 0, reviews: d.reviews || 0 };
      const r = isNew
        ? await api('admin/produk.php', { method: 'POST', body })
        : await api(`admin/produk.php?id=${encodeURIComponent(p.id)}`, { method: 'PUT', body });
      if (!BRANDS.some((b) => b.name.toLowerCase() === String(d.brand).trim().toLowerCase())) BRANDS = (await api('admin/brand.php')).brands;
      putProduct(r.product);
      if ($('#ptable')) renderProductTable();
      toast(r.message);
    },
  });
}
