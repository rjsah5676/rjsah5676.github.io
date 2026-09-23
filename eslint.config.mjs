import { defineConfig, globalIgnores } from "eslint/config";
import nextConfig from "eslint-config-next";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextConfig,
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      // 이 프로젝트는 <img> 태그를 곳곳에서 그대로 씀 (next/image 전환은 별개 작업) - 경고 끔
      "@next/next/no-img-element": "off",
      // 한국어/영어 텍스트에 따옴표/아포스트로피가 자주 섞여있어서 꺼둠
      "react/no-unescaped-entities": "off",
      // 정리 안 된 변수/미사용 import는 일단 경고로만 (막지는 않음)
      "no-unused-vars": "warn",
      // 의존성 배열 관련도 경고로만 - 게임/캔버스 코드처럼 의도적으로 빼는 경우가 많음
      "react-hooks/exhaustive-deps": "warn",
      // eslint-plugin-react-hooks v7의 React Compiler 대비용 신규 규칙들 -
      // 캔버스/게임 코드처럼 의도적으로 명령형인 부분이 많아서 error 대신 warn으로
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
