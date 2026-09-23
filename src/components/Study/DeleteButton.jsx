"use client";

import { deleteStudyPost } from "@/firestore/studyPosts";
import { useAuth } from "@/lib/AuthContext";

export default function DeleteButton({ postId, onDeleteSuccess }) {
  const { user } = useAuth();

  if (!user) return null;

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteStudyPost(postId);
      alert("삭제 완료");
      onDeleteSuccess();
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류 발생");
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <button
        style={{ backgroundColor: "red", color: "white", cursor: "pointer" }}
        onClick={handleDelete}
      >
        🗑 글삭제
      </button>
    </div>
  );
}
