import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import LoadingState from "./components/ui/LoadingState";
import AssistantPage from "./pages/AssistantPage";
import AuthPage from "./pages/AuthPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import ResourcesPage from "./pages/ResourcesPage";
import { MODULES } from "./constants/modules";

function FullScreenMessage({ children }) {
  return <div className="fullscreen-message">{children}</div>;
}

/** Decides what to show based on the session: login page, app, or a connection error. */
function AppRoutes() {
  const { status, error, retry } = useAuth();

  if (status === "loading") {
    return (
      <FullScreenMessage>
        <LoadingState label="Loading Campus OS..." />
      </FullScreenMessage>
    );
  }

  if (status === "error") {
    return (
      <FullScreenMessage>
        <div className="card connection-error">
          <h2>Can't reach the server</h2>
          <p>{error}</p>
          <button type="button" className="btn btn--primary" onClick={retry}>
            Try again
          </button>
        </div>
      </FullScreenMessage>
    );
  }

  if (status === "unauthenticated") {
    return <AuthPage />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="resources/:folderId" element={<ResourcesPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="profile" element={<ProfilePage />} />
        {MODULES.filter((module) => module.soon).map((module) => (
          <Route
            key={module.id}
            path={module.path.slice(1)}
            element={<ComingSoonPage module={module} />}
          />
        ))}
        <Route path="login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
