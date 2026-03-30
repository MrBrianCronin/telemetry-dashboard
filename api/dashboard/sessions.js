import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sql = neon(process.env.DATABASE_URL);
  const { days = '30' } = req.query;
  const daysInt = Math.min(parseInt(days) || 30, 90);

  try {
    const daily = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views,
        COUNT(*) as total_events
      FROM events
      WHERE created_at > NOW() - INTERVAL '${daysInt} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return res.status(200).json({ daily });
  } catch (error) {
    console.error('Sessions over time error:', error);
    return res.status(500).json({ error: 'Failed to load sessions' });
  }
}
