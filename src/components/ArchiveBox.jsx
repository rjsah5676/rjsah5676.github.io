export default function ArchiveBox({ date, text, isLast }) {
  return (
    <div className="relative pl-8 sm:pl-10">
      <span className="absolute top-1.5 left-0 h-2.5 w-2.5 rounded-full bg-[#6C63FF]" />
      {!isLast && (
        <span className="absolute top-4 bottom-[-2.5rem] left-[4px] w-px bg-white/10" />
      )}
      <div className="mb-2 font-mono text-sm text-white/40">{date}</div>
      <div className="font-['Nanum_Gothic',sans-serif] leading-relaxed text-white/75">{text}</div>
    </div>
  );
}
