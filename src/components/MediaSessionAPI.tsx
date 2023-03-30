import { useContext, useEffect } from 'react';
import { NowPlayingContext } from '../context/NowPlayingContext';
import { PlayerContext } from '../context/PlayerContext';

export function MediaSessionAPI() {
  const { play, stop, previous, next } = useContext(PlayerContext) || {};
  const { station, stationMetadata } = useContext(NowPlayingContext) || {};

  const { artist, title, artwork } = stationMetadata?.trackMatch || {};
  const { title: stationTitle, icyName } = stationMetadata || {};
  const { name, logo } = station || {};

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!play) return;
    navigator.mediaSession.setActionHandler('play', () => play());

    return () => navigator.mediaSession.setActionHandler('play', null);
  }, [play]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!stop) return;
    navigator.mediaSession.setActionHandler('pause', () => stop());

    return () => navigator.mediaSession.setActionHandler('pause', null);
  }, [stop]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!previous) return;
    navigator.mediaSession.setActionHandler('previoustrack', () => previous());

    return () => navigator.mediaSession.setActionHandler('previoustrack', null);
  }, [previous]);

  useEffect(() => {
    console.log('setting next');
    if (!('mediaSession' in navigator)) return;
    if (!next) return;
    navigator.mediaSession.setActionHandler('nexttrack', () => next());

    return () => navigator.mediaSession.setActionHandler('nexttrack', null);
  }, [next]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || stationTitle || '',
      artist: artist || '',
      album: icyName || name,
      artwork: [{ src: artwork?.replace('100x100', '600x600') || logo || '' }],
    });

    navigator.mediaSession.playbackState = 'playing';
  }, [artist, title, artwork, stationTitle, icyName, name, logo]);

  return null;
}
