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

export async function getStudyPostsByCategory(category) {
  const q = query(collection(db, COLLECTION), where("category", "==", category));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, title: d.data().title }));
}

export async function getStudyPost(id) {
  const snapshot = await getDoc(doc(db, COLLECTION, id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function addStudyPost({ title, content, category, date }) {
  const ref = await addDoc(collection(db, COLLECTION), { title, content, category, date });
  return ref.id;
}

export async function updateStudyPost(id, { title, content, category, date }) {
  await updateDoc(doc(db, COLLECTION, id), { title, content, category, date });
}

export async function deleteStudyPost(id) {
  await deleteDoc(doc(db, COLLECTION, String(id)));
}
