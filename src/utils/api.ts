const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && Date.now() >= payload.exp * 1000 - 30000) { // 30s buffer
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function performRefresh(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${apiUrl}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const result = await response.json();
    if (response.ok && result.success && result.data) {
      localStorage.setItem("accessToken", result.data.accessToken);
      localStorage.setItem("refreshToken", result.data.refreshToken);
      return result.data.accessToken;
    }
  } catch (err) {
    console.error("Refresh token error:", err);
  }

  // Clear tokens if refresh fails
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  return null;
}

export async function getValidAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  if (isTokenExpired(token)) {
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          resolve(newToken);
        });
      });
    }

    isRefreshing = true;
    const newToken = await performRefresh();
    isRefreshing = false;
    onRefreshed(newToken);
    return newToken;
  }

  return token;
}

export async function apiFetch(urlOrPath: string, options: RequestInit = {}): Promise<Response> {
  const url = urlOrPath.startsWith("http") ? urlOrPath : `${apiUrl}${urlOrPath}`;
  const token = await getValidAccessToken();

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  // If we get a 401 unauthorized, retry once by forcing token refresh
  if (response.status === 401 && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      const newToken = await performRefresh();
      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        return fetch(url, { ...options, headers });
      } else {
        window.location.href = "/login?status=session-expired";
      }
    }
  }

  return response;
}

export async function submitReport(
  documentId: number,
  reason: string,
  description: string
): Promise<{ success: boolean; data: { id: number; status: string } }> {
  const response = await apiFetch("/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId, reason, description }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Không thể gửi báo cáo");
  }

  return response.json();
}
