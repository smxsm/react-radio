import { useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { UserContext } from '../context/UserContext';
import { PlayerContext } from '../context/PlayerContext';
import { DocumentTitleContext } from '../context/DocumentTitleContext';
import useCustomStations from '../hooks/useCustomStations';

import Button from './ui/Button';
import CardsList from './ui/CardsList';
import Spinner from './ui/Spinner';
import RadioStationCard from './RadioStationCard';
import CustomStationsListOptions from './CustomStationsListOptions';

import styles from './CustomStations.module.css';

export default function CustomStation() {
  const [searchParams] = useSearchParams();
  const { sort, order } = Object.fromEntries(searchParams.entries());
  const { user } = useContext(UserContext)!;
  const playerContext = useContext(PlayerContext);
  const { getCustomStations, deleteCustomStation, stations, loading: stationsLoading } = useCustomStations();
  const { setDocumentTitle } = useContext(DocumentTitleContext)!;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const translate = t as (key: string) => string;

  useEffect(() => {
    setDocumentTitle('My stations');
  }, [setDocumentTitle]);

  useEffect(() => {
    getCustomStations('', sort, order !== 'desc');
  }, [user, getCustomStations, sort, order]);

  const playHandler = (index: number) => () => playerContext?.play(stations, index);
  const editHandler = ({ id }: RadioStation) => navigate(`edit/${id}`);
  const deleteHandler = ({ id, name }: RadioStation) =>
    window.confirm(`${translate('info.station.delete')} ${name}?`) &&
    deleteCustomStation(id).then(() => getCustomStations('', sort, order !== 'desc'));

  if (stationsLoading) {
    return <Spinner className={styles.spinner} />;
  }

  return (
    <section className={styles.section}>
      <div className={styles.optionsContaienr}>
        <CustomStationsListOptions />
        <Button className={styles.btnAdd} onClick={() => navigate('/stations/custom/add')}>
          <FontAwesomeIcon icon={faPlus} />
          {translate('stations.addnew')}
        </Button>
      </div>
      <CardsList className={styles.cardsList}>
        {stations.map((station, i) => (
          <RadioStationCard
            station={station}
            disabled={stationsLoading}
            key={i + station.listenUrl}
            onPlay={playHandler(i)}
            onEdit={editHandler}
            onDelete={deleteHandler}
          />
        ))}
      </CardsList>
    </section>
  );
}
