import { useEffect, useRef, useState } from 'react';

export function useNowPlayingInfo(playerStatus: any) {
  const [nowPlayingInfo, setNowPlayingInfo] = useState({} as any);
  const title = useRef();
  const interval: { current: NodeJS.Timer | number } = useRef(0);

  useEffect(() => {
    const getNowPlayingInfo = async (url: string) => {
      try {
        const res = await fetch('https://service.radiolise.com?url=' + url);
        const data = await res.json();
        if (data.title !== title.current) {
          title.current = data.title;
          setNowPlayingInfo((state: any) => ({ ...state, ...data }));
        }
      } catch (err) {
        setNowPlayingInfo({});
      }
    };

    if (playerStatus.status === 'playing') {
      clearInterval(interval.current);
      getNowPlayingInfo(playerStatus.station?.listenUrl).then(() => {
        interval.current = setInterval(() => getNowPlayingInfo(playerStatus.station?.listenUrl), 15000);
      });
    }

    if (playerStatus.status !== 'playing') {
      clearInterval(interval.current);
      setNowPlayingInfo({});
    }

    return () => clearInterval(interval.current);
  }, [playerStatus.status, playerStatus.station?.listenUrl]);

  useEffect(() => {
    if (!nowPlayingInfo.title) {
      return;
    }

    setNowPlayingInfo((state: any) => ({ ...state, artistName: '', trackName: '', artwork: '', appleMusicUrl: '' }));
    fetch(`https://itunes.apple.com/search?term=${nowPlayingInfo.title.replaceAll('-', ' ')}&enitity=musicTrack`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.resultCount) {
          return;
        }
        const { artistName, trackName, artworkUrl100: artwork, trackViewUrl: appleMusicUrl } = data.results[0];
        setNowPlayingInfo((state: any) => ({ ...state, artistName, trackName, artwork, appleMusicUrl }));
      });
  }, [nowPlayingInfo.title]);

  return nowPlayingInfo;
}
