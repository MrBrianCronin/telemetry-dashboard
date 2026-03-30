import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sql = neon(process.env.DATABASE_URL);
  const daysInt = Math.min(parseInt(req.query.days) || 30, 90);

  try {
    const funnel = await sql`
      SELECT 
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') as viewed,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'filter_applied') as filtered,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type IN ('etf_expanded', 'recommendation_viewed')) as explored,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type IN ('etf_added_to_package', 'deep_link_clicked')) as acted
      FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt})
    `;
    const carFunnel = await sql`
      SELECT 
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view' AND page = 'car-finder') as viewed,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'question_answered' AND page = 'car-finder') as started,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'questionnaire_completed' AND page = 'car-finder') as completed,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'deep_link_clicked' AND page = 'car-finder') as clicked_link
      FROM events WHERE created_at > NOW() - make_interval(days => ${daysInt})
    `;
    return res.status(200).json({
      etf_finder: { steps: [
        { label: 'Visited', count: parseInt(funnel[0].viewed) },
        { label: 'Applied Filters', count: parseInt(funnel[0].filtered) },
        { label: 'Explored ETFs', count: parseInt(funnel[0].explored) },
        { label: 'Added to Package', count: parseInt(funnel[0].acted) },
      ]},
      car_finder: { steps: [
        { label: 'Visited', count: parseInt(carFunnel[0].viewed) },
        { label: 'Started Questions', count: parseInt(carFunnel[0].started) },
        { label: 'Completed', count: parseInt(carFunnel[0].completed) },
        { label: 'Clicked Listing', count: parseInt(carFunnel[0].clicked_link) },
      ]},
    });
  } catch (error) {
    console.error('Funnel error:', error);
    return res.status(500).json({ error: 'Failed to load funnel' });
  }
}
