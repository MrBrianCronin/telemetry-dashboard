import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sql = neon(process.env.DATABASE_URL);
  const daysInt = Math.min(parseInt(req.query.days) || 30, 90);
  const app = req.query.app || null;

  try {
    const filterEvents = app
      ? await sql`SELECT event_data->'filters' as filters FROM events WHERE event_type = 'filter_applied' AND created_at > NOW() - make_interval(days => ${daysInt}) AND page = ${app}`
      : await sql`SELECT event_data->'filters' as filters FROM events WHERE event_type = 'filter_applied' AND created_at > NOW() - make_interval(days => ${daysInt})`;

    const categoryCounts = {};
    const valueCounts = {};
    for (const row of filterEvents) {
      const filters = row.filters;
      if (!filters || typeof filters !== 'object') continue;
      for (const [category, value] of Object.entries(filters)) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        if (!valueCounts[category]) valueCounts[category] = {};
        if (Array.isArray(value)) {
          for (const v of value) { valueCounts[category][v] = (valueCounts[category][v] || 0) + 1; }
        } else if (typeof value === 'string') {
          valueCounts[category][value] = (valueCounts[category][value] || 0) + 1;
        } else if (typeof value === 'boolean') {
          valueCounts[category][String(value)] = (valueCounts[category][String(value)] || 0) + 1;
        }
      }
    }
    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({
        category, count,
        top_values: Object.entries(valueCounts[category] || {})
          .sort((a, b) => b[1] - a[1]).slice(0, 8)
          .map(([value, cnt]) => ({ value, count: cnt })),
      }));
    return res.status(200).json({ total_filter_events: filterEvents.length, categories: sortedCategories });
  } catch (error) {
    console.error('Filters error:', error);
    return res.status(500).json({ error: 'Failed to load filter data' });
  }
}
