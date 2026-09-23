"use client";

import { useEffect, useState } from "react";
import Faded from "@/components/Faded";

import {
  getSketchUsers,
  addSketchUser,
  getSketchRooms,
  addSketchRoom,
  getSketchChats,
  addSketchChat,
} from "@/firestore/sketchGame";

export default function SketchPage() {
  const [name, setName] = useState("");
  const [idx, setIdx] = useState(0);
  const [room, setRoom] = useState("");
  const [list, setList] = useState([]);
  const [roomnum, setRoomnum] = useState(0);
  const [chatList, setChatList] = useState([]);
  const [chat, setChat] = useState("");
  const [join, setJoin] = useState(0);

  useEffect(() => {
    renderList();
  }, []);

  async function submitName(username) {
    let cnt = 1;
    let isDup = false;
    const users = await getSketchUsers();
    users.forEach((data) => {
      if (data.name === username) {
        isDup = true;
      }
      cnt++;
    });
    if (name !== "" && name.length < 10 && !isDup) {
      await addSketchUser(username, cnt);
    }
    setIdx(1);
  }

  const onChangeName = (event) => setName(event.target.value);
  const onChangeRoom = (event) => setRoom(event.target.value);
  const onChangeChat = (event) => setChat(event.target.value);

  async function createRoom(c_room, c_name) {
    const rooms = await getSketchRooms();
    const cnt = rooms.length + 1;
    if (c_room !== "" && c_room.length < 20) {
      await addSketchRoom(cnt, c_room, c_name);
    }
    renderList();
    setRoomnum(cnt);
  }
  async function renderList() {
    const rooms = await getSketchRooms();
    setList(rooms);
  }
  async function renderChat() {
    const chats = await getSketchChats();
    const newList = chats
      .filter((data) => data.chatroom === roomnum)
      .map((data) => ({ num: data.num, chatname: data.chatname, text: data.text }));
    setChatList(newList);
    setJoin(1);
  }
  async function sendChat(s_room, s_name, s_text) {
    const chats = await getSketchChats();
    const cnt = chats.length + 1;
    if (s_text !== "" && s_text.length < 20) {
      await addSketchChat({ num: cnt, chatname: s_name, text: s_text, chatroom: s_room });
      setChat("");
      renderChat();
    }
  }

  if (roomnum !== 0) {
    if (join === 0) renderChat();
    return (
      <Faded>
        <div className="mx-auto max-w-2xl px-6 pt-16 pb-24">
          <div className="mb-6 font-mono text-sm text-[#8B84FF]">{roomnum}번 방입니다</div>

          <div className="mb-4 flex h-48 items-center justify-center rounded-xl border border-dashed border-white/15 font-mono text-sm text-white/30">
            🎨 그림판 (준비중)
          </div>

          <div className="mb-4 flex h-56 flex-col gap-1 overflow-y-auto rounded-xl border border-white/10 bg-[#1C1E24] p-4">
            <div className="mb-2 font-['Nanum_Gothic',sans-serif] text-sm text-white/40">
              안녕하세요
            </div>
            {chatList.map((item, i) => (
              <div key={i} className="font-['Nanum_Gothic',sans-serif] text-sm text-white/80">
                <span className="text-[#8B84FF]">{item.chatname}</span>: {item.text}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              onChange={onChangeChat}
              type="text"
              value={chat}
              className="flex-1 rounded-full border border-white/10 bg-[#1C1E24] px-4 py-2 text-white placeholder:text-white/30 focus:border-[#6C63FF]/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => sendChat(roomnum, name, chat)}
              className="cursor-pointer rounded-full bg-[#6C63FF] px-5 py-2 font-mono text-sm text-white transition-colors hover:bg-[#5b52f0]"
            >
              입력
            </button>
          </div>
        </div>
      </Faded>
    );
  } else if (idx === 0) {
    return (
      <Faded>
        <div className="mx-auto flex max-w-sm flex-col items-center gap-4 px-6 pt-24 pb-24 text-center">
          <div className="font-mono text-sm text-[#8B84FF]">닉네임을 입력해주세요</div>
          <div className="flex w-full gap-2">
            <input
              onChange={onChangeName}
              className="flex-1 rounded-full border border-white/10 bg-[#1C1E24] px-4 py-2 text-center text-white placeholder:text-white/30 focus:border-[#6C63FF]/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => submitName(name)}
              className="cursor-pointer rounded-full bg-[#6C63FF] px-5 py-2 font-mono text-sm text-white transition-colors hover:bg-[#5b52f0]"
            >
              입력
            </button>
          </div>
        </div>
      </Faded>
    );
  } else {
    return (
      <Faded>
        <div className="mx-auto max-w-2xl px-6 pt-16 pb-24">
          <div className="mb-8 font-mono text-sm text-[#8B84FF]">스케치 방 목록</div>

          <div className="mb-8 flex flex-col gap-1 rounded-xl border border-white/10 bg-[#1C1E24] p-2">
            <div className="grid grid-cols-[3rem_1fr_6rem] gap-2 px-3 py-2 font-mono text-xs text-white/40">
              <span>번호</span>
              <span>방 제목</span>
              <span>방장</span>
            </div>
            {list.length === 0 ? (
              <p className="px-3 py-6 text-center font-['Nanum_Gothic',sans-serif] text-sm text-white/30">
                아직 방이 없습니다. 새로 만들어보세요!
              </p>
            ) : (
              list.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRoomnum(item.num)}
                  className="grid cursor-pointer grid-cols-[3rem_1fr_6rem] gap-2 rounded-lg px-3 py-2 text-left font-['Nanum_Gothic',sans-serif] text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <span className="font-mono text-white/40">{item.num}</span>
                  <span className="truncate">{item.roomname}</span>
                  <span className="truncate text-white/40">{item.name}</span>
                </button>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              onChange={onChangeRoom}
              type="text"
              placeholder="방 제목"
              className="flex-1 rounded-full border border-white/10 bg-[#1C1E24] px-4 py-2 text-white placeholder:text-white/30 focus:border-[#6C63FF]/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => createRoom(room, name)}
              className="cursor-pointer rounded-full bg-[#6C63FF] px-5 py-2 font-mono text-sm whitespace-nowrap text-white transition-colors hover:bg-[#5b52f0]"
            >
              방 생성
            </button>
          </div>
        </div>
      </Faded>
    );
  }
}
