import api from "./client";

function toFormData(file) {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
}

export const filesApi = {
  // Every file the user owns, across all folders, in one request.
  listAll: () => api.get("/files").then((res) => res.data),

  upload: (folderId, file) =>
    // Content-Type null lets the browser set the multipart boundary itself.
    api
      .post(`/folder/${folderId}/files`, toFormData(file), { headers: { "Content-Type": null } })
      .then((res) => res.data),

  rename: (folderId, fileId, name) =>
    api.patch(`/folder/${folderId}/files/${fileId}`, { name }).then((res) => res.data),

  remove: (folderId, fileId) =>
    api.delete(`/folder/${folderId}/files/${fileId}`).then((res) => res.data),
};
