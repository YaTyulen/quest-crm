import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ScheduleChangeRequest, ChangeRequestStatus } from '../types/scheduleChangeRequest';
import type { Role } from '../types/roles';

const COLLECTION = 'scheduleChangeRequests';

interface SubmitParams {
  userId: string;
  userName: string;
  userRole: Role;
  date: string;
  requestedAvailability: { [time: string]: boolean };
  currentAvailability: { [time: string]: boolean };
}

export async function submitChangeRequest(params: SubmitParams): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...params,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  await updateDoc(ref, { id: ref.id });
  return ref.id;
}

export async function getPendingRequests(): Promise<ScheduleChangeRequest[]> {
  const snap = await getDocs(collection(db, COLLECTION));

  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id } as ScheduleChangeRequest))
    .filter((request) => request.status === 'pending')
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
}

export async function getUserPendingRequestForDate(
  userId: string,
  date: string
): Promise<ScheduleChangeRequest | null> {
  const snap = await getDocs(collection(db, COLLECTION));

  const pendingRequest = snap.docs
    .map((d) => ({ ...d.data(), id: d.id } as ScheduleChangeRequest))
    .find(
      (request) =>
        request.userId === userId &&
        request.date === date &&
        request.status === 'pending'
    );

  return pendingRequest ?? null;
}

export async function getUserRequests(userId: string): Promise<ScheduleChangeRequest[]> {
  const snap = await getDocs(collection(db, COLLECTION));

  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id } as ScheduleChangeRequest))
    .filter((request) => request.userId === userId)
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
}

export async function resolveChangeRequest(
  requestId: string,
  resolution: Extract<ChangeRequestStatus, 'approved' | 'rejected'>,
  resolvedBy: string
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, requestId), {
    status: resolution,
    resolvedAt: serverTimestamp(),
    resolvedBy,
  });
}

export async function applyApprovedRequest(request: ScheduleChangeRequest): Promise<void> {
  await updateDoc(doc(db, 'schedules', request.userId), {
    [`availability.${request.date}`]: request.requestedAvailability,
    updatedAt: serverTimestamp(),
  });
}
