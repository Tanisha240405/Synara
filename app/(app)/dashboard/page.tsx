'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useAppStore } from '@/store';
import Link from 'next/link';
import AutopilotSuggestions from '@/components/AutopilotSuggestions';

const fetcher = (url: string) => fetch(url, { credentials: 'include', cache: 'no-store' }).then(r => r.json());

export default function Dashboard() {
  const { toggleCopilot, addNotification } = useAppStore();
  const [showInsight, setShowInsight] = useState(true);
  const { data: stats, mutate: mutateStats } = useSWR('/api/analytics/dashboard', fetcher, { 
    refreshInterval: 2000,
    revalidateOnMount: true,
    revalidateOnFocus: true,
  });
  const { data: eventsData } = useSWR('/api/analytics/events/recent', fetcher, { 
    refreshInterval: 2000,
    revalidateOnMount: true,
  });
  const { data: campaignsData, mutate: mutateCampaigns } = useSWR('/api/campaigns', fetcher, { 
    refreshInterval: 3000,
    revalidateOnMount: true,
  });
  const campaigns = campaignsData?.campaigns || [];
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      mutateCampaigns();
      setActiveDropdown(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyRecommendation = () => {
    addNotification({ title: 'Recommendation Applied', message: 'Budget shifted to SMS successfully.' });
    setShowInsight(false);
  };

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] w-full gap-4">
        <span className="material-symbols-outlined animate-spin text-primary text-[40px]">progress_activity</span>
        <span className="text-label-sm font-bold tracking-widest uppercase text-on-surface-variant animate-pulse">Syncing Database...</span>
      </div>
    );
  }

  return (
    <>
      {/* Stats Ticker */}
      <section className="bg-surface-container-lowest border-b border-outline-variant overflow-hidden h-10 flex items-center">
        <div className="animate-ticker py-2 hover:pause">
          <div className="flex items-center gap-xl px-md">
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-tertiary"><span className="material-symbols-outlined text-sm">trending_up</span> LTV: ₹{stats?.currentLtv ?? 0}</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-on-surface-variant border-x border-outline-variant/30 px-lg">CHURN: {stats?.churnRate ?? 0}%</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-secondary">ACTIVE CAMPAIGNS: {stats?.activeCampaigns ?? 0}</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-primary">AOV: ₹{stats?.aov ?? 0}</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-error"><span className="material-symbols-outlined text-sm">trending_down</span> BOUNCE: 0%</span>
          </div>
          <div className="flex items-center gap-xl px-md">
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-tertiary"><span className="material-symbols-outlined text-sm">trending_up</span> LTV: ₹{stats?.currentLtv ?? 0}</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-on-surface-variant border-x border-outline-variant/30 px-lg">CHURN: {stats?.churnRate ?? 0}%</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-secondary">ACTIVE CAMPAIGNS: {stats?.activeCampaigns ?? 0}</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-primary">AOV: ₹{stats?.aov ?? 0}</span>
            <span className="flex items-center gap-xs font-data-tabular text-data-tabular text-error"><span className="material-symbols-outlined text-sm">trending_down</span> BOUNCE: 0%</span>
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
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
              {/* Total Sent */}
              <div className="glass-panel p-md rounded-xl flex flex-col gap-sm relative overflow-hidden">
                <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest">Total Sent</p>
                <div className="flex items-end justify-between">
                  <h3 className="font-display-lg text-display-lg text-on-surface transition-all duration-500">{(stats?.totalSent ?? 0).toLocaleString()}</h3>
                  <span className="text-tertiary font-data-tabular text-data-tabular mb-1">
                    {stats?.totalSent > 0 ? `${((stats.totalDelivered / stats.totalSent) * 100).toFixed(1)}% DR` : '—'}
                  </span>
                </div>
                <div className="h-8 w-full mt-sm">
                  <div className="flex items-end gap-1 h-full">
                    {[0.3, 0.5, 0.4, 0.7, Math.min(1, (stats?.totalSent || 0) / Math.max(1, (stats?.totalSent || 1)))].map((h, i) => (
                      <div key={i} className="bg-primary/60 w-full rounded-t-xs transition-all duration-700" style={{height: `${h * 100}%`}}></div>
                    ))}
                    <div className="bg-primary w-full rounded-t-xs transition-all duration-700" style={{height: '100%'}}></div>
                  </div>
                </div>
              </div>

              {/* Delivered */}
              <div className="glass-panel p-md rounded-xl flex flex-col gap-sm">
                <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest">Delivered</p>
                <div className="flex items-end justify-between">
                  <h3 className="font-display-lg text-display-lg text-on-surface transition-all duration-500">{(stats?.totalDelivered ?? 0).toLocaleString()}</h3>
                  <span className="text-secondary font-data-tabular text-data-tabular mb-1">
                    {stats?.totalSent > 0 ? `${((stats.totalDelivered / stats.totalSent) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
                <div className="h-8 w-full mt-sm">
                  <div className="flex items-end gap-1 h-full">
                    {[0.6, 0.7, 0.75, 0.82, 0.9].map((h, i) => (
                      <div key={i} className="bg-secondary/60 w-full rounded-t-xs" style={{height: `${h * 100}%`}}></div>
                    ))}
                    <div className="bg-secondary w-full rounded-t-xs" style={{height: `${Math.min(100, stats?.totalSent > 0 ? (stats.totalDelivered / stats.totalSent) * 100 : 0)}%`}}></div>
                  </div>
                </div>
              </div>

              {/* Avg Open Rate */}
              <div className="glass-panel p-md rounded-xl flex flex-col gap-sm">
                <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest">Avg Open Rate</p>
                <div className="flex items-end justify-between">
                  <h3 className="font-display-lg text-display-lg text-on-surface transition-all duration-500">{stats?.avgOpenRate ?? '0'}%</h3>
                  <span className="text-tertiary font-data-tabular text-data-tabular mb-1">
                    CTR: {stats?.clickThroughRate ?? '0'}%
                  </span>
                </div>
                <div className="h-8 w-full mt-sm">
                  <div className="flex items-end gap-1 h-full">
                    {[0.25, 0.32, 0.28, 0.4, 0.38].map((h, i) => (
                      <div key={i} className="bg-tertiary/60 w-full rounded-t-xs" style={{height: `${h * 100}%`}}></div>
                    ))}
                    <div className="bg-tertiary w-full rounded-t-xs transition-all duration-700" style={{height: `${Math.min(100, parseFloat(stats?.avgOpenRate || '0'))}%`}}></div>
                  </div>
                </div>
              </div>

              {/* Conversions */}
              <div className="glass-panel p-md rounded-xl flex flex-col gap-sm border-l-4 border-l-primary/50">
                <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest">Conversions</p>
                <div className="flex items-end justify-between">
                  <h3 className="font-display-lg text-display-lg text-on-surface transition-all duration-500">{(stats?.totalConversions ?? 0).toLocaleString()}</h3>
                  <span className="text-primary font-data-tabular text-data-tabular mb-1">₹{Number(stats?.revenue ?? 0).toLocaleString()}</span>
                </div>
                <div className="h-8 w-full mt-sm">
                  <div className="flex items-end gap-1 h-full">
                    {[0.1, 0.2, 0.3, 0.5, 0.7].map((h, i) => (
                      <div key={i} className="bg-primary-container/60 w-full rounded-t-xs" style={{height: `${h * 100}%`}}></div>
                    ))}
                    <div className="bg-primary w-full rounded-t-xs transition-all duration-700" style={{height: `${Math.min(100, stats?.totalConversions > 0 ? 90 : 0)}%`}}></div>
                  </div>
                </div>
              </div>
            </div>

            <AutopilotSuggestions />

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
                      {campaigns.filter((c: any) => c.status !== 'draft').length > 0 ? campaigns.filter((c: any) => c.status !== 'draft').slice(0, 5).map((campaign: any) => (
                        <tr key={campaign.id} className="border-b border-outline-variant/30 hover:bg-surface-container-high/20 transition-colors group cursor-pointer" onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
                          window.location.href = `/campaigns/${campaign.id}`;
                        }}>
                          <td className="p-md">
                            <div className="font-bold">{campaign.name}</div>
                            <div className="text-label-xs text-on-surface-variant">Created {new Date(campaign.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="p-md">
                            <span className={`px-sm py-xs border rounded text-[10px] font-bold uppercase ${
                              campaign.status === 'completed' ? 'bg-tertiary/10 border-tertiary/50 text-tertiary' :
                              'bg-secondary/10 border-secondary/50 text-secondary'
                            }`}>{campaign.status}</span>
                          </td>
                          <td className="p-md w-48">
                            <div className="flex items-center gap-xs h-4">
                              <div className="h-full bg-primary/80 rounded-l" style={{width: '100%'}}></div>
                              <div className="h-full bg-secondary/80" style={{width: '60%'}}></div>
                              <div className="h-full bg-tertiary/80 rounded-r" style={{width: '30%'}}></div>
                            </div>
                          </td>
                          <td className="p-md">
                            <div className="flex items-center gap-sm">
                              <Link href={`/campaigns/${campaign.id}`} title="View Analytics" className="p-xs text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded transition-colors">
                                <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                              </Link>
                              <button title="Pause Campaign" className="p-xs text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded transition-colors">
                                <span className="material-symbols-outlined text-[20px]">pause_circle</span>
                              </button>
                              <button onClick={() => handleDeleteCampaign(campaign.id)} title="Delete Campaign" className="p-xs text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-colors">
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="p-md text-center text-on-surface-variant italic py-lg">No active campaigns</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Draft Campaigns */}
                {campaigns.filter((c: any) => c.status === 'draft').length > 0 && (
                  <>
                    <div className="p-md border-y border-outline-variant flex justify-between items-center mt-md bg-surface-container-low">
                      <h3 className="font-headline-md text-headline-md text-on-surface">Drafts & Scheduled</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-container-high/30">
                            <th className="p-md font-label-xs text-label-xs text-on-surface-variant uppercase">Campaign</th>
                            <th className="p-md font-label-xs text-label-xs text-on-surface-variant uppercase">Status</th>
                            <th className="p-md font-label-xs text-label-xs text-on-surface-variant uppercase">Target Size</th>
                            <th className="p-md font-label-xs text-label-xs text-on-surface-variant uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="font-body-md text-on-surface">
                          {campaigns.filter((c: any) => c.status === 'draft').slice(0, 5).map((campaign: any) => (
                            <tr key={campaign.id} className="border-b border-outline-variant/30 hover:bg-surface-container-high/20 transition-colors">
                              <td className="p-md">
                                <div className="font-bold">{campaign.name}</div>
                                <div className="text-label-xs text-on-surface-variant">Created {new Date(campaign.createdAt).toLocaleDateString()}</div>
                              </td>
                              <td className="p-md">
                                <span className="px-sm py-xs border rounded text-[10px] font-bold uppercase bg-surface-variant/10 border-outline-variant/50 text-on-surface-variant">
                                  {campaign.status}
                                </span>
                              </td>
                              <td className="p-md">
                                <span className="font-data-tabular">{campaign.totalRecipients?.toLocaleString() || '0'} shoppers</span>
                              </td>
                              <td className="p-md">
                                <button 
                                  onClick={async () => {
                                    try {
                                      await fetch(`/api/campaigns/${campaign.id}/send`, { method: 'POST' });
                                      mutateCampaigns();
                                    } catch(e) {}
                                  }}
                                  className="px-md py-sm bg-primary text-on-primary rounded font-bold text-xs hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-[0_0_10px_rgba(202,190,255,0.2)]"
                                >
                                  Send Now
                                </button>
                                <button 
                                  onClick={() => handleDeleteCampaign(campaign.id)}
                                  className="ml-sm p-sm text-on-surface-variant hover:text-error transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Live Feed */}
              <div className="glass-panel rounded-xl flex flex-col h-[500px]">
                <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-high/10">
                  <h3 className="font-headline-md text-headline-md text-on-surface">Live Interactions</h3>
                  {campaigns.some((c: any) => c.status === 'sending') && (
                    <span className="flex items-center gap-xs text-[10px] font-bold text-tertiary animate-pulse bg-tertiary/10 border border-tertiary/30 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-tertiary rounded-full"></span> LIVE
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-md space-y-md">
                  {(eventsData?.events || []).map((ev: any, i: number) => (
                    <div key={ev.id || i} className="flex items-start gap-md group">
                      <div className="h-10 w-10 rounded bg-surface-container-highest border border-outline-variant flex items-center justify-center shrink-0">
                        <span className={`material-symbols-outlined ${ev.eventType === 'order_placed' ? 'text-primary' : ev.eventType === 'clicked' ? 'text-tertiary' : 'text-secondary'}`}>
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
            {showInsight && (
              <div className="glass-panel p-lg rounded-xl flex items-center gap-lg border-l-4 border-l-primary relative overflow-hidden mt-6">
                <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none bg-gradient-to-r from-transparent to-primary"></div>
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 z-10">
                  <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
                </div>
                <div className="flex-1 z-10">
                  <h4 className="font-headline-md text-headline-md text-primary">AI Optimization Opportunity</h4>
                  <p className="font-body-md text-on-surface-variant mt-xs">Your "{campaigns.filter((c: any) => c.status !== 'draft')[0]?.name || 'Recent'}" campaign is seeing a 40% higher engagement rate on SMS compared to Email. I suggest shifting 20% of your remaining budget to SMS for the final 24 hours.</p>
                </div>
                <div className="flex items-center gap-md z-10">
                  <button onClick={handleApplyRecommendation} className="px-md py-sm bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all">Apply Recommendation</button>
                  <button onClick={() => setShowInsight(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">Dismiss</button>
                </div>
              </div>
            )}
      </div>
    </>
  );
}