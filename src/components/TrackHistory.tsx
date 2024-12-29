import { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { useTranslation } from 'react-i18next';

import { NowPlayingContext } from '../context/NowPlayingContext';

import Card from './ui/Card';
import Button from './ui/Button';

import styles from './TrackHistory.module.css';

type TrackHistoryProps = {
  className?: string;
};

export default function TrackHistory({ className }: TrackHistoryProps) {
  const { songHistory, removeSongFromHistory, clearSongHistory } = useContext(NowPlayingContext)!;
  const { t } = useTranslation();
  const translate = t as (key: string) => string;

  if (!songHistory?.length) return null;

  return (
    <div className={`${styles.history} ${className ? className : ''}.trim()`}>
      <div className={styles.titleContainer}>
        <h2 className={styles.componentTitle}>{translate('tracks.songhistory')}</h2>
        <Button
          type="button"
          disabled={!songHistory?.length}
          className={styles.btnClear}
          onClick={() => clearSongHistory()}
        >
          {translate('general.clear')}
        </Button>
      </div>
      {songHistory?.map((entry) => (
        <Card key={entry.id} className={styles.historyCard}>
          <figure>
            <img src={entry.artwork ?? undefined} alt="Song artwork" />
          </figure>
          <div className={styles.historyTrackInfo}>
            <p className={styles.historyCardTitle}>{entry.title}</p>
            <p className={styles.historyCardArtist}>{entry.artist}</p>
            <p className={styles.historyCardDate}>{entry.heardAt?.toLocaleString()}</p>
          </div>
          <div className={styles.actions}>
            <FontAwesomeIcon
              icon={faTrashAlt}
              className={styles.actionIcon}
              title={`Remove`}
              onClick={() => removeSongFromHistory(entry.id)}
            />
          </div>
          <div className={styles.streamLinks}>
            {entry.appleMusicUrl && (
              <a target="_blank" rel="noreferrer" href={entry.appleMusicUrl}>
                <img src="/apple-music.svg" alt="Apple Musc" className={styles.streamLink} />
              </a>
            )}
            {entry.youTubeUrl && (
              <a target="_blank" rel="noreferrer" href={entry.youTubeUrl}>
                <img src="/youtube.png" alt="Apple Musc" className={styles.streamLink} />
              </a>
            )}
            {entry.spotifyUrl && (
              <a target="_blank" rel="noreferrer" href={entry.spotifyUrl}>
                <img src="/spotify.svg" alt="Spotify" className={styles.streamLink} />
              </a>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
