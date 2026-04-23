import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, getSecondaryAuth } from '../firebase';
import type { Role, UserProfile } from '../types/roles';

const COLLECTION = 'schedules';

const docToProfile = (data: Record<string, unknown>, uid: string): UserProfile => ({
  uid,
  email: (data.userEmail as string) ?? '',
  displayName: (data.userName as string) ?? '',
  role: (data.role as Role) ?? 'operator',
  vkId: (data.vkId as string) || undefined,
  createdAt: data.updatedAt as UserProfile['createdAt'],
});

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, COLLECTION, uid));
  if (!snap.exists()) return null;
  return docToProfile(snap.data(), uid);
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map(d => docToProfile(d.data(), d.id));
};

export const updateUserRole = async (uid: string, role: Role): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, uid), { role });
};

export const updateUserVkId = async (uid: string, vkId: string): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, uid), { vkId: vkId.trim() || null });
};

export const createUserWithRole = async (
  email: string,
  password: string,
  displayName: string,
  role: Role,
): Promise<void> => {
  const secondaryAuth = getSecondaryAuth();
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await setDoc(doc(db, COLLECTION, cred.user.uid), {
      userId: cred.user.uid,
      userEmail: email,
      userName: displayName,
      role,
      availability: {},
      isActive: true,
      updatedAt: serverTimestamp(),
    });
  } finally {
    await signOut(secondaryAuth);
  }
};
