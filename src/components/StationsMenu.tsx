import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faMusic,
  faNewspaper,
  faTableTennis,
  faListUl,
  faGlobeAmericas,
} from '@fortawesome/free-solid-svg-icons';

import Menu from './ui/Menu';
import MenuItem from './ui/MenuItem';

import styles from './StationsMenu.module.css';

type StationsMenuProps = {
  className?: string;
};

export default function StationsMenu({ className }: StationsMenuProps) {
  return (
    <Menu className={`${styles.stationsMenu} ${className ? className : ''}`.trim()}>
      <MenuItem href="/">
        <FontAwesomeIcon icon={faHome} title="Home" />
        <span className={styles.menuItemText}>Home</span>
      </MenuItem>
      <MenuItem href="/stations/all">
        <FontAwesomeIcon icon={faListUl} title="Browse" />
        <span className={styles.menuItemText}>Browse</span>
      </MenuItem>
      <MenuItem href="/stations/music/genres">
        <FontAwesomeIcon icon={faMusic} title="Music" />
        <span className={styles.menuItemText}>Music</span>
      </MenuItem>
      <MenuItem href="stations/genres/news">
        <FontAwesomeIcon icon={faNewspaper} title="News" />
        <span className={styles.menuItemText}>News</span>
      </MenuItem>
      <MenuItem href="stations/genres/sports">
        <FontAwesomeIcon icon={faTableTennis} title="Sports" />
        <span className={styles.menuItemText}>Sports</span>
      </MenuItem>
      <MenuItem href="stations/countries">
        <FontAwesomeIcon icon={faGlobeAmericas} title="Countries" />
        <span className={styles.menuItemText}>Countries</span>
      </MenuItem>
    </Menu>
  );
}
