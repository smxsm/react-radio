import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import { PlayerContext } from './PlayerContext';

type NowPlayingContextType = {
  station?: RadioStation;
  stationMetadata?: StationMetadata;
  trackMatch?: TrackInfo;
};

type StationMetadata = {
  icyGenre: string[];
  icyAudioInfo: icyAudioInfo;
  icyName: string;
  icyDescription: string;
  icyUrl: string;
  icyBr: number;
  icySr: number;
  icyLogo: string;
  icyCountryCode: string;
  icyCountrySubdivisionCode: string;
  icyLanguageCodes: string[];
  icyGeoLatLong: string;
  contentType: string;
  title: string;
  trackMatch?: TrackInfo;
};

type icyAudioInfo = {
  bitRate: number;
  quality: number;
  channels: number;
  sampleRate: number;
};

type TrackInfo = {
  artist: string;
  title: string;
  album: string;
  releaseDate: Date | null;
  artwork: string;
  appleMusicUrl?: string;
  youTubeUrl?: string;
};

type NowPlayingInfoProviderProps = PropsWithChildren & {};

export const NowPlayingContext = createContext<NowPlayingContextType | null>(null);

export function NowPlayingProvider({ children }: NowPlayingInfoProviderProps) {
  const playerContext = useContext(PlayerContext);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingContextType>({});
  const intervalRef = useRef<NodeJS.Timer | number>(0);
  const abortControllerRef = useRef(new AbortController());

  useEffect(() => {
    const getNowPlayingInfo = async (url: string | undefined) => {
      if (!url) return;
      try {
        abortControllerRef.current = new AbortController();
        const res = await fetch('https://radio.ivanoff.dev/station-metadata?url=' + url, {
          signal: abortControllerRef.current.signal,
        });
        const stationMetadata = await res.json();
        setNowPlaying((state) => ({ ...state, stationMetadata }));
      } catch (err) {}
    };

    clearInterval(intervalRef.current);
    if (!abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort();
    }

    if (playerContext?.status === 'stopped' || playerContext?.status === 'error') {
      setNowPlaying({});
      return;
    }

    setNowPlaying({ station: playerContext?.station });

    if (playerContext?.status === 'playing') {
      getNowPlayingInfo(playerContext.station?.listenUrl);
      intervalRef.current = setInterval(() => getNowPlayingInfo(playerContext.station?.listenUrl), 5000);
    }

    return () => clearInterval(intervalRef.current);
  }, [playerContext?.station, playerContext?.status]);

  return <NowPlayingContext.Provider value={nowPlaying}>{children}</NowPlayingContext.Provider>;
}
