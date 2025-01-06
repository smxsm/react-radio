import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';
import { faCompactDisc, faFolder, faGlobeAmericas, faMusic, faNewspaper, faTableTennis } from '@fortawesome/free-solid-svg-icons';

import { PlayerContext } from '../context/PlayerContext';
import { UserContext } from '../context/UserContext';
import { NowPlayingContext } from '../context/NowPlayingContext';
import { useStations } from '../hooks/useStations';
import useCustomStations from '../hooks/useCustomStations';

import Button from './ui/Button';
import CardsList from './ui/CardsList';
import RadioStationCard from './RadioStationCard';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const translate = t as (key: string) => string;
  const playerContext = useContext(PlayerContext);
  const { stations: trending, loading: loadingTrending } = useStations(
    {},
    { limit: 12, sort: 'trending', order: 'desc' }
  );
  const { stations: newest, loading: loadinNewest } = useStations({}, { limit: 12, sort: 'date', order: 'desc' });
  const { user, loading: loadingUser } = useContext(UserContext) || {};
  const { stationHistory, removeStationFromHistory, clearStationHistory } = useContext(NowPlayingContext)!;
  const { addCustomStation, getCustomStations, loading: addingCustomStation } = useCustomStations();

  const playHandler = (station: RadioStation) => playerContext?.play([station]);

  const addHandler = (station: RadioStation) =>
    getCustomStations(station.stationId)
      .then((result) =>
        result.length
          ? window.confirm(`${station.name} ${translate('info.tracks.inlibrary')}`)
          : true
      )
      .then((result) => (result ? addCustomStation(station) : false));

  return (
    <>
      {!loadingUser && !user && (
        <section className={styles.heroSection}>
          <figure className={styles.heroImg}>
            <img src="/main.svg" alt="Sound wave"></img>
          </figure>
          <header className={styles.header}>
            <h1 className={styles.heroTitle}>{translate('home.h1')}</h1>
            <p className={styles.heroText}>
              <Trans i18nKey='home.intro'>
              Choose from over 30000 radio stations or <Link to="/auth/signup">register an account</Link> to create your
              own library.
              </Trans>
            </p>
            <p className={styles.heroSubText}>
              <Trans i18nKey='home.login'>
                Already have an account? <Link to="/auth/signin">Click here to sign in.</Link>
              </Trans>
            </p>
            <Button
              type="button"
              title="Browse stations"
              className={styles.btnBrowse}
              onClick={() => navigate('/stations/all')}
            >
              <Trans i18nKey='home.browse'>
                Browse stations
              </Trans>
            </Button>
          </header>
        </section>
      )}
      {user && (
        <section className={styles.heroSection}>
          <figure className={`${styles.heroImg} ${styles.heroImgUser}`}>
            <img src="/main.svg" alt="React Radio"></img>
          </figure>
          <header className={styles.header}>
            <h1 className={styles.heroTitle}>{translate('home.h1.user')}</h1>
            <p className={styles.heroText}>
              <Trans i18nKey='home.intro.user'>
                Choose from over 30000 radio stations and create your own library.
              </Trans>
            </p>
          </header>
        </section>
      )}

      <section className={styles.categoriesSection}>
        {user && (
          <><Link to="/stations/custom" className={styles.category}>
            <div className={styles.homeIcon}><FontAwesomeIcon icon={faFolder} className={styles.categoryIcon} /></div>
            <p className={styles.categoryName}>{translate('home.mystations')}</p>
          </Link><Link to="/user/tracks" className={styles.category}>
              <div className={styles.homeIcon}><FontAwesomeIcon icon={faCompactDisc} className={`${styles.categoryIcon} ${styles.mysongsIcon}`} spin /></div>
              <p className={styles.categoryName}>{translate('home.mytracks')}</p>
            </Link></>
        )}
        <Link to="/stations/music/genres" className={styles.category}>
          <div className={styles.homeIcon}><FontAwesomeIcon icon={faMusic} className={`${styles.categoryIcon} ${styles.musicIcon}`} /></div>
          <p className={styles.categoryName}>{translate('home.music')}</p>
        </Link>
        <Link to="/stations/genres/news" className={styles.category}>
          <div className={styles.homeIcon}><FontAwesomeIcon icon={faNewspaper} className={`${styles.categoryIcon} ${styles.newsIcon}`} /></div>
          <p className={styles.categoryName}>{translate('home.news')}</p>
        </Link>
        <Link to="/stations/genres/sports" className={styles.category}>
          <div className={styles.homeIcon}><FontAwesomeIcon icon={faTableTennis} className={`${styles.categoryIcon} ${styles.sportsIcon}`} /></div>
          <p className={styles.categoryName}>{translate('home.sports')}</p>
        </Link>
        <Link to="/stations/countries" className={styles.category}>
          <div className={styles.homeIcon}><FontAwesomeIcon icon={faGlobeAmericas} className={`${styles.categoryIcon} ${styles.countryIcon}`} /></div>
          <p className={styles.categoryName}>{translate('home.countries')}</p>
        </Link>
      </section>

      <section className={styles.recommendedSection}>
        {!!stationHistory?.length && (
          <div className={styles.recommended}>
            <div className={styles.playHistoryTitleContainer}>
              <h3 className={styles.recommendedTitle}>{translate('home.recent')}</h3>
              <Button
                type="button"
                disabled={!stationHistory?.length}
                className={styles.btnClear}
                onClick={() => clearStationHistory()}
              >
                {translate('general.clear')}
              </Button>
            </div>
            <CardsList>
              {stationHistory.slice(0, 12).map((station) => (
                <RadioStationCard
                  station={{ ...station, isOwner: true }}
                  key={station.id}
                  onPlay={playHandler}
                  onDelete={() => removeStationFromHistory(station.id)}
                  onAdd={addHandler}
                />
              ))}
            </CardsList>
          </div>
        )}
        <div className={styles.recommended}>
          <h3 className={styles.recommendedTitle}>{translate('home.trending')}</h3>
          <CardsList>
            {trending.map((station) => (
              <RadioStationCard
                disabled={loadingTrending || addingCustomStation}
                station={station}
                key={station.id}
                onPlay={playHandler}
                onAdd={addHandler}
              />
            ))}
          </CardsList>
        </div>
        <div className={styles.recommended}>
          <h3 className={styles.recommendedTitle}>{translate('home.new')}</h3>
          <CardsList>
            {newest.map((station, i) => (
              <RadioStationCard
                disabled={loadinNewest || addingCustomStation}
                station={station}
                key={station.id}
                onPlay={playHandler}
                onAdd={addHandler}
              />
            ))}
          </CardsList>
        </div>
      </section>
    </>
  );
}
