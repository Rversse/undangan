// ── CONFIG ─────────────────────────────────────────────────────
const WEDDING_DATE = new Date('2026-06-14T07:30:00+07:00');
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbys1yuhE6p1IbJI2AGIU84mCBTVmvjG9jSfq-t3L3eHXy-YvxZRMiJF72LZvcFPbsiEVg/exec";

const CALENDAR_EVENT = {
  title:    "Pernikahan Taufik & Ati",
  start:    "20260614T080000",
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


// ── RSVP ────────────────────────────────────────────────────────
class RsvpManager {
  static _collectFormData() {
    return {
      nama:   document.getElementById('name')?.value?.trim()    || '',
      wa:     document.getElementById('phone')?.value?.trim()   || '',
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
    btn.disabled    = loading;
    btn.textContent = loading ? 'Mengirim...' : 'Kirim Konfirmasi';
    btn.style.opacity = loading ? '0.6' : '1';
  }

  static _showSuccess() {
    const form    = document.getElementById('rsvpForm');
    const success = document.getElementById('rsvpSuccess');
    if (form)    form.style.display    = 'none';
    if (success) success.style.display = 'block';
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


// ── INIT ────────────────────────────────────────────────────────
applyGuestName();
