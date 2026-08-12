function resolveDefaultApiBaseUrl() {
  const configuredBaseUrl = import.meta.env["VITE_API_BASE_URL"];
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const isLocalhost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);
    if (isLocalhost) {
      return "http://localhost:8000";
    }
  }

  return "";
}

const defaultApiBaseUrl = resolveDefaultApiBaseUrl();

export function getApiBaseUrl() {
  return defaultApiBaseUrl;
}

function getAdminToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("motormate_admin_token");
}

export function setAdminToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem("motormate_admin_token", token);
  } else {
    window.localStorage.removeItem("motormate_admin_token");
  }
}

async function parseError(response: Response) {
  const fallback = `${response.status} ${response.statusText}`;

  try {
    const data = (await response.json()) as { detail?: string };
    return data.detail || fallback;
  } catch {
    return fallback;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAdminToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function getCustomerToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("motormate_customer_token");
}

export function setCustomerToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (token) {
    window.localStorage.setItem("motormate_customer_token", token);
  } else {
    window.localStorage.removeItem("motormate_customer_token");
  }
}

export function hasCustomerSession() {
  return Boolean(getCustomerToken());
}

export async function customerFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getCustomerToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return apiFetch<T>(path, { ...init, headers });
}
