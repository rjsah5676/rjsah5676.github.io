// 사이트를 gunmo.my 로 옮긴 뒤, 옛 주소(rjsah5676.github.io)의 모든 페이지를
// 새 주소의 같은 경로로 넘기는 정적 페이지를 build/ 에 만듦.
//
// GitHub Pages 는 서버 리다이렉트(301)를 못 함 → 페이지마다 canonical + 즉시 이동(meta refresh)을 넣음.
// 검색엔진은 이 조합을 주소 이전으로 처리함. 목록에 없는 경로는 404.html 이 같은 경로로 넘김.
// 페이지 목록은 새 사이트의 sitemap.xml 에서 읽음.
//
// 사용: node scripts/build-redirects.mjs [sitemap 주소 또는 파일 경로]
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const TARGET = "https://gunmo.my";
const OUT = "build";
// 옛 주소의 서치 콘솔 소유 확인을 유지 (src/app/layout.tsx 의 값과 같음)
const GOOGLE_VERIFICATION = "M1HPuPe8-AeKsyuumRmvYkg2m8WvAvs0rnIIndls0vw";

const source = process.argv[2] ?? `${TARGET}/sitemap.xml`;
const xml = /^https?:\/\//.test(source)
  ? await fetch(source).then((r) => {
      if (!r.ok) throw new Error(`${source} → HTTP ${r.status}`);
      return r.text();
    })
  : await readFile(source, "utf8");

const paths = new Set(["/"]);
for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const p = new URL(m[1].replaceAll("&amp;", "&")).pathname;
  // 폴더 밖으로 나가는 경로는 버림
  if (!decodeURIComponent(p).split("/").includes("..")) paths.add(p.endsWith("/") ? p : `${p}/`);
}
// 페이지가 너무 적으면 sitemap 을 잘못 읽은 것 → 옛 사이트를 빈 껍데기로 덮지 않게 중단
if (paths.size < 100) throw new Error(`페이지가 ${paths.size}개뿐입니다. sitemap 을 확인하세요: ${source}`);

const esc = (s) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
// 주소 뒤의 ?room=… 같은 값과 #위치도 그대로 들고 감
const jump = `<script>location.replace(${JSON.stringify(TARGET)} + location.pathname + location.search + location.hash)</script>`;

const page = (p) => {
  const url = esc(TARGET + p);
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>gunmo.my 로 이동</title>
<meta name="google-site-verification" content="${GOOGLE_VERIFICATION}">
<link rel="canonical" href="${url}">
${jump}
<meta http-equiv="refresh" content="0; url=${url}">
</head>
<body>
<p>사이트가 <a href="${url}">${url}</a> 로 옮겨졌습니다.</p>
</body>
</html>
`;
};

// 목록에 없는 경로(GitHub Pages 가 404 로 응답): 같은 경로로 넘기고, 검색에는 잡히지 않게
const notFound = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>gunmo.my 로 이동</title>
<meta name="robots" content="noindex">
${jump}
<noscript><meta http-equiv="refresh" content="0; url=${TARGET}/"></noscript>
</head>
<body>
<p>사이트가 <a href="${TARGET}/">${TARGET}</a> 로 옮겨졌습니다.</p>
</body>
</html>
`;

await rm(OUT, { recursive: true, force: true });
for (const p of paths) {
  const dir = path.join(OUT, ...decodeURIComponent(p).split("/").filter(Boolean));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), page(p));
}
await writeFile(path.join(OUT, "404.html"), notFound);
console.log(`${OUT}/ 에 이동 페이지 ${paths.size}개 + 404.html 생성 (→ ${TARGET})`);
