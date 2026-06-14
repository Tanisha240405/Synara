'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Use debounced search for the API
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // Simple debounce
    setTimeout(() => setDebouncedSearch(e.target.value), 300);
  };

  const { data: campaignData, error: campaignError } = useSWR(`/api/campaigns/${id}`, fetcher);
  const { data: recipientsData, isLoading } = useSWR(
    `/api/campaigns/${id}/recipients?page=${page}&status=${statusFilter}&search=${encodeURIComponent(debouncedSearch)}`, 
    fetcher
  );

  if (campaignError) return <div className="p-xl text-center text-error">Failed to load campaign</div>;
  if (!campaignData) return <div className="p-xl text-center text-on-surface-variant flex items-center justify-center gap-2"><span className="material-symbols-outlined animate-spin">progress_activity</span> Loading...</div>;

  const recipients = recipientsData?.recipients || [];
  const totalPages = recipientsData?.totalPages || 1;
  const totalRecords = recipientsData?.total || 0;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'opened': return 'bg-secondary/10 text-secondary border-secondary/30';
      case 'clicked': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'converted': return 'bg-tertiary/10 text-tertiary border-tertiary/30';
      case 'failed': return 'bg-error/10 text-error border-error/30';
      case 'pending': 
      case 'queued': return 'bg-surface-variant/30 text-on-surface-variant border-outline-variant/30';
      default: return 'bg-surface-variant/30 text-on-surface-variant border-outline-variant/30';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-margin-mobile md:p-margin-desktop w-full pb-32">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-sm mb-lg">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
        </button>
        <span className="text-label-xs text-on-surface-variant uppercase tracking-wider">Campaigns / {campaignData.name}</span>
      </div>

      {/* Campaign Summary Header */}
      <div className="glass-card rounded-xl p-xl mb-xl border-t-4 border-t-primary flex flex-col md:flex-row justify-between items-start md:items-center gap-lg">
        <div>
          <div className="flex items-center gap-md mb-xs">
            <h1 className="font-display-md text-display-md font-bold text-on-surface">{campaignData.name}</h1>
            <span className={`px-sm py-1 border rounded text-xs font-bold uppercase ${
              campaignData.status === 'completed' ? 'bg-tertiary/10 border-tertiary/50 text-tertiary' :
              campaignData.status === 'draft' ? 'bg-surface-variant/10 border-outline-variant/50 text-on-surface-variant' :
              'bg-secondary/10 border-secondary/50 text-secondary'
            }`}>{campaignData.status}</span>
          </div>
          <p className="text-on-surface-variant flex items-center gap-sm mt-sm">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-primary">{campaignData.channel === 'whatsapp' ? 'chat' : campaignData.channel === 'email' ? 'mail' : 'sms'}</span> {campaignData.channel.toUpperCase()}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">groups</span> {campaignData.segmentName || 'Custom Segment'}</span>
            {campaignData.productName && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-primary"><span className="material-symbols-outlined text-sm text-primary">sell</span> {campaignData.productName}</span>
              </>
            )}
          </p>
        </div>
        
        <div className="flex gap-md w-full md:w-auto">
          <div className="bg-surface-container p-sm rounded-lg border border-outline-variant/30 flex-1 md:flex-none">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Target Size</p>
            <p className="font-data-tabular text-lg">{campaignData.totalRecipients?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-surface-container p-sm rounded-lg border border-outline-variant/30 flex-1 md:flex-none">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Sent Date</p>
            <p className="font-data-tabular text-lg">{campaignData.sentAt ? new Date(campaignData.sentAt).toLocaleDateString() : 'N/A'}</p>
          </div>
          
          {/* Action Menus */}
          <div className="flex flex-col gap-sm">
            <Link href={`/analytics?campaign=${id}`} className="bg-surface-container-high hover:bg-primary/20 text-on-surface p-sm rounded-lg border border-outline-variant/50 flex items-center justify-center transition-colors tooltip-trigger" title="View Full Analytics">
              <span className="material-symbols-outlined text-sm">analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Summary Row */}
      {campaignData.stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-md mb-xl">
          <div className="glass-card p-md rounded-xl">
            <p className="text-label-xs text-on-surface-variant uppercase tracking-widest mb-xs">Delivered</p>
            <p className="font-display-sm font-bold">{campaignData.stats.totalDelivered?.toLocaleString()}</p>
            <p className="text-xs text-tertiary">{((campaignData.stats.totalDelivered / campaignData.stats.totalSent) * 100).toFixed(1)}%</p>
          </div>
          <div className="glass-card p-md rounded-xl">
            <p className="text-label-xs text-on-surface-variant uppercase tracking-widest mb-xs">Opened</p>
            <p className="font-display-sm font-bold">{campaignData.stats.totalOpened?.toLocaleString()}</p>
            <p className="text-xs text-secondary">{((campaignData.stats.totalOpened / campaignData.stats.totalDelivered) * 100).toFixed(1)}%</p>
          </div>
          <div className="glass-card p-md rounded-xl">
            <p className="text-label-xs text-on-surface-variant uppercase tracking-widest mb-xs">Clicked</p>
            <p className="font-display-sm font-bold">{campaignData.stats.totalClicked?.toLocaleString()}</p>
            <p className="text-xs text-primary">{((campaignData.stats.totalClicked / campaignData.stats.totalOpened) * 100).toFixed(1)}%</p>
          </div>
          <div className="glass-card p-md rounded-xl">
            <p className="text-label-xs text-on-surface-variant uppercase tracking-widest mb-xs">Converted</p>
            <p className="font-display-sm font-bold">{campaignData.stats.totalOrderPlaced?.toLocaleString()}</p>
            <p className="text-xs text-tertiary">{((campaignData.stats.totalOrderPlaced / campaignData.stats.totalDelivered) * 100).toFixed(1)}%</p>
          </div>
          <div className="glass-card p-md rounded-xl bg-primary/5 border-primary/20">
            <p className="text-label-xs text-primary uppercase tracking-widest mb-xs">Revenue</p>
            <p className="font-display-sm font-bold text-primary">₹{parseFloat(campaignData.stats.revenueAttributed || '0').toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Recipients Table Section */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-lg border-b border-outline-variant/50 bg-surface-container/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
          <h2 className="font-headline-md text-headline-md">Recipient Log <span className="text-sm font-normal text-on-surface-variant ml-2">({totalRecords.toLocaleString()} total)</span></h2>
          
          <div className="flex gap-md w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input 
                type="text" 
                placeholder="Search name..."
                value={search}
                onChange={handleSearchChange}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-xl pr-md py-sm text-sm focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-sm cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="delivered">Delivered</option>
              <option value="opened">Opened</option>
              <option value="clicked">Clicked</option>
              <option value="converted">Converted</option>
              <option value="failed">Failed</option>
              <option value="queued">Queued</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto relative min-h-[300px]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm z-10">
              <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
            </div>
          ) : null}
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider">Customer</th>
                <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider">Contact Details</th>
                <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider">Delivery Time</th>
                <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {recipients.length > 0 ? recipients.map((r: any) => (
                <tr key={r.id} className="hover:bg-surface-container-high/30 transition-colors group">
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center text-primary font-bold text-xs">
                        {r.customer?.name?.charAt(0) || '?'}
                      </div>
                      <span className="font-bold">{r.customer?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-lg py-md">
                    <div className="text-sm text-on-surface-variant flex flex-col gap-1">
                      {r.customer?.email && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">mail</span> {r.customer.email}</span>}
                      {r.customer?.phone && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">phone</span> {r.customer.phone}</span>}
                    </div>
                  </td>
                  <td className="px-lg py-md text-sm text-on-surface-variant font-data-tabular text-data-tabular">
                    {r.sentAt ? new Date(r.sentAt).toLocaleString() : 'Pending'}
                  </td>
                  <td className="px-lg py-md text-right">
                    <span className={`px-sm py-1 border rounded text-[10px] font-bold uppercase tracking-widest ${getStatusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-lg py-xl text-center text-on-surface-variant italic">No recipients found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-md border-t border-outline-variant/50 bg-surface-container-low/30 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Page {page} of {totalPages}</span>
            <div className="flex gap-sm">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-md py-xs bg-surface-container border border-outline-variant rounded text-sm hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-md py-xs bg-surface-container border border-outline-variant rounded text-sm hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
