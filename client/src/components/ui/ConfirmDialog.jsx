import { useState } from "react";
import { getErrorMessage } from "../../api/client";
import Modal from "./Modal";

/** Confirm a destructive action. `onConfirm()` should reject to show an error. */
export default function ConfirmDialog({
  title,
  children,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setBusy(true);
    setError("");

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <div className="modal__body">
        <p>{children}</p>

        {error && (
          <p className="alert alert--error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="modal__actions">
        <button type="button" className="btn btn--secondary" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn btn--danger" onClick={handleConfirm} disabled={busy}>
          {busy ? "Deleting..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
