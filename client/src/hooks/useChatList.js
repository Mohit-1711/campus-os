import { useCallback, useEffect, useState } from "react";
import { chatsApi } from "../api/chats";
import { getErrorMessage } from "../api/client";

const PAGE_SIZE = 20;

/** The user's chats (newest activity first), loaded a page at a time. */
export function useChatList() {
  const [chats, setChats] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchFirstPage = useCallback(async () => {
    try {
      const data = await chatsApi.list(1, PAGE_SIZE);
      setChats(data.chats);
      setPage(1);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your chats."));
    } finally {
      setLoading(false);
    }
  }, []);

  // First load: `loading` already starts as true.
  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  const reload = useCallback(() => {
    setLoading(true);
    setError("");
    return fetchFirstPage();
  }, [fetchFirstPage]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);

    try {
      const data = await chatsApi.list(page + 1, PAGE_SIZE);

      // New chats shift page boundaries, so skip anything we already have.
      setChats((current) => {
        const known = new Set(current.map((chat) => chat._id));
        return [...current, ...data.chats.filter((chat) => !known.has(chat._id))];
      });
      setPage(page + 1);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load more chats."));
    } finally {
      setLoadingMore(false);
    }
  }, [page]);

  const addChat = useCallback((chat) => setChats((current) => [chat, ...current]), []);

  /** A chat just received a message: move it to the top without refetching. */
  const bumpChat = useCallback((chatId) => {
    setChats((current) => {
      const chat = current.find((item) => item._id === chatId);
      if (!chat) return current;
      return [{ ...chat, updatedAt: new Date().toISOString() }, ...current.filter((item) => item._id !== chatId)];
    });
  }, []);

  const removeChat = useCallback((chatId) => {
    setChats((current) => current.filter((chat) => chat._id !== chatId));
  }, []);

  return {
    chats,
    loading,
    loadingMore,
    error,
    hasMore: page < totalPages,
    reload,
    loadMore,
    addChat,
    bumpChat,
    removeChat,
  };
}
