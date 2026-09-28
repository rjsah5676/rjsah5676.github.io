// title이 "1. 개요", "2-3. 글쓰기" 처럼 이미 번호가 매겨진 문서 형식이라
// 그 번호를 뱃지로 분리해서 보여줌 (내용 자체가 순서형이라 번호를 강조하는 게 자연스러움).
function splitNumber(title?: string): { num: string | null; rest: string | undefined } {
  if (!title) return { num: null, rest: title };
  const match = /^([\d.\-]+)\.?\s+(.*)$/.exec(title);
  if (!match) return { num: null, rest: title };
  return { num: match[1], rest: match[2] };
}

interface InfoContentsDetailProps {
  title?: string;
  text?: string;
  // 예전 스타일 props — 지금은 안 쓰지만 호출부에 남아있어서 타입만 열어둠
  titleFont?: string;
  titleMargin?: string;
}

export default function InfoContentsDetail({ title, text }: InfoContentsDetailProps) {
  const { num, rest } = splitNumber(title);

  return (
    <div className="mb-10">
      <div className="mb-3 flex items-center gap-2.5">
        {num && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#6C63FF]/15 px-1.5 font-mono text-xs text-[#8B84FF]">
            {num}
          </span>
        )}
        <span className="font-mono text-lg font-medium text-white sm:text-xl">{rest}</span>
      </div>
      <pre className="font-['Nanum_Gothic',sans-serif] text-sm leading-relaxed whitespace-pre-wrap text-white/70 sm:text-base">
        {text}
      </pre>
    </div>
  );
}
