import Faded from "@/components/Faded";
import InfoContents from "@/components/Info/InfoContents";
import "@/css/Page/info.css";

// idx 1~11 (MyInfo.jsx에서 실제 쓰는 범위). static export이므로 빌드 시점에
// 전부 미리 생성해야 함 — 예전엔 react-router의 location.state로 idx를 넘겨서
// 새로고침하면 날아가는 문제가 있었는데, URL 파라미터로 옮기면서 그 문제도 해결됨.
export function generateStaticParams() {
  return Array.from({ length: 11 }, (_, i) => ({ idx: String(i + 1) }));
}

export default async function InfoPageRoute({ params }) {
  const { idx } = await params;

  return (
    <Faded>
      <div style={{ marginBottom: "100px" }}>
        <div className="info-container">
          <InfoContents idx={Number(idx)} />
        </div>
      </div>
    </Faded>
  );
}
