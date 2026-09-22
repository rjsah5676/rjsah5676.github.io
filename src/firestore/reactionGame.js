import { collection, addDoc, getDocs, orderBy, limit, query } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "reaction";

export async function getTopReactionScores(count = 10) {
  const q = query(collection(db, COLLECTION), orderBy("score", "asc"), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data());
}

export async function addReactionScore(name, score) {
  await addDoc(collection(db, COLLECTION), { name, score });
}
