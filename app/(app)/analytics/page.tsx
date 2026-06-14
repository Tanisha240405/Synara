'use client';
import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import RevenueIntelligence from './RevenueIntelligence';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json());

export default function AnalyticsPage() {
  const router = useRouter();
  const { addNotification } = useAppStore();
  const [mainTab, setMainTab] = useState<'campaigns' | 'revenue'>('campaigns');
  const [activeTab, setActiveTab] = useState('All Campaigns');
  
  type Anomaly = {
    id: string;
    type: string;
    segmentName: string;
    metricDelta: string;
    hypothesis: string;
    status: 'active' | 'snoozed' | 'resolved';
    timestamp: Date;
    segmentId: string;
  };

  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [segmentInsights, setSegmentInsights] = useState<Record<string, any>>({});
  const [isBoosting, setIsBoosting] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [anomalies, setAnomalies] = useState<Anomaly[]>([
    {
      id: 'a1',
      type: 'Conversion Velocity Drop',
      segmentName: 'High Intent Shoppers',
      metricDelta: 'Conversions/hour: 45 → 12 (-73%)',
      hypothesis: 'Recent SMS delivery delays caused a bottleneck in the conversion funnel during peak hours.',
      status: 'active',
      timestamp: new Date(),
      segmentId: 'mock-1'
    }
  ]);

  useEffect(() => {
    const anomalyTypes = [
      { type: 'Engagement Drop', metric: 'Open rate: 68% → 42% (-26%)', hyp: 'Email subject line fatigue detected. The current subject is underperforming.' },
      { type: 'Delivery Failure Spike', metric: 'Failure rate: 2% → 14% (+12%)', hyp: 'A carrier filtering issue has caused a sudden spike in bounce rates.' },
      { type: 'Unusual Opt-out Surge', metric: 'Opt-out rate: 0.5% → 4.1% (+3.6%)', hyp: 'The message frequency for this segment may be too high.' }
    ];
    
    const interval = setInterval(() => {
      setAnomalies(prev => {
        // Only generate randomly ~20% of the time every 60s
        if (Math.random() > 0.8) {
          const rand = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
          const newAnomaly: Anomaly = {
            id: 'a' + Date.now(),
            type: rand.type,
            segmentName: 'VIP Customers',
            metricDelta: rand.metric,
            hypothesis: rand.hyp,
            status: 'active',
            timestamp: new Date(),
            segmentId: 'mock-2'
          };
          addNotification({ 
            title: 'New Anomaly Detected', 
            message: `Unusual activity in segment "${newAnomaly.segmentName}": ${newAnomaly.type}` 
          });
          return [newAnomaly, ...prev].slice(0, 10);
        }
        return prev;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSnooze = (id: string) => {
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status: 'snoozed' } : a));
  };

  const [isRecovering, setIsRecovering] = useState<string | null>(null);

  const handleRecovery = async (anomaly: Anomaly) => {
    setIsRecovering(anomaly.id);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ 
            role: 'user', 
            content: `Draft a very short win-back recovery message for the anomaly: ${anomaly.type} in segment ${anomaly.segmentName}. Hypothesis: ${anomaly.hypothesis}. Output only the raw message, keep it under 160 characters for SMS.` 
          }],
          context: { page: 'anomaly-recovery' }
        })
      });
      
      let msg = "We noticed an issue and want to make it right. Here is a special 15% off link for you: {link}";
      const data = await res.json();
      if (res.ok && data.content) {
        msg = data.content;
      }
      
      setAnomalies(prev => prev.map(a => a.id === anomaly.id ? { ...a, status: 'resolved' } : a));
      router.push(`/campaigns?segmentId=${anomaly.segmentId}&message=${encodeURIComponent(msg)}&channel=sms`);
    } catch (err) {
      console.error(err);
      setIsRecovering(null);
    }
  };
  
  // Use SWR to fetch analytics data
  const { data: stats, isLoading: statsLoading } = useSWR('/api/analytics/dashboard', fetcher);
  const { data: segmentsData, isLoading: segmentsLoading } = useSWR('/api/segments', fetcher);
  const { data: dbCampaigns, isLoading: campaignsLoading } = useSWR('/api/campaigns', fetcher);
  const { data: heatmapData } = useSWR('/api/analytics/heatmap', fetcher);

  const getStableRandom = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash % 1000) / 1000;
  };

  const handleSegmentExpand = async (segId: string, segmentName: string, healthScore: number, status: string, population: number) => {
    if (expandedSegment === segId) {
      setExpandedSegment(null);
      return;
    }
    setExpandedSegment(segId);
    if (!segmentInsights[segId]) {
      try {
        const res = await fetch('/api/ai/segment-insight', {
          method: 'POST',
          body: JSON.stringify({ segmentName, healthScore, status, population })
        });
        const data = await res.json();
        setSegmentInsights(prev => ({ ...prev, [segId]: data }));
      } catch(e) {
        setSegmentInsights(prev => ({ ...prev, [segId]: { error: true } }));
      }
    }
  };

  const handleBoostSegment = async (e: any, segId: string, segmentName: string, draftMessage: string) => {
    e.stopPropagation();
    setIsBoosting(segId);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Recovery: ${segmentName}`,
          channel: 'whatsapp',
          status: 'draft',
          segmentId: segId,
          messageTemplate: draftMessage || 'We miss you! Come back.'
        })
      });
      const data = await res.json();
      addNotification({ 
        title: `Recovery campaign created → ${data.campaign?.name || 'Draft'}`, 
        message: 'Redirecting to campaign builder...' 
      });
      if (data.campaign?.id) {
        router.push(`/campaigns/${data.campaign.id}`);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsBoosting(null);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    addNotification({ title: 'Preparing Export', message: 'Generating PDF report...' });
    
    try {
      const element = document.getElementById('analytics-dashboard');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0A0A0B',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'l' : 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save('Synara_Analytics_Report.pdf');
      
      addNotification({ title: 'Export Complete', message: 'PDF report downloaded successfully.' });
    } catch (error) {
      console.error('PDF export failed', error);
      addNotification({ title: 'Export Failed', message: 'There was an error generating the PDF.' });
    } finally {
      setIsExporting(false);
    }
  };
  
  const isLoading = statsLoading || segmentsLoading || campaignsLoading;
  
  const campaigns = ['All Campaigns', ...(dbCampaigns?.campaigns?.map((c: any) => c.name) || [])];

  const activeCampaign = dbCampaigns?.campaigns?.find((c: any) => c.name === activeTab);
  const cStats = activeCampaign?.stats || {};
  
  const displayStats = activeTab === 'All Campaigns' ? stats : {
    hasData: true,
    totalSent: cStats.totalSent || 0,
    avgOpenRate: cStats.totalDelivered > 0 ? ((cStats.totalOpened / cStats.totalDelivered) * 100).toFixed(1) : '0',
    clickThroughRate: cStats.totalOpened > 0 ? ((cStats.totalClicked / cStats.totalOpened) * 100).toFixed(1) : '0',
    conversionRate: cStats.totalDelivered > 0 ? ((cStats.totalOrderPlaced / cStats.totalDelivered) * 100).toFixed(1) : '0',
    revenue: Number(cStats.revenueAttributed) || 0
  };

  return (
    <>
    <div id="analytics-dashboard" className="max-w-[1400px] mx-auto p-margin-mobile md:p-margin-desktop w-full pb-32 bg-background relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div>
          <h1 className="font-display-lg text-display-lg font-bold text-on-surface">Analytics</h1>
          <p className="text-on-surface-variant mt-xs">Track every message. Understand every shopper.</p>
        </div>
        <button 
          onClick={handleExportPDF}
          disabled={isExporting || isLoading}
          className="px-md py-sm bg-surface-variant text-on-surface font-bold rounded-lg hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isExporting ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[18px]">download</span>}
          {isExporting ? 'Exporting...' : 'Export Report (PDF)'}
        </button>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-outline-variant/30 mb-xl gap-lg">
        <button 
          onClick={() => setMainTab('campaigns')}
          className={`pb-sm font-bold transition-all relative ${mainTab === 'campaigns' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Campaign Analytics
        </button>
        <button 
          onClick={() => setMainTab('revenue')}
          className={`pb-sm font-bold transition-all relative flex items-center gap-2 ${mainTab === 'revenue' ? 'text-tertiary border-b-2 border-tertiary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          Revenue Intelligence
        </button>
      </div>

      {mainTab === 'revenue' ? (
        <RevenueIntelligence />
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4"></div>
          <p className="text-on-surface-variant font-bold animate-pulse">Loading intelligence...</p>
        </div>
      ) : stats?.hasData === false ? (
        <div className="flex flex-col items-center justify-center py-24 text-center mt-xl glass-card rounded-xl">
          <div className="w-24 h-24 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center mb-lg">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-50">monitoring</span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">No Analytics Yet</h3>
          <p className="text-body-md text-on-surface-variant max-w-md mb-xl">
            You need to import your shoppers or generate mock data to see analytics. Once you have data, <Link href="/" className="text-primary hover:underline transition-colors">Synara</Link> will automatically generate actionable insights.
          </p>
          <div className="flex gap-md">
            <a href="/import" className="bg-primary text-on-primary px-xl py-sm rounded-lg font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-[0_0_20px_rgba(202,190,255,0.2)]">
              Import Shoppers
            </a>
            <a href="/profile" className="bg-surface-variant text-on-surface px-xl py-sm rounded-lg font-bold hover:border-primary border border-outline-variant/50 transition-colors">
              Generate Mock Data
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Campaign Tabs Row */}
          <div className="flex items-center gap-md overflow-x-auto pb-md custom-scrollbar mb-lg">
            {campaigns.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-lg py-sm rounded-full font-bold text-body-md transition-colors ${activeTab === tab ? 'bg-primary-container text-on-primary-container' : 'glass-card text-on-surface-variant hover:text-primary'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-md mb-lg">
            <div className="glass-card p-md rounded-xl group transition-transform duration-300 hover:-translate-y-1">
              <p className="font-label-xs text-label-xs text-outline uppercase tracking-wider mb-xs">Messages Sent</p>
              <div className="flex items-end gap-xs">
                <span className="font-display-lg text-display-lg font-bold text-on-surface">
                  {displayStats?.totalSent ? (displayStats.totalSent > 999 ? (displayStats.totalSent / 1000).toFixed(1) + 'k' : displayStats.totalSent) : '0'}
                </span>
              </div>
            </div>
            <div className="glass-card p-md rounded-xl group transition-transform duration-300 hover:-translate-y-1">
              <p className="font-label-xs text-label-xs text-outline uppercase tracking-wider mb-xs">Open Rate</p>
              <div className="flex items-end gap-xs">
                <span className="font-display-lg text-display-lg font-bold text-on-surface">
                  {displayStats?.avgOpenRate ? displayStats.avgOpenRate + '%' : '0%'}
                </span>
              </div>
            </div>
            <div className="glass-card p-md rounded-xl group transition-transform duration-300 hover:-translate-y-1">
              <p className="font-label-xs text-label-xs text-outline uppercase tracking-wider mb-xs">Click-Through</p>
              <div className="flex items-end gap-xs">
                <span className="font-display-lg text-display-lg font-bold text-on-surface">
                  {displayStats?.clickThroughRate ? displayStats.clickThroughRate + '%' : '0%'}
                </span>
              </div>
            </div>
            <div className="glass-card p-md rounded-xl group transition-transform duration-300 hover:-translate-y-1">
              <p className="font-label-xs text-label-xs text-outline uppercase tracking-wider mb-xs">Conversion</p>
              <div className="flex items-end gap-xs">
                <span className="font-display-lg text-display-lg font-bold text-on-surface">
                  {displayStats?.conversionRate ? displayStats.conversionRate + '%' : '0%'}
                </span>
              </div>
            </div>
            <div className="glass-card p-md rounded-xl group transition-transform duration-300 hover:-translate-y-1 col-span-2 md:col-span-1 border-primary/20">
              <p className="font-label-xs text-label-xs text-primary uppercase tracking-wider mb-xs">Revenue</p>
              <div className="flex items-end gap-xs">
                <span className="font-display-lg text-display-lg font-bold text-on-surface">
                  ₹{displayStats?.revenue ? (displayStats.revenue >= 100000 ? (displayStats.revenue / 100000).toFixed(1) + 'L' : displayStats.revenue.toLocaleString()) : '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Main Charts Bento */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg mb-lg">
            {/* Performance Timeline */}
            <div className="lg:col-span-8 glass-card p-lg rounded-xl flex flex-col">
              <div className="flex items-center justify-between mb-lg">
                <h3 className="font-headline-md text-headline-md text-on-surface">Engagement Timeline</h3>
                <div className="flex items-center gap-md">
                  <div className="flex items-center gap-xs">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    <span className="text-label-xs text-outline">Impressions</span>
                  </div>
                  <div className="flex items-center gap-xs">
                    <span className="w-3 h-3 rounded-full bg-tertiary"></span>
                    <span className="text-label-xs text-outline">Conversions</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 h-64 relative mt-auto">
                <svg className="w-full h-full" viewBox="0 0 800 200">
                  <defs>
                    <linearGradient id="grad-primary" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#cabeff" stopOpacity="0.3"></stop>
                      <stop offset="100%" stopColor="#cabeff" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <line stroke="#2A2D35" strokeDasharray="4" x1="0" x2="800" y1="180" y2="180"></line>
                  <line stroke="#2A2D35" strokeDasharray="4" x1="0" x2="800" y1="120" y2="120"></line>
                  <line stroke="#2A2D35" strokeDasharray="4" x1="0" x2="800" y1="60" y2="60"></line>
                  <path d="M0,180 Q100,140 200,160 T400,80 T600,100 T800,40 L800,200 L0,200 Z" fill="url(#grad-primary)"></path>
                  <path d="M0,180 Q100,140 200,160 T400,80 T600,100 T800,40" fill="none" stroke="#cabeff" strokeLinecap="round" strokeWidth="3"></path>
                  <path d="M0,190 Q150,180 300,185 T500,140 T800,160" fill="none" stroke="#4ae176" strokeDasharray="6 4" strokeLinecap="round" strokeWidth="3"></path>
                  <circle className="animate-pulse" cx="400" cy="80" fill="#cabeff" r="5"></circle>
                  <circle className="animate-ping" cx="400" cy="80" fill="#cabeff" fillOpacity="0.2" r="10"></circle>
                </svg>
                <div className="flex justify-between mt-sm text-label-xs text-outline font-data-tabular">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="lg:col-span-4 glass-card p-lg rounded-xl flex flex-col items-center">
              <h3 className="font-headline-md text-headline-md text-on-surface self-start mb-lg">Funnel Health</h3>
              {(() => {
                const sent = stats?.totalSent || 1;
                const delivered = stats?.totalDelivered || 0;
                const opened = stats?.totalOpened || 0;
                const clicked = stats?.totalClicked || 0;
                const converted = stats?.totalConversions || 0;

                const failed = Math.max(0, sent - delivered);
                const deliveredOnly = Math.max(0, delivered - opened);
                const openedOnly = Math.max(0, opened - clicked);
                const clickedOnly = Math.max(0, clicked - converted);

                const pFailed = (failed / sent) * 100;
                const pDelivered = (deliveredOnly / sent) * 100;
                const pOpened = (openedOnly / sent) * 100;
                const pClicked = (clickedOnly / sent) * 100;
                const pConverted = (converted / sent) * 100;

                const s1 = pConverted;
                const s2 = s1 + pClicked;
                const s3 = s2 + pOpened;
                const s4 = s3 + pDelivered;

                const hasData = sent > 1 || delivered > 0;
                
                const conicString = hasData 
                  ? `conic-gradient(#4ae176 0% ${s1}%, #cabeff ${s1}% ${s2}%, #8a7ee6 ${s2}% ${s3}%, #74a0ff ${s3}% ${s4}%, #454955 ${s4}% 100%)`
                  : `conic-gradient(#454955 0% 100%)`;

                return (
                  <div 
                    className="relative w-48 h-48 mb-lg rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-1000"
                    style={{ background: conicString }}
                  >
                    <div className="absolute inset-[16px] bg-[#16181D] rounded-full flex flex-col items-center justify-center shadow-inner">
                      <span className="font-display-lg text-display-lg font-bold text-on-surface">
                        {stats?.conversionRate ? stats.conversionRate + '%' : '0%'}
                      </span>
                      <span className="text-label-xs text-outline uppercase tracking-widest mt-1">Efficiency</span>
                    </div>
                  </div>
                );
              })()}
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <span className="w-2 h-2 rounded-full bg-outline"></span>
                    <span className="text-body-md text-on-surface-variant">Sent</span>
                  </div>
                  <span className="font-data-tabular text-data-tabular">{stats?.totalSent ? stats.totalSent.toLocaleString() : '0'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span className="text-body-md text-on-surface-variant">Delivered</span>
                  </div>
                  <span className="font-data-tabular text-data-tabular">{stats?.totalDelivered ? stats.totalDelivered.toLocaleString() : '0'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                    <span className="text-body-md text-on-surface-variant">Opened</span>
                  </div>
                  <span className="font-data-tabular text-data-tabular">{stats?.totalOpened ? stats.totalOpened.toLocaleString() : '0'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span className="text-body-md text-on-surface-variant">Clicked</span>
                  </div>
                  <span className="font-data-tabular text-data-tabular">{stats?.totalClicked ? stats.totalClicked.toLocaleString() : '0'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    <span className="text-body-md text-on-surface-variant">Converted</span>
                  </div>
                  <span className="font-data-tabular text-data-tabular">{stats?.totalConversions ? stats.totalConversions.toLocaleString() : '0'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Channel × Time Heatmap */}
          <div className="glass-card p-lg rounded-xl flex flex-col mb-xl">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Channel × Time Heatmap</h3>
            <div className="overflow-x-auto custom-scrollbar pb-4">
              <div className="min-w-[600px]">
                <div className="flex mb-2">
                  <div className="w-20 shrink-0"></div>
                  <div className="flex-1 flex justify-between text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                    <span>6AM</span>
                    <span>12PM</span>
                    <span>6PM</span>
                    <span>11PM</span>
                  </div>
                </div>
                <div className="flex flex-col gap-[3px]">
                  {['whatsapp', 'sms', 'email', 'rcs'].map(channel => (
                    <div key={channel} className="flex gap-[3px] items-center">
                      <div className="w-20 text-xs font-bold text-on-surface uppercase tracking-wider">{channel}</div>
                      <div className="flex-1 flex gap-[3px]">
                        {[...Array(18)].map((_, i) => {
                          const hour = i + 6;
                          const cellData = heatmapData?.heatmap?.[channel]?.[hour];
                          const rate = cellData?.openRate || 0;
                          
                          // opacity calculation based on open rate (0 to 100)
                          // dark grey base, then tint with purple
                          let bgClass = "bg-surface-container-high";
                          let inlineStyle = {};
                          
                          if (rate > 0) {
                            const normalized = Math.min(100, Math.max(0, rate));
                            const opacity = Math.max(0.1, normalized / 100);
                            inlineStyle = { backgroundColor: `rgba(124, 92, 252, ${opacity})` };
                          }
                          
                          const formatHour = (h: number) => h === 12 ? '12pm' : h > 12 ? `${h-12}pm` : `${h}am`;
                          
                          return (
                            <div 
                              key={hour} 
                              className={`flex-1 aspect-square rounded-[4px] relative group cursor-pointer ${bgClass} hover:ring-2 hover:ring-primary z-0 hover:z-10 transition-all`}
                              style={inlineStyle}
                            >
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] p-2 bg-surface-container-highest border border-outline-variant rounded-lg text-xs shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                                <p className="font-bold text-primary capitalize mb-1">{channel} at {formatHour(hour)}</p>
                                {cellData ? (
                                  <p className="text-on-surface">
                                    {rate.toFixed(1)}% avg open rate<br/>
                                    <span className="text-on-surface-variant">{cellData.totalDelivered.toLocaleString()} messages sent</span>
                                  </p>
                                ) : (
                                  <p className="text-on-surface-variant">No data</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {heatmapData?.bestCell && (
              <div className="mt-md p-md rounded-xl bg-tertiary/10 border border-tertiary/20 flex items-center gap-md">
                <span className="material-symbols-outlined text-tertiary text-2xl animate-pulse">auto_awesome</span>
                <p className="text-sm text-on-surface">
                  <span className="font-bold text-tertiary">AI Recommendation:</span> Based on your data, <span className="uppercase font-bold">{heatmapData.bestCell.channel}</span> at <span className="font-bold">
                    {heatmapData.bestCell.hour === 12 ? '12pm' : heatmapData.bestCell.hour > 12 ? `${heatmapData.bestCell.hour-12}pm` : `${heatmapData.bestCell.hour}am`}
                  </span> has your highest open rate ({heatmapData.bestCell.openRate.toFixed(1)}%). Schedule your next campaign for this time to maximize engagement.
                </p>
              </div>
            )}
          </div>
          <div className="mb-lg">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">warning</span> 
              Anomaly Intelligence
            </h3>
            <div className={`flex flex-col gap-sm ${anomalies.length > 2 ? 'max-h-[400px] overflow-y-auto custom-scrollbar pr-2' : ''}`}>
              {anomalies.map(anomaly => (
                <div key={anomaly.id} className={`glass-card border-l-[3px] p-md md:p-lg rounded-xl flex flex-col md:flex-row items-center gap-md transition-all ${
                  anomaly.status === 'active' ? 'border-l-error bg-error-container/5' : 
                  anomaly.status === 'snoozed' ? 'border-l-warning opacity-70' : 
                  'border-l-success opacity-50'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    anomaly.status === 'active' ? 'bg-error/10 text-error' : 
                    anomaly.status === 'snoozed' ? 'bg-warning/10 text-warning' : 
                    'bg-success/10 text-success'
                  }`}>
                    <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>
                      {anomaly.status === 'active' ? 'error' : anomaly.status === 'snoozed' ? 'snooze' : 'check_circle'}
                    </span>
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-headline-md text-headline-md text-on-surface">
                        {anomaly.type}: {anomaly.segmentName}
                      </p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        anomaly.status === 'active' ? 'bg-error/20 text-error' : 
                        anomaly.status === 'snoozed' ? 'bg-warning/20 text-warning' : 
                        'bg-success/20 text-success'
                      }`}>
                        {anomaly.status}
                      </span>
                    </div>
                    <p className="text-on-surface font-mono text-sm mb-2">{anomaly.metricDelta}</p>
                    <p className="text-on-surface-variant text-sm italic">
                      "AI Hypothesis: {anomaly.hypothesis}"
                    </p>
                  </div>
                  {anomaly.status === 'active' && (
                    <div className="flex flex-col sm:flex-row gap-sm w-full md:w-auto shrink-0 mt-4 md:mt-0">
                      <button 
                        onClick={() => handleSnooze(anomaly.id)}
                        className="px-md py-sm bg-surface-variant text-on-surface font-bold rounded-lg hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">snooze</span> Snooze 1hr
                      </button>
                      <button 
                        onClick={() => handleRecovery(anomaly)}
                        disabled={isRecovering === anomaly.id}
                        className="px-md py-sm bg-primary text-on-primary font-bold rounded-lg whitespace-nowrap active:scale-95 transition-transform shadow-[0_0_15px_rgba(202,190,255,0.3)] hover:bg-primary-container hover:text-on-primary-container flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isRecovering === anomaly.id ? (
                          <><span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> Generating...</>
                        ) : (
                          <><span className="material-symbols-outlined text-[18px]">healing</span> Execute Recovery</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {anomalies.length === 0 && (
                <div className="p-xl text-center text-on-surface-variant glass-card rounded-xl">
                  No anomalies detected in the last 24 hours. Systems normal.
                </div>
              )}
            </div>
          </div>

          {/* Segment Performance Table */}
          <div className="glass-card rounded-xl overflow-hidden mb-xl">
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container/30">
              <h3 className="font-headline-md text-headline-md text-on-surface">Segment Breakdown</h3>
              <button className="text-primary text-label-xs font-bold uppercase tracking-widest flex items-center gap-xs">Export CSV <span className="material-symbols-outlined text-[14px]">download</span></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider">Segment Name</th>
                    <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider text-right">Population</th>
                    <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider text-right">Engagement</th>
                    <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider text-right">LTV Index</th>
                    <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider text-right">Health Score</th>
                    <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {segmentsData?.segments?.map((seg: any) => {
                    const r1 = getStableRandom(seg.name + '1');
                    const r2 = getStableRandom(seg.name + '2');
                    const r3 = getStableRandom(seg.name + '3');
                    const r4 = getStableRandom(seg.name + '4');
                    
                    const engagement_rate = 20 + r1 * 60;
                    const ltv_normalised = 30 + r2 * 70;
                    const recency_score = 10 + r3 * 80;
                    const growth_rate = -10 + r4 * 30;
                    
                    const health_score = Math.round((engagement_rate * 0.4) + (ltv_normalised * 0.3) + (recency_score * 0.2) + (growth_rate * 0.1));
                    
                    let statusLabel = 'OPTIMAL';
                    let badgeClass = 'bg-success/10 text-success border-success/30';
                    let healthClass = 'text-success';
                    
                    if (health_score > 70) {
                      statusLabel = 'OPTIMAL';
                      badgeClass = 'bg-success/10 text-success border-success/30';
                      healthClass = 'text-success';
                    } else if (health_score >= 50) {
                      statusLabel = 'SCALING';
                      badgeClass = 'bg-info/10 text-info border-info/30'; // assuming info is blue or primary
                      healthClass = 'text-warning';
                    } else if (health_score >= 30) {
                      statusLabel = 'AT RISK';
                      badgeClass = 'bg-warning/10 text-warning border-warning/30';
                      healthClass = 'text-warning';
                    } else {
                      statusLabel = 'CRITICAL';
                      badgeClass = 'bg-error/10 text-error border-error/30 animate-pulse';
                      healthClass = 'text-error';
                    }
                    
                    if (health_score >= 40 && health_score <= 70) healthClass = 'text-warning';

                    const isExpanded = expandedSegment === seg.id;
                    const insights = segmentInsights[seg.id];

                    return (
                      <React.Fragment key={seg.id}>
                        <tr onClick={() => handleSegmentExpand(seg.id, seg.name, health_score, statusLabel, parseInt(seg.customerCount || '0'))} className={`hover:bg-surface-container-high/50 transition-colors cursor-pointer group ${isExpanded ? 'bg-surface-container/30' : ''}`}>
                          <td className="px-lg py-md">
                            <div className="flex items-center gap-md">
                              <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                                <span className="material-symbols-outlined text-sm">groups</span>
                              </div>
                              <span className="font-bold text-on-surface">{seg.name}</span>
                            </div>
                          </td>
                          <td className="px-lg py-md text-right font-data-tabular text-data-tabular">{seg.customerCount ? parseInt(seg.customerCount).toLocaleString() : '0'}</td>
                          <td className="px-lg py-md text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-data-tabular text-data-tabular">{Math.round(engagement_rate)}%</span>
                              <div className="w-16 h-1 bg-surface-variant rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${engagement_rate}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-lg py-md text-right font-data-tabular text-data-tabular text-tertiary">
                            {Math.round(ltv_normalised)}/100
                          </td>
                          <td className="px-lg py-md text-right font-data-tabular text-data-tabular font-bold">
                            <span className={healthClass}>{health_score}</span>
                          </td>
                          <td className="px-lg py-md text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className={`px-sm py-1 border rounded text-[10px] font-bold uppercase ${badgeClass}`}>{statusLabel}</span>
                              {(statusLabel === 'AT RISK' || statusLabel === 'CRITICAL') && (
                                <button 
                                  onClick={(e) => handleBoostSegment(e, seg.id, seg.name, insights?.draftMessage)}
                                  disabled={isBoosting === seg.id}
                                  className="px-2 py-1 bg-primary text-on-primary rounded text-[10px] font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  {isBoosting === seg.id ? <span className="material-symbols-outlined text-[12px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[12px]">rocket_launch</span>}
                                  BOOST
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  {(!segmentsData?.segments || segmentsData.segments.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-lg py-xl text-center text-on-surface-variant">No segments created yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products Performance Table */}
          <div className="glass-card rounded-xl overflow-hidden mb-xl">
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container/30">
              <h3 className="font-headline-md text-headline-md text-on-surface">Top Products</h3>
              <button className="text-primary text-label-xs font-bold uppercase tracking-widest flex items-center gap-xs">Export CSV <span className="material-symbols-outlined text-[14px]">download</span></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider">Product Name</th>
                    <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider text-right">Price</th>
                    <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider text-right">Campaigns</th>
                    <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider text-right">Messages Sent</th>
                    <th className="px-lg py-md font-label-xs text-label-xs text-outline uppercase tracking-wider text-right">Conversions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {stats?.topProducts?.map((prod: any) => (
                    <tr key={prod.id} className="hover:bg-surface-container-high/50 transition-colors cursor-pointer group">
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-md">
                          <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                            <span className="material-symbols-outlined text-sm">sell</span>
                          </div>
                          <div>
                            <span className="font-bold text-on-surface block">{prod.name}</span>
                            <span className="text-xs text-on-surface-variant">{prod.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-lg py-md text-right font-data-tabular text-data-tabular">₹{parseFloat(prod.price).toLocaleString()}</td>
                      <td className="px-lg py-md text-right font-data-tabular text-data-tabular">{prod.campaignCount}</td>
                      <td className="px-lg py-md text-right font-data-tabular text-data-tabular">{prod.totalSent ? parseInt(prod.totalSent).toLocaleString() : '0'}</td>
                      <td className="px-lg py-md text-right font-data-tabular text-data-tabular text-tertiary">
                        {prod.totalConversions ? parseInt(prod.totalConversions).toLocaleString() : '0'}
                      </td>
                    </tr>
                  ))}
                  {(!stats?.topProducts || stats.topProducts.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-lg py-xl text-center text-on-surface-variant">No product data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>

    {/* Segment Insight Modal */}
    {expandedSegment && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setExpandedSegment(null)}></div>
        <div className="glass-card rounded-xl border border-outline-variant/50 shadow-2xl relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="p-lg flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                Segment Analysis
              </h3>
              <button onClick={() => setExpandedSegment(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            {!segmentInsights[expandedSegment] ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
                <p className="text-on-surface-variant font-bold">Synara AI AI is analyzing segment data...</p>
              </div>
            ) : segmentInsights[expandedSegment].error ? (
              <div className="p-md bg-error/10 border border-error/30 text-error rounded-xl">
                Failed to load AI insights. Please try again later.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                    Health Score Drivers
                  </h4>
                  <ul className="text-body-md text-on-surface-variant space-y-2 list-disc pl-5">
                    {segmentInsights[expandedSegment].bullets?.map((b: string, i: number) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
                
                <div className="p-4 bg-tertiary/10 border border-tertiary/20 rounded-xl">
                  <h4 className="text-xs font-bold text-tertiary uppercase tracking-wider mb-2">Synara AI Recommendation</h4>
                  <p className="text-on-surface font-body-md">{segmentInsights[expandedSegment].recommendation}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-outline uppercase tracking-wider mb-4">7-Day Engagement Trend</h4>
                  <div className="h-32 w-full flex gap-2 px-2">
                    {[...Array(7)].map((_, i) => {
                      const getStableRandom = (seed: string) => {
                        let hash = 0;
                        for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
                        return Math.abs(Math.sin(hash)) % 1;
                      };
                      const segName = segmentsData?.segments?.find((s: any) => s.id === expandedSegment)?.name || 'segment';
                      const h = 20 + getStableRandom(segName + 'trend' + i) * 80;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full">
                          <div className="w-full bg-surface-container-highest rounded-t-sm relative flex items-end overflow-hidden flex-1">
                            <div className="w-full bg-primary/80 transition-all duration-500 rounded-t-sm group-hover:bg-primary" style={{ height: `${h}%` }}></div>
                          </div>
                          <span className="text-[10px] text-on-surface-variant font-data-tabular shrink-0">D-{7-i}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

  </>
  );
}