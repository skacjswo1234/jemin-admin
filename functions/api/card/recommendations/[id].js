import { corsOptions, jsonResponse, requireAuth } from '../../../_shared/auth.js';

function parseFeatures(raw) {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export async function onRequestOptions() {
  return corsOptions('GET, PUT, DELETE, OPTIONS');
}

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const id = context.params.id;
    const row = await context.env.DB.prepare(
      'SELECT * FROM card_recommendations WHERE id = ?'
    )
      .bind(id)
      .first();

    if (!row) return jsonResponse({ error: 'Not found' }, 404);
    return jsonResponse(
      {
        ...row,
        features: parseFeatures(row.features)
      },
      200,
      { 'Cache-Control': 'no-store' }
    );
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

    const area = (data.area || '').trim();
    const name = (data.name || '').trim();
    if (!area || !name) {
      return jsonResponse({ error: '지역과 매물명은 필수입니다.' }, 400);
    }

    const features = JSON.stringify(parseFeatures(data.features));

    const result = await env.DB.prepare(
      `UPDATE card_recommendations SET
        image_url = ?,
        price = ?,
        area = ?,
        name = ?,
        features = ?,
        sort_order = ?,
        updated_at = datetime('now')
       WHERE id = ? AND del_yn = 'N'`
    )
      .bind(
        data.image_url || null,
        (data.price || '').trim(),
        area,
        name,
        features,
        Number.isFinite(Number(data.sort_order)) ? Number(data.sort_order) : 0,
        id
      )
      .run();

    if (!result?.meta?.changes) {
      return jsonResponse({ error: '수정할 추천 매물을 찾을 수 없습니다.' }, 404);
    }

    const row = await env.DB.prepare(
      'SELECT * FROM card_recommendations WHERE id = ?'
    )
      .bind(id)
      .first();

    return jsonResponse(
      {
        success: true,
        item: {
          ...row,
          features: parseFeatures(row?.features)
        }
      },
      200,
      { 'Cache-Control': 'no-store' }
    );
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
      `UPDATE card_recommendations SET del_yn = 'Y', updated_at = datetime('now') WHERE id = ? AND del_yn = 'N'`
    )
      .bind(id)
      .run();

    if (!result?.meta?.changes) {
      return jsonResponse({ error: '삭제할 추천 매물을 찾을 수 없습니다.' }, 404);
    }

    return jsonResponse({ success: true }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
