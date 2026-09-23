import Faded from "@/components/Faded";
import githubIcon from "@/img/Page/info/github.png";
import ohsoriIcon from "@/img/Page/info/mimyo/ohsori.png";
import acmicpcIcon from "@/img/Page/info/acmicpc_small.png";
import mimyoIcon from "@/img/Page/info/mimyo/mimyo_logo.jpg";
import meImg from "@/img/Page/info/me.png";

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

const sites = [
  { icon: githubIcon, label: "GitHub", href: "https://github.com/rjsah5676" },
  { icon: acmicpcIcon, label: "BAEKJOON", href: "https://www.acmicpc.net/user/rjsah5676" },
  { icon: ohsoriIcon, label: "Oh! Sori", href: "https://ohsori.my/" },
  { icon: mimyoIcon, label: "MIMYO", href: "https://drive.google.com/file/d/1ZVTpuval2WbT_x1n-3tOS7dhkpnCJQ8C/view" },
];

function InfoList({ title, rows }) {
  return (
    <div>
      <h3 className="mb-4 font-mono text-sm text-[#8B84FF]">{title}</h3>
      <dl className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-6 border-b border-white/5 pb-3">
            <dt className="font-mono text-sm text-white/40">{row.label}</dt>
            <dd className="text-right font-['Nanum_Gothic',sans-serif] text-white/90">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Home() {
  return (
    <Faded>
      <div className="mx-auto max-w-3xl px-6 pt-20 pb-16">
        <img
          src={meImg.src}
          alt=""
          className="mb-10 h-56 w-full rounded-2xl border border-white/10 object-cover sm:h-72"
        />

        <p className="mb-16 text-center font-['Nanum_Gothic',sans-serif] text-lg leading-relaxed text-white/80">
          안녕하세요🖐 풀스택 개발자를 목표하는{" "}
          <span className="font-medium text-white">이건모</span> 입니다.🙂
        </p>

        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
          <InfoList title="profile" rows={profile} />
          <InfoList title="tech" rows={tech} />
        </div>

        <div className="mt-16">
          <h3 className="mb-4 font-mono text-sm text-[#8B84FF]">site</h3>
          <div className="flex flex-wrap gap-3">
            {sites.map((site) => (
              <a
                key={site.label}
                href={site.href}
                target="_blank"
                className="flex items-center gap-2 rounded-full border border-white/10 py-2 pr-4 pl-2 font-mono text-sm text-white/70 transition-colors hover:border-[#6C63FF]/50 hover:text-white"
              >
                <img src={site.icon.src} alt="" className="h-5 w-5 rounded-full object-cover" />
                {site.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Faded>
  );
}
