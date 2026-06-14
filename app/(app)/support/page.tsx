'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('Technical Support');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  
  const [showPopup, setShowPopup] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  
  const [faqSearch, setFaqSearch] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const { addNotification, addAuditLog, recentTickets, addTicket } = useAppStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    
    setTimeout(() => {
      setStatus('success');
      const newTicketId = 'TKT-' + Math.floor(1000 + Math.random() * 9000);
      
      const newTicketObj = {
        id: newTicketId,
        subject: subject,
        category: category,
        message: message,
        date: new Date().toLocaleDateString(),
        status: 'Open',
        replies: []
      };

      addTicket(newTicketObj);
      setActiveTicket(newTicketObj);
      setShowPopup(true);
      
      addNotification({
        title: 'Support Ticket Created',
        message: `Your ticket ${newTicketId} has been created and will be reviewed within 2 hours.`
      });
      addAuditLog({ action: 'Support Requested', details: `Ticket: ${newTicketId}, Category: ${category}` });
      
      setTimeout(() => {
        setStatus('idle');
        setSubject('');
        setMessage('');
        setCategory('Technical Support');
      }, 500);
    }, 1500);
  };

  const faqs = [
    {
      q: "How does Synara Intelligence generate segments?",
      a: "Synara Intelligence uses advanced Natural Language Processing to convert your plain text requests into optimized SQL queries that run directly against your customer database in real-time."
    },
    {
      q: "Why are some campaigns showing zero revenue?",
      a: "Attribution can take up to 24 hours to sync depending on your integration. If you just launched a campaign, give it some time to track conversions. You can also manually trigger a sync in your Settings panel."
    },
    {
      q: "How can I change my profile photo?",
      a: "Simply hover over your avatar in the Profile section or click your initials in the sidebar menu. An upload icon will appear allowing you to select a new image."
    },
    {
      q: "What is the Anomaly Intelligence System?",
      a: "The Anomaly Intelligence System monitors your active campaigns every 60 seconds to detect unusual drops in engagement, delivery failures, or opt-out surges. It then provides AI-driven root cause analysis and a 1-click recovery option."
    },
    {
      q: "How does the 'Execute Recovery' feature work?",
      a: "When an anomaly is detected, clicking 'Execute Recovery' will automatically draft a win-back campaign using Synara AI AI, pre-filling the target segment, channel, and message. You can review and deploy it instantly."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
    faq.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const toggleFaq = (index: number) => {
    if (openFaq === index) setOpenFaq(null);
    else setOpenFaq(index);
  };

  const handleOpenTicket = (ticket: any) => {
    // If it's a legacy ticket without extended fields, enrich it
    const enrichedTicket = {
      ...ticket,
      message: ticket.message || "Original message details unavailable.",
      status: ticket.id === 'TKT-1049' ? 'Resolved' : ticket.status || 'In Progress',
      replies: ticket.replies || (ticket.id === 'TKT-1049' ? [
        { sender: 'AI Support', text: 'We detected an anomaly and applied an automated fix. Please check your dashboard.', time: 'Yesterday' }
      ] : [])
    };
    setActiveTicket(enrichedTicket);
    setFeedbackGiven(false);
    setShowStatus(true);
  };

  const handleFeedback = (isPositive: boolean) => {
    setFeedbackGiven(true);
    addAuditLog({ action: 'Feedback Submitted', details: `User rated support ticket ${activeTicket.id} as ${isPositive ? 'Positive' : 'Negative'}` });
    addNotification({ title: 'Feedback Received', message: 'Thank you for your feedback!' });
  };

  const openLiveChat = () => {
    setShowChat(true);
    addAuditLog({ action: 'Live Chat Initiated', details: 'User opened AI Live Support' });
  };

  return (
    <div className="pt-8 pb-32 px-margin-mobile md:px-margin-desktop max-w-[1200px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4">
      {/* Top Section */}
      <div className="mb-xl flex flex-col md:flex-row items-center justify-between gap-md text-center md:text-left">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Help & Support</h2>
          <p className="text-on-surface-variant mt-xs">Need assistance? We're here to help you maximize your Synara Intelligence.</p>
        </div>
        <div className="flex items-center gap-2 bg-success/10 border border-success/30 px-md py-sm rounded-full cursor-pointer hover:bg-success/20 transition-colors" title="All services are running normally.">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span className="text-sm font-bold text-success">All systems operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        
        {/* Left Column: Contact & Chat */}
        <div className="lg:col-span-2 flex flex-col gap-xl">
          <div className="glass-card p-lg rounded-xl flex flex-col gap-lg border-t-4 border-t-primary">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-md pb-md border-b border-outline-variant/30 text-on-surface">
              <div className="flex items-center gap-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[28px]">support_agent</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Contact Technical Support</h3>
                  <p className="text-body-sm text-on-surface-variant">Average human response time: 2 hours</p>
                </div>
              </div>
              <button 
                onClick={openLiveChat}
                className="bg-surface-container-high hover:bg-primary/20 hover:text-primary hover:border-primary/50 text-on-surface px-md py-sm rounded-lg border border-outline-variant/50 transition-colors font-bold flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">chat_bubble</span> Chat with Synara AI AI
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label className="text-label-xs text-on-surface-variant font-bold tracking-wider">CATEGORY</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none"
                  >
                    <option value="Technical Support">Technical Support</option>
                    <option value="Billing & Plans">Billing & Plans</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Bug Report">Bug Report</option>
                  </select>
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-label-xs text-on-surface-variant font-bold tracking-wider">SUBJECT</label>
                  <input 
                    type="text" 
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Issue with segment sync"
                    className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-label-xs text-on-surface-variant font-bold tracking-wider">MESSAGE</label>
                <textarea 
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-md py-sm text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={status !== 'idle'}
                className="mt-sm self-end bg-primary text-on-primary px-xl py-sm rounded-lg font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {status === 'sending' ? (
                  <><span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> Sending...</>
                ) : status === 'success' ? (
                  <><span className="material-symbols-outlined text-[18px]">check_circle</span> Sent</>
                ) : (
                  <>Submit Ticket</>
                )}
              </button>
            </form>
          </div>

          <div className="glass-card p-lg rounded-xl flex flex-col gap-md">
            <div className="flex items-center justify-between mb-xs border-b border-outline-variant/30 pb-sm">
              <h3 className="font-headline-sm text-on-surface">Frequently Asked Questions</h3>
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                <input 
                  type="text" 
                  placeholder="Search FAQs..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-full pl-xl pr-md py-1.5 text-sm focus:outline-none focus:border-primary transition-colors text-on-surface"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {filteredFaqs.length === 0 ? (
                <p className="text-on-surface-variant italic text-sm py-4 text-center">No questions found matching your search.</p>
              ) : filteredFaqs.map((faq, i) => (
                <div key={i} className={`flex flex-col gap-sm border-b border-outline-variant/10 pb-sm cursor-pointer transition-colors hover:bg-surface-container-highest p-3 rounded-lg ${openFaq === i ? 'bg-surface-container-high border-l-2 border-l-primary' : ''}`} onClick={() => toggleFaq(i)}>
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold text-sm flex items-center gap-2 ${openFaq === i ? 'text-primary' : 'text-on-surface'}`}>
                      {faq.q}
                    </h4>
                    <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-200" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>add</span>
                  </div>
                  {openFaq === i && (
                    <p className="text-sm text-on-surface-variant mt-2 animate-in slide-in-from-top-2 leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Tickets & Links */}
        <div className="flex flex-col gap-xl">
          {isMounted && recentTickets.length > 0 && (
            <div className="glass-card p-lg rounded-xl">
              <h3 className="font-headline-sm text-on-surface mb-md border-b border-outline-variant/30 pb-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                Recent Tickets
              </h3>
              <div className="flex flex-col gap-sm">
                {recentTickets.map((t: any) => {
                  const isResolved = t.id === 'TKT-1049' || t.status === 'Resolved';
                  return (
                    <div 
                      key={t.id} 
                      onClick={() => handleOpenTicket(t)}
                      className="flex flex-col p-md bg-surface-container-lowest hover:bg-surface-container-highest cursor-pointer transition-colors rounded-lg border border-outline-variant/30 group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant group-hover:text-primary transition-colors">{t.id}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isResolved ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                          {isResolved ? 'Resolved' : (t.status || 'In Progress')}
                        </span>
                      </div>
                      <p className="font-bold text-on-surface text-sm truncate">{t.subject}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{t.date}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-md">
            <div className="bg-surface-container rounded-lg p-lg border border-outline-variant/30 flex flex-col gap-sm hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <h4 className="font-bold text-on-surface">Documentation</h4>
              <p className="text-xs text-on-surface-variant">Read guides on API integrations, advanced segmentation, and campaign building.</p>
            </div>
            <div className="bg-surface-container rounded-lg p-lg border border-outline-variant/30 flex flex-col gap-sm hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mb-1 group-hover:bg-secondary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined">forum</span>
              </div>
              <h4 className="font-bold text-on-surface">Community Forum</h4>
              <p className="text-xs text-on-surface-variant">Connect with other growth marketers to share strategies and templates.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Legacy Ticket Submission Success Popup */}
      {showPopup && !showStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container glass-card w-full max-w-md rounded-2xl p-xl shadow-[0_0_50px_rgba(124,92,252,0.2)] border border-primary/30 relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-tertiary to-primary animate-pulse"></div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-md border border-success/30">
                <span className="material-symbols-outlined text-[32px]">check_circle</span>
              </div>
              
              <h3 className="font-display-sm text-display-sm text-on-surface mb-xs">Ticket Secured</h3>
              <p className="text-on-surface-variant text-body-md mb-lg">
                Your request has been beamed to our support engineers. We're on it!
              </p>
              
              <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-md mb-lg flex justify-between items-center">
                <span className="text-on-surface-variant font-label-md uppercase tracking-wider">Ticket ID</span>
                <span className="font-data-tabular text-data-tabular font-bold text-primary">{activeTicket?.id}</span>
              </div>
              
              <div className="flex w-full gap-md">
                <button 
                  onClick={() => setShowPopup(false)}
                  className="flex-1 px-md py-sm rounded-lg font-bold bg-surface-variant text-on-surface hover:bg-surface-container-highest transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => { setShowPopup(false); handleOpenTicket(activeTicket); }}
                  className="flex-1 px-md py-sm rounded-lg font-bold bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-[0_0_15px_rgba(124,92,252,0.4)] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">track_changes</span> Track Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Status & Detail View */}
      {showStatus && activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl border border-outline-variant/50 relative animate-in zoom-in-95">
            
            <div className="p-lg border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-high/50">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-headline-sm text-on-surface">{activeTicket.id}</h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${activeTicket.status === 'Resolved' ? 'bg-success/20 text-success' : activeTicket.status === 'Open' ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'}`}>
                    {activeTicket.status}
                  </span>
                </div>
                <p className="text-sm font-bold text-on-surface-variant">{activeTicket.subject}</p>
              </div>
              <button 
                onClick={() => setShowStatus(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg">
              {/* Original Message */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center text-xs font-bold">You</div>
                  <span className="text-xs text-on-surface-variant">{activeTicket.date} • {activeTicket.category || 'General'}</span>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-md rounded-r-xl rounded-bl-xl text-sm text-on-surface">
                  {activeTicket.message}
                </div>
              </div>

              {/* Replies */}
              {activeTicket.replies?.map((reply: any, i: number) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shadow-[0_0_5px_rgba(124,92,252,0.5)]">
                      <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                    </div>
                    <span className="text-xs font-bold text-primary">{reply.sender}</span>
                    <span className="text-xs text-on-surface-variant">{reply.time}</span>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 p-md rounded-r-xl rounded-bl-xl text-sm text-on-surface">
                    {reply.text}
                  </div>
                </div>
              ))}

              {activeTicket.status === 'Resolved' && !feedbackGiven && (
                <div className="mt-md p-md bg-surface-container-lowest border border-outline-variant/50 rounded-xl flex flex-col items-center gap-md animate-in fade-in">
                  <p className="text-sm font-bold text-on-surface">Did we resolve your issue?</p>
                  <div className="flex gap-4">
                    <button onClick={() => handleFeedback(true)} className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success border border-success/30 rounded hover:bg-success/20 transition-colors text-sm font-bold">
                      <span className="material-symbols-outlined text-[18px]">thumb_up</span> Yes
                    </button>
                    <button onClick={() => handleFeedback(false)} className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error border border-error/30 rounded hover:bg-error/20 transition-colors text-sm font-bold">
                      <span className="material-symbols-outlined text-[18px]">thumb_down</span> No
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {activeTicket.status !== 'Resolved' && (
              <div className="p-md border-t border-outline-variant/30 bg-surface-container-lowest">
                <div className="flex gap-2">
                  <input type="text" placeholder="Type a reply..." className="flex-1 bg-surface-container border border-outline-variant/50 rounded-lg px-md py-sm text-sm focus:border-primary outline-none text-on-surface" />
                  <button className="bg-primary text-on-primary px-4 rounded-lg font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors text-sm flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Live Chat Overlay */}
      {showChat && (
        <div className="fixed bottom-6 right-6 z-[100] w-[350px] h-[500px] glass-card rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-primary/30 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
          <div className="bg-gradient-to-r from-primary to-tertiary p-md flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">support_agent</span>
              <span className="font-bold">Synara AI AI Support</span>
            </div>
            <button onClick={() => setShowChat(false)} className="hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="flex-1 p-md flex flex-col gap-md overflow-y-auto bg-surface-container-lowest">
            <div className="bg-surface-container p-sm rounded-r-xl rounded-bl-xl text-sm w-[85%]">
              Hi there! I'm Synara AI AI. How can I assist you with Synara today? I can help with segmentation, building campaigns, or analytics issues.
            </div>
          </div>
          <div className="p-sm bg-surface-container border-t border-outline-variant/30 flex gap-2">
            <input type="text" placeholder="Type your message..." className="flex-1 bg-background border border-outline-variant/50 rounded-full px-4 py-2 text-sm focus:border-primary outline-none" />
            <button className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-colors shrink-0 shadow-lg">
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
