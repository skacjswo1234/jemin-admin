// POST: 비밀번호 및 성명 변경
export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const { username, currentPassword, newPassword, name } = await request.json();
    
    if (!username || !currentPassword) {
      return new Response(JSON.stringify({ error: '아이디와 현재 비밀번호를 입력하세요.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 새 비밀번호가 있는 경우 길이 체크
    if (newPassword && newPassword.length < 4) {
      return new Response(JSON.stringify({ error: '새 비밀번호는 4자 이상이어야 합니다.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 현재 비밀번호 확인
    const { results } = await env.DB.prepare(
      'SELECT * FROM admins WHERE username = ? AND password = ?'
    ).bind(username, currentPassword).all();
    
    if (results.length === 0) {
      return new Response(JSON.stringify({ error: '현재 비밀번호가 올바르지 않습니다.' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 업데이트할 필드 결정
    let updateQuery = 'UPDATE admins SET ';
    let params = [];
    let updates = [];
    
    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    
    if (newPassword) {
      updates.push('password = ?');
      params.push(newPassword);
    }
    
    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: '변경할 내용이 없습니다.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    updateQuery += updates.join(', ') + ' WHERE username = ?';
    params.push(username);
    
    // 정보 업데이트
    await env.DB.prepare(updateQuery).bind(...params).run();
    
    // 변경된 정보 조회
    const { results: updatedResults } = await env.DB.prepare(
      'SELECT username, name FROM admins WHERE username = ?'
    ).bind(username).all();
    
    return new Response(JSON.stringify({ 
      success: true,
      name: updatedResults[0].name,
      message: '정보가 성공적으로 변경되었습니다.'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

