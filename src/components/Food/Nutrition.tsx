import { DAILY, fmt, MACRO_COLORS, macroRatio, NUTRIENTS, type Amounts } from "@/lib/food";

/** 탄·단·지 칼로리 비율 도넛 (서버·클라이언트 공용) */
export function MacroDonut({ a, size = 150 }: { a: Amounts; size?: number }) {
  const r = macroRatio(a);
  const R = 15.9155; // 둘레 100
  let acc = 0;
  const segs = r
    ? (["carb", "protein", "fat"] as const).map((k) => {
        const seg = { k, len: r[k] * 100, off: 25 - acc };
        acc += r[k] * 100;
        return seg;
      })
    : [];
  return (
    <div className="flex items-center gap-4 sm:gap-5">
      <svg
        viewBox="0 0 42 42"
        style={{ width: `min(${size}px, 34vw)`, height: "auto" }}
        className="shrink-0"
        role="img"
        aria-label="탄단지 비율"
      >
        <circle cx="21" cy="21" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
        {segs.map((s) => (
          <circle
            key={s.k}
            cx="21"
            cy="21"
            r={R}
            fill="none"
            stroke={MACRO_COLORS[s.k]}
            strokeWidth="6"
            strokeDasharray={`${Math.max(0, s.len - 0.6)} ${100 - Math.max(0, s.len - 0.6)}`}
            strokeDashoffset={s.off}
          />
        ))}
        <text
          x="21"
          y="20.5"
          textAnchor="middle"
          className="fill-white font-mono"
          fontSize="6"
          fontWeight="700"
        >
          {Math.round(a.kcal).toLocaleString("ko-KR")}
        </text>
        <text x="21" y="26" textAnchor="middle" className="fill-white/45 font-mono" fontSize="3">
          kcal
        </text>
      </svg>
      <ul className="space-y-1.5 font-mono text-xs">
        {(
          [
            ["carb", "탄수화물"],
            ["protein", "단백질"],
            ["fat", "지방"],
          ] as const
        ).map(([k, label]) => (
          <li key={k} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: MACRO_COLORS[k] }} />
            <span className="w-14 text-white/60">{label}</span>
            <span className="w-10 text-right text-white">
              {r ? `${Math.round(r[k] * 100)}%` : "-"}
            </span>
            <span className="hidden text-white/35 min-[400px]:inline">{fmt(a[k])}g</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 영양성분표 + 1일 기준치 대비 % */
export function NutrientTable({ a }: { a: Amounts }) {
  return (
    <table className="w-full font-mono text-xs">
      <tbody>
        {NUTRIENTS.map((n) => {
          const v = a[n.key];
          const pct = v === null ? null : (v / DAILY[n.key]) * 100;
          const sub = n.label.startsWith(" ");
          return (
            <tr key={n.key} className="border-t border-white/5">
              <td className={`py-1.5 ${sub ? "pl-4 text-white/45" : "text-white/75"}`}>
                {n.label.trim()}
              </td>
              <td className="py-1.5 text-right text-white">
                {fmt(v)}
                <span className="ml-0.5 text-white/35">{n.unit}</span>
              </td>
              <td className="w-24 py-1.5 pl-3">
                {pct !== null && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${pct > 100 ? "bg-red-400" : "bg-[#6C63FF]"}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-[10px] text-white/40">
                      {Math.round(pct)}%
                    </span>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
