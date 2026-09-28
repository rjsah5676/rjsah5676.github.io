import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export interface SketchUser {
  name: string;
  num: number;
}

export interface SketchRoom {
  num: number;
  roomname: string;
  name: string;
}

export interface SketchChat {
  num: number;
  chatname: string;
  text: string;
  chatroom: number;
}

export async function getSketchUsers(): Promise<SketchUser[]> {
  const snapshot = await getDocs(collection(db, "sketch_user"));
  return snapshot.docs.map((d) => d.data() as SketchUser);
}

export async function addSketchUser(name: string, num: number): Promise<void> {
  await addDoc(collection(db, "sketch_user"), { name, num });
}

export async function getSketchRooms(): Promise<SketchRoom[]> {
  const q = query(collection(db, "sketch_user_room"), orderBy("num", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as SketchRoom);
}

export async function addSketchRoom(num: number, roomname: string, name: string): Promise<void> {
  await addDoc(collection(db, "sketch_user_room"), { num, roomname, name });
}

export async function getSketchChats(): Promise<SketchChat[]> {
  const q = query(collection(db, "sketch_user_chat"), orderBy("num", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as SketchChat);
}

export async function addSketchChat({ num, chatname, text, chatroom }: SketchChat): Promise<void> {
  await addDoc(collection(db, "sketch_user_chat"), {
    num,
    chatname,
    text,
    chatroom,
    date: new Date(),
  });
}
