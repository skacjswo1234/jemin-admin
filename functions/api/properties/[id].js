import { corsOptions, jsonResponse, requireAuth } from '../../_shared/auth.js';

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const { env, params } = context;
    const id = params.id;

    const { results } = await env.DB.prepare(
      'SELECT * FROM properties WHERE id = ?'
    ).bind(id).all();

    if (results.length === 0) {
      return jsonResponse({ error: '매물을 찾을 수 없습니다.' }, 404);
    }

    const property = {
      ...results[0],
      options: results[0].options ? JSON.parse(results[0].options) : []
    };

    return jsonResponse(property);
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const { env, params, request } = context;
    const id = params.id;
    const data = await request.json();

    const {
      buildingName,
      dongType,
      roomNumber,
      deposit,
      monthlyRent,
      password,
      moveIn,
      status,
      options,
      notes,
      contact,
      shortTermAvailable,
      shortTermRent,
      dealType,
      salePrice
    } = data;

    const optionsJson = JSON.stringify(options || []);

    const result = await env.DB.prepare(
      `UPDATE properties 
       SET buildingName = ?, dongType = ?, roomNumber = ?, deposit = ?, 
           monthlyRent = ?, password = ?, moveIn = ?, status = ?, 
           options = ?, notes = ?, contact = ?, shortTermAvailable = ?, shortTermRent = ?,
           dealType = ?, salePrice = ?,
           updatedAt = datetime('now')
       WHERE id = ?`
    ).bind(
      buildingName,
      dongType,
      roomNumber,
      deposit,
      monthlyRent,
      password || null,
      moveIn,
      status,
      optionsJson,
      notes || null,
      contact,
      shortTermAvailable || 'N',
      shortTermRent || null,
      dealType || '월세',
      salePrice ?? null,
      id
    ).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ error: '매물을 찾을 수 없습니다.' }, 404);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const { env, params } = context;
    const id = params.id;

    const result = await env.DB.prepare(
      'UPDATE properties SET del_yn = ? WHERE id = ?'
    ).bind('Y', id).run();

    if (result.meta.changes === 0) {
      return jsonResponse({ error: '매물을 찾을 수 없습니다.' }, 404);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestOptions() {
  return corsOptions('GET, PUT, DELETE, OPTIONS');
}
