import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

// When the session expires the server answers 401. Let the auth layer know so it
// can send the user back to the login page instead of showing broken screens.
let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthRequest = url.startsWith("/auth/");

    if (error.response?.status === 401 && !isAuthRequest) {
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  },
);

/** One place that turns any failed request into a readable message. */
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error?.response?.data?.message) return error.response.data.message;

  // The request was sent but nothing came back: the server is down or unreachable.
  if (error?.request && !error.response) {
    return "Can't reach the server. Check your connection and try again.";
  }

  return fallback;
}

export default api;
