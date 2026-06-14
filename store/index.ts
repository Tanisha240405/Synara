import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

interface Toast {
  id: string;
  eventType: 'delivered' | 'opened' | 'clicked' | 'failed' | 'order_placed';
  customerName: string;
  campaignName: string;
  channel: string;
  receivedAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  date: string;
}

interface AppStore {
  isCopilotOpen: boolean;
  copilotMessages: { role: string; content: string }[];
  toasts: Toast[];
  notifications: Notification[];
  unreadNotificationCount: number;
  auditLogs: AuditLog[];
  profilePhoto: string | null;
  recentTickets: Ticket[];
  toggleCopilot: () => void;
  addCopilotMessage: (msg: { role: string; content: string }) => void;
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationsRead: () => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  setProfilePhoto: (photo: string | null, email?: string) => void;
  loadProfilePhoto: (email: string) => void;
  addTicket: (ticket: Ticket) => void;
}

// Helpers for per-user photo storage
const PHOTO_KEY = (email: string) => `synara-photo-${email}`;

export const savePhotoForUser = (email: string, photo: string | null) => {
  try {
    if (photo) {
      localStorage.setItem(PHOTO_KEY(email), photo);
    } else {
      localStorage.removeItem(PHOTO_KEY(email));
    }
  } catch (_) {}
};

export const loadPhotoForUser = (email: string): string | null => {
  try {
    return localStorage.getItem(PHOTO_KEY(email));
  } catch (_) {
    return null;
  }
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      isCopilotOpen: false,
      copilotMessages: [],
      toasts: [],
      notifications: [],
      unreadNotificationCount: 0,
      auditLogs: [],
      profilePhoto: null,
      recentTickets: [
        { id: 'TKT-1049', subject: 'Integration Sync Issue', date: 'Yesterday' }
      ],
      toggleCopilot: () => set((s) => ({ isCopilotOpen: !s.isCopilotOpen })),
      addCopilotMessage: (msg) => set((s) => ({ copilotMessages: [...s.copilotMessages, msg] })),
      addToast: (toast) => set((s) => ({ toasts: [toast, ...s.toasts].slice(0, 4) })),
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      addNotification: (notif) => set((s) => {
        const newNotif = { ...notif, id: Math.random().toString(), timestamp: new Date().toISOString(), read: false };
        return { 
          notifications: [newNotif, ...s.notifications],
          unreadNotificationCount: s.unreadNotificationCount + 1
        };
      }),
      markNotificationsRead: () => set((s) => ({
        notifications: s.notifications.map(n => ({ ...n, read: true })),
        unreadNotificationCount: 0
      })),
      addAuditLog: (log) => set((s) => ({
        auditLogs: [{ ...log, id: Math.random().toString(), timestamp: new Date().toISOString() }, ...s.auditLogs]
      })),
      setProfilePhoto: (photo, email) => {
        if (email) savePhotoForUser(email, photo);
        set({ profilePhoto: photo });
      },
      loadProfilePhoto: (email) => {
        const photo = loadPhotoForUser(email);
        set({ profilePhoto: photo });
      },
      addTicket: (ticket) => set((s) => ({ recentTickets: [ticket, ...s.recentTickets] })),
    }),
    {
      name: 'synara-store',
      partialize: (state) => ({ 
        notifications: state.notifications,
        unreadNotificationCount: state.unreadNotificationCount,
        auditLogs: state.auditLogs,
        recentTickets: state.recentTickets
        // profilePhoto is NOT persisted here — it lives in per-user localStorage keys
      }),
    }
  )
);
