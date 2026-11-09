import { useMemo, useState } from "react";
import EmptyState from "../ui/EmptyState";
import Icon from "../ui/Icon";
import { useResources } from "../../context/ResourcesContext";
import FileTable from "./FileTable";
import FolderCard from "./FolderCard";
import ResourceDialogs from "./ResourceDialogs";

/** /resources — every folder, plus every file with a search box. */
export default function FolderOverview() {
  const { folders, files } = useResources();
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState(null);

  const needle = query.trim().toLowerCase();

  const visibleFolders = useMemo(
    () => (needle ? folders.filter((folder) => folder.name.toLowerCase().includes(needle)) : folders),
    [folders, needle],
  );

  const visibleFiles = useMemo(
    () =>
      needle
        ? files.filter((file) => `${file.name} ${file.folderName}`.toLowerCase().includes(needle))
        : files,
    [files, needle],
  );

  return (
    <>
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Your study space</p>
          <h1>Academic resources</h1>
          <p>Organize notes, assignments and study material by subject.</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn--primary" onClick={() => setDialog({ type: "createFolder" })}>
            <Icon name="plus" size={16} /> New folder
          </button>
        </div>
      </header>

      <label className="search-box">
        <Icon name="search" size={18} />
        <input
          type="search"
          placeholder="Search folders and files"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search folders and files"
        />
      </label>

      <section className="resources-section">
        <h2 className="section-title">Folders</h2>

        {folders.length === 0 ? (
          <EmptyState title="No folders yet" description="Create a folder for each subject, then upload your files into it.">
            <button type="button" className="btn btn--primary" onClick={() => setDialog({ type: "createFolder" })}>
              Create your first folder
            </button>
          </EmptyState>
        ) : visibleFolders.length === 0 ? (
          <EmptyState title="No matching folders" description={`Nothing matches "${query}".`} />
        ) : (
          <div className="folder-grid">
            {visibleFolders.map((folder) => (
              <FolderCard
                key={folder._id}
                folder={folder}
                onRename={(target) => setDialog({ type: "renameFolder", target })}
                onDelete={(target) => setDialog({ type: "deleteFolder", target })}
              />
            ))}
          </div>
        )}
      </section>

      {files.length > 0 && (
        <section className="resources-section">
          <h2 className="section-title">{needle ? "Matching files" : "All files"}</h2>

          {visibleFiles.length === 0 ? (
            <EmptyState title="No matching files" description={`Nothing matches "${query}".`} />
          ) : (
            <div className="card">
              <FileTable
                files={visibleFiles}
                showFolder
                onRename={(target) => setDialog({ type: "renameFile", target })}
                onDelete={(target) => setDialog({ type: "deleteFile", target })}
              />
            </div>
          )}
        </section>
      )}

      <ResourceDialogs dialog={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
