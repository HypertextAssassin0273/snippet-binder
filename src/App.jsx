import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Folder, FileCode, Plus, Save, Copy, 
  ExternalLink, Code, CheckCircle, Trash2, X, Edit2, 
  RefreshCw, Key, ChevronLeft, Menu
} from 'lucide-react';

// Custom Github Icon to bypass lucide-react export issues
const Github = ({ size = 24, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" width={size} height={size} 
    viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// ==========================================
// ⚙️ GITHUB CONFIGURATION
// ==========================================
const GITHUB_CONFIG = {
  OWNER: "HypertextAssassin0273",  // your username
  REPO: "snippet-binder",          // your repo name
  PATH: "data.json",               // The file where snippets will be saved
  BRANCH: "gh-pages"               // The branch to read/write from
};

const INITIAL_DB = { "My Snippets": [] };

const utf8ToBase64 = (str) => btoa(Array.from(new TextEncoder().encode(str), byte => String.fromCodePoint(byte)).join(""));
const base64ToUtf8 = (str) => new TextDecoder().decode(Uint8Array.from(atob(str), m => m.codePointAt(0)));

const getStoredToken = () => {
  try { return localStorage.getItem('gh_token') || ""; } catch { return ""; }
};

// ==========================================
// 🧩 COMPONENTS
// ==========================================

const GistEmbed = ({ url }) => {
  const gistUrl = url.includes('.js') ? url : `${url}.js`;
  const iframeSrc = `
    <html>
      <head>
        <base target="_blank">
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #010409; }
          .gist .gist-file { border-radius: 8px; border: 1px solid #30363d !important; margin: 0 !important; }
          .gist .gist-data { background-color: #0d1117 !important; border-bottom: 1px solid #30363d !important; }
          .gist .blob-wrapper table { color: #c9d1d9 !important; }
          .gist .blob-num { color: #484f58 !important; border-right: 1px solid #30363d !important; }
          .gist .pl-s { color: #a5d6ff !important; }
          .gist .pl-k { color: #ff7b72 !important; }
          .gist .pl-en { color: #d2a8ff !important; }
          .gist .gist-meta { background-color: #161b22 !important; color: #8b949e !important; font-size: 12px !important; border-radius: 0 0 8px 8px; }
          .gist .gist-meta a { color: #58a6ff !important; }
        </style>
      </head>
      <body><script src="${gistUrl}"></script></body>
    </html>
  `;
  return <iframe srcDoc={iframeSrc} className="w-full h-full border-none rounded-lg" title="GitHub Gist" />;
};

export default function App() {
  const [db, setDb] = useState(() => {
    try {
      const local = localStorage.getItem('local_binder_db');
      return local ? JSON.parse(local) : INITIAL_DB;
    } catch { return INITIAL_DB; }
  });
  
  const [activeSection, setActiveSection] = useState(Object.keys(db)[0] || "");
  const [activeSnippet, setActiveSnippet] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Layout States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [middlePaneWidth, setMiddlePaneWidth] = useState(320); // Initial 320px
  const [isDragging, setIsDragging] = useState(false);

  // GitHub Sync States
  const [ghToken, setGhToken] = useState(getStoredToken);
  const [fileSha, setFileSha] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [syncOnlyShared, setSyncOnlyShared] = useState(false);
  const [lastSyncedDb, setLastSyncedDb] = useState("");

  // Modals / Form States
  const [isAdding, setIsAdding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sectionPromptOpen, setSectionPromptOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingSnippetId, setEditingSnippetId] = useState(null);
  const [editingCollectionName, setEditingCollectionName] = useState(null);
  const [newCollectionNameInput, setNewCollectionNameInput] = useState("");
  const [deleteCollectionConfirm, setDeleteCollectionConfirm] = useState(null);

  const [formSection, setFormSection] = useState(activeSection);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("code");
  const [formLang, setFormLang] = useState("javascript");
  const [formTags, setFormTags] = useState("");
  const [formContent, setFormContent] = useState("");

  useEffect(() => {
    localStorage.setItem('local_binder_db', JSON.stringify(db));
  }, [db]);

  // Handle Drag Resizing
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e) => {
      const sidebarWidth = isSidebarOpen ? 256 : 0;
      const newWidth = e.clientX - sidebarWidth;
      if (newWidth >= 200 && newWidth <= 600) setMiddlePaneWidth(newWidth);
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isSidebarOpen]);

  // Calculate Payload & Determine if changes exist
  const payloadDb = useMemo(() => {
    if (!syncOnlyShared) return db;
    const payload = {};
    Object.keys(db).forEach(sec => {
      const shared = db[sec].filter(s => s.tags.map(t => t.toLowerCase()).includes('shared'));
      if (shared.length > 0) payload[sec] = shared;
    });
    return payload;
  }, [db, syncOnlyShared]);

  // FIX: Normalized comparison to prevent false positives on initial load
  const hasChanges = useMemo(() => {
    return lastSyncedDb !== "" && JSON.stringify(payloadDb) !== lastSyncedDb;
  }, [payloadDb, lastSyncedDb]);

  useEffect(() => {
    const initFetch = async () => {
      if (GITHUB_CONFIG.OWNER === "your-username") return;
      const token = getStoredToken();
      try {
        setSyncStatus("Loading live data...");
        // Fetch without token if missing, allowing public read access.
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.PATH}?ref=${GITHUB_CONFIG.BRANCH}`, { headers });
        
        if (res.status === 404) {
          setSyncStatus("No existing data found. Ready to push.");
          setLastSyncedDb(JSON.stringify(payloadDb)); // Initialize with current payload
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch from GitHub.");
        
        const data = await res.json();
        setFileSha(data.sha);
        
        const decodedString = base64ToUtf8(data.content);
        const decodedDb = JSON.parse(decodedString);
        
        // Merge strategy: Overwrite local with remote on fetch to ensure visitors see latest.
        setDb(decodedDb);
        // FIX: Stringify the parsed object to strip arbitrary formatting differences
        setLastSyncedDb(JSON.stringify(decodedDb));
        setActiveSection(prev => prev || Object.keys(decodedDb)[0] || "");
        setSyncStatus("");
      } catch (err) {
        console.error(err);
        setSyncStatus(err.message);
      }
    };
    initFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToGitHub = async () => {
    if (!ghToken) return alert("Please provide a GitHub Token first.");
    setIsSyncing(true);
    setSyncStatus("Syncing...");
    
    try {
      const payloadString = JSON.stringify(payloadDb, null, 2);
      const content = utf8ToBase64(payloadString);
      const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.PATH}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${ghToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: syncOnlyShared ? 'Update shared snippets via DevBinder' : 'Update all snippets via DevBinder',
          content,
          branch: GITHUB_CONFIG.BRANCH,
          ...(fileSha && { sha: fileSha }) 
        })
      });

      // FIX: Handle Concurrency (Stalemate)
      if (res.status === 409) {
        throw new Error("Conflict: Another user updated the snippets. Please refresh the page to get the latest data before pushing.");
      }
      if (!res.ok) throw new Error("Failed to save. Check permissions or conflicts.");
      
      const data = await res.json();
      setFileSha(data.content.sha); 
      // FIX: Update tracking string with strict unformatted JSON for accurate comparison
      setLastSyncedDb(JSON.stringify(payloadDb)); 
      setSyncStatus(`Successfully pushed to ${GITHUB_CONFIG.BRANCH}!`);
      setTimeout(() => setSyncStatus(""), 4000);
    } catch (err) {
      console.error(err);
      setSyncStatus(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const prismCss = document.createElement('link');
    prismCss.rel = 'stylesheet';
    prismCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
    document.head.appendChild(prismCss);
    const prismJs = document.createElement('script');
    prismJs.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
    prismJs.async = true;
    prismJs.onload = () => window.Prism?.highlightAll();
    document.body.appendChild(prismJs);
    return () => { document.head.removeChild(prismCss); document.body.removeChild(prismJs); };
  }, []);

  useEffect(() => {
    if (activeSnippet && activeSnippet.type === 'code' && window.Prism) window.Prism.highlightAll();
  }, [activeSnippet]);

  const sections = Object.keys(db);
  const filteredSnippets = (db[activeSection] || []).filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q)) || (s.content && s.content.toLowerCase().includes(q));
  });

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openEditSnippetModal = () => {
    if (!activeSnippet) return;
    setFormTitle(activeSnippet.title);
    setFormType(activeSnippet.type);
    setFormLang(activeSnippet.language);
    setFormTags(activeSnippet.tags.join(', '));
    setFormContent(activeSnippet.type === 'code' ? activeSnippet.content : activeSnippet.url);
    setFormSection(activeSection);
    setEditingSnippetId(activeSnippet.id);
    setIsAdding(true);
  };

  const handleSaveSnippet = (e) => {
    e.preventDefault();
    const snippetData = {
      id: editingSnippetId || Date.now().toString(),
      title: formTitle,
      type: formType,
      language: formLang,
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      ...(formType === 'code' ? { content: formContent } : { url: formContent })
    };

    setDb(prev => {
      const newDb = { ...prev };
      if (editingSnippetId) {
        const oldSection = Object.keys(newDb).find(sec => newDb[sec].some(s => s.id === editingSnippetId));
        if (oldSection) newDb[oldSection] = newDb[oldSection].filter(s => s.id !== editingSnippetId);
      }
      if (!newDb[formSection]) newDb[formSection] = [];
      if (editingSnippetId && activeSection === formSection) {
        const index = prev[formSection]?.findIndex(s => s.id === editingSnippetId);
        if (index !== undefined && index >= 0) newDb[formSection].splice(index, 0, snippetData);
        else newDb[formSection].push(snippetData);
      } else {
         newDb[formSection].push(snippetData);
      }
      return newDb;
    });

    setActiveSection(formSection);
    setActiveSnippet(snippetData);
    setIsAdding(false);
    setEditingSnippetId(null);
    setFormTitle(""); setFormContent(""); setFormTags("");
  };

  const handleAddSection = (e) => {
    e.preventDefault();
    const name = newSectionName.trim();
    if (name && !db[name]) {
      setDb(prev => ({ ...prev, [name]: [] }));
      setActiveSection(name);
    }
    setSectionPromptOpen(false);
    setNewSectionName("");
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setDb(prev => {
        const newDb = { ...prev };
        newDb[activeSection] = newDb[activeSection].filter(s => s.id !== deleteConfirmId);
        if (newDb[activeSection].length === 0) {
          delete newDb[activeSection];
          setActiveSection(Object.keys(newDb)[0] || "");
        }
        return newDb;
      });
      setActiveSnippet(null);
      setDeleteConfirmId(null);
    }
  };

  const handleRenameCollectionSubmit = (e) => {
    e.preventDefault();
    const oldName = editingCollectionName;
    const newName = newCollectionNameInput.trim();
    if (newName && newName !== oldName && !db[newName]) {
      setDb(prev => {
        const newDb = { ...prev };
        newDb[newName] = newDb[oldName];
        delete newDb[oldName];
        return newDb;
      });
      if (activeSection === oldName) setActiveSection(newName);
    }
    setEditingCollectionName(null);
  };

  const confirmDeleteCollection = () => {
    if (deleteCollectionConfirm) {
      setDb(prev => {
        const newDb = { ...prev };
        delete newDb[deleteCollectionConfirm];
        return newDb;
      });
      if (activeSection === deleteCollectionConfirm) {
        const remaining = Object.keys(db).filter(k => k !== deleteCollectionConfirm);
        setActiveSection(remaining[0] || "");
        setActiveSnippet(null);
      }
      setDeleteCollectionConfirm(null);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0d1117] text-[#c9d1d9] font-sans selection:bg-[#1f6feb] selection:text-white overflow-hidden">
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #484f58; }
        .prism-code-override pre { margin: 0 !important; border-radius: 0.5rem !important; background: #010409 !important; border: 1px solid #30363d; height: 100%; }
      `}</style>

      {/* Global Drag Overlay to prevent iframe capturing mouse events */}
      {isDragging && <div className="fixed inset-0 z-50 cursor-col-resize" />}

      {/* LEFT PANE: Sections (Folders) */}
      <div 
        className={`${isSidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 bg-[#161b22] flex flex-col transition-all duration-300 relative border-r border-[#30363d]`}
      >
        {/* Toggle Collapse Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="absolute -right-3 top-5 z-20 bg-[#30363d] hover:bg-[#484f58] border border-[#21262d] rounded-full p-1 text-white shadow-md"
          title="Toggle Sidebar"
        >
          {isSidebarOpen ? <ChevronLeft size={14}/> : <Menu size={14}/>}
        </button>

        <div className={`flex flex-col h-full overflow-hidden ${!isSidebarOpen && 'opacity-0 pointer-events-none'}`}>
          <div className="p-4 border-b border-[#30363d] flex items-center justify-between min-w-[255px]">
            <div className="flex items-center gap-2 text-white font-semibold">
              <FileCode size={20} className="text-[#58a6ff]" />
              <span>DevBinder</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto py-3 min-w-[255px]">
            <div className="px-4 text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Collections</div>
            <nav className="space-y-0.5 px-2">
              {sections.map(section => (
                <div key={section} className="relative group">
                  <button
                    onClick={() => { setActiveSection(section); setActiveSnippet(null); }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${activeSection === section ? 'bg-[#1f6feb] text-white' : 'text-[#c9d1d9] hover:bg-[#30363d]'}`}
                  >
                    <Folder size={16} className={activeSection === section ? "text-white" : "text-[#8b949e] flex-shrink-0"} />
                    <span className="truncate flex-1 text-left">{section}</span>
                  </button>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[#161b22] px-1 rounded shadow-sm">
                    <button onClick={(e) => { e.stopPropagation(); setEditingCollectionName(section); setNewCollectionNameInput(section); }} className="p-1 text-[#8b949e] hover:text-white hover:bg-[#30363d] rounded transition-colors"><Edit2 size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteCollectionConfirm(section); }} className="p-1 text-[#8b949e] hover:text-[#f85149] hover:bg-[#30363d] rounded transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-[#30363d] space-y-2 min-w-[255px]">
            <button onClick={() => setSectionPromptOpen(true)} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-[#c9d1d9] bg-[#21262d] border border-[#30363d] rounded-md hover:bg-[#30363d] transition-colors"><Plus size={16} /> New Collection</button>
            <button onClick={() => setIsExporting(true)} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[#238636] border border-[#2ea043] rounded-md hover:bg-[#2ea043] transition-colors"><RefreshCw size={16} /> Sync Config</button>
          </div>
        </div>
      </div>

      {/* MIDDLE PANE: Snippet List */}
      <div 
        className="flex-shrink-0 bg-[#0d1117] flex flex-col"
        style={{ width: `${middlePaneWidth}px` }}
      >
        <div className="p-4 border-b border-[#30363d] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold truncate pr-2">{activeSection || "Snippets"}</h2>
            <button onClick={() => { setFormSection(activeSection || sections[0] || ""); setIsAdding(true); }} className="p-1.5 text-[#8b949e] hover:text-white hover:bg-[#30363d] rounded-md transition-colors"><Plus size={16} /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[#8b949e]" size={14} />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#010409] border border-[#30363d] text-[#c9d1d9] text-sm rounded-md pl-9 pr-3 py-1.5 focus:outline-none focus:border-[#58a6ff] transition-all"/>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredSnippets.length === 0 ? (
            <div className="p-8 text-center text-[#8b949e] text-sm">No snippets found.</div>
          ) : (
            <ul className="divide-y divide-[#21262d]">
              {filteredSnippets.map(snippet => (
                <li key={snippet.id}>
                  <button onClick={() => setActiveSnippet(snippet)} className={`w-full text-left p-4 hover:bg-[#161b22] transition-colors flex items-start gap-3 ${activeSnippet?.id === snippet.id ? 'bg-[#161b22] border-l-2 border-[#58a6ff]' : 'border-l-2 border-transparent'}`}>
                    <div className="mt-0.5 text-[#8b949e]">{snippet.type === 'gist' ? <Github size={16} /> : <Code size={16} />}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white text-sm truncate mb-1">{snippet.title}</h3>
                      <div className="flex gap-1.5 flex-wrap">
                        {snippet.tags.slice(0, 3).map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1f6feb]/10 text-[#58a6ff] border border-[#1f6feb]/20">{tag}</span>)}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* DRAG RESIZER */}
      <div 
        onMouseDown={() => setIsDragging(true)}
        className="w-1.5 cursor-col-resize hover:bg-[#58a6ff] bg-transparent border-r border-[#30363d] z-10 transition-colors"
      />

      {/* RIGHT PANE: Editor / Viewer */}
      <div className="flex-1 bg-[#0d1117] flex flex-col overflow-hidden relative">
        {activeSnippet ? (
          <>
            <div className="p-4 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]">
              <div>
                <h1 className="text-lg font-semibold text-white">{activeSnippet.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-mono text-[#8b949e] uppercase flex items-center gap-1">{activeSnippet.type === 'gist' ? <Github size={12}/> : <Code size={12}/>}{activeSnippet.language}</span>
                  <div className="flex gap-1.5">{activeSnippet.tags.map(tag => <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-[#21262d] text-[#c9d1d9] border border-[#30363d]">{tag}</span>)}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={openEditSnippetModal} className="p-2 text-[#8b949e] hover:text-white hover:bg-[#30363d] rounded-md transition-colors"><Edit2 size={18} /></button>
                <button onClick={() => handleCopy(activeSnippet.type === 'code' ? activeSnippet.content : activeSnippet.url)} className="p-2 text-[#8b949e] hover:text-white hover:bg-[#30363d] rounded-md transition-colors">{copied ? <CheckCircle size={18} className="text-[#3fb950]" /> : <Copy size={18} />}</button>
                <button onClick={() => setDeleteConfirmId(activeSnippet.id)} className="p-2 text-[#f85149] hover:bg-[#f85149]/10 rounded-md transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-[#0d1117]">
              {activeSnippet.type === 'code' ? (
                <div className="prism-code-override h-full">
                  <pre className="h-full p-4 overflow-auto text-sm font-mono"><code className={`language-${activeSnippet.language}`}>{activeSnippet.content}</code></pre>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="bg-[#161b22] px-4 py-2 flex items-center gap-2 border border-[#30363d] border-b-0 rounded-t-lg">
                    <Github size={16} className="text-[#c9d1d9]" />
                    <span className="text-xs text-[#8b949e] font-mono truncate flex-grow">{activeSnippet.url}</span>
                    <a href={activeSnippet.url} target="_blank" rel="noreferrer" className="text-[#58a6ff] hover:underline text-xs flex items-center gap-1">Open <ExternalLink size={12} /></a>
                  </div>
                  <div className="flex-1 w-full bg-[#010409] rounded-b-lg border border-[#30363d]"><GistEmbed url={activeSnippet.url} /></div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8b949e]">
            <Code size={48} className="mb-4 opacity-20" />
            <p className="text-lg">Select a snippet to view</p>
          </div>
        )}
      </div>

      {/* EXPORT / SAVE TO REPO MODAL */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#161b22] w-full max-w-3xl rounded-xl shadow-2xl border border-[#30363d] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 flex justify-between items-center border-b border-[#30363d]">
               <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Github size={18}/> GitHub Synchronization</h3>
               <button onClick={() => setIsExporting(false)} className="text-[#8b949e] hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="p-6 flex-grow overflow-y-auto flex flex-col text-[#c9d1d9] gap-6">
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-5">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2"><RefreshCw size={16} /> Direct API Sync (to {GITHUB_CONFIG.BRANCH})</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8b949e] mb-1">GitHub Personal Access Token (PAT)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Key className="absolute left-3 top-2.5 text-[#8b949e]" size={14} />
                        <input 
                          type="password" 
                          value={ghToken}
                          onChange={(e) => { setGhToken(e.target.value); localStorage.setItem('gh_token', e.target.value); }}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          className="w-full bg-[#010409] border border-[#30363d] rounded-md pl-9 pr-3 py-1.5 text-sm text-white focus:border-[#58a6ff] focus:outline-none"
                        />
                      </div>
                      <button 
                        onClick={saveToGitHub}
                        disabled={isSyncing || !ghToken || !hasChanges}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors border ${
                          isSyncing || !ghToken || !hasChanges 
                            ? 'bg-[#21262d] text-[#8b949e] border-[#30363d] cursor-not-allowed' 
                            : 'bg-[#238636] hover:bg-[#2ea043] text-white border-[#2ea043]'
                        }`}
                      >
                        {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} 
                        {hasChanges ? 'Push Changes' : 'Up to date'}
                      </button>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2">
                      <input 
                        type="checkbox" id="syncShared" checked={syncOnlyShared} onChange={(e) => setSyncOnlyShared(e.target.checked)}
                        className="rounded border-[#30363d] bg-[#010409] text-[#58a6ff]"
                      />
                      <label htmlFor="syncShared" className="text-sm text-[#c9d1d9] cursor-pointer">
                        Only push snippets with the tag <span className="bg-[#21262d] px-1.5 py-0.5 rounded text-[#58a6ff] text-xs border border-[#30363d]">shared</span>
                      </label>
                    </div>
                  </div>
                  {syncStatus && <div className={`p-3 rounded-md text-sm ${syncStatus.includes('Error') ? 'bg-red-900/30 text-red-400 border border-red-900' : 'bg-[#238636]/20 text-[#3fb950] border border-[#2ea043]/30'}`}>{syncStatus}</div>}
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-5">
                <h4 className="text-white font-medium mb-2">Manual Fallback</h4>
                <div className="relative h-48">
                  <textarea readOnly className="w-full h-full bg-[#010409] border border-[#30363d] rounded-md p-4 font-mono text-xs text-[#58a6ff] focus:outline-none resize-none" value={JSON.stringify(payloadDb, null, 2)} />
                  <button onClick={() => handleCopy(JSON.stringify(payloadDb, null, 2))} className="absolute top-4 right-4 bg-[#30363d] hover:bg-[#484f58] text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors border border-[#484f58]">{copied ? <CheckCircle size={14} /> : <Copy size={14} />} Copy JSON</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS (Add/Edit, Section, Delete) */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#161b22] w-full max-w-2xl rounded-xl shadow-2xl border border-[#30363d] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 flex justify-between items-center border-b border-[#30363d]">
               <h3 className="text-lg font-semibold text-white">{editingSnippetId ? 'Edit Snippet' : 'Add Snippet'}</h3>
               <button onClick={() => { setIsAdding(false); setEditingSnippetId(null); }} className="text-[#8b949e] hover:text-white"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto">
              <form onSubmit={handleSaveSnippet} className="p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1"><label className="block text-sm font-medium text-[#c9d1d9] mb-1">Title</label><input required type="text" value={formTitle} onChange={e=>setFormTitle(e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-md p-2 text-sm text-white focus:border-[#58a6ff] focus:outline-none" /></div>
                  <div className="w-1/3"><label className="block text-sm font-medium text-[#c9d1d9] mb-1">Collection</label><select value={formSection} onChange={e=>setFormSection(e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-md p-2 text-sm text-white focus:border-[#58a6ff] focus:outline-none">{sections.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1/3"><label className="block text-sm font-medium text-[#c9d1d9] mb-1">Source Type</label><select value={formType} onChange={e=>setFormType(e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-md p-2 text-sm text-white focus:border-[#58a6ff] focus:outline-none"><option value="code">Raw Code</option><option value="gist">GitHub Gist URL</option></select></div>
                  <div className="w-1/3"><label className="block text-sm font-medium text-[#c9d1d9] mb-1">Language</label><input type="text" value={formLang} onChange={e=>setFormLang(e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-md p-2 text-sm text-white focus:border-[#58a6ff] focus:outline-none" /></div>
                  <div className="w-1/3"><label className="block text-sm font-medium text-[#c9d1d9] mb-1">Tags (comma sep)</label><input type="text" value={formTags} onChange={e=>setFormTags(e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-md p-2 text-sm text-white focus:border-[#58a6ff] focus:outline-none" /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#c9d1d9] mb-1">{formType === 'code' ? 'Code Content' : 'Gist URL'}</label>
                  {formType === 'code' ? <textarea required value={formContent} onChange={e=>setFormContent(e.target.value)} className="w-full bg-[#010409] border border-[#30363d] rounded-md p-3 font-mono text-sm h-64 text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none resize-y" /> : <input required type="url" value={formContent} onChange={e=>setFormContent(e.target.value)} className="w-full bg-[#010409] border border-[#30363d] rounded-md p-2 font-mono text-sm text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none" />}
                </div>
                <div className="flex justify-end pt-4 gap-3 border-t border-[#30363d] mt-4">
                  <button type="button" onClick={() => { setIsAdding(false); setEditingSnippetId(null); }} className="px-4 py-2 text-sm font-medium text-[#c9d1d9] bg-[#21262d] border border-[#30363d] rounded-md hover:bg-[#30363d] transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#1f6feb] border border-[#1f6feb] rounded-md hover:bg-[#388bfd] transition-colors flex items-center gap-2"><Save size={16} /> Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Simple Modals omitted for brevity - logic remains identical */}
      {sectionPromptOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-[#161b22] w-full max-w-sm rounded-xl shadow-2xl border border-[#30363d] overflow-hidden"><div className="px-6 py-4 border-b border-[#30363d]"><h3 className="text-lg font-semibold text-white">New Collection</h3></div><form onSubmit={handleAddSection} className="p-6"><input autoFocus required type="text" value={newSectionName} onChange={e=>setNewSectionName(e.target.value)} className="w-full bg-[#010409] border border-[#30363d] rounded-md p-2 text-sm text-white focus:border-[#58a6ff] focus:outline-none mb-6" /><div className="flex justify-end gap-3"><button type="button" onClick={() => setSectionPromptOpen(false)} className="px-4 py-2 text-sm font-medium text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] rounded-md">Cancel</button><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#1f6feb] hover:bg-[#388bfd] rounded-md">Create</button></div></form></div></div>
      )}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-[#161b22] w-full max-w-sm rounded-xl shadow-2xl border border-[#30363d] overflow-hidden"><div className="px-6 py-4 border-b border-[#30363d]"><h3 className="text-lg font-semibold text-white">Delete Snippet</h3></div><div className="p-6"><p className="text-[#c9d1d9] mb-6 text-sm">Are you sure?</p><div className="flex justify-end gap-3"><button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm font-medium text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] rounded-md">Cancel</button><button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-[#da3633] hover:bg-[#f85149] rounded-md">Delete</button></div></div></div></div>
      )}
      {editingCollectionName && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-[#161b22] w-full max-w-sm rounded-xl shadow-2xl border border-[#30363d] overflow-hidden"><div className="px-6 py-4 border-b border-[#30363d]"><h3 className="text-lg font-semibold text-white">Rename</h3></div><form onSubmit={handleRenameCollectionSubmit} className="p-6"><input autoFocus required type="text" value={newCollectionNameInput} onChange={e=>setNewCollectionNameInput(e.target.value)} className="w-full bg-[#010409] border border-[#30363d] rounded-md p-2 text-sm text-white focus:border-[#58a6ff] focus:outline-none mb-6" /><div className="flex justify-end gap-3"><button type="button" onClick={() => setEditingCollectionName(null)} className="px-4 py-2 text-sm font-medium text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] rounded-md">Cancel</button><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#1f6feb] hover:bg-[#388bfd] rounded-md">Rename</button></div></form></div></div>
      )}
      {deleteCollectionConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-[#161b22] w-full max-w-sm rounded-xl shadow-2xl border border-[#30363d] overflow-hidden"><div className="px-6 py-4 border-b border-[#30363d]"><h3 className="text-lg font-semibold text-white">Delete Collection</h3></div><div className="p-6"><p className="text-[#f85149] mb-6 text-xs font-semibold">Warning: This deletes all inside snippets.</p><div className="flex justify-end gap-3"><button onClick={() => setDeleteCollectionConfirm(null)} className="px-4 py-2 text-sm font-medium text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] rounded-md">Cancel</button><button onClick={confirmDeleteCollection} className="px-4 py-2 text-sm font-medium text-white bg-[#da3633] hover:bg-[#f85149] rounded-md">Delete</button></div></div></div></div>
      )}
    </div>
  );
}
