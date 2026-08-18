import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const VIDEO_ID = '3qOeNnhUb4A';

export default function BackgroundMusic() {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Create the YT player container OUTSIDE React's managed DOM tree
    // so YT replacing the div with an iframe never confuses React's reconciler
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;visibility:hidden';
    document.body.appendChild(container);
    containerRef.current = container;

    function initPlayer() {
      playerRef.current = new window.YT.Player(container, {
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: VIDEO_ID,
          controls: 0,
          mute: 1,
          playsinline: 1,
          rel: 0,
          iv_load_policy: 3,
          modestbranding: 1,
        },
        events: {
          onReady: () => setReady(true),
        },
      });
    }

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        initPlayer();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }

    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy();
      if (container.parentNode) container.parentNode.removeChild(container);
    };
  }, []);

  const toggleMute = () => {
    if (!playerRef.current || !ready) return;
    if (muted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(35);
    } else {
      playerRef.current.mute();
    }
    setMuted(m => !m);
  };

  const dismiss = () => {
    if (playerRef.current?.stopVideo) playerRef.current.stopVideo();
    setDismissed(true);
  };

  if (dismissed || !ready) return null;

  return (
    <div className="music-bar">
      <button className="music-btn" onClick={toggleMute} aria-label={muted ? 'Unmute background music' : 'Mute background music'}>
        <span className="music-icon">{muted ? '🔇' : '🎵'}</span>
        <span className="music-label">{muted ? 'Play music' : 'Now playing'}</span>
      </button>
      <button className="music-dismiss" onClick={dismiss} aria-label="Dismiss music player">✕</button>
    </div>
  );
}
