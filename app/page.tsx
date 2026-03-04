'use client';

import { Copy, Download, FileCode2, FolderTree, Play, Workflow } from 'lucide-react';
import JSZip from 'jszip';
import { useMemo, useState } from 'react';
import { SAMPLE_RPG } from '@/lib/sample';
import { AgentStep, FileTreeNode, MigrationResult } from '@/types/migration';

type Tab = 'pipeline' | 'tree' | 'viewer';

const copyText = async (text: string) => navigator.clipboard.writeText(text);

export default function HomePage() {
  const [rpgSource, setRpgSource] = useState('');
  const [tab, setTab] = useState<Tab>('pipeline');
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('README.md');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filesMap = result?.filesMap ?? {};
  const sortedPaths = useMemo(() => Object.keys(filesMap).sort(), [filesMap]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  };

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rpgSource })
      });
      if (!res.ok) throw new Error('Unable to run migration pipeline.');
      const data = (await res.json()) as MigrationResult;
      setResult(data);
      const defaultFile = Object.keys(data.filesMap)[0];
      if (defaultFile) setSelectedFile(defaultFile);
      showToast('Migration completed successfully.');
    } catch (e) {
      showToast(String(e));
    } finally {
      setLoading(false);
    }
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    sortedPaths.forEach((path) => zip.file(path, filesMap[path]));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'migration-studio-generated-project.zip';
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('ZIP downloaded.');
  };

  const currentContent = filesMap[selectedFile] ?? '';

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-2xl bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">RPG → Spring Boot Migration Studio</h1>
              <p className="text-sm text-slate-600">Agentic RAG pipeline demo with DeepSeek-backed steps and deterministic mock fallback.</p>
            </div>
            <button
              onClick={run}
              disabled={!rpgSource.trim() || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-500 disabled:opacity-40"
            >
              <Play size={16} /> Run Migration
            </button>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">RPG Source</h2>
              <div className="flex gap-2">
                <button onClick={() => setRpgSource(SAMPLE_RPG)} className="rounded-lg border px-3 py-1 text-sm">Load Sample</button>
                <button onClick={() => copyText(rpgSource).then(() => showToast('RPG source copied.'))} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-sm"><Copy size={14}/>Copy</button>
              </div>
            </div>
            <textarea
              value={rpgSource}
              onChange={(e) => setRpgSource(e.target.value)}
              className="h-[620px] w-full rounded-xl border bg-slate-950 p-4 font-mono text-sm text-emerald-200"
              placeholder="Paste RPG source here..."
            />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-soft">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                {[
                  { key: 'pipeline', label: 'Agent Pipeline', icon: Workflow },
                  { key: 'tree', label: 'Project Tree', icon: FolderTree },
                  { key: 'viewer', label: 'File Viewer', icon: FileCode2 }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key as Tab)}
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-sm ${tab === key ? 'bg-indigo-600 text-white' : 'border'}`}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
              <button disabled={!result} onClick={downloadZip} className="inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-sm disabled:opacity-30">
                <Download size={14} /> Download Project as ZIP
              </button>
            </div>

            {loading && <SkeletonPipeline />}
            {!loading && tab === 'pipeline' && <PipelineView steps={result?.steps ?? []} onCopy={showToast} />}
            {!loading && tab === 'tree' && <TreeView nodes={result?.tree ?? []} onSelect={setSelectedFile} />}
            {!loading && tab === 'viewer' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-mono">{selectedFile || 'No file selected'}</span>
                  <div className="flex gap-2">
                    <button onClick={() => copyText(currentContent).then(() => showToast('File content copied.'))} className="rounded border px-2 py-1">Copy</button>
                    <button
                      onClick={() => {
                        const blob = new Blob([currentContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = selectedFile.split('/').pop() ?? 'file.txt';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="rounded border px-2 py-1"
                    >
                      Download
                    </button>
                  </div>
                </div>
                <div className="h-[560px] overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-100">
                  <pre>{currentContent || 'Run migration to view generated source code.'}</pre>
                </div>
                {sortedPaths.length > 0 && (
                  <select value={selectedFile} onChange={(e) => setSelectedFile(e.target.value)} className="w-full rounded-lg border p-2 text-sm">
                    {sortedPaths.map((path) => <option key={path} value={path}>{path}</option>)}
                  </select>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {toast && <div className="fixed bottom-5 right-5 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
    </main>
  );
}

function PipelineView({ steps, onCopy }: { steps: AgentStep[]; onCopy: (message: string) => void }) {
  if (!steps.length) return <div className="rounded-xl border border-dashed p-6 text-sm text-slate-500">Run migration to see the staged agent pipeline.</div>;

  return (
    <div className="h-[620px] space-y-3 overflow-auto pr-1">
      {steps.map((step) => (
        <details key={step.id} open className="rounded-xl border bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold">{step.id}. {step.name} <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">{step.status}</span></summary>
          <p className="mt-2 text-xs text-slate-600">{step.purpose}</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <div className="rounded-lg bg-white p-2">
              <div className="mb-1 flex items-center justify-between text-xs font-medium"><span>INPUT</span><button className="rounded border px-2" onClick={() => copyText(JSON.stringify(step.input, null, 2)).then(() => onCopy('Input copied.'))}>Copy</button></div>
              <pre className="max-h-52 overflow-auto text-xs">{JSON.stringify(step.input, null, 2)}</pre>
            </div>
            <div className="rounded-lg bg-white p-2">
              <div className="mb-1 flex items-center justify-between text-xs font-medium"><span>OUTPUT</span><button className="rounded border px-2" onClick={() => copyText(JSON.stringify(step.output, null, 2)).then(() => onCopy('Output copied.'))}>Copy</button></div>
              <pre className="max-h-52 overflow-auto text-xs">{JSON.stringify(step.output ?? {}, null, 2)}</pre>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function TreeView({ nodes, onSelect }: { nodes: FileTreeNode[]; onSelect: (path: string) => void }) {
  if (!nodes.length) return <div className="rounded-xl border border-dashed p-6 text-sm text-slate-500">Project tree appears after pipeline completion.</div>;
  return <div className="h-[620px] overflow-auto rounded-xl border bg-slate-50 p-3">{nodes.map((node) => <TreeNode key={node.path} node={node} onSelect={onSelect} depth={0} />)}</div>;
}

function TreeNode({ node, onSelect, depth }: { node: FileTreeNode; onSelect: (path: string) => void; depth: number }) {
  return (
    <div style={{ marginLeft: depth * 12 }} className="text-sm">
      {node.type === 'file' ? (
        <button onClick={() => onSelect(node.path)} className="py-0.5 text-indigo-700 hover:underline">📄 {node.name}</button>
      ) : (
        <details open>
          <summary className="cursor-pointer py-0.5">📁 {node.name}</summary>
          <div>{node.children?.map((child) => <TreeNode key={child.path} node={child} onSelect={onSelect} depth={depth + 1} />)}</div>
        </details>
      )}
    </div>
  );
}

function SkeletonPipeline() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="h-24 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}
