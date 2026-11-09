import { useState } from "react";
import { chatsApi } from "../api/chats";
import ChatSidebar from "../components/assistant/ChatSidebar";
import Conversation from "../components/assistant/Conversation";
import DocumentPicker from "../components/assistant/DocumentPicker";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import LoadingState from "../components/ui/LoadingState";
import { useResources } from "../context/ResourcesContext";
import { useChatList } from "../hooks/useChatList";
import "../components/assistant/assistant.css";

export default function AssistantPage() {
  const { loading: resourcesLoading, error: resourcesError, refresh } = useResources();
  const chatList = useChatList();

  const [activeChat, setActiveChat] = useState(null);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function openChat(chat) {
    setActiveChat(chat);
    setSidebarOpen(false);
  }

  function startNewChat() {
    setActiveChat(null);
    setSidebarOpen(false);
  }

  function handleChatCreated(chat) {
    chatList.addChat(chat);
    setActiveChat(chat);
  }

  async function handleDeleteChat() {
    await chatsApi.remove(chatToDelete._id);
    chatList.removeChat(chatToDelete._id);
    if (activeChat?._id === chatToDelete._id) setActiveChat(null);

    // Documents uploaded through the assistant were deleted along with the chat.
    refresh({ silent: true });
  }

  if (resourcesLoading) return <LoadingState label="Loading your documents..." />;

  if (resourcesError) {
    return (
      <div className="assistant__error">
        <p className="alert alert--error" role="alert">{resourcesError}</p>
        <button type="button" className="btn btn--secondary" onClick={() => refresh()}>Try again</button>
      </div>
    );
  }

  return (
    <div className="assistant">
      <ChatSidebar
        chats={chatList.chats}
        activeId={activeChat?._id}
        loading={chatList.loading}
        error={chatList.error}
        hasMore={chatList.hasMore}
        loadingMore={chatList.loadingMore}
        open={sidebarOpen}
        onSelect={openChat}
        onNew={startNewChat}
        onDelete={setChatToDelete}
        onLoadMore={chatList.loadMore}
        onRetry={chatList.reload}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && <div className="assistant__scrim" onClick={() => setSidebarOpen(false)} />}

      <div className="assistant__main">
        {activeChat ? (
          <Conversation
            key={activeChat._id}
            chat={activeChat}
            onMessageSent={chatList.bumpChat}
            onOpenChats={() => setSidebarOpen(true)}
          />
        ) : (
          <div className="assistant__scroll">
            <button type="button" className="btn btn--secondary assistant__chats-toggle" onClick={() => setSidebarOpen(true)}>
              Your chats
            </button>
            <DocumentPicker onChatCreated={handleChatCreated} />
          </div>
        )}
      </div>

      {chatToDelete && (
        <ConfirmDialog
          title="Delete this chat?"
          confirmLabel="Delete chat"
          onConfirm={handleDeleteChat}
          onClose={() => setChatToDelete(null)}
        >
          This deletes the conversation <strong>{chatToDelete.title}</strong>. PDFs you uploaded directly in this
          assistant are deleted with it; PDFs from your resources are kept.
        </ConfirmDialog>
      )}
    </div>
  );
}
