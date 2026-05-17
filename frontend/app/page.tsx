'use client';

import { useState, useEffect } from 'react';
import { Shovel, GitBranch, Terminal, RefreshCw, CheckCircle2, AlertCircle, Download, Network } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import FileTreeGraph, { FileStat } from '../components/FileTreeGraph';

interface Era {
  era_title: string;
  dominant_contributors: string[];
  narrative: string;
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusState, setStatusState] = useState<'IDLE' | 'QUEUED' | 'PROGRESS' | 'SUCCESS' | 'FAILURE'>('IDLE');
  const [statusMessage, setStatusMessage] = useState('');
  const [eras, setEras] = useState<Era[]>([]);
  const [survivalGuide, setSurvivalGuide] = useState<string | null>(null);
  const [fileStats, setFileStats] = useState<Record<string, FileStat> | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'guide' | 'topography'>('timeline');
  const [sliderIndex, setSliderIndex] = useState(0);
  const [newHireMode, setNewHireMode] = useState(false);

  // WebSocket hook to receive live updates from the FastAPI backend
  useEffect(() => {
    if (!jobId || statusState === 'SUCCESS' || statusState === 'FAILURE') return;

    const wsUrl = `ws://localhost:8000/api/ws/status/${jobId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.state === 'PROGRESS') {
          setStatusState('PROGRESS');
          setStatusMessage(data.status || 'Excavating repository layers...');
        } else if (data.state === 'SUCCESS') {
          setStatusState('SUCCESS');
          setEras(data.result.eras || []);
          setSurvivalGuide(data.result.survival_guide || null);
          setFileStats(data.result.file_stats || null);
          setSliderIndex(data.result.eras ? (data.result.eras.length - 1) : 0);
          ws.close();
        } else if (data.state === 'FAILURE') {
          setStatusState('FAILURE');
          setStatusMessage(data.error || 'The dig site collapsed due to an infrastructure error.');
          ws.close();
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setStatusState('FAILURE');
      setStatusMessage('WebSocket connection failed.');
    };

    return () => ws.close();
  }, [jobId, statusState]);

  const triggerAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setStatusState('QUEUED');
    setStatusMessage('Sending excavation requests to backend workers...');
    setEras([]);
    setSurvivalGuide(null);
    setFileStats(null);
    setActiveTab('timeline');
    setJobId(null);

    try {
      const res = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: repoUrl }),
      });
      const data = await res.json();
      if (data.job_id) {
        setJobId(data.job_id);
      } else {
        setStatusState('FAILURE');
        setStatusMessage('Backend rejected request format.');
      }
    } catch (err) {
      setStatusState('FAILURE');
      setStatusMessage('Could not connect to FastAPI server. Verify it is running.');
    }
  };

  const handleDownload = () => {
    if (!survivalGuide) return;
    const blob = new Blob([survivalGuide], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'New_Hire_Survival_Guide.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const displayEras = newHireMode ? eras.slice(-10) : eras; // Filter down to max 10 for New Hire Mode
  
  // Calculate interpolated date for the D3 graph time slider
  const timestamps = Object.values(fileStats || {}).map(f => new Date(f.created_at).getTime());
  const minTime = timestamps.length ? Math.min(...timestamps) : 0;
  const maxTime = timestamps.length ? Math.max(...timestamps) : 0;
  const timeProgress = eras.length > 1 ? sliderIndex / (eras.length - 1) : 1;
  const currentSliderTime = minTime + (maxTime - minTime) * timeProgress;
  const interpolatedDate = new Date(currentSliderTime || Date.now()).toISOString();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header Block */}
        <header className="border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <Shovel className="h-8 w-8 text-amber-500 animate-pulse" />
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              STRATA
            </h1>
          </div>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            AI-Driven Code Archaeology. Unearth the evolutionary macro eras hidden inside git repositories.
          </p>
        </header>

        {/* Input Control Form */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <form onSubmit={triggerAnalysis} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-300">Target Git Repository URL</label>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="url"
                required
                placeholder="https://github.com/psf/requests-html"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={statusState === 'QUEUED' || statusState === 'PROGRESS'}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={statusState === 'QUEUED' || statusState === 'PROGRESS'}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold px-6 py-3 rounded-lg transition flex items-center justify-center space-x-2 whitespace-nowrap shadow-lg shadow-amber-500/10"
              >
                {(statusState === 'QUEUED' || statusState === 'PROGRESS') ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Excavating...</span>
                  </>
                ) : (
                  <>
                    <GitBranch className="h-5 w-5" />
                    <span>Analyze Repository</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Dynamic Status Tracking Block */}
        {statusState !== 'IDLE' && (
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-6 flex items-start space-x-4">
            {statusState === 'SUCCESS' && <CheckCircle2 className="h-6 w-6 text-emerald-500 mt-0.5 flex-shrink-0" />}
            {statusState === 'FAILURE' && <AlertCircle className="h-6 w-6 text-rose-500 mt-0.5 flex-shrink-0" />}
            {(statusState === 'QUEUED' || statusState === 'PROGRESS') && <Terminal className="h-6 w-6 text-amber-500 mt-0.5 animate-bounce flex-shrink-0" />}
            
            <div className="space-y-1 w-full">
              <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase">System Pipeline Log</h3>
              <p className="text-slate-200 font-mono text-sm break-all">{statusMessage || "Job queued in Redis..."}</p>
              {jobId && <p className="text-xs text-slate-600 font-mono">Job ID: {jobId}</p>}
            </div>
          </section>
        )}

        {/* Interactive Era Timeline Render */}
        {statusState === 'SUCCESS' && eras.length > 0 && (
          <section className="space-y-8 animate-fadeIn">
            {/* Tab Navigation */}
            <div className="flex space-x-6 border-b border-slate-800 pb-2 overflow-x-auto whitespace-nowrap">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`text-lg font-bold pb-2 transition-colors flex items-center gap-2 ${activeTab === 'timeline' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Terminal className="h-5 w-5" /> Archeological Record
              </button>
              {fileStats && (
                <button
                  onClick={() => setActiveTab('topography')}
                  className={`text-lg font-bold pb-2 transition-colors flex items-center gap-2 ${activeTab === 'topography' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Network className="h-5 w-5" /> Codebase Topography
                </button>
              )}
              {survivalGuide && (
                <button
                  onClick={() => setActiveTab('guide')}
                  className={`text-lg font-bold pb-2 transition-colors flex items-center gap-2 ${activeTab === 'guide' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Shovel className="h-5 w-5" /> Survival Guide
                </button>
              )}
            </div>
            
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div className="flex justify-end">
                   <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-amber-500/50 transition">
                     <input type="checkbox" checked={newHireMode} onChange={e => setNewHireMode(e.target.checked)} className="accent-amber-500 w-4 h-4" />
                     New Hire Mode (Top Highlights)
                   </label>
                </div>
                <div className="relative border-l-2 border-slate-800 ml-4 md:ml-6 space-y-12">
                {displayEras.map((era, index) => (
                  <div key={index} className="relative pl-8 md:pl-10 group">
                  
                  {/* Timeline Indicator Node */}
                  <span className="absolute -left-[11px] top-1.5 bg-slate-950 border-2 border-amber-500 rounded-full w-5 h-5 flex items-center justify-center group-hover:bg-amber-500 transition-colors duration-300">
                    <span className="bg-amber-500 rounded-full w-2 h-2 group-hover:bg-slate-950" />
                  </span>
                  
                  {/* Card Content */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                        {era.era_title}
                      </h3>
                      <span className="inline-block bg-slate-950 text-slate-400 font-mono text-xs px-2.5 py-1 rounded border border-slate-800">
                        Layer {index + 1}
                      </span>
                    </div>

                    <div className="text-sm text-slate-400 space-y-3 font-normal leading-relaxed">
                      {era.narrative.split('\n\n').map((paragraph, pIdx) => (
                        <p key={pIdx}>{paragraph}</p>
                      ))}
                    </div>

                    {era.dominant_contributors && era.dominant_contributors.length > 0 && (
                      <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-800/60 text-xs text-slate-500">
                        <span className="font-semibold text-slate-400">Key Artifact Signatures:</span>
                        {era.dominant_contributors.map((author, aIdx) => (
                          <span key={aIdx} className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                            {author}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ))}
                </div>
              </div>
            )}

            {activeTab === 'topography' && fileStats && eras.length > 0 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
                  <div className="flex-1 mr-6">
                    <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-amber-500" /> Time Machine: <span className="text-amber-400">Era {sliderIndex + 1}</span> - {eras[sliderIndex]?.era_title}
                    </label>
                    <input 
                      type="range" 
                      min={0} 
                      max={eras.length - 1} 
                      value={sliderIndex} 
                      onChange={(e) => setSliderIndex(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                    />
                  </div>
                </div>
                <FileTreeGraph fileStats={fileStats} maxDate={interpolatedDate} />
              </div>
            )}

            {activeTab === 'guide' && survivalGuide && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 shadow-xl animate-fadeIn">
                <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    New Hire Survival Guide
                  </h2>
                  <button 
                    onClick={handleDownload} 
                    className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg transition shadow"
                  >
                    <Download className="h-4 w-4" /> Download .md
                  </button>
                </div>
                <div className="prose prose-invert prose-amber max-w-none text-slate-300">
                  <ReactMarkdown>{survivalGuide}</ReactMarkdown>
                </div>
              </div>
            )}
          </section>
        )}

      </div>
    </main>
  );
}