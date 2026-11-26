/* =========================================================
   RENNY COSMETICS — TOKO: MAIN
   Router halaman, menu kategori, toast, bingkai halaman, event. Dimuat paling akhir.
   ========================================================= */
'use strict';

// =========================================================
// ROUTER
// =========================================================
function parseHash() {
  const h = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = h.split('?');
  return { path: path || '/', params: new URLSearchParams(qs || '') };
}

function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

function route() {
  clearInterval(countdownTimer);
  closeSuggest();
  const { path, params } = parseHash();
  const view = $('#view');
  let title = 'Renny Cosmetics | Toko Kosmetik & Skincare Original di Balikpapan';
  let scrollTo = null;

  if (path === '/' || path === '/lokasi') {
    view.innerHTML = homeHTML();
    afterHome();
    if (path === '/lokasi') scrollTo = $('#lokasi');
  } else if (path === '/produk') {
    view.innerHTML = catalogHTML(params);
    afterCatalog(params);
    const c = catById.get(params.get('kat'));
    title = `${c ? c.name : 'Semua produk'} | Renny Cosmetics`;
  } else if (path.startsWith('/p/')) {
    const p = byId.get(decodeURIComponent(path.slice(3)));
    if (p && p.active) {
      view.innerHTML = productHTML(p);
      afterProduct(p);
      title = `${brandName(p)} ${p.name} | Renny Cosmetics`;
    } else view.innerHTML = notFoundHTML();
  } else if (path === '/brand') {
    view.innerHTML = brandsHTML();
    afterBrands();
    title = 'Semua brand | Renny Cosmetics';
  } else if (path === '/wishlist') {
    view.innerHTML = wishlistHTML();
    title = 'Wishlist | Renny Cosmetics';
  } else if (path === '/masuk' || path === '/daftar') {
    if (USER) return go('#/akun');
    view.innerHTML = authHTML(path.slice(1), params);
    afterAuth(path.slice(1), params);
    title = (path === '/masuk' ? 'Masuk' : 'Daftar') + ' | Renny Cosmetics';
  } else if (path === '/akun') {
    if (!USER) return go('#/masuk');
    view.innerHTML = accountHTML(params);
    afterAccount(params);
    title = 'Akun saya | Renny Cosmetics';
  } else if (path === '/pesanan-berhasil') {
    if (!USER) return go('#/masuk');
    view.innerHTML = '<div class="loading"><span class="spinner"></span></div>';
    orderSuccessHTML(params).then((html) => (view.innerHTML = html));
    title = 'Pesanan tersimpan | Renny Cosmetics';
  } else if (path === '/bantuan') {
    view.innerHTML = helpHTML();
    title = 'Bantuan: ongkir, pembayaran & FAQ | Renny Cosmetics';
  } else {
    view.innerHTML = notFoundHTML();
  }

  document.title = title;
  renderCatNav(path, params);
  if (scrollTo) scrollTo.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  else window.scrollTo({ top: 0, behavior: 'auto' });
}

// =========================================================
// HEADER: MENU KATEGORI
// =========================================================
function renderCatNav(path, params) {
  const activeCat = path === '/produk' ? params.get('kat') : null;
  const flashLive = flashItems().length > 0;
  $('#catNav').innerHTML =
    `<a class="catnav-link${path === '/produk' && !activeCat ? ' is-active' : ''}" href="#/produk">Semua produk</a>` +
    D.categories
      .map((c) => `<a class="catnav-link${activeCat === c.id ? ' is-active' : ''}" href="#/produk?kat=${c.id}">${esc(c.name)}</a>`)
      .join('') +
    `<a class="catnav-link${path === '/brand' ? ' is-active' : ''}" href="#/brand">Brand</a>` +
    (flashLive ? `<a class="catnav-link catnav-flash" href="#/" data-scroll="flash">Flash sale</a>` : '');
}

// =========================================================
// TOAST
// =========================================================
let toastTimer;
function toast(msg, action) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) $('button', el).onclick = () => { action.fn(); el.classList.remove('show'); };
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), action ? 5000 : 2600);
}

// =========================================================
// BINGKAI HALAMAN (topbar, footer, WA)
// =========================================================
function renderChrome() {
  const s = settings();
  $('#topbarText').textContent = s.topbar || 'Semua produk original. Pesan mudah lewat WhatsApp.';
  $('#waFloat').href = wa('Halo kak Renny Cosmetics, saya mau tanya produk.');
  $('#year').textContent = new Date().getFullYear();
  $('#footerCats').innerHTML = D.categories.map((c) => `<li><a href="#/produk?kat=${c.id}">${esc(c.name)}</a></li>`).join('');
  $('#footerContact').innerHTML = [
    s.address && `<li>${esc(s.address)}</li>`,
    s.hours && `<li>Buka ${esc(s.hours)}</li>`,
    `<li><a href="${esc(wa('Halo kak Renny Cosmetics'))}" target="_blank" rel="noopener">WhatsApp ${esc(formatPhone(s.whatsapp))}</a></li>`,
    s.email && `<li><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>`,
  ]
    .filter(Boolean)
    .join('');
  $('#footerSocial').innerHTML = socialList().map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${x.label}</a>`).join('');
}

function formatPhone(raw) {
  const d = S.waNumber(raw);
  const local = d.startsWith('62') ? '0' + d.slice(2) : d;
  return local.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
}

// =========================================================
// EVENT
// =========================================================
function bind() {
  window.addEventListener('hashchange', route);

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-add],[data-wish],[data-inc],[data-dec],[data-remove],[data-close],[data-scroll]');
    if (!t) {
      if (!e.target.closest('#searchForm')) closeSuggest();
      return;
    }
    const ds = t.dataset;
    if (ds.add) addToCart(ds.add);
    else if (ds.wish) {
      e.preventDefault();
      toggleWish(ds.wish);
    } else if (ds.inc || ds.dec) {
      const id = ds.inc || ds.dec;
      const it = getCart().find((i) => i.id === id);
      if (it) setQty(id, it.qty + (ds.inc ? 1 : -1));
    } else if (ds.remove) setQty(ds.remove, 0);
    else if (ds.scroll) {
      e.preventDefault();
      const go2 = () => document.getElementById(ds.scroll)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      if (parseHash().path !== '/') {
        location.hash = '#/';
        setTimeout(go2, 50);
      } else go2();
    }
    if ('close' in ds) t.closest('dialog')?.close();
  });

  $$('dialog').forEach((d) => d.addEventListener('click', (e) => e.target === d && d.close()));
  $('#cartBtn').addEventListener('click', openCart);
  $('#checkoutBtn').addEventListener('click', openCheckout);
  $('#checkoutForm').addEventListener('submit', submitCheckout);
  $$('input[name="coMethod"]').forEach((r) =>
    r.addEventListener('change', () => ($('#addressField').hidden = $('input[name="coMethod"]:checked').value !== 'kirim'))
  );

  const input = $('#searchInput');
  input.addEventListener('input', () => {
    clearTimeout(suggestTimer);
    suggestTimer = setTimeout(() => renderSuggest(input.value), 120);
  });
  input.addEventListener('focus', () => input.value.trim().length >= 2 && renderSuggest(input.value));
  input.addEventListener('keydown', (e) => e.key === 'Escape' && closeSuggest());
  $('#searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    closeSuggest();
    input.blur();
    go(q ? `#/produk?q=${encodeURIComponent(q)}` : '#/produk');
  });
  $('#suggest').addEventListener('click', () => {
    closeSuggest();
    input.blur();
  });

  // keranjang / wishlist dari tab lain
  window.addEventListener('storage', (e) => {
    if (e.key === KEY_CART || e.key === KEY_WISH) updateBadges();
  });
}

// =========================================================
// MULAI
// =========================================================
async function start() {
  try {
    const [{ data }, me] = await Promise.all([S.loadForShop(), S.refreshCsrf()]);
    prepare(data);
    setUser(me.user);
    renderChrome();
    bind();
    updateBadges();
    route();
  } catch (err) {
    console.error(err);
    $('#view').innerHTML = `<div class="container page"><div class="empty"><h2>Data produk gagal dimuat</h2><p>${esc(err.message)} </p><p>Cek: XAMPP (Apache & MySQL) sudah Start, dan <a class="link" href="${RC_CONFIG.installUrl}">install.php</a> sudah dijalankan.</p></div></div>`;
  }
}

start();
