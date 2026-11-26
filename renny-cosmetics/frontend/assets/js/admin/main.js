/* =========================================================
   RENNY COSMETICS — ADMIN: MAIN
   Router menu admin, login, dan mulai. Dimuat paling akhir.
   ========================================================= */
'use strict';

// =========================================================
// ROUTER
// =========================================================
const VIEWS = {
  ringkasan: viewSummary,
  pesanan: viewOrders,
  produk: viewProducts,
  kategori: viewCategories,
  brand: viewBrands,
  pengguna: viewUsers,
  promo: (el) => viewContent(el, 'promo'),
  testimoni: (el) => viewContent(el, 'testimoni'),
  faq: (el) => viewContent(el, 'faq'),
  pengaturan: viewSettings,
  data: viewData,
  akun: viewAccount,
};

function route() {
  const key = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'ringkasan';
  $$('.side-link[href^="#"]').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + key));
  // ganti elemen supaya event dari halaman sebelumnya tidak terbawa
  const old = $('#adminView');
  const view = old.cloneNode(false);
  old.replaceWith(view);
  Promise.resolve()
    .then(() => VIEWS[key](view))
    .catch((err) => {
      console.error(err);
      view.innerHTML = `<div class="panel pad"><p class="form-error">${esc(err.message)}</p></div>`;
    });
  window.scrollTo(0, 0);
}

// =========================================================
// LOGIN & MULAI
// =========================================================
async function startApp() {
  $('#gate').hidden = true;
  $('#app').hidden = false;
  $('#adminView').innerHTML = '<div class="loading"><span class="spinner" aria-hidden="true"></span><p>Memuat data toko...</p></div>';
  await loadCore();
  route();
  window.addEventListener('hashchange', route);
}

async function init() {
  const btn = $('#gateForm button[type=submit]');
  const gateErr = $('#gateError');
  $$('dialog').forEach((d) => d.addEventListener('click', (e) => (e.target === d || e.target.closest('[data-close]')) && d.close()));
  $('#logoutBtn').addEventListener('click', async () => {
    try {
      await api('admin/auth.php?action=keluar', { method: 'POST' });
    } catch {
      /* tetap keluar */
    }
    window.removeEventListener('hashchange', route);
    location.replace('admin.html');
  });

  // pasang handler login lebih dulu supaya tidak ada klik yang hilang
  let ready = false;
  $('#gateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!ready) return;
    btn.disabled = true;
    btn.textContent = 'Memeriksa...';
    gateErr.hidden = true;
    try {
      const r = await api('admin/auth.php?action=masuk', { method: 'POST', body: { email: $('#email').value, password: $('#password').value } });
      ADMIN = r.admin;
      await startApp();
    } catch (ex) {
      gateErr.textContent = ex.message;
      gateErr.hidden = false;
      $('#password').select();
    } finally {
      btn.disabled = false;
      btn.textContent = 'Masuk';
    }
  });

  btn.disabled = true;
  btn.textContent = 'Memeriksa...';
  try {
    const me = await S.refreshCsrf('admin/auth.php');
    if (me.admin) {
      ADMIN = me.admin;
      return await startApp();
    }
  } catch (err) {
    gateErr.textContent = err.message;
    gateErr.hidden = false;
  } finally {
    ready = true;
    btn.disabled = false;
    btn.textContent = 'Masuk';
  }
  $('#email').focus();
}

init();
