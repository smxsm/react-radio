import { faRightFromBracket, faRightToBracket, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { Menu } from './ui/Menu';
import MenuItem from './ui/MenuItem';
import Spinner from './ui/Spinner';
import styles from './UserMenu.module.css';

export default function UserMenu() {
  const { user, loading, signout } = useContext(UserContext)!;
  const navigate = useNavigate();

  const signOutClickHandler = () => {
    signout();
    // navigate('/');
  };

  if (loading) {
    return <Spinner className={`${styles['user-menu']} ${styles.spinner}`} />;
  }
  if (user) {
    return (
      <Menu className={styles['user-menu']}>
        <div className={styles['signout-item']} onClick={signOutClickHandler}>
          <FontAwesomeIcon icon={faRightFromBracket} />
          Sign Out
        </div>
      </Menu>
    );
  }
  return (
    <Menu className={styles['user-menu']}>
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
