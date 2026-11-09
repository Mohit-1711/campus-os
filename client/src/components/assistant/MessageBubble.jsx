import ReactMarkdown from "react-markdown";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`bubble-row ${isUser ? "bubble-row--user" : ""}`}>
      <div
        className={`bubble ${isUser ? "bubble--user" : "bubble--assistant"}`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="markdown">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
