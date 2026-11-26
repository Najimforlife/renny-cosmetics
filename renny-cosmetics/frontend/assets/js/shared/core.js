/* =========================================================
   RENNY COSMETICS — CORE
   Dipakai bersama oleh halaman toko, halaman admin, dan
   skrip pembuat data. Isinya:
   - kategori & pengaturan bawaan
   - pengolah daftar item iPOS (.exitem)
   - format penyimpanan data (pack / unpack)
   ========================================================= */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RCCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------------------------------------------------
  // KATEGORI UTAMA
  // ---------------------------------------------------------
  const DEFAULT_CATEGORIES = [
    { id: 'skincare', name: 'Skincare', icon: 'skincare', desc: 'Pembersih, toner, serum, pelembap, sunscreen, dan masker wajah.' },
    { id: 'makeup', name: 'Makeup', icon: 'makeup', desc: 'Lip, cushion, bedak, foundation, alis, dan riasan mata.' },
    { id: 'tubuh', name: 'Perawatan Tubuh', icon: 'tubuh', desc: 'Body lotion, sabun, lulur, deodoran, dan perawatan tubuh lain.' },
    { id: 'rambut', name: 'Perawatan Rambut', icon: 'rambut', desc: 'Shampoo, conditioner, vitamin rambut, dan pewarna rambut.' },
    { id: 'parfum', name: 'Parfum', icon: 'parfum', desc: 'Parfum, body mist, dan body spray untuk wanita dan pria.' },
    { id: 'kuku', name: 'Kuku', icon: 'kuku', desc: 'Kutek, nail art, dan perawatan kuku.' },
    { id: 'aksesoris', name: 'Aksesoris & Alat', icon: 'aksesoris', desc: 'Bulu mata, kuas, softlens, kapas, dan aksesoris kecantikan.' },
    { id: 'lainnya', name: 'Lainnya', icon: 'lainnya', desc: 'Paket hemat, bundling, dan kebutuhan lain.' },
  ];

  // jenis di iPOS -> [kategori, sub-kategori]
  const J = (cat, sub, list) => list.forEach((j) => (JENIS[j] = [cat, sub]));
  const JENIS = {};
  // skincare
  J('skincare', 'Serum', ['SERUM']);
  J('skincare', 'Krim Wajah', ['CREAM', 'DAY CREAM']);
  J('skincare', 'Perawatan Mata', ['EYE CREAM', 'EYE SERUM', 'EYE MASK']);
  J('skincare', 'Sunscreen', ['SUNSCREEN', 'SUNBLOCK']);
  J('skincare', 'Toner', ['TONER']);
  J('skincare', 'Masker Wajah', ['MASK', 'SHEET MASK', 'MASKER', 'CLAY MASK', 'NOSE STRIP']);
  J('skincare', 'Pelembap', ['MOISTURIZER', 'GEL']);
  J('skincare', 'Pembersih Wajah', ['FW', 'FF', 'FC', 'FACIAL WASH', 'CLEANSE', 'CLEANSER', 'MILK CLEANSER', 'PEMBERSIH', 'CLEANSING BALM']);
  J('skincare', 'Micellar Water', ['MICELLAR WATER']);
  J('skincare', 'Face Mist', ['FACE MIST', 'FACE SPRAY']);
  J('skincare', 'Eksfoliasi', ['EXFOLIASI', 'FACE SCRUB', 'CLEAR PADS']);
  J('skincare', 'Acne Patch', ['ACNE PATCH']);
  J('skincare', 'Essence & Face Oil', ['ESSENCE', 'FACIAL OIL']);
  // makeup
  J('makeup', 'Lip', ['LIPS', 'LIPSTIK', 'LIP CREAM', 'LIP GLOSS', 'LIP MOIST', 'LIP SERUM']);
  J('makeup', 'Bedak', ['BEDAK', 'POWDER']);
  J('makeup', 'Cushion', ['CUSHION']);
  J('makeup', 'Foundation & BB', ['FOUNDATION', 'BB CREAM', 'SKINTINT']);
  J('makeup', 'Concealer', ['CONCEALER']);
  J('makeup', 'Primer', ['PRIMER']);
  J('makeup', 'Setting Spray', ['SETTING SPRAY']);
  J('makeup', 'Alis', ['EYEBROW', 'EYE BROW']);
  J('makeup', 'Eyeshadow', ['EYESHADOW']);
  J('makeup', 'Eyeliner', ['EYELINER']);
  J('makeup', 'Maskara', ['MASCARA', 'MASCA']);
  J('makeup', 'Blush On', ['BLUSH', 'BLUSH ON']);
  J('makeup', 'Highlighter & Contour', ['HIGHTLIGHTER', 'CONTOUR', 'COUNTOUR', 'BRONZER']);
  // kuku
  J('kuku', 'Kutek', ['KUTEK KUKU']);
  J('kuku', 'Nail Art', ['NAIL ART']);
  J('kuku', 'Perawatan Kuku', ['SERUM KUKU']);
  // tubuh
  J('tubuh', 'Body Lotion & Krim', ['HBL', 'LOTION', 'BODY CREAM', 'BODY BUTTER', 'HAND CREAM']);
  J('tubuh', 'Body Serum', ['BODY SERUM']);
  J('tubuh', 'Sabun & Body Wash', ['BODY WASH', 'SBN.MNDI', 'SABUN']);
  J('tubuh', 'Lulur & Scrub', ['LULUR', 'BODY SCRUB', 'BODY SPA', 'BODY MASK']);
  J('tubuh', 'Deodoran', ['DEO', 'DEODORANT', 'UNDERARM']);
  J('tubuh', 'Waxing', ['WAXING']);
  J('tubuh', 'Perawatan Kaki', ['FOOT MASK']);
  J('tubuh', 'Kewanitaan', ['ANTISEPTIC']);
  J('tubuh', 'Perawatan Mulut', ['OBAT KUMUR']);
  J('tubuh', 'Minyak & Body Oil', ['MINYAK']);
  // rambut
  J('rambut', 'Shampoo', ['SHAMPOO', 'SHP']);
  J('rambut', 'Conditioner', ['CONDITIONER']);
  J('rambut', 'Masker Rambut', ['HAIR MASK']);
  J('rambut', 'Vitamin & Serum Rambut', ['HAIR SERUM', 'HAIR TONIC', 'HAIR LOTION', 'VIT.RMBT', 'VITAMIN RMBT', 'MINYAK.RMBT', 'MINYAK RMBT', 'HAIR MIST']);
  J('rambut', 'Pewarna Rambut', ['SEMIR.RMBT', 'PEWARNA RAMBUT', 'HAIR DYE', 'HENNA']);
  J('rambut', 'Styling', ['POMADE', 'HAIR SPRAY']);
  // parfum
  J('parfum', 'Parfum', ['PARFUME', 'PARFUM']);
  J('parfum', 'Body Mist', ['BODY MIST', 'BODY SPRAY']);
  // aksesoris
  J('aksesoris', 'Aksesoris', ['ACC', 'ALT', 'ATK']);
  J('aksesoris', 'Alat Makeup', ['ALAT', 'BRUSH', 'PINSET']);
  J('aksesoris', 'Bulu Mata', ['BULU MATA', 'EYELASH', 'LEM BULU MATA']);
  J('aksesoris', 'Kapas & Tisu', ['KAPAS', 'COTTON BUD', 'TISU']);
  J('aksesoris', 'Softlens', ['SOFTLENS']);
  // lainnya
  J('lainnya', 'Paket & Bundling', ['PAKET', 'BUNDLING', 'MBG EMINA']);
  J('lainnya', 'Kesehatan', ['KAPSUL', 'OBAT', 'DIET', 'VITAMIN', 'PIL BUBUK', 'COLLAGEN']);
  J('lainnya', 'Kebutuhan Harian', ['PEMBALUT']);

  // jenis yang bukan produk kecantikan (makanan/minuman) -> tidak ditampilkan
  const JENIS_SKIP = new Set(['MKN', 'MNM', 'MINUMAN', 'DRINK']);

  function classify(jenis, nameUpper) {
    const j = (jenis || '').trim().toUpperCase();
    const has = (...w) => w.some((x) => nameUpper.includes(x));
    // jenis campuran / salah input: tentukan dari nama
    if (j === 'S01') return has('SPRAY') ? ['makeup', 'Setting Spray'] : ['tubuh', 'Sabun & Body Wash'];
    if (j === 'CO1') return has('COTTON') ? ['aksesoris', 'Kapas & Tisu'] : ['makeup', 'Highlighter & Contour'];
    if (j === 'BIBIT') return has('SERUM') ? ['tubuh', 'Body Serum'] : ['tubuh', 'Body Lotion & Krim'];
    if (j === 'REMOVER') return has('NAIL', 'KUTEK') ? ['kuku', 'Remover Kutek'] : ['skincare', 'Pembersih Wajah'];
    if ((j === 'PARFUME' || j === 'PARFUM') && has('DEODORANT', 'ROLL ON')) return ['tubuh', 'Deodoran'];
    return JENIS[j] || ['lainnya', 'Lainnya'];
  }

  // ---------------------------------------------------------
  // BRAND
  // ---------------------------------------------------------
  const BRAND_ALIAS = {
    MAYBELLLINE: 'MAYBELLINE',
    VASELLINE: 'VASELINE',
    'BATH BODY WORK': 'BATH & BODY WORKS',
    'BATH BODY WORKS': 'BATH & BODY WORKS',
    'BATH & BODY WORK': 'BATH & BODY WORKS',
    LOREAL: "L'OREAL",
    LOR: "L'OREAL",
    PONDS: "POND'S",
    'TIME PHORIA': 'TIMEPHORIA',
    BNB: 'BARENBLISS',
    GAR: 'GARNIER',
    HE: 'MAKARIZO',
    'MAKE OVET': 'MAKE OVER',
    'FAIR&LOVELY': 'GLOW & LOVELY',
    'GLOW&LOVELY': 'GLOW & LOVELY',
    'KOJIE SAN': 'KOJIE SAN',
  };
  // merek di iPOS yang bukan nama brand
  const GENERIC_MEREK = new Set(['', 'FREE', 'ALAT', 'UNILEVER', 'P&G', 'ACC', 'LAINNYA', '-', 'IKAT RAMBUT', 'NAILS', 'KUTEK', 'SOFTLENS', 'BULU MATA', 'AKSESORIS']);
  // perusahaan induk: brand diambil dari kata pertama nama barang
  const PARENT_COMPANY = new Set(['UNILEVER', 'P&G']);

  const BRAND_CASE = {
    GLAD2GLOW: 'Glad2Glow', OMG: 'OMG', QL: 'QL', CBD: 'CBD', SYB: 'SYB', 'LT PRO': 'LT Pro', 'MS GLOW': 'MS Glow',
    'O.TWO.O': 'O.TWO.O', YOU: 'YOU', 'BATH & BODY WORKS': 'Bath & Body Works', "L'OREAL": "L'Oréal", "POND'S": "Pond's",
    VAVL: 'VAVL', NAMA: 'NAMA', ESQA: 'ESQA', 'SEA MAKEUP': 'SEA Makeup', 'VICTORIA SECRET': "Victoria's Secret",
    'SAFF&CO': 'Saff & Co', "BI'ES": "Bi'es", 'GRACE AND GLOW': 'Grace and Glow', 'XI XIU': 'Xi Xiu', AXE: 'AXE',
    'GLOW & LOVELY': 'Glow & Lovely', TRESEMME: 'TRESemmé', 'P&G': 'P&G', SYUGA: 'Syuga', 'RESIK-V': 'Resik-V', IZZI: 'IZZI',
  };

  function titleWord(w) {
    return w
      .split(/([\-/&.])/)
      .map((p) => (/^[a-z]/i.test(p) ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p))
      .join('');
  }

  function brandDisplay(key) {
    if (BRAND_CASE[key]) return BRAND_CASE[key];
    return key.split(/\s+/).map(titleWord).join(' ');
  }

  // ---------------------------------------------------------
  // NAMA PRODUK: HURUF BESAR SEMUA -> rapi
  // ---------------------------------------------------------
  const ACRONYMS = new Set([
    'SPF', 'PA', 'UV', 'UVA', 'UVB', 'AHA', 'BHA', 'PHA', 'LHA', 'BB', 'CC', 'DD', 'EDT', 'EDP', 'EDC', 'DNA', 'II', 'III',
    'IV', 'SOS', 'XL', 'XXL', 'XS', 'BPOM', 'OMG', 'QL', 'CBD', 'SYB', 'MSG', 'HA', 'TXA', 'PDRN', 'NMF', 'EGF', 'ACV',
    'VIT', 'SPC', 'GM', 'POM', 'USA', 'UK', 'DIY', 'LED', 'BNB', 'LT', 'MS', 'ZZ', 'TLC', 'AC', 'PH', 'YOU', 'NYU', 'CNP',
  ]);
  const EXPAND = { SHP: 'Shampoo', HBL: 'Hand Body Lotion', FW: 'Facial Wash', FF: 'Facial Foam', FC: 'Facial Cleanser', SBN: 'Sabun' };
  const UNIT = /^(\d+(?:[.,]\d+)?)(ML|GR|GRAM|GM|G|MG|L|LTR|KG|OZ|CM|MM|PCS|S|SHEET|SHEETS)$/i;

  function prettyToken(tok) {
    const core = tok.replace(/^[(\["']+|[)\]"',.:]+$/g, '');
    const lead = tok.slice(0, tok.indexOf(core));
    const tail = tok.slice(tok.indexOf(core) + core.length);
    let out;
    const up = core.toUpperCase();
    if (!core) out = core;
    else if (EXPAND[up]) out = EXPAND[up];
    else if (UNIT.test(core)) {
      const m = core.match(UNIT);
      const u = m[2].toLowerCase();
      out = m[1] + (u === 'pcs' || u === 'sheet' || u === 'sheets' ? ' ' + u : u);
    } else if (ACRONYMS.has(up) || /\+/.test(core) || (/\d/.test(core) && /[a-z]/i.test(core))) out = up;
    else out = titleWord(core);
    return lead + out + tail;
  }

  function prettyName(rawUpper, brandKey) {
    let name = rawUpper.replace(/\s+/g, ' ').trim();
    // buang nama brand di depan (brand sudah tampil terpisah)
    const prefixes = [brandKey, ...Object.keys(BRAND_ALIAS).filter((a) => BRAND_ALIAS[a] === brandKey)];
    prefixes.sort((a, b) => b.length - a.length);
    for (const p of prefixes) {
      if (p && name.startsWith(p + ' ') && name.length > p.length + 3) {
        const rest = name.slice(p.length + 1).trim();
        // jangan buang kalau sisanya cuma kode, misal "NAILS - Y148"
        if (!/^[-–]/.test(rest) && rest.replace(/[^A-Z]/g, '').length >= 3) name = rest;
        break;
      }
    }
    if (name.startsWith('BARENBLISS ') && brandKey === 'BARENBLISS') name = name.slice(11);
    return name.split(' ').map(prettyToken).join(' ').replace(/\s+-\s+/g, ' - ');
  }

  // ---------------------------------------------------------
  // UTIL
  // ---------------------------------------------------------
  function slugify(t) {
    return String(t || '')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/&/g, ' dan ')
      .replace(/'/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ---------------------------------------------------------
  // KONVERSI DAFTAR ITEM iPOS
  // rows: { kodeitem, namaitem, jenis, merek, hargajual1, statusjual, tanggal_add }
  // Harga pokok & persentase margin TIDAK dibaca, supaya tidak ikut tampil di website.
  // ---------------------------------------------------------
  function convertIpos(rows) {
    // daftar brand dari kolom merek
    const known = new Set();
    rows.forEach((r) => {
      const m = (r.merek || '').trim().toUpperCase();
      if (m && !GENERIC_MEREK.has(m)) known.add(BRAND_ALIAS[m] || m);
    });
    Object.values(BRAND_ALIAS).forEach((b) => known.add(b));
    const prefixList = [...new Set([...known, ...Object.keys(BRAND_ALIAS)])].sort((a, b) => b.length - a.length);

    const skipped = { nonaktif: 0, tanpaHarga: 0, hadiah: 0, nonKosmetik: 0 };
    const products = [];
    const brandMap = new Map();

    for (const r of rows) {
      const raw = String(r.namaitem || '').replace(/\s+/g, ' ').trim();
      const up = raw.toUpperCase();
      const price = Math.round(Number(r.hargajual1) || 0);
      const jenis = String(r.jenis || '').trim().toUpperCase();
      if (String(r.statusjual || 'Y').toUpperCase() === 'N') { skipped.nonaktif++; continue; }
      if (price < 1000 || up === 'TEST PRINT') { skipped.tanpaHarga++; continue; }
      if (up.startsWith('FREE') || (r.merek || '').trim().toUpperCase() === 'FREE') { skipped.hadiah++; continue; }
      if (JENIS_SKIP.has(jenis)) { skipped.nonKosmetik++; continue; }

      // tentukan brand
      let merek = (r.merek || '').trim().toUpperCase();
      merek = BRAND_ALIAS[merek] || merek;
      let brandKey = '';
      if (merek && !GENERIC_MEREK.has(merek)) brandKey = merek;
      else if (PARENT_COMPANY.has(merek)) {
        const first = up.split(' ')[0];
        brandKey = BRAND_ALIAS[first] || first;
        const pre = prefixList.find((p) => up === p || up.startsWith(p + ' '));
        if (pre) brandKey = BRAND_ALIAS[pre] || pre;
      } else {
        const pre = prefixList.find((p) => up === p || up.startsWith(p + ' '));
        if (pre) brandKey = BRAND_ALIAS[pre] || pre;
      }
      if (!brandKey) brandKey = 'LAINNYA';

      const brandId = brandKey === 'LAINNYA' ? 'lainnya' : slugify(brandKey);
      if (!brandMap.has(brandId)) brandMap.set(brandId, { id: brandId, name: brandKey === 'LAINNYA' ? 'Tanpa brand' : brandDisplay(brandKey), logo: '' });

      const [cat, sub] = classify(jenis, up);
      const created = String(r.tanggal_add || '').slice(0, 10) || '2024-01-01';

      products.push({
        id: String(r.kodeitem).trim(),
        name: brandKey === 'LAINNYA' ? prettyName(up, '') : prettyName(up, brandKey),
        brand: brandId,
        cat,
        sub,
        price,
        compare: 0,
        stock: null, // null = stok tidak dilacak (konfirmasi via WhatsApp)
        created,
        img: '',
        desc: '',
        howto: '',
        active: true,
        featured: false,
        flash: false,
        rating: 0,
        reviews: 0,
      });
    }
    const brands = [...brandMap.values()].sort((a, b) => (a.id === 'lainnya' ? 1 : b.id === 'lainnya' ? -1 : a.name.localeCompare(b.name)));
    return { products, brands, skipped };
  }

  // ---------------------------------------------------------
  // PENGATURAN & KONTEN BAWAAN
  // ---------------------------------------------------------
  const DEFAULT_SETTINGS = {
    storeName: 'Renny Cosmetics',
    whatsapp: '628115403403', // ganti di Admin > Pengaturan toko
    address: 'Jl. Soekarno Hatta Km 4.5, Balikpapan',
    mapsUrl: '',
    hours: '',
    email: '',
    instagram: 'rennycosmetics33',
    tiktok: 'rennycosmetics33',
    shopee: 'rennyskincare33',
    topbar: 'Mahasiswa ITK dapat diskon 15%. Tunjukkan KTM saat belanja di toko.',
    brandHighlight: '140+ brand lokal dan internasional dalam satu toko.',
    itkDiscount: 'Mahasiswa ITK dapat diskon 15%. Tunjukkan KTM saat belanja di toko, atau kirim foto KTM ke admin saat pesan online.',
    offlineStore: 'Datang langsung ke toko untuk coba tester dan konsultasi dengan Beauty Advisor kami.',
    shippingInfo: '',
    paymentInfo: '',
    flashActive: false,
    flashEndsAt: '', // ISO string
    brandStyle: 'grid', // tampilan brand di beranda: grid (diam) | geser (manual) | jalan (bergerak)
    bannerAuto: true, // banner promo berganti otomatis
  };

  const DEFAULT_PROMOS = [
    { title: 'Semua kebutuhan cantikmu, dalam satu toko', subtitle: 'Skincare, makeup, bodycare sampai aksesoris dari 140+ brand. Pesan online, ambil di toko atau dikirim.', cta: 'Belanja sekarang', link: '#/produk', theme: 'soft' },
    { title: 'Diskon khusus mahasiswa ITK', subtitle: 'Berlaku selamanya. Cukup tunjukkan KTM saat belanja di toko.', cta: 'Lihat lokasi toko', link: '#lokasi', theme: 'deep' },
    { title: 'Bingung pilih produk?', subtitle: 'Ceritakan jenis kulit atau kebutuhanmu, admin kami bantu rekomendasikan lewat WhatsApp.', cta: 'Konsultasi gratis', link: 'wa', theme: 'pink' },
  ];

  const DEFAULT_FAQS = [
    { id: 'faq1', q: 'Bagaimana cara memesan?', a: 'Masukkan produk ke keranjang, lalu klik "Pesan via WhatsApp". Isi nama dan cara terima pesanan, pesan otomatis terisi daftar produk dan total harga. Admin akan membalas dengan konfirmasi stok, ongkir, dan cara bayar.', visible: true },
    { id: 'faq2', q: 'Apakah semua produk original?', a: 'Ya. Kalau ragu dengan suatu produk, tanyakan langsung ke admin sebelum membeli.', visible: true },
    { id: 'faq3', q: 'Kenapa stok harus dikonfirmasi dulu?', a: 'Stok di toko berubah setiap hari. Admin akan memastikan barang tersedia sebelum kamu membayar.', visible: true },
    { id: 'faq4', q: 'Apakah bisa belanja langsung di toko?', a: 'Bisa. Alamat toko ada di bagian bawah halaman. Mahasiswa ITK dapat diskon khusus dengan menunjukkan KTM.', visible: true },
  ];

  // ---------------------------------------------------------
  // FORMAT DATA (dipadatkan supaya file tidak terlalu besar)
  // ---------------------------------------------------------
  const FIELDS = ['id', 'name', 'brand', 'cat', 'sub', 'price', 'compare', 'stock', 'created', 'img', 'desc', 'howto', 'flags', 'rating', 'reviews'];
  // flags: 1 = nonaktif, 2 = unggulan, 4 = ikut flash sale

  function packProduct(p) {
    const flags = (p.active ? 0 : 1) | (p.featured ? 2 : 0) | (p.flash ? 4 : 0);
    const row = [p.id, p.name, p.brand, p.cat, p.sub || '', p.price, p.compare || 0, p.stock == null ? null : p.stock, p.created || '', p.img || '', p.desc || '', p.howto || '', flags, p.rating || 0, p.reviews || 0];
    // buang kolom kosong di belakang supaya file lebih kecil
    while (row.length > 9 && (row[row.length - 1] === '' || row[row.length - 1] === 0)) row.pop();
    return row;
  }

  function unpackProduct(row) {
    const g = (i, d) => (row[i] === undefined ? d : row[i]);
    const flags = g(12, 0);
    return {
      id: String(row[0]),
      name: row[1],
      brand: row[2],
      cat: row[3],
      sub: g(4, ''),
      price: g(5, 0),
      compare: g(6, 0),
      stock: g(7, null),
      created: g(8, ''),
      img: g(9, ''),
      desc: g(10, ''),
      howto: g(11, ''),
      active: !(flags & 1),
      featured: !!(flags & 2),
      flash: !!(flags & 4),
      rating: g(13, 0),
      reviews: g(14, 0),
    };
  }

  function pack(data) {
    return {
      format: 1,
      version: data.version || Date.now(),
      settings: data.settings,
      categories: data.categories,
      brands: data.brands,
      promos: data.promos,
      faqs: data.faqs,
      testimonials: data.testimonials,
      fields: FIELDS,
      products: data.products.map(packProduct),
    };
  }

  function unpack(raw) {
    return {
      version: raw.version || 0,
      settings: Object.assign({}, DEFAULT_SETTINGS, raw.settings || {}),
      categories: raw.categories && raw.categories.length ? raw.categories : DEFAULT_CATEGORIES,
      brands: raw.brands || [],
      promos: raw.promos && raw.promos.length ? raw.promos : DEFAULT_PROMOS,
      faqs: raw.faqs || DEFAULT_FAQS,
      testimonials: raw.testimonials || [],
      products: (raw.products || []).map(unpackProduct),
    };
  }

  /** Bungkus data jadi format file data (dipakai untuk seed database) */
  function toDataFile(data) {
    const packed = pack(data);
    const head =
      '/* Data website Renny Cosmetics.\n' +
      '   File ini dibuat otomatis dari halaman Admin (tombol "Terbitkan").\n' +
      '   Jangan diedit manual. Diterbitkan: ' + new Date(packed.version).toLocaleString('id-ID') + ' */\n';
    const body = JSON.stringify(packed)
      .replace('"products":[', '"products":[\n')
      .replace(/\],\[/g, '],\n[');
    return head + 'window.RC_DATA = ' + body + ';\n';
  }

  return {
    DEFAULT_CATEGORIES,
    DEFAULT_SETTINGS,
    DEFAULT_PROMOS,
    DEFAULT_FAQS,
    convertIpos,
    classify,
    prettyName,
    brandDisplay,
    slugify,
    pack,
    unpack,
    toDataFile,
  };
});
