import styles from './Player.module.css';

import { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStepBackward, faPlay, faStepForward } from '@fortawesome/free-solid-svg-icons';
import SpectrumAnalyzer from './SpectrumAnalyzer';
import ScrollingText from './ui/ScrollingText';
import { PlayerContext } from '../context/PlayerContext';
import { NowPlayingContext } from '../context/NowPlayingContext';

export default function Player(props: any) {
  const playerContext = useContext(PlayerContext);
  const nowPlaying = useContext(NowPlayingContext)!;

  const clickHandler = () => {
    if (!playerContext) {
      return;
    }
    playerContext.stop();
  };

  return (
    <div
      className={`${styles.player}${playerContext?.status === 'loading' ? ' ' + styles.loading : ''}`}
      onClick={clickHandler}
    >
      <div className={styles['media-controls']}>
        <div className={styles['button-container']}>
          <button className={styles['media-button']}>
            <FontAwesomeIcon icon={faStepBackward} className={styles['media-button-icon']} />
          </button>
          <button className={`${styles['media-button']} ${styles['media-button-play']}`}>
            <FontAwesomeIcon icon={faPlay} className={styles['media-button-icon']} />
          </button>
          <button className={styles['media-button']}>
            <FontAwesomeIcon icon={faStepForward} className={styles['media-button-icon']} />
          </button>
        </div>
      </div>

      <div className={styles['now-playing-container']}>
        <img src={nowPlaying.trackMatch?.artwork || nowPlaying.station?.logo || '/radio-no-logo.png'} alt="" />
        <div className={styles['now-playing-info']}>
          <ScrollingText
            text={nowPlaying?.stationMetadata?.name || nowPlaying.station?.name || ''}
            className={styles['radio-name']}
          />
          <ScrollingText text={nowPlaying?.stationMetadata?.title || ''} className={styles['track-name']} />
        </div>
        <SpectrumAnalyzer
          source={playerContext?.sourceNode}
          audioCtx={playerContext?.audioContext}
          className={styles.visualizer}
        />
      </div>
    </div>
  );
}
