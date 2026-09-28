import { collection, addDoc, getDocs, orderBy, limit, query } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "score";

export interface MelonScore {
  name: string;
  score: number;
}

export async function getTopMelonScores(count = 10): Promise<MelonScore[]> {
  const q = query(collection(db, COLLECTION), orderBy("score", "desc"), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as MelonScore);
}

export async function addMelonScore(name: string, score: number): Promise<void> {
  await addDoc(collection(db, COLLECTION), { name, score });
}
