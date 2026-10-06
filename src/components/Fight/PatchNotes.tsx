/**
 * 패치노트 — 메인 화면 오른쪽 위 버튼 → 모달. 맨 위가 최신. 패치마다 10줄 안으로.
 * 새 패치는 PATCHES 맨 앞에 추가.
 */
import { useEffect } from "react";
import { keyText } from "./KeyCap";

const KR = "font-['Nanum_Gothic',sans-serif]";

export interface Patch {
  ver: string;
  name: string;
  date: string;
  lines: string[];
}

export const PATCHES: Patch[] = [
  {
    ver: "v0.4",
    name: "10.06 패치",
    date: "2026.10.06",
    lines: [
      "카이 — L 질풍권이 맞으면 상대를 높이 띄워요(2타째가 띄운 상대를 다시 끌어내리던 문제 수정, 공중 질풍권도 같음) → 바로 점프해 공중 콤보 (대신 피해 78→56, 재사용 2.3초→3.2초, 체력 1350→1250)",
      "카이 — 공중 I 천풍난무가 그 높이에서 버티며 6연타 (예전엔 금방 땅으로 내려옴)",
      "건모 — L Ctrl+A 범위 크게(앞 96→120px, 위로는 점프한 상대까지), ⏸ 일시정지 0.8초→1초, 후딜 26→22프레임. 대신 끌어오기는 뺌(소영과 겹쳐서)",
      "건모 — 공중 L Alt+Tab 범위 크게(아래쪽까지), 자리를 바꾼 뒤 상대를 바로 앞까지 끌어오고, 건모는 바뀐 상대 높이까지만 솟고(전엔 더 높이 솟아 지나침), 아래에서 위의 상대를 맞혀도 상대 높이로 와요. 💫 혼란이 길어지고(24→46프레임) 건모도 그동안 천천히 떨어져서 바로 공중 J · K 로 이어 쳐요",
      "일시정지 화면 새로 — 게임 화면 안에서 계속 · 다시하기 · 캐릭터 선택 · 메뉴로(↑↓ · Enter), 효과음 · 배경음악 · 소리 끄기 · 전체화면 설정",
      "메인 화면 ⚙ 설정 — 같은 설정을 메인에서도 (휴대폰은 이동 조작 스틱 · 키도)",
      "온라인 관전 뺌 — 따라잡을 때 너무 무겁고 끊겨서. 꽉 찬 방·대전 중인 방은 못 들어가요",
    ],
  },
  {
    ver: "v0.3",
    name: "10.05 패치",
    date: "2026.10.05",
    lines: [
      "새 캐릭터 건모(디버거) — L Ctrl+A 박스로 눈앞까지 끌어와 ⏸ 일시정지, 공중 L Alt+Tab으로 자리 바꿔 💫 혼란, I 금요일 배포",
      "새 맵 — 천공 구름길(구름 발판 9개), 달밤 마천루(2단 점프 + 공중 대시로 건너는 두 건물). 맵별 새 배경음악",
      "HUD 새 디자인 — 금테 체력바, 육각 시계, 라운드·K.O.·승리 배너, L 기술 아이콘",
      "공중 콤보 — 점프마다 J 4번 + K 2번(2단 점프하면 다시), 기술을 섞어 맞히면 더 아프고 같은 것만 반복하면 덜 아파요. 공중 ↓ + K 마무리 내려찍기(점프마다 1번, 발차기 횟수와 따로)로 바닥에 꽂아 다운. 띄워진 지 2초가 지나면 점점 빨리 떨어져요",
      "점프 우선 — J · K 공격 중에도 점프가 바로 나가요 (L · I 는 끝나자마자)",
      "다운 공격 — 누운 상대도 맞아요 (못 막음, 피해 절반). J + K 로 잡으면 다시 띄워요",
      "효과음 — 캐릭터별 L · I 소리, 화상·감전·방울 소리",
      "밸런스 — 돌진 잡기 추가(대시 중 J + K, 게이지 25: 막고 기다리는 상대를 멀리서 잡음) / 소영: 공중 L 이 바로 아래부터 앞쪽 사선 아래까지 / 카이: 공중 필살기가 착지해도 끊기지 않음 / 릴리: 방울에 갇힌 상대를 때려 터뜨리면 +20 피해, 갇힌 상대도 잡기 가능 / 감전된 상대도 잡기 가능 / 이그나: 발차기 K 발동 2프레임 느려지고 막혔을 때 이득 2프레임 줄임 / 카이: 질풍권 재사용 2.5초→2.3초",
      "AI — 달인 반응·가드·대공 강화 (고수 상대 승률 55%→77%), 낭떠러지 건너기, 누운 상대 공격",
      "기타 — 온라인 관전(꽉 찬 방·대전 중인 방, 중간에 들어가도 따라잡음), 휴대폰 조작 새로(전체화면에서도 화면 위 버튼, 이동은 스틱·키 중 선택), 결과 화면 새 디자인(AI전 승리 시 게임 화면 안에서 바로 랭킹 등록, 전체화면 포함), 떨어진 바로 그 자리 화면 꼭대기에서 다시 등장, 온라인 ‘한 판 더’에서 방장은 준비가 풀린 채로",
    ],
  },
  {
    ver: "v0.2",
    name: "베타",
    date: "2026.10.04",
    lines: [
      "새 캐릭터 소영(채찍)·릴리(우산·물)·제나(번개 창), 새 맵 노을 옥상",
      "모든 캐릭터 그림 교체 — 동작별 애니메이션·이펙트·프로필·전신 그림",
      "격투 시스템 — 잡기 J + K, 가드 반격, 저스트 가드, 카운터 히트",
      "띄우기 공중 콤보(점프 캔슬), 상태 이상: 화상·감전·방울 가두기",
      "온라인 대전 — 로비·대기실·P2P 롤백 넷코드(안 되면 중계)",
      "8bit 효과음, 메인 화면 새 디자인, 전체화면, 승리 포즈·도발 대사",
      "조작감 — 방향키 우선, 가드 중 입력 바로 실행, 기술 아이콘·가이드",
    ],
  },
  {
    ver: "v0.1",
    name: "알파",
    date: "2026.10.03",
    lines: [
      "픽셀 격투 첫 공개 — 1:1 플랫폼 대전",
      "카이(바람 주먹)·이그나(불꽃), 맵 운해 학당",
      "AI 대전 6단계 + 랭킹, 한 키보드 2인 대전, 게임패드·휴대폰 터치",
      "약 J 4단·발차기 K 2단 연속기, 대시·2단 점프·공중 공격",
      "아이덴티티 L · 필살기 I, 떨어지면 체력이 깎이고 다시 등장",
      "캐릭터·맵 선택 화면, 맵별 배경음악",
    ],
  },
];

/** 메인 화면 버튼에 쓰는 최신 패치 표시 */
export const LATEST = PATCHES[0];

export default function PatchNotes({ onClose }: { onClose: () => void }) {
  // 열린 동안엔 키 입력을 메뉴로 안 보냄 (Esc·Enter·J·Space = 닫기)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (["Escape", "Enter", "Space", "KeyJ", "Backspace"].includes(e.code)) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-[2px] [animation:modal-fade_150ms_ease-out]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${KR} relative flex max-h-[86%] w-[64cqw] flex-col rounded-[1cqw] bg-[linear-gradient(180deg,#F2C35B,#9A6A1E)] p-[0.25cqw] shadow-[0_1cqw_3cqw_rgba(0,0,0,0.6)] [animation:modal-pop_200ms_ease-out]`}
      >
        <div className="flex min-h-0 flex-col rounded-[0.8cqw] bg-[linear-gradient(180deg,#2B1840,#140A22)]">
          <div className="flex items-center justify-between border-b border-[#F2C35B]/30 px-[2cqw] py-[1.2cqw]">
            <span className="font-['Black_Han_Sans',sans-serif] text-[2.4cqw] tracking-wide text-[#FFE9A8] [text-shadow:0_0.2cqw_0_#12081F]">
              패치노트
            </span>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full bg-white/10 px-[1.2cqw] py-[0.3cqw] text-[1.2cqw] text-white/75 hover:bg-white/20"
            >
              닫기 ✕
            </button>
          </div>
          <div className="gold-scroll min-h-0 overflow-y-auto px-[2cqw] py-[1.4cqw]">
            {PATCHES.map((p, i) => (
              <section
                key={p.ver}
                className={i > 0 ? "mt-[1.8cqw] border-t border-white/10 pt-[1.6cqw]" : ""}
              >
                <div className="mb-[0.8cqw] flex items-center gap-[0.8cqw]">
                  {i === 0 && (
                    <span className="rounded-[0.3cqw] bg-[#FF4F8B] px-[0.6cqw] py-[0.1cqw] text-[1cqw] font-extrabold text-white">
                      최신
                    </span>
                  )}
                  <span className="font-['Black_Han_Sans',sans-serif] text-[1.9cqw] text-white">
                    {p.ver} {p.name}
                  </span>
                  <span className="font-mono text-[1.15cqw] text-[#F2C35B]/80">{p.date}</span>
                </div>
                <ul className="flex flex-col gap-[0.45cqw]">
                  {p.lines.map((l, k) => (
                    <li
                      key={k}
                      className="flex gap-[0.7cqw] text-[1.25cqw] leading-snug break-keep text-white/85"
                    >
                      <span className="mt-[0.55cqw] h-[0.5cqw] w-[0.5cqw] shrink-0 rotate-45 bg-[#F2C35B]/80" />
                      <span>{keyText(l)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
