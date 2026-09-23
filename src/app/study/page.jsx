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
    <div className="study-container" style={{ display: "flex", minHeight: "80vh" }}>
      <button className="hamburger-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        📄
      </button>

      <nav
        style={{ borderRight: "1px solid #ddd", minWidth: "250px" }}
        className={isMenuOpen ? "open" : ""}
      >
        <h3 style={{ color: "white" }}>📚 분류</h3>
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {categories.map((cat) => (
            <li key={cat} style={{ marginBottom: "1rem" }}>
              <div
                onClick={() => {
                  setSelectedCategory(cat);
                  setIsMenuOpen(false);
                }}
                style={{
                  cursor: "pointer",
                  fontWeight: selectedCategory === cat ? "bold" : "normal",
                  color: selectedCategory === cat ? "#4a7b63" : "#ccc",
                }}
              >
                ▸ {cat}
              </div>

              {selectedCategory === cat && (
                <ul style={{ marginTop: "0.5rem", paddingLeft: "1rem" }}>
                  {posts.map((post) => (
                    <li
                      key={post.id}
                      style={{
                        color: selectedPost?.id === post.id ? "#fff" : "#aaa",
                        fontWeight: selectedPost?.id === post.id ? "bold" : "normal",
                        padding: "0.3rem 0.5rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleClickPost(post.id)}
                    >
                      - {post.title}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <section className="study-content-main">
        {selectedPost ? (
          <div>
            <h2>{selectedPost.title}</h2>
            <div
              dangerouslySetInnerHTML={{ __html: selectedPost.content }}
              style={{ marginTop: "1rem", wordBreak: "break-word" }}
              className="quill-content"
            />
            <div style={{ marginTop: "1rem" }}>
              <EditButton post={selectedPost} />
              <DeleteButton
                postId={selectedPost.id}
                onDeleteSuccess={() => setSelectedPost(null)}
              />
            </div>
          </div>
        ) : (
          <>
            <h2>{selectedCategory}</h2>
            <p>🔧 {selectedCategory} 관련 글들을 왼쪽에서 선택하세요.</p>
          </>
        )}
      </section>

      <WriteButton />
    </div>
  );
}
