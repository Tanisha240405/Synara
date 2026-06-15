'use client';
import { signIn } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const AUTH_WORDS = [
  'AUTHENTICATING',
  'LOADING WORKSPACE',
  'FETCHING DATA',
  'PREPARING ENV',
  'ACCESSING DASHBOARD',
  'SYNARA',
];

export default function Login() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('demo@synara.ai');
  const [password, setPassword] = useState('Synara@2026!');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [industrySegment, setIndustrySegment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [authWord, setAuthWord] = useState(0);
  const [authProgress, setAuthProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    window.addEventListener('resize', syncSize);
    syncSize();

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext;
    if (!gl) return;
    const vs = `attribute vec2 a_position;
    varying vec2 v_texCoord;
    void main() {
      v_texCoord = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }`;
    const fs = `precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;

    varying vec2 v_texCoord;

    float dither(vec2 pos, float brightness) {
        int x = int(mod(pos.x, 4.0));
        int y = int(mod(pos.y, 4.0));
        float threshold = 0.0;
        if (x == 0) {
            if (y == 0) threshold = 0.0625; else if (y == 1) threshold = 0.5625; else if (y == 2) threshold = 0.1875; else if (y == 3) threshold = 0.6875;
        } else if (x == 1) {
            if (y == 0) threshold = 0.8125; else if (y == 1) threshold = 0.3125; else if (y == 2) threshold = 0.9375; else if (y == 3) threshold = 0.4375;
        } else if (x == 2) {
            if (y == 0) threshold = 0.25; else if (y == 1) threshold = 0.75; else if (y == 2) threshold = 0.125; else if (y == 3) threshold = 0.625;
        } else if (x == 3) {
            if (y == 0) threshold = 1.0; else if (y == 1) threshold = 0.5; else if (y == 2) threshold = 0.875; else if (y == 3) threshold = 0.375;
        }
        return brightness > threshold ? 1.0 : 0.0;
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 mouse = u_mouse / u_resolution;
        vec3 purple = vec3(0.486, 0.361, 0.988);
        vec3 surface = vec3(0.063, 0.078, 0.086);
        float t = u_time * 0.4;
        float dist = length(uv - mouse);
        float glow = smoothstep(0.6, 0.0, dist);
        float noise = sin(uv.x * 8.0 + t) * cos(uv.y * 8.0 - t * 0.5);
        float brightness = mix(0.05, 0.7, glow + noise * 0.15 + 0.2);
        float d = dither(gl_FragCoord.xy, brightness);
        vec3 finalColor = mix(surface, purple * 0.5, d);
        float scanline = sin(gl_FragCoord.y * 1.0) * 0.03;
        finalColor -= scanline;
        gl_FragColor = vec4(finalColor, 1.0);
    }`;
    function cs(type: number, src: string) {
      if(!gl) return null;
      const s = gl.createShader(type);
      if(!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    const prog = gl.createProgram();
    const vShader = cs(gl.VERTEX_SHADER, vs);
    const fShader = cs(gl.FRAGMENT_SHADER, fs);
    if (!prog || !vShader || !fShader) return;
    
    gl.attachShader(prog, vShader);
    gl.attachShader(prog, fShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const handleMouseMove = (event: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    function render(t: number) {
      if (!canvas || !gl) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    }
    render(0);

    return () => {
      window.removeEventListener('resize', syncSize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const isValidPassword = (pwd: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isValidPassword(password)) {
      setError('Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, companyName, role, industrySegment })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to sign up');
        setLoading(false);
        return;
      }
    }

    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) {
      setError('Invalid credentials');
      setLoading(false);
    } else {
      setAuthSuccess(true);
      const CHAR_DELAY = 35;   // ms per letter
      const READING_PAUSE = 600; // extra ms to read it after it appears
      let i = 0;
      const scheduleNext = () => {
        const word = AUTH_WORDS[i] || 'SYNARA';
        const displayTime = word.length * CHAR_DELAY + READING_PAUSE;
        setTimeout(() => {
          i++;
          if (i >= AUTH_WORDS.length) {
            setTimeout(() => { window.location.href = '/dashboard'; }, 700);
          } else {
            setAuthWord(i);
            scheduleNext();
          }
        }, displayTime);
      };

      // Animate progress bar quickly
      let p = 0;
      const prog = setInterval(() => {
        p += Math.floor(Math.random() * 25) + 10;
        if (p >= 100) { 
          p = 100; 
          clearInterval(prog); 
          // Start word cycle ONLY when progress hits 100 and the words actually mount
          scheduleNext();
        }
        setAuthProgress(p);
      }, 120);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .glass-card-login {
            background: rgba(11, 15, 17, 0.95);
            backdrop-filter: blur(40px);
        }

        .gradient-border-wrapper {
            position: relative;
            padding: 1.5px;
            overflow: hidden;
        }

        .gradient-border-wrapper::before {
            content: '';
            position: absolute;
            inset: -250%;
            background: conic-gradient(
                from 0deg,
                transparent 0%,
                #7C5CFC 20%,
                transparent 40%,
                transparent 50%,
                #613de0 70%,
                transparent 90%,
                transparent 100%
            );
            animation: rotate 6s linear infinite;
        }

        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .pulse-dot {
            box-shadow: 0 0 0 0 rgba(124, 92, 252, 0.7);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(124, 92, 252, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(124, 92, 252, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(124, 92, 252, 0); }
        }

        .primary-btn-glass {
            background: linear-gradient(135deg, rgba(124, 92, 252, 0.9) 0%, rgba(97, 61, 224, 0.9) 100%);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .primary-btn-glass:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 20px rgba(124, 92, 252, 0.4);
            filter: brightness(1.1);
        }

        .primary-btn-glass:active {
            transform: scale(0.98);
        }

        .input-dark {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(147, 142, 161, 0.3);
            transition: all 0.2s ease;
        }

        .input-dark:focus {
            border-color: #7C5CFC;
            box-shadow: 0 0 0 2px rgba(124, 92, 252, 0.2);
            outline: none;
            background: rgba(0, 0, 0, 0.5);
        }
      `}} />

      {/* WebGL Dither Shader Background */}
      <div className="fixed inset-0 w-full h-full -z-10 bg-surface">
        <canvas ref={canvasRef} className="block w-full h-full"></canvas>
      </div>

      {/* Main Wrapper */}
      <main className="fixed inset-0 z-10 flex items-center justify-center p-margin-mobile overflow-y-auto">
        <div className="flex flex-col items-center my-auto py-8">
          <div className="gradient-border-wrapper rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-[500px] md:max-w-[600px]">
            <div className="glass-card-login relative z-10 rounded-[calc(0.75rem-1px)] p-xl flex flex-col">
              
              {/* Logo Section */}
              <div className="flex flex-col items-center mb-xl">
                <div className="flex flex-col items-center justify-center mb-6">
                  <Link href="/" className="hover:opacity-80 transition-opacity flex flex-col items-center">
                    <img src="/logo.png" alt="Synara" width={56} height={56} style={{ background: 'transparent' }} />
                    <span className="text-[24px] font-bold text-white mt-4 leading-none">Synara</span>
                    <span className="text-[12px] text-on-surface-variant uppercase tracking-widest mt-2 leading-none">Intelligence Terminal</span>
                  </Link>
                </div>
              </div>

              {error && <div className="bg-error-container text-on-error-container p-3 rounded text-sm mb-6 border border-error/50">{error}</div>}


              {/* Login Form */}
              {!authSuccess && (
                <>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                {isSignUp && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-2">
                    <div className="flex flex-col gap-xs group">
                      <label className="font-label-xs text-label-xs uppercase tracking-widest text-on-surface-variant ml-xs group-focus-within:text-primary transition-colors">Full Name</label>
                      <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="input-dark w-full h-11 px-md rounded-lg text-body-md text-on-surface placeholder:text-outline-variant" placeholder="Jane Doe" />
                    </div>
                    <div className="flex flex-col gap-xs group">
                      <label className="font-label-xs text-label-xs uppercase tracking-widest text-on-surface-variant ml-xs group-focus-within:text-primary transition-colors">Company Name</label>
                      <input required type="text" value={companyName} onChange={e=>setCompanyName(e.target.value)} className="input-dark w-full h-11 px-md rounded-lg text-body-md text-on-surface placeholder:text-outline-variant" placeholder="Acme Corp" />
                    </div>
                    <div className="flex flex-col gap-xs group">
                      <label className="font-label-xs text-label-xs uppercase tracking-widest text-on-surface-variant ml-xs group-focus-within:text-primary transition-colors">Role</label>
                      <input required type="text" value={role} onChange={e=>setRole(e.target.value)} className="input-dark w-full h-11 px-md rounded-lg text-body-md text-on-surface placeholder:text-outline-variant" placeholder="CMO" />
                    </div>
                    <div className="flex flex-col gap-xs group">
                      <label className="font-label-xs text-label-xs uppercase tracking-widest text-on-surface-variant ml-xs group-focus-within:text-primary transition-colors">Industry</label>
                      <select required value={industrySegment} onChange={e=>setIndustrySegment(e.target.value)} className="input-dark w-full h-11 px-md rounded-lg text-body-md text-on-surface appearance-none cursor-pointer">
                        <option value="" disabled>Select Industry</option>
                        <option value="apparel">Apparel & Fashion</option>
                        <option value="beauty">Beauty & Cosmetics</option>
                        <option value="electronics">Consumer Electronics</option>
                        <option value="fmcg">FMCG / Grocery</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-xs group">
                  <label className="font-label-xs text-label-xs uppercase tracking-widest text-on-surface-variant ml-xs group-focus-within:text-primary transition-colors">Email Address</label>
                  <input required value={email} onChange={e=>setEmail(e.target.value)} className="input-dark w-full h-11 px-md rounded-lg text-body-md text-on-surface placeholder:text-outline-variant" placeholder="demo@synara.ai" type="email" />
                </div>
                
                <div className="flex flex-col gap-xs group">
                  <div className="flex justify-between items-center px-xs">
                    <label className="font-label-xs text-label-xs uppercase tracking-widest text-on-surface-variant group-focus-within:text-primary transition-colors">Password</label>
                    {!isSignUp && <a className="font-label-xs text-label-xs text-primary hover:underline transition-all" href="#">Forgot?</a>}
                  </div>
                  <input required value={password} onChange={e=>setPassword(e.target.value)} className="input-dark w-full h-11 px-md rounded-lg text-body-md text-on-surface placeholder:text-outline-variant" placeholder="••••••••" type="password" />
                  {isSignUp && (() => {
                    const rules = [
                      { label: '8+ characters',   ok: password.length >= 8 },
                      { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
                      { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
                      { label: 'Number',           ok: /\d/.test(password) },
                      { label: 'Special char',     ok: /[@$!%*?&#]/.test(password) },
                    ];
                    return (
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 px-0.5">
                        {rules.map(r => (
                          <div
                            key={r.label}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-300 border ${
                              r.ok
                                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                                : 'bg-white/5 border-white/10 text-white/30'
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[13px] transition-all duration-300 ${
                                r.ok ? 'text-green-400' : 'text-white/20'
                              }`}
                              style={{ fontVariationSettings: r.ok ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              {r.ok ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            {r.label}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <button disabled={loading} className="primary-btn-glass w-full h-12 rounded-lg text-white font-headline-md text-headline-md flex items-center justify-center gap-sm mt-sm" type="submit">
                  {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                  {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
                </button>
              </form>

              <div className="relative flex items-center py-lg">
                <div className="flex-grow border-t border-outline-variant/30"></div>
                <span className="flex-shrink mx-md font-label-xs text-label-xs text-outline uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-outline-variant/30"></div>
              </div>

              <button onClick={handleGoogleSignIn} className="flex items-center justify-center gap-sm font-body-md text-on-surface hover:text-primary transition-colors duration-200 group w-full p-2">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Continue with Google
              </button>

              <div className="mt-8 text-center text-sm text-on-surface-variant flex flex-col gap-2">
                {isSignUp ? (
                  <p>Already have an account? <button onClick={() => setIsSignUp(false)} className="text-primary font-bold hover:underline">Sign in</button></p>
                ) : (
                  <p>Don't have an account? <button onClick={() => { setIsSignUp(true); setEmail(''); setPassword(''); }} className="text-primary font-bold hover:underline">Sign up</button></p>
                )}
              </div>

              {/* Hint Section */}
              {!isSignUp && (
                <div className="mt-lg pt-lg border-t border-outline-variant/20">
                  <button 
                    type="button"
                    onClick={() => {
                      setEmail('demo@synara.ai');
                      setPassword('Synara@2026!');
                    }}
                    className="w-full flex items-center justify-between bg-surface-container-low/50 hover:bg-surface-container-high/50 p-md rounded-lg border border-outline-variant/20 hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary text-[18px] group-hover:scale-110 transition-transform">bolt</span>
                      <div className="flex flex-col text-left gap-1">
                        <p className="font-label-xs text-label-xs text-outline leading-tight group-hover:text-primary transition-colors">USE DEMO CREDENTIALS</p>
                        <p className="font-data-tabular text-[12px] text-primary-fixed-dim">
                          demo@synara.ai
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[20px]">login</span>
                  </button>
                </div>
              )}
              </>
            )}
            </div>
          </div>

          {/* Footer Links */}
          <footer className="mt-xl flex justify-center gap-lg opacity-60">
            <a className="font-label-xs text-label-xs text-on-surface-variant hover:text-on-surface transition-colors" href="#">Privacy Policy</a>
            <a className="font-label-xs text-label-xs text-on-surface-variant hover:text-on-surface transition-colors" href="#">Terms of Service</a>
            <a className="font-label-xs text-label-xs text-on-surface-variant hover:text-on-surface transition-colors" href="#">Contact Support</a>
          </footer>
        </div>
      </main>

      {/* CINEMATIC AUTH SUCCESS PRELOADER — top-level, truly fullscreen */}
      <AnimatePresence>
        {authSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[9999] bg-[#0A0A0B] flex flex-col items-center justify-center overflow-hidden"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          >
            {/* Grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
            {/* Purple radial glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[600px] h-[600px] rounded-full bg-[#7C5CFC]/15 blur-[140px]" />
            </div>

            {/* Ghost percentage counter bottom-right */}
            <div className="absolute bottom-12 right-12 text-[100px] md:text-[160px] font-bold text-[#F0F2F5]/5 font-['JetBrains_Mono'] leading-none select-none">
              {Math.min(authProgress, 100)}%
            </div>

            {/* Centre content */}
            <div className="flex flex-col items-center justify-center relative z-10 gap-10 px-6 text-center">
              {/* Logo — fades & shrinks when progress hits 100 */}
              <motion.img
                src="/logo.png"
                alt="Synara"
                animate={authProgress >= 100 ? { opacity: 0, scale: 0.3, y: -60 } : { opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
                width={80}
                height={80}
                style={{ background: 'transparent' }}
                className="drop-shadow-[0_0_40px_rgba(124,92,252,0.9)]"
              />

              {/* Word animation — only shown when bar is full */}
              {authProgress >= 100 && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={authWord}
                    className="flex flex-wrap justify-center gap-0 max-w-[90vw]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {(AUTH_WORDS[authWord] || 'SYNARA').split('').map((char, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.035, duration: 0.25, ease: 'easeOut' }}
                        className="text-[#F0F2F5] font-['Bangers'] tracking-[0.15em] text-[42px] sm:text-[64px] md:text-[90px] drop-shadow-[0_0_25px_rgba(124,92,252,1)]"
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </motion.span>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Thin progress bar */}
              <div className="w-[300px] sm:w-[400px] h-[2px] bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7C5CFC, #cabeff)' }}
                  animate={{ width: `${Math.min(authProgress, 100)}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>

              <p className="text-[10px] text-white/25 uppercase tracking-[0.4em] font-['JetBrains_Mono'] -mt-4">
                Initializing Intelligence Terminal
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}