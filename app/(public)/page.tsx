'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const preloaderWords = ['BONJOUR', 'HOLA', 'CIAO', 'NAMASTE', 'HELLO', 'SYNARA'];

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();

  // Allow authenticated users to view the landing page without being forced to dashboard

  const { scrollY } = useScroll();
  const navBackground = useTransform(scrollY, [0, 100], ['rgba(10, 10, 11, 0)', 'rgba(10, 10, 11, 0.8)']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [contactStatus, setContactStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [logoExpanded, setLogoExpanded] = useState(false);
  
  // Preloader State
  const [showPreloader, setShowPreloader] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentWord, setCurrentWord] = useState(0);

  useEffect(() => {
    if (showPreloader) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showPreloader]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowPreloader(false), 4500);
          return 100;
        }
        return p + Math.floor(Math.random() * 20) + 10;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const CHAR_DELAY = 40; // ms per letter
      const READING_PAUSE = 600; // ms to pause
      let i = 0;
      const scheduleNext = () => {
        const word = preloaderWords[i] || 'SYNARA';
        const displayTime = word.length * CHAR_DELAY + READING_PAUSE;
        setTimeout(() => {
          i++;
          if (i >= preloaderWords.length) {
            // Done
          } else {
            setCurrentWord(i);
            scheduleNext();
          }
        }, displayTime);
      };
      
      // Delay the start slightly so the logo has time to fade out
      setTimeout(scheduleNext, 300);
    }
  }, [progress]);
  
  // Triangle Animation
  const [triangleStep, setTriangleStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTriangleStep(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Typewriter effect for Segment Builder
  const [queryText, setQueryText] = useState('');
  const fullQuery = "Find loyal customers in Mumbai who haven't shopped in 2 months";
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setQueryText(fullQuery.slice(0, i));
      i++;
      if (i > fullQuery.length + 20) i = 0; // pause at end
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect for Copilot
  const [copilotText, setCopilotText] = useState('');
  const fullCopilot = "> SYNARA\nYour Gold-tier segment engagement dropped 18% this week. I've prepared a win-back campaign — 94 shoppers, WhatsApp, predicted 38–42% open rate. Launch it?";
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setCopilotText(fullCopilot.slice(0, i));
      i++;
      if (i > fullCopilot.length + 20) i = 0; // pause at end
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F0F2F5] font-['Inter'] selection:bg-[#7C5CFC]/30 overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>
      
      {/* Full-page fixed grid background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808014_1px,transparent_1px),linear-gradient(to_bottom,#80808014_1px,transparent_1px)] bg-[size:48px_48px]" />
        {/* Ambient purple glow top-center */}
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[#7C5CFC]/8 blur-[160px]" />
        {/* Ambient blue glow bottom-left */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[500px] rounded-full bg-[#0566d9]/6 blur-[140px]" />
        {/* Faint grid fade at bottom so footer feels grounded */}
        <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-[#0A0A0B] to-transparent" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg-base: #0A0A0B;
          --bg-surface: #111114;
          --bg-card: #16181C;
          --bg-elevated: #1E2128;
          --border: #2A2D35;
          --text-primary: #F0F2F5;
          --text-secondary: #8B8FA8;
          --text-muted: #4B5065;
          --accent-purple: #7C5CFC;
          --accent-purple-dim: rgba(124, 92, 252, 0.15);
          --accent-green: #22C55E;
          --accent-blue: #3B82F6;
          --accent-amber: #F59E0B;
        }
        
        .hero-bg {
          background-image: 
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,92,252,0.25), transparent),
            linear-gradient(#2A2D35 1px, transparent 1px),
            linear-gradient(90deg, #2A2D35 1px, transparent 1px);
          background-size: 100% 100%, 60px 60px, 60px 60px;
          background-position: top center;
        }
        
        .grid-bg-subtle {
          background-image: 
            linear-gradient(#2A2D35 1px, transparent 1px),
            linear-gradient(90deg, #2A2D35 1px, transparent 1px);
          background-size: 60px 60px;
          opacity: 0.05;
        }

        .marquee-container {
          display: flex;
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        
        .marquee-content {
          display: flex;
          animation: scroll 20s linear infinite;
        }
        
        .marquee-container:hover .marquee-content {
          animation-play-state: paused;
        }
        
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .floating-dashboard {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(-8px); }
          50% { transform: translateY(0px); }
        }

        .marching-ants {
          background-image: linear-gradient(90deg, #7C5CFC 50%, transparent 50%), linear-gradient(90deg, #7C5CFC 50%, transparent 50%), linear-gradient(0deg, #7C5CFC 50%, transparent 50%), linear-gradient(0deg, #7C5CFC 50%, transparent 50%);
          background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
          background-size: 15px 1px, 15px 1px, 1px 15px, 1px 15px;
          background-position: left top, right bottom, left bottom, right top;
          animation: border-dance 1s infinite linear;
        }

        @keyframes border-dance {
          0% { background-position: left top, right bottom, left bottom, right top; }
          100% { background-position: left 15px top, right 15px bottom, left bottom 15px, right top 15px; }
        }
      `}} />

      {/* EXPANDED LOGO MODAL */}
      <AnimatePresence>
        {logoExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLogoExpanded(false)}
            className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center cursor-pointer"
          >
            <motion.img 
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              src="/logo.png" 
              alt="Synara Full Logo" 
              className="w-[80vw] max-w-[600px] object-contain drop-shadow-[0_0_100px_rgba(124,92,252,0.5)]" 
              style={{ background: 'transparent' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRELOADER */}
      <AnimatePresence>
        {showPreloader && (
          <motion.div 
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[999] bg-[#0A0A0B] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>

            <motion.div 
              exit={{ scale: 30, opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
              className="absolute bottom-10 right-10 md:bottom-20 md:right-20 text-[60px] md:text-[160px] font-bold text-[#F0F2F5]/5 font-['JetBrains_Mono'] leading-none transform origin-bottom-right"
            >
              {Math.min(progress, 100)}%
            </motion.div>
            
            <motion.div 
              exit={{ scale: 40, opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
              className="flex flex-col items-center justify-center relative z-10 w-full h-full transform origin-center"
            >
              <div className="overflow-hidden relative z-10 w-full flex justify-center">
                <div className="flex items-center justify-center relative w-full h-[160px]">
                  
                  {progress === 100 && (
                    <motion.div className="absolute z-0 flex items-center justify-center">
                      <motion.div key={currentWord} className="flex">
                        {(preloaderWords[currentWord] || 'SYNARA').split('').map((char, i) => (
                            <motion.span
                              key={i}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04, duration: 0.25, ease: 'easeOut' }}
                              className="text-[#F0F2F5] tracking-[0.2em] font-['Bangers'] text-[60px] md:text-[120px] drop-shadow-[0_0_20px_rgba(124,92,252,0.8)]"
                            >
                              {char}
                            </motion.span>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}

                  <motion.img 
                    animate={progress === 100 ? { opacity: 0, scale: 0.5, y: -50 } : { opacity: 1, scale: 1, y: 0 }} 
                    transition={{ duration: 0.5, ease: "easeIn" }}
                    src="/logo.png" 
                    alt="Synara Logo" 
                    width={160} 
                    height={160} 
                    className="relative z-10 object-contain drop-shadow-[0_0_50px_rgba(124,92,252,0.5)]" 
                    style={{ background: 'transparent' }} 
                  />
                </div>
              </div>
              
              <div className="w-[200px] h-[2px] bg-[var(--border)] mt-12 overflow-hidden relative z-10 rounded-full">
                <motion.div 
                  className="h-full bg-[var(--accent-purple)]"
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>
              <div className="mt-4 text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.3em] z-10">
                Initializing Intelligence Terminal
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="fixed top-0 left-0 right-0 h-[2px] bg-[var(--accent-purple)] z-[100] origin-left"
        style={{ scaleX: useTransform(scrollY, [0, 3000], [0, 1]) }}
      />

      {/* NAVBAR */}
      <motion.nav 
        style={{ backgroundColor: navBackground }}
        className="fixed top-0 w-full h-[64px] backdrop-blur-[12px] border-b border-[var(--border)] z-50 flex items-center justify-between px-6 transition-colors duration-300"
      >
        <div className="flex items-center gap-3">
          <button onClick={() => setLogoExpanded(true)} className="hover:scale-105 transition-transform outline-none focus:outline-none">
            <img src="/logo.png" alt="Synara Logo" width={32} height={32} style={{ background: 'transparent' }} className="drop-shadow-[0_0_10px_rgba(124,92,252,0.4)]" />
          </button>
          <div className="flex flex-col">
            <Link href="/" className="font-bold text-[18px] leading-tight hover:text-[var(--accent-purple)] transition-colors">Synara</Link>
            <span className="text-[9px] uppercase text-[var(--text-muted)] tracking-widest leading-tight">Intelligence Terminal</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-[32px]">
          {['Features', 'How It Works', 'Results', 'Pricing'].map(item => (
            <Link key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-[14px] text-[var(--text-secondary)] hover:text-[#F0F2F5] transition-colors duration-150">
              {item}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="glassy-btn px-[20px] py-[8px] rounded-[8px] text-[14px] font-medium text-white">
            Sign In
          </Link>
        </div>

        <button className="md:hidden text-[var(--text-secondary)]" onClick={() => setIsMobileMenuOpen(true)}>
          <span className="material-symbols-outlined">menu</span>
        </button>
      </motion.nav>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0A0A0B] z-[60] flex flex-col p-8 pt-24"
          >
            <button className="absolute top-6 right-6 text-[var(--text-secondary)]" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex flex-col gap-8 text-2xl font-bold">
              {['Features', 'How It Works', 'Results', 'Pricing'].map(item => (
                <Link key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} onClick={() => setIsMobileMenuOpen(false)}>
                  {item}
                </Link>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-4">
              <Link href="/login" className="w-full text-center py-4 rounded-xl border border-[var(--border)] text-[#F0F2F5]">Sign In</Link>
              <Link href="/login" className="glassy-btn w-full text-center py-4 rounded-xl text-white">Start Free Trial</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="relative min-h-[100vh] pt-[120px] pb-20 px-6 hero-bg flex flex-col items-center">
        <AnimatePresence>
          {!showPreloader && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
              className="max-w-[900px] w-full mx-auto flex flex-col items-center text-center mt-12"
            >
          
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6">
            <img src="/logo.png" alt="Synara Logo" width={72} height={72} style={{ background: 'transparent' }} className="drop-shadow-[0_0_20px_rgba(124,92,252,0.5)]" />
          </motion.div>

          <motion.div 
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center gap-2 border border-[var(--accent-purple)] bg-[var(--accent-purple-dim)] px-4 py-1.5 rounded-full mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-[pulse_2s_infinite]"></span>
            <span className="text-[12px] font-medium text-[#F0F2F5]">✦ Now powered by Groq — responses in under 1s</span>
          </motion.div>

          <h1 className="text-[36px] md:text-[48px] lg:text-[72px] font-bold leading-[1.1] mb-6 relative">
            {"Intelligent CRM for".split(' ').map((word, i) => (
              <motion.span key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }} className="inline-block mr-3">
                {word}
              </motion.span>
            ))}
            <br className="hidden md:block"/>
            {"Brands That".split(' ').map((word, i) => (
              <motion.span key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }} className="inline-block mr-3">
                {word}
              </motion.span>
            ))}
            <motion.span initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="inline-block relative">
              Reach.
              <svg className="absolute -bottom-4 left-0 w-full h-[12px]" viewBox="0 0 200 12" preserveAspectRatio="none">
                <motion.path 
                  d="M0,8 Q50,-2 100,8 T200,8" 
                  fill="none" 
                  stroke="var(--accent-purple)" 
                  strokeWidth="4" 
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 0.8, ease: "easeInOut" }}
                />
              </svg>
            </motion.span>
          </h1>

          <motion.p 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-[18px] text-[var(--text-secondary)] max-w-[600px] mx-auto mb-10 leading-relaxed"
          >
            Synara helps consumer brands segment their shoppers, launch AI-crafted campaigns across WhatsApp, SMS, Email & RCS, and watch every delivery happen in real time.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/login" className="glassy-btn w-full sm:w-auto px-[32px] py-[14px] rounded-[10px] text-[16px] font-medium text-white flex items-center justify-center gap-2">
                Start for Free <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <div className="relative w-full sm:w-auto">
                <div className="glassy-btn-blue w-full sm:w-auto text-white px-[32px] py-[14px] rounded-[10px] text-[16px] font-medium flex justify-center items-center gap-2 border border-transparent opacity-70 cursor-not-allowed">
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span> View Demo
                </div>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-3 -right-2 md:-right-6 bg-gradient-to-r from-[#7C5CFC] to-[#5a3bc2] text-white text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(124,92,252,0.8)] border border-white/20 flex items-center gap-1.5 z-10 pointer-events-none"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5ff] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e5ff]"></span>
                  </span>
                  Coming Soon
                </motion.div>
              </div>
            </div>
            <p className="text-[12px] text-[var(--text-muted)]">No credit card required · Free tier available · Setup in 5 minutes</p>
          </motion.div>

          {/* HERO VISUAL */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, duration: 0.6 }}
            className="w-full max-w-[1000px] mt-20 relative"
          >
            {/* Left Floating Mini Card */}
            <motion.div 
              initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.8 }}
              className="absolute -left-12 top-20 bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-lg flex items-center gap-3 z-20 shadow-xl"
              style={{ rotate: '-3deg' }}
            >
              <span className="text-[var(--accent-green)]">✦</span>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-[var(--text-secondary)]">WhatsApp · Delivered</span>
                <span className="text-[12px] font-medium">Priya Sharma · 2s ago</span>
              </div>
            </motion.div>

            {/* Right Floating Mini Card */}
            <motion.div 
              initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.8 }}
              className="absolute -right-8 bottom-32 bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-lg flex flex-col items-center justify-center z-20 shadow-xl"
              style={{ rotate: '3deg' }}
            >
              <span className="text-[10px] text-[var(--text-secondary)]">Open Rate ↑</span>
              <span className="text-[16px] font-bold text-[var(--accent-green)]">67.2%</span>
            </motion.div>

            <div className="floating-dashboard bg-[var(--bg-card)] border border-[var(--border)] rounded-[16px] shadow-[0_0_80px_rgba(124,92,252,0.2)] overflow-hidden flex flex-col relative z-10">
              {/* Ticker */}
              <div className="h-6 bg-[var(--bg-elevated)] border-b border-[var(--border)] flex items-center px-4 overflow-hidden">
                <div className="flex gap-8 text-[10px] text-[var(--text-secondary)] font-['JetBrains_Mono'] whitespace-nowrap animate-[scroll_10s_linear_infinite]">
                  <span>NEW DELIVERY: +9198765*****</span>
                  <span>CLICK: URL_TOKEN_A8F2</span>
                  <span>CONVERSION: ₹4,200 (ORDER_991)</span>
                  <span>NEW DELIVERY: +9198765*****</span>
                  <span>CLICK: URL_TOKEN_A8F2</span>
                </div>
              </div>
              
              <div className="p-6 flex flex-col gap-6 text-left">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { l: 'Total Sent', v: '8,915' },
                    { l: 'Delivered', v: '6,166' },
                    { l: 'Open Rate', v: '67.2%' },
                    { l: 'Conversions', v: '621' }
                  ].map(s => (
                    <div key={s.l} className="bg-[var(--bg-base)] border border-[var(--border)] p-4 rounded-xl">
                      <div className="text-[11px] text-[var(--text-secondary)] mb-1">{s.l}</div>
                      <div className="text-[20px] font-bold">{s.v}</div>
                    </div>
                  ))}
                </div>
                
                {/* Campaigns */}
                <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl overflow-hidden">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 border-b border-[var(--border)] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[var(--accent-green)]"></div>
                        <span className="text-[13px] font-medium">Historical Campaign {i}</span>
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-['JetBrains_Mono']">Delivered: 2,{100 * i}</div>
                    </div>
                  ))}
                </div>

                <div className="absolute bottom-6 right-6">
                  <button className="bg-[var(--bg-elevated)] border border-[var(--accent-purple)] text-[var(--accent-purple)] px-4 py-2 rounded-full text-[12px] font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(124,92,252,0.3)]">
                    ✦ Ask AI
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* MARQUEE */}
        <div className="w-full max-w-[1200px] mt-24 flex flex-col items-center">
          <p className="text-[12px] text-[var(--text-muted)] uppercase tracking-widest mb-6">Trusted by brands reaching 1M+ shoppers</p>
          <div className="marquee-container w-full">
            <div className="marquee-content gap-16 text-[var(--text-muted)] font-bold text-[20px] tracking-wider">
              {['FASHION CO', 'BREW HOUSE', 'GLOW BEAUTY', 'METRO RETAIL', 'SPICE BRAND', 'URBAN WEAR', 'FASHION CO', 'BREW HOUSE', 'GLOW BEAUTY', 'METRO RETAIL', 'SPICE BRAND', 'URBAN WEAR'].map((brand, i) => (
                <span key={i} className="whitespace-nowrap">{brand}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES / WHAT SYNARA DOES */}
      <section id="features" className="py-32 px-6 bg-[var(--bg-surface)]">
        <div className="max-w-[1200px] mx-auto flex flex-col">
          <div className="text-center mb-16">
            <h4 className="text-[11px] text-[var(--accent-purple)] uppercase tracking-widest font-bold mb-4">WHAT SYNARA DOES</h4>
            <h2 className="text-[36px] md:text-[48px] font-bold mb-4">Everything Your Brand Needs to Reach Smarter</h2>
            <p className="text-[16px] text-[var(--text-secondary)]">From raw data to real-time campaign performance — all in one intelligence terminal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD 1 */}
            <motion.div initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[16px] p-8 flex flex-col justify-start gap-8 row-span-2">
              <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-4">
                <div className="border border-[var(--border)] rounded p-3 text-[13px] font-['JetBrains_Mono'] text-[var(--text-secondary)] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">search</span>
                  {queryText}<span className="animate-pulse">|</span>
                </div>
                <div className="relative h-[220px] w-full mt-6 mb-2">
                  {/* Subtle connecting lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.15 }}>
                     <polygon points="50%,15% 85%,85% 15%,85%" fill="none" stroke="var(--accent-purple)" strokeWidth="1" strokeDasharray="4 4" />
                  </svg>
                  
                  {[
                    { title: 'Churn Risk: VIP', count: '1,248 users', color: 'var(--accent-purple)' },
                    { title: 'Recent First-Timers', count: '3,492 users', color: 'var(--accent-blue)' },
                    { title: 'Holiday Buyers', count: '8,105 users', color: 'var(--accent-green)' },
                  ].map((item, index) => {
                    const posIndex = (index + triangleStep) % 3;
                    const positions = [
                      { top: '0%', left: '50%', x: '-50%', y: '0%' },     // Top Center
                      { top: '100%', left: '100%', x: '-100%', y: '-100%' },// Bottom Right
                      { top: '100%', left: '0%', x: '0%', y: '-100%' }      // Bottom Left
                    ];
                    const pos = positions[posIndex];
                    
                    return (
                      <motion.div
                        key={item.title}
                        animate={{ top: pos.top, left: pos.left, x: pos.x, y: pos.y }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)] flex flex-col gap-1 min-w-[140px] shadow-2xl z-10"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}></div>
                          <span className="text-[12px] whitespace-nowrap font-medium">{item.title}</span>
                        </div>
                        <span className="text-[11px] text-[var(--accent-green)] font-['JetBrains_Mono']">{item.count}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-[24px] font-bold mb-3">AI-Powered Segmentation</h3>
                <p className="text-[15px] text-[var(--text-secondary)] mb-4 leading-relaxed">Type what you need in plain English. Synara's AI translates it into precision audience filters instantly — no SQL, no guesswork.</p>
                <div className="flex gap-2">
                  {['Natural Language', 'Auto-Filters', 'Real-time Count'].map(t => <span key={t} className="text-[10px] bg-[var(--bg-elevated)] px-2 py-1 rounded text-[var(--text-secondary)]">{t}</span>)}
                </div>
              </div>
            </motion.div>

            {/* CARD 2 */}
            <motion.div initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[16px] p-8">
              <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  {['Target', 'Channel', 'Creative', 'Deploy'].map((s,i) => (
                    <div key={s} className={`text-[11px] font-bold uppercase tracking-widest ${i===0 ? 'text-[var(--accent-purple)]' : 'text-[var(--text-muted)]'}`}>{s}</div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-[var(--bg-elevated)] border-2 border-[var(--accent-green)] rounded-lg p-3 flex flex-col items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                    <img src="https://www.svgrepo.com/show/475692/whatsapp-color.svg" className="w-6 h-6" alt="WA" />
                    <span className="text-[11px] font-medium">WhatsApp</span>
                  </div>
                  <div className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-3 flex flex-col items-center gap-2 opacity-50">
                    <span className="material-symbols-outlined text-[24px]">sms</span>
                    <span className="text-[11px] font-medium">SMS</span>
                  </div>
                  <div className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-3 flex flex-col items-center gap-2 opacity-50">
                    <span className="material-symbols-outlined text-[24px]">email</span>
                    <span className="text-[11px] font-medium">Email</span>
                  </div>
                </div>
              </div>
              <h3 className="text-[20px] font-bold mb-2">Multi-Channel Campaign Builder</h3>
              <p className="text-[14px] text-[var(--text-secondary)]">Build campaigns across WhatsApp, SMS, Email, and RCS in 4 steps. AI drafts your message copy — you just hit send.</p>
            </motion.div>

            {/* CARD 3 */}
            <motion.div initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[16px] p-8">
              <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl p-6 mb-8 flex flex-col gap-3">
                {[
                  { l: 'Delivered', v: 6168, c: 'var(--accent-blue)', w: '100%' },
                  { l: 'Opened', v: 4151, c: 'var(--accent-purple)', w: '67%' },
                  { l: 'Clicked', v: 1660, c: 'var(--accent-green)', w: '27%' },
                  { l: 'Converted', v: 623, c: 'var(--accent-amber)', w: '10%' },
                ].map((b,i) => (
                  <div key={b.l} className="flex items-center gap-4">
                    <div className="w-[70px] text-[11px] text-[var(--text-secondary)]">{b.l}</div>
                    <div className="flex-1 bg-[var(--bg-elevated)] h-[12px] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: b.w }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i*0.1 }} className="h-full rounded-full" style={{ backgroundColor: b.c }}></motion.div>
                    </div>
                    <div className="w-[40px] text-right text-[11px] font-['JetBrains_Mono']">{b.v}</div>
                  </div>
                ))}
                <div className="mt-2 border-l-2 border-[var(--accent-purple)] bg-[var(--accent-purple-dim)] p-2 rounded-r text-[10px] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-[var(--accent-purple)]">auto_awesome</span>
                  Engagement drop in High spenders segment · Execute Recovery →
                </div>
              </div>
              <h3 className="text-[20px] font-bold mb-2">Real-Time Analytics & Anomaly Detection</h3>
              <p className="text-[14px] text-[var(--text-secondary)]">Every delivery, open, and click updates your dashboard live. AI flags anomalies and suggests recovery campaigns before you notice them.</p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-[1000px] mx-auto flex flex-col">
          <div className="text-center mb-24">
            <h4 className="text-[11px] text-[var(--accent-purple)] uppercase tracking-widest font-bold mb-4">HOW IT WORKS</h4>
            <h2 className="text-[36px] md:text-[48px] font-bold mb-4">From Data to Delivered. In Minutes.</h2>
            <p className="text-[16px] text-[var(--text-secondary)]">Four steps from raw shopper data to a live campaign with real-time tracking</p>
          </div>

          <div className="flex flex-col gap-32 relative">
            {/* Step 1 */}
            <motion.div initial={{ x: -60, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true, margin: "-100px" }} className="flex flex-col md:flex-row items-center gap-16 relative">
              <div className="absolute -left-10 top-0 text-[120px] font-bold text-[var(--text-muted)] opacity-5 leading-none pointer-events-none">01</div>
              <div className="flex-1 w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-8 marching-ants">
                <div className="flex flex-col items-center justify-center h-[200px] gap-4">
                  <span className="material-symbols-outlined text-[48px] text-[var(--text-secondary)]">upload_file</span>
                  <div className="text-[14px] font-bold">customers.csv · 524 rows detected</div>
                  <div className="bg-[var(--bg-base)] border border-[var(--accent-purple)] px-3 py-1 rounded-full text-[12px] flex items-center gap-2">
                    <span className="text-[var(--text-secondary)]">cust_email</span> <span className="material-symbols-outlined text-[14px]">arrow_forward</span> <span className="text-[var(--accent-green)]">Email (99% match)</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <div className="inline-block px-2 py-1 bg-[var(--bg-elevated)] text-[var(--accent-green)] text-[10px] font-bold uppercase tracking-widest rounded w-max border border-[var(--border)]">AI READY</div>
                <h3 className="text-[28px] font-bold">Import Your Data</h3>
                <p className="text-[16px] text-[var(--text-secondary)] leading-relaxed">Upload your customer CSV or JSON. Synara's AI maps your columns automatically — no manual field matching required.</p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div initial={{ x: 60, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true, margin: "-100px" }} className="flex flex-col md:flex-row-reverse items-center gap-16 relative">
              <div className="absolute -right-10 top-0 text-[120px] font-bold text-[var(--text-muted)] opacity-5 leading-none pointer-events-none">02</div>
              <div className="flex-1 w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-8">
                <div className="bg-[var(--bg-base)] rounded-lg p-4 border border-[var(--border)] flex flex-col gap-4">
                  <div className="text-[13px] font-['JetBrains_Mono'] text-[var(--text-secondary)] border-b border-[var(--border)] pb-4">Gold customers inactive for 45+ days...</div>
                  <div className="flex justify-between items-center bg-[var(--accent-purple-dim)] p-3 rounded">
                    <span className="text-[12px] font-bold text-[var(--accent-purple)]">3,442 shoppers matched</span>
                    <span className="material-symbols-outlined text-[16px] text-[var(--accent-purple)]">check_circle</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <div className="inline-block px-2 py-1 bg-[var(--bg-elevated)] text-[var(--accent-blue)] text-[10px] font-bold uppercase tracking-widest rounded w-max border border-[var(--border)]">NATURAL LANGUAGE</div>
                <h3 className="text-[28px] font-bold">Build Your Audience</h3>
                <p className="text-[16px] text-[var(--text-secondary)] leading-relaxed">Describe your audience in plain English. Synara converts it to a precise filter and shows you exactly who you're targeting.</p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div initial={{ x: -60, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true, margin: "-100px" }} className="flex flex-col md:flex-row items-center gap-16 relative">
              <div className="absolute -left-10 top-0 text-[120px] font-bold text-[var(--text-muted)] opacity-5 leading-none pointer-events-none">03</div>
              <div className="flex-1 w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
                 <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 bg-[var(--bg-base)] p-3 rounded-lg border border-[var(--border)]">
                      <img src="https://www.svgrepo.com/show/475692/whatsapp-color.svg" className="w-5 h-5" alt="WA" />
                      <div className="flex flex-col"><span className="text-[12px] font-bold">Win-back Offer</span><span className="text-[10px] text-[var(--text-secondary)]">Gold Inactive Segment</span></div>
                    </div>
                    <button className="glassy-btn w-full text-white py-3 rounded-lg font-bold text-[14px] animate-pulse">Send Campaign</button>
                    <div className="flex gap-2 justify-center mt-2">
                      <span className="text-[10px] bg-[var(--accent-green)]/20 text-[var(--accent-green)] px-2 py-1 rounded">Delivered</span>
                      <span className="text-[10px] bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] px-2 py-1 rounded">Opened</span>
                      <span className="text-[10px] bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] px-2 py-1 rounded">Clicked</span>
                    </div>
                 </div>
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <div className="inline-block px-2 py-1 bg-[var(--bg-elevated)] text-[var(--accent-purple)] text-[10px] font-bold uppercase tracking-widest rounded w-max border border-[var(--border)]">ONE CLICK</div>
                <h3 className="text-[28px] font-bold">Launch Your Campaign</h3>
                <p className="text-[16px] text-[var(--text-secondary)] leading-relaxed">AI drafts your message, you pick the channel, and hit send. Synara handles staggered delivery, personalisation tokens, and retry logic automatically.</p>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div initial={{ x: 60, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true, margin: "-100px" }} className="flex flex-col md:flex-row-reverse items-center gap-16 relative">
              <div className="absolute -right-10 top-0 text-[120px] font-bold text-[var(--text-muted)] opacity-5 leading-none pointer-events-none">04</div>
              <div className="flex-1 w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-8">
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
                    <span className="text-[12px] text-[var(--text-secondary)]">Live Velocity</span>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse"></span><span className="font-['JetBrains_Mono'] text-[14px]">24 events/min</span></div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-2 bg-[var(--accent-blue)] w-[80%] rounded-full"></div>
                    <div className="h-2 bg-[var(--accent-purple)] w-[50%] rounded-full"></div>
                    <div className="h-2 bg-[var(--accent-green)] w-[20%] rounded-full"></div>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                     <span className="text-[12px] text-[var(--text-secondary)]">Generated Revenue</span>
                     <span className="text-[24px] font-bold text-[var(--accent-green)]">₹48,230</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <div className="inline-block px-2 py-1 bg-[var(--bg-elevated)] text-[var(--accent-amber)] text-[10px] font-bold uppercase tracking-widest rounded w-max border border-[var(--border)]">REAL-TIME</div>
                <h3 className="text-[28px] font-bold">Watch It Happen Live</h3>
                <p className="text-[16px] text-[var(--text-secondary)] leading-relaxed">Your dashboard updates in real time as every delivery, open, and conversion comes in. Anomaly AI watches for drops so you don't have to.</p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* RESULTS / CASE STUDIES */}
      <section id="results" className="py-32 px-6 bg-[var(--bg-surface)]">
        <div className="max-w-[1200px] mx-auto flex flex-col">
          <div className="mb-16">
            <h4 className="text-[11px] text-[var(--accent-purple)] uppercase tracking-widest font-bold mb-4">RESULTS</h4>
            <h2 className="text-[36px] md:text-[48px] font-bold mb-4">What Brands Achieve with Synara</h2>
            <p className="text-[16px] text-[var(--text-secondary)]">Real outcomes from brands that switched to AI-native CRM</p>
          </div>

          <div className="flex overflow-x-auto pb-8 gap-6 snap-x custom-scrollbar">
            
            <motion.div initial={{ scale: 0.95, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} className="min-w-[350px] flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-[16px] overflow-hidden flex flex-col snap-center">
              <div className="h-1 w-full bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)]"></div>
              <div className="p-8 flex flex-col flex-1">
                <p className="text-[18px] leading-relaxed mb-8 flex-1">"Synara's win-back campaigns recovered ₹2.1Cr in revenue we thought was lost."</p>
                <div className="text-[14px] font-bold mb-1">Urban Threads</div>
                <div className="text-[12px] text-[var(--text-secondary)] mb-6">Fashion Label</div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[var(--bg-base)] border border-[var(--border)] text-[var(--accent-purple)] text-[11px] px-2 py-1 rounded">₹2.1Cr Recovered</span>
                  <span className="bg-[var(--bg-base)] border border-[var(--border)] text-[var(--accent-blue)] text-[11px] px-2 py-1 rounded">42% Open Rate</span>
                  <span className="bg-[var(--bg-base)] border border-[var(--border)] text-[var(--accent-green)] text-[11px] px-2 py-1 rounded">3× WhatsApp ROI</span>
                  <span className="bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-secondary)] text-[11px] px-2 py-1 rounded">2 Days Setup</span>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ scale: 0.95, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="min-w-[350px] flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-[16px] overflow-hidden flex flex-col snap-center">
              <div className="h-1 w-full bg-gradient-to-r from-[var(--accent-green)] to-teal-500"></div>
              <div className="p-8 flex flex-col flex-1">
                <p className="text-[18px] leading-relaxed mb-8 flex-1">"We went from monthly bulk blasts to daily personalised campaigns. Open rates tripled."</p>
                <div className="text-[14px] font-bold mb-1">Brew House</div>
                <div className="text-[12px] text-[var(--text-secondary)] mb-6">Coffee Chain</div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[var(--bg-base)] border border-[var(--border)] text-[var(--accent-green)] text-[11px] px-2 py-1 rounded">3× Open Rate</span>
                  <span className="bg-[var(--bg-base)] border border-[var(--border)] text-[var(--accent-blue)] text-[11px] px-2 py-1 rounded">67% Delivery Rate</span>
                  <span className="bg-[var(--bg-base)] border border-[var(--border)] text-[var(--accent-purple)] text-[11px] px-2 py-1 rounded">1,200 Campaigns Sent</span>
                  <span className="bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-secondary)] text-[11px] px-2 py-1 rounded">₹80L Revenue</span>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ scale: 0.95, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="min-w-[350px] flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-[16px] overflow-hidden flex flex-col snap-center">
              <div className="h-1 w-full bg-gradient-to-r from-[var(--accent-amber)] to-orange-500"></div>
              <div className="p-8 flex flex-col flex-1">
                <p className="text-[18px] leading-relaxed mb-8 flex-1">"The AI segment suggestions alone saved our team 6 hours a week."</p>
                <div className="text-[14px] font-bold mb-1">Glow Beauty</div>
                <div className="text-[12px] text-[var(--text-secondary)] mb-6">D2C Skincare</div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[var(--bg-base)] border border-[var(--border)] text-[var(--accent-amber)] text-[11px] px-2 py-1 rounded">6hrs/week Saved</span>
                  <span className="bg-[var(--bg-base)] border border-[var(--border)] text-[var(--accent-green)] text-[11px] px-2 py-1 rounded">89% Delivery Rate</span>
                  <span className="bg-[var(--bg-base)] border border-[var(--border)] text-[var(--accent-purple)] text-[11px] px-2 py-1 rounded">Churn -34%</span>
                  <span className="bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-secondary)] text-[11px] px-2 py-1 rounded">4 Channels Active</span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* AUTOPILOT SUGGESTIONS PREVIEW */}
      <section className="py-32 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col">
          <div className="text-center mb-16">
            <h4 className="text-[11px] text-[var(--accent-purple)] uppercase tracking-widest font-bold mb-4">AUTOPILOT</h4>
            <h2 className="text-[36px] md:text-[48px] font-bold mb-4">Synara Finds the Opportunities.<br/>You Just Approve.</h2>
          </div>

          <div className="relative w-full bg-[var(--bg-surface)] border border-[var(--accent-purple)] rounded-[20px] p-8 md:p-12 shadow-[0_0_100px_rgba(124,92,252,0.15)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
              
              <motion.div initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">WIN-BACK</span></div>
                <h3 className="text-[18px] font-bold leading-tight">94 Gold-tier shoppers haven't purchased in 45 days</h3>
                <div className="text-[14px] font-bold text-[var(--accent-green)]">₹1.8L potential recovery</div>
                <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded p-3 text-[12px] text-[var(--text-secondary)] mt-2">
                  <div className="flex items-center gap-2 mb-2"><img src="https://www.svgrepo.com/show/475692/whatsapp-color.svg" className="w-4 h-4"/> WhatsApp</div>
                  "Hey {'{first_name}'}, we miss you! Here's 20%..."
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-2">Predicted Open Rate: 38–42%</div>
                <button className="glassy-btn w-full mt-4 text-[#F0F2F5] py-2 rounded transition-colors text-[13px] font-bold border border-transparent">✦ Launch Campaign →</button>
              </motion.div>

              <motion.div initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.15 }} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-[var(--accent-amber)]"></span><span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">UPSELL</span></div>
                <h3 className="text-[18px] font-bold leading-tight">312 first-time buyers ready for their second purchase</h3>
                <div className="text-[14px] font-bold text-[var(--accent-green)]">₹4.2L upsell opportunity</div>
                <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded p-3 text-[12px] text-[var(--text-secondary)] mt-2">
                  <div className="flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-[16px]">email</span> Email</div>
                  "Your next order is waiting, {'{first_name}'}..."
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-2">Predicted Open Rate: 29–34%</div>
                <button className="glassy-btn w-full mt-4 text-[#F0F2F5] py-2 rounded transition-colors text-[13px] font-bold border border-transparent">Review Details</button>
              </motion.div>

              <motion.div initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-[var(--accent-purple)]"></span><span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">RE-ENGAGE</span></div>
                <h3 className="text-[18px] font-bold leading-tight">1,204 shoppers opened but never clicked last campaign</h3>
                <div className="text-[14px] font-bold text-[var(--accent-green)]">₹2.9L re-engagement potential</div>
                <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded p-3 text-[12px] text-[var(--text-secondary)] mt-2">
                  <div className="flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-[16px]">sms</span> SMS</div>
                  "{'{first_name}'}, your exclusive offer expires soon..."
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-2">Predicted Open Rate: 31–38%</div>
                <button className="glassy-btn w-full mt-4 text-[#F0F2F5] py-2 rounded transition-colors text-[13px] font-bold border border-transparent">Review Details</button>
              </motion.div>

            </div>
            <div className="mt-8 text-center text-[12px] text-[var(--text-muted)]">✦ Generated fresh every 4 hours by AI</div>
          </div>
        </div>
      </section>

      {/* FOUNDERS BLOG */}
      <section id="blog" className="py-32 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col">
          <div className="text-center mb-16">
            <h4 className="text-[11px] text-[var(--accent-purple)] uppercase tracking-widest font-bold mb-4">FOUNDERS' NOTES</h4>
            <h2 className="text-[36px] md:text-[48px] font-bold mb-4">Why We Built Synara</h2>
            <p className="text-[16px] text-[var(--text-secondary)]">A fundamental shift in how brands interact with shopper data.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[20px] p-8 md:p-12 flex flex-col gap-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)]"></div>
              <span className="material-symbols-outlined text-[40px] text-[var(--accent-purple)] opacity-50">format_quote</span>
              <p className="text-[18px] md:text-[20px] leading-relaxed text-[#F0F2F5] flex-1">
                "For years, CRM teams were blocked by data silos and SQL queries. A brand's ability to reach its shoppers shouldn't depend on an engineering ticket. We built Synara to democratize data—allowing marketing teams to converse with their database in plain English and execute multi-channel campaigns in seconds, not days."
              </p>
              <div className="flex items-center gap-4 mt-4 pt-8 border-t border-[var(--border)]">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-purple-dim)] border border-[var(--accent-purple)] flex items-center justify-center text-[16px] font-bold text-[var(--accent-purple)]">RK</div>
                <div className="flex flex-col">
                  <span className="font-bold text-[16px]">Rahul Khanna</span>
                  <span className="text-[12px] text-[var(--text-secondary)]">Co-Founder & CEO</span>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[20px] p-8 md:p-12 flex flex-col gap-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-amber)]"></div>
              <span className="material-symbols-outlined text-[40px] text-[var(--accent-green)] opacity-50">format_quote</span>
              <p className="text-[18px] md:text-[20px] leading-relaxed text-[#F0F2F5] flex-1">
                "Legacy CRM platforms are fundamentally passive. They wait for you to pull a report. Synara is an active intelligence layer. Our anomaly detection and Autopilot models monitor your data 24/7, predicting drops in engagement and suggesting the exact campaign needed to recover revenue before you even notice."
              </p>
              <div className="flex items-center gap-4 mt-4 pt-8 border-t border-[var(--border)]">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-green)]/10 border border-[var(--accent-green)] flex items-center justify-center text-[16px] font-bold text-[var(--accent-green)]">AS</div>
                <div className="flex flex-col">
                  <span className="font-bold text-[16px]">Aditi Sharma</span>
                  <span className="text-[12px] text-[var(--text-secondary)]">Co-Founder & CTO</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-32 px-6 bg-[var(--bg-surface)]">
        <div className="max-w-[1200px] mx-auto flex flex-col">
          <div className="text-center mb-16">
            <h4 className="text-[11px] text-[var(--accent-purple)] uppercase tracking-widest font-bold mb-4">PRICING</h4>
            <h2 className="text-[36px] md:text-[48px] font-bold mb-4">Simple Pricing. No Surprises.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[16px] p-8 flex flex-col">
              <h3 className="text-[20px] font-bold mb-2">STARTER</h3>
              <div className="text-[36px] font-bold mb-2">₹0<span className="text-[16px] text-[var(--text-secondary)] font-normal">/month</span></div>
              <p className="text-[14px] text-[var(--text-secondary)] mb-8">For brands just getting started</p>
              <div className="flex flex-col gap-4 mb-8 flex-1">
                {['Up to 500 shoppers', '3 campaigns/month', 'WhatsApp + SMS', 'Basic analytics', 'Synara Intelligence (10 queries/day)'].map(f => (
                  <div key={f} className="flex items-center gap-3 text-[14px]"><span className="material-symbols-outlined text-[var(--accent-green)] text-[18px]">check</span> {f}</div>
                ))}
              </div>
              <Link href="/login" className="glassy-btn w-full text-center py-3 rounded-lg text-white font-bold border border-transparent">Start Free</Link>
            </div>

            <div className="bg-[var(--bg-elevated)] border-2 border-[var(--accent-purple)] rounded-[16px] p-8 flex flex-col relative shadow-[0_0_30px_rgba(124,92,252,0.15)] md:scale-105 z-10 animate-[pulse_3s_ease-in-out_infinite]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--accent-purple)] text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest">MOST POPULAR</div>
              <h3 className="text-[20px] font-bold mb-2">GROWTH</h3>
              <div className="text-[36px] font-bold mb-2">₹4,999<span className="text-[16px] text-[var(--text-secondary)] font-normal">/month</span></div>
              <p className="text-[14px] text-[var(--text-secondary)] mb-8">For growing D2C brands</p>
              <div className="flex flex-col gap-4 mb-8 flex-1">
                {['Up to 10,000 shoppers', 'Unlimited campaigns', 'All 4 channels', 'Real-time analytics + anomaly detection', 'Autopilot suggestions', 'Synara Intelligence (unlimited)', 'A/B testing', 'Priority support'].map(f => (
                  <div key={f} className="flex items-center gap-3 text-[14px]"><span className="material-symbols-outlined text-[var(--accent-green)] text-[18px]">check</span> {f}</div>
                ))}
              </div>
              <button onClick={() => setIsPaymentModalOpen(true)} className="glassy-btn w-full text-center py-3 rounded-lg text-white font-bold mb-2 border border-transparent">Start Paid Subscription →</button>
              <div className="text-center text-[11px] text-[var(--text-muted)]">Secure payment portal · No commitment</div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[16px] p-8 flex flex-col">
              <h3 className="text-[20px] font-bold mb-2">ENTERPRISE</h3>
              <div className="text-[36px] font-bold mb-2">Custom</div>
              <p className="text-[14px] text-[var(--text-secondary)] mb-8">For large brands and retail chains</p>
              <div className="flex flex-col gap-4 mb-8 flex-1">
                {['Unlimited shoppers', 'Dedicated AI training on your data', 'Custom channel integrations', 'Revenue attribution dashboard', 'Cohort retention analysis', 'SLA + dedicated support', 'On-premise deployment option'].map(f => (
                  <div key={f} className="flex items-center gap-3 text-[14px]"><span className="material-symbols-outlined text-[var(--accent-green)] text-[18px]">check</span> {f}</div>
                ))}
              </div>
              <Link href="/login" className="glassy-btn w-full text-center py-3 rounded-lg text-white font-bold border border-transparent">Contact Us →</Link>
            </div>

          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6 hero-bg text-center">
        <div className="max-w-[800px] mx-auto flex flex-col items-center">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] px-4 py-1.5 rounded-full mb-8 text-[11px] font-bold tracking-widest">GET STARTED FREE</div>
          <h2 className="text-[40px] md:text-[56px] font-bold mb-6 leading-tight">Your Shoppers Are Waiting. Reach Them Smarter.</h2>
          <p className="text-[18px] text-[var(--text-secondary)] mb-10">Join brands using Synara to turn shopper data into real revenue.</p>
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
             <Link href="/login" className="glassy-btn text-white px-[32px] py-[16px] rounded-[10px] text-[16px] font-bold flex items-center justify-center">Start Free Trial →</Link>
             <div className="relative">
               <div className="glassy-btn-blue text-white px-[32px] py-[16px] rounded-[10px] text-[16px] font-bold flex items-center justify-center border border-transparent opacity-70 cursor-not-allowed">View Demo</div>
               <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  className="absolute -top-3 -right-6 bg-gradient-to-r from-[#7C5CFC] to-[#5a3bc2] text-white text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(124,92,252,0.8)] border border-white/20 flex items-center gap-1.5 z-10 pointer-events-none"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5ff] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e5ff]"></span>
                  </span>
                  Coming Soon
                </motion.div>
             </div>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-[12px] text-[var(--text-muted)] uppercase tracking-widest font-bold">
            <span>SOC2 Compliant</span>
            <span>99.9% Uptime</span>
            <span>TRAI Compliant</span>
            <span>GDPR Ready</span>
          </div>
        </div>
      </section>

      {/* CONTACT US */}
      <section id="contact" className="py-32 px-6 bg-[var(--bg-base)] border-t border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent-purple)]/5 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--accent-blue)]/5 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div initial={{ x: -40, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }}>
            <h4 className="text-[11px] text-[var(--accent-purple)] uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-purple)]"></span> CONTACT US
            </h4>
            <h2 className="text-[40px] md:text-[56px] font-bold mb-6 leading-tight">Let's talk about your data.</h2>
            <p className="text-[18px] text-[var(--text-secondary)] mb-10 leading-relaxed">Whether you have a technical question or want to discuss enterprise pricing, our team is ready to help you scale.</p>
            
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[var(--text-secondary)]">mail</span>
                </div>
                <div>
                  <div className="font-bold text-[15px]">Enterprise Sales</div>
                  <div className="text-[14px] text-[var(--text-secondary)]">enterprise@synara.com</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[var(--text-secondary)]">support_agent</span>
                </div>
                <div>
                  <div className="font-bold text-[15px]">Technical Support</div>
                  <div className="text-[14px] text-[var(--text-secondary)]">Available 24/7 for Growth & Enterprise</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ x: 40, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }}>
            <div className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[24px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden min-h-[500px] flex flex-col justify-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)]"></div>
              
              <AnimatePresence mode="wait">
                {contactStatus === 'success' ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center py-16 text-center gap-4 w-full h-full"
                  >
                    <div className="w-20 h-20 rounded-full bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30 flex items-center justify-center mb-4 relative">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="absolute inset-0 rounded-full bg-[var(--accent-green)]/20 animate-ping"></motion.div>
                      <span className="material-symbols-outlined text-[40px] text-[var(--accent-green)] relative z-10">check_circle</span>
                    </div>
                    <h3 className="text-[24px] font-bold">Message Sent!</h3>
                    <p className="text-[15px] text-[var(--text-secondary)] max-w-[250px]">We've received your query. Our team will get back to you within 2 hours.</p>
                    <button onClick={() => setContactStatus('idle')} className="mt-4 text-[13px] font-bold text-[var(--accent-purple)] hover:text-[#F0F2F5] transition-colors">Send another message</button>
                  </motion.div>
                ) : (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col gap-6 w-full h-full" 
                    onSubmit={(e) => { e.preventDefault(); setContactStatus('loading'); setTimeout(() => setContactStatus('success'), 1500); }}
                  >
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-[13px] font-bold text-[var(--text-secondary)]">First Name</label>
                        <input required disabled={contactStatus === 'loading'} type="text" placeholder="Jane" className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[var(--accent-purple)] transition-colors disabled:opacity-50" />
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-[13px] font-bold text-[var(--text-secondary)]">Work Email</label>
                        <input required disabled={contactStatus === 'loading'} type="email" placeholder="jane@company.com" className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[var(--accent-purple)] transition-colors disabled:opacity-50" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-bold text-[var(--text-secondary)]">Company Size</label>
                      <select required disabled={contactStatus === 'loading'} className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[var(--accent-purple)] transition-colors disabled:opacity-50 text-[#F0F2F5]">
                        <option value="" className="bg-[var(--bg-base)] text-[#F0F2F5]">Select size...</option>
                        <option value="1-50" className="bg-[var(--bg-base)] text-[#F0F2F5]">1 - 50 employees</option>
                        <option value="51-200" className="bg-[var(--bg-base)] text-[#F0F2F5]">51 - 200 employees</option>
                        <option value="201-1000" className="bg-[var(--bg-base)] text-[#F0F2F5]">201 - 1,000 employees</option>
                        <option value="1000+" className="bg-[var(--bg-base)] text-[#F0F2F5]">1,000+ employees</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-bold text-[var(--text-secondary)]">How can we help?</label>
                      <textarea required disabled={contactStatus === 'loading'} rows={4} placeholder="Tell us about your data challenges..." className="bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[var(--accent-purple)] transition-colors resize-none disabled:opacity-50"></textarea>
                    </div>
                    <button type="submit" disabled={contactStatus === 'loading'} className="glassy-btn text-white py-4 rounded-xl font-bold mt-2 flex items-center justify-center gap-2 disabled:opacity-50 h-[56px] border border-transparent">
                      {contactStatus === 'loading' ? (
                        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="material-symbols-outlined">sync</motion.span>
                      ) : (
                        <>Send Message <span className="material-symbols-outlined text-[18px]">send</span></>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A0A0B] border-t border-[var(--border)] pt-20 pb-10 px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-3">
                <Link href="/">
                  <img src="/logo.png" alt="Synara Logo" width={28} height={28} style={{ background: 'transparent' }} className="drop-shadow-[0_0_10px_rgba(124,92,252,0.4)]" />
                </Link>
                <span className="font-bold text-[18px]">Synara</span>
             </div>
             <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-widest">Intelligence Terminal</p>
             <p className="text-[14px] text-[var(--text-secondary)] mt-2">AI-native CRM for brands that reach.</p>
             <div className="flex gap-3 mt-6 text-[var(--text-secondary)]">
               <a href="#" aria-label="X (Twitter)" className="group flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full p-2.5 hover:px-5 transition-all duration-300 overflow-hidden hover:bg-white hover:text-black hover:border-white">
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.964H5.053z"/></svg>
                 <span className="max-w-0 opacity-0 group-hover:max-w-[60px] group-hover:opacity-100 transition-all duration-300 whitespace-nowrap text-[13px] font-bold">Twitter</span>
               </a>
               <a href="#" aria-label="LinkedIn" className="group flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full p-2.5 hover:px-5 transition-all duration-300 overflow-hidden hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]">
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                 <span className="max-w-0 opacity-0 group-hover:max-w-[70px] group-hover:opacity-100 transition-all duration-300 whitespace-nowrap text-[13px] font-bold">LinkedIn</span>
               </a>
               <a href="#" aria-label="GitHub" className="group flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full p-2.5 hover:px-5 transition-all duration-300 overflow-hidden hover:bg-[#333] hover:text-white hover:border-[#333]">
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                 <span className="max-w-0 opacity-0 group-hover:max-w-[60px] group-hover:opacity-100 transition-all duration-300 whitespace-nowrap text-[13px] font-bold">GitHub</span>
               </a>
             </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-[14px]">Product</h4>
            {['Dashboard', 'Segments', 'Campaigns', 'Analytics', 'Import Data', 'Autopilot'].map(l => <Link key={l} href="/" className="text-[14px] text-[var(--text-secondary)] hover:text-[#F0F2F5]">{l}</Link>)}
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-[14px]">Company</h4>
            <Link href="/" className="text-[14px] text-[var(--text-secondary)] hover:text-[#F0F2F5]">About</Link>
            <Link href="#blog" className="text-[14px] text-[var(--text-secondary)] hover:text-[#F0F2F5]">Blog</Link>
            <Link href="/careers" className="text-[14px] text-[var(--text-secondary)] hover:text-[#F0F2F5]">Careers</Link>
            <Link href="/" className="text-[14px] text-[var(--text-secondary)] hover:text-[#F0F2F5]">Press</Link>
            <Link href="#contact" className="text-[14px] text-[var(--text-secondary)] hover:text-[#F0F2F5]">Contact</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-[14px]">Legal</h4>
            {['Privacy Policy', 'Terms of Service', 'GDPR', 'Cookie Policy'].map(l => <Link key={l} href="/" className="text-[14px] text-[var(--text-secondary)] hover:text-[#F0F2F5]">{l}</Link>)}
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto border-t border-[var(--border)] pt-8 flex flex-col md:flex-row justify-center items-center gap-4 text-[12px] text-[var(--text-muted)]">
          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-center md:text-left">
            <span>© 2026 Synara. All rights reserved.</span>
            <span className="hidden md:inline">•</span>
            <span>Developed by <span className="text-[var(--text-secondary)] font-bold">Tanisha Bhargava</span></span>
          </div>
        </div>
      </footer>

      {/* MOCK PAYMENT MODAL */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-[450px] overflow-hidden shadow-2xl relative"
            >
              <div className="bg-[var(--bg-card)] border-b border-[var(--border)] p-6 flex justify-between items-center">
                <div className="font-bold text-[18px]">Checkout</div>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-[var(--text-secondary)] hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form className="p-6 flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); alert("Mock Payment Processed Successfully!"); setIsPaymentModalOpen(false); }}>
                <div className="bg-[var(--accent-purple-dim)] border border-[var(--accent-purple)] rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-[14px]">Synara Growth Plan</div>
                    <div className="text-[12px] text-[var(--text-secondary)]">Billed monthly</div>
                  </div>
                  <div className="font-bold text-[18px]">₹4,999</div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="font-bold text-[14px] mb-2">Payment Details</div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] text-[var(--text-secondary)]">Card Number</label>
                    <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-4 py-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[var(--text-secondary)]">credit_card</span>
                      <input required type="text" placeholder="0000 0000 0000 0000" className="bg-transparent outline-none text-[14px] flex-1 w-full" maxLength={19} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[12px] text-[var(--text-secondary)]">Expiry (MM/YY)</label>
                      <input required type="text" placeholder="12/26" className="bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-4 py-3 outline-none text-[14px] w-full" maxLength={5} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[12px] text-[var(--text-secondary)]">CVC</label>
                      <input required type="password" placeholder="***" className="bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-4 py-3 outline-none text-[14px] w-full" maxLength={3} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] text-[var(--text-secondary)]">Cardholder Name</label>
                    <input required type="text" placeholder="Jane Doe" className="bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-4 py-3 outline-none text-[14px] w-full" />
                  </div>
                </div>

                <button type="submit" className="glassy-btn w-full text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 border border-transparent">
                  <span className="material-symbols-outlined text-[18px]">lock</span> Pay ₹4,999
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
