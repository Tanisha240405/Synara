'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json());

type Suggestion = {
  opportunityType: string;
  insightHeadline: string;
  opportunityValue: string;
  opportunityValueSubtext: string;
  segmentName: string;
  segmentDescription: string;
  filterJson: any;
  sqlWhere: string;
  channel: string;
  campaignName: string;
  messagePreview: string;
  fullMessageCopy: string;
  estimatedOpenRateMin: number;
  estimatedOpenRateMax: number;
  confidence: string;
  confidenceReason: string;
  fullReasoning: string;
};

export default function AutopilotSuggestions() {
  const router = useRouter();
  const { addNotification } = useAppStore();
  const [forceRefresh, setForceRefresh] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [launching, setLaunching] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/autopilot/suggestions${forceRefresh ? '?refresh=true' : ''}`, 
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleRefresh = async () => {
    setForceRefresh(true);
    await mutate();
    setForceRefresh(false);
  };

  const handleLaunch = async (sugg: Suggestion) => {
    try {
      setLaunching(true);
      // 1. Create Segment
      const segRes = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sugg.segmentName,
          filterJson: sugg.filterJson,
          sqlWhere: sugg.sqlWhere,
          isAiGenerated: true,
          naturalLanguageQuery: sugg.segmentDescription
        })
      });
      const segData = await segRes.json();
      if (!segData.id) throw new Error("Failed to create segment");

      // 2. Create Campaign Draft
      const campRes = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sugg.campaignName,
          segmentId: segData.id,
          channel: sugg.channel,
          messageTemplate: sugg.fullMessageCopy,
          status: 'draft'
        })
      });
      const campData = await campRes.json();
      if (!campData.campaign || !campData.campaign.id) throw new Error("Failed to create campaign");

      // 3. Notify & Redirect
      addNotification({
        title: '✦ Campaign ready',
        message: 'Your AI-generated campaign is ready. Just hit Send!'
      });
      
      setSelectedSuggestion(null);
      router.push(`/campaigns/${campData.campaign.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to launch campaign automatically.');
    } finally {
      setLaunching(false);
    }
  };

  const getBadgeColors = (type: string) => {
    switch(type) {
      case 'WIN-BACK': return 'bg-error/15 text-error';
      case 'UPSELL': return 'bg-warning/15 text-warning';
      case 'RE-ENGAGE': return 'bg-primary/15 text-primary';
      case 'LOYALTY': return 'bg-success/15 text-success';
      case 'FLASH SALE': return 'bg-secondary/15 text-secondary';
      default: return 'bg-surface-variant text-on-surface-variant';
    }
  };

  const getChannelIcon = (ch: string) => {
    if (ch === 'whatsapp') return 'forum';
    if (ch === 'email') return 'mail';
    if (ch === 'sms') return 'sms';
    return 'chat';
  };

  return (
    <div className="mb-lg border-l-[3px] border-l-primary pl-md relative">
      <div className="flex items-center justify-between mb-sm">
        <div>
          <h2 className="font-bold text-on-surface text-[18px] flex items-center gap-2">
            <span className="text-primary">✦</span> Autopilot Suggestions
          </h2>
          <p className="text-[#8B8FA8] text-body-sm">AI-detected opportunities in your shopper base</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isLoading || forceRefresh}
          className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined ${(isLoading || forceRefresh) ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </div>

      <div className="flex gap-md overflow-x-auto pb-sm custom-scrollbar relative mask-edges">
        {(isLoading || forceRefresh || !data?.suggestions) ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="min-w-[320px] bg-[#16181C] border border-[#2A2D35] rounded-xl p-5 shrink-0 animate-pulse">
                <div className="w-20 h-5 bg-surface-variant rounded-full mb-3"></div>
                <div className="w-full h-10 bg-surface-variant rounded mb-3"></div>
                <div className="w-32 h-6 bg-surface-variant rounded mb-4"></div>
                <div className="w-full h-px bg-[#2A2D35] mb-4"></div>
                <div className="w-full h-16 bg-surface-variant rounded mb-4"></div>
                <div className="flex gap-2">
                  <div className="w-1/2 h-10 bg-surface-variant rounded"></div>
                  <div className="w-1/2 h-10 bg-surface-variant rounded"></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          data.suggestions.map((sugg: Suggestion, idx: number) => (
            <div key={idx} className="min-w-[320px] max-w-[320px] bg-[#16181C] border border-[#2A2D35] rounded-xl p-5 shrink-0 flex flex-col">
              <div className="mb-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getBadgeColors(sugg.opportunityType)}`}>
                  {sugg.opportunityType}
                </span>
              </div>
              
              <h3 className="font-bold text-[15px] text-white leading-tight mb-2 line-clamp-2 h-10">
                {sugg.insightHeadline}
              </h3>
              
              <div className="mb-4">
                <p className="text-[22px] font-bold text-success leading-none">{sugg.opportunityValue}</p>
                <p className="text-[12px] text-on-surface-variant mt-1">{sugg.opportunityValueSubtext}</p>
              </div>
              
              <div className="w-full h-px bg-[#2A2D35] mb-4"></div>
              
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">group</span>
                  <span className="text-[13px] text-on-surface-variant line-clamp-1">{sugg.segmentName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-secondary">{getChannelIcon(sugg.channel)}</span>
                  <span className="text-[13px] text-on-surface-variant capitalize">{sugg.channel}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">chat</span>
                  <span className="text-[13px] text-on-surface-variant line-clamp-2 leading-tight">"{sugg.messagePreview}"</span>
                </div>
              </div>
              
              <div className="mt-auto flex gap-2">
                <button 
                  onClick={() => handleLaunch(sugg)}
                  disabled={launching}
                  className="flex-1 bg-primary text-white text-[13px] font-bold py-2 rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50"
                >
                  ✦ Launch Campaign
                </button>
                <button 
                  onClick={() => setSelectedSuggestion(sugg)}
                  className="flex-1 border border-[#2A2D35] text-on-surface text-[13px] font-bold py-2 rounded-lg hover:bg-surface-container transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Slide-over Panel */}
      {selectedSuggestion && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-[400px] h-full bg-surface-container glass-card border-l border-outline-variant/50 p-xl flex flex-col animate-in slide-in-from-right-8 shadow-2xl overflow-y-auto relative">
            <button 
              onClick={() => setSelectedSuggestion(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="mb-lg pr-8">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-xs inline-block ${getBadgeColors(selectedSuggestion.opportunityType)}`}>
                {selectedSuggestion.opportunityType}
              </span>
              <h2 className="text-headline-md font-bold text-white leading-tight">
                {selectedSuggestion.insightHeadline}
              </h2>
            </div>

            <div className="bg-[#16181C] border border-[#2A2D35] rounded-xl p-md mb-lg">
              <p className="text-[22px] font-bold text-success leading-none mb-1">{selectedSuggestion.opportunityValue}</p>
              <p className="text-body-sm text-on-surface-variant">{selectedSuggestion.opportunityValueSubtext}</p>
            </div>

            <div className="mb-lg">
              <h4 className="text-label-md font-bold text-outline uppercase tracking-wider mb-xs flex items-center gap-2">
                <span className="text-primary">✦</span> AI Reasoning
              </h4>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                {selectedSuggestion.fullReasoning}
              </p>
            </div>

            <div className="mb-lg">
              <h4 className="text-label-md font-bold text-outline uppercase tracking-wider mb-xs flex items-center justify-between">
                <span>Message Draft ({selectedSuggestion.channel})</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(selectedSuggestion.fullMessageCopy);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-primary hover:text-primary-container text-xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </h4>
              <div className="bg-background border border-outline-variant/30 rounded-lg p-sm font-data-tabular text-sm text-on-surface leading-relaxed">
                {selectedSuggestion.fullMessageCopy}
              </div>
            </div>

            <div className="mb-xl flex gap-md">
              <div className="flex-1 bg-surface-container-high rounded-lg p-sm border border-outline-variant/30">
                <p className="text-xs text-on-surface-variant mb-1">Est. Open Rate</p>
                <p className="font-bold text-white text-lg">{selectedSuggestion.estimatedOpenRateMin}%–{selectedSuggestion.estimatedOpenRateMax}%</p>
              </div>
              <div className="flex-1 bg-surface-container-high rounded-lg p-sm border border-outline-variant/30">
                <p className="text-xs text-on-surface-variant mb-1">AI Confidence</p>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${selectedSuggestion.confidence === 'High' ? 'bg-success' : selectedSuggestion.confidence === 'Medium' ? 'bg-warning' : 'bg-error'}`}></span>
                  <p className="font-bold text-white text-lg">{selectedSuggestion.confidence}</p>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <p className="text-xs text-on-surface-variant mb-sm text-center">{selectedSuggestion.confidenceReason}</p>
              <button 
                onClick={() => handleLaunch(selectedSuggestion)}
                disabled={launching}
                className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50 text-lg flex items-center justify-center gap-2"
              >
                {launching ? <span className="material-symbols-outlined animate-spin">refresh</span> : '✦'}
                Launch Campaign
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .mask-edges {
          -webkit-mask-image: linear-gradient(to right, transparent, black 2%, black 98%, transparent);
          mask-image: linear-gradient(to right, transparent, black 2%, black 98%, transparent);
        }
      `}} />
    </div>
  );
}
