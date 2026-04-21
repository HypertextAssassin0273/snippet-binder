import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Folder, FileCode, Plus, Save, Copy, 
  ExternalLink, Code, CheckCircle, Trash2, X, Edit2, 
  RefreshCw, Key, ChevronLeft, Menu, Sun, Moon, Share2
} from 'lucide-react';

// Custom Github Icon
const Github = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
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

// ==========================================
// 💾 INDEXED-DB STORAGE WRAPPER
// ==========================================
const initDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open('DevBinder', 1);
  req.onupgradeneeded = () => req.result.createObjectStore('data');
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const getLocalDb = async () => {
  const db = await initDB();
  return new Promise(resolve => {
    const req = db.transaction('data').objectStore('data').get('snippets');
    req.onsuccess = () => resolve(req.result);
  });
};

const setLocalDb = async (val) => {
  const db = await initDB();
  const tx = db.transaction('data', 'readwrite');
  tx.objectStore('data').put(val, 'snippets');
  return new Promise(resolve => { tx.oncomplete = resolve; });
};

const INITIAL_DB = { "My Snippets": [] };
const utf8ToBase64 = (str) => btoa(Array.from(new TextEncoder().encode(str), byte => String.fromCodePoint(byte)).join(""));
const getStoredToken = () => { try { return localStorage.getItem('gh_token') || ""; } catch { return ""; } };

// ==========================================
// 🧩 GIST EMBED COMPONENT (Restored)
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
      <body>
        <script src="${gistUrl}"></script>
      </body>
    </html>
  `;
  return (
    <iframe
      srcDoc={iframeSrc}
      className="w-full h-full border-none rounded-lg min-h-[400px]"
      title="GitHub Gist"
    />
  );
};

export default function App() {
  const [db, setDb] = useState(null); // null indicates DB is loading from IndexedDB
  const [activeSection, setActiveSection] = useState("");
  const [activeSnippet, setActiveSnippet] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Layout States
  const [isSidebarOpen, _setIsSidebarOpen] = useState(true);
  const [middlePaneWidth, setMiddlePaneWidth] = useState(320); 
  const [isDragging, setIsDragging] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark'; } catch { return 'dark'; }
  });

  // GitHub Sync States
  const [ghToken, setGhToken] = useState(getStoredToken);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [syncOnlyShared, setSyncOnlyShared] = useState(true);
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

  const [formSection, setFormSection] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("code");
  const [formLang, setFormLang] = useState("javascript");
  const [formTags, setFormTags] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formIsShared, setFormIsShared] = useState(false);

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Persist to IndexedDB on change
  useEffect(() => {
    if (db !== null) setLocalDb(db);
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

  // Calculate Shared Payload
  const payloadDb = useMemo(() => {
    if (!db) return {};
    if (!syncOnlyShared) return db;
    const payload = {};
    Object.keys(db).forEach(sec => {
      const shared = db[sec].filter(s => s.isShared);
      if (shared.length > 0) payload[sec] = shared;
    });
    return payload;
  }, [db, syncOnlyShared]);

  const hasChanges = useMemo(() => {
    return lastSyncedDb !== "" && JSON.stringify(payloadDb) !== lastSyncedDb;
  }, [payloadDb, lastSyncedDb]);

  // INITIALIZATION & MERGE LOGIC
  useEffect(() => {
    const initializeApp = async () => {
      // 1. Load Local Master Ledger
      let localData = await getLocalDb();
      if (!localData) localData = INITIAL_DB;
      
      setDb(localData);
      setActiveSection(Object.keys(localData)[0] || "");
      setFormSection(Object.keys(localData)[0] || "");

      // 2. Fetch Public Bulletin Board
      try {
        setSyncStatus("Fetching live data...");
        // Direct relative fetch. Falls back gracefully if running locally.
        const res = await fetch(GITHUB_CONFIG.PATH);
        
        if (res.status === 404) {
          setSyncStatus("No existing remote data found.");
          setLastSyncedDb(JSON.stringify(payloadDb)); 
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch deployed data.");
        
        const remoteData = await res.json();
        
        // 3. Upsert Logic: Merge Remote into Local
        const mergedDb = { ...localData };
        Object.keys(remoteData).forEach(section => {
          if (!mergedDb[section]) mergedDb[section] = [];
          
          remoteData[section].forEach(remoteSnippet => {
            // Ensure legacy snippets have isShared flag
            const incomingSnippet = { ...remoteSnippet, isShared: remoteSnippet.isShared !== false };
            
            const localIndex = mergedDb[section].findIndex(s => s.id === incomingSnippet.id);
            if (localIndex >= 0) {
              mergedDb[section][localIndex] = incomingSnippet; // Update
            } else {
              mergedDb[section].push(incomingSnippet); // Insert
            }
          });
        });

        setDb(mergedDb);
        setLastSyncedDb(JSON.stringify(remoteData));
        setSyncStatus("");
      } catch (err) {
        console.error("Fetch skipped (likely dev environment):", err.message);
        setSyncStatus("Local mode (Remote unreachable).");
        setLastSyncedDb(JSON.stringify(payloadDb)); // Prevent disabled button lock
      }
    };
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToGitHub = async () => {
    if (!ghToken || !GITHUB_CONFIG.OWNER || GITHUB_CONFIG.OWNER === "your-username") {
      return alert("Please update GITHUB_CONFIG and provide a Token.");
    }
    
    setIsSyncing(true);
    setSyncStatus("Syncing...");
    
    try {
      let currentSha = null;
      const shaRes = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.PATH}?ref=${GITHUB_CONFIG.BRANCH}`, {
        headers: { Authorization: `Bearer ${ghToken}` }
      });
      if (shaRes.ok) {
        const shaData = await shaRes.json();
        currentSha = shaData.sha;
      }

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
          ...(currentSha && { sha: currentSha }) 
        })
      });

      if (res.status === 409) throw new Error("Conflict: File modified elsewhere. Refresh needed.");
      if (!res.ok) throw new Error("Failed to save. Check repository permissions.");
      
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

  // PrismJS Init
  useEffect(() => {
    const prismCss = document.createElement('link');
    prismCss.rel = 'stylesheet';
    prismCss.href = theme === 'dark' 
      ? 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css'
      : 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css';
    document.head.appendChild(prismCss);
    
    const prismJs = document.createElement('script');
    prismJs.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
    prismJs.async = true;
    prismJs.onload = () => window.Prism?.highlightAll();
    document.body.appendChild(prismJs);
    
    return () => { document.head.removeChild(prismCss); document.body.removeChild(prismJs); };
  }, [theme]);

  useEffect(() => {
    if (activeSnippet && activeSnippet.type === 'code' && window.Prism) window.Prism.highlightAll();
  }, [activeSnippet]);

  // Loading Screen
  if (db === null) return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#0d1117] text-gray-500"><RefreshCw className="animate-spin mr-2"/> Loading Vault...</div>;

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
    setFormIsShared(activeSnippet.isShared || false);
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
      isShared: formIsShared,
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
    setFormTitle(""); setFormContent(""); setFormTags(""); setFormIsShared(false);
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
    <div className={`flex h-screen w-full font-sans overflow-hidden bg-white text-gray-900 dark:bg-[#0d1117] dark:text-[#c9d1d9] selection:bg-blue-200 dark:selection:bg-[#1f6feb] selection:text-black dark:selection:text-white transition-colors duration-200`}>
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .dark ::-webkit-scrollbar-thumb { background: #30363d; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #484f58; }
        .prism-code-override pre { margin: 0 !important; border-radius: 0.5rem !important; background: #f8fafc !important; border: 1px solid #e2e8f0; height: 100%; color: #334155; }
        .dark .prism-code-override pre { background: #010409 !important; border: 1px solid #30363d; color: #c9d1d9; }
      `}</style>

      {isDragging && <div className="fixed inset-0 z-50 cursor-col-resize" />}

      {/* LEFT PANE */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 bg-gray-50 dark:bg-[#161b22] flex flex-col transition-all duration-300 relative border-r border-gray-200 dark:border-[#30363d]`}>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="absolute -right-3 top-5 z-20 bg-white dark:bg-[#30363d] hover:bg-gray-100 dark:hover:bg-[#484f58] border border-gray-200 dark:border-[#21262d] rounded-full p-1 text-gray-600 dark:text-white shadow-md">
          {isSidebarOpen ? <ChevronLeft size={14}/> : <Menu size={14}/>}
        </button>

        <div className={`flex flex-col h-full overflow-hidden ${!isSidebarOpen && 'opacity-0 pointer-events-none'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-[#30363d] flex items-center justify-between min-w-[255px]">
            <div className="flex items-center gap-2 font-semibold">
              <FileCode size={20} className="text-blue-500 dark:text-[#58a6ff]" />
              <span>DevBinder</span>
            </div>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-[#30363d] text-gray-500 dark:text-[#8b949e]">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-3 min-w-[255px]">
            <div className="px-4 text-xs font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider mb-2">Collections</div>
            <nav className="space-y-0.5 px-2">
              {sections.map(section => (
                <div key={section} className="relative group">
                  <button onClick={() => { setActiveSection(section); setActiveSnippet(null); }} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${activeSection === section ? 'bg-blue-100 text-blue-700 dark:bg-[#1f6feb] dark:text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-[#c9d1d9] dark:hover:bg-[#30363d]'}`}>
                    <Folder size={16} className={activeSection === section ? "text-blue-700 dark:text-white" : "text-gray-400 dark:text-[#8b949e] flex-shrink-0"} />
                    <span className="truncate flex-1 text-left">{section}</span>
                  </button>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-white dark:bg-[#161b22] px-1 rounded shadow-sm border border-gray-200 dark:border-transparent">
                    <button onClick={(e) => { e.stopPropagation(); setEditingCollectionName(section); setNewCollectionNameInput(section); }} className="p-1 text-gray-500 hover:text-blue-600 dark:text-[#8b949e] dark:hover:text-white"><Edit2 size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteCollectionConfirm(section); }} className="p-1 text-gray-500 hover:text-red-600 dark:text-[#8b949e] dark:hover:text-[#f85149]"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-[#30363d] space-y-2 min-w-[255px]">
            <button onClick={() => setSectionPromptOpen(true)} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium bg-white dark:bg-[#21262d] border border-gray-300 dark:border-[#30363d] rounded-md hover:bg-gray-50 dark:hover:bg-[#30363d]"><Plus size={16} /> New Collection</button>
            <button onClick={() => setIsExporting(true)} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-[#238636] dark:hover:bg-[#2ea043] border border-transparent dark:border-[#2ea043] rounded-md"><RefreshCw size={16} /> Sync Config</button>
          </div>
        </div>
      </div>

      {/* MIDDLE PANE */}
      <div className="flex-shrink-0 bg-white dark:bg-[#0d1117] flex flex-col" style={{ width: `${middlePaneWidth}px` }}>
        <div className="p-4 border-b border-gray-200 dark:border-[#30363d] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold truncate pr-2">{activeSection || "Snippets"}</h2>
            <button onClick={() => { setFormSection(activeSection || sections[0] || ""); setFormIsShared(false); setIsAdding(true); }} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:text-[#8b949e] dark:hover:text-white dark:hover:bg-[#30363d] rounded-md"><Plus size={16} /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-[#8b949e]" size={14} />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-[#010409] border border-gray-300 dark:border-[#30363d] text-sm rounded-md pl-9 pr-3 py-1.5 focus:outline-none focus:border-blue-500 dark:focus:border-[#58a6ff]"/>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredSnippets.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-[#8b949e] text-sm">No snippets found.</div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-[#21262d]">
              {filteredSnippets.map(snippet => (
                <li key={snippet.id}>
                  <button onClick={() => setActiveSnippet(snippet)} className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-[#161b22] transition-colors flex items-start gap-3 ${activeSnippet?.id === snippet.id ? 'bg-blue-50 border-blue-500 dark:bg-[#161b22] border-l-2 dark:border-[#58a6ff]' : 'border-l-2 border-transparent'}`}>
                    <div className="mt-0.5 text-gray-400 dark:text-[#8b949e]">
                      {snippet.type === 'gist' ? <Github size={16} /> : <Code size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-sm truncate pr-2">{snippet.title}</h3>
                        {snippet.isShared && <Share2 size={12} className="text-blue-500 dark:text-[#58a6ff] flex-shrink-0 mt-1" title="Shared Snippet" />}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {snippet.tags.slice(0, 3).map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-[#1f6feb]/10 dark:text-[#58a6ff] border border-blue-200 dark:border-[#1f6feb]/20">{tag}</span>)}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div onMouseDown={() => setIsDragging(true)} className="w-1.5 cursor-col-resize hover:bg-blue-400 dark:hover:bg-[#58a6ff] bg-transparent border-r border-gray-200 dark:border-[#30363d] z-10 transition-colors" />

      {/* RIGHT PANE */}
      <div className="flex-1 bg-white dark:bg-[#0d1117] flex flex-col overflow-hidden relative">
        {activeSnippet ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-[#30363d] flex items-center justify-between bg-gray-50 dark:bg-[#161b22]">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">{activeSnippet.title}</h1>
                  {activeSnippet.isShared && <span className="bg-blue-100 text-blue-700 dark:bg-[#1f6feb]/20 dark:text-[#58a6ff] text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Share2 size={10}/> Shared</span>}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-mono text-gray-500 dark:text-[#8b949e] uppercase flex items-center gap-1">{activeSnippet.type === 'gist' ? <Github size={12}/> : <Code size={12}/>}{activeSnippet.language}</span>
                  <div className="flex gap-1.5">{activeSnippet.tags.map(tag => <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-white border-gray-300 dark:bg-[#21262d] dark:border-[#30363d] border text-gray-600 dark:text-[#c9d1d9]">{tag}</span>)}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={openEditSnippetModal} className="p-2 text-gray-500 hover:bg-gray-200 dark:text-[#8b949e] dark:hover:text-white dark:hover:bg-[#30363d] rounded-md"><Edit2 size={18} /></button>
                <button onClick={() => handleCopy(activeSnippet.type === 'code' ? activeSnippet.content : activeSnippet.url)} className="p-2 text-gray-500 hover:bg-gray-200 dark:text-[#8b949e] dark:hover:text-white dark:hover:bg-[#30363d] rounded-md">{copied ? <CheckCircle size={18} className="text-green-600 dark:text-[#3fb950]" /> : <Copy size={18} />}</button>
                <button onClick={() => setDeleteConfirmId(activeSnippet.id)} className="p-2 text-red-500 hover:bg-red-50 dark:text-[#f85149] dark:hover:bg-[#f85149]/10 rounded-md"><Trash2 size={18} /></button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-[#0d1117]">
              {activeSnippet.type === 'code' ? (
                <div className="prism-code-override h-full">
                  <pre className="h-full p-4 overflow-auto text-sm font-mono"><code className={`language-${activeSnippet.language}`}>{activeSnippet.content}</code></pre>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="bg-gray-50 dark:bg-[#161b22] px-4 py-2 flex items-center gap-2 border border-gray-200 dark:border-[#30363d] border-b-0 rounded-t-lg">
                    <Github size={16} className="text-gray-600 dark:text-[#c9d1d9]" />
                    <span className="text-xs text-gray-500 dark:text-[#8b949e] font-mono truncate flex-grow">{activeSnippet.url}</span>
                    <a href={activeSnippet.url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-[#58a6ff] hover:underline text-xs flex items-center gap-1">Open <ExternalLink size={12} /></a>
                  </div>
                  <div className="flex-1 w-full bg-gray-50 dark:bg-[#010409] rounded-b-lg border border-gray-200 dark:border-[#30363d]">
                    <GistEmbed url={activeSnippet.url} />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-[#8b949e]">
            <Code size={48} className="mb-4 opacity-20" />
            <p className="text-lg">Select a snippet to view</p>
          </div>
        )}
      </div>

      {/* EXPORT / SAVE TO REPO MODAL */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161b22] w-full max-w-3xl rounded-xl shadow-2xl border border-gray-200 dark:border-[#30363d] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200 dark:border-[#30363d]">
               <h3 className="text-lg font-semibold flex items-center gap-2"><Github size={18}/> GitHub Synchronization</h3>
               <button onClick={() => setIsExporting(false)} className="text-gray-500 hover:text-gray-900 dark:text-[#8b949e] dark:hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="p-6 flex-grow overflow-y-auto flex flex-col gap-6">
              <div className="bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-lg p-5">
                <h4 className="font-medium mb-4 flex items-center gap-2"><RefreshCw size={16} /> Direct API Sync (to {GITHUB_CONFIG.BRANCH})</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-1">GitHub PAT</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Key className="absolute left-3 top-2.5 text-gray-400 dark:text-[#8b949e]" size={14} />
                        <input type="password" value={ghToken} onChange={(e) => { setGhToken(e.target.value); localStorage.setItem('gh_token', e.target.value); }} placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" className="w-full bg-white dark:bg-[#010409] border border-gray-300 dark:border-[#30363d] rounded-md pl-9 pr-3 py-1.5 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none" />
                      </div>
                      <button onClick={saveToGitHub} disabled={isSyncing || !ghToken || !hasChanges} className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors border ${isSyncing || !ghToken || !hasChanges ? 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-[#21262d] dark:text-[#8b949e] dark:border-[#30363d] cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white border-transparent dark:bg-[#238636] dark:hover:bg-[#2ea043] dark:border-[#2ea043]'}`}>
                        {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} {hasChanges ? 'Push Changes' : 'Up to date'}
                      </button>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2">
                      <input type="checkbox" id="syncShared" checked={syncOnlyShared} onChange={(e) => setSyncOnlyShared(e.target.checked)} className="rounded border-gray-300 dark:border-[#30363d]" />
                      <label htmlFor="syncShared" className="text-sm text-gray-700 dark:text-[#c9d1d9] cursor-pointer">Only push snippets marked as <span className="font-semibold text-blue-600 dark:text-[#58a6ff]">Shared</span></label>
                    </div>
                  </div>
                  {syncStatus && <div className={`p-3 rounded-md text-sm ${syncStatus.includes('Error') ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900' : 'bg-green-50 text-green-700 border-green-200 dark:bg-[#238636]/20 dark:text-[#3fb950] dark:border-[#2ea043]/30'}`}>{syncStatus}</div>}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded-lg p-5">
                <h4 className="font-medium mb-2">Manual Fallback Payload</h4>
                <div className="relative h-48">
                  <textarea readOnly className="w-full h-full bg-white dark:bg-[#010409] border border-gray-300 dark:border-[#30363d] rounded-md p-4 font-mono text-xs text-blue-600 dark:text-[#58a6ff] focus:outline-none resize-none" value={JSON.stringify(payloadDb, null, 2)} />
                  <button onClick={() => handleCopy(JSON.stringify(payloadDb, null, 2))} className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 dark:bg-[#30363d] dark:hover:bg-[#484f58] text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">{copied ? <CheckCircle size={14} /> : <Copy size={14} />} Copy JSON</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161b22] w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 dark:border-[#30363d] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200 dark:border-[#30363d]">
               <h3 className="text-lg font-semibold">{editingSnippetId ? 'Edit Snippet' : 'Add Snippet'}</h3>
               <button onClick={() => { setIsAdding(false); setEditingSnippetId(null); }} className="text-gray-500 hover:text-gray-900 dark:text-[#8b949e] dark:hover:text-white"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto">
              <form onSubmit={handleSaveSnippet} className="p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1"><label className="block text-sm font-medium text-gray-700 dark:text-[#c9d1d9] mb-1">Title</label><input required type="text" value={formTitle} onChange={e=>setFormTitle(e.target.value)} className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none" /></div>
                  <div className="w-1/3"><label className="block text-sm font-medium text-gray-700 dark:text-[#c9d1d9] mb-1">Collection</label><select value={formSection} onChange={e=>setFormSection(e.target.value)} className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none">{sections.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1/3"><label className="block text-sm font-medium text-gray-700 dark:text-[#c9d1d9] mb-1">Source Type</label><select value={formType} onChange={e=>setFormType(e.target.value)} className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none"><option value="code">Raw Code</option><option value="gist">GitHub Gist URL</option></select></div>
                  <div className="w-1/3"><label className="block text-sm font-medium text-gray-700 dark:text-[#c9d1d9] mb-1">Language</label><input type="text" value={formLang} onChange={e=>setFormLang(e.target.value)} className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none" /></div>
                  <div className="w-1/3"><label className="block text-sm font-medium text-gray-700 dark:text-[#c9d1d9] mb-1">Tags (comma sep)</label><input type="text" value={formTags} onChange={e=>setFormTags(e.target.value)} className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none" /></div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#010409] border border-gray-200 dark:border-[#30363d] rounded-md">
                  <input type="checkbox" id="isShared" checked={formIsShared} onChange={(e) => setFormIsShared(e.target.checked)} className="rounded" />
                  <label htmlFor="isShared" className="text-sm font-medium text-gray-700 dark:text-[#c9d1d9] cursor-pointer flex items-center gap-2">
                    <Share2 size={14} className="text-blue-500 dark:text-[#58a6ff]" /> Share Publicly (Sync to Repository)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#c9d1d9] mb-1">{formType === 'code' ? 'Code Content' : 'Gist URL'}</label>
                  {formType === 'code' ? <textarea required value={formContent} onChange={e=>setFormContent(e.target.value)} className="w-full bg-gray-50 dark:bg-[#010409] border border-gray-300 dark:border-[#30363d] rounded-md p-3 font-mono text-sm h-64 focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none resize-y" /> : <input required type="url" value={formContent} onChange={e=>setFormContent(e.target.value)} className="w-full bg-gray-50 dark:bg-[#010409] border border-gray-300 dark:border-[#30363d] rounded-md p-2 font-mono text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none" />}
                </div>
                <div className="flex justify-end pt-4 gap-3 border-t border-gray-200 dark:border-[#30363d] mt-4">
                  <button type="button" onClick={() => { setIsAdding(false); setEditingSnippetId(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-[#c9d1d9] dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-transparent dark:border-[#30363d] rounded-md transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-[#1f6feb] dark:hover:bg-[#388bfd] rounded-md transition-colors flex items-center gap-2"><Save size={16} /> Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Simple Modals */}
      {sectionPromptOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-[#161b22] w-full max-w-sm rounded-xl shadow-2xl border border-gray-200 dark:border-[#30363d] overflow-hidden"><div className="px-6 py-4 border-b border-gray-200 dark:border-[#30363d]"><h3 className="text-lg font-semibold">New Collection</h3></div><form onSubmit={handleAddSection} className="p-6"><input autoFocus required type="text" value={newSectionName} onChange={e=>setNewSectionName(e.target.value)} className="w-full bg-white dark:bg-[#010409] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none mb-6" /><div className="flex justify-end gap-3"><button type="button" onClick={() => setSectionPromptOpen(false)} className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:text-[#c9d1d9] dark:bg-[#21262d] dark:hover:bg-[#30363d] rounded-md">Cancel</button><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-[#1f6feb] dark:hover:bg-[#388bfd] rounded-md">Create</button></div></form></div></div>
      )}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-[#161b22] w-full max-w-sm rounded-xl shadow-2xl border border-gray-200 dark:border-[#30363d] overflow-hidden"><div className="px-6 py-4 border-b border-gray-200 dark:border-[#30363d]"><h3 className="text-lg font-semibold">Delete Snippet</h3></div><div className="p-6"><p className="mb-6 text-sm text-gray-700 dark:text-[#c9d1d9]">Are you sure?</p><div className="flex justify-end gap-3"><button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:text-[#c9d1d9] dark:bg-[#21262d] dark:hover:bg-[#30363d] rounded-md">Cancel</button><button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-[#da3633] dark:hover:bg-[#f85149] rounded-md">Delete</button></div></div></div></div>
      )}
      {editingCollectionName && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-[#161b22] w-full max-w-sm rounded-xl shadow-2xl border border-gray-200 dark:border-[#30363d] overflow-hidden"><div className="px-6 py-4 border-b border-gray-200 dark:border-[#30363d]"><h3 className="text-lg font-semibold">Rename</h3></div><form onSubmit={handleRenameCollectionSubmit} className="p-6"><input autoFocus required type="text" value={newCollectionNameInput} onChange={e=>setNewCollectionNameInput(e.target.value)} className="w-full bg-white dark:bg-[#010409] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none mb-6" /><div className="flex justify-end gap-3"><button type="button" onClick={() => setEditingCollectionName(null)} className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:text-[#c9d1d9] dark:bg-[#21262d] dark:hover:bg-[#30363d] rounded-md">Cancel</button><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-[#1f6feb] dark:hover:bg-[#388bfd] rounded-md">Rename</button></div></form></div></div>
      )}
      {deleteCollectionConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-[#161b22] w-full max-w-sm rounded-xl shadow-2xl border border-gray-200 dark:border-[#30363d] overflow-hidden"><div className="px-6 py-4 border-b border-gray-200 dark:border-[#30363d]"><h3 className="text-lg font-semibold">Delete Collection</h3></div><div className="p-6"><p className="text-red-600 dark:text-[#f85149] mb-6 text-xs font-semibold">Warning: This deletes all inside snippets.</p><div className="flex justify-end gap-3"><button onClick={() => setDeleteCollectionConfirm(null)} className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:text-[#c9d1d9] dark:bg-[#21262d] dark:hover:bg-[#30363d] rounded-md">Cancel</button><button onClick={confirmDeleteCollection} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-[#da3633] dark:hover:bg-[#f85149] rounded-md">Delete</button></div></div></div></div>
      )}
    </div>
  );
}
