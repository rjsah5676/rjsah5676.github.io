import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export async function getSketchUsers() {
  const snapshot = await getDocs(collection(db, "sketch_user"));
  return snapshot.docs.map((d) => d.data());
}

export async function addSketchUser(name, num) {
  await addDoc(collection(db, "sketch_user"), { name, num });
}

export async function getSketchRooms() {
  const q = query(collection(db, "sketch_user_room"), orderBy("num", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data());
}

export async function addSketchRoom(num, roomname, name) {
  await addDoc(collection(db, "sketch_user_room"), { num, roomname, name });
}

export async function getSketchChats() {
  const q = query(collection(db, "sketch_user_chat"), orderBy("num", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data());
}

export async function addSketchChat({ num, chatname, text, chatroom }) {
  await addDoc(collection(db, "sketch_user_chat"), {
    num,
    chatname,
    text,
    chatroom,
    date: new Date(),
  });
}
