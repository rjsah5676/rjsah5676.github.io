import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Faded from "@/components/Faded";
import StudyPostActions from "@/components/Study/StudyPostActions";
import { getAllStudyPosts, parseStudyDate, toPlainText } from "@/firestore/studyPosts";
import { pageMeta, SITE_URL } from "@/lib/seo";
import "@/css/Page/study.css";

type Params = { params: Promise<{ id: string }> };

// output: "export"라 빌드 시점에 있는 글만 페이지로 생성됨 (새 글은 재배포 필요)
export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getAllStudyPosts();
  // 정적 export는 빈 배열이면 빌드 에러가 나서, 글이 없을 땐 404용 자리만 하나 만듦
  if (posts.length === 0) return [{ id: "_" }];
  return posts.map((p) => ({ id: p.id }));
}

async function findPost(id: string) {
  const posts = await getAllStudyPosts();
  return posts.find((p) => p.id === id);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const post = await findPost(id);
  if (!post) return pageMeta({ title: "글을 찾을 수 없음", path: `/study/${id}/`, noindex: true });

  const meta = pageMeta({
    title: post.title,
    description: toPlainText(post.content) || `${post.category} 공부 기록`,
    path: `/study/${post.id}/`,
  });
  const published = parseStudyDate(post.date)?.toISOString();
  meta.openGraph = {
    ...meta.openGraph,
    type: "article",
    ...(published && { publishedTime: published }),
    section: post.category,
  };
  return meta;
}

export default async function StudyPostPage({ params }: Params) {
  const { id } = await params;
  const post = await findPost(id);
  if (!post) notFound();

  const published = parseStudyDate(post.date)?.toISOString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: toPlainText(post.content),
    articleSection: post.category,
    inLanguage: "ko-KR",
    url: `${SITE_URL}/study/${post.id}/`,
    mainEntityOfPage: `${SITE_URL}/study/${post.id}/`,
    ...(published && { datePublished: published }),
    author: { "@id": `${SITE_URL}/#person` },
  };

  return (
    <Faded>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-6 pt-16 pb-24">
        <Link
          href={`/study/?category=${encodeURIComponent(post.category)}`}
          className="mb-6 inline-block font-mono text-sm text-white/40 transition-colors hover:text-white"
        >
          ← {post.category}
        </Link>
        <h1 className="font-mono text-2xl font-bold text-white sm:text-3xl">{post.title}</h1>
        <div className="mt-3 flex gap-3 font-mono text-xs text-white/40">
          <span className="text-[#8B84FF]">{post.category}</span>
          <time dateTime={published}>{post.date}</time>
        </div>
        <div
          dangerouslySetInnerHTML={{ __html: post.content }}
          className="quill-content mt-10 leading-relaxed text-white/80 [word-break:break-word]"
        />
        <StudyPostActions postId={post.id} />
      </article>
    </Faded>
  );
}
