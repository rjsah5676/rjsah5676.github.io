import Faded from "@/components/Faded";

const facts = [
  { key: "Name", value: "Lee Gunmo" },
  { key: "BirthDay", value: "1997.12.10" },
  { key: "Education", value: "Ajou Univ. Software Dept." },
  { key: "MBTI", value: "ISTP" },
  { key: "Skills", value: "React · Express · SpringBoot · WebSocket · MySQL" },
  { key: "Job", value: "looking for a job . . ." },
  { key: "Motto", value: "Seize the day." },
];

const qa = [
  { q: "혼자 일하는 거 좋아하세요?", a: "혼자 시작해서 함께 마무리하는 걸 좋아합니다." },
  {
    q: "가장 기억에 남는 버그는?",
    a: "새벽에 서버 공격받고 DB날아가서 아침에 콘솔 붙잡고 있었던 그날이요... 😅",
  },
  {
    q: "개발하면서 가장 뿌듯했던 순간?",
    a: "팀원들이 만든 UI 보고 '와 이거 진짜 서비스 같아졌다'고 했을 때요.",
  },
  {
    q: "앞으로 어떤 개발자가 되고 싶으세요?",
    a: "실력도 중요하지만, 결국 믿고 함께할 수 있는 개발자가 되고 싶어요.",
  },
];

export default function AboutPage() {
  return (
    <Faded>
      <div className="mx-auto max-w-2xl px-6 pt-16 pb-24">
        <div className="mb-10 font-mono text-sm text-[#8B84FF]">about</div>

        <p className="mb-12 font-['Nanum_Gothic',sans-serif] text-lg leading-relaxed text-white/80">
          안녕하세요🖐 풀스택 개발자를 목표하는{" "}
          <span className="font-medium text-white">이건모</span> 입니다.🙂
        </p>

        {/* 가짜 터미널 창 */}
        <div className="mb-12 overflow-hidden rounded-xl border border-white/10 bg-[#1C1E24]">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <div className="overflow-x-auto p-5 font-mono text-[13px] leading-7 text-white/70 sm:text-sm">
            <p className="mb-3 text-white/40">
              Gunmo&apos;s Dev Life [Version 1.0.0]
              <br />
              (c) Gunmo&apos;s Dev Life Corporation. All rights reserved
            </p>
            {facts.map((f) => (
              <div key={f.key} className="whitespace-nowrap">
                <span className="text-[#8B84FF]">C:\Gunmo\{f.key}&gt;</span>{" "}
                <span className="text-white">{f.value}</span>
              </div>
            ))}
            <div className="mt-3 text-white/40">C:\Gunmo&gt; shutdown -s</div>
          </div>
        </div>

        <div className="flex flex-col gap-6 font-['Nanum_Gothic',sans-serif] leading-relaxed text-white/75">
          <p>
            저는 &lsquo;만드는 일&rsquo;이 좋아서 개발자가 되었습니다. 어릴 때는 게임 속 캐릭터
            이름 바꾸는 것조차 재밌었고, 어느 순간엔 직접 만드는 쪽이 더 즐겁다는 걸
            깨달았습니다.
          </p>
          <p>
            대학교에서 소프트웨어를 전공하고, 군 복무 이후 잠시 멀어졌던 개발을 다시 붙잡기
            위해 국비 교육에 참여했습니다. 다시 코드를 마주하자, 예전보다 더 진지하고 깊이
            있게 몰입하는 제 자신을 발견할 수 있었습니다.
          </p>
          <p>
            많은 프로젝트 동안 저는 단순히 기능을 구현하는 것을 넘어서, &quot;왜 이렇게
            구성해야 할까?&quot;, &quot;사용자는 어디서 불편함을 느낄까?&quot;를 끊임없이
            고민하며 프로젝트를 완성했습니다. 팀장을 맡아 팀원들의 다양한 의견을 조율하고,
            실시간 경매 기능, 채팅 시스템, 정산 구조, 통계 페이지 등 복잡한 기능을 설계하고
            구현하며, 진짜 서비스처럼 움직이는 웹 애플리케이션을 만들어냈습니다.
          </p>
          <p>
            특히 WebSocket, JWT, REST API, MySQL, React-Redux 등 여러 기술을 연동하며 전체
            흐름을 연결해보는 경험은 개발자로서의 시야를 넓히는 계기가 되었습니다. 기술
            자체보다 중요한 건 &quot;문제를 끝까지 해결하는 태도&quot;라는 걸 몸으로
            배웠습니다.
          </p>
          <p>
            혼자서도 꾸준히 사이드 프로젝트를 진행했고, 반응형 UI/UX 개선, 무한 스크롤, 파일
            업로드, 실시간 알림 등 다양한 사용자 경험을 고민하며 끊임없이 기능을
            다듬어왔습니다. &lsquo;보기 좋은 것이 쓰기도 좋다&rsquo;는 철학으로, 디자인과
            코드의 균형을 맞추려 항상 노력하고 있습니다.
          </p>
          <p>
            제 개발 인생은 아직 1.0 버전이지만, 스스로 업데이트를 멈추지 않고 계속해서
            나아가고 있습니다. &lsquo;감사한 마음으로 즐겁게 일하자&rsquo;는 저만의 원칙을
            지키며, 언젠가 더 많은 사람들에게 도움이 되는 서비스를 만드는 것이 제 꿈입니다.
          </p>
        </div>

        <div className="mt-16">
          <div className="mb-6 font-mono text-sm text-[#8B84FF]">자주 듣는 질문들</div>
          <div className="flex flex-col gap-6">
            {qa.map((item) => (
              <div key={item.q} className="border-b border-white/5 pb-6">
                <p className="mb-2 font-['Nanum_Gothic',sans-serif] font-medium text-white">
                  Q. {item.q}
                </p>
                <p className="font-['Nanum_Gothic',sans-serif] text-white/60">A. {item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-16 text-center font-['Nanum_Gothic',sans-serif] text-white/50 italic">
          &quot;혼자 잘하는 사람보다, 같이 잘할 수 있는 사람이 되겠습니다.&quot;
        </p>
      </div>
    </Faded>
  );
}
