import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API_BASE = '/api/dashboard';

function useFetch(endpoint, days) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/${endpoint}?days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [endpoint, days]);
  return { data, loading };
}

function KPICard({ label, value, sub, color = '#4F6EF7' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '24px 20px', border: '1px solid #E2E6EF',
      display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0,
    }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: '#8792A8', letterSpacing: '.04em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: '#8792A8', fontFamily: "'DM Sans', sans-serif" }}>{sub}</span>}
    </div>
  );
}

function SectionTitle({ children, icon }) {
  return (
    <h2 style={{
      fontSize: 18, fontWeight: 700, color: '#1A1F36', fontFamily: "'Outfit', sans-serif",
      margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      {children}
    </h2>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E2E6EF', ...style,
    }}>
      {children}
    </div>
  );
}

function FunnelBar({ steps, color = '#4F6EF7' }) {
  if (!steps || steps.length === 0) return <p style={{ color: '#8792A8', fontSize: 13 }}>No data yet</p>;
  const max = Math.max(...steps.map(s => s.count), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {steps.map((step, i) => {
        const pct = max > 0 ? (step.count / max) * 100 : 0;
        const convPct = i > 0 && steps[i - 1].count > 0
          ? Math.round((step.count / steps[i - 1].count) * 100) : null;
        return (
          <div key={step.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#3C4257', fontFamily: "'DM Sans', sans-serif" }}>{step.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', fontFamily: "'JetBrains Mono', monospace" }}>
                {step.count}{convPct !== null && <span style={{ fontSize: 11, color: '#8792A8', marginLeft: 6 }}>({convPct}%)</span>}
              </span>
            </div>
            <div style={{ background: '#F0F1F5', borderRadius: 6, height: 10, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: 6,
                background: `linear-gradient(90deg, ${color}, ${color}88)`,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBarList({ items, color = '#4F6EF7', emptyText = 'No data yet' }) {
  if (!items || items.length === 0) return <p style={{ color: '#8792A8', fontSize: 13 }}>{emptyText}</p>;
  const max = Math.max(...items.map(i => parseInt(i.count)), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(item => {
        const pct = (parseInt(item.count) / max) * 100;
        return (
          <div key={item.ticker || item.value || item.query || item.category || item.match_label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', fontFamily: "'JetBrains Mono', monospace" }}>
                {item.ticker || item.value || item.query || item.category || item.match_label}
              </span>
              <span style={{ fontSize: 12, color: '#8792A8', fontFamily: "'JetBrains Mono', monospace" }}>{item.count}</span>
            </div>
            <div style={{ background: '#F0F1F5', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: 4,
                background: color, transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function App() {
  const [days, setDays] = useState(30);

  const { data: overview, loading: loadingOverview } = useFetch('overview', days);
  const { data: sessions, loading: loadingSessions } = useFetch('sessions', days);
  const { data: popular, loading: loadingPopular } = useFetch('popular', days);
  const { data: filters, loading: loadingFilters } = useFetch('filters', days);
  const { data: funnel, loading: loadingFunnel } = useFetch('funnel', days);
  const { data: searches, loading: loadingSearches } = useFetch('searches', days);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FAFBFD; font-family: 'DM Sans', sans-serif; color: #1A1F36; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .dash-card { animation: fadeIn 0.3s ease both; }
        .loading-pulse { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{
          background: '#fff', borderBottom: '1px solid #E2E6EF',
          padding: isMobile ? '14px 16px' : '20px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/" style={{
              fontSize: 12, color: '#8792A8', textDecoration: 'none', fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
            }}>← briancronin.ai</a>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: "'Outfit', sans-serif",
            }}>T</div>
            <div>
              <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1 }}>
                Telemetry Dashboard
              </h1>
              {!isMobile && <p style={{ fontSize: 12, color: '#8792A8', marginTop: 2 }}>User interaction analytics across briancronin.ai</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[7, 14, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: days === d ? '1.5px solid #10B981' : '1.5px solid #E2E6EF',
                background: days === d ? '#ECFDF5' : '#fff',
                color: days === d ? '#059669' : '#8792A8',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s ease',
              }}>
                {d}d
              </button>
            ))}
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, padding: isMobile ? 16 : 32, maxWidth: 1200, width: '100%', margin: '0 auto' }}>

          {/* KPI Cards */}
          <div className="dash-card" style={{
            display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)',
            gap: 16, marginBottom: 28,
          }}>
            {loadingOverview ? (
              <div className="loading-pulse" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#8792A8' }}>Loading...</div>
            ) : overview ? (
              <>
                <KPICard label="Sessions" value={overview.total_sessions} sub={`Last ${days} days`} color="#4F6EF7" />
                <KPICard label="Page Views" value={overview.page_views} color="#10B981" />
                <KPICard label="Events" value={overview.total_events} color="#8B5CF6" />
                <KPICard label="Avg Duration" value={formatDuration(overview.avg_session_seconds)} color="#F59E0B" />
                <KPICard label="Logged In" value={overview.logged_in_users} sub="Unique users" color="#EC4899" />
              </>
            ) : null}
          </div>

          {/* Sessions Over Time */}
          <Card style={{ marginBottom: 28 }} className="dash-card">
            <SectionTitle icon="📈">Sessions Over Time</SectionTitle>
            {loadingSessions ? (
              <div className="loading-pulse" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8792A8' }}>Loading chart...</div>
            ) : sessions?.daily?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={sessions.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F5" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8792A8' }} tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis tick={{ fontSize: 11, fill: '#8792A8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #E2E6EF', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                    labelFormatter={d => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  />
                  <Line type="monotone" dataKey="sessions" stroke="#4F6EF7" strokeWidth={2.5} dot={{ fill: '#4F6EF7', r: 3 }} name="Sessions" />
                  <Line type="monotone" dataKey="page_views" stroke="#10B981" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Page Views" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#8792A8', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>No session data for this period</p>
            )}
          </Card>

          {/* Two-column: Funnels */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 28 }}>
            <Card className="dash-card">
              <SectionTitle icon="🔎">ETF Finder Funnel</SectionTitle>
              {loadingFunnel ? <div className="loading-pulse" style={{ color: '#8792A8' }}>Loading...</div>
                : <FunnelBar steps={funnel?.etf_finder?.steps} color="#4F6EF7" />}
            </Card>
            <Card className="dash-card">
              <SectionTitle icon="🚗">Vehicle Assistant Funnel</SectionTitle>
              {loadingFunnel ? <div className="loading-pulse" style={{ color: '#8792A8' }}>Loading...</div>
                : <FunnelBar steps={funnel?.car_finder?.steps} color="#D4A574" />}
            </Card>
          </div>

          {/* Two-column: Popular ETFs */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 28 }}>
            <Card className="dash-card">
              <SectionTitle icon="👀">Most Viewed ETFs</SectionTitle>
              {loadingPopular ? <div className="loading-pulse" style={{ color: '#8792A8' }}>Loading...</div>
                : <HorizontalBarList items={popular?.most_expanded} color="#4F6EF7" emptyText="No ETF views recorded yet" />}
            </Card>
            <Card className="dash-card">
              <SectionTitle icon="📦">Most Added to Package</SectionTitle>
              {loadingPopular ? <div className="loading-pulse" style={{ color: '#8792A8' }}>Loading...</div>
                : <HorizontalBarList items={popular?.most_added} color="#10B981" emptyText="No package additions yet" />}
            </Card>
          </div>

          {/* Filter Usage */}
          <Card style={{ marginBottom: 28 }} className="dash-card">
            <SectionTitle icon="⚙️">Filter Usage</SectionTitle>
            {loadingFilters ? (
              <div className="loading-pulse" style={{ color: '#8792A8' }}>Loading...</div>
            ) : filters?.categories?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
                {filters.categories.map(cat => (
                  <div key={cat.category}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: '#3C4257', marginBottom: 8,
                      fontFamily: "'DM Sans', sans-serif", textTransform: 'capitalize',
                    }}>
                      {cat.category} <span style={{ color: '#8792A8', fontWeight: 400 }}>({cat.count})</span>
                    </div>
                    <HorizontalBarList items={cat.top_values} color="#8B5CF6" emptyText="" />
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#8792A8', fontSize: 13 }}>No filter usage recorded yet</p>
            )}
          </Card>

          {/* Two-column: Searches + App Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 28 }}>
            <Card className="dash-card">
              <SectionTitle icon="🔍">Search Terms</SectionTitle>
              {loadingSearches ? <div className="loading-pulse" style={{ color: '#8792A8' }}>Loading...</div>
                : <HorizontalBarList items={searches?.searches} color="#F59E0B" emptyText="No searches recorded yet" />}
            </Card>
            <Card className="dash-card">
              <SectionTitle icon="📊">Events by App</SectionTitle>
              {loadingOverview ? <div className="loading-pulse" style={{ color: '#8792A8' }}>Loading...</div>
                : overview?.by_app?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {overview.by_app.map(app => (
                      <div key={app.page} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', background: '#FAFBFD', borderRadius: 10, border: '1px solid #E2E6EF',
                      }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1F36', fontFamily: "'DM Sans', sans-serif" }}>{app.page}</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#4F6EF7', fontFamily: "'JetBrains Mono', monospace" }}>{app.events} events</div>
                          <div style={{ fontSize: 11, color: '#8792A8' }}>{app.sessions} sessions</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ color: '#8792A8', fontSize: 13 }}>No data yet</p>}
            </Card>
          </div>

        </main>

        {/* Footer */}
        <footer style={{
          background: '#fff', borderTop: '1px solid #E2E6EF', padding: '16px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 12, color: '#8792A8', fontFamily: "'DM Sans', sans-serif",
        }}>
          <span>Telemetry Dashboard · <a href="/" style={{ color: '#4F6EF7', textDecoration: 'none' }}>briancronin.ai</a></span>
          <span>Aggregate data only · No personally identifiable information displayed</span>
        </footer>
      </div>
    </>
  );
}
