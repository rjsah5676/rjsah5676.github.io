"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function WriteButton() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <div style={{ position: "fixed", bottom: "20px", left: "20px" }}>
      {user ? (
        <button style={{ cursor: "pointer" }} onClick={() => router.push("/study/write")}>
          ✏️ 글쓰기
        </button>
      ) : (
        <button style={{ cursor: "pointer" }} onClick={() => router.push("/admin/login")}>
          🔒 로그인
        </button>
      )}
    </div>
  );
}
