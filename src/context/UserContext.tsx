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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [persistSession, setPersistSession] = useState(true);

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session) {
        setUser(null);
        setLoading(false);
        localStorage.removeItem('session');
        return;
      }
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*');
      if (error || !data.length) {
        setLoading(false);
        return;
      }
      if (persistSession) {
        localStorage.setItem('session', JSON.stringify(session));
      }
      const [{ id, email, first_name: firstName, last_name: lastName }] = data;
      setUser({ id, email, firstName, lastName });
      setLoading(false);
      setError(null);
    });

    const session = JSON.parse(localStorage.getItem('session') || 'null');
    if (!session) return setLoading(false);
    setLoading(true);
    supabase.auth.setSession(session).then(({ error }) => {
      if (error) {
        localStorage.removeItem('session');
        setLoading(false);
      }
    });
  }, [supabase, persistSession]);

  const signup = async (email: string, firstName: string, lastName: string, password: string) => {
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(new Error(signUpError.message));
      setLoading(false);
      return;
    }
    const { error: createProfileError } = await supabase.from('profiles').insert({
      id: data.user!.id,
      email,
      first_name: firstName,
      last_name: lastName,
    });
    if (createProfileError) {
      setError(new Error(createProfileError.message));
      setLoading(false);
      return;
    }
    signin(email, password, true);
  };

  const signin = async (email: string, password: string, persistSession: boolean = true) => {
    setError(null);
    setLoading(true);
    setPersistSession(persistSession);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError(new Error(error.message));
      return;
    }
  };

  const signout = () => {
    setError(null);
    setLoading(true);
    supabase.auth.signOut();
  };

  return (
    <UserContext.Provider value={{ user, loading, error, signup, signin, signout }}>{children}</UserContext.Provider>
  );
}
