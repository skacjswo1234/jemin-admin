// GET: 모든 계정 조회
export async function onRequestGet(context) {
  try {
    const { env } = context;
    
    const { results } = await env.DB.prepare(
      'SELECT id, username, createdAt FROM admins ORDER BY id'
    ).all();
    
    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// POST: 새 계정 추가
export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return new Response(JSON.stringify({ error: '아이디와 비밀번호를 입력하세요.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    if (password.length < 4) {
      return new Response(JSON.stringify({ error: '비밀번호는 4자 이상이어야 합니다.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 중복 체크
    const { results } = await env.DB.prepare(
      'SELECT * FROM admins WHERE username = ?'
    ).bind(username).all();
    
    if (results.length > 0) {
      return new Response(JSON.stringify({ error: '이미 존재하는 아이디입니다.' }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 계정 추가
    const result = await env.DB.prepare(
      'INSERT INTO admins (username, password) VALUES (?, ?)'
    ).bind(username, password).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      id: result.meta.last_row_id,
      message: '계정이 성공적으로 추가되었습니다.'
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Add account error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// DELETE: 계정 삭제
export async function onRequestDelete(context) {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    
    if (!username) {
      return new Response(JSON.stringify({ error: '아이디를 지정하세요.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const result = await env.DB.prepare(
      'DELETE FROM admins WHERE username = ?'
    ).bind(username).run();
    
    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: '계정을 찾을 수 없습니다.' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: '계정이 성공적으로 삭제되었습니다.'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Delete account error:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

