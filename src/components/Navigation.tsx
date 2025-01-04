import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './Navigation.module.css';
import SearchForm from './SearchForm';
import StationsMenu from './StationsMenu';
import UserMenu from './UserMenu';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { useContext, useState } from 'react';
import { NowPlayingContext } from '../context/NowPlayingContext';
import ScrollingText from './ui/ScrollingText';
import { PlayerContext } from '../context/PlayerContext';
import { MouseEvent } from 'react';

type NavigationProps = {
  showNowPlaying?: boolean;
  switchPlayer: (visible?: boolean | undefined) => void;
};

export default function Navigation({ showNowPlaying = false, switchPlayer }: NavigationProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { status: playStatus } = useContext(PlayerContext)!;
  const { station, stationMetadata, matchedTrack } = useContext(NowPlayingContext) || {};

  let nowPlayingText = stationMetadata?.title
    ? `${stationMetadata.title} (${stationMetadata.icyName || station?.name})`
    : station?.name;

  if (matchedTrack) {
    const { artist, title } = matchedTrack;
    nowPlayingText = `${artist} - ${title} (${stationMetadata?.icyName || station?.name})`;
  }

  const menuClickHandler = () => setShowMenu((showMenu) => !showMenu);
  const navClickHandler = (e: MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') {
      return;
    }
    // if language flag img clicked, do not toggle menu
    if ((e.target as HTMLElement).tagName === 'IMG') {
      return;
    }
    if ((e.target as HTMLElement).classList.contains('hasSubMenu')) {
      return;
    }
    menuClickHandler();
    switchPlayer && switchPlayer(false);
  };

  return (
    <div className={styles.navBar}>
      <FontAwesomeIcon icon={faBars} className={styles.menuBars} onClick={menuClickHandler} />

      <nav className={`${styles.navigation} ${showMenu ? styles.active : ''}`.trim()} onClick={navClickHandler}>
        <StationsMenu className={styles.stationsMenu} />
        <SearchForm className={styles.search} />
        <UserMenu className={styles.userMenu} />
      </nav>

      {playStatus === 'playing' && showNowPlaying && !showMenu && (
        <div className={styles.nowPlaying} onClick={() => switchPlayer()}>
          <img
            src={matchedTrack?.artwork || station?.logo || '/sound-wave.png'}
            alt={`${station?.name} logo`}
            className={styles.artwork}
          ></img>
          <ScrollingText className={styles.title} text={nowPlayingText || ''} />
        </div>
      )}

      {
        <FontAwesomeIcon
          icon={faPlayCircle}
          className={styles.nowPlayingIcon}
          onClick={() => switchPlayer && switchPlayer()}
        />
      }
    </div>
  );
}
