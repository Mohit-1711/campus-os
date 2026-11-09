export default function EmptyState({ title, description, children }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
