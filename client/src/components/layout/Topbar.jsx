import { Link, useLocation } from "react-router-dom";
import { MODULES } from "../../constants/modules";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/format";
import Icon from "../ui/Icon";

function getPageTitle(pathname) {
  if (pathname === "/") return "Overview";
  if (pathname.startsWith("/profile")) return "Profile";

  const module = MODULES.find((item) => pathname.startsWith(item.path));
  return module ? module.title : "Campus OS";
}

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <header className="topbar">
      <button type="button" className="icon-btn topbar__menu" onClick={onMenuClick} aria-label="Open menu">
        <Icon name="menu" />
      </button>

      <h2 className="topbar__title">{getPageTitle(pathname)}</h2>

      <Link to="/profile" className="topbar__avatar" aria-label="Your profile">
        {getInitials(user?.name)}
      </Link>
    </header>
  );
}
