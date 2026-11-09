import { useMemo, useRef, useState } from "react";
import { aiApi } from "../../api/ai";
import { chatsApi } from "../../api/chats";
import { getErrorMessage } from "../../api/client";
import { MAX_UPLOAD_BYTES } from "../../constants/modules";
import { useResources } from "../../context/ResourcesContext";
import { formatFileSize } from "../../utils/format";
import Icon from "../ui/Icon";

function StatusChip({ file }) {
  if (file.processingStatus === "ready") return <span className="chip chip--success">AI ready</span>;
  if (file.processingStatus === "failed") return <span className="chip chip--danger">Couldn't be read</span>;
  return <span className="chip">Will be prepared</span>;
}

/** The "new chat" screen: choose (or upload) PDFs, then start a conversation about them. */
export default function DocumentPicker({ onChatCreated }) {
  const { folders, files, refresh, patchFile } = useResources();
  const inputRef = useRef(null);

  const [selected, setSelected] = useState(() => new Set());
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState("");
  const [error, setError] = useState("");

  const busy = uploading || Boolean(starting);

  // PDFs grouped by the folder they live in.
  const groups = useMemo(() => {
    const pdfs = files.filter((file) => file.mimeType === "application/pdf");

    return folders
      .map((folder) => ({ folder, files: pdfs.filter((file) => file.folder === folder._id) }))
      .filter((group) => group.files.length > 0);
  }, [folders, files]);

  function toggle(fileId) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }

  async function handleUpload(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError("This PDF is larger than 10 MB.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const data = await aiApi.uploadDocument(file);
      await refresh({ silent: true }); // picks up the file and the "AI Uploads" folder
      setSelected((current) => new Set(current).add(data.file._id));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to upload this PDF."));
    } finally {
      setUploading(false);
    }
  }

  async function handleStart() {
    const chosen = files.filter((file) => selected.has(file._id));
    if (chosen.length === 0) return;

    setError("");

    try {
      // Make sure every chosen PDF has been turned into searchable text first.
      for (const file of chosen.filter((item) => item.processingStatus !== "ready")) {
        setStarting(`Preparing "${file.name}"...`);

        try {
          const data = await aiApi.indexDocument(file._id);
          patchFile(file._id, data.file);
        } catch (err) {
          patchFile(file._id, { processingStatus: "failed" });
          throw new Error(`${file.name}: ${getErrorMessage(err, "could not be prepared.")}`);
        }
      }

      setStarting("Starting chat...");
      const title = chosen.length === 1 ? chosen[0].name : `${chosen.length} documents`;
      const data = await chatsApi.create(title, chosen.map((file) => file._id));
      onChatCreated(data.chat);
    } catch (err) {
      setError(getErrorMessage(err, err.message));
    } finally {
      setStarting("");
    }
  }

  return (
    <section className="picker">
      <header>
        <p className="page-header__eyebrow">AI study assistant</p>
        <h1>Chat with your documents</h1>
        <p>Pick the PDFs you want to study from. Answers are based only on what's inside them.</p>
      </header>

      <div className="card picker__upload">
        <div>
          <h2>Have a new PDF?</h2>
          <p>Upload it here and it will be ready to use straight away (max 10 MB).</p>
        </div>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={handleUpload} />
        <button type="button" className="btn btn--secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Icon name="upload" size={16} /> {uploading ? "Uploading..." : "Upload PDF"}
        </button>
      </div>

      {error && <p className="alert alert--error" role="alert">{error}</p>}

      <div className="card picker__list">
        <h2>Your PDFs</h2>

        {groups.length === 0 ? (
          <p className="picker__empty">
            You have no PDFs yet. Upload one above, or add PDFs in Academic resources.
          </p>
        ) : (
          groups.map(({ folder, files: groupFiles }) => (
            <fieldset key={folder._id} className="picker__group">
              <legend>{folder.name}</legend>
              {groupFiles.map((file) => (
                <label key={file._id} className={`picker__file ${selected.has(file._id) ? "picker__file--selected" : ""}`}>
                  <input type="checkbox" checked={selected.has(file._id)} disabled={busy} onChange={() => toggle(file._id)} />
                  <span className="picker__file-name">{file.name}</span>
                  <span className="picker__file-size">{formatFileSize(file.size)}</span>
                  <StatusChip file={file} />
                </label>
              ))}
            </fieldset>
          ))
        )}
      </div>

      <div className="picker__footer">
        <span>{selected.size} selected</span>
        <button type="button" className="btn btn--primary" disabled={busy || selected.size === 0} onClick={handleStart}>
          {starting || "Start chat"}
        </button>
      </div>
    </section>
  );
}
