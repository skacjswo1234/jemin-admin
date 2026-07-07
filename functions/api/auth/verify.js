import { corsOptions, isSuperAdmin, jsonResponse, requireAuth } from '../../_shared/auth.js';

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    return jsonResponse({
      success: true,
      username: auth.user.username,
      name: auth.user.name,
      isSuperAdmin: isSuperAdmin(auth.user.username)
    });
  } catch (error) {
    console.error('Verify error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestOptions() {
  return corsOptions('GET, OPTIONS');
}
