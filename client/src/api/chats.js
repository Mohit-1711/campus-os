import api from "./client";

export const chatsApi = {
  list: (page = 1, limit = 20) =>
    api.get("/chats", { params: { page, limit } }).then((res) => res.data),

  create: (title, files) => api.post("/chats", { title, files }).then((res) => res.data),

  messages: (chatId, page = 1, limit = 100) =>
    api.get(`/chats/${chatId}/messages`, { params: { page, limit } }).then((res) => res.data),

  send: (chatId, content) =>
    api.post(`/chats/${chatId}/messages`, { content }).then((res) => res.data),

  remove: (chatId) => api.delete(`/chats/${chatId}`).then((res) => res.data),
};
