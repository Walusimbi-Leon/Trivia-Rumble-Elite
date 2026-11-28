import {
  createArenaIntroVideoSizer,
  updateArenaIntroVideoFocalPoint,
} from './arena-intro-sizing.js';

function resolveDefaultAsset(relativePath) {
  const clean = String(relativePath || "").replace(/^\.\//, "");
  return `/arena-intro-video/${clean}`;
}

/**
 * Mounts the merged TRIVIA RUMBLE ELITE + Connecting to the Arena Intro/Loading
 * Video inside `container` with mobile-safe inline playback, optional Skip button,
 * fade-out on completion, and responsive Portrait Phone / Landscape Desktop sizing
 * via arena-intro-sizing.js.
 */
export function createArenaIntroVideo(container, options = {}) {
  if (!container) {
    throw new Error('createArenaIntroVideo requires a valid DOM container element.');
  }

  const opts = {
    mp4Src: resolveDefaultAsset('./assets/trivia-rumble-arena-intro.mp4'),
    webmSrc: resolveDefaultAsset('./assets/trivia-rumble-arena-intro.webm'),
    posterSrc: resolveDefaultAsset('./assets/trivia-rumble-arena-poster.jpg'),
    format: 'desktop-landscape', // 'desktop-landscape' | 'phone-portrait' | 'phone-portrait-fill' | 'fullscreen' | 'auto' | ...
    fitMode: undefined,          // optional override: 'cover' | 'contain' | 'fill'
    focalPoint: undefined,       // optional override: 'stack' | 'center' | 'top' | 'bottom'
    scale: 1,
    autoPlay: true,
    loop: false,
    muted: true,
    playbackRate: 1.0,
    volume: 80,
    controls: false,
    showSkipButton: false,
    skipButtonLabel: 'Skip',
    fadeOutOnEnd: false,
    fadeDurationMs: 420,
    borderRadius: '0px',
    onReady: null,
    onPlay: null,
    onPause: null,
    onTimeUpdate: null,
    onEnded: null,
    onSkip: null,
    ...options,
  };

  container.innerHTML = '';
  if (opts.borderRadius && opts.borderRadius !== '0px') {
    container.style.borderRadius = opts.borderRadius;
  }

  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.playsInline = true;
  video.preload = 'auto';
  video.defaultMuted = Boolean(opts.muted);
  video.muted = Boolean(opts.muted);
  if (opts.muted) {
    video.setAttribute('muted', '');
  }
  video.autoplay = Boolean(opts.autoPlay);
  video.loop = Boolean(opts.loop);
  video.controls = Boolean(opts.controls);
  video.volume = Math.max(0, Math.min(1, Number(opts.volume) / 100));
  video.playbackRate = Math.max(0.25, Math.min(3.0, Number(opts.playbackRate) || 1));

  if (opts.posterSrc) {
    video.poster = opts.posterSrc;
  }

  if (opts.mp4Src) {
    const mp4Source = document.createElement('source');
    mp4Source.src = opts.mp4Src;
    mp4Source.type = 'video/mp4';
    video.appendChild(mp4Source);
  }
  if (opts.webmSrc) {
    const webmSource = document.createElement('source');
    webmSource.src = opts.webmSrc;
    webmSource.type = 'video/webm';
    video.appendChild(webmSource);
  }

  video.style.transition = `opacity ${opts.fadeDurationMs}ms ease`;
  video.style.opacity = '1';
  container.appendChild(video);
  video.load();

  const sizer = createArenaIntroVideoSizer(container, video, {
    format: opts.format,
    fitMode: opts.fitMode,
    focalPoint: opts.focalPoint,
    scale: opts.scale,
  });

  let skipBtn = null;
  if (opts.showSkipButton) {
    skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.textContent = opts.skipButtonLabel;
    skipBtn.style.position = 'absolute';
    skipBtn.style.right = '16px';
    skipBtn.style.bottom = '16px';
    skipBtn.style.zIndex = '10';
    skipBtn.style.padding = '8px 14px';
    skipBtn.style.borderRadius = '8px';
    skipBtn.style.border = '1px solid rgba(148, 163, 184, 0.35)';
    skipBtn.style.background = 'rgba(10, 14, 24, 0.78)';
    skipBtn.style.color = '#f1f5f9';
    skipBtn.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    skipBtn.style.fontSize = '12px';
    skipBtn.style.fontWeight = '600';
    skipBtn.style.cursor = 'pointer';
    skipBtn.addEventListener('click', () => controller.skip());
    container.appendChild(skipBtn);
  }

  let fallbackPlayBtn = null;
  const removeFallbackPlayBtn = () => {
    if (fallbackPlayBtn && fallbackPlayBtn.parentNode) {
      fallbackPlayBtn.parentNode.removeChild(fallbackPlayBtn);
    }
    fallbackPlayBtn = null;
  };
  const showFallbackPlayBtn = () => {
    if (fallbackPlayBtn || destroyed) return;
    fallbackPlayBtn = document.createElement('button');
    fallbackPlayBtn.type = 'button';
    fallbackPlayBtn.textContent = 'Play Intro';
    fallbackPlayBtn.style.position = 'absolute';
    fallbackPlayBtn.style.left = '50%';
    fallbackPlayBtn.style.top = '50%';
    fallbackPlayBtn.style.transform = 'translate(-50%, -50%)';
    fallbackPlayBtn.style.zIndex = '12';
    fallbackPlayBtn.style.padding = '10px 18px';
    fallbackPlayBtn.style.borderRadius = '10px';
    fallbackPlayBtn.style.border = '1px solid rgba(56, 189, 248, 0.5)';
    fallbackPlayBtn.style.background = 'rgba(10, 14, 24, 0.85)';
    fallbackPlayBtn.style.color = '#f8fafc';
    fallbackPlayBtn.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    fallbackPlayBtn.style.fontSize = '13px';
    fallbackPlayBtn.style.fontWeight = '600';
    fallbackPlayBtn.style.cursor = 'pointer';
    fallbackPlayBtn.addEventListener('click', () => {
      video.play().then(removeFallbackPlayBtn).catch(() => {});
    });
    container.appendChild(fallbackPlayBtn);
  };

  let rafId = 0;
  let endedDispatched = false;
  let fadeTimer = 0;
  let destroyed = false;

  const getPhase = (sec) => {
    if (sec < 1.88) return 'rumble-popup';
    if (sec < 3.35) return 'arena-connect-enter';
    return 'unified-loading';
  };

  const syncFocal = () => {
    if (destroyed) return;
    const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 6.5;
    const progress = Math.max(0, Math.min(1, video.currentTime / dur));
    const st = sizer.getState();
    updateArenaIntroVideoFocalPoint(video, progress, st.focalPoint);
    if (typeof opts.onTimeUpdate === 'function') {
      opts.onTimeUpdate({
        currentTime: video.currentTime,
        duration: dur,
        progress,
        phase: getPhase(video.currentTime),
      });
    }
    if (!video.paused && !video.ended) {
      rafId = requestAnimationFrame(syncFocal);
    }
  };

  const onLoadedMetadata = () => {
    syncFocal();
    if (typeof opts.onReady === 'function') {
      opts.onReady({ duration: video.duration || 6.5 });
    }
  };

  const onPlayEvent = () => {
    endedDispatched = false;
    removeFallbackPlayBtn();
    video.style.opacity = '1';
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(syncFocal);
    if (typeof opts.onPlay === 'function') {
      opts.onPlay();
    }
  };

  const onPauseEvent = () => {
    cancelAnimationFrame(rafId);
    syncFocal();
    if (typeof opts.onPause === 'function') {
      opts.onPause();
    }
  };

  const finishIntro = (reason) => {
    if (endedDispatched || destroyed) return;
    endedDispatched = true;
    cancelAnimationFrame(rafId);
    const triggerEnd = () => {
      if (destroyed) return;
      if (reason === 'skip' && typeof opts.onSkip === 'function') {
        opts.onSkip();
      }
      if (typeof opts.onEnded === 'function') {
        opts.onEnded({ reason });
      }
    };
    if (opts.fadeOutOnEnd && !video.loop) {
      video.style.opacity = '0';
      fadeTimer = window.setTimeout(triggerEnd, opts.fadeDurationMs);
    } else {
      triggerEnd();
    }
  };

  const onEndedEvent = () => finishIntro('completed');

  video.addEventListener('loadedmetadata', onLoadedMetadata);
  video.addEventListener('play', onPlayEvent);
  video.addEventListener('pause', onPauseEvent);
  video.addEventListener('ended', onEndedEvent);

  const onErrorEvent = () => finishIntro("completed");
  video.addEventListener("error", onErrorEvent);

  if (opts.autoPlay) {
    video.play().catch(() => {
      showFallbackPlayBtn();
    });
  }

  const controller = {
    videoElement: video,
    sizer,
    play: () => {
      endedDispatched = false;
      video.style.opacity = '1';
      return video.play();
    },
    pause: () => video.pause(),
    restart: () => {
      window.clearTimeout(fadeTimer);
      endedDispatched = false;
      video.style.opacity = '1';
      video.currentTime = 0;
      return video.play();
    },
    skip: () => {
      video.pause();
      finishIntro('skip');
    },
    seek: (seconds) => {
      const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 6.5;
      video.currentTime = Math.max(0, Math.min(dur, Number(seconds) || 0));
      syncFocal();
    },
    setMuted: (muted) => {
      video.muted = Boolean(muted);
    },
    setVolume: (pct) => {
      video.volume = Math.max(0, Math.min(1, Number(pct) / 100));
    },
    setLoop: (loop) => {
      video.loop = Boolean(loop);
    },
    setPlaybackRate: (rate) => {
      video.playbackRate = Math.max(0.25, Math.min(3.0, Number(rate) || 1));
    },
    setFormat: (format) => sizer.setFormat(format),
    setFitMode: (fitMode) => sizer.setFitMode(fitMode),
    setFocalPoint: (focalPoint) => sizer.setFocalPoint(focalPoint),
    setScale: (scale) => sizer.setScale(scale),
    makeSmaller: (step = 0.15) => sizer.makeSmaller(step),
    makeBigger: (step = 0.15) => sizer.makeBigger(step),
    getState: () => ({
      currentTime: video.currentTime,
      duration: Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 6.5,
      paused: video.paused,
      ended: video.ended,
      muted: video.muted,
      playbackRate: video.playbackRate,
      sizing: sizer.getState(),
    }),
    destroy: () => {
      destroyed = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(fadeTimer);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('play', onPlayEvent);
      video.removeEventListener('pause', onPauseEvent);
      video.removeEventListener('ended', onEndedEvent);
      video.removeEventListener('error', onErrorEvent);
      video.pause();
      video.removeAttribute('src');
      video.load();
      sizer.destroy();
      container.innerHTML = '';
    },
  };

  return controller;
}
