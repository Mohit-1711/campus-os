import { Link } from "react-router-dom";

export default function Brand() {
  return (
    <div className="brand">
      <Link to="/" className="brand__mark" aria-label="Go to homepage">
        <img src="/favicon.svg" alt="Campus OS" />
      </Link>

      <span className="brand__name">Campus OS</span>
    </div>
  );
}
