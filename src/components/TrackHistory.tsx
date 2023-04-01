import { useContext } from 'react';
import { NowPlayingContext } from '../context/NowPlayingContext';
import Card from './ui/Card';

import styles from './TrackHistory.module.css';

type TrackHistoryProps = {
  className?: string;
};

export default function TrackHistory({ className }: TrackHistoryProps) {
  const { history } = useContext(NowPlayingContext) || {};

  if (!history?.length) return null;

  return (
    <div className={`${styles.history} ${className ? className : ''}.trim()`}>
      <h2 className={styles.componentTitle}>Song history</h2>
      {history.map((entry) => (
        <Card key={entry.id} className={styles.historyCard}>
          <figure>
            <img src={entry.artwork} alt="Song artwork"></img>
          </figure>
          <div className={styles.historyTrackInfo}>
            <p className={styles.historyCardTitle}>{entry.title}</p>
            <p className={styles.historyCardArtist}>{entry.artist}</p>
            <p className={styles.historyCardDate}>{entry.heardAt.toLocaleString()}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
