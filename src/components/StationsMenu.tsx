import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const translate = t as (key: string) => string;
  
  return (
    <Menu className={`${styles.stationsMenu} ${className ? className : ''}`.trim()}>
      <div className={styles.logoContainer}>
        <a href='/'><img src="/main.svg" alt="Radio Hero" title='Radio Hero' className={styles.logo} /></a>
      </div>
      <MenuItem href="/">
        <FontAwesomeIcon icon={faHome} title={translate('nav.home')} />
        <span className={styles.menuItemText}>{translate('nav.home')}</span>
      </MenuItem>
      <MenuItem href="/stations/all">
        <FontAwesomeIcon icon={faListUl} title={translate('nav.browse')} />
        <span className={styles.menuItemText}>{translate('nav.browse')}</span>
      </MenuItem>
      <MenuItem href="/stations/music/genres">
        <FontAwesomeIcon icon={faMusic} title={translate('nav.music')} />
        <span className={styles.menuItemText}>{translate('nav.music')}</span>
      </MenuItem>
      <MenuItem href="stations/genres/news">
        <FontAwesomeIcon icon={faNewspaper} title={translate('nav.news')} />
        <span className={styles.menuItemText}>{translate('nav.news')}</span>
      </MenuItem>
      <MenuItem href="stations/genres/sports">
        <FontAwesomeIcon icon={faTableTennis} title={translate('nav.sports')} />
        <span className={styles.menuItemText}>{translate('nav.sports')}</span>
      </MenuItem>
      <MenuItem href="stations/countries">
        <FontAwesomeIcon icon={faGlobeAmericas} title={translate('nav.countries')} />
        <span className={styles.menuItemText}>{translate('nav.countries')}</span>
      </MenuItem>
    </Menu>
  );
}
