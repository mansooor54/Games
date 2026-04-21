import { useState, useEffect, useRef, useCallback } from "react";

const TILE = 32;
const COLS = 25;
const ROWS = 19;
const W = COLS * TILE;
const H = ROWS * TILE;

const WALL = 1;
const PATH = 0;
const EXIT = 2;

function generateMaze(cols, rows) {
  const maze = Array.from({ length: rows }, () => Array(cols).fill(WALL));
  
  function carve(x, y) {
    maze[y][x] = PATH;
    const dirs = [[0,-2],[0,2],[-2,0],[2,0]].sort(() => Math.random() - 0.5);
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && maze[ny][nx] === WALL) {
        maze[y + dy/2][x + dx/2] = PATH;
        carve(nx, ny);
      }
    }
  }
  
  carve(1, 1);
  maze[rows - 2][cols - 2] = EXIT;
  maze[rows - 2][cols - 1] = EXIT;
  return maze;
}

function getPathCells(maze) {
  const cells = [];
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      if (maze[y][x] === PATH && !(x === 1 && y === 1))
        cells.push([x, y]);
  return cells;
}

function spawnMonsters(maze, count) {
  const cells = getPathCells(maze);
  const far = cells.filter(([x, y]) => Math.abs(x - 1) + Math.abs(y - 1) > 8);
  const pool = far.length >= count ? far : cells;
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(([x, y], i) => ({
    id: i,
    x: x * TILE + TILE / 2,
    y: y * TILE + TILE / 2,
    alive: true,
    dir: [[1,0],[-1,0],[0,1],[0,-1]][Math.floor(Math.random()*4)],
    moveTimer: 0,
    hit: 0,
  }));
}

export default function MazeEscape() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const keysRef = useRef({});
  const frameRef = useRef(0);

  const [screen, setScreen] = useState("menu");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [msg, setMsg] = useState("");

  const initGame = useCallback((lvl) => {
    const maze = generateMaze(COLS, ROWS);
    const monsterCount = 3 + lvl * 2;
    stateRef.current = {
      maze,
      player: { x: 1 * TILE + TILE/2, y: 1 * TILE + TILE/2, dir: [1,0], invuln: 0 },
      monsters: spawnMonsters(maze, monsterCount),
      bullets: [],
      particles: [],
      score: 0,
      lives: 3,
      level: lvl,
      lastShot: 0,
      gameOver: false,
      won: false,
      flash: 0,
    };
  }, []);

  const startGame = useCallback(() => {
    initGame(1);
    setScreen("play");
    setScore(0);
    setLevel(1);
    setLives(3);
    setMsg("");
  }, [initGame]);

  const nextLevel = useCallback(() => {
    const s = stateRef.current;
    const nl = s.level + 1;
    initGame(nl);
    stateRef.current.score = score;
    stateRef.current.lives = lives;
    stateRef.current.level = nl;
    setLevel(nl);
  }, [initGame, score, lives]);

  // Key handlers
  useEffect(() => {
    const down = (e) => { keysRef.current[e.key.toLowerCase()] = true; e.preventDefault(); };
    const up = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Touch controls
  const handleTouch = useCallback((dir) => {
    const s = stateRef.current;
    if (!s || s.gameOver || s.won) return;
    s.player.dir = dir;
    const spd = 3;
    const nx = s.player.x + dir[0] * spd * 4;
    const ny = s.player.y + dir[1] * spd * 4;
    const r = 10;
    const canMove = (px, py) => {
      const checks = [
        [px - r, py - r], [px + r, py - r],
        [px - r, py + r], [px + r, py + r]
      ];
      return checks.every(([cx, cy]) => {
        const gx = Math.floor(cx / TILE), gy = Math.floor(cy / TILE);
        return gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS && s.maze[gy][gx] !== WALL;
      });
    };
    if (canMove(nx, ny)) {
      s.player.x = nx;
      s.player.y = ny;
    }
  }, []);

  const handleShoot = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.gameOver || s.won) return;
    const now = Date.now();
    if (now - s.lastShot < 250) return;
    s.lastShot = now;
    s.bullets.push({
      x: s.player.x, y: s.player.y,
      dx: s.player.dir[0] * 8, dy: s.player.dir[1] * 8,
      life: 60
    });
  }, []);

  // Game loop
  useEffect(() => {
    if (screen !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const s = stateRef.current;
      if (!s) return;
      frameRef.current++;

      const keys = keysRef.current;
      const p = s.player;
      const spd = 3;

      // Movement
      if (!s.gameOver && !s.won) {
        let dx = 0, dy = 0;
        if (keys["w"] || keys["arrowup"]) { dy = -1; p.dir = [0,-1]; }
        if (keys["s"] || keys["arrowdown"]) { dy = 1; p.dir = [0,1]; }
        if (keys["a"] || keys["arrowleft"]) { dx = -1; p.dir = [-1,0]; }
        if (keys["d"] || keys["arrowright"]) { dx = 1; p.dir = [1,0]; }
        
        if (dx || dy) {
          const len = Math.sqrt(dx*dx+dy*dy);
          dx = dx/len * spd; dy = dy/len * spd;
        }

        const r = 10;
        const canMove = (px, py) => {
          const checks = [[px-r,py-r],[px+r,py-r],[px-r,py+r],[px+r,py+r]];
          return checks.every(([cx,cy]) => {
            const gx = Math.floor(cx/TILE), gy = Math.floor(cy/TILE);
            return gx>=0 && gx<COLS && gy>=0 && gy<ROWS && s.maze[gy][gx] !== WALL;
          });
        };

        if (canMove(p.x+dx, p.y+dy)) { p.x+=dx; p.y+=dy; }
        else if (canMove(p.x+dx, p.y)) { p.x+=dx; }
        else if (canMove(p.x, p.y+dy)) { p.y+=dy; }

        // Shoot
        if (keys[" "]) {
          const now = Date.now();
          if (now - s.lastShot > 250) {
            s.lastShot = now;
            s.bullets.push({ x:p.x, y:p.y, dx:p.dir[0]*8, dy:p.dir[1]*8, life:60 });
          }
        }

        // Check exit
        const gx = Math.floor(p.x/TILE), gy = Math.floor(p.y/TILE);
        if (s.maze[gy] && s.maze[gy][gx] === EXIT) {
          s.won = true;
          s.score += 100 * s.level;
          setScore(prev => prev + 100 * s.level);
          setMsg(`🎉 المستوى ${s.level} مكتمل!`);
        }

        // Invulnerability timer
        if (p.invuln > 0) p.invuln--;
      }

      // Update bullets
      s.bullets = s.bullets.filter(b => {
        b.x += b.dx; b.y += b.dy; b.life--;
        const gx = Math.floor(b.x/TILE), gy = Math.floor(b.y/TILE);
        if (gx<0||gx>=COLS||gy<0||gy>=ROWS||s.maze[gy][gx]===WALL) {
          for(let i=0;i<5;i++) s.particles.push({ x:b.x,y:b.y,dx:(Math.random()-0.5)*3,dy:(Math.random()-0.5)*3,life:15,color:"#fbbf24" });
          return false;
        }
        return b.life > 0;
      });

      // Update monsters
      if (!s.gameOver && !s.won) {
        s.monsters.forEach(m => {
          if (!m.alive) return;
          if (m.hit > 0) { m.hit--; return; }
          
          m.moveTimer++;
          if (m.moveTimer > 8) {
            m.moveTimer = 0;
            const mspd = 1.5 + s.level * 0.3;
            let nx = m.x + m.dir[0]*mspd*4;
            let ny = m.y + m.dir[1]*mspd*4;
            const mr = 10;
            const canMoveM = (px,py) => {
              const checks = [[px-mr,py-mr],[px+mr,py-mr],[px-mr,py+mr],[px+mr,py+mr]];
              return checks.every(([cx,cy]) => {
                const gx=Math.floor(cx/TILE),gy=Math.floor(cy/TILE);
                return gx>=0&&gx<COLS&&gy>=0&&gy<ROWS&&s.maze[gy][gx]!==WALL;
              });
            };
            if (canMoveM(nx,ny)) { m.x=nx; m.y=ny; }
            else {
              const dirs = [[1,0],[-1,0],[0,1],[0,-1]].filter(d => !(d[0]===m.dir[0]&&d[1]===m.dir[1]));
              m.dir = dirs[Math.floor(Math.random()*dirs.length)];
            }
          }

          // Bullet hit
          s.bullets.forEach((b,bi) => {
            if (Math.abs(b.x-m.x)<14 && Math.abs(b.y-m.y)<14) {
              m.alive = false;
              m.hit = 10;
              s.bullets.splice(bi,1);
              s.score += 10;
              setScore(prev => prev + 10);
              for(let i=0;i<12;i++) s.particles.push({
                x:m.x,y:m.y,
                dx:(Math.random()-0.5)*6,dy:(Math.random()-0.5)*6,
                life:25,color:["#ef4444","#f97316","#fbbf24"][Math.floor(Math.random()*3)]
              });
            }
          });

          // Player collision
          if (m.alive && p.invuln <= 0 && Math.abs(p.x-m.x)<18 && Math.abs(p.y-m.y)<18) {
            s.lives--;
            setLives(s.lives);
            s.flash = 15;
            if (s.lives <= 0) {
              s.gameOver = true;
              setMsg("💀 انتهت اللعبة!");
            } else {
              p.invuln = 90;
            }
          }
        });
      }

      // Particles
      s.particles = s.particles.filter(pt => { pt.x+=pt.dx; pt.y+=pt.dy; pt.life--; return pt.life>0; });
      if (s.flash > 0) s.flash--;

      // === DRAW ===
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, W, H);

      // Maze
      for (let y=0; y<ROWS; y++) {
        for (let x=0; x<COLS; x++) {
          const tx = x*TILE, ty = y*TILE;
          if (s.maze[y][x] === WALL) {
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(tx, ty, TILE, TILE);
            ctx.strokeStyle = "#334155";
            ctx.lineWidth = 0.5;
            ctx.strokeRect(tx+1, ty+1, TILE-2, TILE-2);
          } else if (s.maze[y][x] === EXIT) {
            const pulse = Math.sin(frameRef.current * 0.08) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(52, 211, 153, ${pulse})`;
            ctx.fillRect(tx, ty, TILE, TILE);
            ctx.fillStyle = "#fff";
            ctx.font = "bold 18px monospace";
            ctx.textAlign = "center";
            ctx.fillText("🚪", tx+TILE/2, ty+TILE/2+6);
          } else {
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(tx, ty, TILE, TILE);
          }
        }
      }

      // Player
      const blink = p.invuln > 0 && Math.floor(frameRef.current/4) % 2;
      if (!blink) {
        ctx.save();
        ctx.translate(p.x, p.y);
        // Body
        ctx.fillStyle = "#3b82f6";
        ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#60a5fa";
        ctx.beginPath(); ctx.arc(-3, -3, 4, 0, Math.PI*2); ctx.fill();
        // Gun direction indicator
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(p.dir[0]*14, p.dir[1]*14);
        ctx.stroke();
        ctx.restore();
      }

      // Monsters
      s.monsters.forEach(m => {
        if (!m.alive) return;
        const wobble = Math.sin(frameRef.current*0.15 + m.id) * 2;
        ctx.save();
        ctx.translate(m.x, m.y + wobble);
        // Body
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(-10, 10);
        ctx.lineTo(-10, -4);
        ctx.quadraticCurveTo(-10, -12, 0, -12);
        ctx.quadraticCurveTo(10, -12, 10, -4);
        ctx.lineTo(10, 10);
        for(let i=0;i<5;i++){
          const lx = -10 + i*5;
          ctx.lineTo(lx+2.5, 6);
          ctx.lineTo(lx+5, 10);
        }
        ctx.fill();
        // Eyes
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(-4, -4, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(4, -4, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#1e1e2e";
        ctx.beginPath(); ctx.arc(-3, -3, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, -3, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      });

      // Bullets
      s.bullets.forEach(b => {
        ctx.fillStyle = "#fbbf24";
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Particles
      s.particles.forEach(pt => {
        ctx.globalAlpha = pt.life / 25;
        ctx.fillStyle = pt.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Flash
      if (s.flash > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${s.flash/15 * 0.3})`;
        ctx.fillRect(0, 0, W, H);
      }

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, W, 30);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`❤️ ${s.lives}`, 10, 20);
      ctx.textAlign = "center";
      ctx.fillText(`المستوى ${s.level}`, W/2, 20);
      ctx.textAlign = "right";
      ctx.fillText(`⭐ ${s.score}`, W-10, 20);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [screen]);

  if (screen === "menu") {
    return (
      <div style={{
        width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1628 100%)",
        fontFamily: "'Courier New', monospace", color: "#e2e8f0", gap: 20,
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.05,
          backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, #fff 0px, transparent 1px, transparent 32px)",
        }}/>
        <div style={{ fontSize: 64, lineHeight: 1 }}>🏰</div>
        <h1 style={{
          fontSize: 36, fontWeight: 900, margin: 0,
          background: "linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          textShadow: "none", letterSpacing: 2
        }}>
          هروب من المتاهة
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0, textAlign: "center", maxWidth: 350, lineHeight: 1.8 }}>
          اهرب من المتاهة وتجنب الوحوش!
          <br/>أطلق النار لتدميرهم واعثر على المخرج 🚪
        </p>
        <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", lineHeight: 2 }}>
          <span style={{color:"#fbbf24"}}>WASD / الأسهم</span> — تحرك
          <br/><span style={{color:"#fbbf24"}}>مسافة</span> — إطلاق نار
        </div>
        <button onClick={startGame} style={{
          marginTop: 10, padding: "14px 48px", fontSize: 18, fontWeight: 800,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          color: "#fff", border: "none", borderRadius: 12, cursor: "pointer",
          fontFamily: "inherit", letterSpacing: 1,
          boxShadow: "0 0 30px rgba(59,130,246,0.4)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseOver={e => { e.target.style.transform = "scale(1.05)"; e.target.style.boxShadow = "0 0 50px rgba(59,130,246,0.6)"; }}
        onMouseOut={e => { e.target.style.transform = "scale(1)"; e.target.style.boxShadow = "0 0 30px rgba(59,130,246,0.4)"; }}
        >
          ابدأ اللعبة
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#0a0a0f", fontFamily: "'Courier New', monospace", gap: 8, padding: 10
    }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          borderRadius: 8,
          border: "2px solid #1e293b",
          boxShadow: "0 0 40px rgba(59,130,246,0.15)",
          maxWidth: "100%",
          imageRendering: "pixelated"
        }}
      />

      {/* Touch controls */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 8 }}>
        <button onClick={() => handleTouch([0,-1])} style={touchBtn}>▲</button>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => handleTouch([-1,0])} style={touchBtn}>◄</button>
          <button onClick={handleShoot} style={{...touchBtn, background: "rgba(251,191,36,0.3)", color: "#fbbf24", width: 52}}>🔫</button>
          <button onClick={() => handleTouch([1,0])} style={touchBtn}>►</button>
        </div>
        <button onClick={() => handleTouch([0,1])} style={touchBtn}>▼</button>
      </div>

      {/* Overlay messages */}
      {msg && (
        <div style={{
          position: "fixed", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)",
          zIndex: 10, gap: 16
        }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#e2e8f0" }}>{msg}</div>
          <div style={{ fontSize: 18, color: "#fbbf24" }}>النقاط: {score}</div>
          {stateRef.current?.won && (
            <button onClick={nextLevel} style={{
              padding: "12px 36px", fontSize: 16, fontWeight: 800,
              background: "linear-gradient(135deg, #10b981, #3b82f6)",
              color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
              fontFamily: "inherit"
            }}>
              المستوى التالي ➜
            </button>
          )}
          <button onClick={startGame} style={{
            padding: "12px 36px", fontSize: 16, fontWeight: 800,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
            fontFamily: "inherit"
          }}>
            {stateRef.current?.gameOver ? "حاول مرة أخرى" : "من البداية"}
          </button>
        </div>
      )}
    </div>
  );
}

const touchBtn = {
  width: 48, height: 48, fontSize: 20,
  background: "rgba(59,130,246,0.2)",
  color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)",
  borderRadius: 10, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "inherit", userSelect: "none",
  WebkitTapHighlightColor: "transparent",
};
