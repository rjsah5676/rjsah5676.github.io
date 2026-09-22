import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // 기존 firebase.json / gh-pages 설정이 "build" 폴더를 바라보고 있어서
  // 마이그레이션 기간 동안은 출력 폴더명을 그대로 맞춰둠.
  distDir: "build",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
