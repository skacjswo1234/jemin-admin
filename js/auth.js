const AUTH_TOKEN_KEY = 'adminToken';
const AUTH_USER_KEY = 'adminUser';
const AUTH_NAME_KEY = 'adminName';

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getAuthHeaders() {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function saveAuth(token, username, name) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, username);
  localStorage.setItem(AUTH_NAME_KEY, name);
}

function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_NAME_KEY);
}

async function verifySession() {
  const token = getToken();
  if (!token) return false;

  try {
    const response = await fetch('/api/auth/verify', {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      clearAuth();
      return false;
    }

    const data = await response.json();
    localStorage.setItem(AUTH_USER_KEY, data.username);
    localStorage.setItem(AUTH_NAME_KEY, data.name);
    return true;
  } catch {
    clearAuth();
    return false;
  }
}

async function apiFetch(url, options = {}) {
  const headers = {
    ...(options.headers || {}),
    ...getAuthHeaders()
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    clearAuth();
    if (!window.location.pathname.endsWith('login.html')) {
      window.location.href = 'login.html';
    }
    throw new Error('인증이 필요합니다.');
  }

  return response;
}

function updateAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}
