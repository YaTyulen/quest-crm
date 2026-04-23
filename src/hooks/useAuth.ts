import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile } from '../utils/userUtils';
import type { Role } from '../types/roles';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const getUserRole = async (uid: string): Promise<Role | null> => {
    try {
      const profile = await getUserProfile(uid);
      return profile?.role ?? null;
    } catch (error) {
      console.error('Ошибка при загрузке роли:', error);
      return null;
    }
  };

  return { user, loading, signOut, getUserRole };
};
