import { useContext, useEffect } from 'react';
import { NowPlayingContext } from '../context/NowPlayingContext';
import { PlayerContext } from '../context/PlayerContext';

export function MediaSessionAPI() {
  const playerContext = useContext(PlayerContext);
  const nowPlaying = useContext(NowPlayingContext);

  useEffect(() => {
    if (!navigator.mediaSession || playerContext?.status !== 'playing') {
      return;
    }

    navigator.mediaSession.playbackState = 'playing';

    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlaying?.stationMetadata?.trackMatch?.title || nowPlaying?.stationMetadata?.title,
      artist: nowPlaying?.stationMetadata?.trackMatch?.artist,
      album: nowPlaying?.stationMetadata?.icyName || nowPlaying?.station?.name,
      artwork: [
        {
          src: nowPlaying?.stationMetadata?.trackMatch?.artwork || nowPlaying?.station?.logo || '',
        },
      ],
    });
  }, [nowPlaying, playerContext?.status]);

  return null;
}
