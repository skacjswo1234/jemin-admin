// GET: 모든 매물 조회 또는 필터링된 매물 조회
export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    
    // 쿼리 파라미터
    const buildingName = url.searchParams.get('buildingName');
    const dongType = url.searchParams.get('dongType');
    const moveIn = url.searchParams.get('moveIn');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    
    let query = 'SELECT * FROM properties WHERE 1=1';
    let params = [];
    
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
    
    return new Response(JSON.stringify(properties), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// POST: 새 매물 등록
export async function onRequestPost(context) {
  try {
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
      contact 
    } = data;
    
    // 필수 필드 검증
    if (!buildingName || !dongType || !roomNumber || !deposit || !monthlyRent || !moveIn || !status || !contact) {
      return new Response(JSON.stringify({ error: '필수 필드가 누락되었습니다.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const optionsJson = JSON.stringify(options || []);
    
    const result = await env.DB.prepare(
      `INSERT INTO properties 
       (buildingName, dongType, roomNumber, deposit, monthlyRent, password, moveIn, status, options, notes, contact) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      contact
    ).run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      id: result.meta.last_row_id 
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// OPTIONS: CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

