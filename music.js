// ════════════════════════════════════════════════════════════════
//  BACKGROUND MUSIC — HTML5 Audio
//  Fix: pakai path relatif, tombol play/pause (bukan cuma mute)
// ════════════════════════════════════════════════════════════════

// ✅ FIX #1: Pakai path relatif, bukan GitHub Pages URL
// Dulu: "https://rversse.github.io/undangan/bgm.mp3" → bisa 404
const MUSIC_SRC = "./bgm.mp3";

const MusicPlayer = (() => {

  let audio   = null;
  let playing = false;
  let started = false; // sudah pernah diplay minimal sekali?

  function init() {

    audio = new Audio(MUSIC_SRC);

    audio.loop        = true;
    audio.volume      = 0.5;
    audio.preload     = 'auto';
    audio.playsInline = true;

    audio.addEventListener('canplaythrough', () => {
      console.log('[Music] ready');
    });

    audio.addEventListener('error', () => {
      console.error('[Music] error:', audio.error);
    });

    audio.addEventListener('play', () => {
      playing = true;
      _updateBtn();
    });

    audio.addEventListener('pause', () => {
      playing = false;
      _updateBtn();
    });
  }

  async function play() {

    if (!audio) return;

    try {

      if (audio.readyState === 0) audio.load();

      await audio.play();

      playing = true;
      started = true;

      console.log('[Music] playing');

    } catch (e) {

      playing = false;

      console.warn('[Music] play blocked:', e?.name, e?.message);
    }
  }

  function pause() {

    if (!audio) return;

    audio.pause();
    playing = false;
  }

  // ✅ FIX #2: Toggle play/pause, bukan mute
  async function togglePlayPause() {

    if (!audio) return;

    if (!started || audio.paused) {
      await play();
    } else {
      pause();
    }
  }

  function isPlaying() {
    return playing;
  }

  function hasStarted() {
    return started;
  }

  function _updateBtn() {

    const btn = document.getElementById('music-btn');

    if (!btn) return;

    if (playing) {
      btn.setAttribute('aria-label', 'Pause musik');
      btn.innerHTML = ICONS.playing;
      btn.classList.add('is-playing');
    } else {
      btn.setAttribute('aria-label', 'Play musik');
      btn.innerHTML = ICONS.paused;
      btn.classList.remove('is-playing');
    }
  }

  return {
    init,
    play,
    pause,
    togglePlayPause,
    isPlaying,
    hasStarted,
    _updateBtn,
  };

})();


// ════════════════════════════════════════════════════════════════
//  ICONS
// ════════════════════════════════════════════════════════════════

const ICONS = {

  playing: `
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  `,

  paused: `
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/>
      <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  `
};


// ════════════════════════════════════════════════════════════════
//  MUSIC BUTTON
// ════════════════════════════════════════════════════════════════

function _injectMusicBtn() {

  const btn = document.createElement('button');

  btn.id = 'music-btn';

  btn.setAttribute('aria-label', 'Play musik');

  // Tampilkan ikon paused dulu (belum main)
  btn.innerHTML = ICONS.paused;

  // ✅ FIX #2: Klik tombol = toggle play/pause
  btn.onclick = () => {
    MusicPlayer.togglePlayPause();
  };

  document.body.appendChild(btn);
}


// ════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════

function _injectMusicStyles() {

  const style = document.createElement('style');

  style.textContent = `

    #music-btn {
      position: fixed;
      bottom: 20px;
      right: 16px;
      z-index: 999;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(125,46,62,0.18);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(200,169,110,0.35);
      border-radius: 50%;
      color: #C8A96E;
      cursor: pointer;
      transition: background 0.3s, transform 0.2s;
      box-shadow: 0 3px 14px rgba(0,0,0,0.22);
      -webkit-tap-highlight-color: transparent;
    }

    #music-btn:hover {
      background: rgba(125,46,62,0.32);
      transform: scale(1.08);
    }

    #music-btn:active {
      transform: scale(0.94);
    }

    /* ✅ Animasi spin saat musik sedang main */
    @keyframes music-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    #music-btn.is-playing {
      animation: music-spin 8s linear infinite;
      border-color: rgba(200,169,110,0.65);
      background: rgba(125,46,62,0.28);
    }

    #music-btn.is-playing:hover {
      animation-play-state: paused;
    }
  `;

  document.head.appendChild(style);
}


// ════════════════════════════════════════════════════════════════
//  VISIBILITY AUTO PAUSE
// ════════════════════════════════════════════════════════════════

let _wasPlayingBeforeHide = false;

document.addEventListener('visibilitychange', async () => {

  if (document.hidden) {

    _wasPlayingBeforeHide = MusicPlayer.isPlaying();

    if (_wasPlayingBeforeHide) {
      MusicPlayer.pause();
    }

  } else {

    if (_wasPlayingBeforeHide) {
      await MusicPlayer.play();
    }
  }
});


// ════════════════════════════════════════════════════════════════
//  OPEN INVITE HOOK
//  Music play dipicu saat user klik "Buka Undangan" (user gesture)
//  → ini satu-satunya cara yang di-allow browser modern
// ════════════════════════════════════════════════════════════════

const _origOpenInvite = window.openInvite;

window.openInvite = async function () {

  // Play audio dulu (masih dalam konteks user gesture = klik tombol)
  await MusicPlayer.play();

  // Baru lanjut animasi buka undangan
  if (typeof _origOpenInvite === 'function') {
    _origOpenInvite();
  }
};


// ════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════

MusicPlayer.init();

_injectMusicStyles();

_injectMusicBtn();
