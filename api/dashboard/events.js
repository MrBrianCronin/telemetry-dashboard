import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sql = neon(process.env.DATABASE_URL);
  const daysInt = Math.min(parseInt(req.query.days) || 30, 90);
  const app = req.query.app || null;

  try {
    const breakdown = app
      ? await sql`
          SELECT event_type, COUNT(*) as count
          FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt}) AND page = ${app}
            AND event_type != 'session_heartbeat'
          GROUP BY event_type ORDER BY count DESC
        `
      : await sql`
          SELECT event_type, COUNT(*) as count
          FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt})
            AND event_type != 'session_heartbeat'
          GROUP BY event_type ORDER BY count DESC
        `;

    // Recent sessions summary
    const recentSessions = app
      ? await sql`
          SELECT session_id, page, MIN(created_at) as started, MAX(created_at) as ended,
            COUNT(*) as event_count,
            EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as duration_seconds,
            CASE WHEN MAX(user_id) IS NOT NULL THEN true ELSE false END as logged_in
          FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt}) AND page = ${app}
          GROUP BY session_id, page HAVING COUNT(*) > 1
          ORDER BY started DESC LIMIT 20
        `
      : await sql`
          SELECT session_id, page, MIN(created_at) as started, MAX(created_at) as ended,
            COUNT(*) as event_count,
            EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as duration_seconds,
            CASE WHEN MAX(user_id) IS NOT NULL THEN true ELSE false END as logged_in
          FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt})
          GROUP BY session_id, page HAVING COUNT(*) > 1
          ORDER BY started DESC LIMIT 20
        `;

    // Anonymize session IDs — only show first 8 chars
    const anonymized = recentSessions.map(s => ({
      ...s,
      session_id: s.session_id.substring(0, 8) + '...',
      duration_seconds: Math.round(parseFloat(s.duration_seconds)),
    }));

    return res.status(200).json({ event_breakdown: breakdown, recent_sessions: anonymized });
  } catch (error) {
    console.error('Events error:', error);
    return res.status(500).json({ error: 'Failed to load events' });
  }
}
