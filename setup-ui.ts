import fs from 'fs';
import path from 'path';

const files = {
  'components/Sidebar.tsx': `
import Link from 'next/link';
export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-surface-container-low border-r border-surface-variant flex flex-col">
      <div className="p-6 font-display-lg text-primary">XenoReach</div>
      <nav className="flex-1 px-4 space-y-2">
        <Link href="/dashboard" className="block px-4 py-2 rounded hover:bg-surface-variant text-on-surface">Dashboard</Link>
        <Link href="/segments" className="block px-4 py-2 rounded hover:bg-surface-variant text-on-surface">Segments</Link>
        <Link href="/campaigns" className="block px-4 py-2 rounded hover:bg-surface-variant text-on-surface">Campaigns</Link>
        <Link href="/analytics" className="block px-4 py-2 rounded hover:bg-surface-variant text-on-surface">Analytics</Link>
        <Link href="/import" className="block px-4 py-2 rounded hover:bg-surface-variant text-on-surface">Import</Link>
      </nav>
    </div>
  );
}
`,
  'components/AICopilotPanel.tsx': `
'use client';
import { useAppStore } from '@/store';
export default function AICopilotPanel() {
  const { isCopilotOpen, toggleCopilot } = useAppStore();
  if (!isCopilotOpen) return null;
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-surface-container glass-panel z-50 flex flex-col shadow-2xl border-l border-surface-variant transform transition-transform">
      <div className="p-4 border-b border-surface-variant flex justify-between items-center ai-gradient">
        <h2 className="font-headline-md text-white flex items-center gap-2"><span className="material-symbols-outlined">auto_awesome</span> XenoAI Copilot</h2>
        <button onClick={toggleCopilot} className="text-white hover:text-gray-300"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="bg-surface p-3 rounded-lg text-body-md text-on-surface border border-surface-variant">Hello! How can I help you today?</div>
      </div>
      <div className="p-4 border-t border-surface-variant">
        <input type="text" placeholder="Ask XenoAI..." className="w-full bg-surface border border-surface-variant rounded-full px-4 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>
    </div>
  );
}
`,
  'app/(app)/layout.tsx': `
import Sidebar from '@/components/Sidebar';
import AICopilotPanel from '@/components/AICopilotPanel';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
        <AICopilotPanel />
      </div>
    </div>
  );
}
`,
  'app/(auth)/login/page.tsx': `
'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('demo@xenoreach.ai');
  const [password, setPassword] = useState('demo123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn('credentials', { email, password, callbackUrl: '/dashboard' });
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 ai-gradient blur-[100px] pointer-events-none" />
      <form onSubmit={handleSubmit} className="glass-card p-8 rounded-xl w-96 z-10 space-y-6">
        <div className="text-center">
          <h1 className="font-display-lg text-primary mb-2">XenoReach</h1>
          <p className="text-on-surface-variant text-body-md">Sign in to your account</p>
        </div>
        <div className="space-y-4">
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-surface border border-surface-variant rounded p-3 text-on-surface" />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-surface border border-surface-variant rounded p-3 text-on-surface" />
        </div>
        <button type="submit" className="w-full py-3 rounded bg-primary text-on-primary font-bold hover:bg-primary-container transition">Sign In</button>
        <p className="text-center text-xs text-on-surface-variant">Demo: demo@xenoreach.ai / demo123</p>
      </form>
    </div>
  );
}
`,
  'app/(app)/dashboard/page.tsx': `
'use client';
import useSWR from 'swr';
import { useAppStore } from '@/store';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Dashboard() {
  const { toggleCopilot } = useAppStore();
  const { data: stats } = useSWR('/api/analytics/dashboard', fetcher, { refreshInterval: 5000 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display-lg text-on-surface">Dashboard</h1>
        <button onClick={toggleCopilot} className="bg-surface-variant hover:bg-surface-bright px-4 py-2 rounded-full flex items-center gap-2 text-on-surface text-sm font-semibold border border-outline-variant ai-glow transition">
          <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span> Ask AI
        </button>
      </div>
      
      {/* Ticker Bar */}
      <div className="bg-surface-container-low border border-surface-variant p-2 rounded overflow-hidden flex">
        <div className="animate-ticker flex gap-12 text-sm text-on-surface-variant whitespace-nowrap">
          <span>LTV: ₹{stats?.currentLtv || 0}</span>
          <span>CHURN: {stats?.churnRate || 0}%</span>
          <span>ACTIVE CAMPAIGNS: {stats?.activeCampaigns || 0}</span>
          <span>AOV: ₹{stats?.aov || 0}</span>
          <span>LTV: ₹{stats?.currentLtv || 0}</span>
          <span>CHURN: {stats?.churnRate || 0}%</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[{l: 'Total Sent', v: stats?.totalSent || 0}, {l: 'Delivered', v: stats?.totalDelivered || 0}, {l: 'Avg Open Rate', v: (stats?.avgOpenRate||0)+'%'}, {l: 'Conversions', v: stats?.totalConversions || 0}].map((k,i) => (
          <div key={i} className="glass-card p-6 rounded-xl flex flex-col gap-2">
            <span className="text-on-surface-variant text-sm font-medium">{k.l}</span>
            <span className="text-3xl font-bold text-on-surface">{k.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content.trim());
}
console.log('UI generated');
