import StudyBrowser from "@/components/Study/StudyBrowser";
import { getAllStudyPosts, toListItem } from "@/firestore/studyPosts";
import { pageMeta } from "@/lib/seo";
import "@/css/Page/study.css";

export const metadata = pageMeta({
  title: "개인공부",
  description: "Java, 네트워크, 데이터베이스, 프론트엔드·백엔드, 알고리즘 등 개발 공부 기록.",
  path: "/study/",
});

export default async function StudyPage() {
  const posts = (await getAllStudyPosts()).map(toListItem);

  return <StudyBrowser posts={posts} />;
}
