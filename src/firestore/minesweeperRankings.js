import { collection, addDoc, getDocs, orderBy, limit, query } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "minesweeper_rankings";

export async function getTopRankings(count = 10) {
  const q = query(collection(db, COLLECTION), orderBy("time", "asc"), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data());
}

export async function addRanking(name, time) {
  await addDoc(collection(db, COLLECTION), { name, time });
}
