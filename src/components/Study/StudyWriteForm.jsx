"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { getStudyPost, addStudyPost, updateStudyPost } from "@/firestore/studyPosts";
import { useAuth } from "@/lib/AuthContext";
import "react-quill-new/dist/quill.snow.css";

// react-quill(-new)은 내부적으로 document를 직접 참조해서 SSR/정적 export 빌드 중에
// 실행되면 안 됨 -> ssr:false로 클라이언트에서만 로드
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

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

export default function StudyWriteForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const postId = searchParams.get("id");
  const isEdit = !!postId;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Java");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/admin/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const fetchPost = async () => {
      if (postId) {
        try {
          const post = await getStudyPost(postId);
          if (post) {
            setTitle(post.title);
            setCategory(post.category);
            setContent(post.content);
          } else {
            alert("글을 찾을 수 없습니다.");
            router.replace("/study");
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    fetchPost();
  }, [postId, router]);

  const submitPost = async () => {
    if (title === "" || content === "") {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;

    try {
      if (isEdit) {
        await updateStudyPost(postId, { title, content, category, date: formattedDate });
        alert("글이 수정되었습니다!");
      } else {
        await addStudyPost({ title, content, category, date: formattedDate });
        alert("글이 저장되었습니다!");
      }

      router.push("/study");
    } catch (err) {
      console.error(err);
      alert("저장 중 오류 발생");
    }
  };

  if (loading || !user) {
    return <div style={{ padding: "2rem", color: "white" }}>확인 중...</div>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ color: "white" }}>{isEdit ? "✏️ 글 수정" : "✏️ 글쓰기"}</h2>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", padding: "0.5rem" }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <ReactQuill
        value={content}
        onChange={setContent}
        placeholder="내용을 입력하세요..."
        style={{ minHeight: "300px", marginBottom: "1rem", background: "white" }}
        modules={{
          toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline", "strike"],
            ["link", "image"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["clean"],
          ],
        }}
      />

      <button
        onClick={submitPost}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#4a7b63",
          color: "white",
          border: "none",
        }}
      >
        {isEdit ? "수정하기" : "저장하기"}
      </button>
    </div>
  );
}
