import { NavLink } from "react-router-dom";
import { MODULES } from "../../constants/modules";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/format";
import Icon from "../ui/Icon";
import Brand from "./Brand";

export default function Sidebar({ open, onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`} aria-label="Main navigation">
      <Brand />

      <nav className="sidebar__nav">
        <NavLink to="/" end className="nav-link" onClick={onNavigate}>
          <Icon name="grid" />
          <span>Overview</span>
        </NavLink>

        {MODULES.map((module) => (
          <NavLink key={module.id} to={module.path} className="nav-link" onClick={onNavigate}>
            <Icon name={module.icon} />
            <span>{module.title}</span>
            {module.soon && <span className="chip">Soon</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <NavLink to="/profile" className="account" onClick={onNavigate}>
          <span className="account__avatar">{getInitials(user?.name)}</span>
          <span className="account__text">
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
          </span>
        </NavLink>

        <button type="button" className="nav-link nav-link--button" onClick={logout}>
          <Icon name="logout" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
