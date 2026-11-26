/* =========================================================
   RENNY COSMETICS — TOKO: KERANJANG & CHECKOUT
   Wishlist, produk terakhir dilihat, keranjang, dan checkout.
   ========================================================= */
'use strict';

// =========================================================
// WISHLIST & TERAKHIR DILIHAT
// =========================================================
const getWish = () => S.lsGet(KEY_WISH, []);
const getRecent = () => S.lsGet(KEY_RECENT, []);
function addRecent(id) {
  S.lsSet(KEY_RECENT, [id, ...getRecent().filter((x) => x !== id)].slice(0, 20));
}
function toggleWish(id) {
  const list = getWish();
  const on = !list.includes(id);
  S.lsSet(KEY_WISH, on ? [id, ...list] : list.filter((x) => x !== id));
  $$(`[data-wish="${CSS.escape(id)}"]`).forEach((b) => {
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
    b.setAttribute('aria-label', `${on ? 'Hapus dari' : 'Simpan ke'} wishlist`);
  });
  updateBadges();
  toast(on ? 'Disimpan ke wishlist' : 'Dihapus dari wishlist');
  if (!on && parseHash().path === '/wishlist') route();
}

// =========================================================
// KERANJANG
// =========================================================
const getCart = () => S.lsGet(KEY_CART, []);
const setCart = (c) => S.lsSet(KEY_CART, c);

function cartDetailed() {
  const items = getCart()
    .map((i) => {
      const p = byId.get(i.id);
      if (!p || !p.active) return null;
      const qty = p.stock != null ? Math.min(i.qty, p.stock) : i.qty;
      return qty > 0 ? { p, qty, total: p.price * qty } : null;
    })
    .filter(Boolean);
  return { items, total: items.reduce((s, i) => s + i.total, 0), count: items.reduce((s, i) => s + i.qty, 0) };
}

function addToCart(id, qty = 1) {
  const p = byId.get(id);
  if (!p) return;
  if (p.stock === 0) return toast('Stok produk ini sedang habis.');
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  const current = item ? item.qty : 0;
  if (p.stock != null && current + qty > p.stock) return toast(`Stok tersisa ${p.stock}, di keranjang sudah ${current}.`);
  if (item) item.qty += qty;
  else cart.push({ id, qty });
  setCart(cart);
  updateBadges(true);
  if ($('#cartDrawer').open) renderCart();
  toast('Masuk ke keranjang', { label: 'Lihat', fn: openCart });
}

function setQty(id, qty) {
  const p = byId.get(id);
  let cart = getCart();
  if (qty <= 0) cart = cart.filter((i) => i.id !== id);
  else {
    const it = cart.find((i) => i.id === id);
    if (it) it.qty = p && p.stock != null ? Math.min(qty, p.stock) : qty;
  }
  setCart(cart);
  renderCart();
  updateBadges();
}

function renderCart() {
  const { items, total, count } = cartDetailed();
  $('#cartTitle').textContent = count ? `Keranjang (${count})` : 'Keranjang';
  $('#cartItems').innerHTML = items.length
    ? items
        .map(
          ({ p, qty }) => `<div class="cart-item">
        <a class="cart-thumb" href="#/p/${encodeURIComponent(p.id)}" data-close>${visual(p)}</a>
        <div>
          <p class="card-brand">${esc(brandName(p))}</p>
          <p class="cart-name">${esc(p.name)}</p>
          <p class="cart-price">${rupiah(p.price)}</p>
          <div class="cart-row">
            <div class="qty qty-sm">
              <button type="button" data-dec="${esc(p.id)}" aria-label="Kurangi">−</button>
              <span aria-live="polite">${qty}</span>
              <button type="button" data-inc="${esc(p.id)}" aria-label="Tambah" ${p.stock != null && qty >= p.stock ? 'disabled' : ''}>+</button>
            </div>
            <button type="button" class="link-btn" data-remove="${esc(p.id)}">Hapus</button>
          </div>
        </div>
      </div>`
        )
        .join('')
    : `<div class="cart-empty"><p>Keranjangmu masih kosong.</p><a class="btn btn-ghost" href="#/produk" data-close>Mulai belanja</a></div>`;
  $('#cartTotal').textContent = rupiah(total);
  $('#cartFoot').hidden = !items.length;
}

function openCart() {
  renderCart();
  $('#cartDrawer').showModal();
}

function updateBadges(bump = false) {
  const { count } = cartDetailed();
  const cb = $('#cartCount');
  cb.textContent = count > 99 ? '99+' : count;
  cb.hidden = !count;
  if (bump && !reduceMotion) {
    cb.classList.remove('bump');
    void cb.offsetWidth;
    cb.classList.add('bump');
  }
  const w = getWish().filter((id) => byId.get(id)?.active).length;
  const wb = $('#wishCount');
  wb.textContent = w;
  wb.hidden = !w;
}

// ---------- checkout (butuh akun) ----------
let addressCache = null;

async function openCheckout() {
  const { items, total } = cartDetailed();
  if (!items.length) return toast('Keranjang masih kosong.');
  $('#cartDrawer').close();
  if (!USER) {
    toast('Masuk atau daftar dulu untuk checkout.');
    return go('#/masuk?lanjut=checkout');
  }
  $('#coUser').innerHTML = `Pemesan: <b>${esc(USER.name)}</b> · ${esc(USER.phone)}`;
  $('#coItk').checked = !!USER.is_itk;
  $('#coSummary').innerHTML =
    items.map(({ p, qty, total: t }) => `<div class="summary-row"><span>${esc(p.name)} ×${qty}</span><span>${rupiah(t)}</span></div>`).join('') +
    `<div class="summary-row summary-total"><span>Subtotal</span><span>${rupiah(total)}</span></div>
     <p class="summary-note">Belum termasuk ongkir. Stok, ongkir, dan diskon ITK dikonfirmasi admin lewat WhatsApp.</p>`;
  $('#coError').hidden = true;
  try {
    addressCache = (await S.api('toko/alamat.php')).addresses;
  } catch {
    addressCache = [];
  }
  $('#coAddress').innerHTML = addressCache.length
    ? addressCache.map((a) => `<option value="${a.id}" ${a.is_default ? 'selected' : ''}>${esc(a.label)}: ${esc(a.address)}, ${esc(a.city)}</option>`).join('')
    : '<option value="">Belum ada alamat tersimpan</option>';
  $('#checkoutModal').showModal();
}

async function submitCheckout(e) {
  e.preventDefault();
  const method = $('input[name="coMethod"]:checked').value;
  const addressId = Number($('#coAddress').value) || null;
  if (method === 'kirim' && !addressId) {
    $('#coError').textContent = 'Tambahkan alamat dulu di menu Akun > Alamat.';
    $('#coError').hidden = false;
    return;
  }
  const btn = $('#coSubmit');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';
  try {
    const { order } = await S.api('toko/pesanan.php', {
      method: 'POST',
      body: {
        items: cartDetailed().items.map(({ p, qty }) => ({ id: p.id, qty })),
        method,
        address_id: addressId,
        note: $('#coNote').value.trim(),
        itk_claim: $('#coItk').checked,
      },
    });
    setCart([]);
    updateBadges();
    $('#checkoutForm').reset();
    $('#addressField').hidden = true;
    $('#checkoutModal').close();
    go(`#/pesanan-berhasil?kode=${encodeURIComponent(order.code)}`);
  } catch (err) {
    $('#coError').textContent = err.message;
    $('#coError').hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Buat pesanan';
  }
}

function orderWaText(o) {
  const lines = [
    `Halo kak Renny Cosmetics, saya mau konfirmasi pesanan *${o.code}*:`,
    '',
    ...o.items.flatMap((it, i) => [`${i + 1}. ${it.brand_name} - ${it.product_name}`, `   ${it.qty} x ${rupiah(it.price)}`]),
    '',
    `*Subtotal: ${rupiah(o.subtotal)}*`,
    `Cara terima: ${o.method === 'kirim' ? 'Dikirim' : 'Ambil di toko'}`,
  ];
  if (o.address) lines.push(`Alamat: ${o.address}`);
  if (o.note) lines.push(`Catatan: ${o.note}`);
  if (+o.itk_claim) lines.push('Mahasiswa ITK: ya (saya kirim foto KTM)');
  lines.push('', 'Mohon konfirmasi stok, ongkir, dan total pembayarannya ya. Terima kasih!');
  return lines.join('\n');
}
