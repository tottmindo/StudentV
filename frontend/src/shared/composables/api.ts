const DEFAULT_SERVER_URL = "http://localhost:3000";

export function getServerUrl(): string {
  return (
    sessionStorage.getItem("serverIP") ||
    import.meta.env.VITE_API_BASE_URL ||
    DEFAULT_SERVER_URL
  ).replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getServerUrl()}${normalizedPath}`;
}
