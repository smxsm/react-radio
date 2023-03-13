import styles from './Player.module.css';

import { useContext, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStepBackward, faPlay, faStepForward } from '@fortawesome/free-solid-svg-icons';
import SpectrumAnalyzer from './SpectrumAnalyzer';
import { PlayerControlContext, PlayerNowPlayingContext, PlayerStatusContext } from '../PlayerContext';
import ScrollingText from './ui/ScrollingText';

const audioEl1 = new Audio();
const audioEl2 = new Audio();
let audioCtx = new AudioContext();
let audioSource = audioCtx.createMediaElementSource(audioEl1);
audioSource.connect(audioCtx.destination);
audioEl1.crossOrigin = 'anonymous';

export default function Player(props: any) {
  const [playerControls, setPlayerControls] = useContext(PlayerControlContext);
  const [playerStatus, setPlayerStatus] = useContext(PlayerStatusContext);
  const nowPlayingInfo = useContext(PlayerNowPlayingContext);
  const videoRef = useRef(null);
  const hlsRef = useRef(new Hls());

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }
    hlsRef.current.attachMedia(videoRef.current);
    hlsRef.current.on(Hls.Events.MEDIA_ATTACHED, function () {
      console.log('video and hls.js are now bound together !');
    });
    hlsRef.current.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
      console.log('manifest loaded, found ' + data.levels.length + ' quality level');
    });

    // audioSource.disconnect();
    // audioSource = audioCtx.createMediaElementSource(videoRef.current!);
    // audioSource.connect(audioCtx.destination);
  }, []);

  // useEffect(() => {
  //   if (!playerControls.station) {
  //     return;
  //   }
  //   if (playerControls.action === 'play') {
  //     hlsRef.current.loadSource(playerControls.station?.listenUrl);
  //     hlsRef.current.attachMedia(videoRef.current!);
  //     (videoRef.current! as HTMLMediaElement).play();
  //   }
  // }, [playerControls]);

  useEffect(() => {
    if (playerControls.action === 'play') {
      if (
        playerControls.station?.listenUrl !== '' &&
        playerControls.station?.listenUrl !== playerStatus.station?.listenUrl
      ) {
        setPlayerStatus({ station: playerControls.station, status: 'loading' });
        audioEl1.src = '';
        audioEl2.src = '';
        audioEl1.load();
        audioEl2.load();

        audioEl1.src = playerControls.station?.listenUrl;
        audioEl1
          .play()
          .then(() => setPlayerStatus({ station: playerControls.station, status: 'playing' }))
          .catch(() => {
            audioEl1.src = '';
            audioEl1.load();
            audioEl2.src = playerControls.station?.listenUrl;
            audioEl2
              .play()
              .then(() => setPlayerStatus({ station: playerControls.station, status: 'playing' }))
              .catch(() => {
                setPlayerStatus({ station: playerControls.station, status: 'error' });
                setPlayerControls({ station: {}, action: 'stop' });
              });
          });

        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      }
    }

    if (playerControls.action === 'stop' && playerStatus.status === 'playing') {
      audioEl1.src = '';
      audioEl2.src = '';
      audioEl1.load();
      audioEl2.load();
      setPlayerStatus({ status: 'stopped', station: {} });
    }
  }, [
    playerControls.action,
    playerControls.station,
    setPlayerControls,
    playerStatus.status,
    playerStatus.station,
    setPlayerStatus,
  ]);

  const clickHandler = () => setPlayerControls({ station: {}, action: 'stop' });

  return (
    <div
      className={`${styles.player}${playerStatus.status === 'loading' ? ' ' + styles.loading : ''}`}
      onClick={clickHandler}
    >
      <div className={styles['media-controls']}>
        <div className={styles['button-container']}>
          <button className={styles['media-button']}>
            <FontAwesomeIcon icon={faStepBackward} className={styles['media-button-icon']} />
          </button>
          {/* </div> */}
          {/* <div className={styles['button-container']}> */}
          <button className={`${styles['media-button']} ${styles['media-button-play']}`}>
            <FontAwesomeIcon icon={faPlay} className={styles['media-button-icon']} />
          </button>
          {/* </div> */}
          {/* <div className={styles['button-container']}> */}
          <button className={styles['media-button']}>
            <FontAwesomeIcon icon={faStepForward} className={styles['media-button-icon']} />
          </button>
        </div>
      </div>
      <div className={styles['now-playing-container']}>
        <img src={nowPlayingInfo.artwork || playerStatus.station?.logo || '/radio-no-logo.png'} alt="" />
        <div className={styles['now-playing-info']}>
          <ScrollingText text={nowPlayingInfo.name || playerStatus.station?.name} className={styles['radio-name']} />
          <ScrollingText
            text={
              nowPlayingInfo.artistName && nowPlayingInfo.trackName
                ? `${nowPlayingInfo.artistName} - ${nowPlayingInfo.trackName}`
                : nowPlayingInfo.title
            }
            className={styles['track-name']}
          />
        </div>
        <SpectrumAnalyzer source={audioSource} audioCtx={audioCtx} className={styles.visualizer} />
      </div>
      <video ref={videoRef} className={styles.video}></video>
    </div>
  );
}
