import { formatDate } from "../../utils/format";
import Icon from "../ui/Icon";

export default function ChatSidebar({
  chats,
  activeId,
  loading,
  error,
  hasMore,
  loadingMore,
  open,
  onSelect,
  onNew,
  onDelete,
  onLoadMore,
  onRetry,
  onClose,
}) {
  return (
    <aside className={`chat-sidebar ${open ? "chat-sidebar--open" : ""}`} aria-label="Your chats">
      <div className="chat-sidebar__head">
        <h2>Chats</h2>
        <button type="button" className="icon-btn chat-sidebar__close" onClick={onClose} aria-label="Close chats">
          <Icon name="close" />
        </button>
      </div>

      <button type="button" className="btn btn--primary chat-sidebar__new" onClick={onNew}>
        <Icon name="plus" size={16} /> New chat
      </button>

      <div className="chat-sidebar__list">
        {loading ? (
          <p className="chat-sidebar__note">Loading chats...</p>
        ) : error ? (
          <div className="chat-sidebar__note">
            <p className="alert alert--error" role="alert">{error}</p>
            <button type="button" className="btn btn--secondary" onClick={onRetry}>Try again</button>
          </div>
        ) : chats.length === 0 ? (
          <p className="chat-sidebar__note">No chats yet. Start one with your PDFs.</p>
        ) : (
          <ul>
            {chats.map((chat) => (
              <li key={chat._id} className={`chat-item ${chat._id === activeId ? "chat-item--active" : ""}`}>
                <button type="button" className="chat-item__main" onClick={() => onSelect(chat)}>
                  <strong>{chat.title}</strong>
                  <small>
                    {chat.files.length} {chat.files.length === 1 ? "document" : "documents"} · {formatDate(chat.updatedAt, { month: "short", day: "numeric" })}
                  </small>
                </button>
                <button type="button" className="icon-btn icon-btn--danger" onClick={() => onDelete(chat)} aria-label={`Delete chat ${chat.title}`}>
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {hasMore && !loading && (
          <button type="button" className="btn btn--secondary chat-sidebar__more" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </aside>
  );
}
