/**
 * BEAT DASH 패치노트 — 타이틀 화면 오른쪽 위 버튼 → 모달. 맨 위가 최신. 패치마다 10줄 안으로.
 * 새 패치는 PATCHES 맨 앞에 추가.
 */
import { useEffect } from "react";
import { sfx } from "@/lib/rhythm/sfx";

const KR = "font-['Nanum_Gothic',sans-serif]";
const DISP = "font-['Arial_Black','Segoe_UI_Black',Impact,sans-serif] font-black italic";

export interface Patch {
  ver: string;
  name: string;
  date: string;
  lines: string[];
}

export const PATCHES: Patch[] = [
  {
    ver: "v1.1",
    name: "채보 개편",
    date: "2026.10.06",
    lines: [
      "난이도 레벨 새 기준 — 쉬움 1~3 · 보통 4~6 · 어려움 7~11 · 매우 어려움 12~14 · 나이트메어 15~18 (내장곡은 정한 레벨에 맞춰 채보를 다시 뽑음, 내 음악도 같은 구간으로 생성)",
      "자동 채보 밀도 · 최소 간격 · 동시치기를 난이도별로 다시 맞춤 — 난이도마다 목표 레벨에 맞을 때까지 다시 뽑음",
      "동시치기 늘림 — 정박에 많이, 반박 · 16분으로 갈수록 적게. 센 타격엔 3개 동시치기도",
      "동시치기 모양 다양하게 — D+K · F+J 만 번갈아 나오던 것 줄이고, 바로 앞 줄과 겹치는 연타도 줄임",
      "롱노트 정리 — 노트의 3~5%만, 너무 짧은 건 빼고 최소 한 박(0.33초)부터, 정박 · 소리가 남는 자리부터 곡 전체에 고르게",
      "잭(바로 앞 줄과 같은 레인) 비율을 난이도별로 맞춤 — 쉬움 · 보통은 거의 없고, 어려울수록 늘어남",
      "동시치기 모양 — 한 손(D+F · J+K)과 양끝(D+K)이 자주, 가운데(F+J)는 덜",
      "쉬움 · 보통 개선 — 최소 간격을 박 단위로(쉬움 한 박, 보통 반 박), 소리가 나는데 오래 비는 자리는 박 위에 채움. 같은 레벨에서 노트가 더 고르고 덜 휑함. 보통은 동시치기를 5% 안팎으로 줄이고 그만큼 노트를 더 깖",
      "어려움 이상 리듬 고르게 — 8분 · 16분 · 셋잇단이 뒤섞여 간격이 갑자기 바뀌던 자리를 정리(사이에 박을 넣거나 약한 노트를 뺌). 같은 레벨에서 초견이 훨씬 편해짐",
      "노트 모양 기본값이 메탈로 — 예전에 저장된 설정도 한 번 메탈로 바뀜(설정에서 다시 고를 수 있음)",
      "마디선 — 마디 첫 박마다 가로줄이 노트와 같이 내려옴(박자에 맞게, 전보다 잘 보이게)",
      "게임 가이드: 다음 장으로 넘기면 맨 위부터 보이게",
      "모바일에서 곡 선택으로 넘어가도 메뉴 BGM이 계속 나오던 문제 수정",
      "내 음악 — 재킷(사진)을 눌러도 파일 고르기. 파일 고르는 동안 전체화면이 풀리는 브라우저면 고른 뒤 다시 전체화면으로",
      "내장곡 7곡 채보 새로 뽑음",
    ],
  },
  {
    ver: "v1.0",
    name: "BEAT DASH",
    date: "2026.10.05",
    lines: [
      "BEAT DASH로 새 출발 — 타이틀 · 곡 선택 · 설정 · 플레이 · 결과까지 16:9 화면 하나에서, 창모드와 전체화면이 같은 모양으로",
      "새 플레이 화면 — 네온 레인 틀, 판정 · 타격 · 콤보 링 이펙트, 은색 콤보, 카운트다운 연출, 효과음과 메뉴 BGM",
      "레인 위치 왼쪽 · 가운데 · 오른쪽, 노트 두께 3단계, 기본 노트 스킨은 메탈",
      "곡 선택 — 큰 재킷, 난이도 탭, 내 최고 기록과 곡별 TOP 10 랭킹, 입력하면 바로 걸러지는 곡 검색",
      "결과 화면 — 배너 · 랭크 엠블럼 · 점수 올라가는 연출, 화면 안에서 바로 랭킹 등록",
      "R 키 — 플레이 중 꾹 누르면 다시 시작, 일시정지 · 결과 화면에선 한 번",
      "신곡 Full Combo!! (180 BPM, 나이트메어 Lv18), 내장곡 7곡 채보를 새 규칙으로 다시 뽑음",
      "내 음악 — 미리 듣기, mp3 속 앨범 사진을 재킷으로, 곡마다 노트 색 랜덤",
      "휴대폰 — 플레이는 레인만 세로 화면 가득 (위에 점수 띠)",
      "기타 — 전체화면에서 Esc는 일시정지, 박자 번쩍임 약하게, 70% 미만 랭크는 F",
    ],
  },
  {
    ver: "v0.3",
    name: "자동 싱크",
    date: "2026.10.04",
    lines: [
      "자동 싱크 — 치는 동안 타이밍 쏠림을 재서 알아서 맞춤 (블루투스처럼 소리가 늦어도 몇 마디면 따라잡음)",
      "채보 패턴 다양화 — 모양 48가지, 같은 모양은 최대 2마디, 반복 구간은 좌우 반전",
      "New Dimension 나이트메어 (Lv17)",
      "곡 선택에서 곡 미리 듣기",
      "게임 가이드 5장으로 정리",
    ],
  },
  {
    ver: "v0.2",
    name: "자작곡 · 내 음악",
    date: "2026.10.03",
    lines: [
      "AI 자작곡 음원 + 내 mp3를 넣으면 자동으로 채보를 만들어 주는 모드 (파일은 서버로 안 올라감)",
      "보스곡 Monarch's Fall · Maximum Velocity, 나이트메어 난이도",
      "채보에 계단 · 연타 · 트릴 같은 손맛 패턴, 난이도 사이 최소 3레벨 차이",
      "곡 검색, 일시정지 화면에 점수 · 정확도 · 평균 타이밍과 '타격 싱크에 적용'",
      "휴대폰 — 화면 깜빡임 수정, 뒤로가기는 일시정지, 플레이 중 전체화면",
    ],
  },
  {
    ver: "v0.1",
    name: "첫 공개",
    date: "2026.09.30",
    lines: [
      "DFJK 4키 리듬게임 첫 공개 — 롱노트, 난이도 4단계, 곡 · 난이도별 랭킹",
      "READY → 3 · 2 · 1 → GO! 카운트다운, 일시정지 뒤 3초 카운트다운으로 재개",
      "노트 속도 · 싱크(±400ms, 1ms 단위) · 음악 볼륨, 플레이 중 ↑ ↓ 로 속도",
      "타격음 · 노트 스킨, 판정선 타격 이펙트, HP와 FAILED, 롱노트 누르는 동안 콤보",
      "휴대폰 터치 지원",
    ],
  },
];

/** 타이틀 버튼에 쓰는 최신 패치 표시 */
export const LATEST = PATCHES[0];

export default function PatchNotes({ onClose }: { onClose: () => void }) {
  // 열린 동안엔 키 입력을 메뉴로 안 보냄 (Esc · Enter · Space = 닫기)
  useEffect(() => {
    sfx("ui-open", 0.7);
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (["Escape", "Enter", "Space", "Backspace"].includes(e.code)) {
        e.preventDefault();
        sfx("ui-back", 0.7);
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-[#05030f]/75 backdrop-blur-[3px] [animation:modal-fade_150ms_ease-out]"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          sfx("ui-back", 0.7);
          onClose();
        }
      }}
    >
      <div
        className={`${KR} relative flex max-h-[86%] w-[64cqw] flex-col overflow-hidden rounded-[1.2cqw] border border-white/15 bg-[linear-gradient(160deg,#171431f5,#0b0a1cf8)] shadow-[0_0_4cqw_rgba(236,72,153,0.3)] [animation:modal-pop_200ms_ease-out]`}
      >
        <div className="absolute top-0 left-[2cqw] h-[0.3cqw] w-[8cqw] bg-[linear-gradient(90deg,#EC4899,#7C3AED)]" />
        <div className="flex items-center justify-between border-b border-white/10 px-[2.2cqw] py-[1.3cqw]">
          <span className={`${DISP} text-[2.4cqw] tracking-[0.08em] text-white`}>PATCH NOTES</span>
          <button
            type="button"
            onClick={() => {
              sfx("ui-back", 0.7);
              onClose();
            }}
            className="cursor-pointer rounded-[0.6cqw] border border-white/15 px-[1cqw] py-[0.35cqw] font-mono text-[1.1cqw] text-white/60 hover:border-white/40 hover:text-white"
          >
            닫기 (Esc)
          </button>
        </div>
        <div className="bd-scroll min-h-0 overflow-y-auto px-[2.2cqw] py-[1.4cqw]">
          {PATCHES.map((p, i) => (
            <section
              key={p.ver}
              className={i > 0 ? "mt-[1.8cqw] border-t border-white/10 pt-[1.6cqw]" : ""}
            >
              <div className="mb-[0.8cqw] flex items-center gap-[0.9cqw]">
                <span
                  className={`${DISP} -skew-x-12 rounded-[0.35cqw] px-[0.8cqw] py-[0.15cqw] text-[1.3cqw] text-white`}
                  style={{
                    background:
                      i === 0 ? "linear-gradient(90deg,#DB2777,#7C3AED)" : "rgba(255,255,255,0.1)",
                  }}
                >
                  <span className="inline-block skew-x-12">{p.ver}</span>
                </span>
                <span className="text-[1.7cqw] font-extrabold text-white">{p.name}</span>
                {i === 0 && (
                  <span className="rounded-[0.3cqw] bg-[#F472B6] px-[0.6cqw] py-[0.1cqw] text-[0.95cqw] font-extrabold text-white">
                    최신
                  </span>
                )}
                <span className="ml-auto font-mono text-[1.1cqw] text-white/45">{p.date}</span>
              </div>
              <ul className="flex flex-col gap-[0.5cqw]">
                {p.lines.map((l, k) => (
                  <li
                    key={k}
                    className="flex gap-[0.8cqw] text-[1.25cqw] leading-snug break-keep text-white/85"
                  >
                    <span className="mt-[0.55cqw] h-[0.5cqw] w-[0.5cqw] shrink-0 rotate-45 bg-[linear-gradient(135deg,#F472B6,#A78BFA)]" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
