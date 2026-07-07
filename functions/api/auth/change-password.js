import {
  corsOptions,
  createSession,
  createToken,
  getJwtSecret,
  isSuperAdmin,
  jsonResponse,
  requireAuth,
  revokeUserSessions
} from '../../_shared/auth.js';

export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const body = await request.json();
    const { username, currentPassword, newPassword, name, targetUsername } = body;

    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    if (targetUsername) {
      if (!isSuperAdmin(auth.user.username)) {
        return jsonResponse({ error: '권한이 없습니다.' }, 403);
      }

      if (!newPassword || newPassword.length < 4) {
        return jsonResponse({ error: '새 비밀번호는 4자 이상이어야 합니다.' }, 400);
      }

      const targetExists = await env.DB.prepare(
        'SELECT id FROM admins WHERE username = ?'
      ).bind(targetUsername).first();

      if (!targetExists) {
        return jsonResponse({ error: '대상 계정을 찾을 수 없습니다.' }, 404);
      }

      await env.DB.prepare(
        'UPDATE admins SET password = ? WHERE username = ?'
      ).bind(newPassword, targetUsername).run();

      await revokeUserSessions(env, targetUsername);

      return jsonResponse({
        success: true,
        message: `계정 "${targetUsername}"의 비밀번호가 변경되었습니다. 해당 계정은 다시 로그인해야 합니다.`
      });
    }

    if (!currentPassword) {
      return jsonResponse({ error: '현재 비밀번호를 입력하세요.' }, 400);
    }

    if (newPassword && newPassword.length < 4) {
      return jsonResponse({ error: '새 비밀번호는 4자 이상이어야 합니다.' }, 400);
    }

    const admin = await env.DB.prepare(
      'SELECT * FROM admins WHERE username = ? AND password = ?'
    ).bind(auth.user.username, currentPassword).first();

    if (!admin) {
      return jsonResponse({ error: '현재 비밀번호가 올바르지 않습니다.' }, 401);
    }

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }

    if (newPassword) {
      updates.push('password = ?');
      params.push(newPassword);
    }

    if (updates.length === 0) {
      return jsonResponse({ error: '변경할 내용이 없습니다.' }, 400);
    }

    await env.DB.prepare(
      `UPDATE admins SET ${updates.join(', ')} WHERE username = ?`
    ).bind(...params, auth.user.username).run();

    if (newPassword) {
      await revokeUserSessions(env, auth.user.username);
      const newSessionId = await createSession(env, auth.user.username);
      const token = await createToken(auth.user.username, newSessionId, getJwtSecret(env));

      const updated = await env.DB.prepare(
        'SELECT username, name FROM admins WHERE username = ?'
      ).bind(auth.user.username).first();

      return jsonResponse({
        success: true,
        name: updated.name,
        token,
        message: '정보가 성공적으로 변경되었습니다.'
      });
    }

    const updated = await env.DB.prepare(
      'SELECT username, name FROM admins WHERE username = ?'
    ).bind(auth.user.username).first();

    return jsonResponse({
      success: true,
      name: updated.name,
      message: '정보가 성공적으로 변경되었습니다.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestOptions() {
  return corsOptions('POST, OPTIONS');
}
