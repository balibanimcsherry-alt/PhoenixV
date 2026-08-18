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
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function initPlayer() {
      playerRef.current = new window.YT.Player('yt-bg-music', {
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

  if (dismissed) return <div id="yt-bg-music" className="yt-hidden" />;

  return (
    <>
      <div id="yt-bg-music" className="yt-hidden" />
      {ready && (
        <div className="music-bar">
          <button className="music-btn" onClick={toggleMute} aria-label={muted ? 'Unmute background music' : 'Mute background music'}>
            <span className="music-icon">{muted ? '🔇' : '🎵'}</span>
            <span className="music-label">{muted ? 'Play music' : 'Now playing'}</span>
          </button>
          <button className="music-dismiss" onClick={() => { playerRef.current?.stopVideo(); setDismissed(true); }} aria-label="Dismiss music player">✕</button>
        </div>
      )}
    </>
  );
}
