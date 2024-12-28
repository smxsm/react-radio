import { useContext, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faRightFromBracket, faRightToBracket, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import ReactCountryFlag from 'react-country-flag';
import { useTranslation } from 'react-i18next';

import { UserContext } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';

import Menu from './ui/Menu';
import MenuItem from './ui/MenuItem';
import Spinner from './ui/Spinner';

import styles from './UserMenu.module.css';

type UserMenuProps = {
  className?: string;
};

export default function UserMenu({ className }: UserMenuProps) {
  const { user, loading, signout } = useContext(UserContext)!;
  const { t } = useTranslation();
  const translate = t as (key: string) => string;
  const { currentLanguage, languages, changeLanguage } = useLanguage();
  const [showLanguages, setShowLanguages] = useState(false);

  const signOutClickHandler = () => signout();
  
  const toggleLanguageMenu = () => setShowLanguages(!showLanguages);
  
  const handleLanguageChange = (code: string) => {
    changeLanguage(code);
    setShowLanguages(false);
  };

  const renderLanguageMenu = () => {
    if (!showLanguages) return null;
    return (
      <div className={styles.languageDropdown}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={styles.languageOption}
            onClick={() => handleLanguageChange(lang.code)}
          >
            <ReactCountryFlag
              countryCode={lang.flag}
              svg
              className={styles.flag}
            />
            <span>{lang.name}</span>
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return <Spinner className={`${styles['user-menu']} ${styles.spinner}`} />;
  }
  if (user) {
    return (
      <div className={styles.menuContainer}>
        <Menu className={`${styles.userMenu} ${className ? className : ''}`.trim()}>
          <MenuItem href="/stations/custom">
            <FontAwesomeIcon icon={faFolder} title={translate('user.mystations')} />
            <span className={styles.menuItemText}>{translate('user.mystations')}</span>
          </MenuItem>
          <MenuItem href="" className={styles['signout-item']} onClick={signOutClickHandler} markActive={false}>
            <FontAwesomeIcon icon={faRightFromBracket} title={translate('user.signout')} />
            <span className={styles.menuItemText}>{translate('user.signout')}</span>
          </MenuItem>
          <MenuItem className={styles.languageMenuItem} onClick={toggleLanguageMenu} markActive={false}>
            <ReactCountryFlag
              countryCode={currentLanguage.flag}
              svg
              className={styles.currentFlag}
            />
          </MenuItem>
        </Menu>
        {renderLanguageMenu()}
      </div>
    );
  }
  return (
    <div className={styles.menuContainer}>
      <Menu className={`${styles.userMenu} ${className ? className : ''}`.trim()}>
        <MenuItem href="/auth/signin">
          <FontAwesomeIcon icon={faRightToBracket} title={translate('user.signin')} />
          <span className={styles.menuItemText}>{translate('user.signin')}</span>
        </MenuItem>
        <MenuItem href="/auth/signup">
          <FontAwesomeIcon icon={faUserPlus} title={translate('user.signup')} />
          <span className={styles.menuItemText}>{translate('user.signup')}</span>
        </MenuItem>
        <MenuItem className={styles.languageMenuItem} onClick={toggleLanguageMenu} markActive={false}>
          <ReactCountryFlag
            countryCode={currentLanguage.flag}
            svg
            className={styles.currentFlag}
          />
        </MenuItem>
      </Menu>
      {renderLanguageMenu()}
    </div>
  );
}
