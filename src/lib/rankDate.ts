/**
 * 랭킹 달성 일자 표시용.
 * Firestore에서 읽은 createdAt(Timestamp)을 "26.10.03"으로. 예전 기록처럼 날짜가 없으면 "".
 */
export function toDate(v: unknown): Date | null {
  if (v && typeof (v as { toDate?: unknown }).toDate === "function")
    return (v as { toDate: () => Date }).toDate();
  return null;
}

export function rankDateLabel(d: Date | null | undefined): string {
  if (!d) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getFullYear() % 100)}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
