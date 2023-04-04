import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import Spinner from './ui/Spinner';
import { Navigate, Outlet } from 'react-router-dom';

import styles from './ProtectedRoute.module.css';

type ProtectedRouteProps = {
  hasUser?: boolean;
  redirectTo?: string;
};

export default function ProtectedRoute({ hasUser = true, redirectTo = '/' }: ProtectedRouteProps) {
  const { user, loading } = useContext(UserContext) || {};

  if (loading) {
    return (
      <section className={styles.section}>
        <Spinner />
      </section>
    );
  }
  if (hasUser !== !!user) {
    return <Navigate to={redirectTo} />;
  }
  return <Outlet />;
}
