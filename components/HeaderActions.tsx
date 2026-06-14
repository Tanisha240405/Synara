'use client';

import { useAppStore } from '@/store';
import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function HeaderActions({ initials }: { initials: string }) {
  const { data: session } = useSession();
  const { notifications, unreadNotificationCount, markNotificationsRead, profilePhoto, loadProfilePhoto } = useAppStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (session?.user?.email) loadProfilePhoto(session.user.email);
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!showDropdown && unreadNotificationCount > 0) {
      markNotificationsRead();
    }
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="flex items-center gap-sm relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="relative p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-high"
      >
        <span className="material-symbols-outlined">notifications</span>
        {isMounted && unreadNotificationCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#00e5ff] rounded-full shadow-[0_0_8px_rgba(0,229,255,0.8)] animate-pulse"></span>
        )}
      </button>

      {isMounted && showDropdown && (
        <div className="absolute top-12 right-12 w-80 bg-surface-container glass-card rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-outline-variant/30 overflow-hidden z-50">
          <div className="p-4 border-b border-outline-variant/30 bg-surface/50">
            <h3 className="font-headline-sm text-on-surface">Notifications</h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-body-sm">
                No new notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-4 border-b border-outline-variant/10 hover:bg-surface-container-highest transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                  <p className="font-bold text-on-surface text-label-md mb-1">{n.title}</p>
                  <p className="text-on-surface-variant text-body-sm mb-2">{n.message}</p>
                  <p className="text-tertiary text-[10px] uppercase tracking-widest">{new Date(n.timestamp).toLocaleTimeString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border border-outline-variant">
        {isMounted && (profilePhoto || session?.user?.image) ? (
          <img src={profilePhoto || session?.user?.image || undefined} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-primary-container font-bold text-xs uppercase">
            {initials}
          </div>
        )}
      </div>
    </div>
  );
}
