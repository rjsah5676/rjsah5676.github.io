import ComingSoon from "@/components/Tools/ComingSoon";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "룰렛", path: "/random/roulette/", noindex: true });

export default function RoulettePage() {
  return <ComingSoon title="룰렛" desc="항목을 넣고 돌려서 하나를 뽑는 도구" />;
}
