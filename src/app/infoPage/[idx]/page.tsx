import Faded from "@/components/Faded";
import type { Metadata } from "next";
import InfoContents from "@/components/Info/InfoContents";
import { getProjectByIdx } from "@/data/projects";
import { pageMeta } from "@/lib/seo";

// idx 1~11 (MyInfo.jsx에서 실제 쓰는 범위). static export이므로 빌드 시점에
// 전부 미리 생성해야 함 — 예전엔 react-router의 location.state로 idx를 넘겨서
// 새로고침하면 날아가는 문제가 있었는데, URL 파라미터로 옮기면서 그 문제도 해결됨.
export function generateStaticParams() {
  return Array.from({ length: 11 }, (_, i) => ({ idx: String(i + 1) }));
}

export async function generateMetadata({ params }: { params: Promise<{ idx: string }> }): Promise<Metadata> {
  const { idx } = await params;
  const project = getProjectByIdx(Number(idx));
  const meta = pageMeta({
    title: project?.title ?? "프로젝트",
    description: project ? `${project.desc} 사용 기술: ${project.tech.join(", ")}` : undefined,
    path: `/infoPage/${idx}/`,
  });
  if (project) {
    const image = { url: project.imgLink.src, width: project.imgLink.width, height: project.imgLink.height };
    meta.openGraph = { ...meta.openGraph, images: [image] };
    meta.twitter = { ...meta.twitter, images: [image.url] };
  }
  return meta;
}

export default async function InfoPageRoute({ params }: { params: Promise<{ idx: string }> }) {
  const { idx } = await params;

  return (
    <Faded>
      <div className="px-6 pt-16 pb-24">
        <InfoContents idx={Number(idx)} />
      </div>
    </Faded>
  );
}
