'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { usePathname } from 'next/navigation';

export default function Sidebar({ isLocked = false }: { isLocked?: boolean }) {
  const { data: session } = useSession();
  const { profilePhoto, loadProfilePhoto } = useAppStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load avatar from per-user localStorage key whenever session is available
    if (session?.user?.email) {
      loadProfilePhoto(session.user.email);
    }
  }, [session?.user?.email]);

    const pathname = usePathname();

    const navItems = [
      { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
      { href: '/segments', icon: 'groups', label: 'Segments' },
      { href: '/campaigns', icon: 'campaign', label: 'Campaigns' },
      { href: '/analytics', icon: 'insights', label: 'Analytics' },
      { href: '/import', icon: 'file_upload', label: 'Import Data' },
    ];

    const activeIndex = navItems.findIndex(item => pathname?.startsWith(item.href));
    // If no active index, default to 0 to avoid breaking layout, though opacity handles it
    const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-surface border-r border-outline-variant flex flex-col py-lg px-md hidden md:flex z-50">
      <div className="mb-xl px-sm mt-4 flex items-center gap-3">
        <Link href="/">
          <img src="/logo.png" alt="Synara" width={28} height={28} style={{ background: 'transparent' }} />
        </Link>
        <div className="flex flex-col">
          <Link href="/" className="text-[16px] font-bold text-white leading-none hover:text-primary transition-colors">Synara</Link>
          <span className="text-[9px] text-on-surface-variant uppercase tracking-widest mt-1 leading-none">INTELLIGENCE TERMINAL</span>
        </div>
      </div>
      <nav className="flex-1 flex flex-col gap-xs relative">
        {!isLocked && (
          <>
            {/* Animated Vertical Indicator */}
            <div 
              className="absolute right-[-16px] w-[3px] bg-primary rounded-l-full transition-transform duration-300 ease-out z-10"
              style={{ 
                height: '44px',
                transform: `translateY(${safeIndex * (44 + 4)}px)`, // 44px height + 4px (gap-xs)
                opacity: activeIndex >= 0 ? 1 : 0
              }}
            />
            {navItems.map((item, i) => {
              const isActive = activeIndex === i;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-md px-sm rounded-lg hover:bg-surface-container-high transition-colors duration-200 h-[44px] ${isActive ? 'text-primary font-bold bg-primary/5' : 'text-on-surface-variant font-medium'}`}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="font-body-md">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>
      <div className="mt-auto flex flex-col gap-xs pb-2 relative">
        <button 
          onClick={() => useAppStore.getState().toggleCopilot()}
          className="bg-primary-container text-on-primary-container p-sm rounded-lg font-bold flex items-center justify-center gap-sm mb-lg active:scale-[0.98] transition-transform"
        >
          ✦ Ask Synara AI
        </button>
        <Link href="/settings" className="flex items-center gap-md p-sm text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors duration-200">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-body-md">Settings</span>
        </Link>
        <Link href="/support" className="flex items-center gap-md p-sm text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors duration-200 mb-2">
          <span className="material-symbols-outlined">help</span>
          <span className="font-body-md">Support</span>
        </Link>

        {/* Profile Section */}
        <div className="border-t border-outline-variant/30 pt-xs relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center gap-sm p-sm rounded-lg hover:bg-surface-container-high transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold overflow-hidden shrink-0">
              {isMounted && (profilePhoto || session?.user?.image) ? (
                <img src={profilePhoto || session?.user?.image || ''} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                session?.user?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-body-md text-on-surface font-bold truncate">
                {session?.user?.name || 'Demo User'}
              </p>
              <p className="text-[10px] text-on-surface-variant truncate">
                {session?.user?.email || 'demo@synara.ai'}
              </p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              {profileOpen ? 'expand_more' : 'chevron_right'}
            </span>
          </button>

          {/* Popover Menu */}
          {profileOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full glass-card rounded-lg border border-outline-variant/50 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
              <Link 
                href="/profile" 
                className="flex items-center gap-sm p-sm text-body-md text-on-surface hover:bg-surface-container transition-colors"
                onClick={() => setProfileOpen(false)}
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                My Profile
              </Link>
              <button 
                onClick={async () => {
                  setProfileOpen(false);
                  await signOut({ redirect: false });
                  window.location.href = '/login';
                }}
                className="w-full flex items-center gap-sm p-sm text-body-md text-error hover:bg-error-container/20 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}