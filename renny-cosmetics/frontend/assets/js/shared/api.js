/* =========================================================
   RENNY COSMETICS — PENGHUBUNG KE BACKEND (API PHP)
   - semua data toko diambil dari database lewat backend/api/ (alamatnya di assets/js/config.js)
   - keranjang, wishlist, terakhir dilihat: localStorage pembeli
   ========================================================= */
const RCStore = (() => {
  'use strict';

  let csrf = '';

  class ApiError extends Error {
    constructor(message, status, errors) {
      super(message);
      this.status = status;
      this.errors = errors || {};
    }
  }

  /**
   * Panggil API. Contoh: api('toko/akun.php?action=masuk', { method: 'POST', body: {...} })
   * Request yang mengubah data otomatis membawa token CSRF.
   */
  async function api(path, { method = 'GET', body, form, retry = true } = {}) {
    const opts = { method, credentials: 'same-origin', headers: { Accept: 'application/json' } };
    if (method !== 'GET') opts.headers['X-CSRF-Token'] = csrf;
    if (form) opts.body = form;
    else if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch(RC_CONFIG.apiBase + path, opts);
    } catch {
      throw new ApiError('Tidak bisa terhubung ke server. Pastikan Apache & MySQL di XAMPP sudah Start.', 0);
    }
    let data;
    try {
      data = await res.json();
    } catch {
      throw new ApiError(
        location.protocol === 'file:'
          ? 'Buka website lewat http://localhost/... (XAMPP), bukan dengan klik dua kali file.'
          : 'Server tidak membalas dengan benar. Pastikan PHP berjalan (XAMPP) dan database sudah dipasang lewat install.php.',
        res.status
      );
    }
    if (data.csrf) csrf = data.csrf;
    if (res.status === 419 && retry) {
      await refreshCsrf();
      return api(path, { method, body, form, retry: false });
    }
    if (!res.ok || data.ok === false) throw new ApiError(data.message || 'Terjadi kesalahan.', res.status, data.errors);
    return data;
  }

  async function refreshCsrf(kind = 'toko/akun.php') {
    const d = await api(`${kind}?action=me`);
    csrf = d.csrf;
    return d;
  }

  /** Data toko untuk halaman pembeli */
  async function loadForShop() {
    const raw = await api('toko/katalog.php');
    return { data: RCCore.unpack(raw) };
  }

  // ---------------------------------------------------------
  // localStorage pembeli (keranjang, wishlist, terakhir dilihat)
  // ---------------------------------------------------------
  function lsGet(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch {
      return fallback;
    }
  }
  function lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* mode privat / penuh */
    }
  }

  // ---------------------------------------------------------
  // Helper tampilan
  // ---------------------------------------------------------
  const rupiah = (n) => 'Rp' + Math.round(n || 0).toLocaleString('id-ID');
  const discount = (p) => (p.compare > p.price ? Math.round((1 - p.price / p.compare) * 100) : 0);
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  function waNumber(raw) {
    let d = String(raw || '').replace(/\D/g, '');
    if (d.startsWith('0')) d = '62' + d.slice(1);
    if (d.startsWith('8')) d = '62' + d;
    return d;
  }
  const waLink = (settings, text) => `https://wa.me/${waNumber(settings.whatsapp)}?text=${encodeURIComponent(text)}`;

  // ikon kategori (SVG sederhana)
  const ICONS = {
    skincare: '<rect x="27" y="4" width="10" height="9" rx="2" opacity=".55"/><path d="M22 15h20v5l4 6v30a5 5 0 0 1-5 5H23a5 5 0 0 1-5-5V26l4-6z"/>',
    makeup: '<path opacity=".55" d="M26 32V16l10-11 4 4v23z"/><rect x="22" y="32" width="20" height="28" rx="3"/>',
    tubuh: '<path opacity=".55" d="M28 4h14v5h-7v7h-7z"/><path d="M18 22a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v34a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6z"/>',
    rambut: '<rect x="26" y="3" width="12" height="8" rx="2" opacity=".55"/><path d="M23 11h18l3 8v38a5 5 0 0 1-5 5H25a5 5 0 0 1-5-5V19z"/>',
    parfum: '<rect x="27" y="4" width="10" height="8" rx="2" opacity=".55"/><rect x="24" y="12" width="16" height="7" rx="2" opacity=".75"/><rect x="12" y="19" width="40" height="41" rx="10"/>',
    kuku: '<rect x="26" y="4" width="12" height="20" rx="3" opacity=".55"/><path d="M20 26h24v26a8 8 0 0 1-8 8h-8a8 8 0 0 1-8-8z"/>',
    aksesoris: '<circle cx="32" cy="32" r="24" opacity=".55"/><circle cx="32" cy="32" r="16"/>',
    lainnya: '<rect x="10" y="22" width="44" height="34" rx="5"/><path opacity=".55" d="M8 14h48v10H8z"/><path opacity=".35" d="M29 14h6v42h-6z"/>',
  };
  const icon = (key) => `<svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">${ICONS[key] || ICONS.lainnya}</svg>`;

  const TONES = [
    ['#FFE3EF', '#C8317A'],
    ['#F8EDD5', '#9C7222'],
    ['#F1E6FB', '#8A4FB8'],
    ['#E3F3EC', '#2E7D5B'],
    ['#FFE7DF', '#C2532F'],
    ['#E6EEFB', '#3E64A8'],
  ];
  function hash(str) {
    let h = 0;
    for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
  }

  /** Foto produk, atau ilustrasi kategori + nama brand kalau belum ada foto */
  function visual(p, brandName, catIcon) {
    if (p.img) return `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" decoding="async">`;
    const [bg, fg] = TONES[hash(p.brand) % TONES.length];
    return `<div class="ph" style="--bg:${bg};--fg:${fg}">${icon(catIcon)}<span>${esc(brandName)}</span></div>`;
  }

  return {
    api,
    ApiError,
    refreshCsrf,
    loadForShop,
    lsGet,
    lsSet,
    rupiah,
    discount,
    esc,
    waNumber,
    waLink,
    icon,
    visual,
    ICON_KEYS: Object.keys(ICONS),
  };
})();
