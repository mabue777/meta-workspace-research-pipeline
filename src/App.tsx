import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { createProject, getProjects } from './firebase/db';
import { GeminiChat } from './components/GeminiChat';
import { WorkspaceAnalyzer } from './components/WorkspaceAnalyzer';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { Loader2, Plus, LogIn, LayoutDashboard, Database, Video, MessageSquareHeart, Layers } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const { user, token, loading, login, logout } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'docs' | 'video'>('chat');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      getProjects().then(p => {
        setProjects(p);
        if (p.length > 0) setActiveProject(p[0].id);
      });
    } else {
      setProjects([]);
      setActiveProject(null);
    }
  }, [user]);

  const handleCreateProject = async () => {
    setCreating(true);
    const title = prompt("Project Name:", "New Research Project");
    if (title) {
      const id = await createProject(title, "Generated project space.");
      if (id) {
        setProjects(prev => [...prev, { id, title }]);
        setActiveProject(id);
      }
    }
    setCreating(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="tracking-widest uppercase text-xs font-semibold">Initializing Neural Core...</p>
    </div>
  );

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[ радиальный градиент... ] relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/10 mix-blend-screen pointer-events-none blur-3xl opacity-50" />
        <div className="z-10 max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
             <Layers className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-display font-medium text-slate-100 mb-2 mt-4 tracking-tight">Cosmic Data Pipeline</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">Systematically accumulate, process, and structure massive corpora of high-value research data using Google Workspace and Gemini.</p>
          <button 
             onClick={login}
             className="w-full relative group bg-white text-slate-900 hover:bg-slate-200 font-medium h-12 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg"
          >
             <LogIn className="w-4 h-4" /> Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const currentProject = projects.find(p => p.id === activeProject);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200">
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 shrink-0">
         <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <h1 className="font-display font-medium text-lg text-slate-100 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> Nexus Pipeline
            </h1>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
               <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 ml-2 flex items-center gap-2">
                 <LayoutDashboard className="w-3.5 h-3.5" /> Research Spaces
               </h3>
               <div className="space-y-1">
                 {projects.map(p => (
                   <button 
                     key={p.id} 
                     onClick={() => setActiveProject(p.id)}
                     className={cn("w-full text-left px-3 py-2 text-sm rounded-lg transition truncate font-medium", activeProject === p.id ? "bg-blue-600/10 text-blue-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")}
                   >
                     {p.title}
                   </button>
                 ))}
               </div>
               <button 
                 onClick={handleCreateProject} 
                 disabled={creating}
                 className="w-full mt-2 flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300 transition"
               >
                 <Plus className="w-3.5 h-3.5" /> New Project
               </button>
            </div>
         </div>
         <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 overflow-hidden shrink-0 border border-slate-700">
                 {user.photoURL ? <img src={user.photoURL} alt="User" /> : user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col truncate">
                 <span className="text-xs font-medium text-slate-200 truncate">{user.displayName || 'Researcher'}</span>
              </div>
            </div>
            <button onClick={logout} className="w-full py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded bg-slate-800/30 transition border border-slate-800">
               Sign out
            </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
          {!activeProject ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 p-6 flex-col">
               <Layers className="w-12 h-12 mb-4 opacity-20" />
               <p>Create or select a research project to begin analysis.</p>
            </div>
          ) : (
             <>
               {/* Nav */}
               <div className="h-16 flex items-center px-8 border-b border-slate-800 shrink-0 gap-8">
                  <h2 className="font-display font-medium text-slate-200 mr-auto truncate">{currentProject?.title}</h2>
                  <div className="flex gap-2">
                     <button onClick={() => setActiveTab('chat')} className={cn("px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition", activeTab === 'chat' ? "bg-slate-800 text-slate-200" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50")}>
                        <MessageSquareHeart className="w-4 h-4" /> AI Copilot
                     </button>
                     <button onClick={() => setActiveTab('docs')} className={cn("px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition", activeTab === 'docs' ? "bg-slate-800 text-slate-200" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50")}>
                        <Database className="w-4 h-4" /> Workspace Corpus
                     </button>
                     <button onClick={() => setActiveTab('video')} className={cn("px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition", activeTab === 'video' ? "bg-slate-800 text-slate-200" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50")}>
                        <Video className="w-4 h-4" /> Video Analytics
                     </button>
                  </div>
               </div>
               
               {/* View Area */}
               <div className="flex-1 p-6 overflow-hidden">
                  {activeTab === 'chat' && <GeminiChat projectId={activeProject} />}
                  {activeTab === 'docs' && <WorkspaceAnalyzer projectId={activeProject} token={token} />}
                  {activeTab === 'video' && <VideoAnalyzer projectId={activeProject} />}
               </div>
             </>
          )}
      </div>

    </div>
  );
}
