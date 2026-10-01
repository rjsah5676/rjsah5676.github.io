"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useModal } from "@/components/Modal/ModalProvider";
import { STUDY_SEED } from "@/data/studySeed";
import {
  addStudyPost,
  deleteStudyPost,
  fetchStudyPostsLive,
  updateStudyPostMeta,
  sectionOf,
  type StudyPost,
} from "@/firestore/studyPosts";

export default function StudyImportPage() {
  const { user, loading } = useAuth();
  const modal = useModal();

  const [existing, setExisting] = useState<StudyPost[] | null>(null);
  // 기본은 "동기화": 같은 제목은 작성일만 맞추고(문서 id·URL 유지), 없는 글만 추가
  const [replaceAll, setReplaceAll] = useState(false);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      setExisting(await fetchStudyPostsLive());
    } catch (e) {
      console.error(e);
      setExisting([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 로그인 확인 후 1회 조회
    if (user) refresh();
  }, [user, refresh]);

  const existingByTitle = new Map((existing ?? []).map((p) => [p.title, p]));
  const existingTitles = new Set(existingByTitle.keys());
  const toAdd = replaceAll ? STUDY_SEED : STUDY_SEED.filter((s) => !existingTitles.has(s.title));
  const toRedate = replaceAll
    ? []
    : STUDY_SEED.flatMap((s) => {
        const cur = existingByTitle.get(s.title);
        const section = s.section ?? "study";
        return cur && (cur.date !== s.date || sectionOf(cur) !== section)
          ? [{ id: cur.id, title: s.title, date: s.date, section }]
          : [];
      });

  const run = async () => {
    const ok = await modal.confirm({
      title: "일괄 등록",
      message: replaceAll
        ? `기존 글 ${existing?.length ?? 0}개를 모두 삭제하고 ${STUDY_SEED.length}개를 새로 등록합니다. 삭제한 글은 복구할 수 없습니다.`
        : `새 글 ${toAdd.length}개를 등록하고, 기존 글 ${toRedate.length}개의 작성일·구분을 맞춥니다. (기존 글 주소는 그대로 유지)`,
      confirmText: replaceAll ? "삭제 후 등록" : "등록",
    });
    if (!ok) return;

    setRunning(true);
    const write = (line: string) => setLog((prev) => [...prev, line]);
    try {
      if (replaceAll) {
        for (const p of existing ?? []) {
          await deleteStudyPost(p.id);
          write(`삭제  ${p.title}`);
        }
      }
      for (const r of toRedate) {
        await updateStudyPostMeta(r.id, { date: r.date, section: r.section });
        write(`갱신  ${r.date}  ${r.section}  ${r.title}`);
      }
      for (const s of toAdd) {
        await addStudyPost(s);
        write(`등록  ${s.date}  [${s.category}] ${s.title}`);
      }
      write("완료");
      await refresh();
      await modal.alert({
        title: "등록 완료",
        message: "GitHub Actions에서 배포 워크플로를 수동 실행하면 사이트에 반영됩니다.",
      });
    } catch (e) {
      console.error(e);
      write(`실패: ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="px-6 py-16 text-center text-white/50">확인 중...</div>;

  if (!user) {
    return (
      <div className="px-6 py-16 text-center font-['Nanum_Gothic',sans-serif] text-white/60">
        관리자 로그인이 필요합니다.{" "}
        <Link href="/admin/login/" className="text-[#8B84FF] underline">
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pt-16 pb-24">
      <h1 className="mb-2 font-mono text-xl font-bold text-white">개인공부 일괄 등록</h1>
      <p className="mb-8 font-['Nanum_Gothic',sans-serif] text-sm text-white/50">
        현재 Firestore 글 {existing === null ? "…" : `${existing.length}개`} · 등록할 글{" "}
        {STUDY_SEED.length}개
      </p>

      <ul className="mb-6 overflow-hidden rounded-xl border border-white/10">
        {STUDY_SEED.map((s, i) => {
          const dup = existingTitles.has(s.title);
          return (
            <li
              key={s.title}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm ${i > 0 ? "border-t border-white/5" : ""}`}
            >
              <span className="w-24 flex-shrink-0 font-mono text-xs text-[#8B84FF]">
                {s.category}
              </span>
              <span className="flex-1 truncate font-['Nanum_Gothic',sans-serif] text-white/80">
                {s.title}
              </span>
              <span className="hidden flex-shrink-0 font-mono text-[11px] text-white/35 sm:inline">
                {s.date.split(" ")[0]}
              </span>
              {dup && <span className="font-mono text-[11px] text-amber-300/70">이미 있음</span>}
            </li>
          );
        })}
      </ul>

      <label className="mb-6 flex cursor-pointer items-center gap-2 font-['Nanum_Gothic',sans-serif] text-sm text-white/70">
        <input
          type="checkbox"
          checked={replaceAll}
          onChange={(e) => setReplaceAll(e.target.checked)}
          className="h-4 w-4 accent-[#6C63FF]"
        />
        기존 글을 모두 삭제하고 새로 등록 (글 주소가 바뀌니 주의, 해제하면 같은 제목은 작성일만
        맞춤)
      </label>

      <button
        type="button"
        disabled={running || existing === null || (toAdd.length === 0 && toRedate.length === 0)}
        onClick={run}
        className="cursor-pointer rounded-full bg-[#6C63FF] px-6 py-2.5 font-mono text-sm text-white transition-colors hover:bg-[#5b52f0] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {running
          ? "진행 중…"
          : replaceAll
            ? "삭제 후 등록"
            : `${toAdd.length}개 등록 · ${toRedate.length}개 날짜 맞춤`}
      </button>

      {log.length > 0 && (
        <pre className="mt-8 max-h-72 overflow-auto rounded-xl border border-white/10 bg-[#1C1E24] p-4 font-mono text-xs leading-6 text-white/60">
          {log.join("\n")}
        </pre>
      )}
    </div>
  );
}
