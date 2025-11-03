// POST: 비밀번호 변경
export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const { username, currentPassword, newPassword } = await request.json();
    
    if (!username || !currentPassword || !newPassword) {
      return new Response(JSON.stringify({ error: '모든 필드를 입력하세요.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    if (newPassword.length < 4) {
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
    
    // 비밀번호 업데이트
    await env.DB.prepare(
      'UPDATE admins SET password = ? WHERE username = ?'
    ).bind(newPassword, username).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
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

