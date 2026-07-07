const encoder = new TextEncoder();
const TOKEN_EXPIRY_DAYS = 7;
const SUPER_ADMIN = 'jemin';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export function isSuperAdmin(username) {
  return username === SUPER_ADMIN;
}

export function getJwtSecret(env) {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

function base64UrlEncode(data) {
  const bytes = typeof data === 'string' ? encoder.encode(data) : data;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function signHmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function createToken(username, sessionId, secret) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify({ sub: username, jti: sessionId, exp }));
  const signature = await signHmac(secret, `${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

export async function verifyToken(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expected = await signHmac(secret, `${header}.${body}`);
  if (signature !== expected) return null;

  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body)));
  if (!payload.sub || !payload.jti) return null;
  if (payload.exp && Date.now() / 1000 > payload.exp) return null;
  return payload;
}

export function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders
    }
  });
}

export function corsOptions(allowedMethods) {
  return new Response(null, {
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Allow-Methods': allowedMethods
    }
  });
}

export async function createSession(env, username) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    'INSERT INTO auth_sessions (id, username, expiresAt) VALUES (?, ?, ?)'
  ).bind(sessionId, username, expiresAt).run();

  return sessionId;
}

export async function revokeSession(env, sessionId) {
  await env.DB.prepare('DELETE FROM auth_sessions WHERE id = ?').bind(sessionId).run();
}

export async function revokeUserSessions(env, username) {
  await env.DB.prepare('DELETE FROM auth_sessions WHERE username = ?').bind(username).run();
}

export async function requireAuth(context) {
  const { env, request } = context;
  const token = getBearerToken(request);

  if (!token) {
    return { error: jsonResponse({ error: '인증이 필요합니다.' }, 401) };
  }

  let payload;
  try {
    payload = await verifyToken(token, getJwtSecret(env));
  } catch {
    return { error: jsonResponse({ error: '인증 설정 오류입니다.' }, 500) };
  }

  if (!payload) {
    return { error: jsonResponse({ error: '유효하지 않은 토큰입니다.' }, 401) };
  }

  const session = await env.DB.prepare(
    `SELECT s.id, s.username, a.name, a.disabled
     FROM auth_sessions s
     JOIN admins a ON s.username = a.username
     WHERE s.id = ? AND s.username = ? AND s.expiresAt > datetime('now')`
  ).bind(payload.jti, payload.sub).first();

  if (!session) {
    return { error: jsonResponse({ error: '세션이 만료되었거나 무효화되었습니다.' }, 401) };
  }

  if (session.disabled === 1) {
    return { error: jsonResponse({ error: '비활성화된 계정입니다.' }, 403) };
  }

  return {
    user: {
      username: session.username,
      name: session.name,
      sessionId: payload.jti
    }
  };
}

export async function requireSuperAdmin(context) {
  const auth = await requireAuth(context);
  if (auth.error) return auth;

  if (!isSuperAdmin(auth.user.username)) {
    return { error: jsonResponse({ error: '권한이 없습니다.' }, 403) };
  }

  return auth;
}
