'use client';
import { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CampaignBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addNotification, addAuditLog } = useAppStore();
  
  const initialSegmentId = searchParams?.get('segmentId') || '';
  const initialMessage = searchParams?.get('message') || '';
  const initialChannel = searchParams?.get('channel') || '';

  const [showAIPreview, setShowAIPreview] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [selectedChannel, setSelectedChannel] = useState(initialChannel);
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

  const [selectedSegmentId, setSelectedSegmentId] = useState(initialSegmentId);
  
  // Removed automatic segment selection to wait for user interaction

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

  // Auto-scroll to drafts when they arrive
  useEffect(() => {
    if (aiDrafts.length > 0 && aiPreviewRef.current) {
      setTimeout(() => {
        aiPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [aiDrafts]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setAiDrafts([]);
    setShowAIPreview(true);
    
    // Scroll to loading spinner immediately
    setTimeout(() => {
      aiPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    const segmentName = dbSegments?.segments?.find((s: any) => s.id === selectedSegmentId)?.name || 'Shoppers';
    const productName = selectedProduct ? selectedProduct.name : '';
    const productPrice = selectedProduct ? selectedProduct.price : '';

    try {
      const res = await fetch('/api/ai/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmentName,
          channel: selectedChannel,
          productName,
          productPrice,
          extraContext: aiContext.trim() || null,
        })
      });
      
      const data = await res.json();
      if (res.ok && data.drafts?.length > 0) {
        setAiDrafts(data.drafts);
      } else {
        setAiDrafts(["Error: Could not generate draft. Please try again."]);
      }
    } catch (err) {
      setAiDrafts(["Network error: Failed to connect to Synara AI."]);
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
    const sentences: Record<string, string> = {
      '{first_name}': 'Hey {first_name},',
      '{last_order_id}': 'Here is an update regarding your recent order #{last_order_id}.',
      '{loyalty_tier}': 'Thank you for being a valued {loyalty_tier} member!',
      '{discount_code}': 'Use code {discount_code} at checkout to claim your offer.'
    };
    const textToAdd = sentences[token] || token;
    
    const textarea = document.getElementById('message-composer') as HTMLTextAreaElement;
    
    // Special rule for first_name to act as a greeting at the top
    if (token === '{first_name}') {
      setMessage(prev => {
        if (prev.startsWith(textToAdd)) return prev; // Prevent duplicates
        const prefix = textToAdd + '\n\n';
        return prefix + prev.trimStart();
      });
      setTimeout(() => {
        if (textarea) {
           textarea.focus();
           textarea.setSelectionRange(textToAdd.length + 2, textToAdd.length + 2);
        }
      }, 0);
      return;
    }

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentMessage = message;
      const before = currentMessage.substring(0, start);
      const spaceBefore = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : '';
      const newText = before + spaceBefore + textToAdd + currentMessage.substring(end);
      setMessage(newText);
      
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + spaceBefore.length + textToAdd.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setMessage(prev => {
        const space = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
        return prev + space + textToAdd;
      });
    }
  };

  const handleLaunchCampaign = async () => {
    if (!message.trim() || !selectedSegmentId || !selectedChannel) return;
    
    const segmentName = dbSegments?.segments?.find((s: any) => s.id === selectedSegmentId)?.name || 'Custom Audience';
    const campaignName = `${segmentName} - ${selectedChannel.toUpperCase()} Push`;

    setShowSuccessPopup(true);

    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: campaignName,
        segmentId: selectedSegmentId,
        productId: selectedProduct?.id || null,
        channel: selectedChannel,
        messageTemplate: message,
        status: 'sending'
      })
    });
    
    addNotification({
      title: 'Campaign Launched',
      message: `Your campaign "${campaignName}" is now active and sending to ${displayCount} shoppers.`
    });
    addAuditLog({ action: 'Launched Campaign', details: campaignName });

    setTimeout(() => {
      router.push('/dashboard');
    }, 5000);
  };

  let currentStep = 1;
  if (selectedSegmentId) currentStep = 2;
  if (selectedSegmentId && selectedChannel) currentStep = 3;
  if (selectedSegmentId && selectedChannel && message.trim().length > 0) currentStep = 4;

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
      <div className="mb-xl sticky top-20 z-30 bg-background/80 backdrop-blur-md pb-md">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Campaign Builder</h2>
            <p className="text-on-surface-variant mt-xs">Orchestrate your high-velocity outreach strategy.</p>
          </div>
          <span className="font-data-tabular text-data-tabular bg-surface-container px-sm py-xs rounded border border-outline-variant text-tertiary">ID: XR-9942</span>
        </div>
        
        {/* Animated Step Indicator */}
        <div className="relative flex items-center justify-between px-md max-w-2xl mx-auto">
          {/* Background Track */}
          <div className="absolute left-10 right-10 top-5 h-1 bg-surface-container-high rounded-full -z-10">
            {/* Animated Fill */}
            <div 
              className="h-full bg-primary rounded-full transition-all duration-700 ease-in-out shadow-[0_0_10px_rgba(202,190,255,0.5)]" 
              style={{ width: `${(currentStep - 1) * 33.33}%` }}
            ></div>
          </div>
          
          {[1, 2, 3, 4].map(step => {
            const isCompleted = currentStep > step;
            const isCurrent = currentStep === step;
            const labels = ['TARGET', 'CHANNEL', 'CREATIVE', 'DEPLOY'];
            
            return (
              <div key={step} className={`flex flex-col items-center gap-xs bg-background px-2 transition-opacity duration-500 ${isCompleted || isCurrent ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ease-out ${
                  isCompleted ? 'bg-primary text-on-primary font-bold shadow-md' : 
                  isCurrent ? 'bg-primary text-on-primary font-bold shadow-[0_0_20px_rgba(202,190,255,0.6)] scale-110' : 
                  'bg-surface-container border border-outline-variant text-on-surface-variant font-bold'
                }`}>
                  {isCompleted ? <span className="material-symbols-outlined text-[20px]">check</span> : step}
                </div>
                <span className={`text-[10px] font-bold tracking-widest transition-colors duration-500 ${
                  isCurrent ? 'text-primary' : isCompleted ? 'text-on-surface' : 'text-on-surface-variant'
                }`}>{labels[step-1]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wizard Stages Container */}
      <div className="space-y-32">
        {/* Step 1: Segment Selection */}
        <section data-step="1" className="glass-card rounded-xl p-lg scroll-mt-32">
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
        <section data-step="2" className="glass-card rounded-xl p-lg border-l-4 border-l-primary/30 scroll-mt-32">
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
        <section data-step="3" className="glass-card rounded-xl p-lg scroll-mt-32">
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
          
          {/* Channel-aware message composer */}
          <div className="relative w-full">
            {!showAIPreview && (
              <div>
                {/* Email gets subject + body */}
                {selectedChannel === 'email' && (
                  <div className="mb-sm">
                    <label className="text-label-xs text-on-surface-variant block tracking-wider font-bold mb-xs">EMAIL SUBJECT LINE</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:ring-2 focus:ring-primary/50 text-sm"
                      placeholder="e.g. 🎉 Exclusive offer just for you, {first_name}!"
                      value={(message.split('\n---\n')[0]) || ''}
                      onChange={e => {
                        const body = message.includes('\n---\n') ? message.split('\n---\n').slice(1).join('\n---\n') : '';
                        setMessage(e.target.value + (body ? '\n---\n' + body : ''));
                      }}
                    />
                    <label className="text-label-xs text-on-surface-variant block tracking-wider font-bold mb-xs mt-sm">EMAIL BODY</label>
                  </div>
                )}

                {/* WhatsApp character guidance */}
                {selectedChannel === 'whatsapp' && (
                  <div className="flex items-center gap-xs mb-xs p-sm bg-[#25D366]/5 border border-[#25D366]/20 rounded-lg">
                    <span className="material-symbols-outlined text-[#25D366] text-sm">chat</span>
                    <span className="text-xs text-on-surface-variant">WhatsApp supports <strong>bold</strong> (*text*), <em>italic</em> (_text_), line breaks, and emojis. Max 4096 chars.</span>
                  </div>
                )}

                {/* SMS character counter guidance */}
                {selectedChannel === 'sms' && (
                  <div className="flex items-center justify-between gap-xs mb-xs p-sm bg-blue-500/5 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-blue-400 text-sm">sms</span>
                      <span className="text-xs text-on-surface-variant">SMS: 160 chars = 1 segment. Plain text only.</span>
                    </div>
                    <span className={`text-xs font-mono font-bold ${message.length > 160 ? 'text-error' : message.length > 130 ? 'text-yellow-400' : 'text-tertiary'}`}>
                      {message.length}/160
                    </span>
                  </div>
                )}

                {/* RCS rich content hint */}
                {selectedChannel === 'rcs' && (
                  <div className="flex items-center gap-xs mb-xs p-sm bg-amber-500/5 border border-amber-500/20 rounded-lg">
                    <span className="material-symbols-outlined text-amber-400 text-sm">interactive_space</span>
                    <span className="text-xs text-on-surface-variant">RCS supports rich cards, images, and action buttons. Describe content in message body.</span>
                  </div>
                )}

                <textarea
                  id="message-composer"
                  className={`w-full bg-surface-container-lowest border rounded-xl p-lg text-on-surface focus:ring-2 focus:ring-primary/50 resize-none font-body-md ${selectedChannel === 'sms' && message.length > 160 ? 'border-error' : 'border-outline-variant'}`}
                  style={{ minHeight: selectedChannel === 'email' ? '200px' : '140px' }}
                  placeholder={
                    selectedChannel === 'whatsapp' ? 'Hey! 👋 Your exclusive offer is ready...'
                    : selectedChannel === 'sms' ? 'Hi there, your code SAVE20 expires soon! Reply STOP to unsubscribe.'
                    : selectedChannel === 'email' ? 'Write your email body here...'
                    : 'Compose your rich business message with interactive elements...'
                  }
                  value={selectedChannel === 'email' && message.includes('\n---\n') ? message.split('\n---\n').slice(1).join('\n---\n') : message}
                  onChange={e => {
                    if (selectedChannel === 'email' && message.includes('\n---\n')) {
                      const subject = message.split('\n---\n')[0];
                      setMessage(subject + '\n---\n' + e.target.value);
                    } else {
                      setMessage(e.target.value);
                    }
                  }}
                />
              </div>
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
        <section data-step="4" className="glass-card rounded-xl p-lg border-2 border-tertiary/20 bg-tertiary/5 scroll-mt-32">
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

      {showSuccessPopup && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-md animate-in fade-in duration-300">
          <div className="bg-surface border border-tertiary/30 rounded-2xl p-xl w-full max-w-md flex flex-col items-center text-center shadow-[0_0_50px_rgba(74,225,118,0.15)] animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-tertiary/20 rounded-full flex items-center justify-center mb-lg relative">
              <div className="absolute inset-0 border-4 border-tertiary rounded-full border-t-transparent animate-spin"></div>
              <span className="material-symbols-outlined text-tertiary text-4xl">check</span>
            </div>
            <h3 className="font-display-sm text-display-sm text-on-surface mb-sm">Campaign Initiated!</h3>
            <p className="text-on-surface-variant mb-lg">Your campaign has been successfully created and queued for delivery.</p>
            
            <div className="bg-surface-container-low w-full rounded-lg p-md mb-lg border border-outline-variant/30 flex justify-between items-center text-sm">
              <span className="text-on-surface-variant">Redirecting to Dashboard...</span>
              <span className="font-bold text-tertiary animate-pulse">5s</span>
            </div>
            
            <button onClick={() => router.push('/dashboard')} className="w-full py-md rounded-xl bg-surface-container-high text-on-surface font-bold hover:bg-surface-container-highest transition-colors">
              Go to Dashboard Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}