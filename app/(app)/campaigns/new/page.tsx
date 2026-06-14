'use client';
import { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CampaignBuilder() {
  const router = useRouter();
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('sms');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDrafts, setAiDrafts] = useState<string[]>([]);
  const [aiContext, setAiContext] = useState('');
  const [tokenValues, setTokenValues] = useState<Record<string, string>>({
    '{first_name}': 'Priya',
    '{last_order_id}': '#XR-9921',
    '{loyalty_tier}': 'Gold',
    '{discount_code}': 'SAVE20'
  });
  const aiPreviewRef = useRef<HTMLDivElement>(null);

  const { data: dbSegments } = useSWR('/api/segments', fetcher);
  const { data: productsData, mutate: mutateProducts } = useSWR('/api/products', fetcher);

  const [selectedSegmentId, setSelectedSegmentId] = useState('');
  
  // Update selection on load
  useEffect(() => {
    if (dbSegments?.segments?.length > 0 && !selectedSegmentId) {
      setSelectedSegmentId(dbSegments.segments[0].id);
    } else if (dbSegments && dbSegments.segments?.length === 0 && !selectedSegmentId) {
      setSelectedSegmentId('mock-1');
    }
  }, [dbSegments, selectedSegmentId]);

  const selectedSegmentData = dbSegments?.segments?.find((s: any) => s.id === selectedSegmentId);

  const mockSegmentData: Record<string, any> = {
    'mock-1': { customerCount: '12,402', reachability: '98.4%', ltv: '1,05,000' },
    'mock-2': { customerCount: '3,840', reachability: '99.1%', ltv: '1,45,200' },
    'mock-3': { customerCount: '24,105', reachability: '82.5%', ltv: '42,000' },
    'mock-4': { customerCount: '850', reachability: '100%', ltv: '3,20,000' }
  };

  let displayCount = '-';
  let displayReach = '-';
  let displayLtv = '-';

  if (selectedSegmentData) {
    displayCount = selectedSegmentData.customerCount?.toLocaleString() || '0';
    displayReach = '95.2%'; // Placeholder for real segments
    displayLtv = '45,000'; // Placeholder for real segments
  } else if (mockSegmentData[selectedSegmentId]) {
    displayCount = mockSegmentData[selectedSegmentId].customerCount;
    displayReach = mockSegmentData[selectedSegmentId].reachability;
    displayLtv = mockSegmentData[selectedSegmentId].ltv;
  }

  useEffect(() => {
    if (dbSegments?.segments?.length > 0 && selectedSegmentId) {
      const matchByName = dbSegments.segments.find((s: any) => s.name.toLowerCase() === selectedSegmentId.toLowerCase());
      if (matchByName && matchByName.id !== selectedSegmentId) {
        setSelectedSegmentId(matchByName.id);
      }
    }
  }, [dbSegments, selectedSegmentId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiPreviewRef.current && !aiPreviewRef.current.contains(event.target as Node)) {
        const btn = document.getElementById('ai-generate-btn');
        if (btn && !btn.contains(event.target as Node)) {
          setShowAIPreview(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerateAI = async () => {
    setShowAIPreview(true);
    setIsGenerating(true);
    try {
      let prompt = `Draft exactly 3 distinct marketing message options for a campaign sent via ${selectedChannel}. Return ONLY a valid JSON array of strings, like ["Option 1", "Option 2", "Option 3"]. Do not include any other text, markdown block markers, or explanations.`;
      if (selectedProduct) {
        prompt += ` Specifically promote this product: ${selectedProduct.name} at ₹${selectedProduct.price}. Make it enticing. Include the product name and price in the message.`;
      }
      if (aiContext.trim()) {
        prompt += ` strictly follow these personalization instructions: ${aiContext.trim()}`;
      }
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      const data = await res.json();
      try {
        const rawContent = data.content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(rawContent);
        if (Array.isArray(parsed)) {
          setAiDrafts(parsed);
        } else {
          setAiDrafts([data.content]);
        }
      } catch (err) {
        setAiDrafts([data.content]);
      }
    } catch (e) {
      setAiDrafts(["Error generating message."]);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyAIDraft = (draft: string) => {
    setMessage(draft);
    setShowAIPreview(false);
  };

  const handleCreateProduct = async () => {
    if (!newProductName || !newProductPrice) return;
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProductName, price: newProductPrice, category: 'General' })
    });
    mutateProducts();
    setShowProductModal(false);
    setNewProductName('');
    setNewProductPrice('');
  };

  const insertToken = (token: string) => {
    setMessage(prev => prev + token);
  };

  const handleLaunchCampaign = async () => {
    if (!message.trim() || !selectedSegmentId) return;
    
    const segmentName = dbSegments?.segments?.find((s: any) => s.id === selectedSegmentId)?.name || 'Custom Audience';
    const campaignName = `${segmentName} - ${selectedChannel.toUpperCase()} Push`;

    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: campaignName,
        segmentId: selectedSegmentId,
        channel: selectedChannel,
        messageTemplate: message,
        status: 'sending'
      })
    });
    router.push('/dashboard');
  };

  const tokensInMessage = Array.from(new Set(message.match(/\{[^}]+\}/g) || []));
  let previewMessage = message;
  tokensInMessage.forEach(token => {
    // Escape regex characters in token
    const safeToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    previewMessage = previewMessage.replace(new RegExp(safeToken, 'g'), tokenValues[token] || token);
  });

  return (
    <div className="pt-8 pb-32 px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto w-full">
      {/* Wizard Header & Steps */}
      <div className="mb-xl">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Campaign Builder</h2>
            <p className="text-on-surface-variant mt-xs">Orchestrate your high-velocity outreach strategy.</p>
          </div>
          <span className="font-data-tabular text-data-tabular bg-surface-container px-sm py-xs rounded border border-outline-variant text-tertiary">ID: XR-9942</span>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-md">
          <div className="flex flex-col items-center gap-xs">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-on-primary font-bold shadow-[0_0_15px_rgba(202,190,255,0.4)]">1</div>
            <span className="text-label-xs text-primary">TARGET</span>
          </div>
          <div className="step-connector active"></div>
          <div className="flex flex-col items-center gap-xs opacity-60">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container border border-outline-variant text-on-surface-variant font-bold">2</div>
            <span className="text-label-xs">CHANNEL</span>
          </div>
          <div className="step-connector"></div>
          <div className="flex flex-col items-center gap-xs opacity-60">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container border border-outline-variant text-on-surface-variant font-bold">3</div>
            <span className="text-label-xs">CREATIVE</span>
          </div>
          <div className="step-connector"></div>
          <div className="flex flex-col items-center gap-xs opacity-60">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container border border-outline-variant text-on-surface-variant font-bold">4</div>
            <span className="text-label-xs">DEPLOY</span>
          </div>
        </div>
      </div>

      {/* Wizard Stages Container */}
      <div className="space-y-xl">
        {/* Step 1: Segment Selection */}
        <section className="glass-card rounded-xl p-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-primary">person_search</span>
            <h3 className="font-headline-md text-headline-md">1. Select Target Segment</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-lg">
            <div className="space-y-md">
              <label className="text-label-xs text-on-surface-variant block tracking-wider font-bold">SEGMENT REPOSITORY</label>
              <div className="relative">
                <select 
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-md text-on-surface appearance-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                  value={selectedSegmentId}
                  onChange={(e) => setSelectedSegmentId(e.target.value)}
                >
                  <option value="" disabled>Select an audience segment...</option>
                  {dbSegments?.segments?.map((seg: any) => (
                    <option key={seg.id} value={seg.id}>{seg.name}</option>
                  ))}
                  {(!dbSegments || dbSegments.segments?.length === 0) && (
                    <>
                      <option value="mock-1">High-Value Reactivation (Q4)</option>
                      <option value="mock-2">Early Adopters - Tier 1</option>
                      <option value="mock-3">Dormant Leads {'>'} 90 Days</option>
                      <option value="mock-4">VIP Beta Testers</option>
                    </>
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
              <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant/30 flex items-center gap-md">
                <span className="material-symbols-outlined text-tertiary">verified_user</span>
                <div>
                  <p className="text-label-xs font-bold text-on-surface tracking-wider">AI RECOMMENDATION</p>
                  <p className="text-xs text-on-surface-variant mt-1">"High-Value Reactivation" shows 22% higher conversion potential today.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-surface-container-high rounded-xl p-md border border-outline-variant/40 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-label-xs text-on-surface-variant mb-md font-bold tracking-wider">SEGMENT SUMMARY</p>
                <div className="space-y-sm">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Audience Size</span>
                    <span className="font-data-tabular text-on-surface">{displayCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Reachability</span>
                    <span className="font-data-tabular text-tertiary">{displayReach}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Avg. LTV</span>
                    <span className="font-data-tabular text-on-surface">₹{displayLtv}</span>
                  </div>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12">
                <span className="material-symbols-outlined text-[120px]">groups</span>
              </div>
            </div>
          </div>
        </section>

        {/* Step 2: Channel Grid */}
        <section className="glass-card rounded-xl p-lg border-l-4 border-l-primary/30">
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-primary">hub</span>
            <h3 className="font-headline-md text-headline-md">2. Distribution Channels</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
            {/* WhatsApp */}
            <div onClick={() => setSelectedChannel('whatsapp')} className={`group cursor-pointer ${selectedChannel === 'whatsapp' ? 'bg-surface-container-high border-2 border-primary' : 'bg-surface-container border border-outline-variant'} rounded-xl p-md hover:border-primary transition-all active:scale-[0.98] relative`}>
              <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#25D366]">chat</span>
              </div>
              <p className="font-bold">WhatsApp</p>
              <p className="text-xs text-on-surface-variant mt-xs">High Open Rate</p>
              {selectedChannel === 'whatsapp' && (
                <div className="absolute top-2 right-2">
                  <span className="material-symbols-outlined text-primary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                </div>
              )}
            </div>
            
            {/* SMS */}
            <div onClick={() => setSelectedChannel('sms')} className={`group cursor-pointer ${selectedChannel === 'sms' ? 'bg-surface-container-high border-2 border-primary' : 'bg-surface-container border border-outline-variant'} rounded-xl p-md transition-all active:scale-[0.98] relative hover:border-primary`}>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary">sms</span>
              </div>
              <p className="font-bold">SMS</p>
              <p className="text-xs text-on-surface-variant mt-xs">Instant Delivery</p>
              {selectedChannel === 'sms' && (
                <div className="absolute top-2 right-2">
                  <span className="material-symbols-outlined text-primary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                </div>
              )}
            </div>
            
            {/* Email */}
            <div onClick={() => setSelectedChannel('email')} className={`group cursor-pointer ${selectedChannel === 'email' ? 'bg-surface-container-high border-2 border-primary' : 'bg-surface-container border border-outline-variant'} rounded-xl p-md hover:border-primary transition-all active:scale-[0.98] relative`}>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-blue-500">mail</span>
              </div>
              <p className="font-bold">Email</p>
              <p className="text-xs text-on-surface-variant mt-xs">Rich Content</p>
              {selectedChannel === 'email' && (
                <div className="absolute top-2 right-2">
                  <span className="material-symbols-outlined text-primary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                </div>
              )}
            </div>
            
            {/* RCS */}
            <div onClick={() => setSelectedChannel('rcs')} className={`group cursor-pointer ${selectedChannel === 'rcs' ? 'bg-surface-container-high border-2 border-primary' : 'bg-surface-container border border-outline-variant'} rounded-xl p-md hover:border-primary transition-all active:scale-[0.98] relative`}>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-amber-500">interactive_space</span>
              </div>
              <p className="font-bold">RCS Business</p>
              <p className="text-xs text-on-surface-variant mt-xs">Next-Gen Messaging</p>
              {selectedChannel === 'rcs' && (
                <div className="absolute top-2 right-2">
                  <span className="material-symbols-outlined text-primary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Step 3: Creative AI Composer */}
        <section className="glass-card rounded-xl p-lg">
          <div className="flex items-center justify-between mb-lg">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">auto_fix_high</span>
              <h3 className="font-headline-md text-headline-md">3. Compose Creative</h3>
            </div>
            <button id="ai-generate-btn" onClick={handleGenerateAI} className="flex items-center gap-xs bg-primary text-on-primary px-md py-xs rounded-full text-label-xs font-bold hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-sm">bolt</span> ✦ Generate with AI
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-lg items-start">
            {/* Editor Column */}
            <div className="flex-1 w-full">
              <div className="mb-lg">
            <label className="text-label-xs text-on-surface-variant block tracking-wider font-bold mb-xs">PROMOTE A PRODUCT (OPTIONAL)</label>
            <div className="flex flex-col sm:flex-row gap-sm items-start sm:items-center">
              <select 
                className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg p-sm text-on-surface focus:ring-2 focus:ring-primary/50"
                value={selectedProduct?.id || ''}
                onChange={e => {
                  const p = productsData?.products?.find((p: any) => p.id === e.target.value);
                  setSelectedProduct(p || null);
                }}
              >
                <option value="">-- Select Product --</option>
                {productsData?.products?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                ))}
              </select>
              <button onClick={() => setShowProductModal(true)} className="px-md py-sm rounded-lg bg-surface-variant text-on-surface text-label-xs font-bold flex items-center gap-xs hover:bg-surface-container-high transition-colors whitespace-nowrap">
                <span className="material-symbols-outlined text-sm">add</span> New Product
              </button>
            </div>
            {selectedProduct && (
              <div className="mt-sm flex gap-sm items-center">
                <span className="px-sm py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px]">sell</span>
                  {selectedProduct.name} (₹{selectedProduct.price})
                </span>
                <button onClick={() => setSelectedProduct(null)} className="text-on-surface-variant hover:text-error text-xs underline">Clear</button>
              </div>
            )}
          </div>

          <div className="mb-lg">
            <label className="text-label-xs text-on-surface-variant block tracking-wider font-bold mb-xs flex items-center gap-xs">
              <span className="material-symbols-outlined text-sm text-primary">tune</span> 
              AI PERSONALIZATION INSTRUCTIONS (OPTIONAL)
            </label>
            <input 
              type="text" 
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-sm text-on-surface focus:ring-2 focus:ring-primary/50 text-sm" 
              placeholder="e.g. Keep it strictly formal, mention our upcoming Diwali sale..."
              value={aiContext}
              onChange={e => setAiContext(e.target.value)}
            />
          </div>
          
          <div className="relative w-full min-h-[160px]">
            {!showAIPreview && (
              <textarea 
                id="message-composer" 
                className="w-full h-40 bg-surface-container-lowest border border-outline-variant rounded-xl p-lg text-on-surface focus:ring-2 focus:ring-primary/50 resize-none font-body-md" 
                placeholder="Type your message here... Use {first_name} or {last_purchase} for dynamic tokens."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            )}
            
            {/* AI Preview Overlay */}
            {showAIPreview && (
              <div id="ai-preview" ref={aiPreviewRef} className="w-full bg-surface-container-lowest/95 backdrop-blur-md border border-primary/50 rounded-xl p-lg flex flex-col items-start shadow-xl animate-in zoom-in-95 duration-200">
                {isGenerating ? (
                  <div className="flex items-center gap-sm text-on-surface-variant py-xl w-full justify-center">
                    <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
                    <span className="text-label-sm font-bold tracking-widest uppercase">Generating Drafts...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between w-full mb-md">
                      <div className="flex items-center gap-sm text-primary">
                        <span className="material-symbols-outlined">auto_awesome</span>
                        <span className="text-label-xs font-bold tracking-widest uppercase">Select an Option</span>
                      </div>
                      <div className="flex gap-sm">
                        <button onClick={() => setShowAIPreview(false)} className="flex items-center gap-xs text-on-surface-variant text-label-xs hover:text-error transition-colors px-sm py-xs">
                          <span className="material-symbols-outlined text-[16px]">close</span> Cancel
                        </button>
                        <button onClick={handleGenerateAI} className="flex items-center gap-xs bg-surface-container-high text-on-surface text-label-xs hover:text-primary transition-colors px-sm py-xs rounded">
                          <span className="material-symbols-outlined text-[16px]">refresh</span> Regenerate
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-sm w-full">
                      {aiDrafts.map((draft, idx) => (
                        <div 
                          key={idx}
                          onClick={() => applyAIDraft(draft)}
                          className="w-full bg-surface border border-outline-variant hover:border-primary/50 hover:bg-surface-container-high rounded-xl p-md cursor-pointer transition-all active:scale-[0.99] group animate-in fade-in slide-in-from-right-4"
                          style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}
                        >
                          <p className="whitespace-pre-wrap font-data-tabular text-on-surface text-sm leading-relaxed">
                            {draft}
                          </p>
                          <div className="mt-sm flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-primary text-xs font-bold flex items-center gap-1">
                              Use this draft <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-sm mt-md">
            <button type="button" onClick={() => insertToken('{first_name}')} className="px-sm py-1 bg-surface-container-high border border-outline-variant rounded text-label-xs text-on-surface cursor-pointer hover:bg-primary/20 transition-colors">{'{first_name}'}</button>
                <button type="button" onClick={() => insertToken('{last_order_id}')} className="px-sm py-1 bg-surface-container-high border border-outline-variant rounded text-label-xs text-on-surface cursor-pointer hover:bg-primary/20 transition-colors">{'{last_order_id}'}</button>
                <button type="button" onClick={() => insertToken('{loyalty_tier}')} className="px-sm py-1 bg-surface-container-high border border-outline-variant rounded text-label-xs text-on-surface cursor-pointer hover:bg-primary/20 transition-colors">{'{loyalty_tier}'}</button>
                <button type="button" onClick={() => insertToken('{discount_code}')} className="px-sm py-1 bg-surface-container-high border border-outline-variant rounded text-label-xs text-on-surface cursor-pointer hover:bg-primary/20 transition-colors">{'{discount_code}'}</button>
              </div>
            </div>

            {/* Preview Simulator Column */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-md">
              <div className="bg-surface-container border border-outline-variant rounded-2xl shadow-lg overflow-hidden flex flex-col">
                <div className="bg-surface-container-high px-md py-sm flex items-center justify-center border-b border-outline-variant/30">
                  <span className="text-xs text-on-surface font-bold">Preview: {selectedChannel.toUpperCase()}</span>
                </div>
                <div className="p-md bg-[#e5ddd5] dark:bg-[#0b141a] h-64 overflow-y-auto">
                  {previewMessage ? (
                    <div className="bg-white dark:bg-[#202c33] text-black dark:text-white p-sm rounded-lg rounded-tr-none text-sm max-w-[85%] self-end ml-auto shadow-sm whitespace-pre-wrap relative pb-6">
                      {previewMessage}
                      {selectedProduct && selectedChannel === 'whatsapp' && (
                        <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2 flex flex-col gap-1">
                          <span className="text-xs font-bold">{selectedProduct.name}</span>
                          <span className="text-xs text-gray-500">₹{selectedProduct.price}</span>
                        </div>
                      )}
                      <span className="text-[10px] text-gray-400 absolute bottom-1 right-2">Now</span>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-gray-500 mt-8">Message preview will appear here</div>
                  )}
                </div>
              </div>
              
              {tokensInMessage.length > 0 && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-label-xs font-bold text-on-surface-variant mb-sm tracking-widest uppercase flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px] text-primary">data_object</span>
                    Mock Token Values
                  </h4>
                  <div className="space-y-xs">
                    {tokensInMessage.map(token => (
                      <div key={token} className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-primary">{token}</label>
                        <input 
                          type="text" 
                          className="bg-surface-container border border-outline-variant rounded p-1 text-xs text-on-surface focus:ring-1 focus:ring-primary w-full"
                          value={tokenValues[token] || ''}
                          onChange={e => setTokenValues(prev => ({ ...prev, [token]: e.target.value }))}
                          placeholder={`Enter value for ${token}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Step 4: Final Summary & Launch */}
        <section className="glass-card rounded-xl p-lg border-2 border-tertiary/20 bg-tertiary/5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-lg">
            <div className="flex gap-lg">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-outline-variant shrink-0">
                <div className="w-full h-full bg-tertiary/20 flex items-center justify-center text-tertiary font-bold text-headline-sm">C</div>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md">Final Review</h3>
                <p className="text-on-surface-variant">Campaign is ready for immediate deployment.</p>
                <div className="flex gap-md mt-sm">
                  <span className="text-label-xs flex items-center gap-xs text-primary"><span className="material-symbols-outlined text-sm">groups</span> 12.4k targets</span>
                  <span className="text-label-xs flex items-center gap-xs text-tertiary"><span className="material-symbols-outlined text-sm">sms</span> SMS Protocol</span>
                </div>
              </div>
            </div>
            
            <button onClick={handleLaunchCampaign} disabled={!message.trim()} className="w-full md:w-auto bg-tertiary-container/30 backdrop-blur-xl border border-tertiary text-tertiary px-xl py-md rounded-xl font-bold flex items-center justify-center gap-md hover:bg-tertiary-container hover:text-on-tertiary transition-all duration-300 shadow-[0_0_20px_rgba(74,225,118,0.2)] group shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
              Send Now 
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>
            </button>
          </div>
        </section>
      </div>

      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-md">
          <div className="bg-surface border border-outline-variant rounded-xl p-lg w-full max-w-sm">
            <h3 className="font-headline-md text-on-surface mb-md">Create Product</h3>
            <div className="space-y-md mb-lg">
              <div>
                <label className="text-xs font-bold tracking-wider text-on-surface-variant mb-xs block">PRODUCT NAME</label>
                <input 
                  type="text" 
                  value={newProductName} 
                  onChange={e => setNewProductName(e.target.value)} 
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-sm text-on-surface focus:ring-primary/50" 
                  placeholder="e.g. Silk Scarf"
                />
              </div>
              <div>
                <label className="text-xs font-bold tracking-wider text-on-surface-variant mb-xs block">PRICE (₹)</label>
                <input 
                  type="number" 
                  value={newProductPrice} 
                  onChange={e => setNewProductPrice(e.target.value)} 
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-sm text-on-surface focus:ring-primary/50" 
                  placeholder="e.g. 1999"
                />
              </div>
            </div>
            <div className="flex justify-end gap-sm">
              <button onClick={() => setShowProductModal(false)} className="px-md py-sm text-on-surface-variant hover:text-on-surface text-label-xs font-bold">Cancel</button>
              <button onClick={handleCreateProduct} className="bg-primary text-on-primary px-md py-sm rounded-lg text-label-xs font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors">Save Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}