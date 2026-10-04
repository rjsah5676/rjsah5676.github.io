import { B, K, type GuideDoc } from "@/components/GuideView";
import melonStart from "@/img/guide/melon-start.webp";
import melonDrag from "@/img/guide/melon-drag.webp";
import melonPop from "@/img/guide/melon-pop.webp";
import melonHud from "@/img/guide/melon-hud.webp";
import rhythmSelect from "@/img/guide/rhythm-select.webp";
import rhythmSettings from "@/img/guide/rhythm-settings.webp";
import rhythmCustom from "@/img/guide/rhythm-custom.webp";
import chessSetup from "@/img/guide/chess-setup.webp";
import chessHint from "@/img/guide/chess-hint.webp";
import chessRanked from "@/img/guide/chess-ranked.webp";
import janggiSetup from "@/img/guide/janggi-setup.webp";
import janggiHint from "@/img/guide/janggi-hint.webp";
import mineStart from "@/img/guide/mine-start.webp";
import skLobby from "@/img/guide/sk-lobby.webp";
import skChoose from "@/img/guide/sk-choose.webp";
import skDraw from "@/img/guide/sk-draw.webp";
import skGuess from "@/img/guide/sk-guess.webp";
import skCorrect from "@/img/guide/sk-correct.webp";
import skReveal from "@/img/guide/sk-reveal.webp";

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

/** 싱크 두 가지 개념 */
function SyncConcept() {
  const card = "flex-1 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center";
  return (
    <div className="flex w-full max-w-md gap-2.5">
      <div className={card}>
        <div className="text-4xl">🎧</div>
        <div className="mt-1.5 text-sm font-bold text-white">음악 싱크</div>
        <div className="mt-1 text-[11px] leading-snug text-white/55">
          소리가 귀에
          <br />
          늦게 도착하는 만큼
        </div>
      </div>
      <div className={card}>
        <div className="text-4xl">✋</div>
        <div className="mt-1.5 text-sm font-bold text-white">타격 싱크</div>
        <div className="mt-1 text-[11px] leading-snug text-white/55">
          내 손이 늘
          <br />
          늦게·빠르게 누르는 만큼
        </div>
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
          <K>↓</K> 난이도, <K>Enter</K> 시작. 쉬움부터 <B>나이트메어</B>까지 곡마다 4~5단계. 노트가
          아래 하얀 선에 닿을 때 <K>D</K>
          <K>F</K>
          <K>J</K>
          <K>K</K>(폰은 터치), 긴 노트는 끝까지 꾹, <K>Esc</K>는 일시정지.
        </>
      ),
    },
    {
      title: "내 음악으로 플레이",
      image: rhythmCustom,
      body: (
        <>
          <B>내 음악으로 플레이</B>에 노래 파일을 끌어다 놓으면 이 사이트만의{" "}
          <B>채보 생성 알고리즘</B>이 드럼과 박자를 분석해 쉬움~나이트메어 5단계 채보를 바로 만들어
          줘요.
          <br />
          <B>본인 취향의 노래를 리듬게임으로 즐겨보세요!</B>
        </>
      ),
    },
    {
      title: "자동 싱크 조절이란?",
      visual: <SyncConcept />,
      body: (
        <>
          <B>자동 싱크</B>가 치는 동안 내 타이밍이 어느 쪽으로 쏠리는지 재서 알아서 맞춰요 — 이
          사이트만의 핵심 기술 중 하나예요. 블루투스처럼 소리가 많이 늦는 것도 몇 마디면 따라잡으니
          그냥 플레이하시면 돼요.
        </>
      ),
    },
    {
      title: "직접 맞추고 싶다면",
      visual: (
        <Poster
          emoji="🎚️"
          chips={["자동 싱크 끄기", "음악 싱크: 소리가 늦게 들리면 +", "타격 싱크: 늘 늦게 치면 +"]}
        />
      ),
      body: (
        <>
          설정에서 <B>자동 싱크</B>를 끄면 음악 싱크·타격 싱크 슬라이더가 열려요. 일시정지 화면에서
          지금까지 평균이 몇 ms 늦었는지 보고 맞추면 돼요.
        </>
      ),
    },
    {
      title: "커스터마이징",
      image: rhythmSettings,
      body: (
        <>
          노트 속도·볼륨·타격음·노트 스킨을 바꿀 수 있어요. <B>레인 배치</B>(미러·랜덤)와{" "}
          <B>노트 가림</B>(페이드·서든)은 실력을 키우고 싶을 때 써 보세요.
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
          <B>PERFECT</B> ±45ms · <B>GREAT</B> ±90ms · <B>GOOD</B> ±130ms, 그보다 벗어나면 MISS.
        </>,
        <>정확도는 PERFECT 100%, GREAT 70%, GOOD 40%로 쳐요. 점수는 최대 1,000,000점.</>,
        <>정확도에 따라 랭크: S+ 97% · S 94% · A 90% · B 80% · C 70%.</>,
        <>MISS 없이 끝내면 FC(풀콤보), 전부 PERFECT면 AP(올퍼펙트)!</>,
        <>MISS가 나면 HP가 크게 깎이고 GOOD도 조금 깎여요. HP가 바닥나면 FAILED.</>,
      ],
    },
    {
      icon: "🎧",
      title: "싱크 맞추기",
      items: [
        <>
          <B>자동 싱크</B>(기본 켜짐): 치는 동안 타이밍이 계속 한쪽으로 쏠리면 타격 싱크를 조금씩
          옮겨요. 실수 몇 번엔 안 움직이고, 화면에 따로 알림은 안 떠요(일시정지·결과 화면에서 확인).
        </>,
        <>
          <B>음악 싱크</B>: 소리가 귀에 늦게 도착하는 만큼(블루투스 이어폰 등). 타격 싱크가 손 지연
          범위(±60ms)를 넘으면 넘는 몫을 판 끝에 여기로 옮겨 노트 위치도 소리에 맞춰요.
        </>,
        <>
          <B>타격 싱크</B>: 내 손이 늘 늦거나 빠르게 누르는 버릇. 늘 늦게 친다 싶으면 +.
        </>,
        <>
          직접 맞추려면 자동 싱크를 끄고 두 슬라이더를 움직여요. 일시정지 화면에 지금까지 평균이
          보여요.
        </>,
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
  slides: [
    {
      title: "방 만들기",
      image: skLobby,
      body: (
        <>
          <B>+ 방 만들기</B>에서 인원, 그리는 시간, 한 사람당 그리는 횟수를 정해요. 비밀번호를
          걸어도 <B>초대 링크</B>로 들어온 친구는 바로 입장!
        </>
      ),
    },
    {
      title: "내 차례면 제시어 고르기",
      image: skChoose,
      body: (
        <>
          쉬움·보통·어려움 중 하나를 골라요. 어려운 제시어일수록 점수가 <B>×1.2, ×1.5</B>로 커져요.
        </>
      ),
    },
    {
      title: "그림으로 설명하기",
      image: skDraw,
      body: (
        <>
          색, 굵기, 채우기, 지우개, 되돌리기를 쓸 수 있어요. 글자나 숫자를 쓰는 건 반칙! 그림만으로
          맞히게 해 주세요.
        </>
      ),
    },
    {
      title: "채팅으로 맞히기",
      image: skGuess,
      body: (
        <>
          떠오르는 답을 채팅창에 마구 던지세요. 맞힌 답은 다른 사람에게 안 보여요. 힌트를 켠 방은
          시간이 지나면 첫 글자 → 초성 순으로 알려 줘요.
        </>
      ),
    },
    {
      title: "정답! 점수는 이렇게",
      image: skCorrect,
      body: (
        <>
          빨리 맞힐수록 <B>20~100점</B>(× 난이도), <B>제일 먼저 맞히면 +30</B>. 그린 사람도 누가
          맞힐 때마다 그 점수의 <B>절반</B>을 받아요.
        </>
      ),
    },
    {
      title: "정답 공개, 다음 차례",
      image: skReveal,
      body: (
        <>
          시간이 끝나거나 모두 맞히면 정답이 공개되고 다음 사람이 그려요. 모두 정해진 횟수만큼
          그리면 끝, 점수 1등이 우승!
        </>
      ),
    },
  ],
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
        <>
          방장이 인원, 그리는 시간, 한 사람당 그리는 횟수, 힌트 공개 여부, 다음에 그릴 사람(맞힌
          사람/입장 순서)을 정해요.
        </>,
        <>게임 중에 들어와도 바로 맞히기에 참여하고, 그릴 차례도 돌아와요.</>,
      ],
    },
    {
      icon: "🖌",
      title: "그리는 사람",
      items: [
        <>쉬움·보통(×1.2)·어려움(×1.5) 제시어 중 하나를 골라요.</>,
        <>글자나 숫자를 직접 쓰는 건 반칙!</>,
        <>누가 맞힐 때마다 그 사람이 얻은 점수(첫 정답 보너스 빼고)의 절반을 받아요.</>,
      ],
    },
    {
      icon: "💬",
      title: "맞히는 사람",
      items: [
        <>정답을 채팅창에 입력해요. 정답은 다른 사람에게 보이지 않아요.</>,
        <>빨리 맞힐수록 20~100점 × 난이도 배율, 제일 먼저 맞히면 +30점.</>,
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
      우리 장기를 온라인으로 친구와, 또는 역사 속 위인 AI와 둬요. 이 사이트에서 쓰는 규칙과 기능을
      정리했어요.
    </>
  ),
  facts: ["🌐 온라인 대국", "🤖 위인 AI", "🏆 AI 랭킹전", "가 한글/漢 한자"],
  sections: [
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

/** 금수 예시: 7×7 작은 판에 흑 돌과 ✕(금수 자리) */
function ForbidBoard({
  stones,
  x,
  label,
}: {
  stones: [number, number][];
  x: [number, number];
  label: string;
}) {
  const C = 18,
    M = 12,
    W = C * 6 + M * 2;
  return (
    <figure className="flex flex-col items-center gap-1.5">
      <svg viewBox={`0 0 ${W} ${W}`} width={112} height={112} className="rounded-md" aria-hidden>
        <rect width={W} height={W} fill="#E2BC7C" />
        {Array.from({ length: 7 }, (_, k) => (
          <g key={k} stroke="#5C3F1E" strokeWidth={0.8}>
            <line x1={M} y1={M + k * C} x2={M + 6 * C} y2={M + k * C} />
            <line x1={M + k * C} y1={M} x2={M + k * C} y2={M + 6 * C} />
          </g>
        ))}
        {stones.map(([cx, cy]) => (
          <circle key={`${cx},${cy}`} cx={M + cx * C} cy={M + cy * C} r={7.5} fill="#151515" />
        ))}
        <g stroke="#DC2626" strokeWidth={2.6} strokeLinecap="round">
          <line
            x1={M + x[0] * C - 5}
            y1={M + x[1] * C - 5}
            x2={M + x[0] * C + 5}
            y2={M + x[1] * C + 5}
          />
          <line
            x1={M + x[0] * C + 5}
            y1={M + x[1] * C - 5}
            x2={M + x[0] * C - 5}
            y2={M + x[1] * C + 5}
          />
        </g>
      </svg>
      <figcaption className="text-xs text-white/70">{label}</figcaption>
    </figure>
  );
}

function ForbidDemo() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <ForbidBoard
        label="3-3"
        x={[3, 3]}
        stones={[
          [1, 3],
          [2, 3],
          [3, 1],
          [3, 2],
        ]}
      />
      <ForbidBoard
        label="4-4"
        x={[3, 3]}
        stones={[
          [0, 3],
          [1, 3],
          [2, 3],
          [3, 0],
          [3, 1],
          [3, 2],
        ]}
      />
      <ForbidBoard
        label="장목 (6목)"
        x={[3, 3]}
        stones={[
          [0, 3],
          [1, 3],
          [2, 3],
          [4, 3],
          [5, 3],
        ]}
      />
    </div>
  );
}

export const OMOK_GUIDE: GuideDoc = {
  slides: [
    {
      title: "상대와 규칙 고르기",
      visual: <Poster emoji="⚫" chips={["18급 ~ 5단 AI", "렌주룰", "일반룰", "자유룰"]} />,
      body: (
        <>
          흑(선수)·백 중 내 돌과 AI 상대를 고르고 규칙을 정해요. 흑이 먼저 두고,
          가로·세로·대각선으로 다섯 개를 먼저 이으면 승리.
        </>
      ),
    },
    {
      title: "렌주룰 금수 (흑만)",
      visual: <ForbidDemo />,
      body: (
        <>
          먼저 두는 흑이 너무 유리해서 흑은 <B>3-3 · 4-4 · 장목</B> 자리에 둘 수 없어요. 판에 빨간
          ✕로 표시돼요. 단, 그 수로 바로 5목이 되면 둘 수 있어요.
        </>
      ),
    },
    {
      title: "💡 힌트와 수 번호",
      visual: <Poster emoji="💡" chips={["가장 센 AI의 추천 수", "① 수 번호 보기"]} />,
      body: (
        <>
          힌트는 가장 센 AI가 생각한 자리를 초록 점선으로 보여 줘요. 수 번호로 둔 순서도 볼 수
          있어요.
        </>
      ),
    },
    {
      title: "🏆 AI 랭킹전 · 온라인 대국",
      visual: <Poster emoji="🏆" chips={["렌주룰 랭킹전", "실시간 온라인 대국", "관전 · 채팅"]} />,
      body: (
        <>
          랭킹전은 렌주룰로, 무르기·힌트 없이. <B>더 센 AI를 이긴 기록이 항상 위</B>예요. 친구와는{" "}
          <B>온라인 대국</B> 탭에서 방을 만들어 둬요.
        </>
      ),
    },
  ],
  lead: (
    <>
      15×15 판에서 두는 오목. 렌주룰 금수(3-3·4-4·장목)까지 정확히 판정하고, 친구와 온라인으로 또는
      AI와 둘 수 있어요.
    </>
  ),
  facts: ["🌐 온라인 대국", "🤖 AI 8단계", "🏆 AI 랭킹전", "✕ 금수 표시"],
  sections: [
    {
      icon: "📜",
      title: "규칙 세 가지",
      items: [
        <>
          <B>렌주룰(국제룰)</B>: 첫 수는 천원(가운데). 흑만 3-3·4-4·장목(6목 이상) 금지. 흑은 정확히
          5목, 백은 장목도 승리.
        </>,
        <>
          <B>일반룰</B>: 흑·백 모두 3-3 금지(4-4는 허용). 양쪽 다 정확히 5목만 승리, 장목은 무효.
        </>,
        <>
          <B>자유룰</B>: 금수 없이 5목 이상이면 승리.
        </>,
        <>판이 가득 차면 무승부예요.</>,
      ],
    },
    {
      icon: "✕",
      title: "금수 판정",
      items: [
        <>
          <B>삼</B>은 한 수 더 두면 양쪽이 열린 4(막아도 반대쪽으로 5목)가 되는 모양이에요. 한쪽이
          막힌 3은 삼이 아니에요.
        </>,
        <>
          <B>거짓 삼</B>: 열린 4를 만들 자리가 전부 금수라 실제로는 4로 못 키우는 삼은 삼으로 치지
          않아요 (렌주 공식 규칙대로 끝까지 따져 봐요).
        </>,
        <>4-3(4 하나 + 삼 하나)은 금수가 아니에요. 5목이 되는 수는 금수 모양이어도 둘 수 있어요.</>,
        <>
          금수 자리는 판에 빨간 ✕로 표시되고 눌러도 놓이지 않아요. 렌주룰에서 백은 흑의 금수 자리로
          흑을 몰아 이길 수도 있어요.
        </>,
      ],
    },
    { icon: "🌐", title: "온라인 대국", items: ONLINE_ROOM_ITEMS },
    {
      icon: "🤖",
      title: "AI와 두기",
      items: [
        <>
          오목 새싹(18급)부터 알파오목(5단)까지 8단계. 센 단계는 연속 4로 몰아붙이는 수순(VCF)을
          읽어요.
        </>,
        <>
          <B>💡 힌트</B>를 누르면 가장 센 AI가 생각한 추천 자리를 판에 표시해 줘요.
        </>,
        <>무르기는 내 차례로 돌아갈 때까지 되돌려요. 대국은 브라우저에 저장돼요.</>,
        <>휴대폰에서는 한 번 눌러 자리를 고르고, 같은 자리를 한 번 더 누르면 돌이 놓여요.</>,
      ],
    },
    {
      icon: "🏆",
      title: "AI 랭킹전",
      items: [
        ...RANKED_ITEMS(
          "(백으로 이기면 1.2배)",
          "적은 수(25수 이내일수록)",
          "짧은 시간(10분 이내일수록)"
        ),
        <>랭킹전은 렌주룰로만 둬요.</>,
      ],
    },
  ],
};

export const FIGHT_GUIDE: GuideDoc = {
  slides: [
    {
      title: "모드 → 캐릭터 → 맵",
      visual: (
        <Poster emoji="🥊" chips={["카이 · 맨손 격투", "이그나 · 불꽃", "소영 · 채찍", "릴리 · 우산과 물"]} />
      ),
      body: (
        <>
          AI 대전(난이도 선택) 또는 한 키보드 2인 대전을 고르고 시작하면 캐릭터 선택. 지금 고르는
          쪽이 빛나요. <B>2라운드 먼저</B> 이기면 승리.
        </>
      ),
    },
    {
      title: "발판 위에서 싸우기",
      visual: <Poster emoji="🪜" chips={["2단 점프", "←← →→ 대시", "↓ 가드", "↓+점프 내려가기"]} />,
      body: (
        <>
          발판은 밑에서 뚫고 올라가요. 공중에서도 공격은 <B>점프마다 2번</B>, 대시 1번. 떨어지면
          위에서 다시 내려와요.
        </>
      ),
    },
    {
      title: "약 4단 · 발차기 2단",
      visual: <Poster emoji="💥" chips={["J 약 ×4", "K 발차기 ×2", "L 아이덴티티", "I 필살기"]} />,
      body: (
        <>
          같은 버튼을 이어 누르면 다음 동작. <B>마지막 동작은 세지만 빈틈이 커서</B> 막히면 반격당해요.
          맞히는 중에 아이덴티티·필살기로 캔슬.
        </>
      ),
    },
    {
      title: "🏆 AI 랭킹",
      visual: <Poster emoji="🏆" chips={["더 센 AI를 이긴 기록이 위", "남은 체력", "경기 시간"]} />,
      body: <>AI를 이기면 기록을 올릴 수 있어요. 센 단계를 이긴 기록이 항상 위예요.</>,
    },
  ],
  lead: (
    <>
      브라우저에서 하는 1:1 플랫폼 격투게임. 프레임 단위로 판정하는 엔진을 직접 만들었고, 온라인
      대전(롤백 넷코드)을 붙일 수 있게 설계했어요.
    </>
  ),
  facts: ["🧑‍🤝‍🧑 캐릭터 4명", "🤖 AI 6단계", "👥 한 키보드 2인", "🎮 게임패드", "📱 터치 버튼"],
  sections: [
    {
      icon: "⌨️",
      title: "조작",
      items: [
        <>
          <B>1P</B>: A·D 이동(AA·DD 대시), W/Space 점프(2단), S 가드(S+점프로 발판 아래로), J 약, K
          발차기, L 아이덴티티, I 필살기. AI 대전에선 방향키 + Z X C V도 돼요.
        </>,
        <>
          <B>2P</B>: ←→ 이동, ↑/Enter 점프, ↓ 가드, <K>,</K> 약 <K>.</K> 발차기 <K>;</K> 아이덴티티{" "}
          <K>&apos;</K> 필살기 (숫자패드 1 2 3 0도 가능).
        </>,
        <>게임패드: A 점프, X 약, Y 발차기, B 아이덴티티, RB·RT 필살기.</>,
        <>휴대폰은 판 아래 화면 버튼으로. Esc나 P로 일시정지. 머리 위 1P·2P(CPU) 표시로 내 캐릭터 구분.</>,
      ],
    },
    {
      icon: "🛡️",
      title: "기본 규칙",
      items: [
        <>↓를 누르고 있으면 가드 — <B>보고 있는 쪽</B>에서 온 공격만 막아요. 공중에선 못 막아요.</>,
        <>
          <B>막으면 유리</B>: 약은 막혀도 거의 손해가 없지만, 발차기·아이덴티티·필살기는 막히면 막은 쪽이 먼저
          움직여요 (프레임 이득). 맞기 직전에 가드를 올리면 <B>저스트 가드</B> — 경직 반, 깎임 없음, 게이지 +.
        </>,
        <>
          <B>가드 반격</B>: 막는 중에 발차기(K)를 누르면 게이지 25를 써서 바로 밀쳐 내요. <B>잡기</B>: 약+발차기(J+K)
          동시 — 가드를 뚫지만 사거리가 짧고, 잡힌 직후 J+K를 누르면 풀려요.
        </>,
        <><B>카운터 히트</B>: 상대가 기술을 내는 중이거나 대시 중에 맞히면 피해 1.25배, 경직이 길어져요.</>,
        <>
          아이덴티티(L)는 캐릭터마다 다른 고유 기술, 쓰고 나면 재사용 대기(체력바 아래 원). 필살기(I)는
          게이지 MAX일 때 (발차기+아이덴티티 동시도 가능).
        </>,
        <>
          콤보가 길어질수록 피해와 맞는 경직이 줄고, 공중에서 너무 많이 맞으면 강제로 다운 — 무한
          콤보는 안 돼요.
        </>,
        <>한 라운드 90초. 시간이 끝나면 남은 체력 비율로 승부. 떨어져도 피해는 없어요.</>,
      ],
    },
    {
      icon: "🧑‍🎨",
      title: "캐릭터 (★ 조작 난이도)",
      items: [
        <>
          <B>카이 ★★</B> 돌격형. 빠른 주먹으로 붙어서 몰아침. 질풍권(돌진 2연타, 공중에선 급강하
          충격파) · 천풍난무(회오리 6연타).
        </>,
        <>
          <B>이그나 ★</B> 견제형. 화염구로 거리를 두고 태움, 맞히기 쉬운 대신 한 대가 약함. 업화주(상대
          발밑 불기둥).
        </>,
        <>
          <B>소영 ★★★</B> 리치형. 긴 채찍으로 멀리서 찌르지만 느리고 헛치면 빈틈이 큼. 지도편달(낚아채
          끌어당김) · 보충수업(앞뒤 6연타).
        </>,
        <>
          <B>릴리 ★★</B> 기동형. 작고 우산으로 천천히 떨어져(공중에서 점프 누르고 있기) 잘 안 맞지만
          체력이 낮음. 비눗방울(느린 함정 탄) · 장마 파도(5연타 파도).
        </>,
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
