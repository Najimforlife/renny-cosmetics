/* =========================================================
   RENNY COSMETICS — ADMIN: AKUN SAYA
   Ganti password admin.
   ========================================================= */
'use strict';

// =========================================================
// AKUN SAYA (admin)
// =========================================================
function viewAccount(el) {
  el.innerHTML =
    head('Akun saya', `${esc(ADMIN.name)} · ${esc(ADMIN.email)} · ${isOwner() ? 'Owner' : 'Staf'}`) +
    `<form class="panel pad pin-form" id="pwForm" novalidate>
      <h2 class="panel-title">Ganti password</h2>
      <div class="form-grid">
        <div class="field"><label for="pw-old">Password lama</label><input id="pw-old" name="old" type="password" autocomplete="current-password"></div>
        <div class="field"><label for="pw-new">Password baru</label><input id="pw-new" name="new" type="password" autocomplete="new-password"><p class="hint">Minimal 8 karakter, ada huruf dan angka.</p></div>
      </div>
      <button type="submit" class="btn btn-primary">Ganti password</button>
    </form>`;
  $('#pwForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    clearFieldErrors(form);
    try {
      const r = await api('admin/auth.php?action=password', { method: 'PUT', body: { old: form.elements.old.value, new: form.elements.new.value } });
      form.reset();
      toast(r.message);
    } catch (err) {
      showFieldErrors(form, err);
      toastErr(err);
    }
  });
}
