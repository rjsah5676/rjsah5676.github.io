import { collection, addDoc, getDocs, orderBy, limit, query } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "reaction";

export interface ReactionScore {
  name: string;
  score: number;
}

export async function getTopReactionScores(count = 10): Promise<ReactionScore[]> {
  const q = query(collection(db, COLLECTION), orderBy("score", "asc"), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as ReactionScore);
}

export async function addReactionScore(name: string, score: number): Promise<void> {
  await addDoc(collection(db, COLLECTION), { name, score });
}
