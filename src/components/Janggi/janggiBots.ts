import type { AIConfig } from "@/lib/janggi/ai";
import type { Lines } from "@/lib/botTalk";

/** 장기 AI 상대: 한국 위인 (약한 순). 급수는 대략적인 체감 기준 */
export interface JanggiBot {
  id: string;
  name: string;
  rank: string;
  desc: string;
  emoji: string;
  ai: AIConfig;
  lines: Lines;
}

export const JANGGI_BOTS: JanggiBot[] = [
  {
    id: "jangyeongsil",
    name: "장영실",
    rank: "18급",
    desc: "발명은 잘하는데 장기는…",
    emoji: "⚙️",
    ai: { depth: 1, ms: 300, noise: 3, blunder: 0.35 },
    lines: {
      greet: [
        "측우기 만들다 잠깐 쉬러 왔소이다. 한 판 둡시다!",
        "장기도 결국 이치를 따지는 일이겠지요?",
      ],
      move: [
        "오호, 그 수는 마치 정교한 자격루 같구려",
        "꽤 괜찮은 수군요",
        "흠… 원리를 좀 더 연구해야겠소",
      ],
      userCapture: ["아이고, 그건 설계 실수였소", "부품 하나가 빠졌구려…"],
      userBigCapture: ["내 차가! 다시 만들어야겠소 😵", "이런, 핵심 부품을 잃었구려"],
      userCheck: ["장군이라니! 해시계 보듯 침착하게…"],
      aiCapture: ["오, 이게 되는구려! 🎉", "실험 성공이오!"],
      aiCheck: ["장군이오! …맞게 부른 거 맞지요?"],
      undo: ["실험엔 실패가 따르는 법, 물러드리리다"],
      aiWin: ["이겼소?! 전하께 보고드려야겠소!"],
      aiLose: ["역시 장기는 어렵구려. 발명이나 하러 가야겠소 😅"],
      draw: ["비겼구려. 이것도 귀한 데이터요"],
    },
  },
  {
    id: "jeongyakyong",
    name: "정약용",
    rank: "9급",
    desc: "책은 많이 읽었어요",
    emoji: "📜",
    ai: { depth: 1, ms: 400, noise: 1.5, blunder: 0.12 },
    lines: {
      greet: [
        "유배지에서 장기 책을 좀 읽었소. 한 수 배우겠소",
        "실사구시! 장기도 실전이 중요하지요",
      ],
      move: [
        "허허, 꽤 괜찮은 수군요",
        "그 수는 목민심서에도 없는 수로다",
        "흥미롭소. 기록해 두겠소",
      ],
      userCapture: ["으음, 거중기로도 못 막았구려", "그건 내가 잘못 짚었소"],
      userBigCapture: ["내 차를… 이건 책에 없던 일이오!", "허허, 크게 당했구려"],
      userCheck: ["장군이라… 궁을 옮겨야겠소"],
      aiCapture: ["실학의 힘이오", "책에서 본 대로구려!"],
      aiCheck: ["장군이오. 이치대로 두었을 뿐이오"],
      undo: ["배움엔 되돌아봄이 필요하지요. 물러드리리다"],
      aiWin: ["이론이 실전에서도 통했구려!"],
      aiLose: ["잘 두시는구려. 이번 대국은 꼭 기록해 두겠소"],
      draw: ["비겼구려. 다음 판도 기대되오"],
    },
  },
  {
    id: "kimyusin",
    name: "김유신",
    rank: "1급",
    desc: "삼국을 통일한 장수",
    emoji: "🐎",
    ai: { depth: 2, ms: 700, noise: 0.8, blunder: 0.03 },
    lines: {
      greet: ["화랑의 기개로 상대하겠소!", "말의 목을 벨 각오로 두겠소이다 🐎"],
      move: ["꽤 괜찮은 수군요", "제법이오. 화랑도에 들어올 만하오", "음, 그 수는 예상 밖이오"],
      userCapture: ["크윽, 한 걸음 물러서겠소", "좋은 수였소"],
      userBigCapture: ["내 차를 잡다니… 대단하오!", "이런, 내 말이 또 엉뚱한 데로 갔구려"],
      userCheck: ["장군이라! 궁을 지켜라!"],
      aiCapture: ["통일의 길은 멀지 않았소", "가져가겠소!"],
      aiCheck: ["장군이오! 항복하시겠소?"],
      undo: ["이번 한 번만이오"],
      aiWin: ["삼국에 이어 장기판도 통일했구려!"],
      aiLose: ["훌륭하오. 그대야말로 진정한 장수요"],
      draw: ["무승부라… 오늘은 휴전이오"],
    },
  },
  {
    id: "euljimundeok",
    name: "을지문덕",
    rank: "초단",
    desc: "유인하고 몰아치는 전술가",
    emoji: "🏹",
    ai: { depth: 3, ms: 900, noise: 0.3, blunder: 0 },
    lines: {
      greet: ["살수에서처럼 정중히 맞이하겠소", "그대의 신묘한 책략, 구경 좀 하겠소"],
      move: [
        "신묘한 책략은 하늘의 이치를 다했고… 꽤 괜찮은 수군요",
        "흠, 그 길로 오시겠다?",
        "좋은 수요. 하지만 이미 알고 있었소",
      ],
      userCapture: ["일부러 내어준 것이오", "미끼를 무셨구려… 아니, 진짜 잡혔소?"],
      userBigCapture: ["이건 계획에 없었소!", "전공이 이미 높으니 만족을 알고 그치는 게 어떻소?"],
      userCheck: ["장군이라… 물러설 줄도 알아야 하는 법이오"],
      aiCapture: ["유인은 끝났소. 이제 몰아칠 차례요", "살수대첩이 따로 없구려"],
      aiCheck: ["장군이오. 퇴로는 막혔소"],
      undo: ["한 번은 길을 열어드리리다"],
      aiWin: ["살수에 이어 장기판에서도 이겼구려"],
      aiLose: ["그대의 책략이 나보다 한 수 위였소"],
      draw: ["팽팽한 대치였소"],
    },
  },
  {
    id: "gangamchan",
    name: "강감찬",
    rank: "3단",
    desc: "귀주에서 대승을 거둔 명장",
    emoji: "⚔️",
    ai: { depth: 4, ms: 1200, noise: 0.1, blunder: 0 },
    lines: {
      greet: ["귀주에서처럼 바람이 내 편이길 바라오", "성실하게 상대하겠소"],
      move: ["꽤 괜찮은 수군요. 하지만 아직이오", "음, 신중하구려", "그 수, 기억해 두겠소"],
      userCapture: ["흠, 대가를 치르게 될 것이오", "좋은 수였소"],
      userBigCapture: ["…방심했구려. 다시는 없을 것이오", "내 차를 잡다니, 대단하오"],
      userCheck: ["장군이라… 아직 무너지지 않았소"],
      aiCapture: ["귀주의 바람이 불었구려", "가져가겠소"],
      aiCheck: ["장군이오"],
      undo: ["이번만 물러드리겠소"],
      aiWin: ["귀주대첩만큼 값진 승리였소"],
      aiLose: ["그대의 실력에 경의를 표하오"],
      draw: ["실로 팽팽한 승부였소"],
    },
  },
  {
    id: "yisunsin",
    name: "이순신",
    rank: "5단",
    desc: "단 한 번도 지지 않은 장군",
    emoji: "🐢",
    ai: { depth: 6, ms: 1800, noise: 0, blunder: 0 },
    lines: {
      greet: [
        "필사즉생 필생즉사. 한 판 두어 봅시다",
        "바다에서처럼, 장기판에서도 물러서지 않겠소 🐢",
      ],
      move: ["꽤 괜찮은 수군요", "그 수, 이미 내다보았소", "흠. 조류가 바뀌고 있구려"],
      userCapture: ["작은 손실일 뿐이오", "흔들리지 마라. 침착하게"],
      userBigCapture: [
        "신에게는 아직 열두 척의 배가 남아 있사옵니다",
        "…다시는 이런 일이 없을 것이오",
      ],
      userCheck: ["장군이라… 학익진으로 맞서겠소"],
      aiCapture: ["학익진이 완성되었소", "명량의 물살처럼!"],
      aiCheck: ["장군이오. 퇴로는 없소"],
      undo: ["전장에선 무를 수 없으나… 이번만이오"],
      aiWin: ["전투는 끝났소. 좋은 대국이었소"],
      aiLose: ["…그대가 나를 이겼소. 실로 대단하오 🐢"],
      draw: ["승부를 가리지 못했구려. 다음을 기약하겠소"],
    },
  },
];

export const DEFAULT_JANGGI_BOT = "kimyusin";
