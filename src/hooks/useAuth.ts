// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import {  
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  type User
} from 'firebase/auth';
import { auth, db } from '../firebase';
import type { Roles } from '../types/roles';
import { collection, getDocs } from 'firebase/firestore';

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

  const getRoles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'roles'));
      const roles = querySnapshot.docs.map((doc) => ({
        role: doc.id,
        ...doc.data(),
      })) as Roles[];

      return roles;
      
    } catch (error) {
      console.error('Ошибка при загрузке ролей:', error);
    }
  }
  

  return { user, loading, signOut, getRoles };
};