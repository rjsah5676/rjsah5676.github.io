"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SECTION_META,
  STUDY_CATEGORIES,
  postPath,
  type StudyPostListItem,
  type StudySection,
} from "@/firestore/studyPosts";

const isCategory = (v: string | null): v is string =>
  !!v && (STUDY_CATEGORIES as readonly string[]).includes(v);

function PostCard({ post, showCategory }: { post: StudyPostListItem; showCategory?: boolean }) {
  return (
    <Link
      href={postPath(post)}
      className="block rounded-xl border border-white/10 bg-[#1C1E24] p-5 transition-colors hover:border-[#6C63FF]/50"
    >
      <div className="mb-1 flex items-baseline justify-between gap-4">
        <h2 className="truncate font-mono font-medium text-white">{post.title}</h2>
        <span className="flex-shrink-0 font-mono text-xs text-white/30">
          {showCategory && <span className="mr-2 text-[#8B84FF]/70">{post.category}</span>}
          {post.date?.split(" ")[0]}
        </span>
      </div>
      {post.excerpt && (
        <p className="line-clamp-2 font-['Nanum_Gothic',sans-serif] text-sm text-white/50">
          {post.excerpt}
        </p>
      )}
    </Link>
  );
}

// 목록 데이터는 빌드 시점에 받아온 것(정적) — 새 글은 재배포 후 반영됨.
// useSearchParams를 쓰면 정적 export에서 이 컴포넌트 전체가 클라이언트 렌더링으로 빠져서
// HTML에 글 링크가 안 남음(SEO 손해) -> ?category는 마운트 후 location에서 읽음
export default function StudyBrowser({
  posts,
  section,
}: {
  posts: StudyPostListItem[];
  section: StudySection;
}) {
  const router = useRouter();
  const meta = SECTION_META[section];
  // 글이 있는 분류만 보여줌 (회고는 분류가 몇 개 안 됨)
  const categories = STUDY_CATEGORIES.filter((c) => posts.some((p) => p.category === c));
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0] ?? STUDY_CATEGORIES[0]
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [q, setQ] = useState("");

  // 공백으로 나눈 단어가 모두 들어있는 글 (제목·분류·본문)
  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = useMemo(
    () => (terms.length ? posts.filter((p) => terms.every((t) => p.searchText.includes(t))) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- terms는 q에서 파생
    [posts, q]
  );
  const searching = terms.length > 0;

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("category");
    if (!isCategory(fromUrl) || !posts.some((p) => p.category === fromUrl)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL 기반 초기값 동기화(마운트 1회)
    setSelectedCategory(fromUrl);
  }, [posts]);

  const selectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setIsMenuOpen(false);
    // 글 상세에서 "목록으로" 돌아올 때 카테고리 유지되게 URL에도 반영
    router.replace(`${meta.path}/?category=${encodeURIComponent(cat)}`, { scroll: false });
  };

  return (
    <div className="mx-auto flex max-w-4xl gap-8 px-6 pt-16 pb-24">
      {/* 모바일 사이드바 토글 */}
      <button
        type="button"
        onClick={() => setIsMenuOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#6C63FF] text-lg text-white shadow-lg md:hidden"
        aria-label="분류 메뉴 열기"
      >
        📄
      </button>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <nav
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 overflow-y-auto bg-[#121212] p-6 pt-20 transition-transform duration-300 md:sticky md:top-16 md:z-auto md:h-fit md:w-52 md:flex-shrink-0 md:translate-x-0 md:bg-transparent md:p-0 md:pt-0 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-1 font-mono text-sm text-[#8B84FF]">{meta.label}</div>
        <p className="mb-4 font-['Nanum_Gothic',sans-serif] text-xs leading-relaxed text-white/35">
          {meta.desc}
        </p>
        <ul className="flex flex-col gap-1">
          {categories.map((cat) => {
            const count = posts.filter((p) => p.category === cat).length;
            return (
              <li key={cat}>
                <button
                  type="button"
                  onClick={() => selectCategory(cat)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded px-2 py-1.5 text-left font-mono text-sm transition-colors ${
                    selectedCategory === cat ? "text-white" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {cat}
                  <span className="text-xs text-white/25">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="min-w-0 flex-1">
        <div className="relative mb-8">
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQ("")}
            placeholder="글 검색 (제목·본문)"
            aria-label={`${meta.label} 글 검색`}
            className="w-full rounded-full border border-white/10 bg-[#1C1E24] py-2.5 pr-10 pl-5 font-['Nanum_Gothic',sans-serif] text-sm text-white placeholder:text-white/30 focus:border-[#6C63FF]/50 focus:outline-none"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="검색어 지우기"
              className="absolute top-1/2 right-3 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full font-mono text-xs text-white/40 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {searching && (
          <div>
            <h1 className="mb-6 font-mono text-xl font-bold text-white sm:text-2xl">
              검색 결과 <span className="text-base text-white/40">{results.length}</span>
            </h1>
            {results.length === 0 ? (
              <p className="font-['Nanum_Gothic',sans-serif] text-white/50">
                &apos;{q.trim()}&apos;에 해당하는 글이 없습니다.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {results.map((post) => (
                  <li key={post.id}>
                    <PostCard post={post} showCategory />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 크롤러가 모든 글 링크를 볼 수 있게 카테고리별 목록을 전부 렌더하고 선택된 것만 보여줌 */}
        {posts.length === 0 && !searching && (
          <p className="font-['Nanum_Gothic',sans-serif] text-white/50">아직 글이 없습니다.</p>
        )}

        {categories.map((cat) => {
          const categoryPosts = posts.filter((p) => p.category === cat);
          return (
            <div key={cat} hidden={searching || cat !== selectedCategory}>
              <h1 className="mb-6 font-mono text-xl font-bold text-white sm:text-2xl">{cat}</h1>
              {categoryPosts.length === 0 ? (
                <p className="font-['Nanum_Gothic',sans-serif] text-white/50">
                  아직 {cat} 글이 없습니다.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {categoryPosts.map((post) => (
                    <li key={post.id}>
                      <PostCard post={post} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
