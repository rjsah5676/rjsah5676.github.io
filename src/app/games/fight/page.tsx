"use client";

import { useState } from "react";
import Faded from "@/components/Faded";
import GameHeader from "@/components/GameHeader";
import FightGame from "@/components/Fight/FightGame";
import { FIGHT_GUIDE } from "@/data/gameGuides";
import { RankBoard, useAIRankTop } from "@/components/AIRank";
import { AI_LEVELS } from "@/lib/fight/ai";
import { pointsOf } from "@/lib/aiScore";

const oppLabel = (opp: string) => {
  const i = Number(opp) - 1;
  return AI_LEVELS[i] ? `AI ${i + 1}단계 ${AI_LEVELS[i].name}` : opp;
};

export default function FightPage() {
  const top = useAIRankTop("fight_ai_rankings");
  const [refresh, setRefresh] = useState(0);
  return (
    <Faded>
      <div className="mx-auto max-w-5xl px-3 pt-6 pb-24 sm:px-6">
        <GameHeader
          icon="🥊"
          title="픽셀 격투"
          en="Pixel Fighter"
          accent="#FF8A3D"
          desc="도트 캐릭터 1:1 대전, AI 또는 친구와 한 키보드로"
          guide={FIGHT_GUIDE}
          rank={{
            sub: "AI 대전",
            top: top.map((r) => ({
              name: r.name,
              value: pointsOf(r.score).toLocaleString(),
              sub: `vs ${oppLabel(r.opp)}`,
            })),
            render: () => (
              <RankBoard
                coll="fight_ai_rankings"
                oppLabel={oppLabel}
                bare
                skip={3}
                refresh={refresh}
              />
            ),
          }}
        />
        <FightGame onRanked={() => setRefresh((n) => n + 1)} />
      </div>
    </Faded>
  );
}
