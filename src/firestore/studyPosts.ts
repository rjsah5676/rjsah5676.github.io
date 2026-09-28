import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "studyPosts";

export interface StudyPostInput {
  title: string;
  content: string;
  category: string;
  date: string;
}

export interface StudyPost extends StudyPostInput {
  id: string;
}

export interface StudyPostSummary {
  id: string;
  title: string;
}

export async function getStudyPostsByCategory(category: string): Promise<StudyPostSummary[]> {
  const q = query(collection(db, COLLECTION), where("category", "==", category));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, title: d.data().title }));
}

export async function getStudyPost(id: string): Promise<StudyPost | null> {
  const snapshot = await getDoc(doc(db, COLLECTION, id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as StudyPost) : null;
}

export async function addStudyPost({ title, content, category, date }: StudyPostInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), { title, content, category, date });
  return ref.id;
}

export async function updateStudyPost(
  id: string,
  { title, content, category, date }: StudyPostInput
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { title, content, category, date });
}

export async function deleteStudyPost(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
