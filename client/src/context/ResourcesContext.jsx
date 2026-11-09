import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { filesApi } from "../api/files";
import { foldersApi } from "../api/folders";
import { getErrorMessage } from "../api/client";
import { getFileType, getFolderTone, getInitials } from "../utils/format";

const ResourcesContext = createContext(null);

/**
 * Holds the user's folders and files for the whole app, so the dashboard,
 * the resources page and the AI assistant all see the same data.
 */
export function ResourcesProvider({ children }) {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      // Two requests no matter how many folders there are.
      const [folderData, fileData] = await Promise.all([foldersApi.list(), filesApi.listAll()]);
      setFolders(folderData.folders || []);
      setFiles(fileData.files || []);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your resources."));
    } finally {
      setLoading(false);
    }
  }, []);

  // First load: `loading` already starts as true.
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /** Reload from the server. `silent` keeps the current screen instead of showing a spinner. */
  const refresh = useCallback(
    ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");
      return fetchAll();
    },
    [fetchAll],
  );

  // ---- folders ----
  const createFolder = useCallback(async (name) => {
    const { folder } = await foldersApi.create(name);
    setFolders((current) => [folder, ...current]);
    return folder;
  }, []);

  const renameFolder = useCallback(async (folderId, name) => {
    const { folder } = await foldersApi.rename(folderId, name);
    setFolders((current) => current.map((item) => (item._id === folderId ? folder : item)));
  }, []);

  const deleteFolder = useCallback(async (folderId) => {
    await foldersApi.remove(folderId);
    setFolders((current) => current.filter((item) => item._id !== folderId));
    setFiles((current) => current.filter((file) => file.folder !== folderId));
  }, []);

  // ---- files ----
  const uploadFile = useCallback(async (folderId, file) => {
    const { file: saved } = await filesApi.upload(folderId, file);
    setFiles((current) => [saved, ...current]);
    return saved;
  }, []);

  const renameFile = useCallback(async (file, name) => {
    const { file: updated } = await filesApi.rename(file.folder, file._id, name);
    setFiles((current) => current.map((item) => (item._id === file._id ? updated : item)));
  }, []);

  const deleteFile = useCallback(async (file) => {
    await filesApi.remove(file.folder, file._id);
    setFiles((current) => current.filter((item) => item._id !== file._id));
  }, []);

  /** Merge fresh server data for one file (e.g. after it was indexed). */
  const patchFile = useCallback((fileId, changes) => {
    setFiles((current) => current.map((item) => (item._id === fileId ? { ...item, ...changes } : item)));
  }, []);

  // ---- derived data ----
  const foldersWithCounts = useMemo(() => {
    const counts = new Map();
    files.forEach((file) => counts.set(file.folder, (counts.get(file.folder) || 0) + 1));

    return folders.map((folder) => ({
      ...folder,
      count: counts.get(folder._id) || 0,
      initials: getInitials(folder.name),
      tone: getFolderTone(folder.name),
    }));
  }, [folders, files]);

  const filesWithDetails = useMemo(() => {
    const names = new Map(folders.map((folder) => [folder._id, folder.name]));

    return files.map((file) => ({
      ...file,
      folderName: names.get(file.folder) || "Unknown folder",
      type: getFileType(file.mimeType),
    }));
  }, [folders, files]);

  const value = useMemo(
    () => ({
      folders: foldersWithCounts,
      files: filesWithDetails,
      loading,
      error,
      refresh,
      createFolder,
      renameFolder,
      deleteFolder,
      uploadFile,
      renameFile,
      deleteFile,
      patchFile,
    }),
    [
      foldersWithCounts,
      filesWithDetails,
      loading,
      error,
      refresh,
      createFolder,
      renameFolder,
      deleteFolder,
      uploadFile,
      renameFile,
      deleteFile,
      patchFile,
    ],
  );

  return <ResourcesContext.Provider value={value}>{children}</ResourcesContext.Provider>;
}

export function useResources() {
  const context = useContext(ResourcesContext);
  if (!context) throw new Error("useResources must be used inside <ResourcesProvider>");
  return context;
}
