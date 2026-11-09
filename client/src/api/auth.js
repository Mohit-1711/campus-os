import api from "./client";

export const authApi = {
  signup: (data) => api.post("/auth/signup", data).then((res) => res.data),
  login: (data) => api.post("/auth/login", data).then((res) => res.data),
  logout: () => api.post("/auth/logout").then((res) => res.data),
  getMe: () => api.get("/auth/me").then((res) => res.data),
};
