import { corsOptions, jsonResponse, requireAuth } from '../../../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions('GET, POST, OPTIONS');
}

/** 공개: 모바일 명함용 후기 목록 */
export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get('all') === '1';

    if (includeDeleted) {
      const auth = await requireAuth(context);
      if (auth.error) return auth.error;
      const { results } = await env.DB.prepare(
        'SELECT * FROM card_reviews ORDER BY sort_order ASC, id DESC'
      ).all();
      return jsonResponse(results || [], 200, { 'Cache-Control': 'no-store' });
    }

    const { results } = await env.DB.prepare(
      `SELECT * FROM card_reviews WHERE del_yn = 'N' ORDER BY sort_order ASC, id DESC`
    ).all();

    return jsonResponse(results || [], 200, {
      'Cache-Control': 'public, max-age=5, must-revalidate'
    });
  } catch (error) {
    console.error('card reviews GET error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

/** 관리자: 후기 등록 */
export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const { env, request } = context;
    const data = await request.json();

    const content = (data.content || '').trim();
    const authorName = (data.author_name || '').trim();
    if (!content || !authorName) {
      return jsonResponse({ error: '닉네임과 후기 내용은 필수입니다.' }, 400);
    }

    let rating = Number(data.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) rating = 5;

    const result = await env.DB.prepare(
      `INSERT INTO card_reviews
       (image_url, content, author_name, visit_date, rating, sort_order, del_yn, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'N', datetime('now'), datetime('now'))`
    )
      .bind(
        data.image_url || null,
        content,
        authorName,
        (data.visit_date || '').trim(),
        rating,
        Number.isFinite(Number(data.sort_order)) ? Number(data.sort_order) : 0
      )
      .run();

    return jsonResponse({ id: result.meta.last_row_id, success: true }, 201);
  } catch (error) {
    console.error('card reviews POST error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}
