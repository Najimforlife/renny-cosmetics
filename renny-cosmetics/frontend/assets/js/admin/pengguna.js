/* =========================================================
   RENNY COSMETICS — ADMIN: PENGGUNA
   CRUD akun pembeli dan akun staf.
   ========================================================= */
'use strict';

// =========================================================
// PENGGUNA: PEMBELI & STAF
// =========================================================
const userState = { tab: 'pembeli', q: '', page: 1 };

async function viewUsers(el) {
  if (!isOwner()) userState.tab = 'pembeli';
  el.innerHTML =
    head('Pengguna', 'Akun pembeli yang mendaftar di website, dan akun staf yang bisa masuk ke admin.') +
    `<div class="tabs admin-tabs" role="tablist">
      <button type="button" role="tab" class="tab${userState.tab === 'pembeli' ? ' on' : ''}" data-tab="pembeli" aria-selected="${userState.tab === 'pembeli'}">Pembeli</button>
      ${isOwner() ? `<button type="button" role="tab" class="tab${userState.tab === 'staf' ? ' on' : ''}" data-tab="staf" aria-selected="${userState.tab === 'staf'}">Staf admin</button>` : ''}
    </div>
    <div class="panel" id="ubox">${loadingHTML}</div>`;
  $('.admin-tabs', el).addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab]');
    if (!t || t.dataset.tab === userState.tab) return;
    userState.tab = t.dataset.tab;
    viewUsers(el).catch(toastErr);
  });
  // kotak baru supaya listener tab sebelumnya tidak tertinggal
  const box = $('#ubox', el);
  return userState.tab === 'staf' ? renderStaff(box) : renderBuyers(box);
}

async function renderBuyers(box) {
  const qs = new URLSearchParams({ q: userState.q, hal: userState.page });
  const r = await api('admin/pengguna.php?' + qs);
  box.innerHTML = `
    <div class="toolbar">
      <input type="search" class="input input-sm" id="uq" placeholder="Cari nama, email, atau no. HP" value="${esc(userState.q)}" aria-label="Cari pembeli">
      <button type="button" class="btn btn-primary btn-sm" id="addUser">+ Tambah pembeli</button>
    </div>
    <p class="table-info">${r.total.toLocaleString('id-ID')} pembeli</p>
    <div class="table-wrap"><table class="table">
      <thead><tr><th>Pembeli</th><th>No. HP</th><th>ITK</th><th>Pesanan</th><th>Belanja selesai</th><th>Status</th><th><span class="sr-only">Aksi</span></th></tr></thead>
      <tbody>${r.users
        .map(
          (u) => `<tr class="${+u.is_active ? '' : 'row-off'}">
        <td><strong>${esc(u.name)}</strong><small>${esc(u.email)} · daftar ${fmtDate(u.created_at)}</small></td>
        <td>${esc(u.phone)}</td>
        <td>${+u.is_itk ? 'Ya' : '—'}</td>
        <td>${u.orders}</td>
        <td class="nowrap">${rupiah(u.spent)}</td>
        <td><span class="b ${+u.is_active ? 'b-ok' : 'b-off'}">${+u.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
        <td><div class="row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-detail="${u.id}">Detail</button>
          <button type="button" class="btn btn-ghost btn-sm" data-edit="${u.id}">Edit</button>
          ${isOwner() ? `<button type="button" class="btn btn-ghost btn-sm danger" data-del="${u.id}">Hapus</button>` : ''}
        </div></td>
      </tr>`
        )
        .join('')}</tbody>
    </table></div>
    ${r.users.length ? '' : '<p class="table-empty">Belum ada pembeli yang cocok.</p>'}
    ${pagerHTML(userState.page, r.pages, 'data-upage')}`;
  const reload = () => renderBuyers(box).catch(toastErr);
  let t;
  $('#uq', box).addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => ((userState.q = e.target.value.trim()), (userState.page = 1), reload()), 300);
  });
  $('#addUser', box).addEventListener('click', () => editBuyer(null, reload));
  box.onclick = async (e) => {
    const b = e.target.closest('[data-detail],[data-edit],[data-del],[data-upage]');
    if (!b) return;
    try {
      if (b.dataset.upage) {
        userState.page = Number(b.dataset.upage);
        return reload();
      }
      const u = r.users.find((x) => String(x.id) === (b.dataset.detail || b.dataset.edit || b.dataset.del));
      if (b.dataset.detail) return await showBuyer(u.id);
      if (b.dataset.edit) return editBuyer(u, reload);
      if (!(await confirmBox('Hapus akun pembeli?', `Akun ${u.name} dan alamatnya akan dihapus. Riwayat pesanannya tetap tersimpan.`))) return;
      toast((await api(`admin/pengguna.php?id=${u.id}`, { method: 'DELETE' })).message);
      reload();
    } catch (err) {
      toastErr(err);
    }
  };
}

async function showBuyer(id) {
  const { user: u } = await api(`admin/pengguna.php?id=${id}`);
  openForm({
    title: u.name,
    hideSubmit: true,
    body: `<div class="od-info">
      <p><span>Email</span>${esc(u.email)}</p>
      <p><span>No. HP</span>${esc(u.phone)} <a class="link" target="_blank" rel="noopener" href="https://wa.me/${S.waNumber(u.phone)}">Chat WhatsApp</a></p>
      <p><span>Mahasiswa ITK</span>${+u.is_itk ? 'Ya' : 'Tidak'}</p>
      <p><span>Status</span>${+u.is_active ? 'Aktif' : 'Nonaktif'}</p>
      <p><span>Daftar</span>${fmtDate(u.created_at)}</p>
    </div>
    <h3 class="sub-title">Alamat (${u.addresses.length})</h3>
    ${u.addresses.length ? `<ul class="mini">${u.addresses.map((a) => `<li><b>${esc(a.label)}</b>${+a.is_default ? ' (utama)' : ''}: ${esc(a.recipient)}, ${esc(a.address)}, ${esc(a.city)}</li>`).join('')}</ul>` : '<p class="muted">Belum ada alamat.</p>'}
    <h3 class="sub-title">Pesanan terakhir</h3>
    ${u.orders.length ? `<ul class="mini-orders">${u.orders.map((o) => `<li><span><b>${esc(o.code)}</b><small>${fmtDate(o.created_at)}</small></span><span class="nowrap">${rupiah(o.subtotal)}</span>${statusBadge(o.status)}</li>`).join('')}</ul>` : '<p class="muted">Belum ada pesanan.</p>'}`,
    onSubmit: async () => {},
  });
}

function editBuyer(u, reload) {
  const isNew = !u;
  u = u || { name: '', email: '', phone: '', is_itk: 0, is_active: 1 };
  openForm({
    title: isNew ? 'Tambah pembeli' : `Edit ${u.name}`,
    body: `<div class="form-grid">
      <div class="field"><label for="u-name">Nama</label><input id="u-name" name="name" value="${esc(u.name)}"></div>
      <div class="field"><label for="u-email">Email</label><input id="u-email" name="email" type="email" value="${esc(u.email)}"></div>
      <div class="field"><label for="u-phone">No. HP / WhatsApp</label><input id="u-phone" name="phone" value="${esc(u.phone)}"></div>
      <div class="field"><label for="u-pass">${isNew ? 'Password' : 'Reset password (opsional)'}</label><input id="u-pass" name="password" type="password" autocomplete="new-password" placeholder="${isNew ? '' : 'Kosongkan kalau tidak diganti'}"><p class="hint">Minimal 8 karakter, ada huruf dan angka.</p></div>
      <div class="field span-2 checks">
        <label class="check"><input type="checkbox" name="is_itk" ${+u.is_itk ? 'checked' : ''}> Mahasiswa ITK</label>
        ${isNew ? '' : `<label class="check"><input type="checkbox" name="is_active" ${+u.is_active ? 'checked' : ''}> Akun aktif (bisa masuk)</label>`}
      </div>
    </div>`,
    onSubmit: async (d) => {
      const r = await api(isNew ? 'admin/pengguna.php' : `admin/pengguna.php?id=${u.id}`, { method: isNew ? 'POST' : 'PUT', body: d });
      toast(r.message);
      reload();
    },
  });
}

async function renderStaff(box, staff) {
  staff = staff || (await api('admin/staf.php')).staff;
  box.innerHTML = `
    <div class="toolbar"><span class="muted toolbar-note">Owner bisa mengubah pengaturan, menghapus data, dan mengelola staf. Staf bisa mengelola pesanan, produk, dan konten.</span>
      <button type="button" class="btn btn-primary btn-sm" id="addStaff">+ Tambah staf</button></div>
    <div class="table-wrap"><table class="table">
      <thead><tr><th>Nama</th><th>Peran</th><th>Status</th><th>Terakhir masuk</th><th><span class="sr-only">Aksi</span></th></tr></thead>
      <tbody>${staff
        .map(
          (a) => `<tr class="${+a.is_active ? '' : 'row-off'}">
        <td><strong>${esc(a.name)}</strong><small>${esc(a.email)}${String(a.id) === String(ADMIN.id) ? ' · akun Anda' : ''}</small></td>
        <td><span class="b ${a.role === 'owner' ? 'b-dark' : 'b-pink'}">${a.role === 'owner' ? 'Owner' : 'Staf'}</span></td>
        <td><span class="b ${+a.is_active ? 'b-ok' : 'b-off'}">${+a.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
        <td>${fmtDate(a.last_login)}</td>
        <td><div class="row-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-edit="${a.id}">Edit</button>
          ${String(a.id) !== String(ADMIN.id) ? `<button type="button" class="btn btn-ghost btn-sm danger" data-del="${a.id}">Hapus</button>` : ''}
        </div></td>
      </tr>`
        )
        .join('')}</tbody>
    </table></div>`;
  const reload = (list) => renderStaff(box, list).catch(toastErr);
  $('#addStaff', box).addEventListener('click', () => editStaff(null, reload));
  box.onclick = async (e) => {
    const b = e.target.closest('[data-edit],[data-del]');
    if (!b) return;
    const a = staff.find((x) => String(x.id) === (b.dataset.edit || b.dataset.del));
    if (b.dataset.edit) return editStaff(a, reload);
    if (!(await confirmBox('Hapus akun staf?', `${a.name} tidak bisa masuk ke admin lagi.`))) return;
    try {
      const r = await api(`admin/staf.php?id=${a.id}`, { method: 'DELETE' });
      toast(r.message);
      reload(r.staff);
    } catch (err) {
      toastErr(err);
    }
  };
}

function editStaff(a, reload) {
  const isNew = !a;
  a = a || { name: '', email: '', role: 'staf', is_active: 1 };
  openForm({
    title: isNew ? 'Tambah staf' : `Edit ${a.name}`,
    body: `<div class="form-grid">
      <div class="field"><label for="s-name">Nama</label><input id="s-name" name="name" value="${esc(a.name)}"></div>
      <div class="field"><label for="s-email">Email login</label><input id="s-email" name="email" type="email" value="${esc(a.email)}"></div>
      <div class="field"><label for="s-role">Peran</label><select id="s-role" name="role"><option value="staf" ${a.role === 'staf' ? 'selected' : ''}>Staf</option><option value="owner" ${a.role === 'owner' ? 'selected' : ''}>Owner</option></select></div>
      <div class="field"><label for="s-pass">${isNew ? 'Password' : 'Reset password (opsional)'}</label><input id="s-pass" name="password" type="password" autocomplete="new-password"><p class="hint">Minimal 8 karakter, ada huruf dan angka.</p></div>
      ${isNew ? '' : `<div class="field span-2 checks"><label class="check"><input type="checkbox" name="is_active" ${+a.is_active ? 'checked' : ''}> Akun aktif</label></div>`}
    </div>`,
    onSubmit: async (d) => {
      const r = await api(isNew ? 'admin/staf.php' : `admin/staf.php?id=${a.id}`, { method: isNew ? 'POST' : 'PUT', body: d });
      toast(r.message);
      reload(r.staff);
    },
  });
}
