import Faded from "@/components/Faded";
import githubIcon from "@/img/Page/info/github.png";
import ohsoriIcon from "@/img/Page/info/mimyo/ohsori.png";
import acmicpcIcon from "@/img/Page/info/acmicpc_small.png";
import mimyoIcon from "@/img/Page/info/mimyo/mimyo_logo.jpg";
import meImg from "@/img/Page/info/me.webp";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import SiteLinks, { type SiteLink } from "@/components/SiteLinks";

// 검색엔진용 구조화 데이터 (사람/웹사이트 정보)
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "이건모",
      alternateName: "Gunmo Lee",
      jobTitle: "Fullstack Developer",
      url: SITE_URL,
      image: `${SITE_URL}${meImg.src}`,
      alumniOf: { "@type": "CollegeOrUniversity", name: "아주대학교" },
      knowsAbout: ["React", "Next.js", "TypeScript", "Spring Boot", "Node.js", "MySQL"],
      sameAs: ["https://github.com/rjsah5676", "https://www.acmicpc.net/user/rjsah5676"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: "ko-KR",
      author: { "@id": `${SITE_URL}/#person` },
    },
  ],
};

const profile = [
  { label: "이름", value: "이건모" },
  { label: "생년월일", value: "1997.12.10" },
  { label: "거주지", value: "경기도 성남시 수정구" },
  { label: "최종학력", value: "아주대학교 소프트웨어학과 졸업" },
];

const tech = [
  { label: "Frontend", value: "React, Next, TS" },
  { label: "Backend", value: "NodeJS, Spring Boot" },
  { label: "Database", value: "MySQL, MongoDB, FireStore" },
];

const sites: SiteLink[] = [
  { icon: githubIcon, label: "GitHub", href: "https://github.com/rjsah5676" },
  { icon: acmicpcIcon, label: "BAEKJOON", href: "https://www.acmicpc.net/user/rjsah5676" },
  { icon: ohsoriIcon, label: "Oh! Sori", href: "https://ohsori.my/", unavailable: true },
  {
    icon: mimyoIcon,
    label: "MIMYO",
    href: "https://drive.google.com/file/d/1ZVTpuval2WbT_x1n-3tOS7dhkpnCJQ8C/view",
  },
];

interface InfoRow {
  label: string;
  value: string;
}

function InfoList({ title, rows }: { title: string; rows: InfoRow[] }) {
  return (
    <div>
      <h3 className="mb-4 font-mono text-sm text-[#8B84FF]">{title}</h3>
      <dl className="flex flex-col gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-6 border-b border-white/5 pb-3"
          >
            <dt className="font-mono text-sm text-white/40">{row.label}</dt>
            <dd className="text-right font-['Nanum_Gothic',sans-serif] text-white/90">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Home() {
  return (
    <Faded>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-6 pt-20 pb-16">
        <img
          src={meImg.src}
          alt="이건모 프로필 사진"
          className="mb-10 h-56 w-full rounded-2xl border border-white/10 object-cover sm:h-72"
        />

        <div className="mb-16 text-center">
          <p className="font-['Nanum_Gothic',sans-serif] text-lg leading-relaxed break-keep text-white/85 sm:text-xl">
            화면부터 서버, 데이터베이스까지 직접 이어서 만드는
            <br className="hidden sm:block" /> 풀스택 개발자{" "}
            <span className="font-bold text-white">이건모</span>입니다.
          </p>
          <p className="mt-3 font-['Nanum_Gothic',sans-serif] text-sm leading-relaxed break-keep text-white/45">
            문제는 원인까지 따라가서 고치고, 배운 것은 기록으로 남깁니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
          <InfoList title="profile" rows={profile} />
          <InfoList title="tech" rows={tech} />
        </div>

        <div className="mt-16">
          <h3 className="mb-4 font-mono text-sm text-[#8B84FF]">site</h3>
          <SiteLinks sites={sites} />
        </div>
      </div>
    </Faded>
  );
}
