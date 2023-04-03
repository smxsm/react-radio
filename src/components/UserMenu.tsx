import { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faRightFromBracket, faRightToBracket, faUserPlus } from '@fortawesome/free-solid-svg-icons';

import { UserContext } from '../context/UserContext';

import Menu from './ui/Menu';
import MenuItem from './ui/MenuItem';
import Spinner from './ui/Spinner';

import styles from './UserMenu.module.css';

type UserMenuProps = {
  className?: string;
};

export default function UserMenu({ className }: UserMenuProps) {
  const { user, loading, signout } = useContext(UserContext)!;

  const signOutClickHandler = () => signout();

  if (loading) {
    return <Spinner className={`${styles['user-menu']} ${styles.spinner}`} />;
  }
  if (user) {
    return (
      <Menu className={`${styles.userMenu} ${className ? className : ''}`.trim()}>
        <MenuItem href="/stations/custom">
          <FontAwesomeIcon icon={faFolder} />
          My Stations
        </MenuItem>
        <div className={styles['signout-item']} onClick={signOutClickHandler}>
          <FontAwesomeIcon icon={faRightFromBracket} />
        </div>
      </Menu>
    );
  }
  return (
    <Menu className={`${styles.userMenu} ${className ? className : ''}`.trim()}>
      <MenuItem href="/auth/signin">
        <FontAwesomeIcon icon={faRightToBracket} />
        Sign In
      </MenuItem>
      <MenuItem href="/auth/signup">
        <FontAwesomeIcon icon={faUserPlus} />
        Create acount
      </MenuItem>
    </Menu>
  );
}
