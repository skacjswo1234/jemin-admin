// GET: 특정 매물 조회
export async function onRequestGet(context) {
  try {
    const { env, params } = context;
    const id = params.id;
    
    const { results } = await env.DB.prepare(
      'SELECT * FROM properties WHERE id = ?'
    ).bind(id).all();
    
    if (results.length === 0) {
      return new Response(JSON.stringify({ error: '매물을 찾을 수 없습니다.' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const property = {
      ...results[0],
      options: results[0].options ? JSON.parse(results[0].options) : []
    };
    
    return new Response(JSON.stringify(property), {
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

// PUT: 매물 수정
export async function onRequestPut(context) {
  try {
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
      contact 
    } = data;
    
    const optionsJson = JSON.stringify(options || []);
    
    const result = await env.DB.prepare(
      `UPDATE properties 
       SET buildingName = ?, dongType = ?, roomNumber = ?, deposit = ?, 
           monthlyRent = ?, password = ?, moveIn = ?, status = ?, 
           options = ?, notes = ?, contact = ?
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
      id
    ).run();
    
    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: '매물을 찾을 수 없습니다.' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    return new Response(JSON.stringify({ success: true }), {
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

// DELETE: 매물 삭제
export async function onRequestDelete(context) {
  try {
    const { env, params } = context;
    const id = params.id;
    
    const result = await env.DB.prepare(
      'DELETE FROM properties WHERE id = ?'
    ).bind(id).run();
    
    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: '매물을 찾을 수 없습니다.' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    return new Response(JSON.stringify({ success: true }), {
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

