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

/**
 * Gets metadata for a radio stream from a free internet service
 * @param url The original stream URL
 * @returns A Promise whose resolved value is a StationMetadata object. Throws on error.
 */
const getStationMetadata = async (url: string): Promise<StationMetadata> => {
  const res = await fetch('https://radio.ivanoff.dev/station-metadata?url=' + url);
  const data = await res.json();
  return data;
};

export const NowPlayingContext = createContext<NowPlayingContextType | null>(null);

export function NowPlayingProvider({ children }: NowPlayingInfoProviderProps) {
  const playerContext = useContext(PlayerContext);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingContextType>({});
  const intervalRef = useRef<NodeJS.Timer | number>(0);

  useEffect(() => {
    const getNowPlayingInfo = async (url: string | undefined) => {
      if (!url) return;
      try {
        const stationMetadata = await getStationMetadata(url);
        setNowPlaying((state) => ({ ...state, stationMetadata }));
      } catch (err) {}
    };

    clearInterval(intervalRef.current);

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
