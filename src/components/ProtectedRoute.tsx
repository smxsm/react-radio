import { PropsWithChildren, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

type ProtectedRouteProps = PropsWithChildren & {
  isLoggedIn?: boolean;
  redirect?: string;
};

export default function ProtectedRoute({ isLoggedIn = true, redirect = '/', children }: ProtectedRouteProps) {
  const { user, loading } = useContext(UserContext)!;
  if (loading) {
    return null;
  }

  if (!!user !== isLoggedIn) {
    return <Navigate to={redirect} />;
  }

  return <>{children}</>;
}
