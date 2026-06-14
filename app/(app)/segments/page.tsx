'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useAppStore } from '@/store';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SegmentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<any>(null);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);

  const { addNotification } = useAppStore();
  const { data: dbSegments, mutate } = useSWR('/api/segments', fetcher);
  const { data: customers } = useSWR('/api/customers', fetcher);
  const { data: recommendationsData, isLoading: recLoading } = useSWR('/api/segments/recommendations', fetcher, { revalidateOnFocus: false });
  const recommendations = recommendationsData?.recommendations || [];

  const filterToSql = (filterDef: any) => {
    if (!filterDef || Object.keys(filterDef).length === 0) {
      return 'SELECT * FROM customers;';
    }

    const buildCondition = (cond: any): string => {
      if (cond.operator === 'AND' || cond.operator === 'OR') {
        if (!cond.conditions || cond.conditions.length === 0) return '1=1';
        return `(${cond.conditions.map(buildCondition).join(` ${cond.operator}\n    `)})`;
      }
      const val = typeof cond.value === 'string' && !cond.value.toUpperCase().includes('NOW()') 
        ? `'${cond.value}'` 
        : cond.value;
      return `${cond.field} ${cond.operator} ${val}`;
    };

    const whereStr = buildCondition(filterDef);
    return `SELECT\n  id,\n  name,\n  email,\n  phone,\n  tier\nFROM customers\nWHERE\n  ${whereStr};`;
  };

  const handleDeleteSegment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this segment?')) return;
    try {
      await fetch(`/api/segments/${id}`, { method: 'DELETE' });
      mutate();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePreview = (segInput: any) => {
    let segObj = typeof segInput === 'string' 
      ? dbSegments?.segments?.find((s: any) => s.name === segInput) 
      : segInput;
    
    if (!segObj && typeof segInput === 'string') {
      segObj = { name: segInput, filterJson: {} };
    }

    setSelectedSegment(segObj);
    setShowSql(false);
    setCopiedSql(false);
    setShowPreview(true);
  };

  const handleBuildSegment = async (queryOverride?: string) => {
    const finalQuery = queryOverride || search;
    if (!finalQuery.trim() || isBuilding) return;
    
    setIsBuilding(true);
    if (queryOverride) setSearch(queryOverride); // Update input box for visual feedback

    try {
      // 1. Generate SQL and Metadata via AI
      const aiRes = await fetch('/api/ai/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: finalQuery })
      });
      const aiData = await aiRes.json();
      
      if (!aiData.segmentName) throw new Error('AI Generation failed');

      // 2. Save the segment to the database
      const saveRes = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: aiData.segmentName,
          naturalLanguageQuery: finalQuery,
          filterJson: aiData.filterJson || {},
          sqlWhere: aiData.sqlWhere,
          confidence: aiData.confidence,
        })
      });

      const saveData = await saveRes.json();
      
      if (!saveRes.ok || saveData.error) {
        alert(saveData.error || 'Failed to build segment. Please try a different query.');
        return;
      }

      // 3. Refresh segments and clear search
      mutate();
      
      const { addNotification, addAuditLog } = useAppStore.getState();
      addNotification({
        title: 'Segment Created',
        message: `Your new segment "${aiData.segmentName}" is ready.`
      });
      addAuditLog({ action: 'Segment Created', details: aiData.segmentName });

      setSearch('');
      // Optionally trigger the preview modal with the newly generated segment
      handlePreview(saveData);
    } catch (error) {
      console.error('Failed to build segment:', error);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <>
      <div className="pt-8 pb-32 px-margin-mobile md:px-margin-desktop max-w-[1600px] w-full">
        {/* Header */}
        <section className="mb-xl">
          <h1 className="font-display-lg text-display-lg text-on-surface mb-xs">Segments</h1>
          <p className="text-on-surface-variant font-body-md">Define your audience. Let AI do the heavy lifting.</p>
        </section>

        {dbSegments?.hasData === false ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center mb-lg">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-50">group_off</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">No Segments Yet</h3>
            <p className="text-body-md text-on-surface-variant max-w-md mb-xl">
              You haven't imported any data yet, so you can't build segments. To get started, either import your shoppers or generate mock data.
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
            {/* AI Builder Bar */}
            <section className="mb-xl">
              <div className="glass-card p-lg rounded-xl relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/10 rounded-full blur-[100px]"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-md items-center">
                  <div className="flex-1 flex items-center gap-md bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-md py-sm w-full focus-within:border-primary transition-colors">
                    <span className="material-symbols-outlined text-primary-container">auto_awesome</span>
                    <input 
                      id="segmentSearchInput"
                      className="bg-transparent border-none focus:ring-0 text-body-md w-full text-on-surface placeholder:text-outline" 
                      placeholder="e.g., 'Find loyal customers in Mumbai who haven't shopped in 2 months'" 
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => handleBuildSegment()}
                    disabled={isBuilding || !search.trim()}
                    className="w-full md:w-auto px-xl py-sm bg-primary text-on-primary font-bold rounded-lg transition-all shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-sm"
                  >
                    {isBuilding ? (
                      <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Building...</>
                    ) : (
                      <>Build Segment</>
                    )}
                  </button>
                </div>
                <div className="mt-md flex flex-wrap gap-sm">
                  <span className="text-label-xs font-label-xs text-on-surface-variant uppercase tracking-wider self-center mr-sm">From Your Data:</span>
                  {recommendations.map((rec: string, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={() => setSearch(rec)} 
                      className="px-md py-xs bg-surface-container-high hover:bg-outline-variant text-on-surface border border-outline-variant/30 rounded-full text-label-xs transition-colors"
                    >
                      "{rec}"
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* AI Recommendations Carousel */}
            <section className="mb-xl">
              <div className="flex items-center justify-between mb-md">
                <h3 className="font-headline-md text-headline-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-tertiary">rocket_launch</span>
                  AI Recommended Segments
                </h3>
                <div className="flex gap-xs">
                  <button onClick={() => document.getElementById('ai-carousel')?.scrollBy({ left: -320, behavior: 'smooth' })} className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors"><span className="material-symbols-outlined">chevron_left</span></button>
                  <button onClick={() => document.getElementById('ai-carousel')?.scrollBy({ left: 320, behavior: 'smooth' })} className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
              </div>
              
              <div id="ai-carousel" className="flex gap-md overflow-x-auto no-scrollbar snap-x snap-mandatory pb-sm">
                {recLoading ? (
                  [1, 2, 3].map((_, idx) => (
                    <div key={idx} className="min-w-[300px] flex-shrink-0 snap-start glass-card rounded-xl overflow-hidden group flex flex-col justify-between animate-pulse">
                      <div>
                        <div className="h-1.5 bg-outline-variant/30"></div>
                        <div className="p-lg pb-0">
                          <div className="flex justify-between items-start mb-md">
                            <div className="w-8 h-8 bg-outline-variant/30 rounded-lg"></div>
                            <div className="w-20 h-5 bg-outline-variant/30 rounded"></div>
                          </div>
                          <div className="h-6 w-3/4 bg-outline-variant/30 rounded mb-xs"></div>
                          <div className="h-4 w-full bg-outline-variant/30 rounded mb-xs"></div>
                          <div className="h-4 w-5/6 bg-outline-variant/30 rounded mb-xl"></div>
                        </div>
                      </div>
                      <div className="p-lg pt-0">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="w-16 h-3 bg-outline-variant/30 rounded mb-1"></div>
                            <div className="w-24 h-4 bg-outline-variant/30 rounded"></div>
                          </div>
                          <div className="w-16 h-4 bg-outline-variant/30 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  recommendations.map((rec: string, idx: number) => {
                    const icons = ['trending_up', 'celebration', 'devices', 'star', 'local_fire_department'];
                    const themes = [
                      { from: 'from-primary', to: 'to-primary-container', iconColor: 'text-primary', bg: 'bg-primary/10', labelColor: 'text-tertiary', labelBg: 'bg-tertiary/10', labelBorder: 'border-tertiary/20', label: 'HIGH IMPACT' },
                      { from: 'from-tertiary', to: 'to-primary', iconColor: 'text-tertiary', bg: 'bg-tertiary/10', labelColor: 'text-primary', labelBg: 'bg-primary/10', labelBorder: 'border-primary/20', label: 'OPPORTUNITY' },
                      { from: 'from-primary-container', to: 'to-secondary', iconColor: 'text-secondary', bg: 'bg-secondary/10', labelColor: 'text-secondary-fixed', labelBg: 'bg-secondary/10', labelBorder: 'border-secondary/20', label: 'SPECIFIC' }
                    ];
                    const theme = themes[idx % themes.length];
                    // Generate a deterministic realistic looking size (< 2000) to prevent hydration mismatch
                    const mockSize = 120 + ((rec.length * 17 + idx * 31) % 800);
                    const shortTitle = rec.split(' ').slice(0, 3).join(' ');

                    return (
                      <div key={idx} className="min-w-[300px] flex-shrink-0 snap-start glass-card rounded-xl overflow-hidden group flex flex-col justify-between">
                        <div>
                          <div className={`h-1.5 bg-gradient-to-r ${theme.from} ${theme.to}`}></div>
                          <div className="p-lg pb-0">
                            <div className="flex justify-between items-start mb-md">
                              <span className={`p-sm ${theme.bg} rounded-lg`}><span className={`material-symbols-outlined ${theme.iconColor}`} style={{fontVariationSettings: "'FILL' 1"}}>{icons[idx % icons.length]}</span></span>
                              <span className={`text-label-xs ${theme.labelColor} font-bold ${theme.labelBg} px-sm py-[2px] rounded border ${theme.labelBorder}`}>{theme.label}</span>
                            </div>
                            <h4 className="font-headline-md text-headline-md mb-xs truncate" title={shortTitle}>{shortTitle}</h4>
                            <p className="text-body-md text-on-surface-variant mb-xl h-12 overflow-hidden">{rec}</p>
                          </div>
                        </div>
                        <div className="p-lg pt-0">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-label-xs text-outline uppercase">Est. Size</p>
                              <p className="font-data-tabular text-data-tabular">~{mockSize.toLocaleString()} Users</p>
                            </div>
                            <button onClick={() => handleBuildSegment(rec)} disabled={isBuilding} className="text-primary font-bold text-body-md group-hover:underline flex items-center gap-xs disabled:opacity-50">Create <span className="material-symbols-outlined text-sm">arrow_forward</span></button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* My Segments Table */}
            <section className="mb-xl">
              <div className="flex justify-between items-end mb-md">
                <h3 className="font-headline-md text-headline-md">My Segments</h3>
                <button className="text-body-md font-bold text-primary flex items-center gap-xs">View All <span className="material-symbols-outlined">expand_more</span></button>
              </div>
              <div className="glass-card rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="px-lg py-md text-label-xs text-outline uppercase tracking-wider">Segment Name</th>
                      <th className="px-lg py-md text-label-xs text-outline uppercase tracking-wider">Shopper Count</th>
                      <th className="px-lg py-md text-label-xs text-outline uppercase tracking-wider">Growth</th>
                      <th className="px-lg py-md text-label-xs text-outline uppercase tracking-wider">Last Sync</th>
                      <th className="px-lg py-md text-label-xs text-outline uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {dbSegments?.segments?.map((seg: any) => (
                      <tr key={seg.id} className="hover:bg-surface-container-high transition-colors cursor-pointer" onClick={() => handlePreview(seg)}>
                        <td className="px-lg py-md">
                          <div className="flex items-center gap-sm">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            <span className="font-bold">{seg.name}</span>
                          </div>
                        </td>
                        <td className="px-lg py-md font-data-tabular">{(seg.customerCount || 0).toLocaleString()}</td>
                        <td className="px-lg py-md text-tertiary font-data-tabular">+{(Math.random() * 15).toFixed(1)}%</td>
                        <td className="px-lg py-md text-on-surface-variant">just now</td>
                        <td className="px-lg py-md" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-md">
                            <button onClick={(e) => { e.stopPropagation(); setSearch(seg.naturalLanguageQuery || seg.name); window.scrollTo({ top: 0, behavior: 'smooth' }); document.getElementById('segmentSearchInput')?.focus(); }} title="Edit Segment" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">edit</button>
                            <button onClick={(e) => { 
                              e.stopPropagation(); 
                              try { navigator.clipboard.writeText(`Check out this segment: ${seg.name}\nRules: ${seg.naturalLanguageQuery || 'Custom rules'}`); } catch(err) {}
                              addNotification({ title: 'Shared', message: 'Segment copied to clipboard' });
                              alert(`Segment details for "${seg.name}" copied to clipboard!`);
                            }} title="Share Segment" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">share</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteSegment(seg.id); }} title="Delete Segment" className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors">delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {(!dbSegments || dbSegments.segments?.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-lg py-xl text-center text-on-surface-variant italic">No custom segments created yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Bottom Sheet (Preview) */}
      <div 
        className={`fixed bottom-0 left-0 right-0 md:left-[240px] z-50 transition-transform duration-300 transform ${showPreview ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="bg-surface-container-high rounded-t-3xl border-t border-outline-variant shadow-2xl p-lg pb-12 max-h-[70vh] flex flex-col">
          {/* Close Handle + X button */}
          <div className="flex items-center justify-between mb-sm px-md">
            <div className="w-12 h-1 bg-outline-variant rounded-full mx-auto cursor-pointer flex-1" onClick={() => setShowPreview(false)}></div>
            <button 
              onClick={() => setShowPreview(false)} 
              className="ml-md p-xs rounded-full hover:bg-outline-variant/30 text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Close preview"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-lg px-md gap-sm">
            <div>
              <h3 className="font-headline-md text-headline-md flex items-center gap-sm">
                Preview: {selectedSegment?.name || 'Active Shoppers'}
              </h3>
              <p className="text-body-md text-on-surface-variant">
                Showing a limited preview sample of 20 shoppers
              </p>
            </div>
            <div className="flex gap-sm">
              <button 
                onClick={() => setShowSql(!showSql)}
                className={`px-md py-sm rounded-lg text-body-md font-bold flex items-center gap-xs transition-colors ${showSql ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-container border border-outline-variant hover:bg-outline-variant/30 text-on-surface'}`}
              >
                <span className="material-symbols-outlined text-sm">terminal</span> {showSql ? 'Hide SQL' : 'View SQL'}
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-lg py-sm bg-surface-container-highest border border-outline-variant rounded-lg text-body-md font-bold hover:bg-outline-variant transition-colors text-on-surface"
              >
                Full Analysis
              </button>
            </div>
          </div>

          {showSql && selectedSegment && (
            <div className="mx-md mb-lg">
              <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-outline-variant/30 font-mono text-sm shadow-inner">
                <div className="bg-[#2d2d2d] px-md py-xs flex justify-between items-center border-b border-[#404040]">
                  <span className="text-[#a0a0a0] text-xs">Generated SQL (display only)</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(filterToSql(selectedSegment.filterJson));
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2000);
                    }}
                    className="text-[#a0a0a0] hover:text-white transition-colors flex items-center gap-xs text-xs"
                  >
                    <span className="material-symbols-outlined text-[14px]">{copiedSql ? 'check' : 'content_copy'}</span>
                    {copiedSql ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-md text-[#d4d4d4] overflow-x-auto">
                  <pre><code>{filterToSql(selectedSegment.filterJson)}</code></pre>
                </div>
              </div>
            </div>
          )}
          
          {/* Shopper Table */}
          <div className="overflow-y-auto flex-1 custom-scrollbar rounded-xl border border-outline-variant/30">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-surface-container-low z-10">
                <tr className="border-b border-outline-variant">
                  <th className="px-md py-sm text-label-xs text-outline uppercase tracking-wider w-12">#</th>
                  <th className="px-md py-sm text-label-xs text-outline uppercase tracking-wider">Shopper</th>
                  <th className="px-md py-sm text-label-xs text-outline uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="px-md py-sm text-label-xs text-outline uppercase tracking-wider">Tier</th>
                  <th className="px-md py-sm text-label-xs text-outline uppercase tracking-wider hidden md:table-cell">Channel</th>
                  <th className="px-md py-sm text-label-xs text-outline uppercase tracking-wider hidden lg:table-cell">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {(() => {
                  if (!Array.isArray(customers)) return null;
                  
                  const evaluateFilter = (customer: any, filterDef: any): boolean => {
                    if (!filterDef || Object.keys(filterDef).length === 0) return true;
                    if (filterDef.operator === 'AND' && filterDef.conditions) {
                      return filterDef.conditions.every((c: any) => evaluateFilter(customer, c));
                    }
                    if (filterDef.operator === 'OR' && filterDef.conditions) {
                      return filterDef.conditions.some((c: any) => evaluateFilter(customer, c));
                    }
                    const { field, operator, value } = filterDef;
                    
                    // Map snake_case SQL columns to camelCase JS properties
                    const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                    const camelField = toCamelCase(field || '');
                    const custVal = customer[camelField] !== undefined ? customer[camelField] : customer[field];
                    
                    if (custVal === undefined) return false;
                    
                    if (typeof value === 'string' && value.toUpperCase().includes('NOW()')) return true;
                    
                    const strCust = String(custVal).toLowerCase();
                    const strVal = String(value).toLowerCase();
                    switch (operator) {
                      case '=': return strCust === strVal;
                      case '!=': return strCust !== strVal;
                      case '>': return Number(custVal) > Number(value);
                      case '<': return Number(custVal) < Number(value);
                      case '>=': return Number(custVal) >= Number(value);
                      case '<=': return Number(custVal) <= Number(value);
                      case 'LIKE':
                      case 'ILIKE': return strCust.includes(strVal.replace(/%/g, ''));
                      default: return true;
                    }
                  };

                  const filteredCustomers = customers.filter(c => evaluateFilter(c, selectedSegment?.filterJson));

                  if (filteredCustomers.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="px-md py-xl text-center text-on-surface-variant italic">
                          No shoppers match this segment criteria.
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <>
                      {filteredCustomers.slice(0, 20).map((c: any, idx: number) => {
                        const initials = c.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '??';
                        const tierColors: Record<string, string> = {
                          platinum: 'bg-primary/10 text-primary border-primary/20',
                          gold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                          diamond: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                          regular: 'bg-surface-container-highest text-on-surface-variant border-outline-variant/30',
                        };
                        const avatarColors = ['bg-primary/20 text-primary', 'bg-tertiary/20 text-tertiary', 'bg-secondary/20 text-secondary', 'bg-yellow-500/20 text-yellow-400', 'bg-cyan-500/20 text-cyan-400'];
                        const avatarColor = avatarColors[idx % avatarColors.length];
                        const tierClass = tierColors[c.tier?.toLowerCase()] || tierColors.regular;
                        const channelIcon: Record<string, string> = { whatsapp: 'sms', email: 'mail', sms: 'chat_bubble', rcs: 'forum' };
                        return (
                          <tr key={c.id} className="hover:bg-surface-container-high/20 transition-colors">
                            <td className="px-md py-sm text-on-surface-variant font-mono text-xs">{idx + 1}</td>
                            <td className="px-md py-sm">
                              <div className="flex items-center gap-sm">
                                <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center font-bold text-xs shrink-0`}>{initials}</div>
                                <span className="font-medium text-on-surface truncate max-w-[120px]">{c.name}</span>
                              </div>
                            </td>
                            <td className="px-md py-sm text-on-surface-variant text-xs hidden md:table-cell">{c.email || c.phone || '—'}</td>
                            <td className="px-md py-sm">
                              <span className={`text-[10px] font-bold uppercase border px-sm py-[2px] rounded-full ${tierClass}`}>{c.tier || 'Regular'}</span>
                            </td>
                            <td className="px-md py-sm hidden md:table-cell">
                              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{channelIcon[c.channelPreference] || 'mail'}</span>
                            </td>
                            <td className="px-md py-sm font-mono text-xs text-on-surface-variant hidden lg:table-cell">{c.totalOrders ?? 0}</td>
                          </tr>
                        );
                      })}
                      {filteredCustomers.length > 20 && (
                        <tr>
                          <td colSpan={6} className="p-sm text-center text-label-xs text-on-surface-variant border-t border-outline-variant/30">
                            Showing 20 of {filteredCustomers.length.toLocaleString()} matching shoppers
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })()}
                {!Array.isArray(customers) && (
                  <tr>
                    <td colSpan={6} className="px-md py-xl text-center text-on-surface-variant italic">
                      Loading shoppers...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}