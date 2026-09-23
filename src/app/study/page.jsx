"use client";

import { useState, useEffect } from "react";
import { getStudyPostsByCategory, getStudyPost } from "@/firestore/studyPosts";
import WriteButton from "@/components/Study/WriteButton";
import DeleteButton from "@/components/Study/DeleteButton";
import EditButton from "@/components/Study/EditButton";
import "@/css/Page/study.css";

const categories = [
  "Java",
  "Network",
  "Database",
  "Frontend",
  "Backend",
  "Algorithm",
  "Next/Express",
  "etc",
];

export default function StudyPage() {
  const [selectedCategory, setSelectedCategory] = useState("Java");
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      const newPosts = await getStudyPostsByCategory(selectedCategory);
      setPosts(newPosts);

      if (newPosts.length > 0) {
        const firstPost = await getStudyPost(newPosts[0].id);
        setSelectedPost(firstPost);
      } else {
        setSelectedPost(null);
      }
    };

    fetchPosts();
  }, [selectedCategory]);

  const handleClickPost = async (id) => {
    const post = await getStudyPost(id);
    if (post) {
      setSelectedPost(post);
      setIsMenuOpen(false);
    } else {
      alert("해당 글을 찾을 수 없습니다.");
    }
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
        <div className="mb-4 font-mono text-sm text-[#8B84FF]">분류</div>
        <ul className="flex flex-col gap-1">
          {categories.map((cat) => (
            <li key={cat}>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setIsMenuOpen(false);
                }}
                className={`w-full cursor-pointer rounded px-2 py-1.5 text-left font-mono text-sm transition-colors ${
                  selectedCategory === cat
                    ? "text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {cat}
              </button>

              {selectedCategory === cat && posts.length > 0 && (
                <ul className="mt-1 mb-2 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                  {posts.map((post) => (
                    <li key={post.id}>
                      <button
                        type="button"
                        onClick={() => handleClickPost(post.id)}
                        className={`w-full cursor-pointer truncate rounded px-2 py-1 text-left font-['Nanum_Gothic',sans-serif] text-sm transition-colors ${
                          selectedPost?.id === post.id
                            ? "text-[#8B84FF]"
                            : "text-white/50 hover:text-white/80"
                        }`}
                      >
                        {post.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <section className="min-w-0 flex-1">
        {selectedPost ? (
          <div>
            <h2 className="font-mono text-xl font-bold text-white sm:text-2xl">
              {selectedPost.title}
            </h2>
            <div
              dangerouslySetInnerHTML={{ __html: selectedPost.content }}
              className="quill-content mt-6 leading-relaxed text-white/80 [word-break:break-word]"
            />
            <div className="mt-8 flex gap-3">
              <EditButton post={selectedPost} />
              <DeleteButton
                postId={selectedPost.id}
                onDeleteSuccess={() => setSelectedPost(null)}
              />
            </div>
          </div>
        ) : (
          <>
            <h2 className="font-mono text-xl font-bold text-white sm:text-2xl">
              {selectedCategory}
            </h2>
            <p className="mt-3 font-['Nanum_Gothic',sans-serif] text-white/50">
              {selectedCategory} 관련 글들을 왼쪽에서 선택하세요.
            </p>
          </>
        )}
      </section>

      <WriteButton />
    </div>
  );
}
