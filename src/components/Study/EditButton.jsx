"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function EditButton({ post }) {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <button
      type="button"
      onClick={() => router.push(`/study/write?id=${post.id}`)}
      className="cursor-pointer rounded-full border border-white/10 px-4 py-2 font-mono text-sm text-white/70 transition-colors hover:border-[#6C63FF]/50 hover:text-white"
    >
      ✏️ 글수정
    </button>
  );
}
