/* =========================================================
   RENNY COSMETICS — TOKO: AKUN PEMBELI
   Masuk, daftar, profil, alamat, dan riwayat pesanan pembeli.
   ========================================================= */
'use strict';

// =========================================================
// AKUN PEMBELI: masuk, daftar, profil, alamat, pesanan
// =========================================================
let USER = null;

function setUser(u) {
  USER = u || null;
  $('#accountText').textContent = USER ? USER.name.split(' ')[0] : 'Masuk';
  $('#accountLink').href = USER ? '#/akun' : '#/masuk';
}

/** tampilkan pesan error per kolom dari API */
function showErrors(form, err) {
  $$('.field-error', form).forEach((x) => x.remove());
  $$('.is-invalid', form).forEach((x) => x.classList.remove('is-invalid'));
  Object.entries(err.errors || {}).forEach(([k, msg]) => {
    const el = form.elements[k];
    if (el && el.insertAdjacentHTML) {
      el.classList.add('is-invalid');
      el.insertAdjacentHTML('afterend', `<p class="field-error">${esc(msg)}</p>`);
    }
  });
  const box = $('.form-error', form);
  if (box) {
    box.textContent = err.message;
    box.hidden = false;
  }
}

function formData(form) {
  const o = {};
  new FormData(form).forEach((v, k) => (o[k] = v));
  $$('input[type=checkbox]', form).forEach((c) => (o[c.name] = c.checked));
  return o;
}

async function submitForm(form, fn) {
  const btn = $('button[type=submit]', form);
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Memproses...';
  $('.form-error', form) && ($('.form-error', form).hidden = true);
  try {
    await fn(formData(form));
  } catch (err) {
    showErrors(form, err);
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}

function authHTML(mode, params) {
  const isLogin = mode === 'masuk';
  const next = params.get('lanjut') || '';
  return `<div class="container auth-page">
    <div class="auth-card">
      <h1>${isLogin ? 'Masuk ke akun' : 'Buat akun'}</h1>
      <p class="muted">${isLogin ? 'Masuk untuk checkout, simpan alamat, dan lihat riwayat pesanan.' : 'Daftar gratis untuk checkout lebih cepat dan pantau pesananmu.'}</p>
      ${next === 'checkout' ? '<p class="auth-note">Keranjangmu tetap tersimpan. Setelah masuk, kamu langsung lanjut checkout.</p>' : ''}
      <form id="authForm" class="form-plain" novalidate>
        ${isLogin ? '' : `<div class="field"><label for="a-name">Nama lengkap</label><input id="a-name" name="name" autocomplete="name"></div>`}
        <div class="field"><label for="a-email">Email</label><input id="a-email" name="email" type="email" autocomplete="email"></div>
        ${isLogin ? '' : `<div class="field"><label for="a-phone">Nomor WhatsApp</label><input id="a-phone" name="phone" type="tel" autocomplete="tel" placeholder="08xxxxxxxxxx"></div>`}
        <div class="field"><label for="a-pass">Password</label><input id="a-pass" name="password" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}">${isLogin ? '' : '<p class="hint">Minimal 8 karakter, ada huruf dan angka.</p>'}</div>
        ${isLogin ? '' : '<label class="check"><input type="checkbox" name="is_itk"> Saya mahasiswa ITK</label>'}
        <p class="form-error" hidden></p>
        <button type="submit" class="btn btn-primary btn-block btn-lg">${isLogin ? 'Masuk' : 'Daftar'}</button>
      </form>
      <p class="auth-switch">${isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'} <a class="link" href="#/${isLogin ? 'daftar' : 'masuk'}${next ? '?lanjut=' + next : ''}">${isLogin ? 'Daftar' : 'Masuk'}</a></p>
    </div>
  </div>`;
}

function afterAuth(mode, params) {
  $('#authForm').addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(e.target, async (d) => {
      const r = await S.api(`toko/akun.php?action=${mode === 'masuk' ? 'masuk' : 'daftar'}`, { method: 'POST', body: d });
      setUser(r.user);
      toast(r.message);
      if (params.get('lanjut') === 'checkout') {
        go('#/');
        setTimeout(openCheckout, 100);
      } else go('#/akun');
    });
  });
}

const STATUS_CLASS = { baru: 'st-new', dikonfirmasi: 'st-ok', dikemas: 'st-ok', dikirim: 'st-ship', selesai: 'st-done', dibatalkan: 'st-cancel' };

function accountHTML(params) {
  const tab = params.get('tab') || 'pesanan';
  const tabs = [['pesanan', 'Pesanan saya'], ['alamat', 'Alamat'], ['profil', 'Profil'], ['keamanan', 'Keamanan']];
  return `<div class="container page account">
    <nav class="crumbs"><a href="#/">Beranda</a> / Akun</nav>
    <div class="account-head">
      <div><h1>Halo, ${esc(USER.name)}</h1><p class="muted">${esc(USER.email)} · ${esc(USER.phone)}${+USER.is_itk ? ' · Mahasiswa ITK' : ''}</p></div>
      <button type="button" class="btn btn-ghost" id="logoutBtn">Keluar</button>
    </div>
    <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<a role="tab" class="tab${tab === k ? ' on' : ''}" aria-selected="${tab === k}" href="#/akun?tab=${k}">${l}</a>`).join('')}</div>
    <div id="accountBody"><div class="loading small"><span class="spinner"></span></div></div>
  </div>`;
}

async function afterAccount(params) {
  const tab = params.get('tab') || 'pesanan';
  $('#logoutBtn').addEventListener('click', async () => {
    await S.api('toko/akun.php?action=keluar', { method: 'POST' });
    setUser(null);
    toast('Kamu sudah keluar.');
    go('#/');
  });
  const box = $('#accountBody');
  try {
    if (tab === 'pesanan') return renderOrders(box, params.get('baru'));
    if (tab === 'alamat') return renderAddresses(box, (await S.api('toko/alamat.php')).addresses);
    if (tab === 'profil') return renderProfile(box);
    if (tab === 'keamanan') return renderSecurity(box);
  } catch (err) {
    box.innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
  }
}

async function renderOrders(box) {
  const { orders } = await S.api('toko/pesanan.php');
  if (!orders.length) {
    box.innerHTML = `<div class="empty"><h2>Belum ada pesanan</h2><p>Pesanan yang kamu buat akan muncul di sini beserta statusnya.</p><a class="btn btn-primary" href="#/produk">Mulai belanja</a></div>`;
    return;
  }
  box.innerHTML = `<div class="orders">${orders
    .map(
      (o) => `<article class="order">
      <header><div><b>${esc(o.code)}</b><span class="muted"> · ${new Date(o.created_at.replace(' ', 'T')).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span></div><span class="status ${STATUS_CLASS[o.status]}">${esc(o.status_label)}</span></header>
      <ul>${o.items.map((it) => `<li><span>${esc(it.brand_name)} - ${esc(it.product_name)} ×${it.qty}</span><span>${rupiah(it.price * it.qty)}</span></li>`).join('')}</ul>
      <footer>
        <div><span class="muted">${o.method === 'kirim' ? 'Dikirim' : 'Ambil di toko'}</span> · <b>${rupiah(o.subtotal)}</b>${o.admin_note ? `<p class="admin-note">Catatan admin: ${esc(o.admin_note)}</p>` : ''}</div>
        <div class="btn-row">
          <a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${esc(wa(orderWaText(o)))}">Chat admin</a>
          ${o.status === 'baru' ? `<button type="button" class="btn btn-ghost btn-sm danger" data-cancel="${esc(o.code)}">Batalkan</button>` : ''}
        </div>
      </footer>
    </article>`
    )
    .join('')}</div>`;
  box.onclick = async (e) => {
    const b = e.target.closest('[data-cancel]');
    if (!b || !confirm(`Batalkan pesanan ${b.dataset.cancel}?`)) return;
    try {
      await S.api(`toko/pesanan.php?code=${encodeURIComponent(b.dataset.cancel)}&action=batal`, { method: 'PUT' });
      toast('Pesanan dibatalkan.');
      renderOrders(box);
    } catch (err) {
      toast(err.message);
    }
  };
}

function renderAddresses(box, list) {
  box.innerHTML = `<div class="addr-grid">
    ${list
      .map(
        (a) => `<div class="addr${+a.is_default ? ' on' : ''}">
        <p><b>${esc(a.label)}</b>${+a.is_default ? ' <span class="chip chip-sm on">Utama</span>' : ''}</p>
        <p>${esc(a.recipient)} · ${esc(a.phone)}</p>
        <p class="muted">${esc(a.address)}, ${esc(a.city)}${a.postal_code ? ' ' + esc(a.postal_code) : ''}</p>
        <div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" data-edit="${a.id}">Ubah</button><button type="button" class="btn btn-ghost btn-sm danger" data-del="${a.id}">Hapus</button></div>
      </div>`
      )
      .join('')}
    ${list.length < 10 ? '<button type="button" class="addr addr-add" data-edit="new">+ Tambah alamat</button>' : ''}
  </div>
  <div id="addrFormBox"></div>`;
  box.onclick = async (e) => {
    const b = e.target.closest('[data-edit],[data-del]');
    if (!b) return;
    if (b.dataset.del) {
      if (!confirm('Hapus alamat ini?')) return;
      try {
        const r = await S.api(`toko/alamat.php?id=${b.dataset.del}`, { method: 'DELETE' });
        toast(r.message);
        renderAddresses(box, r.addresses);
      } catch (err) {
        toast(err.message);
      }
      return;
    }
    const a = list.find((x) => String(x.id) === b.dataset.edit) || { label: list.length ? '' : 'Rumah', recipient: USER.name, phone: USER.phone, address: '', city: 'Balikpapan', postal_code: '', is_default: !list.length };
    const isNew = b.dataset.edit === 'new';
    $('#addrFormBox').innerHTML = `<form class="panel-form" id="addrForm" novalidate>
      <h2>${isNew ? 'Tambah alamat' : 'Ubah alamat'}</h2>
      <div class="grid-2">
        <div class="field"><label for="ad-label">Label</label><input id="ad-label" name="label" value="${esc(a.label)}" placeholder="Rumah, Kos, Kantor"></div>
        <div class="field"><label for="ad-rec">Nama penerima</label><input id="ad-rec" name="recipient" value="${esc(a.recipient)}"></div>
        <div class="field"><label for="ad-phone">No. HP penerima</label><input id="ad-phone" name="phone" type="tel" value="${esc(a.phone)}"></div>
        <div class="field"><label for="ad-city">Kota / kecamatan</label><input id="ad-city" name="city" value="${esc(a.city)}"></div>
        <div class="field span-2"><label for="ad-addr">Alamat lengkap</label><textarea id="ad-addr" name="address" rows="2" placeholder="Nama jalan, nomor rumah, RT/RW, patokan">${esc(a.address)}</textarea></div>
        <div class="field"><label for="ad-zip">Kode pos (opsional)</label><input id="ad-zip" name="postal_code" value="${esc(a.postal_code || '')}"></div>
        <div class="field"><label class="check"><input type="checkbox" name="is_default" ${+a.is_default ? 'checked' : ''}> Jadikan alamat utama</label></div>
      </div>
      <p class="form-error" hidden></p>
      <div class="btn-row"><button type="submit" class="btn btn-primary">Simpan alamat</button><button type="button" class="btn btn-ghost" id="addrCancel">Batal</button></div>
    </form>`;
    const form = $('#addrForm');
    form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    $('#addrCancel').onclick = () => ($('#addrFormBox').innerHTML = '');
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      submitForm(form, async (d) => {
        const r = await S.api(isNew ? 'toko/alamat.php' : `toko/alamat.php?id=${a.id}`, { method: isNew ? 'POST' : 'PUT', body: d });
        toast(r.message);
        renderAddresses(box, r.addresses);
      });
    });
  };
}

function renderProfile(box) {
  box.innerHTML = `<form class="panel-form" id="profileForm" novalidate>
    <div class="grid-2">
      <div class="field"><label for="pf-name">Nama lengkap</label><input id="pf-name" name="name" value="${esc(USER.name)}"></div>
      <div class="field"><label for="pf-email">Email</label><input id="pf-email" name="email" type="email" value="${esc(USER.email)}"></div>
      <div class="field"><label for="pf-phone">Nomor WhatsApp</label><input id="pf-phone" name="phone" type="tel" value="${esc(USER.phone)}"></div>
      <div class="field"><label class="check"><input type="checkbox" name="is_itk" ${+USER.is_itk ? 'checked' : ''}> Saya mahasiswa ITK</label></div>
    </div>
    <p class="form-error" hidden></p>
    <button type="submit" class="btn btn-primary">Simpan profil</button>
  </form>`;
  $('#profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(e.target, async (d) => {
      const r = await S.api('toko/akun.php?action=profil', { method: 'PUT', body: d });
      setUser(r.user);
      toast(r.message);
      route();
    });
  });
}

function renderSecurity(box) {
  box.innerHTML = `<form class="panel-form" id="pwForm" novalidate>
    <h2>Ganti password</h2>
    <div class="grid-2">
      <div class="field"><label for="pw-old">Password lama</label><input id="pw-old" name="old" type="password" autocomplete="current-password"></div>
      <div class="field"><label for="pw-new">Password baru</label><input id="pw-new" name="new" type="password" autocomplete="new-password"><p class="hint">Minimal 8 karakter, ada huruf dan angka.</p></div>
    </div>
    <p class="form-error" hidden></p>
    <button type="submit" class="btn btn-primary">Ganti password</button>
  </form>
  <form class="panel-form danger-zone" id="delForm" novalidate>
    <h2>Hapus akun</h2>
    <p class="muted">Akun, profil, dan alamatmu akan dihapus permanen. Riwayat pesanan tetap disimpan toko untuk keperluan transaksi.</p>
    <div class="field"><label for="del-pass">Ketik password untuk konfirmasi</label><input id="del-pass" name="password" type="password" autocomplete="current-password"></div>
    <p class="form-error" hidden></p>
    <button type="submit" class="btn btn-danger">Hapus akun saya</button>
  </form>`;
  $('#pwForm').addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(e.target, async (d) => {
      const r = await S.api('toko/akun.php?action=password', { method: 'PUT', body: d });
      e.target.reset();
      toast(r.message);
    });
  });
  $('#delForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!confirm('Yakin hapus akun? Tindakan ini tidak bisa dibatalkan.')) return;
    submitForm(e.target, async (d) => {
      const r = await S.api('toko/akun.php?action=hapus', { method: 'DELETE', body: d });
      setUser(null);
      toast(r.message);
      go('#/');
    });
  });
}

async function orderSuccessHTML(params) {
  const code = params.get('kode');
  let order = null;
  try {
    order = (await S.api('toko/pesanan.php')).orders.find((o) => o.code === code);
  } catch {
    /* tampilkan versi sederhana */
  }
  return `<div class="container page">
    <div class="success">
      <div class="success-icon" aria-hidden="true">✓</div>
      <h1>Pesanan ${esc(code)} tersimpan</h1>
      <p>Langkah terakhir: kirim pesanan ke WhatsApp admin supaya stok, ongkir, dan total pembayaran bisa dikonfirmasi.</p>
      ${order ? `<a class="btn btn-wa btn-lg" target="_blank" rel="noopener" href="${esc(wa(orderWaText(order)))}">Kirim ke WhatsApp admin</a>` : ''}
      <a class="link" href="#/akun?tab=pesanan">Lihat status pesanan</a>
    </div>
  </div>`;
}
