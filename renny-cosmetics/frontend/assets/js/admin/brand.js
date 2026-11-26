/* =========================================================
   RENNY COSMETICS — ADMIN: BRAND
   CRUD brand dan upload logo.
   ========================================================= */
'use strict';

// =========================================================
// BRAND & LOGO
// =========================================================
const brandState = { q: '', filter: '', page: 1 };

function viewBrands(el) {
  el.innerHTML =
    head('Brand & logo', 'Brand yang punya logo tampil paling depan di deretan brand beranda. Belum ada logo? Nama brand yang tampil.', '<button type="button" class="btn btn-primary" id="addBrand">+ Tambah brand</button>') +
    `<div class="panel">
      <div class="toolbar">
        <input type="search" class="input input-sm" id="bq" placeholder="Cari brand" value="${esc(brandState.q)}" aria-label="Cari brand">
        <select class="input input-sm" id="bf" aria-label="Filter logo">
          <option value="">Semua brand</option>
          <option value="logo" ${brandState.filter === 'logo' ? 'selected' : ''}>Sudah ada logo</option>
          <option value="nologo" ${brandState.filter === 'nologo' ? 'selected' : ''}>Belum ada logo</option>
        </select>
      </div>
      <div id="btable"></div>
    </div>`;
  let t;
  $('#bq').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => ((brandState.q = e.target.value.trim().toLowerCase()), (brandState.page = 1), renderBrandTable()), 200);
  });
  $('#bf').addEventListener('change', (e) => ((brandState.filter = e.target.value), (brandState.page = 1), renderBrandTable()));
  $('#addBrand').addEventListener('click', () => editBrand(null));
  $('#btable').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-edit],[data-del],[data-bpage]');
    if (!b) return;
    if (b.dataset.bpage) {
      brandState.page = Number(b.dataset.bpage);
      return renderBrandTable();
    }
    const brand = BRANDS.find((x) => x.id === (b.dataset.edit || b.dataset.del));
    if (b.dataset.edit) return editBrand(brand);
    if (!(await confirmBox('Hapus brand?', `Brand ${brand.name} akan dihapus.`))) return;
    try {
      const r = await api(`admin/brand.php?id=${encodeURIComponent(brand.id)}`, { method: 'DELETE' });
      BRANDS = r.brands;
      renderBrandTable();
      toast(r.message);
    } catch (err) {
      toastErr(err);
    }
  });
  renderBrandTable();
}

function renderBrandTable() {
  const list = BRANDS.filter((b) => (!brandState.q || b.name.toLowerCase().includes(brandState.q)) && (!brandState.filter || (brandState.filter === 'logo' ? b.logo : !b.logo)));
  const total = Math.max(1, Math.ceil(list.length / PER_PAGE));
  brandState.page = Math.min(brandState.page, total);
  const rows = list.slice((brandState.page - 1) * PER_PAGE, brandState.page * PER_PAGE);
  $('#btable').innerHTML = `<p class="table-info">${list.length} brand · urut dari produk terbanyak</p>
    <div class="table-wrap"><table class="table">
      <thead><tr><th>Logo</th><th>Brand</th><th>Produk</th><th><span class="sr-only">Aksi</span></th></tr></thead>
      <tbody>${rows
        .map(
          (b) => `<tr>
        <td><div class="logo-cell">${b.logo ? `<img src="${esc(b.logo)}" alt="Logo ${esc(b.name)}">` : '<span>Belum ada</span>'}</div></td>
        <td><strong>${esc(b.name)}</strong></td>
        <td>${Number(b.count).toLocaleString('id-ID')}</td>
        <td><div class="row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-edit="${esc(b.id)}">${b.logo ? 'Edit' : 'Upload logo'}</button>
          <button type="button" class="btn btn-ghost btn-sm danger" data-del="${esc(b.id)}">Hapus</button>
        </div></td>
      </tr>`
        )
        .join('')}</tbody>
    </table></div>
    ${rows.length ? '' : '<p class="table-empty">Brand tidak ditemukan.</p>'}
    ${pagerHTML(brandState.page, total, 'data-bpage')}`;
}

function editBrand(b) {
  const isNew = !b;
  b = b || { id: '', name: '', logo: '' };
  let logo = b.logo;
  openForm({
    title: isNew ? 'Tambah brand' : `Edit brand ${b.name}`,
    body: `<div class="field"><label for="b-name">Nama brand</label><input id="b-name" name="name" value="${esc(b.name)}" maxlength="80"></div>
      <div class="field"><span class="label">Logo</span>
        <div class="img-input">
          <div class="logo-preview" id="logoPrev"></div>
          <div class="img-controls">
            <label class="btn btn-ghost btn-sm">Upload logo<input type="file" id="b-file" accept="image/svg+xml,image/png,image/webp,image/jpeg" hidden></label>
            <input type="hidden" name="logo" id="b-logo">
            <button type="button" class="link-btn" id="logoRemove">Hapus logo</button>
            <p class="hint" id="logoStatus">Paling bagus file SVG (tajam di semua ukuran), atau PNG latar transparan. Pakai logo resmi dari brand/distributor.</p>
          </div>
        </div>
      </div>`,
    onOpen: () => {
      const prev = () => {
        $('#logoPrev').innerHTML = logo ? `<img src="${esc(logo)}" alt="Pratinjau logo">` : '<span>Belum ada logo</span>';
        $('#logoRemove').hidden = !logo;
        $('#b-logo').value = logo;
      };
      prev();
      $('#b-file').addEventListener('change', async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        $('#logoStatus').textContent = 'Mengupload...';
        try {
          logo = await uploadImage(f, 'logo');
          $('#logoStatus').textContent = 'Logo terupload. Klik Simpan.';
          prev();
        } catch (err) {
          $('#logoStatus').textContent = err.message;
        }
        e.target.value = '';
      });
      $('#logoRemove').addEventListener('click', () => ((logo = ''), prev()));
    },
    onSubmit: async (d) => {
      const r = await api(isNew ? 'admin/brand.php' : `admin/brand.php?id=${encodeURIComponent(b.id)}`, { method: isNew ? 'POST' : 'PUT', body: d });
      BRANDS = r.brands;
      if ($('#btable')) renderBrandTable();
      toast(r.message);
    },
  });
}
