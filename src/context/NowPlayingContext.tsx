import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import { PlayerContext } from './PlayerContext';

type NowPlayingContextType = {
  station?: RadioStation;
  stationMetadata?: StationMetadata;
  trackMatch?: TrackInfo;
};

type StationMetadata = {
  contentType: string;
  name: string;
  description: string;
  genre: string;
  title: string;
  match?: TrackInfo;
};

type TrackInfo = {
  artist: string;
  title: string;
  album: string;
  releaseDate: Date | null;
  artwork: string;
};

type NowPlayingInfoProviderProps = PropsWithChildren & {};

export const NowPlayingContext = createContext<NowPlayingContextType | null>(null);

export function NowPlayingProvider({ children }: NowPlayingInfoProviderProps) {
  const playerContext = useContext(PlayerContext);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingContextType>({});

  const intervalRef = useRef<NodeJS.Timer | number>(0);

  useEffect(() => {
    const clearStationMetadata = () => {
      setNowPlaying({});
    };

    const matchTrack = async (searchTerm: string): Promise<TrackInfo | null> => {
      try {
        const cleanedSearchTerm = searchTerm.match(/\w+(?![^(]*\))/g)?.join(' ');
        if (!cleanedSearchTerm) {
          return null;
        }
        const res = await fetch(`https://itunes.apple.com/search?term=${cleanedSearchTerm}&enitity=musicTrack`);
        const data = await res.json();
        if (!data.resultCount) {
          return null;
        }
        // TODO Implement some kind of matching algorithm instead of taking the first result
        return {
          artist: data.results[0].artistName || '',
          title: data.results[0].trackName || '',
          album: data.results[0].collectionName || '',
          releaseDate: new Date(data.results[0].releaseDate) || null,
          artwork: data.results[0].artworkUrl100,
        };
      } catch (err) {
        return null;
      }
    };

    const getNowPlayingInfo = async () => {
      try {
        const res = await fetch('https://service.radiolise.com?url=' + playerContext?.station?.listenUrl);
        const data = await res.json();
        if (data.title !== nowPlaying.stationMetadata?.title) {
          const trackMatch = await matchTrack(data.title);
          setNowPlaying({
            station: playerContext?.station || undefined,
            stationMetadata: {
              contentType: data['content-type'] || '',
              name: data.name || '',
              description: data.description || '',
              genre: data.genre || '',
              title: data.title || '',
            },
            trackMatch: trackMatch || undefined,
          });
        }
      } catch (err) {
        clearStationMetadata();
      }
    };

    if (playerContext?.status === 'playing') {
      clearInterval(intervalRef.current);
      setNowPlaying({
        station: playerContext?.station || undefined,
      });
      getNowPlayingInfo().then(() => {
        intervalRef.current = setInterval(() => getNowPlayingInfo(), 12000);
      });
    }

    if (playerContext?.status !== 'playing') {
      clearInterval(intervalRef.current);
      clearStationMetadata();
    }

    return () => clearInterval(intervalRef.current);
  }, [playerContext?.status, playerContext?.station?.listenUrl, nowPlaying.stationMetadata?.title]);

  return <NowPlayingContext.Provider value={nowPlaying}>{children}</NowPlayingContext.Provider>;
}
