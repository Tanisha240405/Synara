'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CareersPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F0F2F5] font-['Inter'] selection:bg-[#7C5CFC]/30 flex flex-col items-center justify-center relative overflow-hidden">
      
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
      `}} />

      {/* Background Effects */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-[#7C5CFC]/10 blur-[150px] mix-blend-screen animate-pulse"></div>
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#3B82F6]/10 blur-[120px] mix-blend-screen" style={{ transform: 'translate(100px, -100px)' }}></div>
      </div>

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

      {/* Top Nav (Minimal) */}
      <nav className="fixed top-0 w-full p-6 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#7C5CFC] rounded shadow-[0_0_10px_rgba(124,92,252,0.4)] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
          </div>
          <Link href="/" className="font-bold text-[18px] tracking-tight hover:text-[#7C5CFC] transition-colors">Synara</Link>
        </div>
        <Link href="/" className="text-[14px] text-[var(--text-secondary)] hover:text-white transition-colors flex items-center gap-1 bg-[var(--bg-elevated)] border border-[var(--border)] px-4 py-2 rounded-full shadow-lg">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Home
        </Link>
      </nav>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center text-center w-full max-w-[600px] px-6 mt-12"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-[#7C5CFC]/10 border border-[#7C5CFC]/30 text-[#7C5CFC] px-4 py-1.5 rounded-full text-[12px] font-bold tracking-widest uppercase mb-8 shadow-[0_0_20px_rgba(124,92,252,0.2)]"
        >
          ✦ Careers at Synara
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-[48px] md:text-[64px] font-bold leading-[1.1] tracking-tight mb-6"
        >
          We're building the future of CRM.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-[18px] text-[var(--text-secondary)] leading-relaxed mb-12 max-w-[450px]"
        >
          We'll be hiring for engineering, product, and GTM roles soon. Drop your email, and our HR will contact you when roles open.
        </motion.p>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="w-full flex flex-col sm:flex-row gap-3 relative"
        >
          {status === 'success' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] p-4 rounded-xl flex items-center justify-center gap-2 font-medium"
            >
              <span className="material-symbols-outlined">check_circle</span> You're on the list!
            </motion.div>
          ) : (
            <>
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[var(--text-secondary)] text-[20px]">mail</span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" 
                  required
                  disabled={status === 'loading'}
                  className="w-full bg-[#111114]/80 backdrop-blur-md border border-[var(--border)] rounded-xl pl-12 pr-4 py-4 text-[16px] text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC] transition-all disabled:opacity-50"
                />
              </div>
              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="bg-[#7C5CFC] text-white px-8 py-4 rounded-xl font-bold text-[16px] hover:brightness-110 hover:shadow-[0_0_20px_rgba(124,92,252,0.4)] transition-all flex items-center justify-center min-w-[140px] disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <motion.span 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="material-symbols-outlined"
                  >
                    sync
                  </motion.span>
                ) : (
                  "Join Waitlist"
                )}
              </button>
            </>
          )}
        </motion.form>
      </motion.div>

      {/* Footer Note */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 text-[12px] text-[var(--text-muted)] tracking-widest uppercase font-bold"
      >
        © 2026 Synara Intelligence Terminal
      </motion.div>

    </div>
  );
}
