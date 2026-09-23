"use client";

import { useEffect, useState } from "react";
import Faded from "@/components/Faded";
import "@/css/Page/sketch.css";

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

  useEffect(() => {
    if (document.getElementById("room-chat") !== null) {
      document.getElementById("room-chat").innerHTML = "";
      chatList.map((item) => {
        document.getElementById("room-chat").innerHTML +=
          "<div>" + item.chatname + ": " + item.text + "</div>";
      });
    }
  }, [chatList]);

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
  function makeBox() {
    return list.map((item, i) => (
      <ul key={i}>
        <li>{item.num}</li>
        <li
          style={{ cursor: "pointer" }}
          onClick={() => {
            setRoomnum(item.num);
          }}
        >
          {item.roomname}
        </li>
        <li>{item.name}</li>
      </ul>
    ));
  }

  if (roomnum !== 0) {
    if (join === 0) renderChat();
    return (
      <Faded>
        <div style={{ color: "white" }}>{roomnum}번 방입니다.</div>
        <div className="room-container">
          <div className="room-canvas"></div>
          <div className="room-chat-box">
            <ul id="room-chat">
              <li>안녕하세요</li>
            </ul>
            <div>
              <input id="chat-input" onChange={onChangeChat} type="text" value={chat} />
              <button
                onClick={() => {
                  sendChat(roomnum, name, chat);
                }}
              >
                입력
              </button>
            </div>
          </div>
        </div>
      </Faded>
    );
  } else if (idx === 0) {
    return (
      <Faded>
        <div className="reaction-submit-box">
          <input onChange={onChangeName} className="reaction-submit-input"></input>
          <div
            onClick={() => {
              submitName(name);
            }}
            className="reaction-submit-button"
          >
            입력
          </div>
        </div>
      </Faded>
    );
  } else {
    return (
      <Faded>
        <div className="sketch-box">
          <ul>
            <li>방 번호</li>
            <li>방 제목</li>
            <li>방장 이름</li>
          </ul>
          {makeBox()}
          <button
            onClick={() => {
              createRoom(room, name);
            }}
          >
            방 생성
          </button>
          <input onChange={onChangeRoom} type="text"></input>
        </div>
      </Faded>
    );
  }
}
