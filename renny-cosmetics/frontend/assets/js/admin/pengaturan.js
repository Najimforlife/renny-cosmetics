/* =========================================================
   RENNY COSMETICS — ADMIN: PENGATURAN
   Pengaturan toko, flash sale, dan tampilan animasi.
   ========================================================= */
'use strict';

// =========================================================
// PENGATURAN TOKO
// =========================================================
async function viewSettings(el) {
  const s = Object.assign({}, RCCore.DEFAULT_SETTINGS, (await api('admin/pengaturan.php')).settings);
  const toLocal = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const ro = !isOwner();
  const f = (name, label, opts = {}) => `<div class="field ${opts.span ? 'span-2' : ''}">
    <label for="s-${name}">${label}</label>
    ${opts.area ? `<textarea id="s-${name}" name="${name}" rows="${opts.rows || 3}" placeholder="${esc(opts.ph || '')}" ${ro ? 'readonly' : ''}>${esc(s[name] || '')}</textarea>` : `<input id="s-${name}" name="${name}" type="${opts.type || 'text'}" value="${esc(s[name] || '')}" placeholder="${esc(opts.ph || '')}" ${ro ? 'readonly' : ''}>`}
    ${opts.hint ? `<p class="hint">${opts.hint}</p>` : ''}
  </div>`;
  el.innerHTML =
    head('Pengaturan toko', ro ? 'Hanya owner yang bisa mengubah pengaturan.' : 'Kolom yang dikosongkan tidak ditampilkan di website.') +
    `<form id="settingsForm" novalidate>
      <section class="panel pad"><h2 class="panel-title">Kontak & lokasi</h2><div class="form-grid">
        ${f('whatsapp', 'Nomor WhatsApp toko', { ph: '0811-5403-403', hint: 'Tujuan konfirmasi pesanan. Boleh pakai format 08xx atau 628xx.' })}
        ${f('hours', 'Jam buka', { ph: 'Setiap hari, 09.00–22.00 WITA' })}
        ${f('address', 'Alamat toko', { span: true })}
        ${f('mapsUrl', 'Link Google Maps', { span: true, ph: 'https://maps.app.goo.gl/...', hint: 'Opsional. Kalau kosong, dibuat otomatis dari alamat.' })}
        ${f('email', 'Email', { type: 'email' })}
        ${f('instagram', 'Instagram', { ph: 'rennycosmetics33' })}
        ${f('tiktok', 'TikTok', { ph: 'rennycosmetics33' })}
        ${f('shopee', 'Shopee', { ph: 'rennyskincare33' })}
      </div></section>
      <section class="panel pad"><h2 class="panel-title">Keunggulan toko</h2><div class="form-grid">
        ${f('topbar', 'Teks bar paling atas', { span: true })}
        ${f('brandHighlight', 'Pilihan brand', { span: true, area: true, rows: 2 })}
        ${f('itkDiscount', 'Diskon mahasiswa ITK', { span: true, area: true, rows: 2 })}
        ${f('offlineStore', 'Toko offline', { span: true, area: true, rows: 2 })}
      </div></section>
      <section class="panel pad"><h2 class="panel-title">Ongkir & pembayaran (halaman Bantuan)</h2><div class="form-grid">
        ${f('shippingInfo', 'Info ongkir', { span: true, area: true, ph: 'Contoh: Ongkir dihitung sesuai alamat. Tersedia kurir lokal Balikpapan, JNE, dan J&T.' })}
        ${f('paymentInfo', 'Metode pembayaran', { span: true, area: true, ph: 'Contoh: Transfer bank, QRIS, atau bayar di toko.' })}
      </div></section>
      <section class="panel pad"><h2 class="panel-title">Flash sale</h2><div class="form-grid">
        <div class="field span-2"><label class="check"><input type="checkbox" name="flashActive" ${s.flashActive ? 'checked' : ''} ${ro ? 'disabled' : ''}> Aktifkan flash sale</label>
          <p class="hint">Produk yang tampil: produk aktif yang dicentang “Ikut flash sale” dan punya harga coret (${PRODUCTS.filter((p) => p.active && p.flash && p.compare > p.price).length} produk).</p></div>
        <div class="field"><label for="s-flashEndsAt">Berakhir pada</label><input id="s-flashEndsAt" name="flashEndsAt" type="datetime-local" value="${toLocal(s.flashEndsAt)}" ${ro ? 'readonly' : ''}></div>
      </div></section>
      <section class="panel pad"><h2 class="panel-title">Tampilan & animasi beranda</h2>
        <p class="hint">Animasi yang terus bergerak bisa membuat HP atau laptop lama terasa berat. Pilih yang paling ringan kalau ragu.</p>
        <fieldset class="field"><legend>Deretan brand di beranda</legend>
          <div class="choice-list">
            ${[
              ['grid', 'Grid diam', 'Paling ringan. Logo brand tersusun rapi, tidak bergerak.'],
              ['geser', 'Geser manual', 'Satu baris, pembeli menggeser sendiri dengan jari atau tombol panah.'],
              ['jalan', 'Berjalan otomatis', 'Satu baris bergerak pelan. Berhenti saat tidak terlihat di layar.'],
            ].map(([v, l, d]) => `<label class="choice"><input type="radio" name="brandStyle" value="${v}" ${(s.brandStyle || 'grid') === v ? 'checked' : ''} ${ro ? 'disabled' : ''}><span><b>${l}</b><small>${d}</small></span></label>`).join('')}
          </div>
        </fieldset>
        <label class="check"><input type="checkbox" name="bannerAuto" ${s.bannerAuto !== false ? 'checked' : ''} ${ro ? 'disabled' : ''}> Banner promo berganti otomatis tiap 6 detik</label>
        <p class="hint">Pengunjung yang mengaktifkan "kurangi animasi" di HP-nya otomatis mendapat versi tanpa gerakan.</p>
      </section>
      ${ro ? '' : '<p class="form-error" id="setErr" hidden></p><button type="submit" class="btn btn-primary btn-lg">Simpan pengaturan</button>'}
    </form>`;
  if (ro) return;
  $('#settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const d = {};
    new FormData(form).forEach((v, k) => (d[k] = v));
    d.flashActive = form.elements.flashActive.checked;
    d.bannerAuto = form.elements.bannerAuto.checked;
    d.flashEndsAt = d.flashEndsAt ? new Date(d.flashEndsAt).toISOString() : '';
    clearFieldErrors(form);
    const btn = $('button[type=submit]', form);
    btn.disabled = true;
    try {
      const r = await api('admin/pengaturan.php', { method: 'PUT', body: d });
      $('#setErr').hidden = true;
      toast(r.message);
    } catch (err) {
      showFieldErrors(form, err);
      $('#setErr').textContent = err.message;
      $('#setErr').hidden = false;
      toastErr(err);
    } finally {
      btn.disabled = false;
    }
  });
}
