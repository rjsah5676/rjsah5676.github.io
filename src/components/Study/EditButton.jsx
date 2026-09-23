"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function EditButton({ post }) {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div style={{ marginTop: "1rem" }}>
      <button
        type="button"
        style={{
          backgroundColor: "#4a7b63",
          color: "white",
          cursor: "pointer",
          marginRight: "1rem",
        }}
        onClick={() => router.push(`/study/write?id=${post.id}`)}
      >
        ✏️ 글수정
      </button>
    </div>
  );
}
