import { useParams } from "react-router-dom";
import FolderDetail from "../components/resources/FolderDetail";
import FolderOverview from "../components/resources/FolderOverview";
import LoadingState from "../components/ui/LoadingState";
import { useResources } from "../context/ResourcesContext";
import "./ResourcesPage.css";

export default function ResourcesPage() {
  const { folderId } = useParams();
  const { loading, error, refresh } = useResources();

  if (loading) return <LoadingState label="Loading your resources..." />;

  if (error) {
    return (
      <div className="card resources-error">
        <p className="alert alert--error" role="alert">{error}</p>
        <button type="button" className="btn btn--secondary" onClick={() => refresh()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="resources">
      {folderId ? <FolderDetail folderId={folderId} key={folderId} /> : <FolderOverview />}
    </div>
  );
}
