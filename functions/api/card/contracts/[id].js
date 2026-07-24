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
      'SELECT * FROM card_contracts WHERE id = ?'
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

    const area = (data.area || '').trim();
    const name = (data.name || '').trim();
    if (!area || !name) {
      return jsonResponse({ error: '지역과 아파트명은 필수입니다.' }, 400);
    }

    const result = await env.DB.prepare(
      `UPDATE card_contracts SET
        image_url = ?,
        area = ?,
        name = ?,
        deal_type = ?,
        size = ?,
        contract_month = ?,
        sort_order = ?,
        updated_at = datetime('now')
       WHERE id = ? AND del_yn = 'N'`
    )
      .bind(
        data.image_url || null,
        area,
        name,
        (data.deal_type || '').trim(),
        (data.size || '').trim(),
        (data.contract_month || '').trim(),
        Number.isFinite(Number(data.sort_order)) ? Number(data.sort_order) : 0,
        id
      )
      .run();

    if (!result?.meta?.changes) {
      return jsonResponse({ error: '수정할 계약을 찾을 수 없습니다.' }, 404);
    }

    const row = await env.DB.prepare(
      'SELECT * FROM card_contracts WHERE id = ?'
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
      `UPDATE card_contracts SET del_yn = 'Y', updated_at = datetime('now') WHERE id = ? AND del_yn = 'N'`
    )
      .bind(id)
      .run();

    if (!result?.meta?.changes) {
      return jsonResponse({ error: '삭제할 계약을 찾을 수 없습니다.' }, 404);
    }

    return jsonResponse({ success: true }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
