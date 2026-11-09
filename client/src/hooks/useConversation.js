import { useCallback, useEffect, useRef, useState } from "react";
import { chatsApi } from "../api/chats";
import { getErrorMessage } from "../api/client";

const PAGE_SIZE = 100;

/** Loads every message of a chat and sends new ones (showing them immediately). */
export function useConversation(chatId, { onMessageSent } = {}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  // Keep the latest callback without making `send` change on every render.
  const onSentRef = useRef(onMessageSent);
  useEffect(() => {
    onSentRef.current = onMessageSent;
  });

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setLoadError("");

      try {
        // Chats can be longer than one page, and the newest messages are on the last page.
        const all = [];
        let page = 1;
        let totalPages = 1;

        do {
          const data = await chatsApi.messages(chatId, page, PAGE_SIZE);
          all.push(...data.messages);
          totalPages = data.pagination.totalPages;
          page += 1;
        } while (page <= totalPages);

        if (!cancelled) setMessages(all);
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err, "Unable to load this conversation."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  /** Resolves to true if the message was answered, false if it failed. */
  const send = useCallback(
    async (content) => {
      const tempId = `pending-${Date.now()}`;

      setSending(true);
      setSendError("");
      setMessages((current) => [...current, { _id: tempId, role: "user", content }]);

      try {
        const data = await chatsApi.send(chatId, content);

        setMessages((current) => [
          ...current.filter((message) => message._id !== tempId),
          data.userMessage,
          data.assistantMessage,
        ]);
        onSentRef.current?.(chatId);
        return true;
      } catch (err) {
        setMessages((current) => current.filter((message) => message._id !== tempId));
        setSendError(getErrorMessage(err, "Unable to get an answer. Please try again."));
        return false;
      } finally {
        setSending(false);
      }
    },
    [chatId],
  );

  return { messages, loading, loadError, sending, sendError, send };
}
