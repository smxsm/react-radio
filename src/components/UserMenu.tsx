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
          <FontAwesomeIcon icon={faFolder} title="My Stations" />
          <span className={styles.menuItemText}>My Stations</span>
        </MenuItem>
        <MenuItem href="" className={styles['signout-item']} onClick={signOutClickHandler} markActive={false}>
          <FontAwesomeIcon icon={faRightFromBracket} title="Sign out" />
          <span className={styles.menuItemText}>Sign out</span>
        </MenuItem>
      </Menu>
    );
  }
  return (
    <Menu className={`${styles.userMenu} ${className ? className : ''}`.trim()}>
      <MenuItem href="/auth/signin">
        <FontAwesomeIcon icon={faRightToBracket} title="Sign in" />
        <span className={styles.menuItemText}>Sign in</span>
      </MenuItem>
      <MenuItem href="/auth/signup">
        <FontAwesomeIcon icon={faUserPlus} title="Create account" />
        <span className={styles.menuItemText}>Create acount</span>
      </MenuItem>
    </Menu>
  );
}
