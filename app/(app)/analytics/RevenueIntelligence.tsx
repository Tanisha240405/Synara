import React, { useState } from 'react';
import useSWR from 'swr';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fetcher = (url: string) => fetch(url, { credentials: 'include', cache: 'no-store' }).then(r => r.json());

export default function RevenueIntelligence() {
  const { data: revData, isLoading } = useSWR('/api/analytics/revenue', fetcher);
  const [sortMode, setSortMode] = useState<'revenue' | 'roi' | 'conversions'>('revenue');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-bold animate-pulse">Loading revenue intelligence...</p>
      </div>
    );
  }

  if (!revData || !revData.topRow) {
    return <div className="text-on-surface-variant">No revenue data available.</div>;
  }

  const { topRow, chartData, channelRoiData, segmentsData } = revData;

  const channelColors: Record<string, string> = {
    whatsapp: '#10B981', // green
    sms: '#9CA3AF',      // grey
    email: '#3B82F6',    // blue
    rcs: '#8B5CF6'       // purple
  };

  const getSortedChartData = () => {
    return [...(chartData || [])].sort((a, b) => {
      if (sortMode === 'revenue') return b.revenue - a.revenue;
      if (sortMode === 'roi') return b.revenuePerMessage - a.revenuePerMessage;
      if (sortMode === 'conversions') return b.conversions - a.conversions;
      return 0;
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface-container-highest border border-outline-variant p-4 rounded-lg shadow-xl text-on-surface">
          <p className="font-bold mb-2 text-primary">{data.fullName}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-on-surface-variant">Messages Sent:</span>
            <span className="font-data-tabular">{data.messagesSent.toLocaleString()}</span>
            <span className="text-on-surface-variant">Conversions:</span>
            <span className="font-data-tabular">{data.conversions.toLocaleString()}</span>
            <span className="text-on-surface-variant">Total Revenue:</span>
            <span className="font-data-tabular text-tertiary">₹{data.revenue.toLocaleString()}</span>
            <span className="text-on-surface-variant">Rev/Message:</span>
            <span className="font-data-tabular">₹{data.revenuePerMessage.toFixed(2)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      {/* Top Row - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-lg">
        <div className="glass-card p-md rounded-xl group transition-transform duration-300 hover:-translate-y-1 bg-gradient-to-br from-tertiary/10 to-transparent border-tertiary/20">
          <p className="font-label-xs text-label-xs text-tertiary uppercase tracking-wider mb-xs">Total Attributed Revenue</p>
          <div className="flex items-end gap-xs">
            <span className="font-display-lg text-display-lg font-bold text-tertiary">
              ₹{topRow.totalRevenue.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="glass-card p-md rounded-xl group transition-transform duration-300 hover:-translate-y-1">
          <p className="font-label-xs text-label-xs text-outline uppercase tracking-wider mb-xs">Avg Rev per Campaign</p>
          <div className="flex items-end gap-xs">
            <span className="font-display-lg text-display-lg font-bold text-on-surface">
              ₹{Math.round(topRow.avgRevenuePerCampaign).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="glass-card p-md rounded-xl group transition-transform duration-300 hover:-translate-y-1">
          <p className="font-label-xs text-label-xs text-outline uppercase tracking-wider mb-xs">Top Channel (Revenue)</p>
          <div className="flex items-end gap-xs">
            <span className="font-display-lg text-display-lg font-bold text-primary uppercase">
              {topRow.bestChannel}
            </span>
          </div>
        </div>
        <div className="glass-card p-md rounded-xl group transition-transform duration-300 hover:-translate-y-1">
          <p className="font-label-xs text-label-xs text-outline uppercase tracking-wider mb-xs">Vs Last Week</p>
          <div className="flex items-end gap-xs">
            <span className="font-display-lg text-display-lg font-bold text-on-surface">
              +{topRow.weeklyGrowth}%
            </span>
            <span className="material-symbols-outlined text-tertiary mb-1">trending_up</span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="glass-card p-lg rounded-xl mb-lg">
        <div className="flex justify-between items-center mb-md">
          <h3 className="font-headline-md text-headline-md text-on-surface">Revenue Attribution</h3>
          <div className="flex bg-surface-container-high rounded-full p-1 border border-outline-variant/30">
            <button onClick={() => setSortMode('revenue')} className={`px-4 py-1 rounded-full text-xs font-bold transition-colors ${sortMode === 'revenue' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>Revenue</button>
            <button onClick={() => setSortMode('roi')} className={`px-4 py-1 rounded-full text-xs font-bold transition-colors ${sortMode === 'roi' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>ROI</button>
            <button onClick={() => setSortMode('conversions')} className={`px-4 py-1 rounded-full text-xs font-bold transition-colors ${sortMode === 'conversions' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>Conversions</button>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getSortedChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {getSortedChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={channelColors[entry.channel] || channelColors.sms} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2 justify-center">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: channelColors.whatsapp }}></div><span className="text-xs text-on-surface-variant uppercase tracking-wider">WhatsApp</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: channelColors.sms }}></div><span className="text-xs text-on-surface-variant uppercase tracking-wider">SMS</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: channelColors.email }}></div><span className="text-xs text-on-surface-variant uppercase tracking-wider">Email</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: channelColors.rcs }}></div><span className="text-xs text-on-surface-variant uppercase tracking-wider">RCS</span></div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* ROI Table */}
        <div className="glass-card p-lg rounded-xl flex flex-col">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Channel ROI Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/30 text-label-xs text-on-surface-variant uppercase tracking-wider">
                  <th className="pb-3 pr-4 font-bold">Channel</th>
                  <th className="pb-3 px-4 font-bold">Sent</th>
                  <th className="pb-3 px-4 font-bold">Conv.</th>
                  <th className="pb-3 px-4 font-bold text-right">Revenue</th>
                  <th className="pb-3 px-4 font-bold text-right">Rev/Msg</th>
                  <th className="pb-3 pl-4 font-bold text-center">Rank</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-on-surface">
                {channelRoiData?.map((row: any, i: number) => (
                  <tr key={row.channel} className="border-b border-outline-variant/10 hover:bg-surface-container/50 transition-colors">
                    <td className="py-3 pr-4 uppercase font-bold text-primary flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: channelColors[row.channel] || channelColors.sms }}></div>
                      {row.channel}
                    </td>
                    <td className="py-3 px-4 font-data-tabular">{row.messagesSent.toLocaleString()}</td>
                    <td className="py-3 px-4 font-data-tabular">{row.conversions.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-data-tabular">₹{row.revenue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-data-tabular">₹{row.revenuePerMessage.toFixed(2)}</td>
                    <td className="py-3 pl-4 text-center text-lg">
                      {row.rank === 0 ? '🥇' : row.rank === 1 ? '🥈' : row.rank === 2 ? '🥉' : row.rank + 1}
                    </td>
                  </tr>
                ))}
                {(!channelRoiData || channelRoiData.length === 0) && (
                  <tr><td colSpan={6} className="text-center py-8 text-on-surface-variant">No channel data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Segments */}
        <div className="glass-card p-lg rounded-xl flex flex-col">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Top 5 Revenue-Generating Segments</h3>
          <div className="flex flex-col gap-4">
            {segmentsData?.map((seg: any) => (
              <div key={seg.name} className="flex flex-col gap-1">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-bold text-on-surface text-sm truncate max-w-[200px]" title={seg.name}>{seg.name}</p>
                    <p className="text-[10px] text-on-surface-variant tracking-wider uppercase">{seg.customersReached.toLocaleString()} reached • ₹{Math.round(seg.avgOrderValue).toLocaleString()} AOV</p>
                  </div>
                  <span className="font-data-tabular font-bold text-tertiary">₹{seg.revenue.toLocaleString()}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary rounded-full" style={{ width: `${Math.max(2, seg.percentageOfTotal)}%` }}></div>
                </div>
              </div>
            ))}
            {(!segmentsData || segmentsData.length === 0) && (
              <div className="text-center py-8 text-on-surface-variant">No segment data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
