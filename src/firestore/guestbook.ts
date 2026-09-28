import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "guest";

export interface GuestEntry {
  id: number;
  name: string;
  contents: string;
  date: string;
}

export async function getGuestEntries(): Promise<GuestEntry[]> {
  const q = query(collection(db, COLLECTION), orderBy("id", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as GuestEntry);
}

export async function addGuestEntry({ name, contents, date }: Omit<GuestEntry, "id">): Promise<number> {
  const id = Date.now();
  await addDoc(collection(db, COLLECTION), { name, contents, id, date });
  return id;
}
