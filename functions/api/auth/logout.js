import { corsOptions, jsonResponse, requireAuth, revokeSession } from '../../_shared/auth.js';

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    await revokeSession(context.env, auth.user.sessionId);

    return jsonResponse({ success: true, message: '로그아웃되었습니다.' });
  } catch (error) {
    console.error('Logout error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestOptions() {
  return corsOptions('POST, OPTIONS');
}
