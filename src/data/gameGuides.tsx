import { B, K, type GuideDoc } from "@/components/GuideView";
import melonStart from "@/img/guide/melon-start.webp";
import melonDrag from "@/img/guide/melon-drag.webp";
import melonPop from "@/img/guide/melon-pop.webp";
import melonHud from "@/img/guide/melon-hud.webp";
import rhythmSelect from "@/img/guide/rhythm-select.webp";
import rhythmPlay from "@/img/guide/rhythm-play.webp";
import syncPrompt from "@/img/guide/sync-prompt.webp";
import syncOne from "@/img/guide/sync-1.webp";
import syncTwo from "@/img/guide/sync-2.webp";
import rhythmSettings from "@/img/guide/rhythm-settings.webp";
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

/** 3단계 결과 모습 (실제 화면을 단순화) */
function AudioCalMock() {
  const taps = [-18, 6, 22, 30, 14, 38, 26, 19, 33, 9, 28, 24];
  return (
    <div className="flex w-full max-w-sm flex-col items-center font-mono">
      <div className="text-[11px] text-white/40">🔊 딸깍 · 딸깍 · 딸깍 …</div>
      <div className="mt-3 text-[11px] text-white/40">추천 음악 싱크</div>
      <div className="text-4xl font-bold text-white">+24ms</div>
      <div className="relative mt-3 h-6 w-full rounded bg-white/5">
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/40" />
        {taps.map((d, i) => (
          <div
            key={i}
            className="absolute top-1 h-4 w-0.5 rounded bg-[#7DF9FF]/70"
            style={{ left: `${50 + (d / 150) * 50}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex w-full justify-between text-[9px] text-white/30">
        <span>빠름</span>
        <span>늦음</span>
      </div>
      <div className="mt-3 rounded-full bg-[#6C63FF] px-4 py-1.5 text-xs font-bold text-white">
        +24ms 적용하고 완료
      </div>
    </div>
  );
}

/** 결과 화면 자동 보정 제안 */
function AutoSyncMock() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1C1E24] p-4 text-center font-mono">
      <div className="text-[11px] text-white/40">질주주의보 · 보통</div>
      <div className="mt-1 text-5xl font-black text-[#FDE047]">S</div>
      <div className="mt-3 rounded-lg bg-white/[0.04] p-3 text-xs leading-relaxed text-white/70">
        늦게 쳤어요. 타격 싱크를 <b className="text-white">0 → +18ms</b>로 맞출까요?
        <div className="mt-2 flex justify-center gap-1.5">
          <span className="rounded-full bg-[#6C63FF] px-3 py-1 font-bold text-white">맞추기</span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-white/70">
            그대로 두기
          </span>
        </div>
      </div>
    </div>
  );
}

/** 일시정지 화면의 평균 타이밍 */
function PauseSyncMock() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-2 font-mono">
      <div className="text-base font-bold text-white">일시정지</div>
      <div className="text-xs text-white/50">
        지금까지 평균 <b className="text-[#FBBF24]">+23ms 늦음</b> · 입력 48개
      </div>
      <span className="rounded-full border border-[#FBBF24]/50 px-3 py-1 text-xs text-[#FDE68A]">
        타격 싱크에 적용
      </span>
      <div className="mt-1 flex gap-1.5 text-[11px] text-white/60">
        <span className="rounded-full border border-white/15 px-3 py-1">계속하기 (Esc)</span>
        <span className="rounded-full border border-white/15 px-3 py-1">처음부터</span>
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
          <K>↓</K> 난이도, <K>Enter</K> 시작. <B>내 음악으로 플레이</B>에 mp3를 넣으면 채보를
          자동으로 만들어 줘요.
        </>
      ),
    },
    {
      title: "선에 닿는 순간 누르기",
      image: rhythmPlay,
      body: (
        <>
          노트가 아래 하얀 선에 닿을 때 그 줄의 키를 눌러요. 왼쪽부터 <K>D</K>
          <K>F</K>
          <K>J</K>
          <K>K</K>, 폰은 줄을 터치. 긴 노트는 끝날 때까지 꾹! <K>Esc</K>는 일시정지.
        </>
      ),
    },
    {
      title: "판정과 랭크",
      visual: <JudgeTable />,
      body: (
        <>
          딱 맞으면 PERFECT. MISS가 나면 오른쪽 HP가 크게 줄고, 다 줄면 실패예요. 하나도 안 놓치면
          FC, 전부 PERFECT면 AP!
        </>
      ),
    },
    {
      title: "싱크가 뭐예요?",
      visual: <SyncConcept />,
      body: (
        <>
          분명 맞게 쳤는데 GREAT·GOOD만 뜬다면 싱크가 안 맞은 거예요. 기기·이어폰마다 소리가 늦게
          나와서 그래요. <B>처음 한 번, 1~2분</B>이면 맞출 수 있어요.
        </>
      ),
    },
    {
      title: "처음 들어오면 안내가 떠요",
      image: syncPrompt,
      body: (
        <>
          <B>지금 맞추기</B>를 누르면 3단계로 차근차근 안내해요. 나중에 하고 싶으면 언제든 오른쪽
          설정의 <B>싱크 맞추기</B> 버튼으로 다시 할 수 있어요.
        </>
      ),
    },
    {
      title: "1단계 · 노트 속도 정하기",
      image: syncOne,
      body: (
        <>
          노트가 내려오는 속도부터 골라요. 오른쪽 미리보기를 보며 <B>눈으로 따라가기 편한 속도</B>로
          (보통 x3~x4). 속도에 따라 타이밍 느낌이 달라져서 먼저 정해요.
        </>
      ),
    },
    {
      title: "2단계 · 화면만 보고 치기",
      image: syncTwo,
      body: (
        <>
          <B>음악 없이</B> 노트만 내려와요. 선에 닿는 순간 누르기만 하면 내 손이 평균 몇 ms 늦거나
          빠른지 재서 <B>타격 싱크</B>를 추천해 줘요. <B>적용하고 다음</B>을 누르세요.
        </>
      ),
    },
    {
      title: "3단계 · 소리만 듣고 치기",
      visual: <AudioCalMock />,
      body: (
        <>
          이번엔 <B>화면 없이</B> 딸깍 소리만 나요. 박자에 맞춰 아무 키나(스페이스도 OK) 누르면,
          소리가 귀에 늦게 도착하는 만큼을 <B>음악 싱크</B>로 잡아 줘요. 적용하면 끝!
        </>
      ),
    },
    {
      title: "그 뒤로는 알아서 맞춰 줘요",
      visual: <AutoSyncMock />,
      body: (
        <>
          한 곡을 고르게 쳤는데 타이밍이 계속 한쪽으로 쏠리면, 결과 화면에서 <B>맞추기</B> 한 번으로
          보정해 줘요. 한 번에 조금씩만 바꿔서 갑자기 어긋날 걱정 없어요.
        </>
      ),
    },
    {
      title: "치다가도 바로 고칠 수 있어요",
      visual: <PauseSyncMock />,
      body: (
        <>
          플레이 중 <K>Esc</K>로 멈추면 지금까지 평균이 몇 ms 늦었는지 보여요.{" "}
          <B>타격 싱크에 적용</B>을 누르면 남은 부분부터 바로 반영돼요.
        </>
      ),
    },
    {
      title: "이럴 땐 다시 맞춰 주세요",
      visual: (
        <Poster
          emoji="🎧"
          chips={["이어폰·스피커를 바꿨을 때", "블루투스로 연결했을 때", "다른 기기로 할 때"]}
        />
      ),
      body: (
        <>
          소리 나는 장치가 바뀌면 늦는 정도도 바뀌어요. 설정의 <B>싱크 맞추기</B>로 다시 하거나,
          3단계만 다시 해도 충분해요.
        </>
      ),
    },
    {
      title: "내 취향대로 설정",
      image: rhythmSettings,
      body: (
        <>
          노트 속도·싱크·볼륨·타격음·스킨을 바꿀 수 있어요. <B>레인 배치</B>(미러·랜덤)와{" "}
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
          <B>음악 싱크</B>: 소리가 귀에 늦게 도착하는 만큼(블루투스 이어폰 등). 소리가 늦게 들리면
          +.
        </>,
        <>
          <B>타격 싱크</B>: 내 손이 늘 늦거나 빠르게 누르는 버릇. 늘 늦게 친다 싶으면 +.
        </>,
        <>
          처음 순서: 안내창의 <B>지금 맞추기</B> → 1단계 노트 속도 → 2단계 화면만 보고 치기(타격
          싱크) → 3단계 소리만 듣고 치기(음악 싱크).
        </>,
        <>
          자동 보정: 한 곡을 고르게 쳤는데 평균이 10ms 넘게 한쪽으로 쏠리면 결과 화면에서 맞출지
          물어봐요 (한 번에 최대 ±120ms).
        </>,
        <>일시정지 화면에서도 지금까지 평균을 보고 바로 타격 싱크에 적용할 수 있어요.</>,
        <>이어폰·스피커·기기를 바꾸면 설정의 싱크 맞추기로 다시 맞춰 주세요.</>,
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
