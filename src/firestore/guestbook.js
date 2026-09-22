import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "guest";

export async function getGuestEntries() {
  const q = query(collection(db, COLLECTION), orderBy("id", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

export async function addGuestEntry({ name, contents, date }) {
  const id = Date.now();
  await addDoc(collection(db, COLLECTION), { name, contents, id, date });
  return id;
}
