import ConfirmDialog from "../ui/ConfirmDialog";
import NameModal from "../ui/NameModal";
import { useResources } from "../../context/ResourcesContext";

/**
 * Renders whichever resource dialog is active.
 * `dialog` is `{ type, target }` or null; `onFolderDeleted(folder)` runs after a folder was deleted.
 */
export default function ResourceDialogs({ dialog, onClose, onFolderDeleted }) {
  const { createFolder, renameFolder, deleteFolder, renameFile, deleteFile, files } = useResources();

  if (!dialog) return null;

  const { type, target } = dialog;

  if (type === "createFolder") {
    return (
      <NameModal
        title="Create folder"
        label="Folder name"
        submitLabel="Create folder"
        onSubmit={(name) => createFolder(name)}
        onClose={onClose}
      />
    );
  }

  if (type === "renameFolder") {
    return (
      <NameModal
        title="Rename folder"
        label="Folder name"
        initialValue={target.name}
        submitLabel="Save"
        onSubmit={(name) => renameFolder(target._id, name)}
        onClose={onClose}
      />
    );
  }

  if (type === "deleteFolder") {
    const fileCount = files.filter((file) => file.folder === target._id).length;

    return (
      <ConfirmDialog
        title="Delete folder?"
        confirmLabel="Delete folder"
        onConfirm={async () => {
          await deleteFolder(target._id);
          onFolderDeleted?.(target);
        }}
        onClose={onClose}
      >
        This permanently deletes <strong>{target.name}</strong>
        {fileCount > 0 && ` and its ${fileCount} ${fileCount === 1 ? "file" : "files"}`}. AI chats using those
        files will lose them. This can't be undone.
      </ConfirmDialog>
    );
  }

  if (type === "renameFile") {
    return (
      <NameModal
        title="Rename file"
        label="File name"
        maxLength={150}
        initialValue={target.name}
        submitLabel="Save"
        onSubmit={(name) => renameFile(target, name)}
        onClose={onClose}
      />
    );
  }

  if (type === "deleteFile") {
    return (
      <ConfirmDialog title="Delete file?" confirmLabel="Delete file" onConfirm={() => deleteFile(target)} onClose={onClose}>
        This permanently deletes <strong>{target.name}</strong>. This can't be undone.
      </ConfirmDialog>
    );
  }

  return null;
}
