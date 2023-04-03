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
        <FontAwesomeIcon icon={faHome} />
        Home
      </MenuItem>
      <MenuItem href="/stations/all">
        <FontAwesomeIcon icon={faListUl} />
        Browse
      </MenuItem>
      <MenuItem href="/stations/music/genres" active>
        <FontAwesomeIcon icon={faMusic} />
        Music
      </MenuItem>
      <MenuItem href="stations/genres/news">
        <FontAwesomeIcon icon={faNewspaper} />
        News
      </MenuItem>
      <MenuItem href="stations/genres/sports">
        <FontAwesomeIcon icon={faTableTennis} />
        Sports
      </MenuItem>
      <MenuItem href="stations/countries">
        <FontAwesomeIcon icon={faGlobeAmericas} />
        Countries
      </MenuItem>
    </Menu>
  );
}
