import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { faPencil, faPlay, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useContext } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import Card from './ui/Card';
import styles from './RadioStationCard.module.css';
import { UserContext } from '../context/UserContext';

type RadioStationCardProps = {
  station: RadioStation;
  disabled?: boolean;
  onPlay?: (station: RadioStation) => void;
  onAdd?: (station: RadioStation) => void;
  onEdit?: (station: RadioStation) => void;
  onDelete?: (station: RadioStation) => void;
};

export default function RadioStationCard({
  station,
  disabled,
  onPlay,
  onAdd,
  onEdit,
  onDelete,
}: RadioStationCardProps) {
  const playerContext = useContext(PlayerContext)!;
  const { user } = useContext(UserContext)!;

  return (
    <Card
      disabled={disabled}
      loading={playerContext?.station?.listenUrl === station.listenUrl && playerContext.status === 'loading'}
      active={playerContext?.station?.listenUrl === station.listenUrl && playerContext.status === 'playing'}
      error={playerContext?.station?.listenUrl === station.listenUrl && playerContext.status === 'error'}
      className={styles.card}
    >
      <figure>
        <img src={station.logo ? station.logo : '/radio-no-logo.png'} alt="" className={styles['card-img']} />
        {!disabled && onPlay && (
          <FontAwesomeIcon icon={faPlay} className={styles.btnPlay} onClick={() => onPlay(station)} />
        )}
      </figure>

      <span className={styles.title}>{station.name}</span>

      <div className={styles.actions}>
        {!disabled && (
          <>
            {user && !station.isOwner && onAdd && (
              <FontAwesomeIcon
                icon={faPlus}
                className={styles.actionIcon}
                title={`Add ${station.name} to your stations`}
                onClick={() => onAdd(station)}
              />
            )}
            {station.isOwner && onDelete && (
              <FontAwesomeIcon
                icon={faTrashAlt}
                className={styles.actionIcon}
                title={`Remove ${station.name} from your stations`}
                onClick={() => onDelete(station)}
              />
            )}
            {station.isOwner && onEdit && (
              <FontAwesomeIcon
                icon={faPencil}
                className={styles.actionIcon}
                title={`Edit ${station.name}`}
                onClick={() => onEdit(station)}
              />
            )}
          </>
        )}
      </div>
    </Card>
  );
}
