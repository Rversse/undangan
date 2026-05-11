// ════════════════════════════════════════════════════════════════
//  BACKGROUND MUSIC CONFIG
// ════════════════════════════════════════════════════════════════

const MUSIC_CONFIG = {
  videoId:      "tX73H2FRcK8",
  startSeconds: 0,
  volume:       50,
  loop:         true,
};

// ════════════════════════════════════════════════════════════════
//  MUSIC PLAYER
// ════════════════════════════════════════════════════════════════

const MusicPlayer = (() => {
  let player      = null;
  let ready       = false;
  let pendingPlay = false;
  let muted       = false;
  let playing     = false;

  function _loadAPI() {
    if (document.getElementById('yt-api-script')) return;
    const tag = document.createElement('script');
    tag.id  = 'yt-api-script';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  function _createContainer() {
    if (document.getElementById('yt-player-wrap')) return;
    const wrap = document.createElement('div');
    wrap.id = 'yt-player-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:fixed;width:1px;height:1px;top:-9999px;left:-9999px;pointer-events:none;opacity:0;';
    wrap.innerHTML = '<div id="yt-player"></div>';
    document.body.appendChild(wrap);
  }

  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('yt-player', {
      height: '1', width: '1',
      videoId: MUSIC_CONFIG.videoId,
      playerVars: {
        autoplay: 0, controls: 0,
        loop:     MUSIC_CONFIG.loop ? 1 : 0,
        playlist: MUSIC_CONFIG.loop ? MUSIC_CONFIG.videoId : '',
        start:    MUSIC_CONFIG.startSeconds,
        enablejsapi: 1, origin: window.location.origin,
        rel: 0, modestbranding: 1, playsinline: 1,
      },
      events: {
        onReady: (e) => {
          ready = true;
          e.target.setVolume(MUSIC_CONFIG.volume);
          if (pendingPlay) { _doPlay(); pendingPlay = false; }
        },
        onError: (e) => console.warn('[MusicPlayer] error:', e.data),
      },
    });
  };

  // Always seek to start before playing — fixes "resume from middle" bug
  function _doPlay() {
    player.seekTo(MUSIC_CONFIG.startSeconds, true);
    player.playVideo();
    playing = true;
  }

  function init()  { _createContainer(); _loadAPI(); }

  function play() {
    if (!ready) { pendingPlay = true; return; }
    _doPlay();
  }

  function pause() {
    player?.pauseVideo();
    playing = false;
  }

  function toggleMute() {
    if (!player) return;
    muted = !muted;
    muted ? player.mute() : player.unMute();
    _updateBtn();
  }

  function isPlaying() { return playing; }

  // Resume from current position (no seek) — used when tab becomes visible again
  function resume() {
    if (!ready || !playing) return;
    player?.playVideo();
  }

  function _updateBtn() {
    const btn = document.getElementById('music-btn');
    if (!btn) return;
    btn.setAttribute('aria-label', muted ? 'Aktifkan musik' : 'Matikan musik');
    btn.innerHTML = muted ? ICONS.muted : ICONS.playing;
  }

  return { init, play, pause, resume, toggleMute, isPlaying };
})();


// ── Icons (icon-only, no text) ─────────────────────────────────
const ICONS = {
  playing: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>`,
  muted: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/>
    <line x1="17" y1="9" x2="23" y2="15"/>
  </svg>`,
};


// ── Floating music button (icon only) ─────────────────────────
function _injectMusicBtn() {
  const btn = document.createElement('button');
  btn.id = 'music-btn';
  btn.setAttribute('aria-label', 'Matikan musik');
  btn.innerHTML = ICONS.playing;
  btn.onclick = () => MusicPlayer.toggleMute();
  document.body.appendChild(btn);
}

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
      background: rgba(125, 46, 62, 0.18);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(200, 169, 110, 0.35);
      border-radius: 50%;
      color: #C8A96E;
      cursor: pointer;
      transition: background 0.3s, transform 0.2s;
      box-shadow: 0 3px 14px rgba(0,0,0,0.22);
      -webkit-tap-highlight-color: transparent;
    }
    #music-btn:hover { background: rgba(125, 46, 62, 0.32); transform: scale(1.08); }
    #music-btn:active { transform: scale(0.94); }
  `;
  document.head.appendChild(style);
}


// ── Pause on hide, resume on show ─────────────────────────────
let _wasPlayingBeforeHide = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    _wasPlayingBeforeHide = MusicPlayer.isPlaying();
    if (_wasPlayingBeforeHide) MusicPlayer.pause();
  } else {
    if (_wasPlayingBeforeHide) MusicPlayer.resume();
  }
});


// ── Start music when gate is opened ───────────────────────────
const _origOpenInvite = window.openInvite;
window.openInvite = function () {
  if (typeof _origOpenInvite === 'function') _origOpenInvite();
  MusicPlayer.play();
};


// ── Init ───────────────────────────────────────────────────────
MusicPlayer.init();
_injectMusicStyles();
_injectMusicBtn();
