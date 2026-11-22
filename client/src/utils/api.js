export const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function getSession() {
  try { return JSON.parse(localStorage.getItem("dev8_session")); } catch { return null; }
}

export function setSession(data) {
  localStorage.setItem("dev8_session", JSON.stringify(data));
}

export function clearSession() {
  localStorage.removeItem("dev8_session");
}

export async function api(path, { method = "GET", body, token } = {}) {
  const session = getSession();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token || session?.token ? { Authorization: `Bearer ${token || session.token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) clearSession();
    throw Object.assign(new Error(data.error || "Request failed"), { status: res.status, data });
  }
  return data;
}
