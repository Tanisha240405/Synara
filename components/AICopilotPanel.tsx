'use client';
import { useAppStore } from '@/store';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AICopilotPanel() {
  const router = useRouter();
  const { isCopilotOpen, toggleCopilot } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const newMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context: { page: 'global' } })
      });
      
      const data = await res.json();
      
      if (res.ok && data.content) {
        let contentToDisplay = data.content;
        try {
          const rawContent = data.content.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(rawContent);
          if (parsed.action === 'draft_campaign') {
            const { segmentId, channel, message } = parsed.params || {};
            contentToDisplay = `Setting up campaign builder for "${segmentId || 'selected segment'}"...`;
            router.push(`/campaigns?segmentId=${encodeURIComponent(segmentId || '')}&channel=${encodeURIComponent(channel || '')}&message=${encodeURIComponent(message || '')}`);
          }
        } catch (e) {
          // Not JSON, just display text
        }
        setMessages([...newMessages, { role: 'assistant' as const, content: contentToDisplay }]);
      } else {
        setMessages([...newMessages, { role: 'assistant' as const, content: "Sorry, I couldn't process that request right now." }]);
      }
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant' as const, content: "Network error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const examples = [
    "HOW ARE MY CAMPAIGNS PERFORMING?",
    "CREATE A SEGMENT FOR HIGH SPENDERS",
    "CHECK DATA SYNC HEALTH",
  ];

  if (!isCopilotOpen) {
    return (
      <button 
        onClick={toggleCopilot} 
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-50 group"
      >
        <span className="material-symbols-outlined text-white text-3xl group-hover:rotate-12 transition-transform">memory</span>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-surface-container-lowest animate-pulse"></span>
      </button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-[450px] bg-[#0f0f13] border-l border-white/5 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-[28px]">memory</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Synara Intelligence</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-xs font-bold text-green-400 tracking-widest">ONLINE</span>
              </div>
            </div>
          </div>
          <button onClick={toggleCopilot} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          {/* Initial Greeting */}
          <div className="bg-[#16161a] border border-white/5 rounded-2xl p-6 shadow-sm w-full">
            <div className="flex items-center gap-2 text-indigo-400 mb-3 text-xs font-bold tracking-widest uppercase">
              <span className="material-symbols-outlined text-[14px]">terminal</span> LOCO
            </div>
            <p className="text-white/90 text-[15px] leading-relaxed">
              Hello! I am Synara AI, your AI marketing terminal. How can I help you orchestrate campaigns or analyze your data today?
            </p>
          </div>

          {messages.map((m, i) => (
            <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`${m.role === 'user' ? 'bg-indigo-500/20 text-indigo-100 max-w-[75%]' : 'bg-[#16161a] border border-white/5 text-white/90 w-full'} rounded-2xl p-6 shadow-sm`}>
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-2 text-indigo-400 mb-3 text-xs font-bold tracking-widest uppercase">
                    <span className="material-symbols-outlined text-[14px]">terminal</span> LOCO
                  </div>
                )}
                <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="w-full bg-[#16161a] border border-white/5 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-400 mb-3 text-xs font-bold tracking-widest uppercase">
                <span className="material-symbols-outlined text-[14px]">terminal</span> LOCO
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-75"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-150"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-[#0f0f13] via-[#0f0f13] to-transparent pt-12">
          <div className="flex items-center bg-[#16161a] border border-white/10 rounded-xl p-2 focus-within:border-indigo-500/50 transition-colors shadow-inner mb-4">
            <span className="material-symbols-outlined text-white/30 px-3">smart_toy</span>
            <input 
              type="text" 
              placeholder="Ask me to build a campaign, plan strategy, or analyze churn..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none text-sm disabled:opacity-50" 
            />
            <button 
              onClick={() => handleSend(input)}
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-500/40 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-500/20"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {examples.map((ex, i) => (
              <button 
                key={i}
                onClick={() => handleSend(ex)}
                className="px-4 py-2 text-[10px] font-bold tracking-widest text-white/40 border border-white/10 rounded-md hover:text-white hover:border-white/30 hover:bg-white/5 transition-colors uppercase"
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>

    </div>
  );
}