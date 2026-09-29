import ComingSoon from "@/components/Tools/ComingSoon";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "사다리타기", path: "/random/ladder/", noindex: true });

export default function LadderPage() {
  return <ComingSoon title="사다리타기" desc="참가자와 결과를 넣고 사다리를 타는 도구" />;
}
