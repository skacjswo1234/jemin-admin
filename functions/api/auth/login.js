import {
  corsOptions,
  createSession,
  createToken,
  getJwtSecret,
  jsonResponse
} from '../../_shared/auth.js';

export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const { username, password } = await request.json();

    if (!username || !password) {
      return jsonResponse({ error: '아이디와 비밀번호를 입력하세요.' }, 400);
    }

    const admin = await env.DB.prepare(
      'SELECT username, name, disabled FROM admins WHERE username = ? AND password = ?'
    ).bind(username, password).first();

    if (!admin) {
      return jsonResponse({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 401);
    }

    if (admin.disabled === 1) {
      return jsonResponse({ error: '비활성화된 계정입니다. 관리자에게 문의하세요.' }, 403);
    }

    const sessionId = await createSession(env, admin.username);
    const token = await createToken(admin.username, sessionId, getJwtSecret(env));

    return jsonResponse({
      success: true,
      token,
      username: admin.username,
      name: admin.name
    });
  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestOptions() {
  return corsOptions('POST, OPTIONS');
}
