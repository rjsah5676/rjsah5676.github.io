import { B, K, type GuideDoc } from "@/components/GuideView";
import JanggiMoves from "@/components/guide/JanggiMoves";
import melonStart from "@/img/guide/melon-start.webp";
import melonDrag from "@/img/guide/melon-drag.webp";
import melonPop from "@/img/guide/melon-pop.webp";
import melonHud from "@/img/guide/melon-hud.webp";
import rhythmSelect from "@/img/guide/rhythm-select.webp";
import rhythmPlay from "@/img/guide/rhythm-play.webp";
import rhythmPause from "@/img/guide/rhythm-pause.webp";
import rhythmSettings from "@/img/guide/rhythm-settings.webp";
import chessSetup from "@/img/guide/chess-setup.webp";
import chessSelect from "@/img/guide/chess-select.webp";
import chessHint from "@/img/guide/chess-hint.webp";
import chessRanked from "@/img/guide/chess-ranked.webp";
import janggiSetup from "@/img/guide/janggi-setup.webp";
import janggiHint from "@/img/guide/janggi-hint.webp";
import mineStart from "@/img/guide/mine-start.webp";
import mineOpen from "@/img/guide/mine-open.webp";

/** 그림 대신: 큰 이모지 + 짧은 칩 몇 개 */
function Poster({ emoji, chips }: { emoji: string; chips?: string[] }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="text-6xl sm:text-7xl">{emoji}</div>
      {chips && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {chips.map((c) => (
            <span
              key={c}
              className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-xs text-white/80"
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** 리듬게임 판정표 */
function JudgeTable() {
  const rows: [string, string, string][] = [
    ["PERFECT", "±45ms", "#7DF9FF"],
    ["GREAT", "±90ms", "#4ADE80"],
    ["GOOD", "±130ms", "#FBBF24"],
    ["MISS", "그 밖", "#F87171"],
  ];
  return (
    <div className="flex w-full max-w-xs flex-col gap-1.5 font-mono">
      {rows.map(([j, w, c]) => (
        <div
          key={j}
          className="flex items-center justify-between rounded-lg bg-white/[0.04] px-4 py-2 text-sm"
        >
          <b style={{ color: c }}>{j}</b>
          <span className="text-white/70">{w}</span>
        </div>
      ))}
      <div className="mt-1 text-center text-[11px] text-white/45">
        S+ 97% · S 94% · A 90% · B 80% · C 70%
      </div>
    </div>
  );
}

/** 지뢰찾기: 숫자 위 동시 클릭 예시 */
function ChordDemo() {
  const cells = ["🚩", "", "", "", "2", "", "🚩", "", ""];
  return (
    <div className="flex items-center gap-4">
      <div className="grid grid-cols-3 gap-1">
        {cells.map((c, i) => (
          <div
            key={i}
            className={`flex h-12 w-12 items-center justify-center rounded-md text-lg font-bold ${
              i === 4 ? "bg-[#1C1E24] text-[#4ADE80]" : "bg-[#2B2E38]"
            }`}
          >
            {c}
          </div>
        ))}
      </div>
      <div className="text-3xl text-white/40">→</div>
      <div className="grid grid-cols-3 gap-1">
        {cells.map((c, i) => (
          <div
            key={i}
            className={`flex h-12 w-12 items-center justify-center rounded-md text-lg font-bold ${
              c === "🚩" ? "bg-[#2B2E38]" : "bg-[#1C1E24] text-[#60A5FA]"
            }`}
          >
            {c === "🚩" ? "🚩" : i === 4 ? <span className="text-[#4ADE80]">2</span> : "✓"}
          </div>
        ))}
      </div>
    </div>
  );
}

/*
 * 게임별 가이드 (헤더의 [게임 가이드] 모달).
 * 숫자(봇 수, 단계 수 등)는 바뀌기 쉬우니 웬만하면 적지 않고, 규칙·조작 위주로.
 */

export const MELON_GUIDE: GuideDoc = {
  slides: [
    {
      title: "멜론을 묶어 터뜨려요",
      image: melonStart,
      body: (
        <>
          판 가득 깔린 숫자 멜론을 네모로 묶어서 합이 <B>10</B> 또는 <B>20</B>이 되면 펑! 시작하기를
          누르면 바로 시작해요.
        </>
      ),
    },
    {
      title: "드래그로 네모 만들기",
      image: melonDrag,
      body: (
        <>
          누른 채로 끌면 네모가 잡혀요. 안에 든 숫자 합이 10이나 20일 때 손을 떼면 터져요. 틀려도
          감점은 없어요.
        </>
      ),
    },
    {
      title: "터뜨린 개수 = 점수",
      image: melonPop,
      body: (
        <>
          터진 자리는 빈칸이 돼요. 빈칸을 사이에 두고 멀리 떨어진 숫자끼리도 한 네모로 묶을 수
          있어요. 많이 묶을수록 이득!
        </>
      ),
    },
    {
      title: "2분 타임어택",
      image: melonHud,
      body: (
        <>
          시간 바가 다 줄면 끝. 10초 남으면 빨갛게 바뀌어요. 🔊로 볼륨 조절, 모바일은 <B>⛶ 크게</B>
          로 전체 화면.
        </>
      ),
    },
    {
      title: "고수 팁",
      visual: <Poster emoji="🍈" chips={["3~5개로 20 만들기", "큰 숫자 먼저", "가장자리부터"]} />,
      body: (
        <>
          바로 붙은 짝만 노리기보다 여러 개를 묶어 20을 만들면 점수가 쑥쑥. 짝이 귀한 7·8·9는 먼저
          처리하세요. 10위 안에 들면 이름을 남길 수 있어요.
        </>
      ),
    },
  ],
  lead: (
    <>
      판 가득 깔린 숫자 멜론을 네모로 묶어서, 합이 <B>10</B> 또는 <B>20</B>이 되면 펑! 시간 안에
      최대한 많이 터뜨리는 타임어택이에요.
    </>
  ),
  facts: ["⏱ 약 2분", "👤 혼자", "🖱 드래그", "🏆 TOP 10 랭킹"],
  sections: [
    {
      icon: "🎯",
      title: "규칙",
      items: [
        <>판 위를 드래그하면 네모 영역이 잡혀요. 영역 안 숫자의 합이 10이나 20이면 터져요.</>,
        <>터뜨린 멜론 개수가 그대로 점수예요. 많이 묶어 한 번에 터뜨릴수록 이득!</>,
        <>합이 안 맞으면 아무 일도 없어요. 감점은 없으니 마음껏 시도해도 돼요.</>,
        <>시간 바가 다 줄면 끝. 10초 남으면 빨갛게 바뀌어요.</>,
      ],
    },
    {
      icon: "💡",
      title: "고수 팁",
      items: [
        <>
          터진 자리는 빈칸이 돼요. 빈칸을 사이에 둔 멀리 떨어진 숫자끼리도 한 네모로 묶을 수 있어요.
        </>,
        <>
          1·9, 2·8처럼 바로 붙은 짝만 노리기보다, 3~5개를 묶어 <B>20</B>을 만들면 점수가 쑥쑥
          올라요.
        </>,
        <>큰 숫자(7·8·9)는 짝이 귀해요. 남기 전에 먼저 처리하는 게 좋아요.</>,
        <>판 가장자리부터 정리하면 가운데에서 큰 네모를 만들기 쉬워져요.</>,
      ],
    },
    {
      icon: "📱",
      title: "모바일",
      items: [
        <>세로 화면에서는 판이 돌아가서 크게 보여요.</>,
        <>
          <B>⛶ 크게</B>를 누르면 전체 화면으로 꽉 차게 할 수 있어요.
        </>,
      ],
    },
    {
      icon: "⚙️",
      title: "그 밖에",
      items: [
        <>🔊 버튼으로 배경음악·효과음 볼륨을 따로 조절해요.</>,
        <>
          플레이 중 <B>그만</B>을 누르면 바로 끝내요.
        </>,
        <>끝났을 때 10위 안이면 이름(1~9글자)을 남길 수 있어요.</>,
      ],
    },
  ],
  foot: "개발 lee gm · 디자인 tae hb · 음악 lee sh",
};

export const RHYTHM_GUIDE: GuideDoc = {
  slides: [
    {
      title: "곡과 난이도 고르기",
      image: rhythmSelect,
      body: (
        <>
          <K>←</K>
          <K>→</K> 곡, <K>↑</K>
          <K>↓</K> 난이도, <K>Enter</K> 시작. <B>내 음악으로 플레이</B>에서 mp3를 넣으면 자동으로
          채보를 만들어 줘요.
        </>
      ),
    },
    {
      title: "판정선에서 누르기",
      image: rhythmPlay,
      body: (
        <>
          노트가 아래 선에 닿는 순간 <K>D</K>
          <K>F</K>
          <K>J</K>
          <K>K</K>. 롱노트는 꼬리 끝까지 누르고 있어요. 모바일은 레인을 터치. <K>Esc</K> 일시정지.
        </>
      ),
    },
    {
      title: "판정과 랭크",
      visual: <JudgeTable />,
      body: (
        <>
          정확도는 PERFECT 100% · GREAT 70% · GOOD 40%. MISS가 나면 HP가 크게 깎이고, 바닥나면
          FAILED. 미스 없이 끝내면 FC, 전부 PERFECT면 AP!
        </>
      ),
    },
    {
      title: "싱크 맞추기",
      image: rhythmPause,
      body: (
        <>
          기기마다 소리가 늦게 나와요. 일시정지 화면에 이번 판 평균 타이밍이 나오고 버튼 하나로
          적용돼요. 처음엔 꼭 한 번 맞춰 주세요.
        </>
      ),
    },
    {
      title: "내 취향대로 설정",
      image: rhythmSettings,
      body: (
        <>
          노트 속도, 싱크, 볼륨, 타격음, 스킨. <B>레인 배치</B>(미러·랜덤)와 <B>노트 가림</B>
          (페이드·서든)은 실력 연습용이에요.
        </>
      ),
    },
  ],
  lead: (
    <>
      위에서 떨어지는 노트가 판정선에 닿는 순간 키를 누르는 4키 리듬게임이에요. 기본 곡 말고도 내
      mp3를 넣으면 자동으로 채보를 만들어 줘요.
    </>
  ),
  facts: ["⌨️ D F J K", "📱 터치 지원", "🎵 내 음악 OK", "🏆 곡·난이도별 랭킹"],
  sections: [
    {
      icon: "⌨️",
      title: "조작",
      items: [
        <>
          레인은 왼쪽부터 <K>D</K>
          <K>F</K>
          <K>J</K>
          <K>K</K>. 모바일은 레인을 직접 터치해요.
        </>,
        <>
          <B>롱노트</B>는 머리에서 누르고 꼬리 끝까지 떼지 마세요. 누르고 있는 동안 콤보가 올라가요.
        </>,
        <>
          곡 선택: <K>←</K>
          <K>→</K> 곡 바꾸기, <K>↑</K>
          <K>↓</K> 난이도, <K>Enter</K> 시작.
        </>,
        <>
          플레이 중: <K>Esc</K> 일시정지, <K>↑</K>
          <K>↓</K> 노트 속도.
        </>,
      ],
    },
    {
      icon: "🎯",
      title: "판정과 점수",
      items: [
        <>
          <B>PERFECT</B> ±45ms · <B>GREAT</B> ±90ms · <B>GOOD</B> ±130ms, 그보다 늦으면 MISS.
        </>,
        <>정확도는 PERFECT 100%, GREAT 70%, GOOD 40%로 쳐요. 점수는 최대 1,000,000점.</>,
        <>정확도에 따라 랭크: S+ 97% · S 94% · A 90% · B 80% · C 70%.</>,
        <>MISS 없이 끝내면 FC(풀콤보), 전부 PERFECT면 AP(올퍼펙트)!</>,
      ],
    },
    {
      icon: "❤️",
      title: "HP",
      items: [
        <>MISS가 나면 HP가 크게 깎이고, GOOD도 조금 깎여요. 회복은 PERFECT 위주.</>,
        <>HP가 바닥나면 그 자리에서 FAILED. 어려운 곡은 초반 연타 구간을 조심하세요.</>,
      ],
    },
    {
      icon: "🎧",
      title: "싱크 맞추기 (중요)",
      items: [
        <>기기·이어폰마다 소리가 늦게 나와요. 처음 한 번은 꼭 싱크를 맞춰 주세요.</>,
        <>
          <B>음악 싱크</B>: 소리가 늦게 들리는 만큼 +. <B>타격 싱크</B>: 늘 늦게 친다 싶으면 +.
        </>,
        <>일시정지 화면에 이번 판 평균 타이밍이 나오고, 버튼 하나로 바로 적용할 수 있어요.</>,
      ],
    },
    {
      icon: "🧩",
      title: "설정",
      items: [
        <>노트 속도, 타격음, 노트 스킨, 음악 볼륨을 취향대로.</>,
        <>
          <B>레인 배치</B>: 미러(좌우 반전), 랜덤(판마다 섞기).
        </>,
        <>
          <B>노트 가림</B>: 페이드(판정선 근처에서 사라짐), 서든(위쪽이 가려짐) — 실력 연습용.
        </>,
      ],
    },
  ],
};

export const SKETCH_GUIDE: GuideDoc = {
  lead: (
    <>
      한 사람이 제시어를 그림으로 그리면, 나머지가 채팅으로 정답을 맞히는 실시간 그림 퀴즈예요.
      친구들과 방을 만들어 같이 즐겨요.
    </>
  ),
  facts: ["👥 여럿이", "🖌 그리기", "💬 채팅으로 맞히기"],
  sections: [
    {
      icon: "🚪",
      title: "시작하기",
      items: [
        <>닉네임을 정하고 방을 만들거나 목록에서 들어가요. 비밀번호를 걸면 비공개 방.</>,
        <>방장이 그리는 시간, 한 사람당 그리는 횟수, 힌트 공개 여부, 차례 방식을 정해요.</>,
        <>게임 중에 들어와도 바로 맞히기에 참여하고, 그릴 차례도 돌아와요.</>,
      ],
    },
    {
      icon: "🖌",
      title: "그리는 사람",
      items: [
        <>쉬움·보통·어려움 제시어 중 하나를 골라요. 어려울수록 점수가 커요.</>,
        <>글자나 숫자를 직접 쓰는 건 반칙!</>,
        <>누군가 맞히면 그린 사람도 보너스 점수를 받아요.</>,
      ],
    },
    {
      icon: "💬",
      title: "맞히는 사람",
      items: [
        <>정답을 채팅창에 입력해요. 정답은 다른 사람에게 보이지 않으니 안심하고 막 던져도 돼요.</>,
        <>빨리 맞힐수록 점수가 커요 (남은 시간 비례).</>,
        <>힌트를 켠 방은 시간이 지나면 첫 글자 → 초성 순으로 공개돼요.</>,
      ],
    },
  ],
};

const ONLINE_ROOM_ITEMS = [
  <>닉네임을 정하고 방을 만들거나, 목록에서 들어가요. 비밀번호를 걸어도 초대 링크로는 바로 입장.</>,
  <>선·후공(랜덤 가능)과 제한 시간을 정할 수 있어요. 시간이 다 되면 시간패.</>,
  <>무르기 요청, 무승부 제안, 기권을 할 수 있고 상대가 수락해야 반영돼요.</>,
  <>방장은 일시정지와 시간 추가를 할 수 있어요. 상대가 오래 나가 있으면 승리 선언도 가능.</>,
  <>자리가 차면 관전으로 들어와 채팅하며 볼 수 있어요.</>,
];

const RANKED_ITEMS = (lead: string, moves: string, time: string) => [
  <>
    상대 고르기 아래 <B>🏆 랭킹 모드</B>를 켜고 시작해요. 랭킹전에서는 무르기와 힌트를 쓸 수 없어요.
  </>,
  <>
    순위는 무조건 <B>더 센 상대를 이긴 기록이 위</B>예요. 같은 상대끼리는 판 점수로 겨뤄요.
  </>,
  <>
    판 점수 = 1000 × {lead} × {moves} × {time}. 이긴 판만 기록돼요.
  </>,
  <>내 차례일 때만 시간이 흘러요. 새로고침해도 이어지고, 자리를 비운 시간도 같이 세요.</>,
];

export const CHESS_GUIDE: GuideDoc = {
  slides: [
    {
      title: "친구와 온라인 대국",
      visual: <Poster emoji="🌐" chips={["방 만들기", "초대 링크", "제한 시간", "관전·채팅"]} />,
      body: (
        <>
          <B>온라인 대국</B> 탭에서 방을 만들어 링크를 보내면 끝. 무르기·무승부는 상대가 수락해야
          하고, 방장은 일시정지와 시간 추가를 할 수 있어요.
        </>
      ),
    },
    {
      title: "AI 상대 고르기",
      image: chessSetup,
      body: (
        <>
          <B>AI와 두기</B> 탭에서 레이팅별 상대를 골라요. 높은 단계는 Stockfish 엔진이 진지하게
          둬요. 대국은 브라우저에 저장돼서 이어 둘 수 있어요.
        </>
      ),
    },
    {
      title: "기물 움직이기",
      image: chessSelect,
      body: (
        <>
          내 기물을 누르면 갈 수 있는 칸이 표시돼요. 끌어서 놓아도 돼요. 폰이 끝까지 가면 승진할
          기물을 고르고, 캐슬링은 킹을 두 칸 옮기면 돼요.
        </>
      ),
    },
    {
      title: "💡 힌트",
      image: chessHint,
      body: (
        <>
          막힐 땐 <B>힌트</B>! 엔진이 추천하는 수를 초록색으로 표시해 줘요. 무르기도 내 차례까지
          되돌려요.
        </>
      ),
    },
    {
      title: "🏆 AI 랭킹전",
      image: chessRanked,
      body: (
        <>
          랭킹 모드를 켜면 무르기·힌트 없이 진검승부. 순위는 <B>더 센 상대를 이긴 기록이 항상 위</B>
          , 같은 상대끼리는 기물 우세·적은 수·짧은 시간으로 매긴 판 점수 순이에요.
        </>
      ),
    },
  ],
  lead: (
    <>친구와 실시간으로 두는 온라인 체스, 그리고 실력별 AI와의 대국까지. 브라우저에서 바로 둬요.</>
  ),
  facts: ["🌐 온라인 대국", "🤖 AI 대국", "🏆 AI 랭킹전", "👀 관전"],
  sections: [
    {
      icon: "♟",
      title: "조작",
      items: [
        <>내 기물을 누르면 갈 수 있는 칸이 표시돼요. 그 칸을 눌러 이동.</>,
        <>폰이 끝까지 가면 퀸·룩·비숍·나이트 중 승진할 기물을 골라요.</>,
        <>캐슬링은 킹을 두 칸 옮기면 돼요. 앙파상도 지원해요.</>,
      ],
    },
    { icon: "🌐", title: "온라인 대국", items: ONLINE_ROOM_ITEMS },
    {
      icon: "🤖",
      title: "AI와 두기",
      items: [
        <>
          레이팅별 상대를 골라요. 낮은 단계는 실수도 하고, 높은 단계는 Stockfish 엔진이 진지하게
          둬요.
        </>,
        <>
          <B>💡 힌트</B>를 누르면 엔진이 추천하는 수를 판에 표시해 줘요.
        </>,
        <>무르기는 내 차례로 돌아갈 때까지 되돌려요. 대국은 브라우저에 저장돼 이어 둘 수 있어요.</>,
      ],
    },
    {
      icon: "🏆",
      title: "AI 랭킹전",
      items: RANKED_ITEMS(
        "기물 우세(잡은 기물 점수 차)",
        "적은 수(60수 이내일수록)",
        "짧은 시간(10분 이내일수록)"
      ),
    },
    {
      icon: "🤝",
      title: "무승부",
      items: [<>스테일메이트, 기물 부족, 3회 동형반복, 50수 규칙이면 무승부예요.</>],
    },
  ],
};

export const JANGGI_GUIDE: GuideDoc = {
  slides: [
    {
      title: "위인 AI와 상차림 고르기",
      image: janggiSetup,
      body: (
        <>
          급수가 다른 위인 중 상대를 고르고, 마·상 배치(상차림)를 정해요. 초는 먼저 두고, 한은 덤
          1.5점을 받아요.
        </>
      ),
    },
    {
      title: "궁·사 — 궁성 안에서 한 칸",
      visual: <JanggiMoves piece="king" />,
      body: (
        <>궁성 밖으로는 못 나가요. 궁성의 대각선 선 위에서는 대각선으로도 한 칸 갈 수 있어요.</>
      ),
    },
    {
      title: "차 — 가장 강한 기물",
      visual: <JanggiMoves piece="chariot" />,
      body: <>가로·세로로 막힐 때까지 쭉. 궁성 안에선 대각선 선도 따라가요. 점수 13점.</>,
    },
    {
      title: "포 — 하나를 넘어서",
      visual: <JanggiMoves piece="cannon" />,
      body: (
        <>
          반드시 기물 하나를 뛰어넘어야 움직이고 잡을 수 있어요(넘을 게 없으면 ✕). 포끼리는 넘지도
          잡지도 못해요.
        </>
      ),
    },
    {
      title: "마 — 한 칸 가고 대각선",
      visual: <JanggiMoves piece="horse" />,
      body: <>곧게 한 칸 간 뒤 대각선 한 칸. 첫 칸이 막히면(멱) 그쪽으로는 못 가요.</>,
    },
    {
      title: "상 — 한 칸 가고 대각선 두 칸",
      visual: <JanggiMoves piece="elephant" />,
      body: <>곧게 한 칸, 이어서 대각선 두 칸. 가는 길 중간이 하나라도 막히면 못 가요.</>,
    },
    {
      title: "졸·병 — 앞이나 옆으로",
      visual: <JanggiMoves piece="soldier" />,
      body: <>앞이나 옆으로 한 칸. 뒤로는 못 가요. 상대 궁성 안에서는 앞쪽 대각선도 가능해요.</>,
    },
    {
      title: "이기는 법과 특별 규칙",
      visual: <Poster emoji="📜" chips={["외통 = 승리", "한수쉼", "빅장", "반복수 금지"]} />,
      body: (
        <>
          장군을 피할 수 없게 만들면 승리. 장군이 아니면 한 수 쉴 수 있고, 두 궁이 마주 보는
          빅장·양쪽 연속 쉼·200수는 점수로 판정해요. 같은 국면을 세 번째 만드는 수는 금지.
        </>
      ),
    },
    {
      title: "💡 힌트",
      image: janggiHint,
      body: <>가장 강한 AI가 생각한 수를 초록색으로 보여 줘요. 처음 배울 때 따라 둬 보세요.</>,
    },
    {
      title: "🏆 AI 랭킹전 · 온라인 대국",
      image: chessRanked,
      body: (
        <>
          랭킹 모드는 무르기·힌트 없이. <B>더 센 위인을 이긴 기록이 항상 위</B>예요. 친구와는{" "}
          <B>온라인 대국</B> 탭에서 방을 만들어 둬요.
        </>
      ),
    },
  ],
  lead: (
    <>
      우리 장기를 온라인으로 친구와, 또는 역사 속 위인 AI와 둬요. 처음이라면 아래 기물 이동부터
      훑어보세요.
    </>
  ),
  facts: ["🌐 온라인 대국", "🤖 위인 AI", "🏆 AI 랭킹전", "가 한글/漢 한자"],
  sections: [
    {
      icon: "🏯",
      title: "기물 이동",
      items: [
        <>
          <B>궁·사</B>: 궁성 안에서 한 칸씩 (궁성의 대각선 선을 따라 대각선도 가능).
        </>,
        <>
          <B>차</B>: 가로·세로로 막힐 때까지 쭉. 궁성 안에선 대각선 선도 따라가요. 가장 강한 기물.
        </>,
        <>
          <B>포</B>: 다른 기물 하나를 뛰어넘어 이동·공격. 포끼리는 넘거나 잡을 수 없어요.
        </>,
        <>
          <B>마</B>: 한 칸 직진 후 한 칸 대각선. 첫 칸이 막히면 못 가요(멱).
        </>,
        <>
          <B>상</B>: 한 칸 직진 후 두 칸 대각선. 가는 길이 막히면 못 가요.
        </>,
        <>
          <B>졸·병</B>: 앞이나 옆으로 한 칸. 뒤로는 못 가요.
        </>,
      ],
    },
    {
      icon: "📜",
      title: "규칙",
      items: [
        <>초(파랑)가 먼저 둬요. 후수인 한(빨강)은 덤 1.5점을 받아요.</>,
        <>장군을 피할 수 없게 만들면(외통) 승리.</>,
        <>
          <B>한수쉼</B>: 장군 상태가 아니면 한 수를 쉴 수 있어요. 양쪽이 연달아 쉬면 점수로 판정.
        </>,
        <>
          <B>빅장</B>: 두 궁이 사이에 아무것도 없이 마주 보면 점수로 판정. 200수가 넘어도 점수 판정.
        </>,
        <>
          <B>반복수 금지</B>: 같은 국면을 세 번째로 만드는 수는 둘 수 없어요.
        </>,
        <>점수: 차 13 · 포 7 · 마 5 · 상 3 · 사 3 · 졸 2.</>,
      ],
    },
    {
      icon: "🧩",
      title: "상차림",
      items: [
        <>
          시작 전 마·상의 배치를 고를 수 있어요 (마상상마, 상마마상 등). 내 것과 상대 것을 따로
          정해요.
        </>,
      ],
    },
    { icon: "🌐", title: "온라인 대국", items: ONLINE_ROOM_ITEMS },
    {
      icon: "🤖",
      title: "AI와 두기",
      items: [
        <>장영실부터 이순신까지, 급수가 다른 위인들이 대사를 하며 상대해 줘요.</>,
        <>
          <B>💡 힌트</B>를 누르면 가장 강한 AI가 생각한 추천 수를 판에 표시해 줘요.
        </>,
        <>무르기는 내 차례로 돌아갈 때까지 되돌려요. 대국은 브라우저에 저장돼요.</>,
      ],
    },
    {
      icon: "🏆",
      title: "AI 랭킹전",
      items: [
        ...RANKED_ITEMS(
          "점수 우세(남은 기물 점수 차)",
          "적은 수(80수 이내일수록)",
          "짧은 시간(15분 이내일수록)"
        ),
        <>외통이 아닌 판정승(빅장·한수쉼·200수)은 판 점수 ×0.6이에요.</>,
      ],
    },
  ],
};

export const MINE_GUIDE: GuideDoc = {
  slides: [
    {
      title: "아무 칸이나 눌러 시작",
      image: mineStart,
      body: (
        <>
          첫 칸은 항상 안전하고 주변이 넓게 열려요. 지뢰는 99개, 찍을 필요 없이 논리만으로 풀리는
          판만 나와요.
        </>
      ),
    },
    {
      title: "숫자 = 주변 8칸의 지뢰 수",
      image: mineOpen,
      body: (
        <>
          닫힌 이웃 칸 수가 숫자와 같으면 전부 지뢰, 숫자만큼 깃발이 꽂혀 있으면 나머지는 전부
          안전해요.
        </>
      ),
    },
    {
      title: "깃발과 한 번에 열기",
      visual: <ChordDemo />,
      body: (
        <>
          <B>오른쪽 클릭</B>으로 깃발. 숫자 위에서 <B>좌+우 동시 클릭</B>하면 깃발 수가 맞을 때
          나머지 이웃 칸이 한 번에 열려요.
        </>
      ),
    },
    {
      title: "모바일에서는 꾹",
      visual: (
        <Poster emoji="👆" chips={["탭 = 열기", "닫힌 칸 꾹 = 깃발", "숫자 꾹 = 한 번에 열기"]} />
      ),
      body: (
        <>
          짧게 탭하면 열고, 닫힌 칸을 꾹 누르면 깃발, 열린 숫자를 꾹 누르면 주변을 한 번에 열어요.
        </>
      ),
    },
    {
      title: "기록 도전",
      visual: <Poster emoji="⏱" chips={["첫 칸부터 시간 측정", "클리어하면 이름 등록"]} />,
      body: <>1-2-1, 1-2-2-1 같은 자주 나오는 모양을 익혀 두면 훨씬 빨라져요.</>,
    },
  ],
  lead: (
    <>
      숫자를 단서로 지뢰 99개를 피해 모든 칸을 여는 고급 난이도 지뢰찾기예요. 찍을 필요 없이
      논리만으로 풀리는 판만 나와요.
    </>
  ),
  facts: ["💣 지뢰 99개", "🧠 찍기 없는 판", "⏱ 클리어 시간 랭킹"],
  sections: [
    {
      icon: "🖱",
      title: "조작 (PC)",
      items: [
        <>
          <B>왼쪽 클릭</B>: 칸 열기. 첫 칸은 항상 안전하고, 주변이 넓게 열려요.
        </>,
        <>
          <B>오른쪽 클릭</B>: 깃발 꽂기/뽑기.
        </>,
        <>
          <B>좌+우 동시 클릭</B>(숫자 위): 주변 깃발 수가 숫자와 같으면 나머지 칸을 한 번에 열어요.
        </>,
      ],
    },
    {
      icon: "📱",
      title: "조작 (모바일)",
      items: [<>짧게 탭: 칸 열기.</>, <>닫힌 칸을 꾹: 깃발. 열린 숫자를 꾹: 주변 한 번에 열기.</>],
    },
    {
      icon: "🔢",
      title: "숫자 읽는 법",
      items: [
        <>숫자는 그 칸을 둘러싼 8칸에 있는 지뢰 수예요.</>,
        <>숫자만큼 깃발이 이미 꽂혀 있으면, 남은 이웃 칸은 전부 안전해요.</>,
        <>닫힌 이웃 칸 수가 숫자와 같으면, 그 칸들은 전부 지뢰예요.</>,
        <>1-2-1, 1-2-2-1 같은 자주 나오는 모양을 익혀 두면 훨씬 빨라져요.</>,
      ],
    },
    {
      icon: "🏆",
      title: "기록",
      items: [
        <>첫 칸을 여는 순간부터 시간이 흘러요. 클리어하면 이름을 남길 수 있어요.</>,
        <>지뢰를 밟으면 끝. 🔁 새 게임으로 다시 시작해요.</>,
      ],
    },
  ],
};

export const REACTION_GUIDE: GuideDoc = {
  lead: <>화면이 파랗게 바뀌는 순간 얼마나 빨리 누르는지 재요. 5번 잰 평균이 기록이에요.</>,
  facts: ["⚡ 5회 평균", "⌨️ Space/Enter", "🏆 TOP 10 랭킹"],
  sections: [
    {
      icon: "🎯",
      title: "하는 법",
      items: [
        <>판을 눌러 시작하면 빨간 화면이 돼요. 잠시 기다리다 파란색으로 바뀌면 바로 누르세요.</>,
        <>파란색으로 바뀌는 시점은 매번 랜덤이에요 (1.5~4.5초).</>,
        <>
          마우스 클릭, 터치, <K>Space</K>
          <K>Enter</K> 모두 돼요.
        </>,
      ],
    },
    {
      icon: "⚠️",
      title: "부정 출발",
      items: [
        <>파랗게 되기 전에 누르면 "너무 빨라요!" — 그 라운드만 다시 해요. 기록엔 안 들어가요.</>,
      ],
    },
    {
      icon: "💡",
      title: "팁",
      items: [
        <>보통 사람은 200~300ms 정도예요. 200ms 아래면 꽤 빠른 편!</>,
        <>마우스보다 키보드가 조금 더 빠르게 나오는 경우가 많아요.</>,
        <>화면 주사율이 높은(120Hz 이상) 모니터일수록 유리해요.</>,
      ],
    },
  ],
};
