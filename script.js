// ── CONFIG ─────────────────────────────────────────────────────
const WEDDING_DATE    = new Date('2026-06-14T07:30:00+07:00');
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbys1yuhE6p1IbJI2AGIU84mCBTVmvjG9jSfq-t3L3eHXy-YvxZRMiJF72LZvcFPbsiEVg/exec"; // ✅ URL GAS lu, jangan diubah

const CALENDAR_EVENT = {
  title:    "Pernikahan Taufik & Ati",
  start:    "20260614T073000",
  end:      "20260614T150000",
  location: "Kp. Bunder, Desa Cibaregbeg, Cianjur",
  details:  "Akad Nikah 07.30-08.00 WIB | Resepsi 09.30-15.00 WIB",
};


// ── NAMA TAMU DARI URL ──────────────────────────────────────────
function getGuestName() {
  const params = new URLSearchParams(window.location.search);
  return params.get('to') || '';
}

function applyGuestName() {
  const name = getGuestName();
  const toEl   = document.getElementById('gate-to');
  const nameEl = document.getElementById('gate-name');
  if (name && toEl && nameEl) {
    toEl.style.display   = 'block';
    nameEl.style.display = 'block';
    nameEl.textContent   = name;
  }
}


// ── GATE ────────────────────────────────────────────────────────
function openInvite() {
  document.getElementById('gate').classList.add('hide');
  triggerFades();
}


// ── COUNTDOWN ───────────────────────────────────────────────────
function updateCountdown() {
  const diff = WEDDING_DATE - new Date();
  const pad  = n => String(Math.max(0, n)).padStart(2, '0');

  if (diff <= 0) {
    ['days','hours','mins','secs'].forEach(id =>
      document.getElementById('cd-' + id).textContent = '00'
    );
    return;
  }

  document.getElementById('cd-days').textContent  = pad(Math.floor(diff / 86400000));
  document.getElementById('cd-hours').textContent = pad(Math.floor((diff % 86400000) / 3600000));
  document.getElementById('cd-mins').textContent  = pad(Math.floor((diff % 3600000)  / 60000));
  document.getElementById('cd-secs').textContent  = pad(Math.floor((diff % 60000)    / 1000));
}

updateCountdown();
setInterval(updateCountdown, 1000);


// ── SCROLL FADE ─────────────────────────────────────────────────
function triggerFades() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 80);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}


// ── GOOGLE CALENDAR ─────────────────────────────────────────────
function openCalendar() {
  const e = CALENDAR_EVENT;
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE`
    + `&text=${encodeURIComponent(e.title)}`
    + `&dates=${e.start}/${e.end}`
    + `&location=${encodeURIComponent(e.location)}`
    + `&details=${encodeURIComponent(e.details)}`;
  window.open(url, '_blank');
}


// ── WEDDING GIFT TOGGLE ─────────────────────────────────────────
function toggleGift() {
  const panel   = document.getElementById('giftPanel');
  const chevron = document.getElementById('giftChevron');
  const isOpen  = panel.classList.contains('open');

  panel.classList.toggle('open', !isOpen);
  chevron.classList.toggle('open', !isOpen);
}


// ── SALIN NOMOR ─────────────────────────────────────────────────
function copyNumber(elementId, btn) {
  const text = document.getElementById(elementId)?.textContent?.trim();
  if (!text) return;

  const _confirm = () => {
    const span = btn.querySelector('span');
    const orig = span.textContent;
    span.textContent = 'Tersalin ✓';
    btn.classList.add('copied');
    setTimeout(() => { span.textContent = orig; btn.classList.remove('copied'); }, 2200);
  };

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(_confirm).catch(() => _fallback());
  } else {
    _fallback();
  }

  function _fallback() {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
    document.body.appendChild(el);
    el.select(); document.execCommand('copy');
    document.body.removeChild(el);
    _confirm();
  }
}


// ══════════════════════════════════════════════════════════════════
//  MODAL UCAPAN
// ══════════════════════════════════════════════════════════════════

function openRsvpModal() {
  const modal = document.getElementById('rsvpModal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  fetchUcapan();
}

function closeRsvpModal() {
  document.getElementById('rsvpModal').classList.remove('open');
  document.body.style.overflow = '';
}

// Tutup kalau klik area gelap di luar card
function handleModalClick(e) {
  if (e.target.id === 'rsvpModal') closeRsvpModal();
}

// Tutup modal dengan tombol Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeRsvpModal();
});


// ══════════════════════════════════════════════════════════════════
//  UCAPAN — Fetch & Render
// ══════════════════════════════════════════════════════════════════

async function fetchUcapan() {
  const wall    = document.getElementById('ucapanWall');
  const loading = document.getElementById('ucapanLoading');

  // Reset tampilan
  wall.innerHTML = '<p class="ucapan-loading" id="ucapanLoading">Memuat ucapan…</p>';

  try {
    const url = APPS_SCRIPT_URL + '?action=ucapan';
    const res  = await fetch(url, { redirect: 'follow' });

    if (!res.ok) throw new Error('Fetch gagal: ' + res.status);

    const data = await res.json();

    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Format data tidak valid');
    }

    renderUcapan(data.data);

  } catch (err) {
    console.warn('[Ucapan] fetch error:', err.message);
    wall.innerHTML = '<p class="ucapan-empty">Belum ada ucapan. Jadilah yang pertama! 🤍</p>';
  }
}

function renderUcapan(list) {
  const wall = document.getElementById('ucapanWall');

  if (!list.length) {
    wall.innerHTML = '<p class="ucapan-empty">Belum ada ucapan. Jadilah yang pertama! 🤍</p>';
    return;
  }

  // Filter: hanya tampilkan yang punya ucapan (bukan RSVP kosong)
  const withUcapan = list.filter(u => u.ucapan && u.ucapan.trim());

  if (!withUcapan.length) {
    wall.innerHTML = '<p class="ucapan-empty">Belum ada ucapan. Jadilah yang pertama! 🤍</p>';
    return;
  }

  wall.innerHTML = withUcapan.map(u => {
    const initial   = (u.nama || '?')[0].toUpperCase();
    const isHadir   = u.hadir === 'Hadir';
    const badgeClass = isHadir ? 'hadir' : 'berhalangan';
    const badgeText  = isHadir ? 'Hadir' : 'Berhalangan';

    return `
      <div class="ucapan-item">
        <div class="ucapan-avatar">${initial}</div>
        <div class="ucapan-body">
          <div class="ucapan-meta">
            <span class="ucapan-name">${_esc(u.nama)}</span>
            <span class="ucapan-badge ${badgeClass}">${badgeText}</span>
          </div>
          <p class="ucapan-text">${_esc(u.ucapan)}</p>
          ${u.waktu ? `<span class="ucapan-time">${_esc(u.waktu)}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Helper: escape HTML untuk keamanan
function _esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}


// ══════════════════════════════════════════════════════════════════
//  RSVP — Form Handler (tanpa field WhatsApp)
// ══════════════════════════════════════════════════════════════════

class RsvpManager {

  static _collectFormData() {
    return {
      nama:   document.getElementById('name')?.value?.trim()    || '',
      hadir:  document.getElementById('attendance')?.value      || '',
      jumlah: document.getElementById('guests')?.value          || '1',
      ucapan: document.getElementById('message')?.value?.trim() || '',
    };
  }

  static _validate(data) {
    if (!data.nama)  throw new Error('Nama wajib diisi');
    if (!data.hadir) throw new Error('Mohon pilih konfirmasi kehadiran');
  }

  static _setLoading(loading) {
    const btn = document.querySelector('.btn-submit');
    if (!btn) return;
    btn.disabled      = loading;
    btn.textContent   = loading ? 'Mengirim…' : 'Kirim Ucapan';
    btn.style.opacity = loading ? '0.6' : '1';
  }

  static _showSuccess() {
    const form    = document.getElementById('rsvpForm');
    const success = document.getElementById('rsvpSuccess');
    if (form)    form.style.display    = 'none';
    if (success) success.style.display = 'block';

    // Refresh ucapan wall setelah submit
    setTimeout(() => fetchUcapan(), 1500);
  }

  static _showError(message) {
    let el = document.getElementById('rsvp-error');
    if (!el) {
      el = document.createElement('p');
      el.id = 'rsvp-error';
      el.style.cssText = 'margin-top:12px;color:#E87B8A;font-size:0.83rem;text-align:center;';
      document.getElementById('rsvpForm')?.appendChild(el);
    }
    el.textContent = '✗ ' + message;
  }

  static async submit(data) {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  static async handleSubmit(e) {
    e.preventDefault();
    RsvpManager._setLoading(true);
    try {
      const data = RsvpManager._collectFormData();
      RsvpManager._validate(data);
      await RsvpManager.submit(data);
      RsvpManager._showSuccess();
    } catch (err) {
      console.error('RSVP error:', err);
      RsvpManager._showError(err.message || 'Gagal mengirim. Coba lagi ya.');
      RsvpManager._setLoading(false);
    }
  }
}

function handleRSVP(e) { return RsvpManager.handleSubmit(e); }


// ── SHARE BUTTON ─────────────────────────────────────────────
async function shareInvite() {
  const url  = window.location.href;
  const name = getGuestName();
  const text = name
    ? `Assalamu'alaikum ${name}, kami mengundang Anda hadir pada pernikahan Taufik & Ati, Minggu 14 Juni 2026 di Cianjur. 🤍`
    : `Assalamu'alaikum, kami mengundang Anda hadir pada pernikahan Taufik & Ati, Minggu 14 Juni 2026 di Cianjur. 🤍`;

  const btn      = document.getElementById('shareBtnText');
  const origText = btn?.textContent;

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Pernikahan Taufik & Ati · 14 Juni 2026',
        text,
        url,
      });
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('[Share]', e);
    }
    return;
  }

  // Fallback: copy URL
  try {
    await navigator.clipboard.writeText(url);
    if (btn) {
      btn.textContent = 'Link tersalin ✓';
      setTimeout(() => { btn.textContent = origText; }, 2200);
    }
  } catch {
    prompt('Salin link undangan:', url);
  }
}


// ── INIT ────────────────────────────────────────────────────────
applyGuestName();
