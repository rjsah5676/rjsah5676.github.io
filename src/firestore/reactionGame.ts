import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  limit,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { toDate } from "@/lib/rankDate";

const COLLECTION = "reaction";

export interface ReactionScore {
  name: string;
  score: number;
  /** 달성 일자 (예전 기록은 없음) */
  createdAt: Date | null;
}

export async function getTopReactionScores(count = 10): Promise<ReactionScore[]> {
  const q = query(collection(db, COLLECTION), orderBy("score", "asc"), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const x = d.data();
    return { name: x.name, score: x.score, createdAt: toDate(x.createdAt) } as ReactionScore;
  });
}

export async function addReactionScore(name: string, score: number): Promise<void> {
  await addDoc(collection(db, COLLECTION), { name, score, createdAt: serverTimestamp() });
}
