import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sql = neon(process.env.DATABASE_URL);
  const { days = '30' } = req.query;
  const daysInt = Math.min(parseInt(days) || 30, 90);

  try {
    const searches = await sql`
      SELECT event_data->>'query' as query, COUNT(*) as count
      FROM events
      WHERE event_type = 'interest_search'
        AND created_at > NOW() - INTERVAL '${daysInt} days'
        AND event_data->>'query' IS NOT NULL
      GROUP BY event_data->>'query'
      ORDER BY count DESC
      LIMIT 20
    `;

    // Also get matched categories
    const matchedCategories = await sql`
      SELECT match_label, COUNT(*) as count FROM (
        SELECT jsonb_array_elements_text(event_data->'matches') as match_label
        FROM events
        WHERE event_type = 'interest_search'
          AND created_at > NOW() - INTERVAL '${daysInt} days'
          AND event_data->'matches' IS NOT NULL
      ) sub
      GROUP BY match_label
      ORDER BY count DESC
      LIMIT 15
    `;

    return res.status(200).json({ searches, matched_categories: matchedCategories });
  } catch (error) {
    console.error('Search terms error:', error);
    return res.status(500).json({ error: 'Failed to load search terms' });
  }
}
