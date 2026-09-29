"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { useAuth } from "@/lib/AuthContext";
import Faded from "@/components/Faded";

const input =
  "w-full rounded-lg border border-white/10 bg-[#15171c] px-4 py-2.5 font-['Nanum_Gothic',sans-serif] text-sm text-white placeholder:text-white/30 transition-colors focus:border-[#6C63FF]/60 focus:outline-none";
const primaryBtn =
  "w-full cursor-pointer rounded-full bg-[#6C63FF] px-5 py-2.5 font-mono text-sm text-white transition-colors hover:bg-[#5b52f0] disabled:cursor-not-allowed disabled:opacity-40";
const linkBtn =
  "flex items-center justify-between rounded-lg border border-white/10 px-4 py-2.5 font-['Nanum_Gothic',sans-serif] text-sm text-white/75 transition-colors hover:border-[#6C63FF]/50 hover:text-white";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <Faded>
      <div className="mx-auto flex max-w-sm flex-col px-6 pt-20 pb-28">
        <div className="mb-2 font-mono text-sm text-[#8B84FF]">admin</div>
        <div className="rounded-2xl border border-white/10 bg-[#1C1E24] p-6 shadow-[0_20px_40px_-20px_rgba(0,0,0,.8)] sm:p-7">
          {children}
        </div>
      </div>
    </Faded>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/study");
    } catch (err) {
      console.error(err);
      setError("이메일 또는 비밀번호를 확인해주세요.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="pt-24 text-center font-mono text-sm text-white/40">확인 중…</p>;
  }

  if (user) {
    return (
      <Card>
        <h1 className="font-mono text-lg font-bold text-white">로그인됨</h1>
        <p className="mt-1 mb-6 truncate font-mono text-xs text-white/40">{user.email}</p>
        <div className="flex flex-col gap-2">
          <Link href="/study/write/" className={linkBtn}>
            새 글 쓰기 <span className="text-white/30">→</span>
          </Link>
          <Link href="/study/" className={linkBtn}>
            개인공부 목록 <span className="text-white/30">→</span>
          </Link>
          <Link href="/study/import/" className={linkBtn}>
            개인공부 일괄 등록 · 날짜 맞춤 <span className="text-white/30">→</span>
          </Link>
          <Link href="/guest/" className={linkBtn}>
            방명록 관리 <span className="text-white/30">→</span>
          </Link>
        </div>
        <button
          type="button"
          onClick={() => signOut(auth)}
          className="mt-6 w-full cursor-pointer rounded-full border border-white/15 px-5 py-2.5 font-mono text-sm text-white/60 transition-colors hover:border-red-400/60 hover:text-red-300"
        >
          로그아웃
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="font-mono text-lg font-bold text-white">관리자 로그인</h1>
      <p className="mt-1 mb-6 font-['Nanum_Gothic',sans-serif] text-xs text-white/40">
        글 작성·방명록 관리는 관리자만 할 수 있어요.
      </p>
      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input
          type="email"
          autoComplete="username"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
        {error && <p className="font-mono text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !email || !password}
          className={`${primaryBtn} mt-2`}
        >
          {submitting ? "로그인 중…" : "로그인"}
        </button>
      </form>
    </Card>
  );
}
