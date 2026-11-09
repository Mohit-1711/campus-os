import { Link } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";

export default function NotFoundPage() {
  return (
    <EmptyState title="Page not found" description="The page you're looking for doesn't exist or was moved.">
      <Link to="/" className="btn btn--primary">
        Back to overview
      </Link>
    </EmptyState>
  );
}
