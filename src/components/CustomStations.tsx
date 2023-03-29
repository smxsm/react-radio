import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useContext, useEffect } from 'react';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import Button from './ui/Button';
import CardsList from './ui/CardsList';
import RadioStationCard from './RadioStationCard';

import { UserContext } from '../context/UserContext';
import { PlayerContext } from '../context/PlayerContext';
import useCustomStations from '../hooks/useCustomStations';

import styles from './CustomStations.module.css';
import CustomStationsListOptions from './CustomStationsListOptions';

export default function CustomStation() {
  const [searchParams] = useSearchParams();
  const { sort, order } = Object.fromEntries(searchParams.entries());
  const { user, loading: userLoading } = useContext(UserContext)!;
  const playerContext = useContext(PlayerContext);
  const { getCustomStations, deleteCustomStation, stations, loading: stationsLoading } = useCustomStations();
  const navigate = useNavigate();

  useEffect(() => {
    getCustomStations('', sort, order !== 'desc');
  }, [user, getCustomStations, sort, order]);

  if (!user && !userLoading) {
    return <Navigate to="/" />;
  }

  const playHandler = (station: RadioStation) => playerContext?.play(station);
  const editHandler = ({ id }: RadioStation) => navigate(`edit/${id}`);
  const deleteHandler = ({ id, name }: RadioStation) =>
    window.confirm(`Are you sure you want to delete ${name}?`) &&
    deleteCustomStation(id).then(() => getCustomStations('', sort, order !== 'desc'));

  return (
    <section className={styles.section}>
      <div className={styles.optionsContaienr}>
        <CustomStationsListOptions />
        <Button className={styles.btnAdd} onClick={() => navigate('/stations/custom/add')}>
          <FontAwesomeIcon icon={faPlus} />
          Add
        </Button>
      </div>
      <CardsList className={styles.cardsList}>
        {stations.map((station, i) => (
          <RadioStationCard
            station={station}
            disabled={stationsLoading}
            key={i + station.listenUrl}
            onPlay={playHandler}
            onEdit={editHandler}
            onDelete={deleteHandler}
          />
        ))}
      </CardsList>
    </section>
  );
}
