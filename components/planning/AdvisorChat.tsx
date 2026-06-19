'use client';
import { useRef, useEffect, useState } from 'react';
import { usePlanningStore } from '@/lib/planning/store';
import { askAdvisor, SUGGESTED_QUESTIONS } from '@/lib/planning/advisor';
import { Send, Sparkles, Trash2 } from 'lucide-react';

export default function AdvisorChat() {
  const { rooms, items, style, chat, addChat, clearChat } = usePlanningStore();
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat, thinking]);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || thinking) return;
    setInput('');
    addChat({ role: 'user', text: msg });
    setThinking(true);
    try {
      const reply = await askAdvisor(msg, { rooms, items, style });
      addChat({ role: 'assistant', text: reply });
    } catch {
      addChat({ role: 'assistant', text: 'מצטער, משהו השתבש. נסו שוב.' });
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 230px)', minHeight: 420 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-stone-900 text-sm leading-tight">יועץ הדירה</p>
            <p className="text-[11px] text-stone-400">עוזר לכם להחליט, לחסוך ולתכנן</p>
          </div>
        </div>
        {chat.length > 0 && (
          <button onClick={clearChat} className="p-2 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto glass-card rounded-3xl p-4 space-y-3">
        {chat.length === 0 && (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🏠</div>
            <p className="text-stone-600 font-medium mb-1">שלום! אני יועץ הדירה שלכם</p>
            <p className="text-stone-400 text-sm">שאלו אותי כל דבר על התכנון, התקציב או הסגנון</p>
          </div>
        )}
        {chat.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
                m.role === 'user'
                  ? 'bg-stone-800 text-white rounded-bl-sm'
                  : 'bg-white/80 text-stone-800 border border-white rounded-br-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-end">
            <div className="bg-white/80 border border-white px-4 py-3 rounded-2xl rounded-br-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* suggested questions */}
      <div className="flex gap-2 overflow-x-auto py-3 -mx-1 px-1">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button key={q} onClick={() => send(q)} disabled={thinking}
            className="shrink-0 glass-card px-3 py-1.5 rounded-full text-xs font-medium text-stone-600 hover:text-amber-600 disabled:opacity-50 transition-colors">
            {q}
          </button>
        ))}
      </div>

      {/* input */}
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(input); }}
          placeholder="כתבו הודעה ליועץ..."
          className="flex-1 px-4 py-3 rounded-2xl glass-card text-sm focus:outline-none placeholder:text-stone-400"
        />
        <button onClick={() => send(input)} disabled={thinking || !input.trim()}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 transition-all active:scale-95"
          style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
          <Send size={18} className="-scale-x-100" />
        </button>
      </div>
    </div>
  );
}
