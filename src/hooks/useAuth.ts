import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, performLogout, getAccessToken } from '../firebase/auth';
import { db } from '../firebase/config'; // ensuring initialize is called
import { doc, getDocFromServer } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic test
    getDocFromServer(doc(db, 'test', 'connection')).catch(() => {
      console.log('Firebase offline check completed.');
    });

    const unsubscribe = initAuth(
      (u, t) => {
        setUser(u);
        setToken(t);
        setLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const login = async () => {
    const res = await googleSignIn();
    if (res) {
      setUser(res.user);
      setToken(res.accessToken);
    }
  };

  const logout = async () => {
    await performLogout();
    setUser(null);
    setToken(null);
  };

  return { user, token, loading, login, logout };
}
