import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './Navigation.module.css';
import SearchForm from './SearchForm';
import StationsMenu from './StationsMenu';
import UserMenu from './UserMenu';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { useState } from 'react';

type NavigationProps = {
  showPlayer?: () => void;
};

export default function Navigation({ showPlayer }: NavigationProps) {
  const [showMenu, setShowMenu] = useState(false);

  const menuClickHandler = () => setShowMenu((showMenu) => !showMenu);
  return (
    <div className={styles.navBar}>
      <FontAwesomeIcon icon={faBars} className={styles.menuBars} onClick={menuClickHandler} />

      <nav className={`${styles.navigation} ${showMenu ? styles.active : ''}`.trim()}>
        <StationsMenu className={styles.stationsMenu} />
        <SearchForm className={styles.search} />
        <UserMenu className={styles.userMenu} />
      </nav>
      <FontAwesomeIcon icon={faPlayCircle} className={styles.nowPlaying} onClick={showPlayer} />
    </div>
  );
}
