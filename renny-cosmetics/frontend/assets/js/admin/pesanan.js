/* =========================================================
   RENNY COSMETICS — ADMIN: PESANAN
   Daftar pesanan, detail, ubah status.
   ========================================================= */
'use strict';

// =========================================================
// PESANAN
// =========================================================
const orderState = { status: '', q: '', page: 1 };

async function viewOrders(el) {
  el.innerHTML =
    head('Pesanan', 'Pesanan dari pembeli. Konfirmasi stok & ongkir lewat WhatsApp, lalu ubah statusnya di sini.') +
    `<div class="panel">
      <div class="toolbar">
        <div class="seg" id="oseg"></div>
        <input type="search" class="input input-sm" id="oq" placeholder="Cari kode, nama, atau no. HP" value="${esc(orderState.q)}" aria-label="Cari pesanan">
      </div>
      <div id="otable">${loadingHTML}</div>
    </div>`;
  const render = async () => {
    const qs = new URLSearchParams({ status: orderState.status, q: orderState.q, hal: orderState.page });
    const r = await api('admin/pesanan.php?' + qs);
    const all = Object.values(r.counts).reduce((a, b) => a + b, 0);
    $('#oseg', el).innerHTML = [['', 'Semua', all], ...Object.entries(STATUS).map(([k, [l]]) => [k, l.split(' /')[0], r.counts[k] || 0])]
      .map(([k, l, c]) => `<button type="button" class="seg-btn${orderState.status === k ? ' on' : ''}" data-status="${k}">${esc(l)} <span>${c}</span></button>`)
      .join('');
    $('#otable', el).innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Kode</th><th>Pelanggan</th><th>Cara terima</th><th>Item</th><th>Subtotal</th><th>Status</th><th><span class="sr-only">Aksi</span></th></tr></thead>
        <tbody>${r.orders
          .map(
            (o) => `<tr>
            <td><strong>${esc(o.code)}</strong><small>${fmtDate(o.created_at)}</small></td>
            <td>${esc(o.customer_name)}<small>${esc(o.phone)}${+o.itk_claim ? ' · ITK' : ''}</small></td>
            <td>${o.method === 'kirim' ? 'Dikirim' : 'Ambil di toko'}</td>
            <td>${o.items || 0}</td>
            <td class="nowrap"><strong>${rupiah(o.subtotal)}</strong></td>
            <td>${statusBadge(o.status)}</td>
            <td><div class="row-actions"><button type="button" class="btn btn-ghost btn-sm" data-open="${o.id}">Detail</button></div></td>
          </tr>`
          )
          .join('')}</tbody>
      </table></div>
      ${r.orders.length ? '' : '<p class="table-empty">Belum ada pesanan dengan filter ini.</p>'}
      ${pagerHTML(orderState.page, r.pages, 'data-opage')}`;
  };
  let t;
  $('#oq', el).addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      orderState.q = e.target.value.trim();
      orderState.page = 1;
      render().catch(toastErr);
    }, 300);
  });
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-status],[data-open],[data-opage]');
    if (!b) return;
    if (b.dataset.open) return openOrder(Number(b.dataset.open), render).catch(toastErr);
    if (b.dataset.opage) orderState.page = Number(b.dataset.opage);
    else {
      orderState.status = b.dataset.status;
      orderState.page = 1;
    }
    render().catch(toastErr);
  });
  await render();
}

async function openOrder(id, after) {
  const { order: o } = await api(`admin/pesanan.php?id=${id}`);
  const waText = `Halo kak ${o.customer_name}, ini admin Renny Cosmetics soal pesanan ${o.code}.`;
  const reload = () => {
    after().catch(toastErr);
    refreshBadges().catch(() => {});
  };
  openForm({
    title: `Pesanan ${o.code}`,
    wide: true,
    submit: 'Simpan status',
    body: `<div class="order-detail">
      <div class="od-info">
        <p><span>Pelanggan</span><b>${esc(o.customer_name)}</b>${o.email ? ` · ${esc(o.email)}` : ' · <i>akun sudah dihapus</i>'}</p>
        <p><span>No. HP</span><b>${esc(o.phone)}</b> <a class="link" target="_blank" rel="noopener" href="https://wa.me/${S.waNumber(o.phone)}?text=${encodeURIComponent(waText)}">Chat WhatsApp</a></p>
        <p><span>Cara terima</span><b>${o.method === 'kirim' ? 'Dikirim' : 'Ambil di toko'}</b></p>
        ${o.address ? `<p><span>Alamat</span>${esc(o.address)}</p>` : ''}
        ${o.note ? `<p><span>Catatan</span>${esc(o.note)}</p>` : ''}
        <p><span>Mahasiswa ITK</span>${+o.itk_claim ? '<b>Ya</b> (cek KTM, diskon 15%)' : 'Tidak'}</p>
        <p><span>Dibuat</span>${fmtDate(o.created_at)}</p>
      </div>
      <div class="table-wrap"><table class="table od-items"><thead><tr><th>Produk</th><th>Kode</th><th>Jml</th><th>Harga</th></tr></thead><tbody>
        ${o.items.map((it) => `<tr><td>${esc(it.brand_name)} - ${esc(it.product_name)}</td><td><small>${esc(it.product_id || '—')}</small></td><td>${it.qty}</td><td class="nowrap">${rupiah(it.price * it.qty)}</td></tr>`).join('')}
        <tr class="od-total"><td colspan="3">Subtotal (belum ongkir & diskon)</td><td class="nowrap">${rupiah(o.subtotal)}</td></tr>
      </tbody></table></div>
      <div class="form-grid">
        <div class="field"><label for="o-status">Status</label><select id="o-status" name="status">${Object.entries(STATUS).map(([k, [l]]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label for="o-note">Catatan untuk pembeli</label><input id="o-note" name="admin_note" maxlength="300" value="${esc(o.admin_note || '')}" placeholder="Misal: ongkir Rp10.000, total Rp109.000"></div>
      </div>
      ${isOwner() ? '<button type="button" class="link-btn danger" id="delOrder">Hapus pesanan ini</button>' : ''}
    </div>`,
    onOpen: () => {
      $('#delOrder')?.addEventListener('click', async () => {
        $('#formModal').close();
        if (!(await confirmBox('Hapus pesanan?', `Pesanan ${o.code} akan dihapus permanen.`))) return;
        try {
          toast((await api(`admin/pesanan.php?id=${o.id}`, { method: 'DELETE' })).message);
          reload();
        } catch (err) {
          toastErr(err);
        }
      });
    },
    onSubmit: async (d) => {
      const r = await api(`admin/pesanan.php?id=${o.id}`, { method: 'PUT', body: d });
      toast(r.message);
      reload();
    },
  });
}
