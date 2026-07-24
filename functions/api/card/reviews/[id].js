import { corsOptions, jsonResponse, requireAuth } from '../../../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions('GET, PUT, DELETE, OPTIONS');
}

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const id = context.params.id;
    const row = await context.env.DB.prepare(
      'SELECT * FROM card_reviews WHERE id = ?'
    )
      .bind(id)
      .first();

    if (!row) return jsonResponse({ error: 'Not found' }, 404);
    return jsonResponse(row, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const { env } = context;
    const id = Number(context.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return jsonResponse({ error: '잘못된 ID입니다.' }, 400);
    }

    const data = await context.request.json();

    const content = (data.content || '').trim();
    const authorName = (data.author_name || '').trim();
    if (!content || !authorName) {
      return jsonResponse({ error: '닉네임과 후기 내용은 필수입니다.' }, 400);
    }

    let rating = Number(data.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) rating = 5;

    const result = await env.DB.prepare(
      `UPDATE card_reviews SET
        image_url = ?,
        content = ?,
        author_name = ?,
        visit_date = ?,
        rating = ?,
        sort_order = ?,
        updated_at = datetime('now')
       WHERE id = ? AND del_yn = 'N'`
    )
      .bind(
        data.image_url || null,
        content,
        authorName,
        (data.visit_date || '').trim(),
        rating,
        Number.isFinite(Number(data.sort_order)) ? Number(data.sort_order) : 0,
        id
      )
      .run();

    if (!result?.meta?.changes) {
      return jsonResponse({ error: '수정할 후기를 찾을 수 없습니다.' }, 404);
    }

    const row = await env.DB.prepare(
      'SELECT * FROM card_reviews WHERE id = ?'
    )
      .bind(id)
      .first();

    return jsonResponse({ success: true, item: row }, 200, {
      'Cache-Control': 'no-store'
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const id = Number(context.params.id);
    const result = await context.env.DB.prepare(
      `UPDATE card_reviews SET del_yn = 'Y', updated_at = datetime('now') WHERE id = ? AND del_yn = 'N'`
    )
      .bind(id)
      .run();

    if (!result?.meta?.changes) {
      return jsonResponse({ error: '삭제할 후기를 찾을 수 없습니다.' }, 404);
    }

    return jsonResponse({ success: true }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
