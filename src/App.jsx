import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Folder, FileCode, Plus, Save, Copy, 
  ExternalLink, Code, CheckCircle, Trash2, X, Edit2, 
  RefreshCw, Key, ChevronLeft, Menu, Sun, Moon, Share2,
  Link as LinkIcon, Terminal, FileText, Box, Image as ImageIcon, Film,
  Settings, Download, Upload, CheckSquare, Square, SlidersHorizontal
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
// 💾 INDEXED-DB & VALIDATION WRAPPER
// ==========================================
const isValidSnippet = (s) => s && typeof s === 'object' && s.id && s.title && s.type;

const validateDbFormat = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error("Invalid root database format");
  const validDb = {};
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      validDb[key] = value.filter(isValidSnippet);
    } else {
      validDb[key] = [];
    }
  }
  return validDb;
};

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
const isCliLanguage = (lang) => ['bash', 'shell', 'cmd', 'powershell', 'pwsh'].includes(lang?.toLowerCase());

// ==========================================
// 🧩 EMBED COMPONENTS
// ==========================================
const GistEmbed = ({ url, theme }) => {
  const gistUrl = url.includes('.js') ? url : `${url}.js`;
  const isDark = theme === 'dark';
  
  const colors = {
    bg: isDark ? '#0d1117' : '#ffffff',
    border: isDark ? '#30363d' : '#e5e7eb',
    metaBg: isDark ? '#161b22' : '#f9fafb',
    text: isDark ? '#c9d1d9' : '#1f2328',
    metaText: isDark ? '#8b949e' : '#6b7280',
    link: isDark ? '#58a6ff' : '#2563eb'
  };

  const iframeSrc = `
    <html>
      <head>
        <base target="_blank">
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: ${colors.bg}; }
          .gist .gist-file, .gist .Box, .gist .color-bg-default { border-radius: 8px; border: 1px solid ${colors.border} !important; margin: 0 !important; background-color: ${colors.bg} !important; }
          .gist .gist-data { background-color: ${colors.bg} !important; border-bottom: 1px solid ${colors.border} !important; }
          .gist .blob-wrapper table, .gist .blob-code, .gist .blob-code-inner { color: ${colors.text} !important; background-color: transparent !important; }
          .gist .blob-num { color: ${colors.metaText} !important; border-right: 1px solid ${colors.border} !important; background: transparent !important; }
          .gist .pl-s { color: ${isDark ? '#a5d6ff' : '#0a3069'} !important; }
          .gist .pl-k { color: ${isDark ? '#ff7b72' : '#cf222e'} !important; }
          .gist .pl-en { color: ${isDark ? '#d2a8ff' : '#8250df'} !important; }
          .gist .gist-meta { background-color: ${colors.metaBg} !important; color: ${colors.metaText} !important; font-size: 12px !important; border-radius: 0 0 8px 8px; padding: 10px !important; }
          .gist .gist-meta a { color: ${colors.link} !important; text-decoration: none; }
          .gist .gist-meta a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <script src="${gistUrl}"></script>
      </body>
    </html>
  `;
  return <iframe srcDoc={iframeSrc} className="w-full h-full border-none rounded-lg min-h-[400px]" title="GitHub Gist" />;
};

const LinkViewer = ({ url }) => {
  const isPdf = url.toLowerCase().split('?')[0].endsWith('.pdf');
  
  if (isPdf) {
    const proxyUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    return (
      <div className="relative w-full h-full flex flex-col">
        <div className="bg-gray-50 dark:bg-[#161b22] p-2 border border-b-0 border-gray-200 dark:border-[#30363d] flex justify-between items-center rounded-t-xl shrink-0">
          <span className="text-xs text-gray-500 dark:text-[#8b949e] font-mono truncate px-2">PDF Document</span>
          <a href={url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 bg-blue-100 text-blue-700 dark:bg-[#1f6feb]/20 dark:text-[#58a6ff] px-3 py-1.5 rounded-md hover:bg-blue-200 dark:hover:bg-[#1f6feb]/40 transition-colors font-medium">
            Open Externally <ExternalLink size={12} />
          </a>
        </div>
        <iframe src={proxyUrl} className="w-full flex-1 border border-gray-200 dark:border-[#30363d] rounded-b-xl min-h-[500px] bg-white dark:bg-[#010409]" title="PDF Viewer" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="p-8 bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl max-w-lg w-full shadow-sm">
        <div className="w-16 h-16 bg-blue-100 dark:bg-[#1f6feb]/20 text-blue-600 dark:text-[#58a6ff] rounded-2xl flex items-center justify-center mx-auto mb-4"><LinkIcon size={32} /></div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">External Reference</h3>
        <p className="text-sm text-gray-500 dark:text-[#8b949e] mb-6 line-clamp-2">{url}</p>
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-[#1f6feb] dark:hover:bg-[#388bfd] text-white text-sm font-medium rounded-lg transition-colors">Open Link <ExternalLink size={16} /></a>
      </div>
    </div>
  );
};

const ImageViewer = ({ url }) => {
  const [imgFailed, setImgFailed] = useState(false);
  if (imgFailed) return <LinkViewer url={url} />;
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 relative group">
      <img 
        src={url} 
        alt="Embed" 
        referrerPolicy="no-referrer" 
        onError={() => setImgFailed(true)} 
        className="max-w-full max-h-full object-contain rounded-xl shadow-sm border border-gray-200 dark:border-[#30363d]" 
      />
      <a href={url} target="_blank" rel="noreferrer" className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2 backdrop-blur-sm hover:bg-black font-medium">
        Open Original Image <ExternalLink size={12} />
      </a>
    </div>
  );
};

const VideoViewer = ({ url }) => {
  const isYoutube = url.includes('youtube.com/watch?v=') || url.includes('youtu.be/');
  if (isYoutube) {
    const videoId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('youtu.be/')[1].split('?')[0];
    return (
      <div className="w-full max-w-4xl mx-auto h-full flex flex-col justify-center">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-[#30363d] shadow-sm">
          <iframe src={`https://www.youtube.com/embed/${videoId}`} className="absolute top-0 left-0 w-full h-full border-none" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="YouTube Video" />
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <video src={url} controls className="max-w-full max-h-full rounded-xl shadow-sm border border-gray-200 dark:border-[#30363d]" />
    </div>
  );
};

const SandboxViewer = ({ url }) => {
  let embedUrl = url;
  if (url.includes('codepen.io') && url.includes('/pen/')) embedUrl = url.replace('/pen/', '/embed/');
  else if (url.includes('codesandbox.io/s/')) embedUrl = url.replace('/s/', '/embed/');
  else if (url.includes('stackblitz.com/edit/') && !url.includes('embed=1')) embedUrl = url + (url.includes('?') ? '&' : '?') + 'embed=1';
  
  return (
    <div className="w-full h-full pt-4">
      <iframe src={embedUrl} className="w-full h-full border border-gray-200 dark:border-[#30363d] rounded-xl bg-white dark:bg-[#010409] min-h-[500px]" allowFullScreen sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts" title="Sandbox Embed" />
    </div>
  );
};

const MarkdownViewer = ({ content }) => {
  return (
    <div className="w-full h-full overflow-auto p-6 bg-white dark:bg-[#0d1117]">
      <div 
        className="markdown-body max-w-4xl mx-auto"
        dangerouslySetInnerHTML={{ __html: window.marked ? window.marked.parse(content) : '<p>Loading renderer...</p>' }}
      />
    </div>
  );
};

const CliViewer = ({ content }) => {
  return (
    <div className="w-full h-full bg-[#0d1117] text-[#e6edf3] p-4 font-mono text-sm rounded-xl border border-gray-200 dark:border-[#30363d] overflow-auto shadow-sm mt-4">
      <div className="flex gap-2 mb-4 border-b border-[#30363d] pb-3">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
      </div>
      <pre className="whitespace-pre-wrap">
        {content.split('\n').map((line, i) => {
          // Supports standard unix prompts ($/ >) and Windows/Powershell paths (C:\..> / PS C:\..>)
          const isPrompt = line.match(/^([$>]|PS\s+[^>]+>|[A-Z]:\\[^>]*>)\s*/i);
          const prompt = isPrompt ? isPrompt[0] : '';
          const text = line.substring(prompt.length);
          return (
            <div key={i} className="flex leading-relaxed hover:bg-[#161b22] px-1 rounded transition-colors">
              <span className="text-[#3fb950] mr-2 select-none font-bold whitespace-nowrap">{prompt || '> '}</span>
              <span className="text-[#e6edf3] break-all">{text}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
};

export default function App() {
  const [db, setDb] = useState(null); 
  const [activeSection, setActiveSection] = useState("");
  const [activeSnippet, setActiveSnippet] = useState(null);
  
  // Search & Selection
  const [searchQuery, setSearchQuery] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [dragOverSection, setDragOverSection] = useState(null); 
  const [prismLanguages, setPrismLanguages] = useState([]);
  
  // Layout States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [middlePaneWidth, setMiddlePaneWidth] = useState(320); 
  const [isDragging, setIsDragging] = useState(false);
  const [mdPreview, setMdPreview] = useState(true); 

  // --- PREFERENCES ---
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark'; } catch { return 'dark'; }
  });
  const [bulkSelectDefaultAll, setBulkSelectDefaultAll] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bulkSelectDefaultAll')) || false; } catch { return false; }
  });
  const [collectionSortOrder, setCollectionSortOrder] = useState(() => {
    try { return localStorage.getItem('collectionSortOrder') || 'asc'; } catch { return 'asc'; }
  });
  const [customCollectionOrder, setCustomCollectionOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('customCollectionOrder')) || []; } catch { return []; }
  });

  // Settings & Sync States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [ghToken, setGhToken] = useState(getStoredToken);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [syncOnlyShared, setSyncOnlyShared] = useState(true);
  const [lastSyncedDb, setLastSyncedDb] = useState("");

  const fileInputRef = useRef(null);

  // Modals / Form States
  const [isAdding, setIsAdding] = useState(false);
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
  const [formCategory, setFormCategory] = useState("code"); 
  const [formUrlType, setFormUrlType] = useState("link"); 
  const [formLangInput, setFormLangInput] = useState(""); 
  const [formTags, setFormTags] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formIsShared, setFormIsShared] = useState(false);

  const resetFormFields = () => {
    setFormTitle("");
    setFormCategory("code");
    setFormUrlType("link");
    setFormLangInput("");
    setFormTags("");
    setFormContent("");
    setFormIsShared(false);
    setEditingSnippetId(null);
    setIsAdding(false);
  };

  // Preference Persistence Effects
  useEffect(() => { localStorage.setItem('theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('bulkSelectDefaultAll', JSON.stringify(bulkSelectDefaultAll)); }, [bulkSelectDefaultAll]);
  useEffect(() => { localStorage.setItem('collectionSortOrder', collectionSortOrder); }, [collectionSortOrder]);
  useEffect(() => { localStorage.setItem('customCollectionOrder', JSON.stringify(customCollectionOrder)); }, [customCollectionOrder]);
  
  // Apply DOM Theme
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Dynamic Component Loaders
  useEffect(() => {
    const prismCss = document.createElement('link');
    prismCss.rel = 'stylesheet';
    prismCss.href = theme === 'dark' ? 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css' : 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css';
    document.head.appendChild(prismCss);
    const prismJs = document.createElement('script');
    prismJs.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
    prismJs.async = true;
    prismJs.onload = () => {
      const autoloader = document.createElement('script');
      autoloader.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js';
      autoloader.onload = () => {
        window.Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/';
        window.Prism?.highlightAll();
      };
      document.body.appendChild(autoloader);
    };
    document.body.appendChild(prismJs);

    if (!window.marked) {
      const markedJs = document.createElement('script');
      markedJs.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
      document.body.appendChild(markedJs);
    }

    return () => { document.head.removeChild(prismCss); document.body.removeChild(prismJs); };
  }, [theme]);

  // Fetch and validate languages
  useEffect(() => {
    fetch('./languages.json').then(res => res.json()).then(data => {
      if (Array.isArray(data)) setPrismLanguages(data);
      else throw new Error("Invalid language format");
    }).catch(() => {
      setPrismLanguages([
        { id: 'javascript', label: 'JavaScript (js)' },
        { id: 'python', label: 'Python (py)' },
        { id: 'plain', label: 'Plain Text (txt)' }
      ]);
    });
  }, []);

  useEffect(() => { if (db !== null) setLocalDb(db); }, [db]);
  
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

  const hasChanges = useMemo(() => lastSyncedDb !== "" && JSON.stringify(payloadDb) !== lastSyncedDb, [payloadDb, lastSyncedDb]);

  useEffect(() => {
    const initializeApp = async () => {
      let localData = await getLocalDb();
      if (!localData) localData = INITIAL_DB;
      
      try {
        localData = validateDbFormat(localData);
      } catch (err) {
        console.warn("Local DB validation failed, resetting...", err);
        localData = INITIAL_DB;
      }
      
      setDb(localData);
      setActiveSection(Object.keys(localData)[0] || "");
      setFormSection(Object.keys(localData)[0] || "");

      try {
        setSyncStatus("Fetching live data...");
        const res = await fetch(GITHUB_CONFIG.PATH);
        if (res.status === 404) { setSyncStatus("No existing remote data found."); setLastSyncedDb(JSON.stringify(payloadDb)); return; }
        if (!res.ok) throw new Error("Failed to fetch deployed data.");
        
        let remoteData = await res.json();
        remoteData = validateDbFormat(remoteData);

        const mergedDb = { ...localData };
        Object.keys(remoteData).forEach(section => {
          if (!mergedDb[section]) mergedDb[section] = [];
          remoteData[section].forEach(remoteSnippet => {
            const incomingSnippet = { ...remoteSnippet, isShared: remoteSnippet.isShared !== false };
            const localIndex = mergedDb[section].findIndex(s => s.id === incomingSnippet.id);
            if (localIndex >= 0) mergedDb[section][localIndex] = incomingSnippet;
            else mergedDb[section].push(incomingSnippet);
          });
        });

        setDb(mergedDb);
        setLastSyncedDb(JSON.stringify(remoteData));
        setSyncStatus("");
      } catch (err) {
        console.warn("Remote sync failed:", err.message);
        setSyncStatus("Local mode (Remote unreachable).");
        setLastSyncedDb(JSON.stringify(payloadDb)); 
      }
    };
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToGitHub = async () => {
    if (!ghToken || !GITHUB_CONFIG.OWNER) return alert("Please check configuration and Token.");
    setIsSyncing(true);
    setSyncStatus("Syncing...");
    try {
      let currentSha = null;
      const shaRes = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.PATH}?ref=${GITHUB_CONFIG.BRANCH}`, { headers: { Authorization: `Bearer ${ghToken}` } });
      if (shaRes.ok) { const shaData = await shaRes.json(); currentSha = shaData.sha; }

      const payloadString = JSON.stringify(payloadDb, null, 2);
      const content = utf8ToBase64(payloadString);
      const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.PATH}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${ghToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: syncOnlyShared ? 'Update shared snippets via DevBinder' : 'Update all snippets via DevBinder', content, branch: GITHUB_CONFIG.BRANCH, ...(currentSha && { sha: currentSha }) })
      });

      if (res.status === 409) throw new Error("Conflict: File modified elsewhere. Refresh needed.");
      if (!res.ok) throw new Error("Failed to save. Check repository permissions.");
      
      setLastSyncedDb(JSON.stringify(payloadDb)); 
      setSyncStatus(`Successfully pushed to ${GITHUB_CONFIG.BRANCH}!`);
      setTimeout(() => setSyncStatus(""), 4000);
    } catch (err) {
      setSyncStatus(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleJSONImport = (e, overwrite = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const validated = validateDbFormat(parsed);
        
        if (overwrite) {
          setDb(validated);
        } else {
          setDb(prev => {
            const merged = { ...prev };
            Object.keys(validated).forEach(section => {
              if (!merged[section]) merged[section] = [];
              validated[section].forEach(incomingSnippet => {
                const localIndex = merged[section].findIndex(s => s.id === incomingSnippet.id);
                if (localIndex >= 0) merged[section][localIndex] = incomingSnippet;
                else merged[section].push(incomingSnippet);
              });
            });
            return merged;
          });
        }
        setSyncStatus(`Successfully ${overwrite ? 'overwritten from' : 'merged'} JSON backup.`);
        setTimeout(() => setSyncStatus(""), 4000);
      } catch (err) {
        setSyncStatus(`Import Error: ${err.message}`);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devbinder_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkAction = (action) => {
    setDb(prev => {
      const newDb = { ...prev };
      if (action === 'delete') {
        newDb[activeSection] = newDb[activeSection].filter(s => !selectedIds.has(s.id));
        if (newDb[activeSection].length === 0) {
          delete newDb[activeSection];
          setActiveSection(Object.keys(newDb)[0] || "");
        }
      } else {
        const isSharedTarget = action === 'share';
        newDb[activeSection] = newDb[activeSection].map(s => selectedIds.has(s.id) ? { ...s, isShared: isSharedTarget } : s);
      }
      return newDb;
    });
    setSelectedIds(new Set());
    if (action === 'delete' && activeSnippet && selectedIds.has(activeSnippet.id)) setActiveSnippet(null);
  };

  useEffect(() => { if (activeSnippet && activeSnippet.type === 'code' && window.Prism) window.Prism.highlightAll(); }, [activeSnippet, mdPreview]);

  if (db === null) return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#0d1117] text-gray-500"><RefreshCw className="animate-spin mr-2"/> Loading Vault...</div>;

  // --- Sorting Collections ---
  const displaySections = (() => {
    const secs = Object.keys(db);
    if (collectionSortOrder === 'asc') return [...secs].sort((a, b) => a.localeCompare(b));
    if (collectionSortOrder === 'desc') return [...secs].sort((a, b) => b.localeCompare(a));
    return [...secs].sort((a, b) => {
      const idxA = customCollectionOrder.indexOf(a);
      const idxB = customCollectionOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  })();

  // --- Professional Search Engine (Relevance Scoring) ---
  const queryTokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
  const filteredSnippets = (db[activeSection] || [])
    .map(s => {
      if (queryTokens.length === 0) return { ...s, _score: 1 };
      
      let score = 0;
      const titleLower = s.title.toLowerCase();
      const contentLower = `${s.content || ''} ${s.url || ''}`.toLowerCase();
      
      const matchesAll = queryTokens.every(token => {
        let matched = false;
        
        // Exact Tag Prefix Match (Highest Weight)
        if (s.tags.some(t => t.toLowerCase() === token)) { score += 50; matched = true; }
        else if (s.tags.some(t => t.toLowerCase().startsWith(token))) { score += 20; matched = true; }
        
        // Strict Title Boundary Match
        if (!matched && titleLower.includes(token)) {
          try {
            if (new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(titleLower)) { score += 15; }
            else { score += 10; }
          } catch { score += 10; } // Fallback
          matched = true;
        }
        
        // Content Match
        if (!matched && contentLower.includes(token)) { score += 1; matched = true; }
        
        return matched;
      });
      
      return matchesAll ? { ...s, _score: score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b._score - a._score); // Sort by highest relevance

  const getIconForType = (type, language, size = 16) => {
    if (type === 'code' && language === 'markdown') return <FileText size={size} />;
    if (type === 'code' && isCliLanguage(language)) return <Terminal size={size} />;
    switch (type) {
      case 'gist': return <Github size={size} />;
      case 'link': return <LinkIcon size={size} />;
      case 'image': return <ImageIcon size={size} />;
      case 'video': return <Film size={size} />;
      case 'sandbox': return <Box size={size} />;
      default: return <Code size={size} />;
    }
  };

  const handleCopy = () => {
    if (!activeSnippet) return;
    let textToCopy = activeSnippet.url || activeSnippet.content;
    
    if (activeSnippet.type === 'code' && isCliLanguage(activeSnippet.language)) {
      textToCopy = textToCopy.replace(/^([$>]|PS\s+[^>]+>|[A-Z]:\\[^>]*>)\s*/gim, '');
    }
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDropItem = (e, targetSection) => {
    e.preventDefault();
    setDragOverSection(null);
    const dragType = e.dataTransfer.getData('dragType');

    if (dragType === 'snippet') {
      const snippetId = e.dataTransfer.getData('snippetId');
      const sourceSection = e.dataTransfer.getData('sourceSection');
      if (!snippetId || !sourceSection || sourceSection === targetSection) return;
      
      setDb(prev => {
        const newDb = { ...prev };
        const snippetIndex = newDb[sourceSection].findIndex(s => s.id === snippetId);
        if (snippetIndex === -1) return prev;
        
        const [snippetToMove] = newDb[sourceSection].splice(snippetIndex, 1);
        newDb[targetSection].push(snippetToMove);
        return newDb;
      });
      setActiveSection(targetSection);
    } 
    else if (dragType === 'collection' && collectionSortOrder === 'custom') {
      const sourceCol = e.dataTransfer.getData('collectionName');
      if (sourceCol && sourceCol !== targetSection) {
         let newOrder = [...customCollectionOrder];
         Object.keys(db).forEach(s => { if (!newOrder.includes(s)) newOrder.push(s); }); // ensure completeness
         
         const srcIdx = newOrder.indexOf(sourceCol);
         const tgtIdx = newOrder.indexOf(targetSection);
         newOrder.splice(srcIdx, 1);
         newOrder.splice(tgtIdx, 0, sourceCol);
         setCustomCollectionOrder(newOrder);
      }
    }
  };

  const openEditSnippetModal = () => {
    if (!activeSnippet) return;
    setFormTitle(activeSnippet.title);
    
    const isUrl = ['link', 'gist', 'sandbox', 'image', 'video'].includes(activeSnippet.type);
    setFormCategory(isUrl ? 'url' : 'code');
    setFormUrlType(isUrl ? activeSnippet.type : 'link');

    const foundLang = prismLanguages.find(l => l.id === activeSnippet.language);
    setFormLangInput(foundLang ? foundLang.label : (activeSnippet.language || ""));
    
    setFormTags(activeSnippet.tags.join(', '));
    setFormContent(activeSnippet.type === 'code' ? activeSnippet.content : activeSnippet.url);
    setFormSection(activeSection);
    setFormIsShared(activeSnippet.isShared || false);
    setEditingSnippetId(activeSnippet.id);
    setIsAdding(true);
  };

  const handleSaveSnippet = (e) => {
    e.preventDefault();
    
    const finalLangId = prismLanguages.find(l => l.label === formLangInput)?.id || formLangInput.trim().toLowerCase();
    const finalType = formCategory === 'url' ? formUrlType : 'code';

    const snippetData = {
      id: editingSnippetId || Date.now().toString(),
      title: formTitle,
      type: finalType,
      language: finalLangId,
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      isShared: formIsShared,
      ...(formCategory === 'url' ? { url: formContent } : { content: formContent })
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
    setMdPreview(true);
    resetFormFields();
  };

  const handleAddSection = (e) => {
    e.preventDefault();
    const name = newSectionName.trim();
    if (name && !db[name]) {
      setDb(prev => ({ ...prev, [name]: [] }));
      setActiveSection(name);
      if (collectionSortOrder === 'custom') setCustomCollectionOrder(prev => [...prev, name]);
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
      setMdPreview(true);
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
      
      // Update custom order reference if exists
      setCustomCollectionOrder(prev => {
         const newOrder = [...prev];
         const idx = newOrder.indexOf(oldName);
         if (idx !== -1) newOrder[idx] = newName;
         return newOrder;
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
      setCustomCollectionOrder(prev => prev.filter(c => c !== deleteCollectionConfirm));
      
      if (activeSection === deleteCollectionConfirm) {
        const remaining = Object.keys(db).filter(k => k !== deleteCollectionConfirm);
        setActiveSection(remaining[0] || "");
        setActiveSnippet(null);
        setMdPreview(true);
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
        
        /* Markdown Viewer Styles */
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; color: inherit; }
        .markdown-body h1 { font-size: 2em; padding-bottom: 0.3em; border-bottom: 1px solid #e5e7eb; }
        .dark .markdown-body h1 { border-bottom-color: #30363d; }
        .markdown-body h2 { font-size: 1.5em; }
        .markdown-body h3 { font-size: 1.25em; }
        .markdown-body p { margin-bottom: 1em; line-height: 1.6; }
        .markdown-body a { color: #2563eb; text-decoration: none; }
        .dark .markdown-body a { color: #58a6ff; }
        .markdown-body a:hover { text-decoration: underline; }
        .markdown-body ul, .markdown-body ol { padding-left: 2em; margin-bottom: 1em; }
        .markdown-body ul { list-style-type: disc; }
        .markdown-body ol { list-style-type: decimal; }
        .markdown-body code { background-color: rgba(175, 184, 193, 0.2); padding: 0.2em 0.4em; border-radius: 6px; font-family: monospace; font-size: 85%; }
        .markdown-body pre { background-color: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; margin-bottom: 1em; border: 1px solid #e5e7eb; }
        .dark .markdown-body pre { background-color: #161b22; border-color: #30363d; }
        .markdown-body pre code { background-color: transparent; padding: 0; }
        .markdown-body blockquote { border-left: 4px solid #d0d7de; padding-left: 1em; color: #656d76; margin-bottom: 1em; }
        .dark .markdown-body blockquote { border-left-color: #30363d; color: #8b949e; }
      `}</style>

      {isDragging && <div className="fixed inset-0 z-50 cursor-col-resize" />}

      {/* LEFT PANE */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 bg-gray-50 dark:bg-[#161b22] flex flex-col transition-all duration-300 relative border-r border-gray-200 dark:border-[#30363d]`}>
        <div className={`flex flex-col h-full overflow-hidden ${!isSidebarOpen && 'opacity-0 pointer-events-none'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-[#30363d] flex items-center justify-between min-w-[255px]">
            <div className="flex items-center gap-2 font-semibold">
              <FileCode size={20} className="text-blue-500 dark:text-[#58a6ff]" />
              <span>DevBinder</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-[#30363d] text-gray-500 dark:text-[#8b949e] transition-colors" title="Close Sidebar">
              <ChevronLeft size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-3 min-w-[255px]">
            <div className="px-4 text-xs font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider mb-2 flex items-center justify-between">
              Collections
              {collectionSortOrder === 'custom' && <SlidersHorizontal size={12} title="Custom Ordering Active" />}
            </div>
            <nav className="space-y-0.5 px-2">
              {displaySections.map(section => (
                <div key={section} className="relative group"
                     draggable={collectionSortOrder === 'custom'}
                     onDragStart={(e) => {
                       e.dataTransfer.setData('dragType', 'collection');
                       e.dataTransfer.setData('collectionName', section);
                     }}
                     onDragOver={(e) => { e.preventDefault(); setDragOverSection(section); }}
                     onDragLeave={() => setDragOverSection(null)}
                     onDrop={(e) => handleDropItem(e, section)}
                >
                  <button onClick={() => { setActiveSection(section); setActiveSnippet(null); setMdPreview(true); setIsSelectionMode(false); setSelectedIds(new Set()); }} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${dragOverSection === section ? 'bg-blue-200 dark:bg-[#388bfd]/30' : (activeSection === section ? 'bg-blue-100 text-blue-700 dark:bg-[#1f6feb] dark:text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-[#c9d1d9] dark:hover:bg-[#30363d]')}`}>
                    <Folder size={16} className={activeSection === section || dragOverSection === section ? "text-blue-700 dark:text-white" : "text-gray-400 dark:text-[#8b949e] flex-shrink-0"} />
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
            <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-[#c9d1d9] dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-transparent dark:border-[#30363d] rounded-md"><Settings size={16} /> Settings</button>
          </div>
        </div>
      </div>

      {/* MIDDLE PANE */}
      <div className="flex-shrink-0 bg-white dark:bg-[#0d1117] flex flex-col relative" style={{ width: `${middlePaneWidth}px` }}>
        <div className="p-4 border-b border-gray-200 dark:border-[#30363d] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:text-[#8b949e] dark:hover:text-white dark:hover:bg-[#30363d] rounded-md transition-colors" title="Open Sidebar">
                  <Menu size={16} />
                </button>
              )}
              <h2 className="font-semibold truncate pr-2">{activeSection || "Snippets"}</h2>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { 
                const newMode = !isSelectionMode;
                setIsSelectionMode(newMode); 
                if (newMode && bulkSelectDefaultAll) {
                  setSelectedIds(new Set(filteredSnippets.map(s => s.id)));
                } else {
                  setSelectedIds(new Set()); 
                }
              }} className={`p-1.5 rounded-md transition-colors ${isSelectionMode ? 'bg-blue-100 text-blue-600 dark:bg-[#1f6feb]/20 dark:text-[#58a6ff]' : 'text-gray-500 hover:bg-gray-100 dark:text-[#8b949e] dark:hover:text-white dark:hover:bg-[#30363d]'}`} title="Select Multiple">
                <CheckSquare size={16} />
              </button>
              <button onClick={() => { 
                resetFormFields();
                setFormSection(activeSection || displaySections[0] || ""); 
                setIsAdding(true); 
              }} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:text-[#8b949e] dark:hover:text-white dark:hover:bg-[#30363d] rounded-md transition-colors" title="Add Snippet">
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-[#8b949e]" size={14} />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-[#010409] border border-gray-300 dark:border-[#30363d] text-sm rounded-md pl-9 pr-3 py-1.5 focus:outline-none focus:border-blue-500 dark:focus:border-[#58a6ff]"/>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {isSelectionMode && selectedIds.size > 0 && (
          <div className="bg-blue-50 dark:bg-[#1f6feb]/10 border-b border-blue-100 dark:border-[#1f6feb]/20 p-2 flex items-center justify-between shadow-sm z-10">
            <span className="text-xs font-semibold text-blue-700 dark:text-[#58a6ff] px-2">{selectedIds.size} Selected</span>
            <div className="flex gap-1">
              <button onClick={() => handleBulkAction('share')} className="px-2 py-1 text-xs bg-white dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded hover:bg-gray-50 dark:hover:bg-[#30363d] text-gray-700 dark:text-[#c9d1d9]" title="Make Shareable"><Share2 size={12}/></button>
              <button onClick={() => handleBulkAction('private')} className="px-2 py-1 text-xs bg-white dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded hover:bg-gray-50 dark:hover:bg-[#30363d] text-gray-700 dark:text-[#c9d1d9]" title="Make Private"><Key size={12}/></button>
              <button onClick={() => handleBulkAction('delete')} className="px-2 py-1 text-xs bg-red-50 dark:bg-[#f85149]/10 border border-red-100 dark:border-[#f85149]/20 text-red-600 dark:text-[#f85149] rounded hover:bg-red-100 dark:hover:bg-[#f85149]/20" title="Delete"><Trash2 size={12}/></button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {filteredSnippets.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-[#8b949e] text-sm">No snippets found.</div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-[#21262d]">
              {filteredSnippets.map(snippet => (
                <li key={snippet.id}
                    draggable={!isSelectionMode}
                    onDragStart={(e) => {
                      if (isSelectionMode) return;
                      e.dataTransfer.setData('dragType', 'snippet');
                      e.dataTransfer.setData('snippetId', snippet.id);
                      e.dataTransfer.setData('sourceSection', activeSection);
                    }}
                    className={`flex items-stretch ${!isSelectionMode && 'cursor-grab active:cursor-grabbing'}`}
                >
                  {isSelectionMode && (
                    <div className="pl-4 py-4 flex items-start bg-white dark:bg-[#0d1117] border-b border-transparent">
                      <button onClick={() => {
                        const newSet = new Set(selectedIds);
                        if (newSet.has(snippet.id)) newSet.delete(snippet.id);
                        else newSet.add(snippet.id);
                        setSelectedIds(newSet);
                      }} className="text-gray-400 hover:text-blue-500 dark:text-[#8b949e] dark:hover:text-[#58a6ff]">
                        {selectedIds.has(snippet.id) ? <CheckSquare size={16} className="text-blue-500 dark:text-[#58a6ff]" /> : <Square size={16} />}
                      </button>
                    </div>
                  )}
                  <button onClick={() => { if(!isSelectionMode) { setActiveSnippet(snippet); setMdPreview(true); } }} className={`flex-1 text-left p-4 hover:bg-gray-50 dark:hover:bg-[#161b22] transition-colors flex items-start gap-3 ${activeSnippet?.id === snippet.id ? 'bg-blue-50 border-blue-500 dark:bg-[#161b22] border-l-2 dark:border-[#58a6ff]' : 'border-l-2 border-transparent'}`}>
                    <div className="mt-0.5 text-gray-400 dark:text-[#8b949e]">
                      {getIconForType(snippet.type, snippet.language)}
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
            <div className="p-4 border-b border-gray-200 dark:border-[#30363d] flex items-center justify-between bg-gray-50 dark:bg-[#161b22] flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">{activeSnippet.title}</h1>
                  {activeSnippet.isShared && <span className="bg-blue-100 text-blue-700 dark:bg-[#1f6feb]/20 dark:text-[#58a6ff] text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Share2 size={10}/> Shared</span>}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-mono text-gray-500 dark:text-[#8b949e] uppercase flex items-center gap-1">
                    {getIconForType(activeSnippet.type, activeSnippet.language, 12)}
                    {(!['link', 'sandbox', 'image', 'video'].includes(activeSnippet.type)) && (activeSnippet.language || activeSnippet.type)}
                  </span>
                  
                  {activeSnippet.type === 'code' && activeSnippet.language === 'markdown' && (
                    <div className="flex bg-gray-200 dark:bg-[#30363d] rounded-md p-0.5 ml-2">
                      <button onClick={() => setMdPreview(true)} className={`px-2 py-1 text-[10px] uppercase font-bold rounded-sm transition-colors ${mdPreview ? 'bg-white dark:bg-[#161b22] shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Preview</button>
                      <button onClick={() => setMdPreview(false)} className={`px-2 py-1 text-[10px] uppercase font-bold rounded-sm transition-colors ${!mdPreview ? 'bg-white dark:bg-[#161b22] shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Raw</button>
                    </div>
                  )}

                  <div className="flex gap-1.5">{activeSnippet.tags.map(tag => <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-white border-gray-300 dark:bg-[#21262d] dark:border-[#30363d] border text-gray-600 dark:text-[#c9d1d9]">{tag}</span>)}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={openEditSnippetModal} className="p-2 text-gray-500 hover:bg-gray-200 dark:text-[#8b949e] dark:hover:text-white dark:hover:bg-[#30363d] rounded-md"><Edit2 size={18} /></button>
                <button onClick={handleCopy} className="p-2 text-gray-500 hover:bg-gray-200 dark:text-[#8b949e] dark:hover:text-white dark:hover:bg-[#30363d] rounded-md">{copied ? <CheckCircle size={18} className="text-green-600 dark:text-[#3fb950]" /> : <Copy size={18} />}</button>
                <button onClick={() => setDeleteConfirmId(activeSnippet.id)} className="p-2 text-red-500 hover:bg-red-50 dark:text-[#f85149] dark:hover:bg-[#f85149]/10 rounded-md"><Trash2 size={18} /></button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-[#0d1117]">
              {activeSnippet.type === 'code' ? (
                (activeSnippet.language === 'markdown' && mdPreview) ? (
                  <MarkdownViewer content={activeSnippet.content} />
                ) : isCliLanguage(activeSnippet.language) ? (
                  <CliViewer content={activeSnippet.content} />
                ) : (
                  <div className="prism-code-override h-full">
                    <pre className="h-full p-4 overflow-auto text-sm font-mono"><code className={`language-${activeSnippet.language}`}>{activeSnippet.content}</code></pre>
                  </div>
                )
              ) : activeSnippet.type === 'sandbox' ? (
                <SandboxViewer url={activeSnippet.url} />
              ) : activeSnippet.type === 'image' ? (
                <ImageViewer url={activeSnippet.url} />
              ) : activeSnippet.type === 'video' ? (
                <VideoViewer url={activeSnippet.url} />
              ) : activeSnippet.type === 'link' ? (
                <div className="h-full w-full py-4"><LinkViewer url={activeSnippet.url} /></div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="bg-gray-50 dark:bg-[#161b22] px-4 py-2 flex items-center gap-2 border border-gray-200 dark:border-[#30363d] border-b-0 rounded-t-lg">
                    <Github size={16} className="text-gray-600 dark:text-[#c9d1d9]" />
                    <span className="text-xs text-gray-500 dark:text-[#8b949e] font-mono truncate flex-grow">{activeSnippet.url}</span>
                    <a href={activeSnippet.url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-[#58a6ff] hover:underline text-xs flex items-center gap-1">Open <ExternalLink size={12} /></a>
                  </div>
                  <div className="flex-1 w-full bg-gray-50 dark:bg-[#010409] rounded-b-lg border border-gray-200 dark:border-[#30363d]">
                    <GistEmbed url={activeSnippet.url} theme={theme} />
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

      {/* SETTINGS / DATA MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161b22] w-full max-w-3xl rounded-xl shadow-2xl border border-gray-200 dark:border-[#30363d] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117]">
               <h3 className="text-lg font-semibold flex items-center gap-2"><Settings size={18}/> Global Settings</h3>
               <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500 hover:text-gray-900 dark:text-[#8b949e] dark:hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="p-6 flex-grow overflow-y-auto flex flex-col gap-8">
              
              {/* Data Backup Section */}
              <div className="space-y-4">
                <h4 className="font-semibold border-b border-gray-200 dark:border-[#30363d] pb-2 text-gray-800 dark:text-white flex items-center gap-2"><Folder size={16} className="text-blue-500" /> Local Data Management</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-[#1f6feb]/10 border border-blue-100 dark:border-[#1f6feb]/20 rounded-lg p-4 flex flex-col items-start gap-3">
                    <div>
                      <h5 className="font-medium text-sm text-blue-800 dark:text-[#58a6ff]">Export Backup</h5>
                      <p className="text-xs text-blue-600/80 dark:text-[#58a6ff]/70 mt-1">Download your entire vault as a JSON file.</p>
                    </div>
                    <button onClick={exportJSON} className="mt-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center gap-2 transition-colors"><Download size={14}/> Export JSON</button>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded-lg p-4 flex flex-col items-start gap-3">
                    <div>
                      <h5 className="font-medium text-sm">Import Data</h5>
                      <p className="text-xs text-gray-500 dark:text-[#8b949e] mt-1">Upload a DevBinder JSON backup.</p>
                    </div>
                    <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={(e) => handleJSONImport(e, false)} />
                    <div className="flex gap-2 mt-auto w-full">
                      <button onClick={() => fileInputRef.current.click()} className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-[#30363d] dark:hover:bg-[#484f58] text-gray-800 dark:text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"><Upload size={14}/> Merge File</button>
                      <button onClick={() => { if(window.confirm('This will wipe your current database. Proceed?')) { fileInputRef.current.onchange = (e) => handleJSONImport(e, true); fileInputRef.current.click(); } }} className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-[#f85149] dark:hover:bg-red-900/20 rounded-md text-sm font-medium transition-colors">Overwrite</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* GitHub Sync Section */}
              <div className="space-y-4">
                <h4 className="font-semibold border-b border-gray-200 dark:border-[#30363d] pb-2 text-gray-800 dark:text-white flex items-center gap-2"><Github size={16} /> GitHub API Synchronization</h4>
                <div className="bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded-lg p-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-1">GitHub Personal Access Token (PAT)</label>
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
              </div>

              {/* Preferences */}
              <div className="space-y-4">
                <h4 className="font-semibold border-b border-gray-200 dark:border-[#30363d] pb-2 text-gray-800 dark:text-white flex items-center gap-2"><SlidersHorizontal size={16} className="text-purple-500" /> Preferences</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                    <div>
                      <h5 className="font-medium text-sm">Application Theme</h5>
                      <p className="text-xs text-gray-500 dark:text-[#8b949e]">Toggle between light and dark modes.</p>
                    </div>
                    <select value={theme} onChange={(e) => setTheme(e.target.value)} className="bg-white dark:bg-[#010409] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none">
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                    <div>
                      <h5 className="font-medium text-sm">Bulk Selection Default</h5>
                      <p className="text-xs text-gray-500 dark:text-[#8b949e]">When entering select mode, default to all snippets checked.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={bulkSelectDefaultAll} onChange={(e) => setBulkSelectDefaultAll(e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
                    <div>
                      <h5 className="font-medium text-sm">Collection Sort Order</h5>
                      <p className="text-xs text-gray-500 dark:text-[#8b949e]">If 'Custom', drag and drop collections in the sidebar to reorder.</p>
                    </div>
                    <select value={collectionSortOrder} onChange={(e) => setCollectionSortOrder(e.target.value)} className="bg-white dark:bg-[#010409] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none">
                      <option value="asc">Ascending (A-Z)</option>
                      <option value="desc">Descending (Z-A)</option>
                      <option value="custom">Custom (Drag & Drop)</option>
                    </select>
                  </div>
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
               <button onClick={() => resetFormFields()} className="text-gray-500 hover:text-gray-900 dark:text-[#8b949e] dark:hover:text-white"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto">
              <form onSubmit={handleSaveSnippet} className="p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#c9d1d9] mb-1">Title</label>
                    <input required type="text" value={formTitle} onChange={e=>setFormTitle(e.target.value)} className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none" />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#c9d1d9] mb-1">Collection</label>
                    <select value={formSection} onChange={e=>setFormSection(e.target.value)} className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none">{displaySections.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#c9d1d9] mb-1">Source Category</label>
                    <select 
                      value={formCategory} 
                      onChange={e => setFormCategory(e.target.value)} 
                      className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none"
                    >
                      <option value="code">Raw Code</option>
                      <option value="url">External URL / Media</option>
                    </select>
                  </div>
                  <div className="w-1/3">
                    {formCategory === 'code' ? (
                      <>
                        <label className="block text-sm font-medium text-gray-700 dark:text-[#c9d1d9] mb-1">Language</label>
                        <input 
                          type="text" 
                          list="prism-languages"
                          value={formLangInput} 
                          onChange={e=>setFormLangInput(e.target.value)} 
                          className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none" 
                          placeholder="e.g. javascript" 
                        />
                        <datalist id="prism-languages">
                          {prismLanguages.map(lang => <option key={lang.id} value={lang.label} />)}
                        </datalist>
                      </>
                    ) : (
                      <>
                        <label className="block text-sm font-medium text-gray-700 dark:text-[#c9d1d9] mb-1">Media Type</label>
                        <select 
                          value={formUrlType} 
                          onChange={e => setFormUrlType(e.target.value)} 
                          className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none"
                        >
                          <option value="link">Web Link</option>
                          <option value="image">Image URL</option>
                          <option value="video">Video URL (YT/MP4)</option>
                          <option value="sandbox">Code Sandbox Embed</option>
                          <option value="gist">GitHub Gist URL</option>
                        </select>
                      </>
                    )}
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#c9d1d9] mb-1">Tags (comma sep)</label>
                    <input type="text" value={formTags} onChange={e=>setFormTags(e.target.value)} className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-md p-2 text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none" />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#010409] border border-gray-200 dark:border-[#30363d] rounded-md">
                  <input type="checkbox" id="isShared" checked={formIsShared} onChange={(e) => setFormIsShared(e.target.checked)} className="rounded" />
                  <label htmlFor="isShared" className="text-sm font-medium text-gray-700 dark:text-[#c9d1d9] cursor-pointer flex items-center gap-2">
                    <Share2 size={14} className="text-blue-500 dark:text-[#58a6ff]" /> Share Publicly (Sync to Repository)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#c9d1d9] mb-1">
                    {formCategory === 'code' ? 'Content' : 'URL'}
                  </label>
                  {formCategory === 'code' ? (
                    <textarea required value={formContent} onChange={e=>setFormContent(e.target.value)} className="w-full bg-gray-50 dark:bg-[#010409] border border-gray-300 dark:border-[#30363d] rounded-md p-3 font-mono text-sm h-40 min-h-[120px] max-h-[60vh] focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none resize-y" /> 
                  ) : (
                    <input required type="url" value={formContent} onChange={e=>setFormContent(e.target.value)} className="w-full bg-gray-50 dark:bg-[#010409] border border-gray-300 dark:border-[#30363d] rounded-md p-2 font-mono text-sm focus:border-blue-500 dark:focus:border-[#58a6ff] focus:outline-none" placeholder="https://" />
                  )}
                </div>
                <div className="flex justify-end pt-4 gap-3 border-t border-gray-200 dark:border-[#30363d] mt-4">
                  <button type="button" onClick={() => resetFormFields()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-[#c9d1d9] dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-transparent dark:border-[#30363d] rounded-md transition-colors">Cancel</button>
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
