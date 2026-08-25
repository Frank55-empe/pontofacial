import { useCallback, useEffect, useState } from 'react';

export function useKiosk(enabled = true) {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const aoMudar = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', aoMudar);
    return () => document.removeEventListener('fullscreenchange', aoMudar);
  }, [enabled]);

  const entrarFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) return;
      const el = document.documentElement as any;
      const fn = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el);
      if (fn) await fn();
    } catch {
      // fullscreen bloqueado pelo navegador, segue em janela normal
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    entrarFullscreen();
    const aoTocar = () => {
      if (!document.fullscreenElement) entrarFullscreen();
    };
    window.addEventListener('pointerdown', aoTocar);
    return () => window.removeEventListener('pointerdown', aoTocar);
  }, [enabled, entrarFullscreen]);

  useEffect(() => {
    if (!enabled) return;
    let lock: any = null;
    const adquirir = async () => {
      try {
        if ('wakeLock' in navigator && !lock) {
          lock = await (navigator as any).wakeLock.request('screen');
          lock.addEventListener('release', () => { lock = null; });
        }
      } catch {
        // Wake Lock não suportado, depende do timeout do tablet
      }
    };
    adquirir();
    const aoVisivel = () => {
      if (document.visibilityState === 'visible') adquirir();
    };
    document.addEventListener('visibilitychange', aoVisivel);
    return () => {
      document.removeEventListener('visibilitychange', aoVisivel);
      lock?.release?.().catch(() => {});
    };
  }, [enabled]);

  return { fullscreen, entrarFullscreen };
}
