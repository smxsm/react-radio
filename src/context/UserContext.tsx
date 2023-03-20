import { createContext, PropsWithChildren, useEffect, useState } from 'react';
import useSupabase from '../hooks/useSupabase';

type UserContextType = {
  user: any;
  loading: boolean;
  error: Error | null;
  signup: (email: string, firstName: string, lastName: string, password: string) => Promise<void>;
  signin: (email: string, password: string, saveSession: boolean) => Promise<void>;
  signout: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth
      .setSession(JSON.parse(localStorage.getItem('session') || '{}'))
      .then(() => supabase.auth.refreshSession())
      .then(() => supabase.from('profiles').select('*'))
      .then(({ data }) => {
        if (!data) {
          return;
        }
        setUser({
          id: data[0].id,
          email: data[0].email,
          firstName: data[0]['first_name'],
          lastName: data[0]['last_name'],
        });
      })
      .finally(() => setLoading(false));
  }, [supabase]);

  const signup = async (email: string, firstName: string, lastName: string, password: string) => {
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
      .catch((error) => setError(error))
      .finally(() => setLoading(false));
  };

  const signin = async (email: string, password: string, saveSession: boolean) => {
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
        if (error) throw error;
        setUser({
          id: data![0].id,
          email: data![0].email,
          firstName: data![0]['first_name'],
          lastName: data![0]['last_name'],
        });
      })
      .catch((error) => setError(error))
      .finally(() => setLoading(false));
  };

  const signout = async () => {
    setLoading(true);
    supabase.auth
      .signOut()
      .then(({ error }) => {
        localStorage.removeItem('session');
        setUser(null);
        if (error) throw error;
      })
      .catch((error) => setError(error))
      .finally(() => setLoading(false));
  };

  return (
    <UserContext.Provider value={{ user, loading, error, signup, signin, signout }}>{children}</UserContext.Provider>
  );
}
