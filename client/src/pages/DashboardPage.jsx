import { Link } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";
import Icon from "../components/ui/Icon";
import LoadingState from "../components/ui/LoadingState";
import FileTable from "../components/resources/FileTable";
import { MODULES } from "../constants/modules";
import { useAuth } from "../context/AuthContext";
import { useResources } from "../context/ResourcesContext";
import { getFirstName } from "../utils/format";
import "./DashboardPage.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const { folders, files, loading, error, refresh } = useResources();

  const aiReady = files.filter((file) => file.processingStatus === "ready").length;
  const recentFiles = files.slice(0, 5);

  return (
    <div className="dashboard">
      <section className="dashboard__hero">
        <div>
          <p className="page-header__eyebrow">Overview</p>
          <h1>Welcome back, {getFirstName(user?.name)}</h1>
          <p>Your notes, study tools and career prep, all in one place.</p>
        </div>

        <dl className="dashboard__stats">
          <div><dt>Folders</dt><dd>{folders.length}</dd></div>
          <div><dt>Files</dt><dd>{files.length}</dd></div>
          <div><dt>AI-ready PDFs</dt><dd>{aiReady}</dd></div>
        </dl>
      </section>

      <section>
        <h2 className="section-title">Your modules</h2>
        <div className="dashboard__modules">
          {MODULES.map((module) => (
            <Link key={module.id} to={module.path} className="card module-card">
              <span className={`tile tile--${module.accent}`}>
                <Icon name={module.icon} />
              </span>
              <div>
                <h3>
                  {module.title} {module.soon && <span className="chip">Soon</span>}
                </h3>
                <p>{module.description}</p>
              </div>
              <Icon name="arrowRight" size={18} className="module-card__arrow" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="dashboard__section-head">
          <h2 className="section-title">Recent files</h2>
          <Link to="/resources" className="dashboard__link">View all</Link>
        </div>

        {loading ? (
          <LoadingState label="Loading your files..." />
        ) : error ? (
          <div className="card dashboard__error">
            <p className="alert alert--error" role="alert">{error}</p>
            <button type="button" className="btn btn--secondary" onClick={() => refresh()}>Try again</button>
          </div>
        ) : recentFiles.length === 0 ? (
          <EmptyState title="No files yet" description="Create a folder and upload your first study material.">
            <Link to="/resources" className="btn btn--primary">Go to resources</Link>
          </EmptyState>
        ) : (
          <div className="card">
            <FileTable files={recentFiles} showFolder />
          </div>
        )}
      </section>
    </div>
  );
}
