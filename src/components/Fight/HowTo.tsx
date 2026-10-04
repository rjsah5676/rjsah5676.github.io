/**
 * 판 아래 조작·기술 설명 (선택 화면·경기 중 공용) — 키는 칸으로, 기술은 이름 + 한 줄 설명으로 나눠서 읽기 쉽게.
 * 경기 중엔 지금 싸우는 두 캐릭터의 기술도 보여 줌.
 */
import { CHARS } from "@/lib/fight/chars";

const KR = "font-['Nanum_Gothic',sans-serif]";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.6em] items-center justify-center rounded border border-white/20 border-b-white/35 bg-white/[0.07] px-1 py-px font-mono text-[10.5px] leading-tight text-white/85">
      {children}
    </kbd>
  );
}

type Row = [string, React.ReactNode, React.ReactNode?];
const k = (...ks: string[]) => (
  <span className="inline-flex flex-wrap items-center gap-0.5">
    {ks.map((x, i) => (x === "/" ? <span key={i} className="px-0.5 text-white/30">/</span> : <Kbd key={i}>{x}</Kbd>))}
  </span>
);

const TECH: [string, string][] = [
  ["연속기", "약은 4단, 발차기는 2단까지 이어져요. 마지막 동작은 세지만 빈틈이 커서 막히면 반격당해요"],
  ["캔슬", "맞히는 중에 아이덴티티(L)·필살기(I)를 누르면 바로 이어 나가요"],
  ["잡기", "약+발차기 동시 — 가드를 뚫고 위로 띄워요. 잡힌 직후 약+발차기로 풀 수 있어요"],
  ["가드 반격", "막는 중이나 막은 직후 발차기 — 게이지 25를 쓰고 상대를 띄워요"],
  ["저스트 가드", "맞기 직전에 가드 — 경직 절반, 깎임 없음, 게이지 +"],
  ["띄우기 콤보", "띄운 뒤 바로 점프(미리 눌러도 됨) → 공중 약·발차기 → 2단 점프로 한 번 더"],
  ["카운터", "상대가 기술을 내는 중이거나 대시 중에 맞히면 1.25배, 경직도 길어요"],
];

/** 상태 이상: [이름, 누가, 색, 설명] */
const STATUS: [string, string, string, string][] = [
  ["화상", "이그나", "#FF8A3D", "화염구·업화주에 맞으면 한동안 체력이 조금씩 닳아요 (화상으로는 안 쓰러짐)"],
  ["감전", "제나", "#FDE047", "뇌창·천뢰강림에 맞으면 잠깐 몸이 굳고, 한동안 느려지며 제나에게 더 아프게 맞아요"],
  ["방울", "릴리", "#7DD3FC", "비눗방울에 맞으면 갇혀서 둥실 떠요 — 버튼 연타로 빨리 탈출, 맞으면 터져요"],
];

export default function HowTo({ mode, chars }: { mode: "ai" | "2p" | "online"; chars?: [number, number] }) {
  const two = mode === "2p";
  const rows: Row[] = two
    ? [
        ["이동 (두 번 = 대시)", k("A", "D"), k("←", "→")],
        ["점프 (2단)", k("W", "/", "Space"), k("↑", "/", "Enter")],
        ["가드", k("S"), k("↓")],
        ["약", k("F"), k(",")],
        ["발차기", k("G"), k(".")],
        ["아이덴티티", k("H"), k(";")],
        ["필살기 (MAX)", k("T"), k("'")],
      ]
    : [
        ["이동 (두 번 = 대시)", k("A", "D"), k("←", "→")],
        ["점프 (2단)", k("W", "/", "Space"), k("↑")],
        ["가드", k("S"), k("↓")],
        ["약", k("J"), k("Z")],
        ["발차기", k("K"), k("X")],
        ["아이덴티티", k("L"), k("C")],
        ["필살기 (MAX)", k("I"), k("V")],
      ];
  return (
    <div className={`mt-3 grid gap-3 rounded-lg bg-black/20 px-3 py-3 ${KR} text-[11.5px] leading-relaxed text-white/60 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]`}>
      {/* 키 */}
      <div>
        <div className="mb-1.5 grid grid-cols-[1fr_auto_auto] items-center gap-x-2 text-[10.5px] text-white/35">
          <span>조작</span>
          <span className="w-20 text-center">{two ? "1P" : "기본"}</span>
          <span className="w-16 text-center">{two ? "2P" : "또는"}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-2 gap-y-1">
          {rows.map(([label, a, b]) => (
            <div key={label} className="contents">
              <span className="whitespace-nowrap text-white/65">{label}</span>
              <span className="flex w-20 justify-center">{a}</span>
              <span className="flex w-16 justify-center">{b}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[10.5px] text-white/35">
          {mode === "online" ? "온라인은 멈추지 않아요 · Esc 메뉴" : "Esc·P 일시정지"} · 게임패드·휴대폰 화면 버튼도 돼요
        </div>
      </div>
      {/* 기술 */}
      <div className="min-w-0">
        {chars && (
          <div className="mb-2.5 grid gap-2 sm:grid-cols-2">
            {chars.map((ci, i) => {
              const c = CHARS[ci];
              return (
                <div key={i} className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="rounded px-1 font-mono text-[10px] font-bold text-white" style={{ background: i === 0 ? "#3B82F6" : "#F43F5E" }}>
                      {i === 0 ? "1P" : "2P"}
                    </span>
                    <b className="text-[12px]" style={{ color: c.color }}>
                      {c.name}
                    </b>
                  </div>
                  <p>
                    <b className="text-[#FDE047]/85">L {c.idName}</b> {c.idDesc}
                  </p>
                  <p>
                    <b className="text-[#FDE047]/60">점프 중 L</b> {c.airDesc}
                  </p>
                  <p>
                    <b className="text-[#22D3EE]/85">I {c.ultName}</b> {c.ultDesc}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          {TECH.map(([t, d]) => (
            <div key={t} className="flex gap-2">
              <dt className="w-[4.6rem] shrink-0 font-bold text-white/75">{t}</dt>
              <dd className="min-w-0 break-keep">{d}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-2.5 border-t border-white/10 pt-2">
          <div className="mb-1 text-[10.5px] text-white/35">상태 이상</div>
          <div className="grid gap-1">
            {STATUS.map(([n, who, col, d]) => (
              <div key={n} className="flex items-start gap-2">
                <span
                  className="mt-px shrink-0 rounded px-1.5 text-[10.5px] font-bold text-black"
                  style={{ background: col }}
                >
                  {n}
                </span>
                <span className="w-9 shrink-0 text-white/45">{who}</span>
                <span className="min-w-0 break-keep">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
