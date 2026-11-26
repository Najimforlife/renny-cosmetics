/* =========================================================
   RENNY COSMETICS — ADMIN: KATEGORI
   CRUD kategori dan urutan.
   ========================================================= */
'use strict';

// =========================================================
// KATEGORI
// =========================================================
function viewCategories(el) {
  el.innerHTML =
    head('Kategori', 'Urutan di sini = urutan menu kategori di toko.', '<button type="button" class="btn btn-primary" id="addCat">+ Tambah kategori</button>') +
    `<div class="panel"><ul class="list">
      ${CATS.map(
        (c, i) => `<li>
          <span class="list-icon">${S.icon(c.icon)}</span>
          <div class="list-main"><strong>${esc(c.name)}</strong><small>${Number(c.count).toLocaleString('id-ID')} produk${c.desc ? ` · ${esc(c.desc)}` : ''}</small></div>
          <div class="row-actions">
            <button type="button" class="icon-sm" data-move="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Naikkan">↑</button>
            <button type="button" class="icon-sm" data-move="${i}" data-dir="1" ${i === CATS.length - 1 ? 'disabled' : ''} aria-label="Turunkan">↓</button>
            <button type="button" class="btn btn-ghost btn-sm" data-edit="${i}">Edit</button>
            <button type="button" class="btn btn-ghost btn-sm danger" data-del="${i}">Hapus</button>
          </div>
        </li>`
      ).join('')}
    </ul></div>`;

  $('#addCat').addEventListener('click', () => editCategory(null, el));
  el.onclick = async (e) => {
    const b = e.target.closest('[data-move],[data-edit],[data-del]');
    if (!b) return;
    const i = Number(b.dataset.move ?? b.dataset.edit ?? b.dataset.del);
    const c = CATS[i];
    try {
      if (b.dataset.move != null) {
        const ids = CATS.map((x) => x.id);
        const j = i + Number(b.dataset.dir);
        [ids[i], ids[j]] = [ids[j], ids[i]];
        CATS = (await api('admin/kategori.php?action=urut', { method: 'POST', body: { ids } })).categories;
        return viewCategories(el);
      }
      if (b.dataset.edit != null) return editCategory(c, el);
      if (!(await confirmBox('Hapus kategori?', `Kategori ${c.name} akan dihapus.`))) return;
      const r = await api(`admin/kategori.php?id=${encodeURIComponent(c.id)}`, { method: 'DELETE' });
      CATS = r.categories;
      viewCategories(el);
      toast(r.message);
    } catch (err) {
      toastErr(err);
    }
  };
}

function editCategory(c, el) {
  const isNew = !c;
  c = c || { id: '', name: '', desc: '', icon: 'lainnya' };
  openForm({
    title: isNew ? 'Tambah kategori' : 'Edit kategori',
    body: `<div class="field"><label for="c-name">Nama kategori</label><input id="c-name" name="name" value="${esc(c.name)}" maxlength="60"></div>
      <div class="field"><label for="c-desc">Deskripsi singkat</label><textarea id="c-desc" name="desc" rows="2" maxlength="255">${esc(c.desc || '')}</textarea></div>
      <fieldset class="field"><legend>Ikon</legend><div class="icon-pick">${S.ICON_KEYS.map((k) => `<label><input type="radio" name="icon" value="${k}" ${c.icon === k ? 'checked' : ''}><span>${S.icon(k)}</span></label>`).join('')}</div></fieldset>`,
    onSubmit: async (d) => {
      const r = await api(isNew ? 'admin/kategori.php' : `admin/kategori.php?id=${encodeURIComponent(c.id)}`, { method: isNew ? 'POST' : 'PUT', body: d });
      CATS = r.categories;
      viewCategories(el);
      toast(r.message);
    },
  });
}
