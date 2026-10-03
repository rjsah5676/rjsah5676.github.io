import type { ReactNode } from "react";

/** 게임 가이드 내용 (src/data/gameGuides.tsx) */
export interface GuideDoc {
  /** 한두 문장 소개 */
  lead: ReactNode;
  /** 한눈에 보는 요약 칩 (예: ["⏱ 약 2분", "👤 혼자"]) */
  facts?: string[];
  sections: { icon: string; title: string; items: ReactNode[] }[];
  /** 맨 아래 작은 글씨 (크레딧 등) */
  foot?: ReactNode;
}

/** 키보드 키 표시 */
export function K({ children }: { children: ReactNode }) {
  return (
    <kbd className="mx-0.5 inline-flex min-w-[1.6em] items-center justify-center rounded-md border border-white/20 border-b-[3px] bg-white/[0.06] px-1.5 py-px font-mono text-[11px] leading-tight text-white/90">
      {children}
    </kbd>
  );
}

/** 강조 */
export function B({ children }: { children: ReactNode }) {
  return <b className="font-bold text-white/95">{children}</b>;
}

export default function GuideView({ doc, accent }: { doc: GuideDoc; accent: string }) {
  return (
    <div className="flex flex-col gap-4 text-[13.5px] leading-relaxed">
      <p className="text-white/75">{doc.lead}</p>
      {doc.facts && (
        <div className="flex flex-wrap gap-1.5">
          {doc.facts.map((f) => (
            <span
              key={f}
              className="rounded-full border px-2.5 py-0.5 text-xs text-white/75"
              style={{ borderColor: `${accent}44`, background: `${accent}12` }}
            >
              {f}
            </span>
          ))}
        </div>
      )}
      {doc.sections.map((s) => (
        <section
          key={s.title}
          className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5"
        >
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-lg text-sm"
              style={{ background: `${accent}22` }}
              aria-hidden
            >
              {s.icon}
            </span>
            {s.title}
          </h3>
          <ul className="flex flex-col gap-1.5">
            {s.items.map((it, i) => (
              <li key={i} className="flex gap-2 text-white/70">
                <span
                  className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full"
                  style={{ background: accent }}
                  aria-hidden
                />
                <span className="min-w-0">{it}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {doc.foot && <p className="text-[11px] text-white/30">{doc.foot}</p>}
    </div>
  );
}
