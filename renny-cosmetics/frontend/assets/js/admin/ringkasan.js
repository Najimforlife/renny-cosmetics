/* =========================================================
   RENNY COSMETICS — ADMIN: RINGKASAN
   Halaman ringkasan toko.
   ========================================================= */
'use strict';

// =========================================================
// RINGKASAN
// =========================================================
async function viewSummary(el) {
  const title = head('Ringkasan', 'Kondisi toko online Renny Cosmetics hari ini.');
  el.innerHTML = title + loadingHTML;
  const r = await refreshBadges();
  const s = r.settings || {};
  const todo = [
    r.ordersNew && [`Ada ${r.ordersNew} pesanan baru yang belum dikonfirmasi.`, '#pesanan', 'Buka pesanan'],
    (!s.shippingInfo || !s.paymentInfo) && ['Isi info ongkir & metode pembayaran untuk halaman Bantuan.', '#pengaturan', 'Isi sekarang'],
    !s.hours && ['Isi jam buka toko.', '#pengaturan', 'Isi sekarang'],
    r.logos === 0 && ['Upload logo brand supaya deretan brand di beranda tampil dengan logo.', '#brand', 'Upload logo'],
    r.tracked === 0 && ['Stok belum disinkronkan dari iPOS. Saat ini stok dikonfirmasi lewat WhatsApp.', '#data', 'Sinkron stok'],
    r.featured === 0 && ['Tandai beberapa produk sebagai "Pilihan Renny" untuk tampil di beranda.', '#produk', 'Buka produk'],
  ].filter(Boolean);
  const n = (x) => Number(x).toLocaleString('id-ID');
  el.innerHTML =
    title +
    `<div class="stats">
      <a class="stat ${r.ordersNew ? 'warn' : ''}" href="#pesanan"><span>Pesanan baru</span><strong>${n(r.ordersNew)}</strong><small>${n(r.ordersToday)} pesanan hari ini</small></a>
      <a class="stat" href="#pesanan"><span>Penjualan bulan ini</span><strong>${rupiah(r.salesMonth)}</strong><small>pesanan berstatus Selesai</small></a>
      <a class="stat" href="#produk"><span>Produk aktif</span><strong>${n(r.active)}</strong><small>${n(r.noPhoto)} belum ada foto</small></a>
      <a class="stat" href="#pengguna"><span>Pembeli terdaftar</span><strong>${n(r.users)}</strong><small>akun pembeli</small></a>
      <a class="stat ${r.flashOn ? 'good' : ''}" href="#pengaturan"><span>Flash sale</span><strong>${r.flashOn ? 'Aktif' : 'Mati'}</strong><small>${n(r.flashCount)} produk ikut</small></a>
    </div>
    <div class="two-col">
      <section class="panel pad">
        <h2 class="panel-title">Pesanan terbaru</h2>
        ${
          r.latestOrders.length
            ? `<ul class="mini-orders">${r.latestOrders.map((o) => `<li><span><b>${esc(o.code)}</b><small>${esc(o.customer_name)} · ${fmtDate(o.created_at)}</small></span><span class="nowrap">${rupiah(o.subtotal)}</span>${statusBadge(o.status)}</li>`).join('')}</ul>`
            : '<p class="muted">Belum ada pesanan.</p>'
        }
      </section>
      <section class="panel pad">
        <h2 class="panel-title">Yang perlu dikerjakan</h2>
        ${todo.length ? `<ul class="todo">${todo.map(([t, href, l]) => `<li><span>${esc(t)}</span><a class="link" href="${href}">${l}</a></li>`).join('')}</ul>` : '<p class="muted">Semua beres.</p>'}
      </section>
    </div>`;
}
