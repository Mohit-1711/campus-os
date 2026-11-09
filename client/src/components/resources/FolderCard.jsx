import { Link } from "react-router-dom";
import Icon from "../ui/Icon";

export default function FolderCard({ folder, onRename, onDelete }) {
  return (
    <article className="card folder-card">
      <Link to={`/resources/${folder._id}`} className="folder-card__main">
        <span className={`tile tile--${folder.tone}`}>{folder.initials}</span>
        <span className="folder-card__text">
          <strong>{folder.name}</strong>
          <small>
            {folder.count} {folder.count === 1 ? "file" : "files"}
          </small>
        </span>
      </Link>

      <div className="folder-card__actions">
        <button type="button" className="icon-btn" onClick={() => onRename(folder)} aria-label={`Rename ${folder.name}`}>
          <Icon name="edit" size={18} />
        </button>
        <button type="button" className="icon-btn icon-btn--danger" onClick={() => onDelete(folder)} aria-label={`Delete ${folder.name}`}>
          <Icon name="trash" size={18} />
        </button>
      </div>
    </article>
  );
}
