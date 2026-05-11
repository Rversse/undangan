// ════════════════════════════════════════════════════════════════
//  BACKGROUND MUSIC — HTML5 Audio
// ════════════════════════════════════════════════════════════════

const MUSIC_SRC = "https://rversse.github.io/undangan/bgm.mp3";

const MusicPlayer = (() => {

  let audio   = null;
  let playing = false;
  let muted   = false;

  function init() {

    audio = new Audio(MUSIC_SRC);

    audio.loop        = true;
    audio.volume      = 0.5;
    audio.preload     = 'auto';
    audio.playsInline = true;

    // Debug
    audio.addEventListener('canplaythrough', () => {
      console.log('[Music] ready');
    });

    audio.addEventListener('error', () => {
      console.error('[Music] error:', audio.error);
    });

    audio.addEventListener('ended', () => {
      playing = false;
    });
  }

  async function play() {

    if (!audio) return;

    try {

      // Force load kalau belum ready
      if (audio.readyState === 0) {
        audio.load();
      }

      await audio.play();

      playing = true;

      console.log('[Music] playing');

    } catch (e) {

      playing = false;

      console.warn(
        '[Music] play blocked:',
        e?.name,
        e?.message
      );
    }
  }

  function pause() {

    if (!audio) return;

    audio.pause();

    playing = false;
  }

  async function resume() {

    if (!audio) return;

    try {

      await audio.play();

      playing = true;

    } catch (e) {

      playing = false;

      console.warn('[Music] resume blocked:', e?.name);
    }
  }

  function toggleMute() {

    if (!audio) return;

    muted       = !muted;
    audio.muted = muted;

    _updateBtn();
  }

  function isPlaying() {
    return playing;
  }

  function _updateBtn() {

    const btn = document.getElementById('music-btn');

    if (!btn) return;

    btn.setAttribute(
      'aria-label',
      muted ? 'Aktifkan musik' : 'Matikan musik'
    );

    btn.innerHTML = muted
      ? ICONS.muted
      : ICONS.playing;
  }

  return {
    init,
    play,
    pause,
    resume,
    toggleMute,
    isPlaying
  };

})();


// ════════════════════════════════════════════════════════════════
//  ICONS
// ════════════════════════════════════════════════════════════════

const ICONS = {

  playing: `
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round">

      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>

      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>

      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  `,

  muted: `
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round">

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

  btn.setAttribute('aria-label', 'Matikan musik');

  btn.innerHTML = ICONS.playing;

  btn.onclick = () => {
    MusicPlayer.toggleMute();
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

      transition:
        background 0.3s,
        transform 0.2s;

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
      await MusicPlayer.resume();
    }
  }
});


// ════════════════════════════════════════════════════════════════
//  OPEN INVITE HOOK
// ════════════════════════════════════════════════════════════════

const _origOpenInvite = window.openInvite;

window.openInvite = async function () {

  // MAINKAN AUDIO DULU
  await MusicPlayer.play();

  // BARU LANJUT ANIMASI
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
