import { hasNativeFirebase } from './nativeFirebase';

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  joinedDate: string;
  reviewCount: number;
};

/** Loads registered users from Firestore `users` collection (no demo seed data). */
export async function loadUsersFromFirestore(): Promise<AdminUserRow[]> {
  if (!hasNativeFirebase()) {
    return [];
  }
  try {
    const { usersCollection } = await import('./firebase');
    const snap = await usersCollection().get();
    return snap.docs.map((doc) => {
      const d = doc.data() as Record<string, unknown>;
      const created = d.createdAt as { toDate?: () => Date } | Date | undefined;
      let joinedDate = '—';
      if (created && typeof (created as { toDate?: () => Date }).toDate === 'function') {
        joinedDate = (created as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
      } else if (created instanceof Date) {
        joinedDate = created.toISOString().slice(0, 10);
      }
      return {
        id: doc.id,
        name: String(d.name ?? d.email ?? 'User'),
        email: String(d.email ?? ''),
        status: String(d.status ?? 'active'),
        joinedDate,
        reviewCount: typeof d.reviewCount === 'number' ? d.reviewCount : 0,
      };
    });
  } catch (e) {
    console.warn('loadUsersFromFirestore', e);
    return [];
  }
}
