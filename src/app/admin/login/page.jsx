"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import { useAuth } from "@/lib/AuthContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/study");
    } catch (err) {
      console.error(err);
      setError("로그인 실패: 이메일/비밀번호를 확인해주세요.");
    }
  };

  if (user) {
    return (
      <div style={{ padding: "2rem", color: "white" }}>
        <p>{user.email}로 로그인되어 있습니다.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "360px", margin: "0 auto" }}>
      <h2 style={{ color: "white" }}>관리자 로그인</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        {error && <p style={{ color: "tomato" }}>{error}</p>}
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#4a7b63",
            color: "white",
            border: "none",
          }}
        >
          로그인
        </button>
      </form>
    </div>
  );
}
