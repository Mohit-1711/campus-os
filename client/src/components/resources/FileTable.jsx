import Icon from "../ui/Icon";
import { formatDate, formatFileSize } from "../../utils/format";

function AiStatus({ file }) {
  if (file.mimeType !== "application/pdf") return null;

  if (file.processingStatus === "ready") {
    return <span className="chip chip--success">AI ready</span>;
  }

  if (file.processingStatus === "failed") {
    return (
      <span className="chip chip--danger" title="No readable text was found (scanned PDF?) or the file could not be processed.">
        Not readable by AI
      </span>
    );
  }

  return <span className="chip" title="Open the AI assistant and select this PDF to prepare it.">Not prepared</span>;
}

/**
 * A table of files. Pass `onRename` / `onDelete` to show row actions,
 * and `showFolder` to show which folder each file lives in.
 */
export default function FileTable({ files, showFolder = false, onRename, onDelete }) {
  const hasActions = Boolean(onRename || onDelete);

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            {showFolder && <th scope="col">Folder</th>}
            <th scope="col">Size</th>
            <th scope="col">Added</th>
            {hasActions && (
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file._id}>
              <td>
                <div className="file-name">
                  <span className="file-name__type">{file.type}</span>
                  <a href={file.cloudinaryUrl} target="_blank" rel="noreferrer" title="Open file">
                    {file.name}
                  </a>
                  <AiStatus file={file} />
                </div>
              </td>
              {showFolder && <td>{file.folderName}</td>}
              <td>{formatFileSize(file.size)}</td>
              <td>{formatDate(file.createdAt)}</td>
              {hasActions && (
                <td className="file-actions">
                  <a className="icon-btn" href={file.cloudinaryUrl} target="_blank" rel="noreferrer" aria-label={`Open ${file.name}`}>
                    <Icon name="external" size={18} />
                  </a>
                  {onRename && (
                    <button type="button" className="icon-btn" onClick={() => onRename(file)} aria-label={`Rename ${file.name}`}>
                      <Icon name="edit" size={18} />
                    </button>
                  )}
                  {onDelete && (
                    <button type="button" className="icon-btn icon-btn--danger" onClick={() => onDelete(file)} aria-label={`Delete ${file.name}`}>
                      <Icon name="trash" size={18} />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
