import { useState, useEffect } from 'react';
import { listGoogleDocs, readGoogleDoc, createGoogleSheet } from '../lib/workspace';
import { createDocument } from '../firebase/db';
import { FileText, Loader2, Database, Table } from 'lucide-react';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';

export function WorkspaceAnalyzer({ token, projectId }: { token: string, projectId: string }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  useEffect(() => {
    async function loadDocs() {
      setLoading(true);
      try {
        const d = await listGoogleDocs(token);
        setDocs(d);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    loadDocs();
  }, [token]);

  const handleAnalyze = async (docObj: any) => {
    setAnalyzingId(docObj.id);
    try {
      const { title, text } = await readGoogleDoc(token, docObj.id);
      
      const res = await fetch('/api/research/analyze-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text })
      });
      const resData = await res.json();
      const parsed = JSON.parse(resData.result);
      
      setAnalysisResult({ docTitle: title, originalText: text, ...parsed });

      // Save to Firebase
      await createDocument(projectId, `Analysis: ${title}`, resData.result, `https://docs.google.com/document/d/${docObj.id}`);
      
    } catch (err) {
      console.error(err);
      alert('Failed to analyze document.');
    }
    setAnalyzingId(null);
  };

  const handleExportSheet = async () => {
    if (!analysisResult) return;
    
    const rows = [
      ['Document Title', 'Summary'],
      [analysisResult.docTitle, analysisResult.summary],
      ['-- Key Findings --', ''],
      ...analysisResult.keyFindings.map((k: string) => [k, '']),
      ['-- Entities --', ''],
      ...analysisResult.entities.map((e: string) => [e, ''])
    ];

    try {
      const confirmed = window.confirm('Create a new Google Sheet to export these findings?');
      if (!confirmed) return;
      
      const sheetId = await createGoogleSheet(token, `Export: ${analysisResult.docTitle}`, rows);
      alert(`Exported successfully! Output Sheet ID: ${sheetId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to export to sheets');
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto w-full p-4">
      <div className="flex flex-col md:flex-row gap-6 h-full">
        <div className="w-full md:w-1/3 border border-slate-800 bg-slate-900 rounded-xl p-4 flex flex-col gap-4">
          <h2 className="text-xl font-medium tracking-tight text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" /> Documents
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading Docs...
            </div>
          ) : (
            <ul className="flex flex-col gap-2 overflow-y-auto flex-1">
              {docs.map(d => (
                <li key={d.id} className="flex flex-col p-3 border border-slate-800 rounded-lg hover:border-blue-500/50 bg-slate-950 transition-colors">
                  <div className="flex items-center gap-2 text-sm text-slate-200 mb-2 truncate">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" /> {d.name}
                  </div>
                  <button 
                    onClick={() => handleAnalyze(d)}
                    disabled={!!analyzingId}
                    className="self-start text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 px-3 py-1.5 rounded-md font-medium transition disabled:opacity-50"
                  >
                    {analyzingId === d.id ? 'Analyzing...' : 'Deep Analyze'}
                  </button>
                </li>
              ))}
              {docs.length === 0 && <li className="text-slate-500 text-sm">No Google Docs found.</li>}
            </ul>
          )}
        </div>
        
        <div className="flex-1 border border-slate-800 bg-slate-900 rounded-xl p-6 overflow-y-auto">
          {analysisResult ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-medium text-slate-100 tracking-tight">Analysis: {analysisResult.docTitle}</h2>
                <button onClick={handleExportSheet} className="flex items-center gap-2 text-sm bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-3 py-1.5 rounded-lg font-medium transition">
                  <Table className="w-4 h-4" /> Export to Sheets
                </button>
              </div>
              
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Summary</h3>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800/50">
                  {analysisResult.summary}
                </p>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Key Findings</h3>
                <ul className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800/50 list-disc pl-8 space-y-2">
                  {analysisResult.keyFindings.map((k: string, i: number) => <li key={i}>{k}</li>)}
                </ul>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Entities Discovered</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.entities.map((e: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
              <Database className="w-10 h-10 opacity-20" />
              <p>Select a document to run Deep Analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
