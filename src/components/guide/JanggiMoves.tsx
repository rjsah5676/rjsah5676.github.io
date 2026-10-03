/**
 * 가이드용 장기 기물 이동 도식 (작은 판 위에 기물 하나와 갈 수 있는 자리).
 * 실제 판 캡처로는 첫 판에서 움직임이 다 안 보여서 직접 그림.
 */
type P = [number, number];

const N = 7; // 7x7 칸 (가운데 3,3)
const G = 46;
const M = 26;
const at = ([f, r]: P) => ({ x: M + f * G, y: M + r * G });

function Piece({
  p,
  ch,
  color = "#2563EB",
  dim = false,
}: {
  p: P;
  ch: string;
  color?: string;
  dim?: boolean;
}) {
  const { x, y } = at(p);
  return (
    <g opacity={dim ? 0.55 : 1}>
      <polygon
        points={Array.from({ length: 8 }, (_, i) => {
          const a = (Math.PI / 4) * i + Math.PI / 8;
          return `${x + 19 * Math.cos(a)},${y + 19 * Math.sin(a)}`;
        }).join(" ")}
        fill="#FBF6EA"
        stroke={color}
        strokeWidth={2.5}
      />
      <text x={x} y={y + 7} textAnchor="middle" fontSize={19} fontWeight={700} fill={color}>
        {ch}
      </text>
    </g>
  );
}

function Dot({ p, x: cross = false }: { p: P; x?: boolean }) {
  const { x, y } = at(p);
  return cross ? (
    <g stroke="#EF4444" strokeWidth={3} strokeLinecap="round">
      <line x1={x - 7} y1={y - 7} x2={x + 7} y2={y + 7} />
      <line x1={x + 7} y1={y - 7} x2={x - 7} y2={y + 7} />
    </g>
  ) : (
    <circle cx={x} cy={y} r={8} fill="#22C55E" />
  );
}

function Path({ pts }: { pts: P[] }) {
  return (
    <polyline
      points={pts.map((p) => `${at(p).x},${at(p).y}`).join(" ")}
      fill="none"
      stroke="#22C55E"
      strokeWidth={3}
      strokeDasharray="5 5"
      opacity={0.7}
    />
  );
}

function Board({ palace = false, children }: { palace?: boolean; children: React.ReactNode }) {
  const end = M + (N - 1) * G;
  return (
    <svg viewBox={`0 0 ${end + M} ${end + M}`} className="h-full max-h-full w-auto">
      <rect x={0} y={0} width={end + M} height={end + M} rx={10} fill="#E9C98B" />
      {Array.from({ length: N }, (_, i) => (
        <g key={i} stroke="#7A5A2E" strokeWidth={1.2}>
          <line x1={M} y1={M + i * G} x2={end} y2={M + i * G} />
          <line x1={M + i * G} y1={M} x2={M + i * G} y2={end} />
        </g>
      ))}
      {palace && (
        <g stroke="#7A5A2E" strokeWidth={1.2}>
          <line x1={at([2, 2]).x} y1={at([2, 2]).y} x2={at([4, 4]).x} y2={at([4, 4]).y} />
          <line x1={at([4, 2]).x} y1={at([4, 2]).y} x2={at([2, 4]).x} y2={at([2, 4]).y} />
        </g>
      )}
      {children}
    </svg>
  );
}

const C: P = [3, 3];

export type JanggiPieceKey = "king" | "chariot" | "cannon" | "horse" | "elephant" | "soldier";

export default function JanggiMoves({ piece }: { piece: JanggiPieceKey }) {
  switch (piece) {
    case "king": {
      const t: P[] = [];
      for (let df = -1; df <= 1; df++)
        for (let dr = -1; dr <= 1; dr++) if (df || dr) t.push([3 + df, 3 + dr]);
      return (
        <Board palace>
          {t.map((p, i) => (
            <Dot key={i} p={p} />
          ))}
          <Piece p={C} ch="楚" />
        </Board>
      );
    }
    case "chariot": {
      const t: P[] = [];
      for (let k = 0; k < N; k++) if (k !== 3) t.push([k, 3], [3, k]);
      return (
        <Board>
          {t.map((p, i) => (
            <Dot key={i} p={p} />
          ))}
          <Piece p={C} ch="車" />
        </Board>
      );
    }
    case "cannon":
      return (
        <Board>
          {/* 위로: 졸을 넘어서 / 오른쪽: 졸을 넘어서 / 아래·왼쪽: 넘을 게 없어 못 감 */}
          <Path pts={[C, [3, 0]]} />
          <Path pts={[C, [6, 3]]} />
          <Piece p={[3, 2]} ch="卒" dim />
          <Piece p={[4, 3]} ch="卒" dim />
          <Dot p={[3, 1]} />
          <Dot p={[3, 0]} />
          <Dot p={[5, 3]} />
          <Dot p={[6, 3]} />
          <Dot p={[3, 5]} x />
          <Dot p={[1, 3]} x />
          <Piece p={C} ch="包" />
        </Board>
      );
    case "horse": {
      const t: P[] = [
        [2, 1],
        [4, 1],
        [5, 2],
        [5, 4],
        [4, 5],
        [2, 5],
      ];
      return (
        <Board>
          <Path pts={[C, [3, 2], [2, 1]]} />
          <Path pts={[C, [4, 3], [5, 2]]} />
          {t.map((p, i) => (
            <Dot key={i} p={p} />
          ))}
          {/* 왼쪽 칸이 막혀서(멱) 그쪽 두 자리는 못 감 */}
          <Piece p={[2, 3]} ch="卒" dim />
          <Dot p={[1, 2]} x />
          <Dot p={[1, 4]} x />
          <Piece p={C} ch="馬" />
        </Board>
      );
    }
    case "elephant": {
      const t: P[] = [
        [1, 0],
        [5, 0],
        [6, 1],
        [6, 5],
        [5, 6],
        [1, 6],
        [0, 5],
        [0, 1],
      ];
      return (
        <Board>
          <Path pts={[C, [3, 2], [4, 1], [5, 0]]} />
          {t.map((p, i) => (
            <Dot key={i} p={p} />
          ))}
          <Piece p={C} ch="象" />
        </Board>
      );
    }
    case "soldier":
      return (
        <Board>
          <Dot p={[3, 2]} />
          <Dot p={[2, 3]} />
          <Dot p={[4, 3]} />
          <Dot p={[3, 4]} x />
          <Piece p={C} ch="卒" />
        </Board>
      );
  }
}
