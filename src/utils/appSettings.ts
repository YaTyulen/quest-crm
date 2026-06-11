import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'appSettings';
const DOC_ID = 'notifications';

export interface NotificationSettings {
  scheduleChangeAdminUid: string | null;
}

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
  if (!snap.exists()) {
    return { scheduleChangeAdminUid: null };
  }

  const data = snap.data();
  return {
    scheduleChangeAdminUid: (data.scheduleChangeAdminUid as string) || null,
  };
};

export const updateScheduleChangeAdminUid = async (uid: string | null): Promise<void> => {
  await setDoc(
    doc(db, COLLECTION, DOC_ID),
    { scheduleChangeAdminUid: uid || null },
    { merge: true }
  );
};
