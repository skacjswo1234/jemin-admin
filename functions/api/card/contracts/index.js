import { corsOptions, jsonResponse, requireAuth } from '../../../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions('GET, POST, OPTIONS');
}

/** 공개: 모바일 명함용 최근 계약 목록 */
export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get('all') === '1';

    // all=1 은 관리자만
    if (includeDeleted) {
      const auth = await requireAuth(context);
      if (auth.error) return auth.error;
    }

    let query =
      'SELECT * FROM card_contracts WHERE del_yn = ? ORDER BY sort_order ASC, id DESC';
    let delYn = 'N';

    if (includeDeleted) {
      query = 'SELECT * FROM card_contracts ORDER BY sort_order ASC, id DESC';
      const { results } = await env.DB.prepare(query).all();
      return jsonResponse(results || [], 200, {
        'Cache-Control': 'no-store'
      });
    }

    const { results } = await env.DB.prepare(query).bind(delYn).all();
    return jsonResponse(results || [], 200, {
      // 수정 직후 관리자/명함 사이트에 이전 값이 남지 않도록 짧게만 캐시
      'Cache-Control': 'public, max-age=5, must-revalidate'
    });
  } catch (error) {
    console.error('card contracts GET error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

/** 관리자: 최근 계약 등록 */
export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const { env, request } = context;
    const data = await request.json();

    const area = (data.area || '').trim();
    const name = (data.name || '').trim();
    if (!area || !name) {
      return jsonResponse({ error: '지역과 아파트명은 필수입니다.' }, 400);
    }

    const result = await env.DB.prepare(
      `INSERT INTO card_contracts
       (image_url, area, name, deal_type, size, contract_month, sort_order, del_yn, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'N', datetime('now'), datetime('now'))`
    )
      .bind(
        data.image_url || null,
        area,
        name,
        (data.deal_type || '').trim(),
        (data.size || '').trim(),
        (data.contract_month || '').trim(),
        Number.isFinite(Number(data.sort_order)) ? Number(data.sort_order) : 0
      )
      .run();

    return jsonResponse({ id: result.meta.last_row_id, success: true }, 201);
  } catch (error) {
    console.error('card contracts POST error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}
