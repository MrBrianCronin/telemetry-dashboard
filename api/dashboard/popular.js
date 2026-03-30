import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sql = neon(process.env.DATABASE_URL);
  const { days = '30' } = req.query;
  const daysInt = Math.min(parseInt(days) || 30, 90);

  try {
    const mostExpanded = await sql`
      SELECT event_data->>'ticker' as ticker, COUNT(*) as count
      FROM events
      WHERE event_type = 'etf_expanded'
        AND created_at > NOW() - INTERVAL '${daysInt} days'
        AND event_data->>'ticker' IS NOT NULL
      GROUP BY event_data->>'ticker'
      ORDER BY count DESC
      LIMIT 15
    `;

    const mostAdded = await sql`
      SELECT event_data->>'ticker' as ticker, COUNT(*) as count
      FROM events
      WHERE event_type = 'etf_added_to_package'
        AND created_at > NOW() - INTERVAL '${daysInt} days'
        AND event_data->>'ticker' IS NOT NULL
      GROUP BY event_data->>'ticker'
      ORDER BY count DESC
      LIMIT 15
    `;

    return res.status(200).json({ most_expanded: mostExpanded, most_added: mostAdded });
  } catch (error) {
    console.error('Popular ETFs error:', error);
    return res.status(500).json({ error: 'Failed to load popular ETFs' });
  }
}
