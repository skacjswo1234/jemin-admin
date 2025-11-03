// GET: 통계 데이터 조회
export async function onRequestGet(context) {
  try {
    const { env } = context;
    
    // 전체 매물 수
    const totalResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM properties'
    ).first();
    
    // 상태별 집계
    const statusResult = await env.DB.prepare(
      'SELECT status, COUNT(*) as count FROM properties GROUP BY status'
    ).all();
    
    // 전입유무별 집계
    const moveInResult = await env.DB.prepare(
      'SELECT moveIn, COUNT(*) as count FROM properties GROUP BY moveIn'
    ).all();
    
    // 건물별 집계
    const buildingResult = await env.DB.prepare(
      'SELECT buildingName, COUNT(*) as count FROM properties GROUP BY buildingName'
    ).all();
    
    // 평균 보증금/월세
    const avgResult = await env.DB.prepare(
      'SELECT AVG(deposit) as avgDeposit, AVG(monthlyRent) as avgRent FROM properties'
    ).first();
    
    // 월세 수익 (임대중인 매물)
    const revenueResult = await env.DB.prepare(
      'SELECT SUM(monthlyRent) as totalRevenue FROM properties WHERE status = ?'
    ).bind('임대중').first();
    
    const stats = {
      total: totalResult.count,
      byStatus: statusResult.results.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {}),
      byMoveIn: moveInResult.results.reduce((acc, item) => {
        acc[item.moveIn] = item.count;
        return acc;
      }, {}),
      byBuilding: buildingResult.results.reduce((acc, item) => {
        acc[item.buildingName] = item.count;
        return acc;
      }, {}),
      avgDeposit: Math.round(avgResult.avgDeposit || 0),
      avgRent: Math.round(avgResult.avgRent || 0),
      totalRevenue: revenueResult.totalRevenue || 0
    };
    
    return new Response(JSON.stringify(stats), {
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

