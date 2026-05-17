'use client';

import { useState, useEffect } from 'react';
import { Shovel, GitBranch, Terminal, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

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

  // Polling hook to query the FastAPI backend status endpoint
  useEffect(() => {
    if (!jobId || statusState === 'SUCCESS' || statusState === 'FAILURE') return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/status/${jobId}`);
        const data = await res.json();

        if (data.state === 'PROGRESS') {
          setStatusState('PROGRESS');
          setStatusMessage(data.status || 'Excavating repository layers...');
        } else if (data.state === 'SUCCESS') {
          setStatusState('SUCCESS');
          setEras(data.result.eras);
          clearInterval(pollInterval);
        } else if (data.state === 'FAILURE') {
          setStatusState('FAILURE');
          setStatusMessage(data.error || 'The dig site collapsed due to an infrastructure error.');
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Error polling job status:", err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, statusState]);

  const triggerAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setStatusState('QUEUED');
    setStatusMessage('Sending excavation requests to backend workers...');
    setEras([]);
    setJobId(null);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/analyze', {
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
            <h2 className="text-xl font-bold border-b border-slate-800 pb-2 text-amber-400 flex items-center gap-2">
              <Terminal className="h-5 w-5" /> Code Stratum Archeological Record
            </h2>
            
            <div className="relative border-l-2 border-slate-800 ml-4 md:ml-6 space-y-12">
              {eras.map((era, index) => (
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
          </section>
        )}

      </div>
    </main>
  );
}