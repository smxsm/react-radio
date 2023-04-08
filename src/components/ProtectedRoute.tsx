import { useContext, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { UserContext } from '../context/UserContext';

import Spinner from './ui/Spinner';

import styles from './ProtectedRoute.module.css';

type ProtectedRouteProps = {
  hasUser?: boolean;
  redirectTo?: string;
};

export default function ProtectedRoute({ hasUser = true, redirectTo = '/' }: ProtectedRouteProps) {
  const { user, loading } = useContext(UserContext) || {};
  const [initialized, setInitialized] = useState(false);

  if (loading && !initialized) {
    return (
      <section className={styles.section}>
        <Spinner />
      </section>
    );
  }

  if (!initialized) {
    setInitialized(true);
  }
  if (hasUser !== !!user) {
    return <Navigate to={redirectTo} />;
  }
  return <Outlet />;
}
