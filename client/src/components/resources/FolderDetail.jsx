import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../ui/EmptyState";
import Icon from "../ui/Icon";
import { useResources } from "../../context/ResourcesContext";
import FileTable from "./FileTable";
import ResourceDialogs from "./ResourceDialogs";
import UploadButton from "./UploadButton";

/** /resources/:folderId — the files inside one folder. */
export default function FolderDetail({ folderId }) {
  const navigate = useNavigate();
  const { folders, files } = useResources();

  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const folder = folders.find((item) => item._id === folderId);

  const folderFiles = useMemo(() => files.filter((file) => file.folder === folderId), [files, folderId]);

  const needle = query.trim().toLowerCase();
  const visibleFiles = needle
    ? folderFiles.filter((file) => file.name.toLowerCase().includes(needle))
    : folderFiles;

  if (!folder) {
    return (
      <EmptyState title="Folder not found" description="This folder may have been deleted.">
        <Link to="/resources" className="btn btn--primary">Back to resources</Link>
      </EmptyState>
    );
  }

  return (
    <>
      <Link to="/resources" className="back-link">
        <Icon name="chevronLeft" size={16} /> All folders
      </Link>

      <header className="page-header">
        <div>
          <h1>{folder.name}</h1>
          <p>
            {folderFiles.length} {folderFiles.length === 1 ? "file" : "files"}
          </p>
        </div>

        <div className="page-header__actions">
          <UploadButton folderId={folder._id} onResult={setUploadResult} />
          <button type="button" className="btn btn--secondary" onClick={() => setDialog({ type: "renameFolder", target: folder })}>
            <Icon name="edit" size={16} /> Rename
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => setDialog({ type: "deleteFolder", target: folder })}>
            <Icon name="trash" size={16} /> Delete
          </button>
        </div>
      </header>

      {uploadResult?.successCount > 0 && (
        <p className="alert alert--success" role="status">
          {uploadResult.successCount} {uploadResult.successCount === 1 ? "file" : "files"} uploaded.
        </p>
      )}

      {uploadResult?.failures.length > 0 && (
        <div className="alert alert--error" role="alert">
          {uploadResult.failures.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      {folderFiles.length === 0 ? (
        <EmptyState title="This folder is empty" description="Upload PDFs, documents, slides or images (up to 10 MB each).">
          <UploadButton folderId={folder._id} onResult={setUploadResult} />
        </EmptyState>
      ) : (
        <>
          <label className="search-box">
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder="Search in this folder"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search in this folder"
            />
          </label>

          {visibleFiles.length === 0 ? (
            <EmptyState title="No matching files" description={`Nothing matches "${query}".`} />
          ) : (
            <div className="card">
              <FileTable
                files={visibleFiles}
                onRename={(target) => setDialog({ type: "renameFile", target })}
                onDelete={(target) => setDialog({ type: "deleteFile", target })}
              />
            </div>
          )}
        </>
      )}

      <ResourceDialogs
        dialog={dialog}
        onClose={() => setDialog(null)}
        onFolderDeleted={() => navigate("/resources", { replace: true })}
      />
    </>
  );
}
