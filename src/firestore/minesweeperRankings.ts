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

const COLLECTION = "minesweeper_rankings";

export interface MineRanking {
  name: string;
  time: number;
  /** 달성 일자 (예전 기록은 없음) */
  createdAt: Date | null;
}

export async function getTopRankings(count = 10): Promise<MineRanking[]> {
  const q = query(collection(db, COLLECTION), orderBy("time", "asc"), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const x = d.data();
    return { name: x.name, time: x.time, createdAt: toDate(x.createdAt) } as MineRanking;
  });
}

export async function addRanking(name: string, time: number): Promise<void> {
  await addDoc(collection(db, COLLECTION), { name, time, createdAt: serverTimestamp() });
}
