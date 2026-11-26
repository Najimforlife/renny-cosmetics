/* =========================================================
   RENNY COSMETICS — TOKO: DASAR
   Variabel bersama, persiapan data produk, dan komponen tampilan (kartu produk, dll).
   ========================================================= */
'use strict';

const S = RCStore;
const { esc, rupiah, discount } = S;
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PER_PAGE = 24;
const KEY_CART = 'rc_cart_v2';
const KEY_WISH = 'rc_wish_v1';
const KEY_RECENT = 'rc_recent_v1';

let D; // data toko
let ALL = []; // produk aktif
let byId = new Map();
let brandById = new Map();
let catById = new Map();
let NEWEST = [];
let countdownTimer = null;

// =========================================================
// PERSIAPAN DATA
// =========================================================
function prepare(data) {
  D = data;
  brandById = new Map(D.brands.map((b) => [b.id, b]));
  catById = new Map(D.categories.map((c) => [c.id, c]));
  byId = new Map();
  ALL = [];
  for (const p of D.products) {
    const b = brandById.get(p.brand);
    p._brand = b ? b.name : 'Tanpa brand';
    p._s = `${p.name} ${p._brand} ${p.sub} ${p.id}`.toLowerCase();
    p._base = variantBase(p.name);
    byId.set(p.id, p);
    if (p.active) ALL.push(p);
  }
  NEWEST = [...ALL].sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0));
}

// nama dasar untuk mencari shade/varian lain, misal "Lip Cream 03 Berry" -> "lip cream"
function variantBase(name) {
  const t = name.toLowerCase().split(/\s+/);
  let cut = t.length;
  for (let i = 2; i < t.length; i++) {
    if (/\d/.test(t[i]) || t[i] === '-' || t[i].startsWith('#')) {
      cut = i;
      break;
    }
  }
  return cut >= 2 && cut < t.length ? t.slice(0, cut).join(' ') : '';
}

const brandName = (p) => p._brand;
const catIcon = (p) => (catById.get(p.cat) || {}).icon || 'lainnya';
const visual = (p) => S.visual(p, brandName(p), catIcon(p));
const settings = () => D.settings;
const wa = (text) => S.waLink(D.settings, text);

function flashItems() {
  const s = settings();
  const end = s.flashEndsAt ? new Date(s.flashEndsAt).getTime() : 0;
  if (!s.flashActive || !end || end <= Date.now()) return [];
  return ALL.filter((p) => p.flash && p.compare > p.price && p.stock !== 0).sort((a, b) => discount(b) - discount(a));
}

// =========================================================
// KOMPONEN
// =========================================================
function stockLabel(p) {
  if (p.stock === 0) return { text: 'Stok habis', cls: 'out' };
  if (p.stock != null && p.stock <= 5) return { text: `Sisa ${p.stock}`, cls: 'low' };
  return null;
}

function cardHTML(p, { flash = false } = {}) {
  const d = discount(p);
  const st = stockLabel(p);
  const wished = getWish().includes(p.id);
  return `<article class="card">
    <a class="card-media" href="#/p/${encodeURIComponent(p.id)}" aria-label="${esc(p.name)}" tabindex="-1">
      ${visual(p)}
      ${d ? `<span class="tag-off">-${d}%</span>` : ''}
      ${p.featured ? '<span class="tag-pick">Pilihan Renny</span>' : ''}
      ${st && st.cls === 'out' ? '<span class="tag-out">Stok habis</span>' : ''}
    </a>
    <button type="button" class="wish${wished ? ' on' : ''}" data-wish="${esc(p.id)}" aria-pressed="${wished}" aria-label="${wished ? 'Hapus dari' : 'Simpan ke'} wishlist">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-8.6C1.2 8.3 3 5 6.3 5c2 0 3.2 1.1 3.9 2.2h3.6C14.5 6.1 15.7 5 17.7 5 21 5 22.8 8.3 21.2 11.4 19 15.6 12 20 12 20z"/></svg>
    </button>
    <div class="card-body">
      <p class="card-brand">${esc(brandName(p))}</p>
      <h3 class="card-name"><a href="#/p/${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
      <div class="card-price">
        <strong>${rupiah(p.price)}</strong>
        ${d ? `<s>${rupiah(p.compare)}</s>` : ''}
      </div>
      ${p.reviews > 0 ? `<p class="card-meta"><span class="stars">★ ${Number(p.rating).toFixed(1)}</span> (${p.reviews})</p>` : ''}
      ${st && st.cls === 'low' ? `<p class="card-stock">${st.text}</p>` : ''}
      ${flash && p.stock != null && p.stock > 0 ? `<div class="flash-bar"><span style="width:${Math.max(12, Math.min(100, (p.stock / 30) * 100))}%"></span></div>` : ''}
      <div class="card-foot">
        <button type="button" class="btn btn-add btn-sm" data-add="${esc(p.id)}" ${p.stock === 0 ? 'disabled' : ''}>${p.stock === 0 ? 'Stok habis' : '+ Keranjang'}</button>
      </div>
    </div>
  </article>`;
}

const gridHTML = (list) => `<div class="grid">${list.map((p) => cardHTML(p)).join('')}</div>`;
const scrollerHTML = (list, opts) => `<div class="scroller">${list.map((p) => cardHTML(p, opts)).join('')}</div>`;

function sectionHead(title, sub, href, linkText = 'Lihat semua') {
  return `<div class="section-head">
    <div><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>
    ${href ? `<a class="link" href="${href}">${linkText}</a>` : ''}
  </div>`;
}
