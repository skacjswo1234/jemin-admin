import {
  corsOptions,
  isSuperAdmin,
  jsonResponse,
  requireSuperAdmin,
  revokeUserSessions
} from '../../_shared/auth.js';

export async function onRequestGet(context) {
  try {
    const auth = await requireSuperAdmin(context);
    if (auth.error) return auth.error;

    const { results } = await context.env.DB.prepare(
      'SELECT id, username, password, name, disabled, createdAt FROM admins ORDER BY id'
    ).all();

    return jsonResponse(results);
  } catch (error) {
    console.error('Get accounts error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const auth = await requireSuperAdmin(context);
    if (auth.error) return auth.error;

    const { env, request } = context;
    const { username, password, name } = await request.json();

    if (!username || !password || !name) {
      return jsonResponse({ error: '아이디, 비밀번호, 성명을 모두 입력하세요.' }, 400);
    }

    if (password.length < 4) {
      return jsonResponse({ error: '비밀번호는 4자 이상이어야 합니다.' }, 400);
    }

    const existing = await env.DB.prepare(
      'SELECT id FROM admins WHERE username = ?'
    ).bind(username).first();

    if (existing) {
      return jsonResponse({ error: '이미 존재하는 아이디입니다.' }, 409);
    }

    const result = await env.DB.prepare(
      'INSERT INTO admins (username, password, name, disabled) VALUES (?, ?, ?, 0)'
    ).bind(username, password, name).run();

    return jsonResponse({
      success: true,
      id: result.meta.last_row_id,
      message: '계정이 성공적으로 추가되었습니다.'
    }, 201);
  } catch (error) {
    console.error('Add account error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestPatch(context) {
  try {
    const auth = await requireSuperAdmin(context);
    if (auth.error) return auth.error;

    const { env, request } = context;
    const { username, disabled } = await request.json();

    if (!username || typeof disabled !== 'boolean') {
      return jsonResponse({ error: '아이디와 비활성화 여부를 지정하세요.' }, 400);
    }

    if (isSuperAdmin(username)) {
      return jsonResponse({ error: '슈퍼관리자 계정은 비활성화할 수 없습니다.' }, 400);
    }

    const result = await env.DB.prepare(
      'UPDATE admins SET disabled = ? WHERE username = ?'
    ).bind(disabled ? 1 : 0, username).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ error: '계정을 찾을 수 없습니다.' }, 404);
    }

    if (disabled) {
      await revokeUserSessions(env, username);
    }

    return jsonResponse({
      success: true,
      message: disabled
        ? `계정 "${username}"이(가) 비활성화되었습니다. 모든 세션이 종료되었습니다.`
        : `계정 "${username}"이(가) 활성화되었습니다.`
    });
  } catch (error) {
    console.error('Disable account error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const auth = await requireSuperAdmin(context);
    if (auth.error) return auth.error;

    const { env, request } = context;
    const url = new URL(request.url);
    const username = url.searchParams.get('username');

    if (!username) {
      return jsonResponse({ error: '아이디를 지정하세요.' }, 400);
    }

    if (isSuperAdmin(username)) {
      return jsonResponse({ error: '슈퍼관리자 계정은 삭제할 수 없습니다.' }, 400);
    }

    if (username === auth.user.username) {
      return jsonResponse({ error: '현재 로그인한 계정은 삭제할 수 없습니다.' }, 400);
    }

    await revokeUserSessions(env, username);

    const result = await env.DB.prepare(
      'DELETE FROM admins WHERE username = ?'
    ).bind(username).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ error: '계정을 찾을 수 없습니다.' }, 404);
    }

    return jsonResponse({
      success: true,
      message: '계정이 완전히 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestOptions() {
  return corsOptions('GET, POST, PATCH, DELETE, OPTIONS');
}
