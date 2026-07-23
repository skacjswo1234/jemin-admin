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
    return jsonResponse({
      ...row,
      features: parseFeatures(row.features)
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const { env } = context;
    const id = context.params.id;
    const data = await context.request.json();

    const area = (data.area || '').trim();
    const name = (data.name || '').trim();
    if (!area || !name) {
      return jsonResponse({ error: '지역과 매물명은 필수입니다.' }, 400);
    }

    const features = JSON.stringify(parseFeatures(data.features));

    await env.DB.prepare(
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

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const id = context.params.id;
    await context.env.DB.prepare(
      `UPDATE card_recommendations SET del_yn = 'Y', updated_at = datetime('now') WHERE id = ?`
    )
      .bind(id)
      .run();

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
