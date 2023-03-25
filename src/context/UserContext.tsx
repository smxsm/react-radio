import { createContext, PropsWithChildren, useEffect, useState } from 'react';
import useSupabase from '../hooks/useSupabase';

type UserContextType = {
  user: any;
  loading: boolean;
  error: Error | null;
  signup: (email: string, firstName: string, lastName: string, password: string) => void;
  signin: (email: string, password: string, saveSession: boolean) => void;
  signout: () => void;
};

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type UserProviderProps = PropsWithChildren & {};

export const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: UserProviderProps) {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('session') || 'null');
    if (!session) return;
    setLoading(true);
    supabase.auth
      .setSession(session)
      .then(() => supabase.auth.refreshSession())
      .then(() => supabase.from('profiles').select('*'))
      .then(({ data }) => {
        if (!data?.length) return;
        setUser({
          id: data[0].id,
          email: data[0].email,
          firstName: data[0]['first_name'],
          lastName: data[0]['last_name'],
        });
      })
      .finally(() => setLoading(false));
  }, [supabase]);

  const signup = (email: string, firstName: string, lastName: string, password: string) => {
    setError(null);
    setLoading(true);
    supabase.auth
      .signUp({ email, password })
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      })
      .then(({ user }) =>
        supabase.from('profiles').insert({
          id: user!.id,
          email,
          first_name: firstName,
          last_name: lastName,
        })
      )
      .then(({ error }) => {
        if (error) throw error;
      })
      .then(() => signin(email, password, true))
      .catch(setError)
      .finally(() => setLoading(false));
  };

  const signin = (email: string, password: string, saveSession: boolean) => {
    setError(null);
    setLoading(true);
    supabase.auth
      .signInWithPassword({ email, password })
      .then(({ data, error }) => {
        if (error) throw error;

        if (saveSession) {
          localStorage.setItem('session', JSON.stringify(data.session));
        }
        return supabase.from('profiles').select('*');
      })
      .then(({ data, error }) => {
        if (error || !data || !data.length) throw error || new Error('Error loading profile information');
        const { id, email, first_name: firstName, last_name: lastName } = data[0];
        setUser({ id, email, firstName, lastName });
      })
      .catch(setError)
      .finally(() => setLoading(false));
  };

  const signout = () => {
    setError(null);
    setLoading(true);
    supabase.auth
      .signOut()
      .then(({ error }) => {
        localStorage.removeItem('session');
        setUser(null);
        if (error) throw error;
      })
      .catch(setError)
      .finally(() => setLoading(false));
  };

  return (
    <UserContext.Provider value={{ user, loading, error, signup, signin, signout }}>{children}</UserContext.Provider>
  );
}
