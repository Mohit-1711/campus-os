import api from "./auth";

export const aiApi = {
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/ai/documents", formData, {
      headers: { "Content-Type": null },
    });

    return response.data;
  },

  indexDocument: async (fileId) => {
    const response = await api.post(`/ai/documents/${fileId}/index`);
    return response.data;
  },
};
