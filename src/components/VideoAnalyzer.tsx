import { useState, useEffect } from 'react';
import { Video, Loader2, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { createVideoAnalysis, getVideoAnalyses } from '../firebase/db';

export function VideoAnalyzer({ projectId }: { projectId: string }) {
  const [url, setUrl] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (projectId) {
      getVideoAnalyses(projectId).then(setHistory);
    }
  }, [projectId]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/research/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: url, context })
      });
      const data = await res.json();
      const summary = data.summary || 'No analysis available.';
      
      const newId = await createVideoAnalysis(projectId, url, summary, ["video-insight"]);
      setUrl('');
      setContext('');
      getVideoAnalyses(projectId).then(setHistory);
    } catch (err) {
      console.error(err);
      alert('Failed to analyze video');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 p-4">
      <div className="w-full md:w-1/3 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
        <h2 className="text-xl font-medium tracking-tight text-slate-100 mb-6 flex items-center gap-2">
           <Video className="w-5 h-5 text-indigo-400" /> Video Ingestion
        </h2>
        <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 ml-1">Video Reference (URL)</label>
            <input 
               type="text" 
               placeholder="e.g. YouTube URL or Drive Link" 
               className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
               value={url}
               onChange={e => setUrl(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 ml-1">Research Context</label>
            <textarea 
               placeholder="What should the model look for?" 
               className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 min-h-[100px] resize-none focus:outline-none focus:border-indigo-500/50"
               value={context}
               onChange={e => setContext(e.target.value)}
            />
          </div>
          <button 
             type="submit" 
             disabled={loading || !url.trim()}
             className="mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg transition flex items-center justify-center gap-2"
          >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
             Run Analysis
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-6">
         <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Historical Analyses</h3>
         <div className="flex flex-col gap-4">
            {history.map(item => (
              <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-lg p-5">
                 <div className="flex flex-wrap gap-2 mb-3 items-center">
                    <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[200px]">{item.videoUrl}</span>
                    <span className="text-xs text-indigo-400/80">• Gemini Pro Vision</span>
                 </div>
                 <div className="markdown-body prose prose-invert prose-sm max-w-none">
                    <Markdown>{item.summary}</Markdown>
                 </div>
              </div>
            ))}
            {history.length === 0 && (
               <div className="flex items-center justify-center h-32 text-slate-500 text-sm">No videos analyzed in this project.</div>
            )}
         </div>
      </div>
    </div>
  );
}
