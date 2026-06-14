import fs from 'fs';
import path from 'path';

const files = {
  'components/Sidebar.tsx': `
import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-surface border-r border-outline-variant flex flex-col py-lg px-md hidden md:flex z-50">
      <div className="mb-xl px-sm mt-4">
        <h1 className="font-display-lg text-display-lg font-bold text-on-surface">XenoReach</h1>
        <p className="text-on-surface-variant font-body-md text-label-xs opacity-60">Intelligence Terminal</p>
      </div>
      <nav className="flex-1 flex flex-col gap-xs">
        <Link href="/dashboard" className="flex items-center gap-md p-sm text-primary font-bold border-r-2 border-primary hover:bg-surface-container-high transition-colors duration-200">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-body-md">Dashboard</span>
        </Link>
        <Link href="/segments" className="flex items-center gap-md p-sm text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors duration-200">
          <span className="material-symbols-outlined">groups</span>
          <span className="font-body-md">Segments</span>
        </Link>
        <Link href="/campaigns" className="flex items-center gap-md p-sm text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors duration-200">
          <span className="material-symbols-outlined">campaign</span>
          <span className="font-body-md">Campaigns</span>
        </Link>
        <Link href="/analytics" className="flex items-center gap-md p-sm text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors duration-200">
          <span className="material-symbols-outlined">insights</span>
          <span className="font-body-md">Analytics</span>
        </Link>
        <Link href="/import" className="flex items-center gap-md p-sm text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors duration-200">
          <span className="material-symbols-outlined">file_upload</span>
          <span className="font-body-md">Import Data</span>
        </Link>
      </nav>
      <div className="mt-auto flex flex-col gap-xs pb-4">
        <button className="bg-primary-container text-on-primary-container p-sm rounded-lg font-bold flex items-center justify-center gap-sm mb-lg active:scale-[0.98] transition-transform">
          ✦ Ask AI
        </button>
        <Link href="#" className="flex items-center gap-md p-sm text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors duration-200">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-body-md">Settings</span>
        </Link>
        <Link href="#" className="flex items-center gap-md p-sm text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors duration-200">
          <span className="material-symbols-outlined">help</span>
          <span className="font-body-md">Support</span>
        </Link>
      </div>
    </aside>
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
    <div className="bg-background text-on-background min-h-screen">
      <Sidebar />
      <main className="md:pl-[240px] min-h-screen pb-24 md:pb-0 relative">
        <header className="flex justify-between items-center w-full h-16 px-margin-desktop bg-surface/50 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Good morning, {session.user?.name?.split(' ')[0] || 'User'} ✦</h2>
            <p className="font-body-md text-label-xs text-on-surface-variant">Here's how your shoppers are engaging today.</p>
          </div>
          <div className="flex items-center gap-md">
            <div className="hidden lg:flex bg-surface-container-lowest border border-outline-variant px-sm py-xs rounded items-center gap-sm w-64">
              <span className="material-symbols-outlined text-on-surface-variant">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-body-md text-on-surface w-full p-0" placeholder="Search terminal..." type="text"/>
            </div>
            <div className="flex items-center gap-sm">
              <button className="material-symbols-outlined text-on-surface-variant hover:text-primary">notifications</button>
              <div className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border border-outline-variant">
                <img alt="User profile" className="w-full h-full object-cover" src={session.user?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuBE-lUkIczFMMJ61EgvYhE_TzrDhPHZbtcnLq_2Vxj3qxDz0eyybyfe0ikt4J4L8Z6dibBDWC_A1-Y7Vk3aczWETyx9s5IZzJTU5lV16WgG8O3SRKPu1xX9HjMMxY_vOX65aAoqHgJAK5vtw48Ho0SRxDkb7f-ApMxzvDBRF2KZ0jucn9eiwFHPqBSxq1AkwN0M5JothShNjxGYypi9UWDy5hYHjawieHkGC8aPaOhFXWwYSa3y1CSOx7382FSDO5zsxr-X4RVLRcJX"}/>
              </div>
            </div>
          </div>
        </header>
        {children}
        <AICopilotPanel />
      </main>
      
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-margin-mobile pb-margin-mobile md:hidden bg-surface-container/80 backdrop-blur-xl border border-outline-variant/30 shadow-xl py-xs">
        <a className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full p-xs" href="/dashboard">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-xs text-label-xs">Dashboard</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant p-xs hover:text-primary" href="/segments">
          <span className="material-symbols-outlined">groups</span>
          <span className="font-label-xs text-label-xs">Segments</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant p-xs hover:text-primary" href="/campaigns">
          <span className="material-symbols-outlined">campaign</span>
          <span className="font-label-xs text-label-xs">Campaigns</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant p-xs hover:text-primary" href="/analytics">
          <span className="material-symbols-outlined">insights</span>
          <span className="font-label-xs text-label-xs">Analytics</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant p-xs hover:text-primary" href="/import">
          <span className="material-symbols-outlined">file_upload</span>
          <span className="font-label-xs text-label-xs">Import</span>
        </a>
      </nav>
    </div>
  );
}
`,
  'app/(app)/dashboard/page.tsx': `
'use client';
import useSWR from 'swr';
import { useAppStore } from '@/store';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Dashboard() {
  const { toggleCopilot } = useAppStore();
  const { data: stats } = useSWR('/api/analytics/dashboard', fetcher, { refreshInterval: 5000 });
  const { data: eventsData } = useSWR('/api/analytics/events/recent', fetcher, { refreshInterval: 3000 });

  return (
    <>
      {/* Stats Ticker */}
      <section className="bg-surface-container-lowest border-b border-outline-variant overflow-hidden h-10 flex items-center">
        <div className="animate-ticker py-2 hover:pause">
          <div className="flex items-center gap-xl px-md">
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-tertiary"><span className="material-symbols-outlined text-sm">trending_up</span> LTV: ₹{stats?.currentLtv || '3,200'}</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-on-surface-variant border-x border-outline-variant/30 px-lg">CHURN: {stats?.churnRate || '12.5'}%</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-secondary">ACTIVE CAMPAIGNS: {stats?.activeCampaigns || 0}</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-primary">AOV: ₹{stats?.aov || '1,250'}</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-error"><span className="material-symbols-outlined text-sm">trending_down</span> BOUNCE: 42%</span>
          </div>
          <div className="flex items-center gap-xl px-md">
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-tertiary"><span className="material-symbols-outlined text-sm">trending_up</span> LTV: ₹{stats?.currentLtv || '3,200'}</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-on-surface-variant border-x border-outline-variant/30 px-lg">CHURN: {stats?.churnRate || '12.5'}%</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-secondary">ACTIVE CAMPAIGNS: {stats?.activeCampaigns || 0}</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-primary">AOV: ₹{stats?.aov || '1,250'}</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-error"><span className="material-symbols-outlined text-sm">trending_down</span> BOUNCE: 42%</span>
          </div>
        </div>
      </section>

      <div className="p-margin-desktop flex flex-col gap-lg">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-md">
          <Link href="/campaigns/new" className="glass-panel px-lg py-sm rounded-xl font-headline-md text-body-md flex items-center gap-sm hover:border-primary transition-all active:scale-95 text-on-surface">
            <span className="material-symbols-outlined">add_circle</span> New Campaign
          </Link>
          <Link href="/import" className="glass-panel px-lg py-sm rounded-xl font-headline-md text-body-md flex items-center gap-sm hover:border-primary transition-all active:scale-95 text-on-surface">
            <span className="material-symbols-outlined">person_add</span> Import Shoppers
          </Link>
          <button onClick={toggleCopilot} className="bg-primary-container text-on-primary-container px-lg py-sm rounded-xl font-headline-md text-body-md flex items-center gap-sm ai-glow transition-all active:scale-95">
            <span className="material-symbols-outlined">auto_awesome</span> Ask AI Copilot
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
          <div className="glass-panel p-md rounded-xl flex flex-col gap-sm relative overflow-hidden">
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest">Total Sent</p>
            <div className="flex items-end justify-between">
              <h3 className="font-display-lg text-display-lg text-on-surface">{stats?.totalSent?.toLocaleString() || '0'}</h3>
              <span className="text-tertiary font-data-tabular text-data-tabular mb-1">+12.4%</span>
            </div>
            <div className="h-8 w-full mt-sm opacity-50">
              <div className="flex items-end gap-1 h-full">
                <div className="bg-primary w-full rounded-t-xs" style={{height: '40%'}}></div>
                <div className="bg-primary w-full rounded-t-xs" style={{height: '60%'}}></div>
                <div className="bg-primary w-full rounded-t-xs" style={{height: '50%'}}></div>
                <div className="bg-primary w-full rounded-t-xs" style={{height: '80%'}}></div>
                <div className="bg-primary w-full rounded-t-xs" style={{height: '70%'}}></div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-md rounded-xl flex flex-col gap-sm">
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest">Delivered</p>
            <div className="flex items-end justify-between">
              <h3 className="font-display-lg text-display-lg text-on-surface">{stats?.totalDelivered?.toLocaleString() || '0'}</h3>
              <span className="text-tertiary font-data-tabular text-data-tabular mb-1">{(stats?.totalDelivered && stats?.totalSent) ? ((stats.totalDelivered/stats.totalSent)*100).toFixed(1) : '0'}%</span>
            </div>
            <div className="h-8 w-full mt-sm opacity-50">
              <div className="flex items-end gap-1 h-full">
                <div className="bg-secondary w-full rounded-t-xs" style={{height: '70%'}}></div>
                <div className="bg-secondary w-full rounded-t-xs" style={{height: '75%'}}></div>
                <div className="bg-secondary w-full rounded-t-xs" style={{height: '85%'}}></div>
                <div className="bg-secondary w-full rounded-t-xs" style={{height: '80%'}}></div>
                <div className="bg-secondary w-full rounded-t-xs" style={{height: '95%'}}></div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-md rounded-xl flex flex-col gap-sm">
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest">Avg Open Rate</p>
            <div className="flex items-end justify-between">
              <h3 className="font-display-lg text-display-lg text-on-surface">{stats?.avgOpenRate || '0'}%</h3>
              <span className="text-tertiary font-data-tabular text-data-tabular mb-1">+4.2%</span>
            </div>
            <div className="h-8 w-full mt-sm opacity-50">
              <div className="flex items-end gap-1 h-full">
                <div className="bg-tertiary w-full rounded-t-xs" style={{height: '30%'}}></div>
                <div className="bg-tertiary w-full rounded-t-xs" style={{height: '40%'}}></div>
                <div className="bg-tertiary w-full rounded-t-xs" style={{height: '35%'}}></div>
                <div className="bg-tertiary w-full rounded-t-xs" style={{height: '50%'}}></div>
                <div className="bg-tertiary w-full rounded-t-xs" style={{height: '60%'}}></div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-md rounded-xl flex flex-col gap-sm border-l-4 border-l-primary/50">
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest">Conversions</p>
            <div className="flex items-end justify-between">
              <h3 className="font-display-lg text-display-lg text-on-surface">{stats?.totalConversions?.toLocaleString() || '0'}</h3>
              <span className="text-primary font-data-tabular text-data-tabular mb-1">₹{stats?.revenue?.toLocaleString() || '0'}</span>
            </div>
            <div className="h-8 w-full mt-sm opacity-50">
              <div className="flex items-end gap-1 h-full">
                <div className="bg-primary-container w-full rounded-t-xs" style={{height: '20%'}}></div>
                <div className="bg-primary-container w-full rounded-t-xs" style={{height: '40%'}}></div>
                <div className="bg-primary-container w-full rounded-t-xs" style={{height: '60%'}}></div>
                <div className="bg-primary-container w-full rounded-t-xs" style={{height: '80%'}}></div>
                <div className="bg-primary-container w-full rounded-t-xs" style={{height: '100%'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          {/* Campaign Table */}
          <div className="lg:col-span-2 glass-panel rounded-xl flex flex-col">
            <div className="p-md border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-on-surface">Active Campaigns</h3>
              <button className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high/30">
                    <th className="p-md font-label-xs text-label-xs text-on-surface-variant uppercase">Campaign</th>
                    <th className="p-md font-label-xs text-label-xs text-on-surface-variant uppercase">Status</th>
                    <th className="p-md font-label-xs text-label-xs text-on-surface-variant uppercase">Funnel</th>
                    <th className="p-md font-label-xs text-label-xs text-on-surface-variant uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-on-surface">
                  <tr className="border-b border-outline-variant/30 hover:bg-surface-container-high/20 transition-colors group">
                    <td className="p-md">
                      <div className="font-bold">Winter Solstice Drop</div>
                      <div className="text-label-xs text-on-surface-variant">Last updated 2h ago</div>
                    </td>
                    <td className="p-md">
                      <span className="px-sm py-xs bg-tertiary/10 border border-tertiary/50 text-tertiary rounded text-[10px] font-bold uppercase">Running</span>
                    </td>
                    <td className="p-md w-48">
                      <div className="flex items-center gap-xs h-4">
                        <div className="h-full bg-primary/80 rounded-l" style={{width: '100%'}}></div>
                        <div className="h-full bg-secondary/80" style={{width: '60%'}}></div>
                        <div className="h-full bg-tertiary/80 rounded-r" style={{width: '30%'}}></div>
                      </div>
                    </td>
                    <td className="p-md">
                      <button className="p-xs hover:bg-outline-variant/30 rounded"><span className="material-symbols-outlined">more_vert</span></button>
                    </td>
                  </tr>
                  <tr className="border-b border-outline-variant/30 hover:bg-surface-container-high/20 transition-colors">
                    <td className="p-md">
                      <div className="font-bold">Abandoned Cart v2</div>
                      <div className="text-label-xs text-on-surface-variant">Automation active</div>
                    </td>
                    <td className="p-md">
                      <span className="px-sm py-xs bg-secondary/10 border border-secondary/50 text-secondary rounded text-[10px] font-bold uppercase">Optimizing</span>
                    </td>
                    <td className="p-md">
                      <div className="flex items-center gap-xs h-4">
                        <div className="h-full bg-primary/80 rounded-l" style={{width: '100%'}}></div>
                        <div className="h-full bg-secondary/80" style={{width: '45%'}}></div>
                        <div className="h-full bg-tertiary/80 rounded-r" style={{width: '22%'}}></div>
                      </div>
                    </td>
                    <td className="p-md">
                      <button className="p-xs hover:bg-outline-variant/30 rounded"><span className="material-symbols-outlined">more_vert</span></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Feed */}
          <div className="glass-panel rounded-xl flex flex-col h-[500px]">
            <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-high/10">
              <h3 className="font-headline-md text-headline-md text-on-surface">Live Interactions</h3>
              <span className="flex items-center gap-xs text-[10px] font-bold text-tertiary animate-pulse">
                <span className="w-1.5 h-1.5 bg-tertiary rounded-full"></span> LIVE
              </span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-md space-y-md">
              {(eventsData?.events || []).map((ev: any, i: number) => (
                <div key={ev.id || i} className="flex items-start gap-md group">
                  <div className="h-10 w-10 rounded bg-surface-container-highest border border-outline-variant flex items-center justify-center shrink-0">
                    <span className={\`material-symbols-outlined \${ev.eventType === 'order_placed' ? 'text-primary' : ev.eventType === 'clicked' ? 'text-tertiary' : 'text-secondary'}\`}>
                      {ev.eventType === 'order_placed' ? 'shopping_cart' : ev.channel === 'whatsapp' ? 'sms' : 'mail'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-on-surface truncate">
                      <span className="font-bold">{ev.customerName || 'Customer'}</span> {ev.eventType.replace('_', ' ')}
                    </p>
                    <p className="text-label-xs text-on-surface-variant">{ev.campaignName || 'Campaign'} • just now</p>
                  </div>
                </div>
              ))}
              {(!eventsData || eventsData.events.length === 0) && (
                <div className="text-on-surface-variant text-sm p-4 text-center">Listening for events...</div>
              )}
            </div>
            <button className="p-sm text-label-xs text-primary font-bold hover:bg-primary/10 transition-colors text-center w-full">VIEW ALL ACTIVITY</button>
          </div>
        </div>

        {/* AI Insight Section */}
        <div className="glass-panel p-lg rounded-xl flex items-center gap-lg border-l-4 border-l-primary relative overflow-hidden mt-6">
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none bg-gradient-to-r from-transparent to-primary"></div>
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 z-10">
            <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
          </div>
          <div className="flex-1 z-10">
            <h4 className="font-headline-md text-headline-md text-primary">AI Optimization Opportunity</h4>
            <p className="font-body-md text-on-surface-variant mt-xs">Your "Winter Solstice Drop" campaign is seeing a 40% higher engagement rate on SMS compared to Email. I suggest shifting 20% of your remaining budget to SMS for the final 24 hours.</p>
          </div>
          <div className="flex items-center gap-md z-10">
            <button className="px-md py-sm bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all">Apply Recommendation</button>
            <button className="text-on-surface-variant hover:text-on-surface transition-colors">Dismiss</button>
          </div>
        </div>
      </div>
    </>
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
console.log('UI updated');
