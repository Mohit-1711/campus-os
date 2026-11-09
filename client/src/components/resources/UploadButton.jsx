import { useRef, useState } from "react";
import { getErrorMessage } from "../../api/client";
import { MAX_UPLOAD_BYTES } from "../../constants/modules";
import { useResources } from "../../context/ResourcesContext";
import Icon from "../ui/Icon";

const ACCEPTED = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg";

/** Upload one or more files into a folder, one after another, reporting what failed. */
export default function UploadButton({ folderId, onResult }) {
  const { uploadFile } = useResources();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(event) {
    const selected = [...event.target.files];
    event.target.value = ""; // allow picking the same file again later

    if (selected.length === 0) return;

    setUploading(true);
    const failures = [];
    let successCount = 0;

    for (const file of selected) {
      if (file.size > MAX_UPLOAD_BYTES) {
        failures.push(`${file.name}: larger than 10 MB`);
        continue;
      }

      try {
        await uploadFile(folderId, file);
        successCount += 1;
      } catch (err) {
        failures.push(`${file.name}: ${getErrorMessage(err, "upload failed")}`);
      }
    }

    setUploading(false);
    onResult({ successCount, failures });
  }

  return (
    <>
      <input ref={inputRef} type="file" accept={ACCEPTED} multiple hidden onChange={handleChange} />
      <button type="button" className="btn btn--primary" disabled={uploading} onClick={() => inputRef.current?.click()}>
        <Icon name="upload" size={16} />
        {uploading ? "Uploading..." : "Upload files"}
      </button>
    </>
  );
}
