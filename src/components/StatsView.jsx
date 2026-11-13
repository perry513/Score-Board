import { useMemo, useState } from 'react';
import { formatDelta } from '../lib/scoring';

const COLORS = ['#f6c453', '#5ec8ff', '#ff7a8a', '#7be495', '#c29bff', '#ffa25e', '#4fd1c5', '#f687b3'];
const W = 900;
const H = 300;
const PAD_X = 44;
const PAD_Y = 22;

export default function StatsView({ rule, games, players, seats }) {
  const [rate, setRate] = useState('1');
  const [hoverRound, setHoverRound] = useState(null);
  const isMahjong = rule === 'mahjong';

  const rows = useMemo(() => {
    const playedIds = new Set(games.flatMap(g => Object.keys(g.scores || {})));
    const list = [...seats, ...players.filter(p => playedIds.has(p.id) && !seats.some(s => s.id === p.id))];
    return list.map((p, idx) => {
      let cumulative = 0;
      const r = { id: p.id, name: p.name, color: COLORS[idx % COLORS.length], wins: 0, losses: 0, self: 0, fed: 0, played: 0, best: 0, worst: 0, series: [] };
      games.forEach((g, i) => {
        const played = g.scores && p.id in g.scores;
        const d = played ? Number(g.scores[p.id] || 0) : 0;
        if (played) {
          r.played += 1;
          if (d > 0) { r.wins += 1; if (g.selfPick) r.self += 1; }
          if (d < 0) { r.losses += 1; if (isMahjong && !g.selfPick) r.fed += 1; }
          r.best = Math.max(r.best, d);
          r.worst = Math.min(r.worst, d);
        }
        cumulative += d;
        r.series.push({ x: i + 1, y: cumulative, d, played });
      });
      r.total = cumulative;
      return r;
    }).sort((a, b) => b.total - a.total);
  }, [games, players, seats, isMahjong]);

  if (games.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">📊</div>
        <div>Stats appear after the first {isMahjong ? 'hand' : 'round'}.</div>
      </div>
    );
  }

  const n = games.length;
  const ys = rows.flatMap(r => r.series.map(p => p.y));
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(0, ...ys);
  const toX = x => (n <= 1 ? W / 2 : PAD_X + ((x - 1) / (n - 1)) * (W - PAD_X * 2));
  const toY = y => PAD_Y + ((maxY - y) / Math.max(1, maxY - minY)) * (H - PAD_Y * 2);
  const selected = hoverRound ?? n;
  const rateNum = Number(rate);
  const selfCount = games.filter(g => g.selfPick && !g.draw).length;
  const drawCount = games.filter(g => g.draw).length;

  const onMove = e => {
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const x = pt.matrixTransform(ctm.inverse()).x;
    const round = n <= 1 ? 1 : Math.round(((x - PAD_X) / (W - PAD_X * 2)) * (n - 1) + 1);
    setHoverRound(Math.max(1, Math.min(n, round)));
  };

  return (
    <div className="page">
      <h2 className="page-title">Standings</h2>
      <div className="podium">
        {rows.map((r, i) => (
          <div key={r.id} className={`podium-row${i === 0 ? ' is-first' : ''}`}>
            <span className="podium-rank">{['🥇', '🥈', '🥉'][i] ?? i + 1}</span>
            <span className="dot" style={{ background: r.color }} />
            <span className="podium-name">{r.name}</span>
            <span className={`podium-score${r.total > 0 ? ' is-up' : r.total < 0 ? ' is-down' : ''}`}>{r.total}</span>
          </div>
        ))}
      </div>

      <div className="stat-tiles">
        <div className="stat-tile"><span className="stat-label">{isMahjong ? 'Hands' : 'Rounds'}</span><span className="stat-value">{n}</span></div>
        {isMahjong && <div className="stat-tile"><span className="stat-label">Self-draw</span><span className="stat-value">{selfCount}</span></div>}
        {isMahjong && <div className="stat-tile"><span className="stat-label">Discard</span><span className="stat-value">{n - selfCount - drawCount}</span></div>}
        {isMahjong && drawCount > 0 && <div className="stat-tile"><span className="stat-label">Draw</span><span className="stat-value">{drawCount}</span></div>}
      </div>

      <section className="panel">
        <h3 className="panel-title">Score over time</h3>
        <svg
          className="chart"
          viewBox={`0 0 ${W} ${H}`}
          onPointerMove={onMove}
          onPointerLeave={() => setHoverRound(null)}
          role="img"
          aria-label="Cumulative score by hand"
        >
          <line x1={PAD_X} x2={W - PAD_X} y1={toY(0)} y2={toY(0)} className="chart-zero" />
          <line x1={toX(selected)} x2={toX(selected)} y1={PAD_Y} y2={H - PAD_Y} className="chart-cursor" />
          {rows.map(r => (
            <g key={r.id}>
              <polyline fill="none" stroke={r.color} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"
                points={r.series.map(p => `${toX(p.x)},${toY(p.y)}`).join(' ')} />
              {r.series[selected - 1] && (
                <circle cx={toX(selected)} cy={toY(r.series[selected - 1].y)} r="7" fill={r.color} stroke="#0b2a1f" strokeWidth="2" />
              )}
            </g>
          ))}
        </svg>
        <div className="chart-readout">
          <span className="chart-readout-title">{isMahjong ? 'Hand' : 'Round'} {selected}</span>
          {rows.map(r => {
            const p = r.series[selected - 1];
            return (
              <span key={r.id} className="chart-readout-item">
                <span className="dot" style={{ background: r.color }} />
                {r.name}
                <b className={p?.d > 0 ? 'is-up' : p?.d < 0 ? 'is-down' : ''}>{p?.played ? formatDelta(p.d) : '—'}</b>
                <span className="muted">({p?.y ?? 0})</span>
              </span>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">Player stats</h3>
        <div className="grid-wrap">
          <table className="grid-table stats-table">
            <thead>
              <tr>
                <th>Player</th><th>Won</th>{isMahjong && <th>Self-draw</th>}<th>Lost</th>{isMahjong && <th>Discarded</th>}
                <th>Win %</th><th>Best</th><th>Worst</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="left"><span className="dot" style={{ background: r.color }} /> {r.name}</td>
                  <td>{r.wins}</td>{isMahjong && <td>{r.self}</td>}
                  <td>{r.losses}</td>{isMahjong && <td>{r.fed}</td>}
                  <td>{r.played ? Math.round((r.wins / r.played) * 100) : 0}%</td>
                  <td className="is-up">{formatDelta(r.best)}</td>
                  <td className="is-down">{formatDelta(r.worst)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">💰 Payout</h3>
        <label className="field field--inline">
          <span className="field-label">Points per $1</span>
          <input className="text-input text-input--short" type="number" min="0.01" step="0.01" inputMode="decimal"
            value={rate} onChange={e => setRate(e.target.value)} />
        </label>
        <div className="payout-list">
          {rows.map(r => {
            const amount = rateNum > 0 ? r.total / rateNum : null;
            return (
              <div key={r.id} className="payout-row">
                <span>{r.name}</span>
                <span className={amount > 0 ? 'is-up' : amount < 0 ? 'is-down' : 'muted'}>
                  {amount === null ? '—' : `${amount > 0 ? '+' : amount < 0 ? '−' : ''}$${Math.abs(amount).toFixed(2)}`}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
