import { useState } from "react";
import { getErrorMessage } from "../../api/client";
import Modal from "./Modal";

/**
 * One dialog for every "type a name" action: create folder, rename folder, rename file.
 * `onSubmit(name)` should throw (or reject) to show an error inside the dialog.
 */
export default function NameModal({
  title,
  label,
  initialValue = "",
  submitLabel,
  maxLength = 100,
  onSubmit,
  onClose,
}) {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const name = value.trim();

    if (!name) {
      setError(`${label} is required.`);
      return;
    }

    if (name === initialValue) {
      onClose();
      return;
    }

    setBusy(true);
    setError("");

    try {
      await onSubmit(name);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <form className="modal__body" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field__label">{label}</span>
          <input
            className="input"
            value={value}
            maxLength={maxLength}
            autoFocus
            onFocus={(event) => event.target.select()}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>

        {error && (
          <p className="alert alert--error" role="alert">
            {error}
          </p>
        )}

        <div className="modal__actions">
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
