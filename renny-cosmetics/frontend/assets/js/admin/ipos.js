/* =========================================================
   RENNY COSMETICS — ADMIN: iPOS & STOK
   Impor produk dari file iPOS dan sinkron stok.
   ========================================================= */
'use strict';

// =========================================================
// iPOS & STOK
// =========================================================
function viewData(el) {
  el.innerHTML =
    head('iPOS & stok', 'Perbarui produk dan stok website dari data iPOS. Semua perubahan langsung tersimpan ke database.') +
    `<section class="panel pad">
      <h2 class="panel-title">1. Perbarui produk dari iPOS</h2>
      <p class="muted">Upload file <b>Export Daftar Item</b> dari iPOS (<code>.exitem</code>). File dibaca di browser; harga pokok dan margin tidak pernah dikirim ke server.</p>
      <label class="btn btn-ghost">Pilih file .exitem<input type="file" id="iposFile" accept=".exitem,.db,.sqlite" hidden></label>
      <div id="iposResult"></div>
    </section>
    <section class="panel pad">
      <h2 class="panel-title">2. Sinkron stok</h2>
      <p class="muted">Format: <b>kode barang, stok</b> per baris. Bisa dari Excel (salin 2 kolom lalu tempel) atau file CSV hasil export stok iPOS.</p>
      <div class="field"><label class="sr-only" for="stockText">Data stok</label><textarea id="stockText" class="input mono" rows="6" placeholder="kode_barang,stok&#10;8993137743198,12&#10;4897147691071	5"></textarea></div>
      <div class="btn-row">
        <label class="btn btn-ghost">Pilih file CSV<input type="file" id="stockFile" accept=".csv,.txt,text/csv,text/plain" hidden></label>
        <button type="button" class="btn btn-primary" id="stockBtn">Sinkronkan stok</button>
        ${isOwner() ? '<button type="button" class="btn btn-ghost danger" id="stockReset">Kosongkan semua stok</button>' : ''}
      </div>
      <div id="stockResult"></div>
    </section>`;
  $('#iposFile').addEventListener('change', (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) importIpos(f);
  });
  $('#stockFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (f) $('#stockText').value = await f.text();
  });
  $('#stockBtn').addEventListener('click', syncStock);
  $('#stockReset')?.addEventListener('click', async () => {
    if (!(await confirmBox('Kosongkan semua stok?', 'Semua produk kembali ke mode "stok dikonfirmasi via WhatsApp".', 'Kosongkan'))) return;
    try {
      const r = await api('admin/ipos.php?action=reset-stok', { method: 'POST' });
      PRODUCTS.forEach((p) => (p.stock = null));
      toast(r.message);
    } catch (err) {
      toastErr(err);
    }
  });
}

function loadSqlJs() {
  const init = () => window.initSqlJs({ locateFile: (f) => 'assets/vendor/' + f });
  if (window.initSqlJs) return init();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'assets/vendor/sql-wasm.js';
    s.onload = () => init().then(resolve, reject);
    s.onerror = () => reject(new Error('Pembaca file iPOS (assets/vendor/sql-wasm.js) tidak ditemukan.'));
    document.head.appendChild(s);
  });
}

async function importIpos(file) {
  const box = $('#iposResult');
  box.innerHTML = '<p class="muted">Membaca file iPOS...</p>';
  let conv;
  try {
    const SQL = await loadSqlJs();
    const db = new SQL.Database(new Uint8Array(await file.arrayBuffer()));
    // hanya kolom yang dibutuhkan: harga pokok & margin tidak diambil
    const res = db.exec('SELECT kodeitem, namaitem, jenis, merek, hargajual1, statusjual, tanggal_add FROM tbl_item');
    db.close();
    if (!res.length) throw new Error('Tabel item kosong.');
    const cols = res[0].columns;
    conv = RCCore.convertIpos(res[0].values.map((v) => Object.fromEntries(cols.map((c, i) => [c, v[i]]))));
  } catch (err) {
    console.error(err);
    box.innerHTML = `<p class="form-error">File tidak bisa dibaca. Pastikan ini file Export Daftar Item dari iPOS. (${esc(err.message)})</p>`;
    return;
  }
  const incoming = new Set(conv.products.map((p) => p.id));
  const added = conv.products.filter((p) => !byId.has(p.id));
  const priced = conv.products.filter((p) => byId.has(p.id) && byId.get(p.id).price !== p.price);
  const missing = PRODUCTS.filter((p) => p.active && !incoming.has(p.id));

  box.innerHTML = `<div class="import-box">
    <p><b>${conv.products.length.toLocaleString('id-ID')}</b> item terbaca dari iPOS.</p>
    <label class="check"><input type="checkbox" id="optAdd" ${added.length ? 'checked' : 'disabled'}> Tambahkan <b>${added.length.toLocaleString('id-ID')}</b> produk baru</label>
    <label class="check"><input type="checkbox" id="optPrice" ${priced.length ? 'checked' : 'disabled'}> Perbarui harga <b>${priced.length.toLocaleString('id-ID')}</b> produk yang harganya berubah</label>
    <label class="check"><input type="checkbox" id="optName"> Perbarui juga nama, brand, dan kategori sesuai iPOS (menimpa editan manual)</label>
    <label class="check"><input type="checkbox" id="optHide" ${missing.length ? '' : 'disabled'}> Nonaktifkan <b>${missing.length.toLocaleString('id-ID')}</b> produk yang tidak ada di file iPOS</label>
    ${priced.length ? `<details><summary>Lihat contoh perubahan harga</summary><ul class="mini">${priced.slice(0, 15).map((p) => `<li>${esc(p.name)}: ${rupiah(byId.get(p.id).price)} → <b>${rupiah(p.price)}</b></li>`).join('')}</ul></details>` : ''}
    <button type="button" class="btn btn-primary" id="applyIpos">Terapkan</button>
    <div class="progress" id="iposProgress" hidden><span></span></div>
  </div>`;

  $('#applyIpos').addEventListener('click', async (e) => {
    e.target.disabled = true;
    const opsi = { tambah: $('#optAdd').checked, harga: $('#optPrice').checked, nama: $('#optName').checked };
    const send = opsi.nama ? conv.products : [...(opsi.tambah ? added : []), ...(opsi.harga ? priced : [])];
    const hide = $('#optHide').checked ? missing.map((p) => p.id) : [];
    const usedBrands = new Set(send.map((p) => p.brand));
    const brands = conv.brands.filter((b) => usedBrands.has(b.id)).map(({ id, name }) => ({ id, name }));
    const bar = $('#iposProgress');
    bar.hidden = false;
    const total = { added: 0, updated: 0, hidden: 0 };
    try {
      const chunks = [];
      for (let i = 0; i < send.length; i += 500) chunks.push(send.slice(i, i + 500));
      if (!chunks.length) chunks.push([]);
      for (let i = 0; i < chunks.length; i++) {
        const last = i === chunks.length - 1;
        const r = await api('admin/ipos.php?action=impor', {
          method: 'POST',
          body: {
            opsi,
            brands: i === 0 ? brands : [],
            products: chunks[i].map(({ id, name, brand, cat, sub, price, created }) => ({ id, name, brand, cat, sub, price, created })),
            nonaktifkan: last ? hide : [],
          },
        });
        total.added += r.added;
        total.updated += r.updated;
        total.hidden += r.hidden;
        $('span', bar).style.width = `${Math.round(((i + 1) / chunks.length) * 100)}%`;
      }
      await loadCore();
      box.innerHTML = `<p class="ok-msg">Selesai: ${total.added} produk baru, ${total.updated} diperbarui, ${total.hidden} dinonaktifkan.</p>`;
      toast('Data iPOS diterapkan');
    } catch (err) {
      box.insertAdjacentHTML('beforeend', `<p class="form-error">${esc(err.message)}</p>`);
      e.target.disabled = false;
    }
  });
}

async function syncStock() {
  const box = $('#stockResult');
  const rows = [];
  let bad = 0;
  $('#stockText').value.split(/\r?\n/).forEach((line) => {
    const l = line.trim();
    if (!l) return;
    const [code, val] = l.split(/[;,\t]/).map((c) => c.trim().replace(/^"|"$/g, ''));
    const stock = Number(String(val ?? '').replace(/\./g, '').replace(',', '.'));
    if (!code || val === undefined || val === '' || !Number.isFinite(stock) || stock < 0) {
      if (/\d/.test(val || '')) bad++;
      return;
    }
    rows.push([code, Math.floor(stock)]);
  });
  if (!rows.length) {
    box.innerHTML = '<p class="form-error">Tidak ada baris yang terbaca. Format: kode barang, stok.</p>';
    return;
  }
  const btn = $('#stockBtn');
  btn.disabled = true;
  try {
    const r = await api('admin/ipos.php?action=stok', { method: 'POST', body: { rows } });
    rows.forEach(([code, stock]) => byId.has(code) && (byId.get(code).stock = stock));
    box.innerHTML = `<div class="import-box">
      <p class="ok-msg"><b>${r.changed.toLocaleString('id-ID')}</b> stok diperbarui.</p>
      ${r.notFoundCount ? `<p class="warn-msg">${r.notFoundCount} kode tidak ditemukan: ${esc(r.notFound.slice(0, 20).join(', '))}${r.notFoundCount > 20 ? ', …' : ''}</p>` : ''}
      ${bad ? `<p class="warn-msg">${bad} baris dilewati karena formatnya tidak terbaca.</p>` : ''}
      <p class="muted">Produk yang tidak ada di daftar ini tetap memakai stok lama.</p>
    </div>`;
    toast(r.message);
  } catch (err) {
    box.innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
  } finally {
    btn.disabled = false;
  }
}
