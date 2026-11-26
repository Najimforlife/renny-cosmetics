/* =========================================================
   RENNY COSMETICS — TOKO: BERANDA
   Halaman beranda (landing page): banner promo, kategori, brand, flash sale.
   ========================================================= */
'use strict';

// =========================================================
// BERANDA
// =========================================================
function promoLink(link) {
  if (link === 'wa') return { href: wa('Halo kak Renny Cosmetics, saya mau konsultasi produk.'), ext: true };
  if (/^https?:/i.test(link)) return { href: link, ext: true };
  if (link === '#lokasi') return { href: '#/lokasi', ext: false };
  return { href: link || '#/produk', ext: false };
}

function homeHTML() {
  const s = settings();
  const flash = flashItems();
  const maxDisc = flash.length ? discount(flash[0]) : 0;
  const counts = {};
  ALL.forEach((p) => (counts[p.cat] = (counts[p.cat] || 0) + 1));

  const slides = D.promos
    .map((pr, i) => {
      const l = promoLink(pr.link);
      return `<div class="slide slide-${esc(pr.theme || 'soft')}" role="group" aria-roledescription="slide" aria-label="${i + 1} dari ${D.promos.length}" ${i ? 'aria-hidden="true"' : ''}>
        <div class="slide-text">
          <h2>${esc(pr.title)}</h2>
          <p>${esc(pr.subtitle)}</p>
          <a class="btn slide-btn" href="${esc(l.href)}" ${l.ext ? 'target="_blank" rel="noopener"' : ''} ${i ? 'tabindex="-1"' : ''}>${esc(pr.cta || 'Lihat')}</a>
        </div>
        <div class="slide-art" aria-hidden="true">${S.icon(['skincare', 'parfum', 'makeup', 'tubuh', 'kuku'][i % 5])}</div>
      </div>`;
    })
    .join('');

  // deretan brand: yang punya logo dulu, lalu yang produknya paling banyak
  const bCount = {};
  ALL.forEach((p) => (bCount[p.brand] = (bCount[p.brand] || 0) + 1));
  const topBrands = D.brands
    .filter((b) => b.id !== 'lainnya' && bCount[b.id])
    .sort((a, b) => (!!b.logo - !!a.logo) || bCount[b.id] - bCount[a.id]);

  const featured = ALL.filter((p) => p.featured).slice(0, 12);
  // produk terbaru yang bervariasi: lewati produk tanpa brand & nama yang mirip
  const varied = (list, n) => {
    const seen = new Set();
    const out = [];
    for (const p of list) {
      if (p.brand === 'lainnya') continue;
      const key = p.brand + '|' + p.name.toLowerCase().split(/\s+/).slice(0, 2).join(' ');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(p);
      if (out.length >= n) break;
    }
    return out;
  };
  const catRow = (catId, title) => {
    const list = varied(NEWEST.filter((p) => p.cat === catId), 12);
    if (!list.length) return '';
    return `<section class="section container">${sectionHead(title, '', `#/produk?kat=${catId}`)}${scrollerHTML(list)}</section>`;
  };

  const perks = [
    ['shield', 'Produk original', 'Dijamin asli, bukan tiruan.'],
    ['grid', s.brandHighlight ? '140+ brand' : 'Banyak brand', s.brandHighlight || 'Brand lokal & internasional.'],
    ['cap', 'Diskon mahasiswa ITK', 'Tunjukkan KTM di toko.'],
    ['truck', 'Ambil atau dikirim', 'Pesan via WA, ambil di toko atau kirim.'],
  ];

  const highlights = [
    s.brandHighlight && ['grid', 'Pilihan brand lengkap', s.brandHighlight],
    s.itkDiscount && ['cap', 'Diskon mahasiswa ITK', s.itkDiscount],
    s.offlineStore && ['store', 'Ada toko offline', s.offlineStore],
    ['shield', 'Produk original', 'Semua produk dijamin asli. Ragu dengan suatu produk? Tanyakan ke admin sebelum membeli.'],
    ['chat', 'Konsultasi gratis', 'Bingung pilih produk yang cocok? Admin kami bantu rekomendasikan lewat WhatsApp.'],
    ['truck', 'Ambil di toko atau dikirim', 'Pesan lewat WhatsApp, lalu ambil di toko atau dikirim ke alamatmu.'],
  ].filter(Boolean);

  const testi = D.testimonials.filter((t) => t.visible);
  const recent = getRecent()
    .map((id) => byId.get(id))
    .filter((p) => p && p.active)
    .slice(0, 12);

  return `
    <section class="hero container">
      <div class="hero-grid">
        <div class="carousel" id="carousel" aria-roledescription="carousel" aria-label="Promo">
          <div class="carousel-track">${slides}</div>
          ${D.promos.length > 1 ? `
          <button type="button" class="car-btn prev" data-car="-1" aria-label="Promo sebelumnya">‹</button>
          <button type="button" class="car-btn next" data-car="1" aria-label="Promo berikutnya">›</button>
          <div class="car-dots">${D.promos.map((_, i) => `<button type="button" data-dot="${i}" aria-label="Ke promo ${i + 1}" ${i ? '' : 'aria-current="true"'}></button>`).join('')}</div>` : ''}
        </div>
        <div class="hero-side">
          ${flash.length
            ? `<a href="#/" data-scroll="flash" class="tile tile-dark"><span class="tile-title">Flash sale, diskon sampai ${maxDisc}%</span><span>Berakhir dalam <b class="cd-inline" data-countdown></b></span></a>`
            : `<a href="#/lokasi" class="tile tile-dark"><span class="tile-title">Diskon mahasiswa ITK</span><span>Berlaku selamanya, tunjukkan KTM di toko</span></a>`}
          <a href="${esc(wa('Halo kak Renny Cosmetics, saya mau konsultasi produk.'))}" target="_blank" rel="noopener" class="tile tile-gold"><span class="tile-title">Konsultasi gratis</span><span>Tanya produk yang cocok lewat WhatsApp</span></a>
        </div>
      </div>
    </section>

    <section class="container">
      <ul class="perks">${perks.map(([ic, t, d]) => `<li>${uiIcon(ic)}<div><b>${esc(t)}</b><span>${esc(d)}</span></div></li>`).join('')}</ul>
    </section>

    <section class="section container">
      ${sectionHead('Belanja per kategori', '', '#/produk')}
      <div class="cat-grid">
        ${D.categories
          .map(
            (c) => `<a class="cat-tile" href="#/produk?kat=${c.id}">
              <span class="cat-icon">${S.icon(c.icon)}</span>
              <span class="cat-name">${esc(c.name)}</span>
              <span class="cat-count">${(counts[c.id] || 0).toLocaleString('id-ID')} produk</span>
            </a>`
          )
          .join('')}
      </div>
    </section>

    ${flash.length ? `
    <section class="section container" id="flash">
      <div class="flash">
        <div class="section-head">
          <div class="flash-title">
            <h2>⚡ Flash sale</h2>
            <p>Berakhir dalam <span class="countdown" data-countdown></span></p>
          </div>
          <a class="link" href="#/produk?diskon=1&urut=diskon">Lihat semua promo</a>
        </div>
        ${scrollerHTML(flash.slice(0, 12), { flash: true })}
      </div>
    </section>` : ''}

    <section class="brand-wall">
      <div class="container">${sectionHead('Belanja per brand', `${(D.brands.length - 1).toLocaleString('id-ID')} brand tersedia`, '#/brand', 'Semua brand')}</div>
      ${brandRowHTML(topBrands)}
    </section>

    ${featured.length ? `<section class="section container">${sectionHead('Pilihan Renny', 'Rekomendasi favorit kami.', '#/produk?unggulan=1')}${scrollerHTML(featured)}</section>` : ''}

    <section class="section container">
      ${sectionHead('Produk terbaru', 'Baru masuk di toko.', '#/produk?urut=terbaru')}
      ${gridHTML(varied(NEWEST, 12))}
    </section>

    ${catRow('skincare', 'Skincare terbaru')}
    ${catRow('makeup', 'Makeup terbaru')}
    ${catRow('tubuh', 'Perawatan tubuh terbaru')}

    ${recent.length ? `<section class="section container">${sectionHead('Terakhir kamu lihat', '', null)}${scrollerHTML(recent)}</section>` : ''}

    <section class="highlights">
      <div class="container">
        ${sectionHead('Kenapa belanja di Renny Cosmetics', '', null)}
        <div class="hl-grid">
          ${highlights.map(([ic, t, d]) => `<div class="hl">${uiIcon(ic)}<h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}
        </div>
      </div>
    </section>

    ${testi.length ? `
    <section class="section container">
      ${sectionHead('Kata pelanggan', '', null)}
      <div class="testi-grid">
        ${testi.map((t) => `<figure class="testi"><div class="stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div><blockquote>“${esc(t.text)}”</blockquote><figcaption><b>${esc(t.name)}</b>${t.city ? ` · ${esc(t.city)}` : ''}</figcaption></figure>`).join('')}
      </div>
    </section>` : ''}

    ${locationHTML()}
  `;
}

function locationHTML() {
  const s = settings();
  const maps = s.mapsUrl || (s.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Renny Cosmetics ' + s.address)}` : '');
  const socials = socialList();
  return `<section class="visit" id="lokasi">
    <div class="container visit-grid">
      <div>
        <h2>Mampir ke toko</h2>
        ${s.address ? `<p class="visit-address">${esc(s.address)}</p>` : ''}
        ${s.hours ? `<p class="visit-hours">Buka ${esc(s.hours)}</p>` : ''}
        ${s.offlineStore ? `<p class="visit-note">${esc(s.offlineStore)}</p>` : ''}
        <div class="btn-row">
          ${maps ? `<a class="btn btn-primary" href="${esc(maps)}" target="_blank" rel="noopener">Buka di Google Maps</a>` : ''}
          <a class="btn btn-ghost" href="${esc(wa('Halo kak Renny Cosmetics, saya mau tanya produk.'))}" target="_blank" rel="noopener">Chat WhatsApp</a>
        </div>
      </div>
      ${socials.length ? `<div class="visit-card">
        <h3>Belanja juga di</h3>
        <ul class="social-list">${socials.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${x.label} <span>${esc(x.handle)}</span></a></li>`).join('')}</ul>
      </div>` : ''}
    </div>
  </section>`;
}

function socialList() {
  const s = settings();
  const clean = (v) => String(v || '').replace(/^@/, '').trim();
  return [
    clean(s.instagram) && { label: 'Instagram', handle: '@' + clean(s.instagram), url: `https://instagram.com/${clean(s.instagram)}` },
    clean(s.tiktok) && { label: 'TikTok', handle: '@' + clean(s.tiktok), url: `https://www.tiktok.com/@${clean(s.tiktok)}` },
    clean(s.shopee) && { label: 'Shopee', handle: clean(s.shopee), url: `https://shopee.co.id/${clean(s.shopee)}` },
  ].filter(Boolean);
}

function afterHome() {
  // carousel
  const car = $('#carousel');
  if (car && D.promos.length > 1) {
    const track = $('.carousel-track', car);
    const slides = $$('.slide', car);
    let i = 0;
    let paused = false;
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      track.style.transform = `translateX(-${i * 100}%)`;
      slides.forEach((s, k) => {
        s.setAttribute('aria-hidden', k !== i);
        $$('a', s).forEach((a) => (a.tabIndex = k === i ? 0 : -1));
      });
      $$('[data-dot]', car).forEach((d, k) => (k === i ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
    };
    car.addEventListener('click', (e) => {
      const b = e.target.closest('[data-car],[data-dot]');
      if (!b) return;
      show(b.dataset.dot != null ? Number(b.dataset.dot) : i + Number(b.dataset.car));
    });
    car.addEventListener('mouseenter', () => (paused = true));
    car.addEventListener('mouseleave', () => (paused = false));
    car.addEventListener('focusin', () => (paused = true));
    car.addEventListener('focusout', () => (paused = false));
    let sx = null;
    car.addEventListener('touchstart', (e) => (sx = e.touches[0].clientX), { passive: true });
    car.addEventListener('touchend', (e) => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
      sx = null;
    });
    // berganti otomatis hanya kalau diaktifkan admin dan pengunjung tidak memilih "kurangi animasi"
    if (settings().bannerAuto !== false && !reduceMotion) {
      const t = setInterval(() => {
        if (!document.body.contains(car)) return clearInterval(t);
        if (!paused && !document.hidden) show(i + 1);
      }, 6000);
    }
  }
  setupBrandRow();
  startCountdown();
}

// =========================================================
// DERETAN BRAND: 3 pilihan tampilan (diatur di Admin > Pengaturan toko)
// grid  = diam, paling ringan (bawaan)
// geser = satu baris, digeser manual
// jalan = satu baris bergerak pelan, berhenti saat tidak terlihat
// =========================================================
function brandStyle() {
  const v = settings().brandStyle;
  if (v === 'jalan' && reduceMotion) return 'geser';
  return ['grid', 'geser', 'jalan'].includes(v) ? v : 'grid';
}

function brandTile(b, hidden = false) {
  return `<a href="#/produk?brand=${encodeURIComponent(b.id)}" class="brand-tile${b.logo ? ' has-logo' : ''}" ${hidden ? 'aria-hidden="true" tabindex="-1"' : ''}>${
    b.logo ? `<img src="${esc(b.logo)}" alt="${hidden ? '' : 'Logo ' + esc(b.name)}" loading="lazy" decoding="async">` : `<span>${esc(b.name)}</span>`
  }</a>`;
}

function brandRowHTML(brands) {
  const style = brandStyle();
  if (style === 'grid') {
    return `<div class="container"><div class="brand-grid">${brands.slice(0, 12).map((b) => brandTile(b)).join('')}</div></div>`;
  }
  if (style === 'geser') {
    return `<div class="container brand-scroll-wrap">
      <button type="button" class="brand-nav prev" data-bscroll="-1" aria-label="Brand sebelumnya">‹</button>
      <div class="brand-scroll" id="brandScroll">${brands.slice(0, 24).map((b) => brandTile(b)).join('')}</div>
      <button type="button" class="brand-nav next" data-bscroll="1" aria-label="Brand berikutnya">›</button>
    </div>`;
  }
  const list = brands.slice(0, 16);
  return `<div class="brand-run" id="brandRun"><div class="brand-run-track">${list.map((b) => brandTile(b)).join('')}${list.map((b) => brandTile(b, true)).join('')}</div></div>`;
}

function setupBrandRow() {
  const sc = $('#brandScroll');
  if (sc) {
    $$('[data-bscroll]').forEach((btn) =>
      btn.addEventListener('click', () => sc.scrollBy({ left: Number(btn.dataset.bscroll) * sc.clientWidth * 0.8, behavior: reduceMotion ? 'auto' : 'smooth' }))
    );
  }
  const run = $('#brandRun');
  if (run && 'IntersectionObserver' in window) {
    // hemat baterai: animasi hanya jalan saat deretan brand terlihat di layar
    const io = new IntersectionObserver(([e]) => run.classList.toggle('is-running', e.isIntersecting));
    io.observe(run);
  } else if (run) run.classList.add('is-running');
}

function startCountdown() {
  const els = $$('[data-countdown]');
  if (!els.length) return;
  const end = new Date(settings().flashEndsAt).getTime();
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    let s = Math.max(0, Math.floor((end - Date.now()) / 1000));
    if (s === 0) {
      clearInterval(countdownTimer);
      route();
      return;
    }
    const d = Math.floor(s / 86400);
    s %= 86400;
    const txt = `${d ? d + ' hari ' : ''}${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
    els.forEach((el) => (el.textContent = txt));
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}
