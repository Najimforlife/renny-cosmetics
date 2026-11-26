/* =========================================================
   RENNY COSMETICS — ADMIN: DASAR
   Variabel bersama, helper (toast, form, upload gambar), dan data inti.
   ========================================================= */
'use strict';

const S = RCStore;
const { esc, rupiah, discount, api } = S;
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const PER_PAGE = 25;

let ADMIN = null;
let PRODUCTS = [];
let byId = new Map();
let CATS = [];
let BRANDS = [];
const isOwner = () => ADMIN?.role === 'owner';

const STATUS = {
  baru: ['Baru', 'st-new'],
  dikonfirmasi: ['Dikonfirmasi', 'st-ok'],
  dikemas: ['Dikemas', 'st-ok'],
  dikirim: ['Dikirim / siap diambil', 'st-ship'],
  selesai: ['Selesai', 'st-done'],
  dibatalkan: ['Dibatalkan', 'st-cancel'],
};
const statusBadge = (s) => `<span class="status ${STATUS[s]?.[1] || ''}">${esc(STATUS[s]?.[0] || s)}</span>`;
const fmtDate = (d) => (d ? new Date(String(d).replace(' ', 'T')).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

// =========================================================
// UTIL
// =========================================================
const brandName = (id) => (BRANDS.find((b) => b.id === id) || {}).name || 'Tanpa brand';
const catName = (id) => (CATS.find((c) => c.id === id) || {}).name || id;
const catIcon = (id) => (CATS.find((c) => c.id === id) || {}).icon || 'lainnya';
const visual = (p) => S.visual(p, brandName(p.brand), catIcon(p.cat));
const unpackRows = (rows) => RCCore.unpack({ products: rows }).products;

let toastTimer;
function toast(msg, type = '') {
  const el = $('#toast');
  el.className = `toast show ${type}`;
  el.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}
const toastErr = (err) => toast(err.message || String(err), 'error');

function confirmBox(title, text, okLabel = 'Hapus') {
  return new Promise((resolve) => {
    const m = $('#confirmModal');
    $('#confirmTitle').textContent = title;
    $('#confirmText').textContent = text;
    $('#confirmOk').textContent = okLabel;
    const done = (v) => {
      m.onclose = null;
      m.close();
      resolve(v);
    };
    $('#confirmOk').onclick = () => done(true);
    $('#confirmCancel').onclick = () => done(false);
    m.onclose = () => resolve(false);
    m.showModal();
  });
}

function showFieldErrors(form, err) {
  Object.entries(err.errors || {}).forEach(([name, msg]) => {
    const el = form.elements[name];
    if (el && el.insertAdjacentHTML) {
      el.classList.add('is-invalid');
      el.insertAdjacentHTML('afterend', `<p class="field-error">${esc(msg)}</p>`);
    }
  });
}
function clearFieldErrors(form) {
  $$('.field-error', form).forEach((x) => x.remove());
  $$('.is-invalid', form).forEach((x) => x.classList.remove('is-invalid'));
}

/** Form modal umum. onSubmit(data, form) boleh melempar error API */
function openForm({ title, body, submit = 'Simpan', onSubmit, onOpen, wide = false, hideSubmit = false }) {
  const m = $('#formModal');
  m.classList.toggle('modal-wide', wide);
  $('#formTitle').textContent = title;
  $('#formBody').innerHTML = body;
  const btn = $('#formSubmit');
  btn.textContent = submit;
  btn.hidden = hideSubmit;
  $('#formError').hidden = true;
  const form = $('#modalForm');
  form.onsubmit = async (e) => {
    e.preventDefault();
    $('#formError').hidden = true;
    clearFieldErrors(form);
    btn.disabled = true;
    try {
      const d = {};
      new FormData(form).forEach((v, k) => (d[k] = v));
      $$('input[type=checkbox][name]', form).forEach((c) => (d[c.name] = c.checked));
      await onSubmit(d, form);
      m.close();
    } catch (err) {
      showFieldErrors(form, err);
      $('#formError').textContent = err.message || 'Gagal menyimpan.';
      $('#formError').hidden = false;
    } finally {
      btn.disabled = false;
    }
  };
  m.showModal();
  onOpen?.(form);
  $('input:not([type=hidden]):not([readonly]):not([type=file]), textarea, select', form)?.focus();
}

// kecilkan gambar di browser sebelum diupload
function resizeImage(file, { max = 800, type = 'image/webp', quality = 0.85, bg = '#fff' } = {}) {
  return new Promise((resolve, reject) => {
    if (!/^image\//.test(file.type)) return reject(new Error('File yang dipilih bukan gambar.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext('2d');
      if (bg) {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, c.width, c.height);
      }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('Gambar gagal diproses.'))), type, quality);
    };
    img.onerror = () => reject(new Error('Gambar tidak bisa dibaca.'));
    img.src = url;
  });
}

async function uploadImage(file, jenis) {
  const logo = jenis === 'logo';
  const fd = new FormData();
  fd.append('jenis', jenis);
  if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) {
    // SVG (vektor) dikirim apa adanya: tetap tajam di semua ukuran
    fd.append('file', file, 'gambar.svg');
  } else {
    // foto biasa dikecilkan dan diubah ke WebP (lebih ringan dari JPG)
    let blob = await resizeImage(file, logo ? { max: 400, bg: null } : {});
    if (blob.type !== 'image/webp') blob = await resizeImage(file, logo ? { max: 400, type: 'image/png', bg: null } : { type: 'image/jpeg' });
    const ext = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' }[blob.type] || 'webp';
    fd.append('file', blob, `gambar.${ext}`);
  }
  return (await api('admin/upload.php', { method: 'POST', form: fd })).url;
}

function pagerHTML(page, total, attr) {
  if (total <= 1) return '';
  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return `<nav class="pager" aria-label="Halaman">
    <button type="button" ${attr}="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Sebelumnya">‹</button>
    ${pages.map((n) => (n === '…' ? '<span class="dots">…</span>' : `<button type="button" ${attr}="${n}" class="${n === page ? 'on' : ''}" ${n === page ? 'aria-current="page"' : ''}>${n}</button>`)).join('')}
    <button type="button" ${attr}="${page + 1}" ${page >= total ? 'disabled' : ''} aria-label="Berikutnya">›</button>
  </nav>`;
}

const head = (title, sub, actions = '') =>
  `<header class="view-head"><div><h1>${esc(title)}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${actions ? `<div class="view-actions">${actions}</div>` : ''}</header>`;

const loadingHTML = '<div class="loading small"><span class="spinner" aria-hidden="true"></span></div>';

// =========================================================
// DATA INTI (produk, kategori, brand)
// =========================================================
async function loadCore() {
  const [p, c, b] = await Promise.all([api('admin/produk.php'), api('admin/kategori.php'), api('admin/brand.php')]);
  PRODUCTS = unpackRows(p.products);
  byId = new Map(PRODUCTS.map((x) => [x.id, x]));
  CATS = c.categories;
  BRANDS = b.brands;
}

function putProduct(row) {
  const p = unpackRows([row])[0];
  if (byId.has(p.id)) Object.assign(byId.get(p.id), p);
  else {
    PRODUCTS.push(p);
    byId.set(p.id, p);
  }
}

async function refreshBadges() {
  const r = await api('admin/ringkasan.php');
  $('#navOrders').textContent = r.ordersNew;
  $('#navOrders').hidden = !r.ordersNew;
  const bar = $('#statusBar');
  bar.className = `status-bar ${r.ordersNew ? 'dirty' : 'clean'}`;
  bar.innerHTML = `<span>Halo, <b>${esc(ADMIN.name)}</b> (${isOwner() ? 'owner' : 'staf'}).</span>${
    r.ordersNew ? `<a class="btn btn-primary btn-sm" href="#pesanan">${r.ordersNew} pesanan baru menunggu</a>` : '<span>Tidak ada pesanan baru.</span>'
  }`;
  return r;
}
