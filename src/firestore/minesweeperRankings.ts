import { collection, addDoc, getDocs, orderBy, limit, query } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "minesweeper_rankings";

export interface MineRanking {
  name: string;
  time: number;
}

export async function getTopRankings(count = 10): Promise<MineRanking[]> {
  const q = query(collection(db, COLLECTION), orderBy("time", "asc"), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as MineRanking);
}

export async function addRanking(name: string, time: number): Promise<void> {
  await addDoc(collection(db, COLLECTION), { name, time });
}
