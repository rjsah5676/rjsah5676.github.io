"use client";

import { useState, useEffect, useRef } from "react";
import Faded from "@/components/Faded";
import { getGuestEntries, addGuestEntry } from "@/firestore/guestbook";

const today = new Date();

export default function GuestPage() {
  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [contents, setContents] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    (async () => {
      const entries = await getGuestEntries();
      setList(entries);
    })();
  }, []);

  const onChangeName = (event) => setName(event.target.value);
  const onChangeContents = (event) => setContents(event.target.value);

  function scrollToTop() {
    listRef.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  async function submitGuest() {
    if (name !== "" && contents !== "" && contents.length < 50) {
      const date = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일  ${today.getHours()}:${today.getMinutes()}`;
      await addGuestEntry({ name, contents, date });
      setName("");
      setContents("");
      const newList = await getGuestEntries();
      setList(newList);
      scrollToTop();
    }
  }

  return (
    <Faded>
      <div className="mx-auto max-w-2xl px-6 pt-16 pb-24">
        <div className="mb-8 flex items-center justify-between">
          <div className="font-mono text-sm text-[#8B84FF]">guest box</div>
          <button
            type="button"
            onClick={scrollToTop}
            className="cursor-pointer font-mono text-xs text-white/40 transition-colors hover:text-white"
          >
            ↑ top
          </button>
        </div>

        <div
          ref={listRef}
          className="mb-6 flex max-h-[420px] flex-col gap-4 overflow-y-auto rounded-xl border border-white/10 bg-[#1C1E24] p-5"
        >
          {list.length === 0 ? (
            <p className="py-8 text-center font-['Nanum_Gothic',sans-serif] text-sm text-white/30">
              아직 방명록이 없습니다. 첫 글을 남겨보세요!
            </p>
          ) : (
            list.map((item, i) => (
              <div key={i} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="font-mono text-sm font-medium text-white">{item.name}</span>
                  <span className="font-mono text-xs text-white/30">{item.date}</span>
                </div>
                <p className="font-['Nanum_Gothic',sans-serif] text-white/75">{item.contents}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#1C1E24] p-5">
          <input
            placeholder="이름"
            className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 font-['Nanum_Gothic',sans-serif] text-sm text-white placeholder:text-white/30 focus:border-[#6C63FF]/50 focus:outline-none"
            onChange={onChangeName}
            value={name}
          />
          <textarea
            placeholder="메시지를 남겨주세요 (50자 이내)"
            rows={3}
            className="w-full resize-none rounded-lg border border-white/10 bg-transparent px-3 py-2 font-['Nanum_Gothic',sans-serif] text-sm text-white placeholder:text-white/30 focus:border-[#6C63FF]/50 focus:outline-none"
            onChange={onChangeContents}
            value={contents}
          />
          <button
            type="button"
            onClick={submitGuest}
            className="cursor-pointer self-end rounded-full bg-[#6C63FF] px-5 py-2 font-mono text-sm text-white transition-colors hover:bg-[#5b52f0]"
          >
            등록
          </button>
        </div>
      </div>
    </Faded>
  );
}
