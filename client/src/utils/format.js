export function formatFileSize(bytes) {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export function getFileType(mimeType = "") {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "IMG";
  if (mimeType.includes("word")) return "DOC";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "PPT";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "XLS";
  if (mimeType.startsWith("text/")) return "TXT";
  return "FILE";
}

export function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
}

const FOLDER_TONES = ["purple", "green", "orange", "blue"];

/** A stable colour per folder name, so a folder always looks the same. */
export function getFolderTone(name = "") {
  const hash = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  return FOLDER_TONES[hash % FOLDER_TONES.length];
}

export function getFirstName(name = "") {
  return name.trim().split(/\s+/)[0] || "there";
}
