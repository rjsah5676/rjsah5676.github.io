"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function WriteButton() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // 방문자에게는 아무것도 안 보이게 (관리자 로그인은 /admin/login/ 으로 직접 접근)
  if (loading || !user) return null;

  return (
    <button
      type="button"
      onClick={() => router.push("/study/write")}
      className="fixed right-6 bottom-6 z-40 cursor-pointer rounded-full bg-[#6C63FF] px-5 py-3 font-mono text-sm text-white shadow-lg transition-colors hover:bg-[#5b52f0]"
    >
      ✏️ 글쓰기
    </button>
  );
}
