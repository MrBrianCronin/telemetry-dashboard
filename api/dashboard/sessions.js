import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sql = neon(process.env.DATABASE_URL);
  const daysInt = Math.min(parseInt(req.query.days) || 30, 90);
  const app = req.query.app || null;

  try {
    const daily = app
      ? await sql`
          SELECT DATE(created_at) as date, COUNT(DISTINCT session_id) as sessions,
            COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views, COUNT(*) as total_events
          FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt}) AND page = ${app}
          GROUP BY DATE(created_at) ORDER BY date ASC
        `
      : await sql`
          SELECT DATE(created_at) as date, COUNT(DISTINCT session_id) as sessions,
            COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views, COUNT(*) as total_events
          FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt})
          GROUP BY DATE(created_at) ORDER BY date ASC
        `;
    return res.status(200).json({ daily });
  } catch (error) {
    console.error('Sessions error:', error);
    return res.status(500).json({ error: 'Failed to load sessions' });
  }
}
