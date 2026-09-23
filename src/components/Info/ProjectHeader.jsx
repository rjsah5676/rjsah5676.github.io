export default function ProjectHeader({ title, periodIcon, periodText, tech }) {
  return (
    <div className="mb-8">
      <div className="mb-2 font-mono text-2xl font-bold text-white sm:text-3xl">{title}</div>
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-white/50">
        {periodIcon}
        {periodText}
      </div>
      <div className="flex flex-wrap gap-2">
        {tech.map((t) => (
          <span
            key={t}
            className="rounded-full border border-[#6C63FF]/20 bg-[#6C63FF]/10 px-3 py-1 font-mono text-xs text-[#8B84FF]"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
