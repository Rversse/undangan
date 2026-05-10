// ════════════════════════════════════════════════════════════════
//  BACKGROUND MUSIC CONFIG  ← edit bagian ini sesuai kebutuhan
// ════════════════════════════════════════════════════════════════

const MUSIC_CONFIG = {
  // Ganti dengan YouTube video ID (bagian setelah ?v= di URL YouTube)
  // Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ → videoId: "dQw4w9WgXcQ"
  videoId: "tX73H2FRcK8",

  // Mulai dari detik ke berapa (misal 30 = mulai dari 0:30)
  startSeconds: 0,

  // Volume 0–100
  volume: 50,

  // Ulangi terus-menerus?
  loop: true,
};

// ════════════════════════════════════════════════════════════════
//  MUSIC PLAYER  — tidak perlu diubah di bawah ini
// ════════════════════════════════════════════════════════════════

const MusicPlayer = (() => {
  let player     = null;
  let ready      = false;
  let pendingPlay = false;   // true jika play dipanggil sebelum API siap
  let muted      = false;

  // ── Inject YouTube IFrame API script ──────────────────────────
  function _loadAPI() {
    if (document.getElementById('yt-api-script')) return;
    const tag = document.createElement('script');
    tag.id  = 'yt-api-script';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  // ── Buat hidden iframe container ──────────────────────────────
  function _createContainer() {
    if (document.getElementById('yt-player-wrap')) return;
    const wrap = document.createElement('div');
    wrap.id = 'yt-player-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:fixed;width:1px;height:1px;top:-9999px;left:-9999px;pointer-events:none;opacity:0;';
    wrap.innerHTML = '<div id="yt-player"></div>';
    document.body.appendChild(wrap);
  }

  // ── Callback dari YouTube IFrame API ──────────────────────────
  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('yt-player', {
      height: '1',
      width:  '1',
      videoId: MUSIC_CONFIG.videoId,
      playerVars: {
        autoplay:       0,
        controls:       0,
        loop:           MUSIC_CONFIG.loop ? 1 : 0,
        playlist:       MUSIC_CONFIG.loop ? MUSIC_CONFIG.videoId : '',
        start:          MUSIC_CONFIG.startSeconds,
        enablejsapi:    1,
        origin:         window.location.origin,
        rel:            0,
        modestbranding: 1,
        playsinline:    1,
      },
      events: {
        onReady: (e) => {
          ready = true;
          e.target.setVolume(MUSIC_CONFIG.volume);
          if (pendingPlay) {
            e.target.playVideo();
            pendingPlay = false;
          }
        },
        onError: (e) => {
          console.warn('[MusicPlayer] YouTube error code:', e.data);
        },
      },
    });
  };

  // ── Public API ────────────────────────────────────────────────
  function init() {
    _createContainer();
    _loadAPI();
  }

  function play() {
    if (!ready) {
      pendingPlay = true;    // mainkan begitu siap
      return;
    }
    player?.playVideo();
  }

  function pause() {
    player?.pauseVideo();
  }

  function toggleMute() {
    if (!player) return;
    muted = !muted;
    muted ? player.mute() : player.unMute();
    _updateBtn();
  }

  function _updateBtn() {
    const icon  = document.getElementById('music-icon');
    const label = document.getElementById('music-label');
    if (!icon || !label) return;
    if (muted) {
      icon.innerHTML  = ICONS.muted;
      label.textContent = 'Musik Off';
    } else {
      icon.innerHTML  = ICONS.playing;
      label.textContent = 'Musik On';
    }
  }

  return { init, play, pause, toggleMute };
})();


// ── SVG Icons ─────────────────────────────────────────────────
const ICONS = {
  playing: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>`,
  muted: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/>
    <line x1="17" y1="9" x2="23" y2="15"/>
  </svg>`,
};


// ── Floating Music Button ──────────────────────────────────────
function _injectMusicBtn() {
  const btn = document.createElement('button');
  btn.id = 'music-btn';
  btn.setAttribute('aria-label', 'Toggle musik');
  btn.innerHTML = `
    <span id="music-icon">${ICONS.playing}</span>
    <span id="music-label">Musik On</span>
    <span class="music-waves" aria-hidden="true">
      <span></span><span></span><span></span>
    </span>
  `;
  btn.onclick = () => MusicPlayer.toggleMute();
  document.body.appendChild(btn);
}

function _injectMusicStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* ── Floating music button ── */
    #music-btn {
      position: fixed;
      bottom: 24px;
      right: 20px;
      z-index: 999;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px 8px 12px;
      background: rgba(20, 145, 155, 0.15);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(200, 169, 110, 0.35);
      border-radius: 40px;
      color: #C8A96E;
      font-family: 'Jost', sans-serif;
      font-size: 0.7rem;
      font-weight: 300;
      letter-spacing: 0.08em;
      cursor: pointer;
      transition: background 0.3s, transform 0.2s;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }
    #music-btn:hover {
      background: rgba(20, 145, 155, 0.28);
      transform: translateY(-2px);
    }
    #music-btn:active { transform: scale(0.96); }

    /* Wave bars animation */
    .music-waves {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 14px;
    }
    .music-waves span {
      display: block;
      width: 2.5px;
      border-radius: 2px;
      background: #C8A96E;
      animation: wave 0.9s ease-in-out infinite;
    }
    .music-waves span:nth-child(1) { height: 6px;  animation-delay: 0s;    }
    .music-waves span:nth-child(2) { height: 12px; animation-delay: 0.15s; }
    .music-waves span:nth-child(3) { height: 8px;  animation-delay: 0.3s;  }

    @keyframes wave {
      0%, 100% { transform: scaleY(1);   opacity: 1;   }
      50%       { transform: scaleY(0.3); opacity: 0.5; }
    }

    /* Sembunyikan wave saat muted */
    #music-btn.muted .music-waves span { animation: none; transform: scaleY(0.25); opacity: 0.3; }
  `;
  document.head.appendChild(style);
}


// ── Override openInvite agar musik mulai saat undangan dibuka ──
//    (browser policy: audio hanya bisa play setelah user interaction)
const _origOpenInvite = window.openInvite;
window.openInvite = function () {
  if (typeof _origOpenInvite === 'function') _origOpenInvite();
  MusicPlayer.play();
};


// ── Init ───────────────────────────────────────────────────────
MusicPlayer.init();
_injectMusicStyles();
_injectMusicBtn();
