import type { ReactNode } from "react";
import { pageMeta } from "@/lib/seo";

// page.tsx가 "use client"라 metadata를 export할 수 없어서 layout에서 지정
export const metadata = pageMeta({
  title: "개인공부",
  description: "Java, 네트워크, 데이터베이스, 프론트엔드·백엔드, 알고리즘 등 개발 공부 기록.",
  path: "/study/",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
