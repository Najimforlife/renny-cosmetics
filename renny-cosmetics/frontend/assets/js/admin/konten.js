/* =========================================================
   RENNY COSMETICS — ADMIN: KONTEN
   Banner promo, testimoni, dan FAQ.
   ========================================================= */
'use strict';

// =========================================================
// KONTEN: BANNER PROMO, TESTIMONI, FAQ
// =========================================================
const CONTENT = {
  promo: { title: 'Banner promo', noun: 'slide banner', sub: 'Slide yang bergeser di atas beranda. Maksimal 6 slide.', add: '+ Tambah slide', sortable: true },
  testimoni: { title: 'Testimoni', noun: 'testimoni', sub: 'Tampil di beranda. Isi dengan testimoni asli pelanggan (misal dari DM atau ulasan Shopee).', add: '+ Tambah testimoni', sortable: false },
  faq: { title: 'FAQ', noun: 'FAQ', sub: 'Pertanyaan yang sering ditanyakan, tampil di halaman Bantuan.', add: '+ Tambah FAQ', sortable: true },
};
const THEMES = [['soft', 'Pink muda'], ['deep', 'Pink tua'], ['pink', 'Pink cerah'], ['gold', 'Krem'], ['dark', 'Plum gelap']];

async function viewContent(el, jenis, items) {
  const cfg = CONTENT[jenis];
  items = items || (await api(`admin/konten.php?jenis=${jenis}`)).items;
  const line = (it) =>
    jenis === 'promo'
      ? `<strong>${esc(it.title)}</strong><small>${esc(it.subtitle)} · tombol “${esc(it.cta)}” → ${esc(it.link)}</small>`
      : jenis === 'faq'
        ? `<strong>${esc(it.q)}</strong><small>${esc(it.a)}</small>`
        : `<strong>${esc(it.name)}${it.city ? ` · ${esc(it.city)}` : ''} <span class="stars" aria-label="${it.rating} bintang">${'★'.repeat(it.rating)}</span></strong><small>${esc(it.text)}</small>`;
  el.innerHTML =
    head(cfg.title, cfg.sub, `<button type="button" class="btn btn-primary" id="addContent">${cfg.add}</button>`) +
    `<div class="panel">${
      items.length
        ? `<ul class="list">${items
            .map(
              (it, i) => `<li>
          ${jenis === 'promo' ? `<span class="swatch slide-${esc(it.theme)}" aria-hidden="true"></span>` : ''}
          <div class="list-main">${line(it)}</div>
          <div class="row-actions">
            ${jenis !== 'promo' ? `<button type="button" class="b ${+it.visible ? 'b-ok' : 'b-off'}" data-toggle="${it.id}" title="Klik untuk ubah">${+it.visible ? 'Tampil' : 'Disembunyikan'}</button>` : ''}
            ${cfg.sortable ? `<button type="button" class="icon-sm" data-move="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Naikkan">↑</button><button type="button" class="icon-sm" data-move="${i}" data-dir="1" ${i === items.length - 1 ? 'disabled' : ''} aria-label="Turunkan">↓</button>` : ''}
            <button type="button" class="btn btn-ghost btn-sm" data-edit="${it.id}">Edit</button>
            <button type="button" class="btn btn-ghost btn-sm danger" data-del="${it.id}">Hapus</button>
          </div></li>`
            )
            .join('')}</ul>`
        : `<p class="table-empty">${jenis === 'testimoni' ? 'Belum ada testimoni. Bagian testimoni di beranda otomatis disembunyikan sampai ada yang ditampilkan.' : 'Belum ada data.'}</p>`
    }</div>`;

  const refresh = (r) => viewContent(el, jenis, r.items).catch(toastErr);
  $('#addContent').addEventListener('click', () => editContent(jenis, null, refresh));
  el.onclick = async (e) => {
    const b = e.target.closest('[data-toggle],[data-move],[data-edit],[data-del]');
    if (!b) return;
    try {
      if (b.dataset.toggle) return refresh(await api(`admin/konten.php?jenis=${jenis}&id=${b.dataset.toggle}&action=tampil`, { method: 'PUT' }));
      if (b.dataset.move != null) {
        const ids = items.map((x) => x.id);
        const i = Number(b.dataset.move);
        const j = i + Number(b.dataset.dir);
        [ids[i], ids[j]] = [ids[j], ids[i]];
        return refresh(await api(`admin/konten.php?jenis=${jenis}&action=urut`, { method: 'POST', body: { ids } }));
      }
      const it = items.find((x) => String(x.id) === (b.dataset.edit || b.dataset.del));
      if (b.dataset.edit) return editContent(jenis, it, refresh);
      if (!(await confirmBox('Hapus data ini?', 'Data akan dihapus permanen.'))) return;
      const r = await api(`admin/konten.php?jenis=${jenis}&id=${it.id}`, { method: 'DELETE' });
      toast(r.message);
      refresh(r);
    } catch (err) {
      toastErr(err);
    }
  };
}

function editContent(jenis, it, refresh) {
  const isNew = !it;
  let body;
  if (jenis === 'promo') {
    it = it || { title: '', subtitle: '', cta: 'Lihat', link: '#/produk', theme: 'soft' };
    const links = [['#/produk', 'Semua produk'], ...CATS.map((c) => [`#/produk?kat=${c.id}`, `Kategori: ${c.name}`]), ['#/produk?diskon=1&urut=diskon', 'Produk diskon'], ['#/brand', 'Halaman brand'], ['#/lokasi', 'Lokasi toko'], ['wa', 'Chat WhatsApp']];
    const custom = !links.some(([v]) => v === it.link);
    body = `<div class="form-grid">
      <div class="field span-2"><label for="pr-title">Judul</label><input id="pr-title" name="title" value="${esc(it.title)}" maxlength="80"></div>
      <div class="field span-2"><label for="pr-sub">Teks kecil</label><input id="pr-sub" name="subtitle" value="${esc(it.subtitle)}" maxlength="200"></div>
      <div class="field"><label for="pr-cta">Tulisan tombol</label><input id="pr-cta" name="cta" value="${esc(it.cta)}" maxlength="40"></div>
      <div class="field"><label for="pr-theme">Warna</label><select id="pr-theme" name="theme">${THEMES.map(([v, l]) => `<option value="${v}" ${it.theme === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field span-2"><label for="pr-linksel">Tombol menuju</label>
        <select id="pr-linksel">${links.map(([v, l]) => `<option value="${esc(v)}" ${it.link === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}<option value="custom" ${custom ? 'selected' : ''}>Link lain…</option></select>
        <input name="link" id="pr-link" value="${esc(it.link)}" ${custom ? '' : 'hidden'} placeholder="https://... atau #/produk?q=..." aria-label="Link lain">
      </div>
    </div>`;
  } else if (jenis === 'faq') {
    it = it || { q: '', a: '', visible: 1 };
    body = `<div class="field"><label for="fq-q">Pertanyaan</label><input id="fq-q" name="q" value="${esc(it.q)}" maxlength="200"></div>
      <div class="field"><label for="fq-a">Jawaban</label><textarea id="fq-a" name="a" rows="5" maxlength="2000">${esc(it.a)}</textarea></div>
      <label class="check"><input type="checkbox" name="visible" ${+it.visible ? 'checked' : ''}> Tampilkan</label>`;
  } else {
    it = it || { name: '', city: '', text: '', rating: 5, visible: 1 };
    body = `<div class="form-grid">
      <div class="field"><label for="t-name">Nama pelanggan</label><input id="t-name" name="name" value="${esc(it.name)}" maxlength="80"></div>
      <div class="field"><label for="t-city">Kota (opsional)</label><input id="t-city" name="city" value="${esc(it.city || '')}" maxlength="60"></div>
      <div class="field span-2"><label for="t-text">Isi testimoni</label><textarea id="t-text" name="text" rows="4" maxlength="600">${esc(it.text)}</textarea></div>
      <div class="field"><label for="t-rating">Rating</label><select id="t-rating" name="rating">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}" ${+it.rating === n ? 'selected' : ''}>${n} bintang</option>`).join('')}</select></div>
      <div class="field checks"><label class="check"><input type="checkbox" name="visible" ${+it.visible ? 'checked' : ''}> Tampilkan di website</label></div>
    </div>`;
  }
  openForm({
    title: `${isNew ? 'Tambah' : 'Edit'} ${CONTENT[jenis].noun}`,
    body,
    onOpen: () => {
      const sel = $('#pr-linksel');
      sel?.addEventListener('change', () => {
        $('#pr-link').hidden = sel.value !== 'custom';
        if (sel.value !== 'custom') $('#pr-link').value = sel.value;
        else $('#pr-link').focus();
      });
    },
    onSubmit: async (d) => {
      const r = await api(isNew ? `admin/konten.php?jenis=${jenis}` : `admin/konten.php?jenis=${jenis}&id=${it.id}`, { method: isNew ? 'POST' : 'PUT', body: d });
      toast(r.message);
      refresh(r);
    },
  });
}
