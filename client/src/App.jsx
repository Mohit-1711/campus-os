import { useCallback, useEffect, useMemo, useState } from "react";
import AuthPage from "./AuthPage";
import { authApi } from "./api/auth";
import { resourcesApi } from "./api/resources";
import "./App.css";

const modules = [
  {
    id: "resources",
    title: "Academic resources",
    description:
      "Your notes, assignments and study material, organized by subject.",
    icon: "folder",
    status: "available",
    accent: "purple",
    eyebrow: "YOUR STUDY SPACE",
  },
  {
    id: "study-assistant",
    title: "AI study assistant",
    description:
      "Understand difficult topics and revise from your own study material.",
    icon: "sparkles",
    status: "coming-soon",
    accent: "blue",
    eyebrow: "LEARN SMARTER",
  },
  {
    id: "resume-builder",
    title: "Resume builder",
    description:
      "Turn your projects and experience into a clear, role-focused resume.",
    icon: "resume",
    status: "coming-soon",
    accent: "orange",
    eyebrow: "CAREER READY",
  },
  {
    id: "dsa-tracker",
    title: "DSA tracker",
    description:
      "Keep track of coding practice, topics to revisit, and problem-solving progress.",
    icon: "code",
    status: "coming-soon",
    accent: "green",
    eyebrow: "BUILD CONSISTENCY",
  },
];

function getFolderInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getFolderTone(name = "") {
  const tones = ["purple", "green", "orange", "blue"];
  const hash = [...name].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return tones[hash % tones.length];
}

function formatFileSize(bytes) {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getFileType(mimeType = "") {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.includes("word")) return "DOC";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
    return "PPT";
  }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return "XLS";
  }
  if (mimeType.startsWith("text/")) return "TEXT";

  return "FILE";
}

function getErrorMessage(error, fallback) {
  return (
    error.response?.data?.error || error.response?.data?.message || fallback
  );
}

function Icon({ name, size = 20, strokeWidth = 1.8 }) {
  const paths = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
        <path d="M3.5 10h17" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
        <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
      </>
    ),
    resume: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </>
    ),
    code: <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />,
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" />
        <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h7M8 10h7" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a7.7 7.7 0 0 1-1.6.9L16 20.5h-2.8l-.3-1.8a7.7 7.7 0 0 1-1.8 0l-.3 1.8H8l-.3-1.7a7.7 7.7 0 0 1-1.6-.9l-1.7.7L3 16.2l1.4-1.1a7.2 7.2 0 0 1 0-1.9L3 12.1l1.4-2.4 1.7.7a7.7 7.7 0 0 1 1.6-.9L8 7.8h2.8l.3 1.8a7.7 7.7 0 0 1 1.8 0l.3-1.8H16l.3 1.7a7.7 7.7 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a7.2 7.2 0 0 1-.2 1.8z" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 1 1 8 0v3" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    upload: (
      <>
        <path d="M12 16V4m-4 4 4-4 4 4" />
        <path d="M4 16v4h16v-4" />
      </>
    ),
    dots: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.file}
    </svg>
  );
}

function Brand() {
  return (
    <div className="brand">
      <img className="brand-mark" src="/favicon.svg" alt="Campus OS logo" />
      <div>
        <div className="brand-name">
          campus os<span className="brand-period">.</span>
        </div>
        <div className="brand-tagline">YOUR ACADEMIC SPACE</div>
      </div>
    </div>
  );
}

function Status({ status }) {
  return status === "available" ? (
    <span className="status status-available">
      <span className="status-dot" /> Available
    </span>
  ) : (
    <span className="status status-coming">
      <Icon name="clock" size={12} /> Coming soon
    </span>
  );
}

function ModuleCard({ module, onSelect }) {
  return (
    <article className={`module-card accent-${module.accent}`}>
      <div className="module-card-heading">
        <div className={`module-icon module-icon-${module.accent}`}>
          <Icon name={module.icon} size={22} />
        </div>
        <Status status={module.status} />
      </div>
      <div className="module-eyebrow">{module.eyebrow}</div>
      <h3>{module.title}</h3>
      <p>{module.description}</p>
      <button
        className={`module-link ${module.status === "coming-soon" ? "module-link-muted" : ""}`}
        onClick={() => onSelect(module.id)}
      >
        {module.status === "available"
          ? "Open workspace"
          : "See what's planned"}{" "}
        <Icon name="arrow" size={16} />
      </button>
    </article>
  );
}

function ComingSoonPage({ module, onBack }) {
  const details =
    {
      "study-assistant": [
        [
          "Learn from your notes",
          "Ask questions using your own uploaded study material.",
        ],
        [
          "Make complex topics clearer",
          "Get structured explanations at your level.",
        ],
        [
          "Revise with purpose",
          "Create summaries and exam-focused revision material.",
        ],
      ],
      "resume-builder": [
        [
          "Bring your experience together",
          "Organize skills, education, projects and experience.",
        ],
        [
          "Tailor your resume",
          "Improve wording for a role without inventing achievements.",
        ],
        [
          "Export a polished PDF",
          "Prepare a professional resume you can share.",
        ],
      ],
      "dsa-tracker": [
        [
          "Keep practice organized",
          "Save problem links and record completion status.",
        ],
        ["Spot topics to revisit", "Review your work by difficulty and topic."],
        [
          "Build a revision habit",
          "Mark problems to do again and keep your plan visible.",
        ],
      ],
    }[module.id] || [];

  return (
    <div className="page-content coming-page">
      <button className="back-link" onClick={onBack}>
        ← <span>Back to dashboard</span>
      </button>
      <section className={`coming-hero accent-${module.accent}`}>
        <div className={`module-icon module-icon-${module.accent} coming-icon`}>
          <Icon name={module.icon} size={26} />
        </div>
        <Status status="coming-soon" />
        <h1>{module.title}</h1>
        <p>{module.description}</p>
        <div className="coming-message">
          <Icon name="lock" size={16} /> We're building this thoughtfully. This
          section isn't functional yet.
        </div>
        <div className="coming-decoration decoration-one" />
        <div className="coming-decoration decoration-two" />
      </section>
      <section className="planned-section">
        <div className="section-heading">
          <div>
            <div className="module-eyebrow">THE PLAN</div>
            <h2>Designed around your real workflow.</h2>
            <p>Here's what we're working toward for this part of Campus OS.</p>
          </div>
        </div>
        <div className="planned-grid">
          {details.map(([title, description], index) => (
            <article className="planned-card" key={title}>
              <div className="planned-number">0{index + 1}</div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [authStatus, setAuthStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [foldersError, setFoldersError] = useState("");
  const [filesError, setFilesError] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [createFolderError, setCreateFolderError] = useState("");

  const checkSession = useCallback(async () => {
    setAuthStatus("loading");
    setAuthError("");

    try {
      const data = await authApi.getMe();

      setUser(data.user);
      setAuthStatus("authenticated");
    } catch (error) {
      if (error.response?.status === 401) {
        setUser(null);
        setAuthStatus("unauthenticated");
      } else {
        setAuthError(
          error.response?.data?.message ||
            "Unable to connect to the server. Please try again.",
        );
        setAuthStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const loadFolders = useCallback(async () => {
    setFoldersLoading(true);
    setFoldersError("");

    try {
      const data = await resourcesApi.getFolders();
      const backendFolders = Array.isArray(data.folders) ? data.folders : [];

      const mappedFolders = backendFolders.map((folder) => ({
        ...folder,
        id: folder._id,
        subject: "Course materials",
        initials: getFolderInitials(folder.name),
        tone: getFolderTone(folder.name),
        count: 0,
      }));

      setFolders(mappedFolders);
      return mappedFolders;
    } catch (error) {
      setFoldersError(getErrorMessage(error, "Unable to load your folders."));
      throw error;
    } finally {
      setFoldersLoading(false);
    }
  }, []);

  const loadFiles = useCallback(async (folderList) => {
    setFilesLoading(true);
    setFilesError("");

    try {
      const results = await Promise.allSettled(
        folderList.map(async (folder) => {
          const data = await resourcesApi.getFiles(folder._id);
          const folderFiles = Array.isArray(data.files) ? data.files : [];

          return {
            folder,
            files: folderFiles.map((file) => ({
              ...file,
              id: file._id,
              folderId: folder._id,
              folder: folder.name,
              type: getFileType(file.mimeType || ""),
              updated: formatDate(file.updatedAt || file.createdAt),
              sizeLabel: formatFileSize(file.size),
            })),
          };
        }),
      );

      const loadedFiles = [];
      const failedRequests = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const { folder, files: folderFiles } = result.value;

          loadedFiles.push(...folderFiles);

          setFolders((currentFolders) =>
            currentFolders.map((item) =>
              item.id === folder.id
                ? { ...item, count: folderFiles.length }
                : item,
            ),
          );
        } else {
          failedRequests.push(folderList[index].name);
        }
      });

      loadedFiles.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );

      setFiles(loadedFiles);

      if (failedRequests.length > 0) {
        setFilesError(
          `Couldn't load files from ${failedRequests.join(", ")}. Try refreshing.`,
        );
      }
    } catch (error) {
      setFilesError(getErrorMessage(error, "Unable to load your files."));
    } finally {
      setFilesLoading(false);
    }
  }, []);

  async function handleCreateFolder(event) {
    event.preventDefault();

    const name = newFolderName.trim();

    if (!name) {
      setCreateFolderError("Please enter a folder name.");
      return;
    }

    if (isCreatingFolder) return;

    setIsCreatingFolder(true);
    setCreateFolderError("");

    try {
      await resourcesApi.createFolder(name);

      setNewFolderName("");
      setShowCreateFolder(false);

      await refreshResources();
    } catch (error) {
      setCreateFolderError(
        getErrorMessage(
          error,
          "Unable to create the folder. Please try again.",
        ),
      );
    } finally {
      setIsCreatingFolder(false);
    }
  }

  const refreshResources = useCallback(async () => {
    try {
      const loadedFolders = await loadFolders();
      await loadFiles(loadedFolders);
    } catch {
      // loadFolders already sets the visible error state.
    }
  }, [loadFolders, loadFiles]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    refreshResources();
  }, [authStatus, refreshResources]);

  async function handleLogin(credentials) {
    try {
      await authApi.login(credentials);

      const data = await authApi.getMe();

      setUser(data.user);
      setAuthStatus("authenticated");
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Login failed. Please try again.",
      );
    }
  }

  async function handleSignup(formData) {
    try {
      await authApi.signup(formData);
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Account creation failed. Please try again.",
      );
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    setAuthError("");

    try {
      await authApi.logout();

      setUser(null);
      setAuthStatus("unauthenticated");
      setFolders([]);
      setFiles([]);
      setActivePage("dashboard");
      setSearch("");
      setMobileNavOpen(false);
    } catch (error) {
      setAuthError(
        error.response?.data?.message || "Unable to log out. Please try again.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  const activeModule = modules.find((module) => module.id === activePage);

  const filteredFolders = useMemo(
    () =>
      folders.filter((folder) =>
        `${folder.name ?? ""} ${folder.subject ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [folders, search],
  );

  const filteredFiles = useMemo(
    () =>
      files.filter((file) =>
        `${file.name ?? ""} ${file.folder ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [files, search],
  );

  const navigate = (page) => {
    setActivePage(page);
    setMobileNavOpen(false);
    setSearch("");
  };

  const navItems = [
    { id: "dashboard", label: "Overview", icon: "grid" },
    {
      id: "resources",
      label: "Academic resources",
      icon: "folder",
      group: "YOUR WORKSPACE",
    },
    {
      id: "study-assistant",
      label: "AI study assistant",
      icon: "sparkles",
      soon: true,
    },
    {
      id: "resume-builder",
      label: "Resume builder",
      icon: "resume",
      soon: true,
    },
    { id: "dsa-tracker", label: "DSA tracker", icon: "code", soon: true },
  ];

  if (authStatus === "loading") {
    return (
      <main className="auth-loading">
        <p>Checking your session...</p>
      </main>
    );
  }

  if (authStatus === "error") {
    return (
      <main className="auth-loading">
        <p role="alert">{authError}</p>
        <button type="button" onClick={checkSession}>
          Retry
        </button>
      </main>
    );
  }

  if (authStatus === "unauthenticated") {
    return <AuthPage onLogin={handleLogin} onSignup={handleSignup} />;
  }

  const renderFolderCard = (folder, showOpenButton = true) => (
    <article className="folder-card" key={folder.id}>
      <div className={`folder-monogram folder-${folder.tone}`}>
        {folder.initials}
      </div>
      <div className="folder-info">
        <h3>{folder.name}</h3>
        <p>{folder.subject}</p>
        <span>
          {folder.count} {folder.count === 1 ? "item" : "items"}
        </span>
      </div>
      {showOpenButton && (
        <button
          className="folder-open"
          onClick={() => navigate("resources")}
          aria-label={`View ${folder.name}`}
        >
          <Icon name="chevron" size={17} />
        </button>
      )}
    </article>
  );

  const renderFileRow = (file) => (
    <div className="file-row" key={file.id}>
      <div className="file-primary">
        <span className="file-type-icon">{file.type}</span>
        <div>
          <strong>{file.name}</strong>
          <span>{file.type} document</span>
        </div>
      </div>
      <span className="file-folder">{file.folder}</span>
      <span className="file-updated">{file.updated}</span>
      <span className="file-size">{file.sizeLabel}</span>
      <button
        className="file-more"
        aria-label={`Actions for ${file.name}`}
        disabled
        title="File actions will be added in a later step"
      >
        <Icon name="dots" size={18} />
      </button>
    </div>
  );

  const renderFileTable = (visibleFiles) => (
    <div className="file-table">
      <div className="file-table-head">
        <span>FILE</span>
        <span>FOLDER</span>
        <span>UPDATED</span>
        <span>SIZE</span>
        <span />
      </div>
      {visibleFiles.map(renderFileRow)}
    </div>
  );

  const renderFolderLoading = () => (
    <div className="empty-state" role="status">
      Loading your folders...
    </div>
  );

  const renderFolderError = () => (
    <div className="empty-state" role="alert">
      <p>{foldersError}</p>
      <button
        className="button-secondary"
        type="button"
        onClick={refreshResources}
        disabled={foldersLoading}
      >
        {foldersLoading ? "Retrying..." : "Retry"}
      </button>
    </div>
  );

  return (
    <div className="app-shell">
      {mobileNavOpen && (
        <button
          className="mobile-scrim"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <Brand />
        <div className="sidebar-section-label">MENU</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <div key={item.id}>
              {item.group && (
                <div className="sidebar-section-label nav-group-label">
                  {item.group}
                </div>
              )}
              <button
                className={`nav-item ${activePage === item.id ? "nav-item-active" : ""}`}
                onClick={() => navigate(item.id)}
              >
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
                {item.soon && <span className="nav-soon">SOON</span>}
              </button>
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-promo">
            <div className="promo-icon">
              <Icon name="sparkles" size={17} />
            </div>
            <strong>One space. More progress.</strong>
            <p>Your tools for college, learning and what's next.</p>
          </div>

          <button
            className={`nav-item ${activePage === "profile" ? "nav-item-active" : ""}`}
            onClick={() => navigate("profile")}
          >
            <Icon name="user" size={18} />
            <span>Profile</span>
          </button>

          <button
            className={`nav-item ${activePage === "settings" ? "nav-item-active" : ""}`}
            onClick={() => navigate("settings")}
          >
            <Icon name="settings" size={18} />
            <span>Settings</span>
          </button>

          <div className="sidebar-account">
            <div className="account-avatar">
              {user?.name?.trim()?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div className="account-copy">
              <strong>{user?.name || "Campus OS"}</strong>
              <span>{user?.email || "Student workspace"}</span>
            </div>
            <button
              className="account-more"
              type="button"
              aria-label="Log out"
              title="Log out"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "..." : <Icon name="dots" size={18} />}
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Icon name="menu" size={21} />
          </button>

          <div className="breadcrumbs">
            <span>Workspace</span>
            <Icon name="chevron" size={14} />
            <strong>
              {activePage === "dashboard"
                ? "Overview"
                : activeModule?.title ||
                  (activePage === "profile"
                    ? "Profile"
                    : activePage === "settings"
                      ? "Settings"
                      : "Academic resources")}
            </strong>
          </div>

          <div className="topbar-right">
            <label className="search-field">
              <Icon name="search" size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search resources..."
                aria-label="Search academic resources"
              />
              <kbd>⌘ K</kbd>
            </label>

            <button className="notification-button" aria-label="Notifications">
              <Icon name="bell" size={18} />
              <span />
            </button>

            <button
              className="top-avatar"
              onClick={() => navigate("profile")}
              aria-label="Open profile"
            >
              {user?.name?.trim()?.charAt(0)?.toUpperCase() || "C"}
            </button>
          </div>
        </header>

        {activeModule && activeModule.status === "coming-soon" ? (
          <ComingSoonPage
            module={activeModule}
            onBack={() => navigate("dashboard")}
          />
        ) : activePage === "profile" || activePage === "settings" ? (
          <div className="page-content">
            <div className="page-title">
              <div className="module-eyebrow">YOUR ACCOUNT</div>
              <h1>{activePage === "profile" ? "Profile" : "Settings"}</h1>
              <p>
                Account controls will be connected after the authentication and
                profile flow is wired into the frontend.
              </p>
            </div>
            <div className="placeholder-panel">
              <div className="placeholder-icon">
                <Icon
                  name={activePage === "profile" ? "user" : "settings"}
                  size={24}
                />
              </div>
              <h2>
                {activePage === "profile"
                  ? "Your profile, in one place."
                  : "Make this space yours."}
              </h2>
              <p>
                This is a UI placeholder for now. It doesn't save account
                details or preferences yet.
              </p>
              <button
                className="button-primary"
                onClick={() => navigate("dashboard")}
              >
                Back to overview <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
        ) : activePage === "resources" ? (
          <div className="page-content">
            <div className="page-title title-with-action">
              <div>
                <div className="module-eyebrow">YOUR WORKSPACE</div>
                <h1>Academic resources</h1>
                <p>Keep your study material organized and easy to find.</p>
              </div>
              <button
                className="button-secondary"
                onClick={() => navigate("dashboard")}
              >
                Back to overview
              </button>
            </div>

            <section className="content-section">
              <div className="section-heading">
                <div>
                  <h2>Your folders</h2>
                  <p>Organize resources by subject or semester.</p>
                </div>

                <div className="folder-heading-actions">
                  <span className="section-count">
                    {foldersLoading
                      ? "Loading..."
                      : `${filteredFolders.length} folders`}
                  </span>

                  <button
                    className="button-primary"
                    type="button"
                    onClick={() => {
                      setCreateFolderError("");
                      setNewFolderName("");
                      setShowCreateFolder(true);
                    }}
                    disabled={foldersLoading || isCreatingFolder}
                  >
                    <Icon name="plus" size={17} />
                    New Folder
                  </button>
                </div>
              </div>

              {showCreateFolder && (
                <form
                  className="create-folder-form"
                  onSubmit={handleCreateFolder}
                >
                  <label htmlFor="new-folder-name">Folder name</label>

                  <input
                    id="new-folder-name"
                    type="text"
                    value={newFolderName}
                    onChange={(event) => {
                      setNewFolderName(event.target.value);
                      setCreateFolderError("");
                    }}
                    placeholder="e.g. Semester 5"
                    maxLength={100}
                    autoFocus
                    required
                    disabled={isCreatingFolder}
                  />

                  {createFolderError && (
                    <p className="form-error" role="alert">
                      {createFolderError}
                    </p>
                  )}

                  <div className="create-folder-actions">
                    <button
                      className="button-secondary"
                      type="button"
                      onClick={() => {
                        setShowCreateFolder(false);
                        setNewFolderName("");
                        setCreateFolderError("");
                      }}
                      disabled={isCreatingFolder}
                    >
                      Cancel
                    </button>

                    <button
                      className="button-primary"
                      type="submit"
                      disabled={isCreatingFolder || !newFolderName.trim()}
                    >
                      {isCreatingFolder ? "Creating..." : "Create folder"}
                    </button>
                  </div>
                </form>
              )}

              {foldersLoading ? (
                renderFolderLoading()
              ) : foldersError ? (
                renderFolderError()
              ) : (
                <div className="folder-grid">
                  {filteredFolders.map((folder) => renderFolderCard(folder))}

                  {filteredFolders.length === 0 && (
                    <div className="empty-state">
                      {search
                        ? `No folders match "${search}".`
                        : "You don't have any folders yet. Your folders will appear here once you create them."}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="content-section">
              <div className="section-heading">
                <div>
                  <h2>Recent files</h2>
                  <p>Pick up where you left off.</p>
                </div>
                <span className="section-count">
                  {filesLoading
                    ? "Loading..."
                    : `${filteredFiles.length} files`}
                </span>
              </div>

              {filesError && (
                <div className="empty-state" role="alert">
                  <p>{filesError}</p>
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={refreshResources}
                    disabled={filesLoading || foldersLoading}
                  >
                    Refresh resources
                  </button>
                </div>
              )}

              {filesLoading ? (
                <div className="empty-state" role="status">
                  Loading your files...
                </div>
              ) : (
                <>
                  {renderFileTable(filteredFiles)}
                  {filteredFiles.length === 0 && !filesError && (
                    <div className="empty-state">
                      {search
                        ? `No files match "${search}".`
                        : "No files to show yet. Files inside your folders will appear here."}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        ) : (
          <div className="page-content">
            <section className="welcome-banner">
              <div className="welcome-content">
                <div className="welcome-label">
                  <span className="welcome-label-dot" /> YOUR PERSONAL ACADEMIC
                  WORKSPACE
                </div>
                <h1>
                  Your college life,
                  <br />
                  <span>in one place.</span>
                </h1>
                <p>
                  Organize your study material, learn with more confidence, and
                  get ready for what's next.
                </p>
                <div className="welcome-buttons">
                  <button
                    className="button-primary"
                    onClick={() => navigate("resources")}
                  >
                    <Icon name="folder" size={17} /> Explore resources{" "}
                    <Icon name="arrow" size={16} />
                  </button>
                  <span className="welcome-footnote">
                    <Icon name="check" size={14} /> Built for your next step
                  </span>
                </div>
              </div>

              <div className="welcome-visual" aria-hidden="true">
                <div className="visual-glow" />
                <div className="visual-orbit visual-orbit-one" />
                <div className="visual-orbit visual-orbit-two" />
                <div className="visual-card visual-card-main">
                  <div className="visual-card-top">
                    <div className="visual-mini-icon">
                      <Icon name="book" size={17} />
                    </div>
                    <span>MY STUDY SPACE</span>
                    <span className="visual-card-dot" />
                  </div>
                  <div className="visual-lines">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="visual-progress">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className="visual-float visual-float-file">
                  <div className="float-file-icon">
                    <Icon name="file" size={17} />
                  </div>
                  <div>
                    <strong>Lecture notes</strong>
                    <span>Ready when you are</span>
                  </div>
                  <span className="float-check">
                    <Icon name="check" size={12} />
                  </span>
                </div>
                <div className="visual-float visual-float-sparkle">
                  <Icon name="sparkles" size={20} />
                </div>
                <div className="visual-dot visual-dot-one" />
                <div className="visual-dot visual-dot-two" />
              </div>
            </section>

            <section className="modules-section">
              <div className="section-heading modules-heading">
                <div>
                  <div className="module-eyebrow">YOUR TOOLKIT</div>
                  <h2>Everything you're working toward.</h2>
                  <p>
                    Start with your resources. More ways to study and grow are
                    on the way.
                  </p>
                </div>
                <span className="section-count">4 modules</span>
              </div>

              <div className="modules-grid">
                {modules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onSelect={navigate}
                  />
                ))}
              </div>
            </section>

            <section className="content-section overview-resources">
              <div className="section-heading">
                <div>
                  <div className="module-eyebrow">STAY ORGANIZED</div>
                  <h2>Your academic resources</h2>
                  <p>
                    A home for the material you use throughout the semester.
                  </p>
                </div>
                <button
                  className="section-link"
                  onClick={() => navigate("resources")}
                >
                  View workspace <Icon name="arrow" size={16} />
                </button>
              </div>

              {foldersLoading ? (
                renderFolderLoading()
              ) : foldersError ? (
                renderFolderError()
              ) : (
                <div className="folder-grid">
                  {folders
                    .slice(0, 3)
                    .map((folder) => renderFolderCard(folder))}
                  {folders.length === 0 && (
                    <div className="empty-state">
                      You don't have any folders yet. Create folders to organize
                      your academic resources.
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="content-section recent-section">
              <div className="section-heading">
                <div>
                  <div className="module-eyebrow">RECENTLY IN YOUR SPACE</div>
                  <h2>Recent files</h2>
                </div>
                <button
                  className="section-link"
                  onClick={() => navigate("resources")}
                >
                  All resources <Icon name="arrow" size={16} />
                </button>
              </div>

              {filesLoading ? (
                <div className="empty-state" role="status">
                  Loading your files...
                </div>
              ) : (
                <>
                  {renderFileTable(files.slice(0, 3))}
                  {files.length === 0 && (
                    <div className="empty-state">
                      No files to show yet. Files inside your folders will
                      appear here.
                    </div>
                  )}
                  {filesError && (
                    <div className="empty-state" role="alert">
                      <p>{filesError}</p>
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={refreshResources}
                        disabled={filesLoading || foldersLoading}
                      >
                        Refresh resources
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            <footer className="page-footer">
              <span>
                Campus OS <span className="footer-dot">·</span> Your academic
                space
              </span>
              <span>One step at a time.</span>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
