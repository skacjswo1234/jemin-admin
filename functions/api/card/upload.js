import { corsOptions, jsonResponse, requireAuth } from '../../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions('POST, OPTIONS');
}

/** 관리자: R2 이미지 업로드 → 공개 URL 반환 */
export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const { env, request } = context;
    if (!env.R2) {
      return jsonResponse({ error: 'R2 binding is not configured' }, 500);
    }

    const form = await request.formData();
    const file = form.get('file');
    const folder = String(form.get('folder') || 'card').replace(/[^a-z0-9_-]/gi, '');

    if (!file || typeof file === 'string') {
      return jsonResponse({ error: 'file is required' }, 400);
    }

    const type = file.type || 'application/octet-stream';
    if (!type.startsWith('image/')) {
      return jsonResponse({ error: '이미지 파일만 업로드할 수 있습니다.' }, 400);
    }

    const original = file.name || 'image.jpg';
    const ext = (original.includes('.') ? original.split('.').pop() : 'jpg')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const key = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext || 'jpg'}`;

    await env.R2.put(key, file.stream(), {
      httpMetadata: {
        contentType: type
      }
    });

    const base = (env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    const url = `${base}/${key}`;

    return jsonResponse({ success: true, key, url });
  } catch (error) {
    console.error('card upload error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}
