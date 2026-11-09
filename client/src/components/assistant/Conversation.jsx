import { useEffect, useRef } from "react";
import { useConversation } from "../../hooks/useConversation";
import Icon from "../ui/Icon";
import LoadingState from "../ui/LoadingState";
import Composer from "./Composer";
import MessageBubble from "./MessageBubble";

/** One open chat: its source documents, messages and the message box. */
export default function Conversation({ chat, onMessageSent, onOpenChats }) {
  const { messages, loading, loadError, sending, sendError, send } = useConversation(chat._id, { onMessageSent });
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const hasDocuments = chat.files.length > 0;

  return (
    <section className="conversation">
      <header className="conversation__header">
        <button type="button" className="icon-btn assistant__chats-toggle" onClick={onOpenChats} aria-label="Show chats">
          <Icon name="chat" />
        </button>

        <div className="conversation__title">
          <h1>{chat.title}</h1>
          <ul className="conversation__sources" aria-label="Source documents">
            {chat.files.map((file) => (
              <li key={file._id} className="chip chip--info">{file.name}</li>
            ))}
          </ul>
        </div>
      </header>

      <div className="conversation__messages">
        {loading ? (
          <LoadingState label="Loading conversation..." />
        ) : loadError ? (
          <p className="alert alert--error" role="alert">{loadError}</p>
        ) : messages.length === 0 ? (
          <div className="conversation__empty">
            <Icon name="sparkles" size={28} />
            <h2>Ask your first question</h2>
            <p>Answers come only from the documents above, so you can trust where they're from.</p>
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message._id} message={message} />)
        )}

        {sending && (
          <div className="bubble-row">
            <div className="bubble bubble--assistant" role="status" aria-label="The assistant is thinking">
              <span className="typing"><i /><i /><i /></span>
            </div>
          </div>
        )}

        {sendError && <p className="alert alert--error" role="alert">{sendError}</p>}
        <div ref={endRef} />
      </div>

      <Composer
        disabled={!hasDocuments || loading}
        disabledReason={!hasDocuments ? "The documents for this chat were deleted. Start a new chat to continue." : ""}
        sending={sending}
        onSend={send}
      />
    </section>
  );
}
