import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resourcesApi } from "./api/resources";
import { aiApi } from "./api/ai";
import { chatsApi } from "./api/chat";
import "./AssistantPage.css";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function AssistantPage() {
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [chats, setChats] = useState([]);
  const [chatPagination, setChatPagination] = useState(null);

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedFileIds, setSelectedFileIds] = useState([]);

  const [question, setQuestion] = useState("");
  const [expandedFolders, setExpandedFolders] = useState([]);

  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState(null);
  const [loadingMoreChats, setLoadingMoreChats] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const activeChatId = activeChat?._id;

  const selectedDocuments = useMemo(
    () => documents.filter((file) => selectedFileIds.includes(file._id)),
    [documents, selectedFileIds],
  );

  const loadDocuments = useCallback(async () => {
    const folderResponse = await resourcesApi.getFolders();
    const folderList = folderResponse.folders || [];

    const results = await Promise.allSettled(
      folderList.map(async (folder) => {
        const response = await resourcesApi.getFiles(folder._id);

        return (response.files || []).map((file) => ({
          ...file,
          folderId: folder._id,
          folderName: folder.name,
        }));
      }),
    );

    const fileList = results
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value)
      .filter((file) => file.mimeType === "application/pdf");

    setFolders(folderList);
    setDocuments(fileList);

    return fileList;
  }, []);

  const loadChats = useCallback(async () => {
    const response = await chatsApi.getChats(1, 20);

    setChats(response.chats || []);
    setChatPagination(response.pagination || null);
  }, []);

  const loadWorkspace = useCallback(async () => {
    setLoadingWorkspace(true);
    setError("");

    try {
      await Promise.all([loadDocuments(), loadChats()]);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load the AI Assistant."));
    } finally {
      setLoadingWorkspace(false);
    }
  }, [loadDocuments, loadChats]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendingMessage]);

  const startNewChat = () => {
    setActiveChat(null);
    setMessages([]);
    setSelectedFileIds([]);
    setQuestion("");
    setError("");
    setSuccessMessage("");
  };

  const toggleFileSelection = (file) => {
    if (activeChat) return;

    setSelectedFileIds((current) =>
      current.includes(file._id)
        ? current.filter((id) => id !== file._id)
        : [...current, file._id],
    );
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders((current) =>
      current.includes(folderId)
        ? current.filter((id) => id !== folderId)
        : [...current, folderId],
    );
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];

    // Allow the same file to be selected again later.
    event.target.value = "";

    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Only PDF files can be uploaded to the AI Assistant.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("The PDF must be smaller than 10 MB.");
      return;
    }

    setUploadingFile(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await aiApi.uploadDocument(file);
      const uploadedFile = response.file;

      if (!uploadedFile?._id) {
        // Refresh the list if the backend response does not contain file metadata.
        await loadDocuments();
        setSuccessMessage("PDF uploaded and processed successfully.");
        return;
      }

      const aiUploadsFolder = (await resourcesApi.getFolders()).folders?.find(
        (folder) => folder.name === "AI Uploads",
      );

      const document = {
        ...uploadedFile,
        folderId: uploadedFile.folder || aiUploadsFolder?._id,
        folderName: "AI Uploads",
      };

      setDocuments((current) => [
        document,
        ...current.filter((item) => item._id !== document._id),
      ]);

      setSelectedFileIds((current) =>
        current.includes(document._id) ? current : [...current, document._id],
      );

      setSuccessMessage("PDF uploaded and processed successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to upload this PDF."));
    } finally {
      setUploadingFile(false);
    }
  };

  const createNewChat = async () => {
    if (selectedFileIds.length === 0) {
      setError("Select at least one PDF before creating a chat.");
      return;
    }

    setCreatingChat(true);
    setError("");
    setSuccessMessage("");

    try {
      // Index existing folder PDFs before creating the chat.
      for (const document of selectedDocuments) {
        if (document.processingStatus !== "ready") {
          await aiApi.indexDocument(document._id);

          setDocuments((current) =>
            current.map((item) =>
              item._id === document._id
                ? { ...item, processingStatus: "ready" }
                : item,
            ),
          );
        }
      }

      const title =
        selectedDocuments.length === 1
          ? selectedDocuments[0].originalName || selectedDocuments[0].name
          : "Study session";

      const response = await chatsApi.createChat(title, selectedFileIds);

      const newChat = {
        ...response.chat,
        files: selectedDocuments,
      };

      setChats((current) => [newChat, ...current]);
      setActiveChat(newChat);
      setMessages([]);
      setSelectedFileIds([]);
      setSuccessMessage("Your study chat is ready.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create the chat."));
    } finally {
      setCreatingChat(false);
    }
  };

  const openChat = async (chat) => {
    setActiveChat(chat);
    setMessages([]);
    setQuestion("");
    setError("");
    setSuccessMessage("");
    setLoadingMessages(true);

    try {
      const response = await chatsApi.getMessages(chat._id);
      setMessages(response.messages || []);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load this conversation."));
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const content = question.trim();

    if (!content || !activeChatId || sendingMessage) return;

    setSendingMessage(true);
    setQuestion("");
    setError("");

    try {
      const response = await chatsApi.sendMessage(activeChatId, content);

      setMessages((current) => [
        ...current,
        response.userMessage,
        response.assistantMessage,
      ]);

      // Refresh chat ordering because updatedAt changes after a message.
      const updatedChats = await chatsApi.getChats(1, 20);
      setChats(updatedChats.chats || []);
      setChatPagination(updatedChats.pagination || null);
    } catch (err) {
      setQuestion(content);
      setError(getErrorMessage(err, "Unable to send your message."));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteChat = async (event, chatId) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      "Delete this chat? AI-uploaded documents will only be removed if no other chat uses them.",
    );

    if (!confirmed) return;

    setDeletingChatId(chatId);
    setError("");

    try {
      await chatsApi.deleteChat(chatId);

      setChats((current) => current.filter((chat) => chat._id !== chatId));

      if (activeChatId === chatId) {
        startNewChat();
      }

      // Refresh documents because unused AI uploads may have been deleted.
      await loadDocuments();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete this chat."));
    } finally {
      setDeletingChatId(null);
    }
  };

  const loadMoreChats = async () => {
    if (
      !chatPagination ||
      chatPagination.page >= chatPagination.totalPages ||
      loadingMoreChats
    ) {
      return;
    }

    setLoadingMoreChats(true);

    try {
      const nextPage = chatPagination.page + 1;
      const response = await chatsApi.getChats(nextPage, 20);

      setChats((current) => [...current, ...(response.chats || [])]);
      setChatPagination(response.pagination || null);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load more chats."));
    } finally {
      setLoadingMoreChats(false);
    }
  };

  if (loadingWorkspace) {
    return (
      <div className="assistant-loading">
        <div className="assistant-spinner" />
        <p>Preparing your study space...</p>
      </div>
    );
  }

  return (
    <div className="assistant-page">
      <aside className="assistant-sidebar">
        <div className="assistant-sidebar-header">
          <div>
            <span className="assistant-eyebrow">CAMPUS OS</span>
            <h2>AI Assistant</h2>
          </div>

          <button
            type="button"
            className="assistant-new-chat"
            onClick={startNewChat}
            title="Start a new chat"
          >
            <span>＋</span> New chat
          </button>
        </div>

        <div className="assistant-chat-list">
          <p className="assistant-sidebar-label">YOUR CONVERSATIONS</p>

          {chats.length === 0 ? (
            <div className="assistant-sidebar-empty">
              <span>✦</span>
              <p>No conversations yet.</p>
              <small>Create a chat to get started.</small>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat._id}
                className={`assistant-chat-item ${
                  activeChatId === chat._id ? "active" : ""
                }`}
              >
                <button
                  type="button"
                  className="assistant-chat-open"
                  onClick={() => openChat(chat)}
                >
                  <span className="assistant-chat-icon">✧</span>
                  <span className="assistant-chat-details">
                    <strong>{chat.title || "Study session"}</strong>
                    <small>{formatDate(chat.updatedAt)}</small>
                  </span>
                </button>

                <button
                  type="button"
                  className="assistant-delete-chat"
                  title="Delete chat"
                  disabled={deletingChatId === chat._id}
                  onClick={(event) => handleDeleteChat(event, chat._id)}
                >
                  {deletingChatId === chat._id ? "…" : "×"}
                </button>
              </div>
            ))
          )}

          {chatPagination &&
            chatPagination.page < chatPagination.totalPages && (
              <button
                type="button"
                className="assistant-load-more"
                onClick={loadMoreChats}
                disabled={loadingMoreChats}
              >
                {loadingMoreChats ? "Loading..." : "Load more conversations"}
              </button>
            )}
        </div>

        <div className="assistant-sidebar-footer">
          <span className="assistant-online-dot" />
          Your documents stay in your account
        </div>
      </aside>

      <main className="assistant-main">
        <header className="assistant-topbar">
          <div>
            <span className="assistant-topbar-icon">✦</span>
            <span>Study Assistant</span>
          </div>
          <span className="assistant-secure-label">Document-grounded AI</span>
        </header>

        {error && (
          <div className="assistant-alert assistant-alert-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        {successMessage && (
          <div
            className="assistant-alert assistant-alert-success"
            role="status"
          >
            <span>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage("")}>
              ×
            </button>
          </div>
        )}

        {!activeChat ? (
          <section className="assistant-setup">
            <div className="assistant-welcome">
              <div className="assistant-welcome-symbol">✦</div>
              <span className="assistant-eyebrow">
                YOUR PERSONAL STUDY SPACE
              </span>
              <h1>Learn smarter with your documents.</h1>
              <p>
                Select your study material or upload a PDF. Ask questions and
                get answers grounded in the documents you choose.
              </p>
            </div>

            <div className="assistant-document-panel">
              <div className="assistant-panel-heading">
                <div>
                  <h3>Choose your study material</h3>
                  <p>Select one or more PDFs for this conversation.</p>
                </div>

                <span className="assistant-selected-count">
                  {selectedFileIds.length} selected
                </span>
              </div>

              <div className="assistant-upload-area">
                <div className="assistant-upload-icon">↑</div>
                <div className="assistant-upload-copy">
                  <strong>Upload a new PDF</strong>
                  <span>PDF only · Maximum file size 10 MB</span>
                </div>

                <button
                  type="button"
                  className="assistant-upload-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? "Uploading..." : "Choose PDF"}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  hidden
                  onChange={handleUpload}
                />
              </div>

              <div className="assistant-library-heading">
                <h4>Your existing PDFs</h4>
                <span>{documents.length} documents</span>
              </div>

              {documents.length === 0 ? (
                <div className="assistant-no-documents">
                  <span>▤</span>
                  <strong>No PDFs found</strong>
                  <p>Upload a PDF above or add one to a folder first.</p>
                </div>
              ) : (
                <div className="assistant-folder-list">
                  {folders.map((folder) => {
                    const folderDocuments = documents.filter(
                      (file) => file.folderId === folder._id,
                    );

                    if (folderDocuments.length === 0) return null;

                    const expanded = expandedFolders.includes(folder._id);

                    return (
                      <div className="assistant-folder" key={folder._id}>
                        <button
                          type="button"
                          className="assistant-folder-heading"
                          onClick={() => toggleFolder(folder._id)}
                        >
                          <span className="assistant-folder-chevron">
                            {expanded ? "⌄" : "›"}
                          </span>
                          <span className="assistant-folder-icon">▰</span>
                          <strong>{folder.name}</strong>
                          <small>{folderDocuments.length} PDFs</small>
                        </button>

                        {expanded && (
                          <div className="assistant-file-list">
                            {folderDocuments.map((file) => {
                              const selected = selectedFileIds.includes(
                                file._id,
                              );

                              const ready = file.processingStatus === "ready";

                              return (
                                <label
                                  key={file._id}
                                  className={`assistant-file-row ${
                                    selected ? "selected" : ""
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleFileSelection(file)}
                                  />

                                  <span className="assistant-pdf-icon">
                                    PDF
                                  </span>

                                  <span className="assistant-file-info">
                                    <strong>
                                      {file.originalName || file.name}
                                    </strong>
                                    <small>
                                      {formatFileSize(file.size)}
                                      {" · "}
                                      {ready
                                        ? "Ready for AI"
                                        : file.processingStatus === "failed"
                                          ? "Indexing failed"
                                          : "Needs indexing"}
                                    </small>
                                  </span>

                                  <span
                                    className={`assistant-file-status ${
                                      ready ? "ready" : "pending"
                                    }`}
                                  >
                                    {ready ? "Ready" : "Index"}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="assistant-create-footer">
                <span>
                  {selectedFileIds.length === 0
                    ? "Select documents to continue."
                    : `${selectedFileIds.length} PDF${
                        selectedFileIds.length > 1 ? "s" : ""
                      } selected`}
                </span>

                <button
                  type="button"
                  className="assistant-primary-button"
                  onClick={createNewChat}
                  disabled={selectedFileIds.length === 0 || creatingChat}
                >
                  {creatingChat ? (
                    <>
                      <span className="assistant-button-spinner" />
                      Preparing documents...
                    </>
                  ) : (
                    "Start studying →"
                  )}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="assistant-conversation">
            <div className="assistant-conversation-heading">
              <div>
                <span className="assistant-eyebrow">STUDY CONVERSATION</span>
                <h2>{activeChat.title || "Study session"}</h2>
              </div>

              <button
                type="button"
                className="assistant-secondary-button"
                onClick={startNewChat}
              >
                + New chat
              </button>
            </div>

            <div className="assistant-attached-documents">
              <span className="assistant-attached-label">SOURCE DOCUMENTS</span>

              {(activeChat.files || []).map((file) => (
                <span className="assistant-document-chip" key={file._id}>
                  <span>PDF</span>
                  {file.originalName || file.name}
                </span>
              ))}
            </div>

            <div className="assistant-messages">
              {loadingMessages ? (
                <div className="assistant-message-loading">
                  <div className="assistant-spinner" />
                  <p>Loading conversation...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="assistant-empty-conversation">
                  <div className="assistant-welcome-symbol">✦</div>
                  <h3>What would you like to understand?</h3>
                  <p>
                    Ask a question about your selected documents. Answers are
                    generated using the material attached to this chat.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <article
                    key={message._id}
                    className={`assistant-message ${
                      message.role === "user" ? "user" : "ai"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="assistant-message-avatar">✦</div>
                    )}

                    <div className="assistant-message-content">
                      <span className="assistant-message-author">
                        {message.role === "user" ? "You" : "AI Assistant"}
                      </span>
                      <p>{message.content}</p>
                    </div>
                  </article>
                ))
              )}

              {sendingMessage && (
                <article className="assistant-message ai">
                  <div className="assistant-message-avatar">✦</div>
                  <div className="assistant-message-content">
                    <span className="assistant-message-author">
                      AI Assistant
                    </span>
                    <div className="assistant-typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </article>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form className="assistant-composer" onSubmit={handleSendMessage}>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask anything about your documents..."
                rows={2}
                maxLength={5000}
                disabled={sendingMessage || loadingMessages}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />

              <div className="assistant-composer-footer">
                <span>Enter to send · Shift + Enter for a new line</span>
                <button
                  type="submit"
                  className="assistant-send-button"
                  disabled={!question.trim() || sendingMessage}
                >
                  {sendingMessage ? "Sending..." : "Send ↑"}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default AssistantPage;
