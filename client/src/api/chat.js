import api from "./auth";

export const chatsApi = {
  getChats: async (page = 1, limit = 20) => {
    const response = await api.get("/chats", {
      params: { page, limit },
    });
    return response.data;
  },

  createChat: async (title, files) => {
    const response = await api.post("/chats", { title, files });
    return response.data;
  },

  getMessages: async (chatId, page = 1, limit = 50) => {
    const response = await api.get(`/chats/${chatId}/messages`, {
      params: { page, limit },
    });
    return response.data;
  },

  sendMessage: async (chatId, content) => {
    const response = await api.post(`/chats/${chatId}/messages`, {
      content,
    });
    return response.data;
  },

  deleteChat: async (chatId) => {
    const response = await api.delete(`/chats/${chatId}`);
    return response.data;
  },
};
