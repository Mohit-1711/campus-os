import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authApi = {
  signup: async (formData) => {
    const response = await api.post("/auth/signup", formData);
    return response.data;
  },

  login: async (formData) => {
    const response = await api.post("/auth/login", formData);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
};

export default api;
