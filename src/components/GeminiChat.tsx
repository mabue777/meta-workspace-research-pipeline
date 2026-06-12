import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Brain, Zap } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { createDocument } from '../firebase/db';

export function GeminiChat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: "Hello. I am your advanced research copilot. Ask me questions, or request deep thinking insights." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'fast'|'standard'|'deep'>('standard');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      let endpoint = '/api/research/query';
      if (mode === 'fast') endpoint = '/api/research/fast-query';
      if (mode === 'deep') endpoint = '/api/research/deep-query';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg })
      });
      const data = await res.json();
      const botText = data.text || 'No response';

      setMessages(prev => [...prev, { role: 'assistant', text: botText }]);
      
      // Save deep thoughts automatically to pipeline!
      if (mode === 'deep' && projectId) {
        await createDocument(projectId, `Deep Dive: ${userMsg.slice(0, 30)}...`, botText);
      }
      
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: '*Error: Could not reach the model.*' }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-2xl">
      <div className="absolute top-0 right-0 left-0 p-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-10 flex gap-2 justify-center shrink-0">
        <button onClick={()=>setMode('fast')} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition", mode === 'fast' ? "bg-amber-600/20 text-amber-500 border border-amber-600/50" : "text-slate-400 hover:text-slate-300")}>
          <Zap className="w-3.5 h-3.5" /> Flash Lite
        </button>
        <button onClick={()=>setMode('standard')} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition", mode === 'standard' ? "bg-blue-600/20 text-blue-500 border border-blue-600/50" : "text-slate-400 hover:text-slate-300")}>
          <Sparkles className="w-3.5 h-3.5" /> Flash (Search +)
        </button>
        <button onClick={()=>setMode('deep')} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition", mode === 'deep' ? "bg-purple-600/20 text-purple-400 border border-purple-600/50" : "text-slate-400 hover:text-slate-300")}>
          <Brain className="w-3.5 h-3.5" /> Deep Thinking (Pro)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-20 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col max-w-[85%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
             <div className={cn("px-4 py-3 rounded-2xl", 
                msg.role === 'user' 
                  ? "bg-slate-700 text-slate-100 rounded-tr-sm" 
                  : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50"
             )}>
                {msg.role === 'user' ? (
                   <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                ) : (
                   <div className="markdown-body prose prose-invert prose-sm max-w-none">
                      <Markdown>{msg.text}</Markdown>
                   </div>
                )}
             </div>
          </div>
        ))}
        {loading && (
          <div className="mr-auto px-4 py-3 bg-slate-800 rounded-2xl rounded-tl-sm border border-slate-700/50 flex items-center gap-2 text-slate-400">
             <Loader2 className="w-4 h-4 animate-spin" /> {mode === 'deep' ? 'Thinking deeply...' : 'Generating...'}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
           <textarea 
             className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition resize-none min-h-[50px] max-h-[150px]"
             placeholder={mode === 'deep' ? "Ask a complex research question..." : "Enter request..."}
             value={input}
             onChange={e => setInput(e.target.value)}
             onKeyDown={(e) => {
               if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
             }}
           />
           <button type="submit" disabled={!input.trim() || loading} className="h-[50px] w-[50px] flex items-center justify-center shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl transition">
             <Send className="w-5 h-5 -ml-0.5" />
           </button>
        </form>
      </div>
    </div>
  );
}
