import { useState } from "react";
import Icon from "../ui/Icon";

const MAX_LENGTH = 5000;

export default function Composer({ disabled, disabledReason, sending, onSend }) {
  const [text, setText] = useState("");

  async function submit() {
    const content = text.trim();
    if (!content || sending || disabled) return;

    setText("");
    const ok = await onSend(content);

    // Give the question back if it failed, so the user doesn't have to retype it.
    if (!ok) setText(content);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="composer">
      {disabledReason && <p className="alert alert--info">{disabledReason}</p>}

      <div className="composer__row">
        <textarea
          className="input composer__input"
          rows={1}
          value={text}
          maxLength={MAX_LENGTH}
          placeholder="Ask a question about your documents..."
          aria-label="Your question"
          disabled={disabled}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="btn btn--primary composer__send"
          onClick={submit}
          disabled={disabled || sending || !text.trim()}
          aria-label="Send message"
        >
          <Icon name="send" size={18} />
        </button>
      </div>
      <p className="composer__hint">Enter to send · Shift+Enter for a new line</p>
    </div>
  );
}
