import api from "./client";

export const aiApi = {
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return api
      .post("/ai/documents", formData, { headers: { "Content-Type": null } })
      .then((res) => res.data);
  },

  indexDocument: (fileId) => api.post(`/ai/documents/${fileId}/index`).then((res) => res.data),
};
