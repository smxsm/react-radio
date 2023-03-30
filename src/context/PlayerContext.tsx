import Hls from 'hls.js';
import { createContext, PropsWithChildren, useEffect, useRef, useState } from 'react';

export type PlayerContextType = {
  station?: RadioStation;
  queue: RadioStation[];
  queueCurrentIndex: number;
  status: PlayerStatus;
  audioContext?: AudioContext;
  sourceNode?: AudioNode;
  play: (stations?: RadioStation[] | null, index?: number) => void;
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

  useEffect(() => {
    audioSourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioElementRef.current);
    audioSourceNodeRef.current.connect(audioContextRef.current.destination);
    setSourceNode(audioSourceNodeRef.current);
  }, []);

  audioElementRef.current.crossOrigin = 'anonymous';

  const resetAudioElements = () => {
    audioElementRef.current.src = '';
    audioElement2Ref.current.src = '';
    audioElementRef.current.load();
    audioElement2Ref.current.load();
  };

  const stop = () => {
    hlsRef.current.stopLoad();
    hlsRef.current.detachMedia();
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

  const play = (stations: RadioStation[] | null | undefined, index = queueCurrentIndex) => {
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

    audioElementRef.current.src = station.listenUrl;
    // Try playing the stream
    audioElementRef.current
      .play()
      .then(() => {
        setStatus('playing');
      })
      .catch(() => {
        // Playback failed. Maybe CORS issue. Try playing outside the Audio Context.
        audioElement2Ref.current.src = station.listenUrl;
        audioElement2Ref.current
          .play()
          .then(() => setStatus('playing'))
          .catch(() => {
            // Still failing. Maybe it is a HLS stream. Try playing it using hls.js.
            resetAudioElements();
            hlsRef.current.loadSource(station.listenUrl);
            hlsRef.current.attachMedia(audioElementRef.current);
            audioElementRef.current
              .play()
              .then(() => {
                setStatus('playing');
              })
              .catch(() => {
                // All playback attempts failed.
                setStatus('error');
              });
          });
      });
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
