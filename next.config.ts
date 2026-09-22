import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // 기존 firebase.json / gh-pages 설정이 "build" 폴더를 바라보고 있어서
  // 마이그레이션 기간 동안은 출력 폴더명을 그대로 맞춰둠.
  distDir: "build",
  // 정적 호스팅(Firebase Hosting/GH Pages)에서 /about 같은 확장자 없는 경로가
  // about.html이 아니라 about/index.html로 떨어지게(더 널리 호환됨)
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
