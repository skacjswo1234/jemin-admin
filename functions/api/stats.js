import { corsOptions, jsonResponse, requireAuth } from '../_shared/auth.js';

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context);
    if (auth.error) return auth.error;

    const { env } = context;

    const totalResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM properties'
    ).first();

    const statusResult = await env.DB.prepare(
      'SELECT status, COUNT(*) as count FROM properties GROUP BY status'
    ).all();

    const moveInResult = await env.DB.prepare(
      'SELECT moveIn, COUNT(*) as count FROM properties GROUP BY moveIn'
    ).all();

    const buildingResult = await env.DB.prepare(
      'SELECT buildingName, COUNT(*) as count FROM properties GROUP BY buildingName'
    ).all();

    const avgResult = await env.DB.prepare(
      'SELECT AVG(deposit) as avgDeposit, AVG(monthlyRent) as avgRent FROM properties'
    ).first();

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

    return jsonResponse(stats);
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestOptions() {
  return corsOptions('GET, OPTIONS');
}
