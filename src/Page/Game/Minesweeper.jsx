import React, { useState, useEffect } from "react";
import firebase from "../../firebase";
import clickSound from "../../sounds/melongame/bbyong.mp3";
import flagSound from "../../sounds/melongame/bbyong.mp3";
import endBgm from "../../sounds/melongame/endbgm.mp3";

const db = firebase.firestore();

const ROWS = 20;
const COLS = 24;
const MINES = 99;

const clickAudio = new Audio(clickSound);
const flagAudio = new Audio(flagSound);
const endBgmAudio = new Audio(endBgm);
endBgmAudio.volume = 0.6;

function generateBoardSafe(safeR, safeC) {
  const board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  let minesPlaced = 0;
  while (minesPlaced < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    if (board[r][c] === -1) continue;
    board[r][c] = -1;
    minesPlaced++;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] !== -1) {
          board[nr][nc]++;
        }
      }
    }
  }
  return board;
}

export default function Minesweeper() {
  const [board, setBoard] = useState(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const [visible, setVisible] = useState(Array.from({ length: ROWS }, () => Array(COLS).fill(false)));
  const [flagged, setFlagged] = useState(Array.from({ length: ROWS }, () => Array(COLS).fill(false)));
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [pressingCell, setPressingCell] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [timer, setTimer] = useState(0);
  const [rankings, setRankings] = useState([]);
  const flaggedCount = flagged.flat().filter(v => v).length;
  const remainingMines = MINES - flaggedCount;

  useEffect(() => {
    if (!startTime || gameOver) return;
    const interval = setInterval(() => {
      setTimer(((Date.now() - startTime) / 1000).toFixed(1));
    }, 100);
    return () => clearInterval(interval);
  }, [startTime, gameOver]);

  useEffect(() => {
    if (win && startTime) {
      const clearTime = ((Date.now() - startTime) / 1000).toFixed(2);
      const name = prompt(`🎉 ${clearTime}s 클리어! 이름을 입력하세요:`);
      if (name) {
        db.collection("minesweeper_rankings").add({ name, time: parseFloat(clearTime) });
      }
    }
  }, [win]);

  useEffect(() => {
    db.collection("minesweeper_rankings")
      .orderBy("time", "asc")
      .limit(10)
      .get()
      .then((snapshot) => {
        const list = snapshot.docs.map(doc => doc.data());
        setRankings(list);
      });
  }, [win]);

  useEffect(() => {
    const handleMouseUp = () => setPressingCell(null);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const resetGame = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    setVisible(Array.from({ length: ROWS }, () => Array(COLS).fill(false)));
    setFlagged(Array.from({ length: ROWS }, () => Array(COLS).fill(false)));
    setGameOver(false);
    setWin(false);
    setInitialized(false);
    setStartTime(null);
    setTimer(0);
  };

  const floodFill = (r, c, newVisible) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || newVisible[r][c]) return;
    newVisible[r][c] = true;
    if (board[r][c] === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          floodFill(r + dr, c + dc, newVisible);
        }
      }
    }
  };

    useEffect(() => {
    if (gameOver) {
        endBgmAudio.currentTime = 0;
        endBgmAudio.play();
    }
    }, [gameOver]);

  const handleLeftClick = (r, c) => {
    if (gameOver || visible[r][c] || flagged[r][c]) return;

    clickAudio.play();

    if (!initialized) {
      const newBoard = generateBoardSafe(r, c);
      setBoard(newBoard);
      setStartTime(Date.now());

      const newVisible = visible.map(row => [...row]);
      const tempBoard = newBoard;
      const flood = (r, c) => {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || newVisible[r][c]) return;
        newVisible[r][c] = true;
        if (tempBoard[r][c] === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              flood(r + dr, c + dc);
            }
          }
        }
      };
      flood(r, c);

      setVisible(newVisible);
      setInitialized(true);
      return;
    }

    const newVisible = visible.map(row => [...row]);
    if (board[r][c] === -1) {
      setGameOver(true);
      newVisible[r][c] = true;
    } else {
      floodFill(r, c, newVisible);
    }
    setVisible(newVisible);
    checkWin(newVisible);
  };

  const handleRightClick = (e, r, c) => {
    e.preventDefault();
    if (gameOver || visible[r][c]) return;
    flagAudio.play();
    const newFlagged = flagged.map(row => [...row]);
    newFlagged[r][c] = !newFlagged[r][c];
    setFlagged(newFlagged);
  };

  const handleMouseDown = (e, r, c) => {
    if (e.buttons === 3 && visible[r][c]) {
      setPressingCell({ row: r, col: c });
    }
    if (e.buttons !== 3 || gameOver || !visible[r][c]) return;
    const target = board[r][c];
    if (target <= 0) return;

    let flagCount = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          if (flagged[nr][nc]) flagCount++;
        }
      }
    }

    if (flagCount === target) {
      const newVisible = visible.map(row => [...row]);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (
            nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
            !visible[nr][nc] && !flagged[nr][nc]
          ) {
            if (board[nr][nc] === -1) {
              newVisible[nr][nc] = true;
              setVisible(newVisible);
              setGameOver(true);
              return;
            } else {
              floodFill(nr, nc, newVisible);
            }
          }
        }
      }
      setVisible(newVisible);
      checkWin(newVisible);
    }
  };

  const checkWin = (visibleBoard) => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] !== -1 && !visibleBoard[r][c]) return;
      }
    }
    setWin(true);
    setGameOver(true);
  };

    const [touchTimer, setTouchTimer] = useState(null);
    const handleTouchStart = (r, c) => {
    const timer = setTimeout(() => {
        if (!gameOver && !visible[r][c]) {
        const newFlagged = flagged.map(row => [...row]);
        newFlagged[r][c] = !newFlagged[r][c];
        setFlagged(newFlagged);
        flagAudio.play();
        }
    }, 600);
    setTouchTimer(timer);
    };

    const handleTouchEnd = (r, c) => {
    clearTimeout(touchTimer);
    };

    const handleNumberLongPress = (r, c) => {
    if (!visible[r][c] || board[r][c] <= 0) return;
    const target = board[r][c];

    let flagCount = 0;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && flagged[nr][nc]) {
            flagCount++;
        }
        }
    }

    if (flagCount === target) {
        const newVisible = visible.map(row => [...row]);
        for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visible[nr][nc] && !flagged[nr][nc]) {
            if (board[nr][nc] === -1) {
                newVisible[nr][nc] = true;
                setVisible(newVisible);
                setGameOver(true);
                return;
            } else {
                floodFill(nr, nc, newVisible);
            }
            }
        }
        }
        setVisible(newVisible);
        checkWin(newVisible);
    }
    };

    const [numberTouchTimer, setNumberTouchTimer] = useState(null);

    const handleNumberTouchStart = (r, c) => {
    const timer = setTimeout(() => handleNumberLongPress(r, c), 500); // 0.5초 이상 눌렀을 때
    setNumberTouchTimer(timer);
    };

    const handleNumberTouchEnd = () => {
    clearTimeout(numberTouchTimer);
    };

  return (
    <div className="minesweeper">
      <div className="top-info">
        <div className="top-row">
          <div id="mine-left">
            <div id='mine-title'>랭킹</div>
            <ol>
              {rankings.map((r, idx) => (
                <li key={idx}>{r.name} - {r.time}s</li>
              ))}
            </ol>
          </div>
          <div id="mine-right">
            누르면 시작됩니다<br />
            총 지뢰는 {MINES}개입니다<br />
            클리어 시 랭킹 등록이 가능합니다.<br />
            모바일도 지원합니다. 꾹 누르면 여러 기능 가능
          </div>
        </div>
        <div className="status-row" style={{ marginTop: '30px' }}>
          <div className="status-box">⏱  {timer}s</div>
          <div className="status-box">🚩  {remainingMines}</div>
        </div>
      </div>
      <div className="grid">
        {board.map((row, rIdx) => (
          <div className="row" key={rIdx}>
            {row.map((cell, cIdx) => {
              const isHighlighted =
                pressingCell &&
                Math.abs(pressingCell.row - rIdx) <= 1 &&
                Math.abs(pressingCell.col - cIdx) <= 1;
              const isEven = (rIdx + cIdx) % 2 === 0;
              const isOpen = visible[rIdx][cIdx];
              return (
                <div
                    key={cIdx}
                    className={`cell ${isOpen ? "open" : ""} ${isEven ? "even" : ""} ${isHighlighted && !isOpen ? "highlight" : ""}`}
                    onClick={() => handleLeftClick(rIdx, cIdx)}
                    onContextMenu={(e) => handleRightClick(e, rIdx, cIdx)}
                    onMouseDown={(e) => handleMouseDown(e, rIdx, cIdx)}
                    onTouchStart={() => {
                        if (visible[rIdx][cIdx] && board[rIdx][cIdx] > 0) {
                        handleNumberTouchStart(rIdx, cIdx);
                        } else {
                        handleTouchStart(rIdx, cIdx);
                        }
                    }}
                    onTouchEnd={() => {
                        handleNumberTouchEnd();
                        handleTouchEnd(rIdx, cIdx);
                    }}
                    >
                  {flagged[rIdx][cIdx]
                    ? "🚩"
                    : isOpen
                        ? (cell === -1
                        ? "💣"
                        : (cell ? <span style={{fontWeight:'bold'}} className={`number number-${cell}`}>{cell}</span> : ""))
                        : ""}
                </div>
              );
            })}
          </div>
        ))}
        {gameOver && (
          <div className="message-overlay">
            {win ? "🎉 클리어!" : "💥 펑 ㅋㅋ"}
            <button style={{cursor:'pointer', width:'100px', height:'40px', fontSize:'17px'}} onClick={resetGame}>🔁 새 게임</button>
          </div>
        )}
      </div>
    </div>
  );
}
