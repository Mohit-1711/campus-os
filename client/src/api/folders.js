import api from "./client";

export const foldersApi = {
  list: () => api.get("/folder").then((res) => res.data),
  create: (name) => api.post("/folder", { name }).then((res) => res.data),
  rename: (folderId, name) => api.patch(`/folder/${folderId}`, { name }).then((res) => res.data),
  remove: (folderId) => api.delete(`/folder/${folderId}`).then((res) => res.data),
};
