import Hls from 'hls.js';
import { createContext, PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';

export type PlayerContextType = {
  station?: RadioStation;
  queue: RadioStation[];
  queueCurrentIndex: number;
  status: PlayerStatus;
  audioContext?: AudioContext;
  sourceNode?: AudioNode;
  play: (stations?: RadioStation[] | null, index?: number) => Promise<void>;
  previous: () => void;
  next: () => void;
  stop: () => void;
};

type PlayerStatus = 'error' | 'loading' | 'playing' | 'stopped';

type PlayerProviderProps = PropsWithChildren & {};

export const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: PlayerProviderProps) {
  const audioElementRef = useRef(new Audio());
  const audioElement2Ref = useRef(new Audio());
  const hlsRef = useRef(new Hls());
  const audioContextRef = useRef(new AudioContext());
  const audioSourceNodeRef = useRef<MediaElementAudioSourceNode>();

  const [queue, setQueue] = useState<RadioStation[]>([]);
  const [queueCurrentIndex, setQueueCurrentIndex] = useState(0);
  const [station, setStation] = useState<RadioStation>();
  const [status, setStatus] = useState<PlayerStatus>('stopped');
  const [sourceNode, setSourceNode] = useState<AudioNode>();

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Initialize
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    audioElementRef.current.addEventListener('playing', () => setStatus('playing'));
    audioElement2Ref.current.addEventListener('playing', () => setStatus('playing'));
    audioElement2Ref.current.addEventListener('error', (e: Event) => {
      if ((e.target as HTMLMediaElement).src !== window.location.href) {
        setStatus('error');
      }
    });

    audioElementRef.current.crossOrigin = 'anonymous';
    audioSourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioElementRef.current);
    audioSourceNodeRef.current.connect(audioContextRef.current.destination);
    setSourceNode(audioSourceNodeRef.current);
  }, []);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Used to reset audio elements and destroy hls object on playback change
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const resetAudioElements = useCallback(() => {
    hlsRef.current.stopLoad();
    hlsRef.current.detachMedia();
    hlsRef.current.destroy();
    audioElementRef.current.src = window.location.href;
    audioElement2Ref.current.src = window.location.href;
  }, []);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Tries to play the first audio element. Falls back to using the second one (outside AudioContext) on CORS error
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const startPlayback = useCallback(
    (station: RadioStation) => {
      audioElementRef.current.play().catch((err) => {
        if (err.name === 'NotSupportedError') {
          resetAudioElements();
          audioElement2Ref.current.src = station.listenUrl;
          audioElement2Ref.current.play();
          return;
        }
        setStatus('error');
      });
    },
    [resetAudioElements]
  );

  const stop = () => {
    resetAudioElements();
    setStatus('stopped');
  };

  const previous = () => {
    if (queue.length < 2) return;
    let index = queueCurrentIndex - 1;
    if (index === -1) {
      index = queue.length - 1;
    }
    play(null, index);
  };

  const next = () => {
    if (queue.length < 2) return;
    let index = queueCurrentIndex + 1;
    if (index === queue.length) {
      index = 0;
    }
    play(null, index);
  };

  const play = async (stations: RadioStation[] | null | undefined, index = queueCurrentIndex) => {
    let station = queue[index];
    if (stations) {
      setQueue(stations);
      if (index >= stations.length) {
        index = 0;
      }
      station = stations[index];
    }
    if (!station) return;

    stop();
    setQueueCurrentIndex(index);
    setStation(station);
    setStatus('loading');

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    try {
      const signal = AbortSignal.timeout(5000);
      const res = await fetch(station.listenUrl, { signal });
      // HACK! Google Chrome states it can't play audio/aacp but in reality it plays fine. So we change audio/aacp content type to regular audio/aac
      const contentType = (res.headers.get('Content-Type') || '').replace('aacp', 'aac');
      if (!audioElementRef.current.canPlayType(contentType) && contentType !== 'application/vnd.apple.mpegurl') {
        throw new Error('Unsupported audio stream format');
      }
      audioElementRef.current.src = station.listenUrl;
      if (!audioElementRef.current.canPlayType(contentType) && contentType === 'application/vnd.apple.mpegurl') {
        hlsRef.current = new Hls();
        hlsRef.current.loadSource(station.listenUrl);
        hlsRef.current.attachMedia(audioElementRef.current);
      }
      startPlayback(station);
    } catch (err) {
      if (err instanceof TypeError) {
        // Probably CORS. Try to play anyway and fallback to second audio element (outside AudioContext) on error
        audioElementRef.current.src = station.listenUrl;
        startPlayback(station);
      } else {
        console.log((err as Error).message);
        setStatus('error');
      }
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        station,
        queue,
        queueCurrentIndex,
        status,
        play,
        previous,
        next,
        stop,
        audioContext: audioContextRef.current,
        sourceNode,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
