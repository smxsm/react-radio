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
      title: nowPlaying?.trackMatch?.title || nowPlaying?.stationMetadata?.title,
      artist: nowPlaying?.trackMatch?.artist,
      album: nowPlaying?.stationMetadata?.name || nowPlaying?.station?.name,
      artwork: [
        {
          src: nowPlaying?.trackMatch?.artwork || nowPlaying?.station?.logo || '',
        },
      ],
    });
  }, [nowPlaying, playerContext?.status]);

  return null;
}
