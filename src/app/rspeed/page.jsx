"use client";

import { useState, useEffect, useRef } from "react";
import Faded from "@/components/Faded";
import { getTopReactionScores, addReactionScore } from "@/firestore/reactionGame";

let ct = 0;

function RankBox({ list }) {
  return (
    <div className="mb-10 flex flex-col gap-1">
      {list.map((item, i) => (
        <div key={i} className="font-mono text-sm text-white/50">
          {i + 1}위: <span className="text-white/80">{item.name}</span> / {item.score}ms
        </div>
      ))}
    </div>
  );
}

export default function RspeedPage() {
  const NUM = 5;
  const [start, setStart] = useState(0);
  const [count, setCount] = useState(1);
  const [color, setColor] = useState(0); // 0 : red, 1 : blue
  const [startTime, setStartTime] = useState(0);
  const [rTime, setRTime] = useState(0);
  const [res, setRes] = useState([]);
  const [list, setList] = useState([]);
  const [, setRen] = useState(0);
  const [name, setName] = useState("");

  useEffect(() => {
    (async () => {
      const top = await getTopReactionScores(10);
      setList(top);
      ct = top.length;
      setRen(1);
    })();
  }, []);

  function clickStart() {
    setStart(1);
    changeColor(getRandom() * 10000);
  }
  const changeColor = (time) => {
    setTimeout(() => startTimer(), time);
  };
  const getRandom = () => Math.random() / 5 + 0.3;

  function startTimer() {
    setStartTime(new Date());
    setColor(1);
  }
  function clickRed() {
    window.alert("파란색일때 클릭바랍니다.");
    window.location.reload();
  }
  function clickBlue() {
    const x = new Date().getTime() - startTime.getTime();
    setRes([...res, x]);
    setRTime(x);
    setCount(count + 1);
    setColor(0);
    clickStart();
  }
  const onChangeName = (event) => setName(event.target.value);

  const submittedRef = useRef(false);
  async function submitScore(sc) {
    if (name !== "" && name.length < 20 && !submittedRef.current) {
      submittedRef.current = true;
      await addReactionScore(name, sc);
      window.location.reload();
    }
  }

  const avgScore = (res[0] + res[1] + res[2] + res[3] + res[4]) / 5;
  const isRanked = list.length < 10 || avgScore < list[ct - 1]?.score;

  if (start === 0) {
    return (
      <Faded>
        <div className="mx-auto max-w-md px-6 pt-16 pb-24 text-center">
          <div className="mb-8 font-mono text-sm text-[#8B84FF]">반응속도 테스트</div>
          <RankBox list={list} />
          <button
            type="button"
            onClick={clickStart}
            className="cursor-pointer rounded-full bg-[#6C63FF] px-8 py-3 font-mono text-white transition-colors hover:bg-[#5b52f0]"
          >
            시작
          </button>
        </div>
      </Faded>
    );
  } else if (count === 6) {
    return (
      <Faded>
        <div className="mx-auto max-w-md px-6 pt-16 pb-24 text-center">
          <div className="mb-8 font-mono text-sm text-[#8B84FF]">반응속도 테스트</div>
          <div className="mb-2 font-mono text-lg text-white/60">결과</div>
          <div className="mb-8 font-mono text-4xl font-bold text-white">{avgScore} ms</div>

          {isRanked ? (
            <div>
              <p className="mb-4 font-['Nanum_Gothic',sans-serif] text-white/70">
                {avgScore}점으로 10위안에 랭크되셨습니다. 이름을 입력해주세요.
              </p>
              <div className="flex justify-center gap-2">
                <input
                  onChange={onChangeName}
                  className="w-32 rounded-full border border-white/10 bg-[#1C1E24] px-4 py-2 text-center text-white focus:border-[#6C63FF]/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => submitScore(avgScore)}
                  className="cursor-pointer rounded-full bg-[#6C63FF] px-5 py-2 font-mono text-sm text-white transition-colors hover:bg-[#5b52f0]"
                >
                  제출
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="cursor-pointer rounded-full border border-white/10 px-6 py-2 font-mono text-sm text-white/70 transition-colors hover:text-white"
            >
              다시하기
            </button>
          )}
        </div>
      </Faded>
    );
  } else {
    return (
      <Faded>
        <div className="mx-auto max-w-md px-6 pt-16 pb-24 text-center">
          <div className="mb-8 font-mono text-sm text-[#8B84FF]">반응속도 테스트</div>
          <p className="mb-6 font-['Nanum_Gothic',sans-serif] text-white/60">
            버튼이 파란색이 되고 클릭하면 됩니다. 총 {NUM}번 실행됩니다.
          </p>
          <div className="mb-1 font-mono text-2xl text-white">{count} / {NUM}</div>
          <div className="mb-10 font-mono text-lg text-white/40">{rTime} ms</div>
          <button
            type="button"
            onClick={color === 0 ? clickRed : clickBlue}
            className={`aspect-square w-[min(60vw,260px)] cursor-pointer rounded-full transition-colors ${
              color === 0 ? "bg-red-500" : "bg-blue-500"
            }`}
          />
        </div>
      </Faded>
    );
  }
}
