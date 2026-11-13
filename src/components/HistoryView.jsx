import { useState } from 'react';
import { formatDelta, readHand } from '../lib/scoring';

const KIND_LABEL = { self: 'Self-draw', discard: 'Discard', draw: 'Draw' };

export default function HistoryView({ rule, games, players, seats, multiplier, onEdit }) {
  const [mode, setMode] = useState('list');
  const isMahjong = rule === 'mahjong';
  const nameOf = id => players.find(p => p.id === id)?.name ?? '?';
  const handInfo = g => {
    if (!isMahjong) return { kind: null };
    const h = readHand(g, multiplier);
    if (g.draw || !h.winnerId) return { kind: 'draw' };
    return { kind: h.discarderId ? 'discard' : 'self', ...h };
  };

  if (games.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">🀄</div>
        <div>No {rule === 'mahjong' ? 'hands' : 'rounds'} yet.</div>
        <div className="muted">Go to the Table and tap a player to start scoring.</div>
      </div>
    );
  }

  // Grid columns: current seats first, then anyone else who has played.
  const playedIds = new Set(games.flatMap(g => Object.keys(g.scores || {})));
  const columns = [...seats.map(s => s.id), ...players.map(p => p.id).filter(id => playedIds.has(id) && !seats.some(s => s.id === id))];
  const newestFirst = games.map((g, i) => ({ g, i })).reverse();

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">History</h2>
        <div className="segmented">
          <button className={mode === 'list' ? 'is-on' : ''} onClick={() => setMode('list')}>List</button>
          <button className={mode === 'grid' ? 'is-on' : ''} onClick={() => setMode('grid')}>Grid</button>
        </div>
      </div>
      <p className="muted small">Tap a {rule === 'mahjong' ? 'hand' : 'round'} to fix or delete it.</p>

      {mode === 'list' ? (
        <ul className="hand-list">
          {newestFirst.map(({ g, i }) => (
            <li key={i}>
              <button className="hand-card" onClick={() => onEdit(i)}>
                <span className="hand-num">#{g.number}</span>
                <span className="hand-body">
                  {(() => {
                    const info = handInfo(g);
                    return (
                      <>
                        {info.kind && (
                          <span className="hand-meta">
                            <span className={`kind-badge kind-badge--${info.kind}`}>{KIND_LABEL[info.kind]}</span>
                            {info.points > 0 && <span className="hand-pts">{info.points} pts</span>}
                          </span>
                        )}
                        <span className="hand-chips">
                          {info.kind === 'draw' && <span className="muted small">No points changed</span>}
                          {Object.entries(g.scores || {}).filter(([, v]) => v !== 0 || !isMahjong).map(([id, v]) => (
                            <span
                              key={id}
                              className={[
                                'delta-chip',
                                v > 0 ? 'is-up' : v < 0 ? 'is-down' : '',
                                id === info.winnerId ? 'is-winner' : '',
                                id === info.discarderId ? 'is-feeder' : '',
                              ].join(' ')}
                            >
                              <span className="delta-chip-name">{nameOf(id)}</span> {formatDelta(v)}
                            </span>
                          ))}
                        </span>
                      </>
                    );
                  })()}
                </span>
                <span className="hand-edit" aria-hidden="true">✎</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid-wrap">
          <table className="grid-table">
            <thead>
              <tr>
                <th>#</th>
                {columns.map(id => <th key={id}>{nameOf(id)}</th>)}
              </tr>
            </thead>
            <tbody>
              {newestFirst.map(({ g, i }) => (
                <tr key={i} onClick={() => onEdit(i)}>
                  <td className="grid-num">{g.number}</td>
                  {columns.map(id => {
                    const v = g.scores?.[id];
                    return (
                      <td key={id} className={v > 0 ? 'is-up' : v < 0 ? 'is-down' : 'muted'}>
                        {v === undefined ? '·' : v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
