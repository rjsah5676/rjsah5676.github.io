import { collection, addDoc, getDocs, orderBy, limit, query } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "score";

export async function getTopMelonScores(count = 10) {
  const q = query(collection(db, COLLECTION), orderBy("score", "desc"), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data());
}

export async function addMelonScore(name, score) {
  await addDoc(collection(db, COLLECTION), { name, score });
}
