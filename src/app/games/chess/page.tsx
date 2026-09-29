"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Faded from "@/components/Faded";
import ChessLobby from "@/components/Chess/ChessLobby";
import ChessRoomView from "@/components/Chess/ChessRoomView";
import { useChessUser } from "@/components/Chess/useChessUser";

// 정적 export라 동적 라우트 대신 ?room=ID 쿼리로 방을 구분
function ChessApp() {
  const router = useRouter();
  const params = useSearchParams();
  const roomId = params.get("room");
  const as = params.get("as");
  const intent = as === "play" || as === "watch" ? as : null;

  const { uid, nick, setNick, nickLoaded, error } = useChessUser();
  const [editingNick, setEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState("");

  const go = (id: string | null, a?: "play" | "watch") =>
    router.push(id ? `/games/chess/?room=${id}${a ? `&as=${a}` : ""}` : "/games/chess/");

  if (error) return <p className="pt-24 text-center font-mono text-sm text-red-400">{error}</p>;
  if (!uid || !nickLoaded)
    return <p className="pt-24 text-center font-mono text-sm text-white/40">접속 중…</p>;

  if (!nick || editingNick) {
    const submit = () => {
      if (!nickInput.trim()) return;
      setNick(nickInput);
      setEditingNick(false);
    };
    return (
      <Faded>
        <div className="mx-auto flex max-w-sm flex-col items-center gap-4 px-6 pt-24 pb-24 text-center">
          <div className="font-mono text-sm text-[#8B84FF]">♞ 닉네임을 입력해주세요</div>
          <div className="flex w-full gap-2">
            <input
              autoFocus
              maxLength={10}
              defaultValue={nick}
              onChange={(e) => setNickInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#1C1E24] px-4 py-2 text-center text-white placeholder:text-white/30 focus:border-[#6C63FF]/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={submit}
              className="cursor-pointer rounded-full bg-[#6C63FF] px-5 py-2 font-mono text-sm text-white transition-colors hover:bg-[#5b52f0]"
            >
              입력
            </button>
          </div>
        </div>
      </Faded>
    );
  }

  if (roomId) {
    return (
      <ChessRoomView
        key={roomId}
        roomId={roomId}
        uid={uid}
        nick={nick}
        intent={intent}
        onExit={() => go(null)}
      />
    );
  }
  return (
    <Faded>
      <ChessLobby
        uid={uid}
        nick={nick}
        onChangeNick={() => {
          setNickInput(nick);
          setEditingNick(true);
        }}
        onEnter={go}
      />
    </Faded>
  );
}

export default function ChessPage() {
  return (
    <Suspense fallback={null}>
      <ChessApp />
    </Suspense>
  );
}
