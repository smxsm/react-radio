import { useContext, useEffect } from 'react';
import { NowPlayingContext } from '../context/NowPlayingContext';
import { PlayerContext } from '../context/PlayerContext';

export function MediaSessionAPI() {
  const { status, play, stop, previous, next } = useContext(PlayerContext)!;
  const nowPlaying = useContext(NowPlayingContext);

  useEffect(() => {
    if (!('mediaSession' in navigator) || status !== 'playing') {
      return;
    }

    navigator.mediaSession.playbackState = 'playing';

    navigator.mediaSession.setActionHandler('play', () => play());
    navigator.mediaSession.setActionHandler('stop', () => stop());
    navigator.mediaSession.setActionHandler('previoustrack', () => previous());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());

    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlaying?.stationMetadata?.trackMatch?.title || nowPlaying?.stationMetadata?.title,
      artist: nowPlaying?.stationMetadata?.trackMatch?.artist,
      album: nowPlaying?.stationMetadata?.icyName || nowPlaying?.station?.name,
      artwork: [
        {
          src:
            nowPlaying?.stationMetadata?.trackMatch?.artwork.replace('100x100', '600x600') ||
            nowPlaying?.station?.logo ||
            '',
        },
      ],
    });

    navigator.mediaSession.setPositionState({ duration: 0, playbackRate: 1 });
  }, [nowPlaying, status, play, stop, next, previous]);

  return null;
}
