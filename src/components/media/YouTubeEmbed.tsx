'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  id: string;               // ID YouTube
  className?: string;       // optionnel pour wrapper externe
};

export default function YouTubeEmbed({ id, className }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const src = `https://www.youtube.com/embed/${id}?enablejsapi=1&playsinline=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&disablekb=1`;

  const play = () => {
    setPlaying(true);
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
      '*'
    );
  };

  // Pause si on démonte (navigation)
  useEffect(() => {
    return () => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
        '*'
      );
    };
  }, []);

  return (
    <div className={`${className ?? ''} ytwrap ${playing ? 'is-playing' : ''}`}>
      <iframe
        ref={iframeRef}
        src={src}
        title="YouTube video"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
      {!playing && (
        <button className="ytplay" onClick={play} aria-label="Lire la vidéo">
          <span className="triangle" />
        </button>
      )}
    </div>
  );
}
