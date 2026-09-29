import Faded from "@/components/Faded";

// 메뉴만 먼저 열어둔 도구 페이지용 안내
export default function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <Faded>
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 pt-24 pb-32 text-center">
        <div className="font-mono text-sm text-[#8B84FF]">tools</div>
        <h1 className="font-mono text-2xl font-bold text-white">{title}</h1>
        <p className="font-['Nanum_Gothic',sans-serif] text-sm text-white/50">{desc}</p>
        <p className="mt-4 rounded-full border border-white/10 px-4 py-1.5 font-mono text-xs text-white/40">
          준비 중입니다
        </p>
      </div>
    </Faded>
  );
}
