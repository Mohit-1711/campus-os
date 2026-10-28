import api from "./auth";

export const resourcesApi = {
  getFolders: async () => {
    const response = await api.get("/folder");
    return response.data;
  },

  createFolder: async (name) => {
    const response = await api.post("/folder", { name });
    return response.data;
  },

  renameFolder: async (folderId, name) => {
    const response = await api.patch(`/folder/${folderId}`, { name });
    return response.data;
  },

  deleteFolder: async (folderId) => {
    const response = await api.delete(`/folder/${folderId}`);
    return response.data;
  },

  getFiles: async (folderId) => {
    const response = await api.get(`/folder/${folderId}/files`);
    return response.data;
  },

  
uploadFile: async (folderId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `/folder/${folderId}/files`,
    formData,
    {
      headers: {
        "Content-Type": null,
      },
    },
  );

  return response.data;
},


  renameFile: async (folderId, fileId, name) => {
    const response = await api.patch(`/folder/${folderId}/files/${fileId}`, {
      name,
    });
    return response.data;
  },

  deleteFile: async (folderId, fileId) => {
    const response = await api.delete(`/folder/${folderId}/files/${fileId}`);
    return response.data;
  },
};
