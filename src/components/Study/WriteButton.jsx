"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function WriteButton() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <button
      type="button"
      onClick={() => router.push(user ? "/study/write" : "/admin/login")}
      className="fixed right-6 bottom-6 z-40 cursor-pointer rounded-full bg-[#6C63FF] px-5 py-3 font-mono text-sm text-white shadow-lg transition-colors hover:bg-[#5b52f0]"
    >
      {user ? "✏️ 글쓰기" : "🔒 로그인"}
    </button>
  );
}
