import Faded from "@/components/Faded";
import RhythmGame from "@/components/Rhythm/RhythmGame";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "리듬게임",
  description:
    "4키(DFJK) 리듬게임. AI 자작곡 4곡 + 내 mp3를 넣으면 자동 채보로 플레이, 쉬움~매우 어려움 4단계, 롱노트, 노트 속도·싱크 조절, HP·롱노트 콤보, 모바일 터치 지원.",
  path: "/games/rhythm/",
});

export default function RhythmPage() {
  return (
    <Faded>
      <div className="mx-auto max-w-5xl px-4 pt-12 pb-24 sm:px-6">
        <div className="mb-6">
          <div className="font-mono text-sm text-[#8B84FF]">games</div>
          <h1 className="mt-1 font-mono text-2xl font-bold text-white">Rhythm</h1>
          <p className="mt-2 font-['Nanum_Gothic',sans-serif] text-sm text-white/45">
            DFJK 4키 리듬게임
          </p>
        </div>
        <RhythmGame />
      </div>
    </Faded>
  );
}
