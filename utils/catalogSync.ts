import { getData, saveData, DB_KEYS } from './database';
import { hasNativeFirebase } from './nativeFirebase';

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/**
 * Pulls `products` from Firestore and merges into local `ADMIN_PRODUCTS` by `id`.
 * Safe no-op if Firebase is unavailable or collection is empty.
 */
export async function mergeFirestoreProductsIntoLocal(): Promise<void> {
  if (!hasNativeFirebase()) return;
  try {
    const { productsCollection } = await import('./firebase');
    const snap = await productsCollection().get();
    if (snap.empty) return;

    const remote = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return { id: d.id, ...data };
    });

    const local = ((await getData(DB_KEYS.ADMIN_PRODUCTS)) as Record<string, unknown>[]) || [];
    const byId = new Map<string, Record<string, unknown>>();
    for (const row of local) {
      if (row?.id != null) byId.set(String(row.id), row);
    }
    for (const row of remote) {
      byId.set(String(row.id), row);
    }
    await saveData(DB_KEYS.ADMIN_PRODUCTS, Array.from(byId.values()));
  } catch {
    // Offline or rules deny — keep AsyncStorage catalog.
  }
}

/**
 * Same pattern for vendors if you mirror them to `admin_vendors` for the admin UI.
 */
/**
 * Writes local `ADMIN_PRODUCTS` to Firestore (admin-only per rules). Uses batches of 400.
 */
export async function pushLocalProductsToFirestore(): Promise<void> {
  if (!hasNativeFirebase()) return;
  try {
    const { firestore, productsCollection } = await import('./firebase');
    const list = ((await getData(DB_KEYS.ADMIN_PRODUCTS)) as Record<string, unknown>[]) || [];
    const db = firestore();
    for (const group of chunk(list, 400)) {
      const batch = db.batch();
      for (const p of group) {
        if (p?.id == null) continue;
        const id = String(p.id);
        const ref = productsCollection().doc(id);
        const { id: _omit, ...rest } = p;
        batch.set(ref, { ...rest }, { merge: true });
      }
      await batch.commit();
    }
  } catch {
    // Rules / offline
  }
}

export async function mergeFirestoreVendorsIntoLocal(): Promise<void> {
  if (!hasNativeFirebase()) return;
  try {
    const { vendorsCollection } = await import('./firebase');
    const snap = await vendorsCollection().get();
    if (snap.empty) return;

    const remote = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }));
    const local = ((await getData(DB_KEYS.admin_vendors)) as Record<string, unknown>[]) || [];
    const byId = new Map<string, Record<string, unknown>>();
    for (const row of local) {
      if (row?.id != null) byId.set(String(row.id), row);
    }
    for (const row of remote) {
      byId.set(String(row.id), row as Record<string, unknown>);
    }
    await saveData(DB_KEYS.admin_vendors, Array.from(byId.values()));
  } catch {
    // ignore
  }
}
