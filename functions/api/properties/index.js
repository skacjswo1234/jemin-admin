// GET: 모든 매물 조회 또는 필터링된 매물 조회
import { corsOptions, jsonResponse, requireAuth } from '../../_shared/auth.js';

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const { env, request } = context;
    const url = new URL(request.url);
    
    // 쿼리 파라미터
    const buildingName = url.searchParams.get('buildingName');
    const dongType = url.searchParams.get('dongType');
    const moveIn = url.searchParams.get('moveIn');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const delYn = url.searchParams.get('delYn'); // 'Y' 또는 'N', 없으면 기본값 'N'
    
    let query = 'SELECT * FROM properties WHERE 1=1';
    let params = [];
    
    // del_yn 필터 (기본값 'N' - 삭제되지 않은 매물만)
    const delYnValue = delYn || 'N';
    query += ' AND del_yn = ?';
    params.push(delYnValue);
    
    if (buildingName) {
      query += ' AND buildingName = ?';
      params.push(buildingName);
    }
    
    if (dongType) {
      query += ' AND dongType = ?';
      params.push(dongType);
    }
    
    if (moveIn) {
      query += ' AND moveIn = ?';
      params.push(moveIn);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (search) {
      query += ' AND (buildingName LIKE ? OR roomNumber LIKE ? OR dongType LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    query += ' ORDER BY createdAt DESC';
    
    const { results } = await env.DB.prepare(query).bind(...params).all();
    
    // options를 JSON 파싱
    const properties = results.map(property => ({
      ...property,
      options: property.options ? JSON.parse(property.options) : []
    }));
    
    return jsonResponse(properties, 200, {
      'Cache-Control': 'public, max-age=10'
    });
  } catch (error) {
    console.error('Properties GET error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

// POST: 새 매물 등록
export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const { env, request } = context;
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
    
    // 필수 필드 검증 (건물명과 동/타입만 필수)
    if (!buildingName || !dongType) {
      return jsonResponse({ error: '건물명과 동/타입은 필수입니다.' }, 400);
    }
    
    const optionsJson = JSON.stringify(options || []);
    
    // 트랜잭션으로 안전하게 처리 (del_yn 기본값 'N' 포함)
    const result = await env.DB.prepare(
      `INSERT INTO properties 
       (buildingName, dongType, roomNumber, deposit, monthlyRent, password, moveIn, status, options, notes, contact, shortTermAvailable, shortTermRent, dealType, salePrice, del_yn) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N')`
    ).bind(
      buildingName, 
      dongType, 
      roomNumber || '', 
      deposit || 0, 
      monthlyRent || 0, 
      password || null, 
      moveIn || '미전입', 
      status || '공실', 
      optionsJson, 
      notes || null, 
      contact || '',
      shortTermAvailable || 'N',
      shortTermRent || null,
      dealType || '월세',
      salePrice ?? null
    ).run();
    
    // 성공 응답에 새로 생성된 데이터 포함
    const newProperty = {
      id: result.meta.last_row_id,
      buildingName,
      dongType,
      roomNumber,
      deposit,
      monthlyRent,
      password,
      moveIn,
      status,
      options: options || [],
      notes,
      contact,
      shortTermAvailable: shortTermAvailable || 'N',
      shortTermRent: shortTermRent || null,
      dealType: dealType || '월세',
      salePrice: salePrice ?? null,
      createdAt: new Date().toISOString()
    };
    
    return jsonResponse({
      success: true,
      property: newProperty
    }, 201);
  } catch (error) {
    console.error('Properties POST error:', error);

    if (error.message.includes('UNIQUE') || error.message.includes('constraint')) {
      return jsonResponse({ error: '이미 존재하는 매물입니다.' }, 409);
    }

    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestOptions() {
  return corsOptions('GET, POST, OPTIONS');
}
