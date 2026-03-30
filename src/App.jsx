import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const API_BASE = 'https://telemetry-dashboard-six.vercel.app/api/dashboard';

function useFetch(endpoint, days, app) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  const refetch = useCallback(() => setKey(k => k + 1), []);
  useEffect(() => {
    setLoading(true);
    const appParam = app ? `&app=${app}` : '';
    fetch(`${API_BASE}/${endpoint}?days=${days}${appParam}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [endpoint, days, app, key]);
  return { data, loading, refetch };
}

function SkeletonBlock({ width = '100%', height = 16 }) {
  return <div className="skeleton-pulse" style={{ width, height, borderRadius: 6 }} />;
}
function SkeletonKPI() {
  return (<div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', border: '1px solid #E2E6EF', display: 'flex', flexDirection: 'column', gap: 8 }}><SkeletonBlock width={80} height={12} /><SkeletonBlock width={60} height={32} /><SkeletonBlock width={90} height={12} /></div>);
}
function SkeletonChart() {
  return (<div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200, padding: '20px 0' }}>{[40,65,45,80,55,70,50,85,60,75,45,90].map((h,i) => (<div key={i} className="skeleton-pulse" style={{ flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0', animationDelay: `${i*.05}s` }} />))}</div>);
}
function SkeletonBars({ count = 5 }) {
  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{Array.from({length:count}).map((_,i) => (<div key={i}><div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><SkeletonBlock width={80+Math.random()*60} height={13} /><SkeletonBlock width={30} height={13} /></div><SkeletonBlock height={6} width={`${90-i*15}%`} /></div>))}</div>);
}

function KPICard({ label, value, sub, color = '#4F6EF7' }) {
  return (<div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', border: '1px solid #E2E6EF', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
    <span style={{ fontSize: 12, fontWeight: 500, color: '#8792A8', letterSpacing: '.04em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
    <span style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1 }}>{value}</span>
    {sub && <span style={{ fontSize: 12, color: '#8792A8', fontFamily: "'DM Sans', sans-serif" }}>{sub}</span>}
  </div>);
}

function SectionTitle({ children, icon }) {
  return (<h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1F36', fontFamily: "'Outfit', sans-serif", margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>{icon && <span style={{ fontSize: 20 }}>{icon}</span>}{children}</h2>);
}

function Card({ children, style }) {
  return <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E2E6EF', ...style }}>{children}</div>;
}

function FunnelBar({ steps, color = '#4F6EF7' }) {
  if (!steps || steps.length === 0) return <p style={{ color: '#8792A8', fontSize: 13 }}>No data yet</p>;
  const max = Math.max(...steps.map(s => s.count), 1);
  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{steps.map((step, i) => {
    const pct = max > 0 ? (step.count / max) * 100 : 0;
    const convPct = i > 0 && steps[i-1].count > 0 ? Math.round((step.count / steps[i-1].count) * 100) : null;
    return (<div key={step.label}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: '#3C4257' }}>{step.label}</span><span style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', fontFamily: "'JetBrains Mono', monospace" }}>{step.count}{convPct !== null && <span style={{ fontSize: 11, color: '#8792A8', marginLeft: 6 }}>({convPct}%)</span>}</span></div><div style={{ background: '#F0F1F5', borderRadius: 6, height: 10, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${color}, ${color}88)`, transition: 'width 0.6s ease' }} /></div></div>);
  })}</div>);
}

function HorizontalBarList({ items, color = '#4F6EF7', emptyText = 'No data yet' }) {
  if (!items || items.length === 0) return <p style={{ color: '#8792A8', fontSize: 13 }}>{emptyText}</p>;
  const max = Math.max(...items.map(i => parseInt(i.count)), 1);
  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{items.map(item => {
    const label = item.ticker || item.value || item.query || item.category || item.match_label;
    const pct = (parseInt(item.count) / max) * 100;
    return (<div key={label}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span><span style={{ fontSize: 12, color: '#8792A8', fontFamily: "'JetBrains Mono', monospace" }}>{item.count}</span></div><div style={{ background: '#F0F1F5', borderRadius: 4, height: 6, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: color, transition: 'width 0.6s ease' }} /></div></div>);
  })}</div>);
}

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds/60)}m ${seconds%60}s`;
}

const EC = { page_view:'#10B981', filter_applied:'#8B5CF6', etf_expanded:'#4F6EF7', etf_collapsed:'#93A3B8', etf_added_to_package:'#059669', etf_removed_from_package:'#DC2626', interest_search:'#F59E0B', sort_changed:'#6366F1', sidebar_toggled:'#8792A8', disclosure_opened:'#EC4899', question_answered:'#D4A574', stage_completed:'#C49060', questionnaire_completed:'#10B981', recommendation_viewed:'#4F6EF7', deep_link_clicked:'#F97316', package_cleared:'#EF4444', filter_cleared:'#9CA3AF', page_changed:'#6B7280', questionnaire_restarted:'#F59E0B' };
const APP_OPTIONS = [{ key: null, label: 'All Apps', icon: '📊' }, { key: 'etf-finder', label: 'ETF Finder', icon: '🔎' }, { key: 'car-finder', label: 'Vehicle Assistant', icon: '🚗' }];

export default function App() {
  const [days, setDays] = useState(30);
  const [appFilter, setAppFilter] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const { data: overview, loading: lo, refetch: ro } = useFetch('overview', days, appFilter);
  const { data: sessions, loading: ls, refetch: rs } = useFetch('sessions', days, appFilter);
  const { data: popular, loading: lp } = useFetch('popular', days, appFilter);
  const { data: filters, loading: lf } = useFetch('filters', days, appFilter);
  const { data: funnel, loading: lfu } = useFetch('funnel', days, appFilter);
  const { data: searches, loading: lse } = useFetch('searches', days, appFilter);
  const { data: events, loading: le } = useFetch('events', days, appFilter);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => { ro(); rs(); }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, ro, rs]);

  return (<>
    <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#FAFBFD;font-family:'DM Sans',sans-serif;color:#1A1F36}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}.skeleton-pulse{background:linear-gradient(90deg,#E8EBF0 25%,#F0F2F5 50%,#E8EBF0 75%);background-size:200% 100%;animation:shimmer 1.8s ease-in-out infinite}.dash-section{animation:fadeUp .35s ease both}.session-row:hover{background:#F8F9FC!important}`}</style>
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ background:'#fff', borderBottom:'1px solid #E2E6EF', padding: isMobile?'14px 16px':'20px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <a href="/" style={{ fontSize:12, color:'#8792A8', textDecoration:'none', fontWeight:500, marginRight:4 }}>← briancronin.ai</a>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#10B981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:15, fontFamily:"'Outfit',sans-serif" }}>T</div>
          <div>
            <h1 style={{ fontSize: isMobile?16:20, fontWeight:700, fontFamily:"'Outfit',sans-serif", lineHeight:1.1 }}>Telemetry Dashboard</h1>
            {!isMobile && <p style={{ fontSize:12, color:'#8792A8', marginTop:2 }}>User interaction analytics across briancronin.ai</p>}
          </div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={() => setAutoRefresh(a => !a)} style={{ padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:600, border: autoRefresh?'1.5px solid #10B981':'1.5px solid #E2E6EF', background: autoRefresh?'#ECFDF5':'#fff', color: autoRefresh?'#059669':'#8792A8', cursor:'pointer' }}>{autoRefresh ? '⟳ Live' : '⟳ Auto'}</button>
          <div style={{ width:1, height:20, background:'#E2E6EF' }} />
          {[7,14,30,90].map(d => (<button key={d} onClick={() => setDays(d)} style={{ padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:600, border: days===d?'1.5px solid #10B981':'1.5px solid #E2E6EF', background: days===d?'#ECFDF5':'#fff', color: days===d?'#059669':'#8792A8', cursor:'pointer' }}>{d}d</button>))}
        </div>
      </header>

      {/* App Filter */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E2E6EF', padding: isMobile?'8px 16px':'10px 32px', display:'flex', gap:8, alignItems:'center' }}>
        <span style={{ fontSize:12, color:'#8792A8', fontWeight:500, marginRight:4 }}>Filter by app:</span>
        {APP_OPTIONS.map(opt => (<button key={opt.label} onClick={() => setAppFilter(opt.key)} style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600, border: appFilter===opt.key?'1.5px solid #4F6EF7':'1.5px solid #E2E6EF', background: appFilter===opt.key?'#EEF1FE':'#fff', color: appFilter===opt.key?'#4F6EF7':'#8792A8', cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}><span style={{ fontSize:13 }}>{opt.icon}</span> {opt.label}</button>))}
      </div>

      <main style={{ flex:1, padding: isMobile?16:32, maxWidth:1200, width:'100%', margin:'0 auto' }}>

        {/* KPIs */}
        <div className="dash-section" style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(5,1fr)', gap:16, marginBottom:28 }}>
          {lo ? <><SkeletonKPI/><SkeletonKPI/><SkeletonKPI/><SkeletonKPI/><SkeletonKPI/></> : overview ? <>
            <KPICard label="Sessions" value={overview.total_sessions} sub={`Last ${days} days`} color="#4F6EF7" />
            <KPICard label="Page Views" value={overview.page_views} color="#10B981" />
            <KPICard label="Events" value={overview.total_events} color="#8B5CF6" />
            <KPICard label="Avg Duration" value={formatDuration(overview.avg_session_seconds)} color="#F59E0B" />
            <KPICard label="Logged In" value={overview.logged_in_users} sub="Unique users" color="#EC4899" />
          </> : null}
        </div>

        {/* Sessions Chart */}
        <Card style={{ marginBottom:28 }}>
          <SectionTitle icon="📈">Sessions Over Time</SectionTitle>
          {ls ? <SkeletonChart /> : sessions?.daily?.length > 0 ? (
            <div className="dash-section"><ResponsiveContainer width="100%" height={250}><LineChart data={sessions.daily}><CartesianGrid strokeDasharray="3 3" stroke="#F0F1F5" /><XAxis dataKey="date" tick={{ fontSize:11, fill:'#8792A8' }} tickFormatter={d => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'})} /><YAxis tick={{ fontSize:11, fill:'#8792A8' }} allowDecimals={false} /><Tooltip contentStyle={{ borderRadius:10, border:'1px solid #E2E6EF', fontSize:12 }} labelFormatter={d => new Date(d).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})} /><Line type="monotone" dataKey="sessions" stroke="#4F6EF7" strokeWidth={2.5} dot={{ fill:'#4F6EF7', r:3 }} name="Sessions" /><Line type="monotone" dataKey="page_views" stroke="#10B981" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Page Views" /></LineChart></ResponsiveContainer></div>
          ) : <p style={{ color:'#8792A8', fontSize:13, padding:'40px 0', textAlign:'center' }}>No session data for this period</p>}
        </Card>

        {/* Event Breakdown + App Cards */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'2fr 1fr', gap:20, marginBottom:28 }}>
          <Card className="dash-section">
            <SectionTitle icon="📋">Event Type Breakdown</SectionTitle>
            {le ? <SkeletonChart /> : events?.event_breakdown?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}><BarChart data={events.event_breakdown.slice(0,12)} layout="vertical" margin={{ left:120 }}><CartesianGrid strokeDasharray="3 3" stroke="#F0F1F5" horizontal={false} /><XAxis type="number" tick={{ fontSize:11, fill:'#8792A8' }} /><YAxis type="category" dataKey="event_type" tick={{ fontSize:11, fill:'#3C4257', fontFamily:"'JetBrains Mono',monospace" }} width={115} /><Tooltip contentStyle={{ borderRadius:10, border:'1px solid #E2E6EF', fontSize:12 }} /><Bar dataKey="count" radius={[0,4,4,0]} name="Events">{events.event_breakdown.slice(0,12).map((e,i) => <Cell key={i} fill={EC[e.event_type]||'#8792A8'} />)}</Bar></BarChart></ResponsiveContainer>
            ) : <p style={{ color:'#8792A8', fontSize:13 }}>No events yet</p>}
          </Card>
          <Card className="dash-section">
            <SectionTitle icon="📊">Events by App</SectionTitle>
            {lo ? <SkeletonBars count={2} /> : overview?.by_app?.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{overview.by_app.map(app => (
                <div key={app.page} onClick={() => setAppFilter(appFilter===app.page?null:app.page)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', background: appFilter===app.page?'#EEF1FE':'#FAFBFD', borderRadius:10, border: appFilter===app.page?'1.5px solid #4F6EF7':'1px solid #E2E6EF', cursor:'pointer', transition:'all .15s' }}>
                  <span style={{ fontSize:14, fontWeight:600, color:'#1A1F36' }}>{app.page}</span>
                  <div style={{ textAlign:'right' }}><div style={{ fontSize:14, fontWeight:700, color:'#4F6EF7', fontFamily:"'JetBrains Mono',monospace" }}>{app.events} events</div><div style={{ fontSize:11, color:'#8792A8' }}>{app.sessions} sessions</div></div>
                </div>
              ))}</div>
            ) : <p style={{ color:'#8792A8', fontSize:13 }}>No data yet</p>}
          </Card>
        </div>

        {/* Funnels */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:20, marginBottom:28 }}>
          <Card className="dash-section"><SectionTitle icon="🔎">ETF Finder Funnel</SectionTitle>{lfu ? <SkeletonBars count={4} /> : <FunnelBar steps={funnel?.etf_finder?.steps} color="#4F6EF7" />}</Card>
          <Card className="dash-section"><SectionTitle icon="🚗">Vehicle Assistant Funnel</SectionTitle>{lfu ? <SkeletonBars count={4} /> : <FunnelBar steps={funnel?.car_finder?.steps} color="#D4A574" />}</Card>
        </div>

        {/* Popular ETFs */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:20, marginBottom:28 }}>
          <Card className="dash-section"><SectionTitle icon="👀">Most Viewed ETFs</SectionTitle>{lp ? <SkeletonBars count={5} /> : <HorizontalBarList items={popular?.most_expanded} color="#4F6EF7" emptyText="No ETF views recorded yet" />}</Card>
          <Card className="dash-section"><SectionTitle icon="📦">Most Added to Package</SectionTitle>{lp ? <SkeletonBars count={5} /> : <HorizontalBarList items={popular?.most_added} color="#10B981" emptyText="No package additions yet" />}</Card>
        </div>

        {/* Filter Usage */}
        <Card style={{ marginBottom:28 }}>
          <SectionTitle icon="⚙️">Filter Usage</SectionTitle>
          {lf ? (<div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap:20 }}><SkeletonBars count={4} /><SkeletonBars count={4} /><SkeletonBars count={4} /></div>
          ) : filters?.categories?.length > 0 ? (
            <div className="dash-section" style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap:20 }}>{filters.categories.map(cat => (
              <div key={cat.category}><div style={{ fontSize:13, fontWeight:600, color:'#3C4257', marginBottom:8, textTransform:'capitalize' }}>{cat.category} <span style={{ color:'#8792A8', fontWeight:400 }}>({cat.count})</span></div><HorizontalBarList items={cat.top_values} color="#8B5CF6" emptyText="" /></div>
            ))}</div>
          ) : <p style={{ color:'#8792A8', fontSize:13 }}>No filter usage recorded yet</p>}
        </Card>

        {/* Searches */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:20, marginBottom:28 }}>
          <Card className="dash-section"><SectionTitle icon="🔍">Search Terms</SectionTitle>{lse ? <SkeletonBars count={5} /> : <HorizontalBarList items={searches?.searches} color="#F59E0B" emptyText="No searches recorded yet" />}</Card>
          <Card className="dash-section"><SectionTitle icon="🏷️">Matched Categories</SectionTitle>{lse ? <SkeletonBars count={5} /> : <HorizontalBarList items={searches?.matched_categories} color="#D4A574" emptyText="No matched categories yet" />}</Card>
        </div>

        {/* Recent Sessions */}
        <Card style={{ marginBottom:28 }}>
          <SectionTitle icon="📋">Recent Sessions</SectionTitle>
          {le ? <SkeletonBars count={6} /> : events?.recent_sessions?.length > 0 ? (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead><tr style={{ borderBottom:'2px solid #E2E6EF' }}>{['Session','App','Started','Duration','Events','Auth'].map(h => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:'#8792A8', fontWeight:600, fontSize:11, letterSpacing:'.04em', textTransform:'uppercase' }}>{h}</th>
                ))}</tr></thead>
                <tbody>{events.recent_sessions.map((s,i) => (
                  <tr key={i} className="session-row" style={{ borderBottom:'1px solid #F0F1F5' }}>
                    <td style={{ padding:'10px 12px', fontFamily:"'JetBrains Mono',monospace", color:'#3C4257' }}>{s.session_id}</td>
                    <td style={{ padding:'10px 12px' }}><span style={{ padding:'2px 10px', borderRadius:12, fontSize:11, fontWeight:600, background: s.page==='etf-finder'?'#EEF1FE':'#FFF7ED', color: s.page==='etf-finder'?'#4F6EF7':'#D4A574' }}>{s.page}</span></td>
                    <td style={{ padding:'10px 12px', color:'#8792A8' }}>{new Date(s.started).toLocaleDateString('en-US',{month:'short',day:'numeric'})} {new Date(s.started).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</td>
                    <td style={{ padding:'10px 12px', fontFamily:"'JetBrains Mono',monospace", color:'#3C4257' }}>{formatDuration(s.duration_seconds)}</td>
                    <td style={{ padding:'10px 12px', fontFamily:"'JetBrains Mono',monospace", fontWeight:600, color:'#1A1F36' }}>{s.event_count}</td>
                    <td style={{ padding:'10px 12px' }}>{s.logged_in ? <span style={{ color:'#10B981', fontSize:14 }}>●</span> : <span style={{ color:'#E2E6EF', fontSize:14 }}>○</span>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p style={{ color:'#8792A8', fontSize:13 }}>No sessions recorded yet</p>}
        </Card>

      </main>

      <footer style={{ background:'#fff', borderTop:'1px solid #E2E6EF', padding: isMobile?'12px 16px':'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8, fontSize:12, color:'#8792A8' }}>
        <span>Telemetry Dashboard · <a href="/" style={{ color:'#4F6EF7', textDecoration:'none' }}>briancronin.ai</a></span>
        <span>Aggregate data only · No personally identifiable information displayed</span>
      </footer>
    </div>
  </>);
}
