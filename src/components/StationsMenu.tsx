import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faTrophy,
  faMusic,
  faMicrophone,
  faNewspaper,
  faTableTennis,
  faListUl,
  faGlobeAmericas,
  faLanguage,
} from '@fortawesome/free-solid-svg-icons';
import { Menu } from './ui/Menu';
import MenuItem from './ui/MenuItem';

export default function StationsMenu() {
  return (
    <Menu>
      <MenuItem href="/">
        <FontAwesomeIcon icon={faHome} />
        Home
      </MenuItem>
      <MenuItem href="/stations/top">
        <FontAwesomeIcon icon={faTrophy} />
        Top Stations
      </MenuItem>
      <MenuItem href="/stations/music/" active>
        <FontAwesomeIcon icon={faMusic} />
        Music
      </MenuItem>
      <MenuItem href="stations/genres/talk">
        <FontAwesomeIcon icon={faMicrophone} />
        Talk
      </MenuItem>
      <MenuItem href="stations/genres/news">
        <FontAwesomeIcon icon={faNewspaper} />
        News
      </MenuItem>
      <MenuItem href="stations/genres/sports">
        <FontAwesomeIcon icon={faTableTennis} />
        Sports
      </MenuItem>
      <MenuItem href="stations/genres/">
        <FontAwesomeIcon icon={faListUl} />
        All Genres
      </MenuItem>
      <MenuItem href="stations/countries">
        <FontAwesomeIcon icon={faGlobeAmericas} />
        By Location
      </MenuItem>
      <MenuItem href="/bylanguage/">
        <FontAwesomeIcon icon={faLanguage} />
        By Language
      </MenuItem>
    </Menu>
  );
}
