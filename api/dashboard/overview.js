import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sql = neon(process.env.DATABASE_URL);
  const daysInt = Math.min(parseInt(req.query.days) || 30, 90);
  const app = req.query.app || null;

  try {
    let totalEvents, totalSessions, pageViews, loggedInUsers, avgDuration, byApp;

    if (app) {
      [totalEvents] = await sql`SELECT COUNT(*) as count FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt}) AND page = ${app}`;
      [totalSessions] = await sql`SELECT COUNT(DISTINCT session_id) as count FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt}) AND page = ${app}`;
      [pageViews] = await sql`SELECT COUNT(*) as count FROM events WHERE event_type = 'page_view' AND created_at > NOW() - make_interval(days => ${daysInt}) AND page = ${app}`;
      [loggedInUsers] = await sql`SELECT COUNT(DISTINCT user_id) as count FROM events WHERE user_id IS NOT NULL AND created_at > NOW() - make_interval(days => ${daysInt}) AND page = ${app}`;
      avgDuration = await sql`
        SELECT COALESCE(AVG(duration), 0) as avg_seconds FROM (
          SELECT session_id, EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as duration
          FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt}) AND page = ${app}
          GROUP BY session_id HAVING COUNT(*) > 1
        ) sub
      `;
      byApp = await sql`
        SELECT page, COUNT(*) as events, COUNT(DISTINCT session_id) as sessions
        FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt}) AND page = ${app}
        GROUP BY page ORDER BY events DESC
      `;
    } else {
      [totalEvents] = await sql`SELECT COUNT(*) as count FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt})`;
      [totalSessions] = await sql`SELECT COUNT(DISTINCT session_id) as count FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt})`;
      [pageViews] = await sql`SELECT COUNT(*) as count FROM events WHERE event_type = 'page_view' AND created_at > NOW() - make_interval(days => ${daysInt})`;
      [loggedInUsers] = await sql`SELECT COUNT(DISTINCT user_id) as count FROM events WHERE user_id IS NOT NULL AND created_at > NOW() - make_interval(days => ${daysInt})`;
      avgDuration = await sql`
        SELECT COALESCE(AVG(duration), 0) as avg_seconds FROM (
          SELECT session_id, EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as duration
          FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt})
          GROUP BY session_id HAVING COUNT(*) > 1
        ) sub
      `;
      byApp = await sql`
        SELECT page, COUNT(*) as events, COUNT(DISTINCT session_id) as sessions
        FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt})
        GROUP BY page ORDER BY events DESC
      `;
    }

    return res.status(200).json({
      total_events: parseInt(totalEvents.count),
      total_sessions: parseInt(totalSessions.count),
      page_views: parseInt(pageViews.count),
      logged_in_users: parseInt(loggedInUsers.count),
      avg_session_seconds: Math.round(parseFloat(avgDuration[0].avg_seconds)),
      by_app: byApp,
      period_days: daysInt,
    });
  } catch (error) {
    console.error('Overview error:', error);
    return res.status(500).json({ error: 'Failed to load overview' });
  }
}
