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
  return corsOptions('GET, POST, OPTIONS');
}

/** 공개: 오늘의 추천 매물 */
export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get('all') === '1';

    if (includeDeleted) {
      const auth = await requireAuth(context);
      if (auth.error) return auth.error;
      const { results } = await env.DB.prepare(
        'SELECT * FROM card_recommendations ORDER BY sort_order ASC, id DESC'
      ).all();
      return jsonResponse(
        (results || []).map((row) => ({
          ...row,
          features: parseFeatures(row.features)
        })),
        200,
        { 'Cache-Control': 'no-store' }
      );
    }

    const { results } = await env.DB.prepare(
      `SELECT * FROM card_recommendations WHERE del_yn = 'N' ORDER BY sort_order ASC, id DESC`
    ).all();

    return jsonResponse(
      (results || []).map((row) => ({
        ...row,
        features: parseFeatures(row.features)
      })),
      200,
      { 'Cache-Control': 'public, max-age=5, must-revalidate' }
    );
  } catch (error) {
    console.error('card recommendations GET error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const { env, request } = context;
    const data = await request.json();
    const area = (data.area || '').trim();
    const name = (data.name || '').trim();
    if (!area || !name) {
      return jsonResponse({ error: '지역과 매물명은 필수입니다.' }, 400);
    }

    const features = JSON.stringify(parseFeatures(data.features));

    const result = await env.DB.prepare(
      `INSERT INTO card_recommendations
       (image_url, price, area, name, features, sort_order, del_yn, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'N', datetime('now'), datetime('now'))`
    )
      .bind(
        data.image_url || null,
        (data.price || '').trim(),
        area,
        name,
        features,
        Number.isFinite(Number(data.sort_order)) ? Number(data.sort_order) : 0
      )
      .run();

    return jsonResponse({ id: result.meta.last_row_id, success: true }, 201);
  } catch (error) {
    console.error('card recommendations POST error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}
