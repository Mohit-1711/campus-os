import { useAuth } from "../context/AuthContext";
import { useResources } from "../context/ResourcesContext";
import Icon from "../components/ui/Icon";
import { getInitials } from "../utils/format";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { folders, files } = useResources();

  const aiReady = files.filter((file) => file.processingStatus === "ready").length;

  return (
    <div className="profile">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Account</p>
          <h1>Your profile</h1>
        </div>
      </header>

      <section className="card profile__card">
        <span className="profile__avatar">{getInitials(user?.name)}</span>
        <div>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
        </div>
      </section>

      <section className="profile__stats" aria-label="Your library">
        <div className="card"><strong>{folders.length}</strong><span>Folders</span></div>
        <div className="card"><strong>{files.length}</strong><span>Files</span></div>
        <div className="card"><strong>{aiReady}</strong><span>AI-ready PDFs</span></div>
      </section>

      <button type="button" className="btn btn--secondary" onClick={logout}>
        <Icon name="logout" size={16} /> Log out
      </button>
    </div>
  );
}
