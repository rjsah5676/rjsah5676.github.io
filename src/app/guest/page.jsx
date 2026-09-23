"use client";

import { useState, useEffect } from "react";
import Faded from "@/components/Faded";
import { getGuestEntries, addGuestEntry } from "@/firestore/guestbook";
import "@/css/guestBox.css";

const today = new Date();

export default function GuestPage() {
  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [contents, setContents] = useState("");

  useEffect(() => {
    (async () => {
      const entries = await getGuestEntries();
      setList(entries);
    })();
  }, []);

  const onChangeName = (event) => setName(event.target.value);
  const onChangeContents = (event) => setContents(event.target.value);

  function goHomePage() {
    document
      .getElementsByClassName("guest-body")[0]
      .scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  async function submitGuest() {
    if (name !== "" && contents !== "" && contents.length < 50) {
      const date = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일  ${today.getHours()}:${today.getMinutes()}`;
      await addGuestEntry({ name, contents, date });
      setName("");
      setContents("");
      const newList = await getGuestEntries();
      setList(newList);
      document
        .getElementsByClassName("guest-body")[0]
        .scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }

  return (
    <Faded>
      <div className="guest-wrap">
        <div className="guest-body">
          <ol>
            {list.map((item, i) => (
              <li className="guest-chat-box" key={i}>
                <div className="container">
                  <div className="message-who">{item.name}</div>
                  <div className="message-container">
                    <div className="message-box">
                      <ul>
                        <li className="message-date">{item.date}</li>
                        <li className="message-text">{item.contents}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="guest-input-box">
          <div className="guest-nm">이름</div>
          <input className="guest-input-name" onChange={onChangeName} value={name}></input>
          <button className="guest-input-button" onClick={submitGuest}>
            등록
          </button>
          <input className="guest-input-info" onChange={onChangeContents} value={contents}></input>
        </div>
        <div className="guest-home-button" onClick={goHomePage}>
          □
        </div>
      </div>
    </Faded>
  );
}
