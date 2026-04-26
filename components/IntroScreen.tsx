'use client';
import { useEffect, useRef, useState } from 'react';

export default function IntroScreen({ onEnter }: { onEnter: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'launching'>('loading');
  const [progress, setProgress] = useState(0);
  const [rpm, setRpm] = useState(0);
  const frameRef = useRef(0);
  const sceneRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return;

    let raf = 0;
    let t = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl!.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    // ─── shaders ───
    const vert = `
      attribute vec3 a_pos;
      attribute float a_type; // 0=car, 1=particle, 2=grid
      uniform mat4 u_mvp;
      uniform float u_time;
      uniform float u_rpm;
      varying float v_type;
      varying float v_glow;
      void main() {
        v_type = a_type;
        vec3 p = a_pos;
        if (a_type == 1.0) {
          float angle = a_pos.x * 6.28 + u_time * (0.3 + a_pos.y * 0.5);
          float r = 2.5 + a_pos.y * 1.5;
          p = vec3(cos(angle)*r, a_pos.z * 2.0, sin(angle)*r);
          v_glow = 0.5 + 0.5 * sin(u_time * 2.0 + a_pos.x * 10.0);
        } else if (a_type == 2.0) {
          v_glow = 0.15 + 0.05 * sin(u_time + a_pos.x + a_pos.z);
        } else {
          p.y += sin(u_time * 1.5 + a_pos.x * 2.0) * 0.015;
          v_glow = 0.7 + 0.3 * u_rpm;
        }
        gl_Position = u_mvp * vec4(p, 1.0);
        gl_PointSize = a_type == 1.0 ? 2.5 : 1.0;
      }
    `;
    const frag = `
      precision mediump float;
      varying float v_type;
      varying float v_glow;
      uniform float u_time;
      uniform float u_rpm;
      void main() {
        vec3 fire  = vec3(1.0, 0.27, 0.0);
        vec3 fire2 = vec3(1.0, 0.44, 0.13);
        vec3 teal  = vec3(0.0, 0.9, 0.8);
        vec3 dim   = vec3(0.08, 0.08, 0.12);
        if (v_type == 1.0) {
          vec3 col = mix(fire, teal, sin(u_time * 0.5) * 0.5 + 0.5) * v_glow * 1.8;
          gl_FragColor = vec4(col, v_glow * 0.85);
        } else if (v_type == 2.0) {
          gl_FragColor = vec4(teal * v_glow, v_glow * 0.4);
        } else {
          vec3 col = mix(fire, fire2, v_glow) + teal * u_rpm * 0.3;
          gl_FragColor = vec4(col * v_glow, 0.95);
        }
      }
    `;

    function compileShader(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src); gl!.compileShader(s);
      return s;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const uMvp  = gl.getUniformLocation(prog, 'u_mvp');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRpm  = gl.getUniformLocation(prog, 'u_rpm');

    // ─── car wireframe (low poly sports car silhouette) ───
    const carVerts: number[] = [];
    const carLines: number[] = [
      // chassis base
      -1.8,-.3,-0.7,  1.8,-.3,-0.7,
       1.8,-.3,-0.7,  1.8,-.3, 0.7,
       1.8,-.3, 0.7, -1.8,-.3, 0.7,
      -1.8,-.3, 0.7, -1.8,-.3,-0.7,
      // roof line
      -0.9, 0.5,-0.5,  0.7, 0.5,-0.5,
       0.7, 0.5,-0.5,  0.7, 0.5, 0.5,
       0.7, 0.5, 0.5, -0.9, 0.5, 0.5,
      -0.9, 0.5, 0.5, -0.9, 0.5,-0.5,
      // windshield front
       0.7, 0.5,-0.5,  1.3,-.1,-0.55,
       0.7, 0.5, 0.5,  1.3,-.1, 0.55,
       1.3,-.1,-0.55,  1.3,-.1, 0.55,
      // rear glass
      -0.9, 0.5,-0.5, -1.4,-.1,-0.55,
      -0.9, 0.5, 0.5, -1.4,-.1, 0.55,
      -1.4,-.1,-0.55, -1.4,-.1, 0.55,
      // pillars
      -1.4,-.1,-0.55,  1.3,-.1,-0.55,
      -1.4,-.1, 0.55,  1.3,-.1, 0.55,
      // hood
       1.3,-.1,-0.55,  1.8,-.15,-0.6,
       1.3,-.1, 0.55,  1.8,-.15, 0.6,
       1.8,-.15,-0.6,  1.8,-.15, 0.6,
      // spoiler
      -1.6, 0.05,-0.65, -1.6, 0.05, 0.65,
      -1.6, 0.3,-0.5,  -1.6, 0.3, 0.5,
      -1.6, 0.3,-0.5,  -1.6, 0.05,-0.65,
      -1.6, 0.3, 0.5,  -1.6, 0.05, 0.65,
      -1.75,-.3,-0.5,  -1.6, 0.05,-0.5,
      -1.75,-.3, 0.5,  -1.6, 0.05, 0.5,
      // wheels outline (circles approximated as hexagons)
      ...[[-1.2, -0.6], [1.2, -0.6]].flatMap(([wx, wz]) =>
        Array.from({length:8}, (_,i) => {
          const a0 = (i/8)*Math.PI*2, a1 = ((i+1)/8)*Math.PI*2;
          return [wx, -.3+Math.cos(a0)*0.3, (wz as number)+Math.sin(a0)*0.15,
                  wx, -.3+Math.cos(a1)*0.3, (wz as number)+Math.sin(a1)*0.15];
        }).flat()
      ),
    ];
    for (let i = 0; i < carLines.length; i += 3) carVerts.push(carLines[i], carLines[i+1], carLines[i+2], 0);

    // ─── grid floor ───
    const gridVerts: number[] = [];
    for (let x = -6; x <= 6; x++) {
      gridVerts.push(x,-1,-6, 0, x,-1,6, 0); // type=2 — wait, we need to mark type
    }
    for (let z = -6; z <= 6; z++) {
      gridVerts.push(-6,-1,z, 0, 6,-1,z, 0);
    }
    // retype grid as type=2
    for (let i = 3; i < gridVerts.length; i += 4) gridVerts[i] = 2;

    // ─── particles ───
    const particleVerts: number[] = [];
    for (let i = 0; i < 300; i++) {
      particleVerts.push(Math.random(), Math.random() * 2 - 1, Math.random() * 4 - 2, 1);
    }

    // merge all
    const allVerts = [...carVerts, ...gridVerts, ...particleVerts];
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allVerts), gl.STATIC_DRAW);

    const stride = 4 * 4;
    const aPos  = gl.getAttribLocation(prog, 'a_pos');
    const aType = gl.getAttribLocation(prog, 'a_type');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos,  3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(aType);
    gl.vertexAttribPointer(aType, 1, gl.FLOAT, false, stride, 12);

    const carCount   = carVerts.length / 4;
    const gridCount  = gridVerts.length / 4;
    const partCount  = particleVerts.length / 4;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0.016, 0.016, 0.04, 1);

    // mat4 helpers
    function mat4Mul(a: number[], b: number[]) {
      const r = new Array(16).fill(0);
      for (let i=0;i<4;i++) for (let j=0;j<4;j++) for (let k=0;k<4;k++) r[i*4+j]+=a[i*4+k]*b[k*4+j];
      return r;
    }
    function perspective(fov: number, asp: number, n: number, f: number) {
      const t = Math.tan(fov/2), m = new Array(16).fill(0);
      m[0]=1/(asp*t); m[5]=1/t; m[10]=-(f+n)/(f-n); m[11]=-1; m[14]=-2*f*n/(f-n);
      return m;
    }
    function rotY(a: number) {
      const c=Math.cos(a),s=Math.sin(a),m=[...identity()];
      m[0]=c; m[2]=s; m[8]=-s; m[10]=c; return m;
    }
    function rotX(a: number) {
      const c=Math.cos(a),s=Math.sin(a),m=[...identity()];
      m[5]=c; m[6]=-s; m[9]=s; m[10]=c; return m;
    }
    function translate(x:number,y:number,z:number) {
      const m=identity(); m[12]=x; m[13]=y; m[14]=z; return m;
    }
    function identity() { const m=new Array(16).fill(0); m[0]=m[5]=m[10]=m[15]=1; return m; }

    let rpmVal = 0;
    let launchBurst = 0;

    sceneRef.current = { setRpmVal: (v: number) => { rpmVal = v; }, setLaunch: () => { launchBurst = 1; } };

    function draw() {
      t += 0.016;
      const w = canvas.width, h = canvas.height;
      gl!.viewport(0, 0, w, h);
      gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);

      const proj  = perspective(0.9, w/h, 0.1, 50);
      const dist  = launchBurst > 0 ? 3 - launchBurst * 2.5 : 3.5;
      const tView = translate(0, 0, -dist);
      const rY    = rotY(t * 0.4 + launchBurst * 2);
      const rX    = rotX(-0.25 - launchBurst * 0.3);
      const mv    = mat4Mul(tView, mat4Mul(rX, rY));
      const mvp   = mat4Mul(proj, mv);

      gl!.uniformMatrix4fv(uMvp,  false, mvp);
      gl!.uniform1f(uTime, t);
      gl!.uniform1f(uRpm,  rpmVal + launchBurst);

      if (launchBurst > 0) launchBurst = Math.max(0, launchBurst - 0.025);

      // car lines
      gl!.drawArrays(gl!.LINES, 0, carCount);
      // grid
      gl!.drawArrays(gl!.LINES, carCount, gridCount);
      // particles
      gl!.drawArrays(gl!.POINTS, carCount + gridCount, partCount);

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  // fake loading progress
  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v += Math.random() * 12 + 3;
      if (v >= 100) { v = 100; clearInterval(id); setTimeout(() => setPhase('ready'), 400); }
      setProgress(Math.min(100, v));
      setRpm(v / 100);
      sceneRef.current?.setRpmVal(v / 100);
    }, 80);
    return () => clearInterval(id);
  }, []);

  function handleEnter() {
    setPhase('launching');
    sceneRef.current?.setLaunch();
    setTimeout(onEnter, 1200);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#04040a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      opacity: phase === 'launching' ? 0 : 1,
      transition: phase === 'launching' ? 'opacity 1s ease' : 'none',
    }}>
      {/* WebGL canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* scanlines overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        zIndex: 1,
      }} />

      {/* vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(4,4,10,0.85) 100%)',
      }} />

      {/* UI layer */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', userSelect: 'none' }}>

        {/* logo */}
        <div style={{
          fontFamily: 'var(--f-display)', fontSize: 'clamp(52px,10vw,96px)',
          fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #ff4500 0%, #ff7020 40%, #ffb300 70%, #ff4500 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: `drop-shadow(0 0 ${20 + rpm * 40}px rgba(255,69,0,${0.3 + rpm * 0.5}))`,
          marginBottom: '4px',
          transition: 'filter 0.1s',
        }}>MIDNIGHT</div>
        <div style={{
          fontFamily: 'var(--f-display)', fontSize: 'clamp(14px,3vw,22px)',
          fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase',
          color: '#00e5cc', opacity: 0.9,
          marginBottom: '48px',
          textShadow: '0 0 20px rgba(0,229,204,0.6)',
        }}>CIRCUIT</div>

        {/* RPM arc / speedometer */}
        <RpmGauge rpm={rpm} />

        <div style={{ height: '40px' }} />

        {/* progress bar */}
        {phase === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '260px' }}>
            <div style={{
              width: '100%', height: '2px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '99px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: 'linear-gradient(90deg, #ff4500, #ff7020, #ffb300)',
                borderRadius: '99px',
                boxShadow: '0 0 12px rgba(255,69,0,0.8)',
                transition: 'width 0.08s linear',
              }} />
            </div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>
              {loadingPhrase(progress)}
            </div>
          </div>
        )}

        {/* enter button */}
        {phase === 'ready' && (
          <button
            onClick={handleEnter}
            style={{
              fontFamily: 'var(--f-display)', fontSize: '18px', fontWeight: 900,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #ff4500, #ff7020)',
              color: '#fff',
              border: 'none', borderRadius: '4px',
              cursor: 'pointer',
              boxShadow: '0 0 32px rgba(255,69,0,0.6), 0 0 80px rgba(255,69,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
              animation: 'pulse-btn 1.5s ease-in-out infinite',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 48px rgba(255,69,0,0.9), 0 0 100px rgba(255,69,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
              sceneRef.current?.setRpmVal(1.5);
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(255,69,0,0.6), 0 0 80px rgba(255,69,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              sceneRef.current?.setRpmVal(1);
            }}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>⚡ INICIAR CORRIDA</span>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              animation: 'shimmer 2s linear infinite',
            }} />
          </button>
        )}

        {phase === 'launching' && (
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '22px', fontWeight: 900, letterSpacing: '0.3em', color: '#ff7020', textShadow: '0 0 30px rgba(255,112,32,0.8)' }}>
            LET'S GO 🔥
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-btn {
          0%, 100% { box-shadow: 0 0 32px rgba(255,69,0,0.6), 0 0 80px rgba(255,69,0,0.2); }
          50% { box-shadow: 0 0 48px rgba(255,69,0,0.9), 0 0 120px rgba(255,69,0,0.35); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

function RpmGauge({ rpm }: { rpm: number }) {
  const r = 80, cx = 110, cy = 110;
  const startA = Math.PI * 0.75, endA = Math.PI * 2.25;
  const sweep = endA - startA;
  const angle = startA + sweep * Math.min(rpm, 1);

  function arc(fromA: number, toA: number, radius: number) {
    const x1 = cx + radius * Math.cos(fromA), y1 = cy + radius * Math.sin(fromA);
    const x2 = cx + radius * Math.cos(toA),   y2 = cy + radius * Math.sin(toA);
    const large = toA - fromA > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  }

  const needleX = cx + (r - 10) * Math.cos(angle);
  const needleY = cy + (r - 10) * Math.sin(angle);
  const rpmNum  = Math.round(rpm * 8000);
  const redline = rpm > 0.8;

  return (
    <svg width="220" height="160" style={{ overflow: 'visible' }}>
      {/* track */}
      <path d={arc(startA, endA, r)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" strokeLinecap="round" />
      {/* fill */}
      <path d={arc(startA, angle, r)} fill="none"
        stroke={redline ? '#ff0040' : 'url(#rpmGrad)'} strokeWidth="4" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${redline ? '#ff0040' : '#ff7020'})`, transition: 'stroke 0.15s' }}
      />
      {/* tick marks */}
      {Array.from({length:9},(_,i) => {
        const a = startA + sweep * (i/8);
        const inner = r - 12, outer = r + 2;
        return <line key={i}
          x1={cx+inner*Math.cos(a)} y1={cy+inner*Math.sin(a)}
          x2={cx+outer*Math.cos(a)} y2={cy+outer*Math.sin(a)}
          stroke={i>=7?'#ff0040':'rgba(255,255,255,0.2)'} strokeWidth={i===0||i===8?2:1} />;
      })}
      {/* needle */}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY}
        stroke="#fff" strokeWidth="1.5" strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }} />
      <circle cx={cx} cy={cy} r={4} fill="#ff7020" style={{ filter: 'drop-shadow(0 0 6px #ff7020)' }} />
      {/* rpm number */}
      <text x={cx} y={cy+32} textAnchor="middle"
        style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '22px', fontWeight: 600, fill: redline ? '#ff0040' : '#ff7020', filter: `drop-shadow(0 0 8px ${redline?'#ff0040':'#ff7020'})` }}>
        {rpmNum.toString().padStart(4,'0')}
      </text>
      <text x={cx} y={cy+48} textAnchor="middle"
        style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fill: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
        RPM
      </text>
      <defs>
        <linearGradient id="rpmGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ff4500" />
          <stop offset="60%"  stopColor="#ff7020" />
          <stop offset="100%" stopColor="#ffb300" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function loadingPhrase(p: number) {
  if (p < 20)  return 'INICIANDO MOTORES...';
  if (p < 40)  return 'CARREGANDO CIRCUITO...';
  if (p < 60)  return 'SINCRONIZANDO GPS...';
  if (p < 80)  return 'AQUECENDO PNEUS...';
  if (p < 95)  return 'VERIFICANDO RIVALS...';
  return 'PRONTO PARA A PISTA';
}
