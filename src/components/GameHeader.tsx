/** 게임 페이지 공통 머리말: games / 제목 / 한 줄 설명 */
export default function GameHeader({
  title,
  desc,
  className = "",
}: {
  title: string;
  desc: string;
  className?: string;
}) {
  return (
    <div className={`mb-6 text-left ${className}`}>
      <div className="font-mono text-sm text-[#8B84FF]">games</div>
      <h1 className="mt-1 font-mono text-2xl font-bold text-white">{title}</h1>
      <p className="mt-2 font-['Nanum_Gothic',sans-serif] text-sm text-white/45">{desc}</p>
    </div>
  );
}
