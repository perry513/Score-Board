import { WINDS, formatDelta, readHand } from '../lib/scoring';

/**
 * The classic score board, as a side panel: one column per seated player,
 * one row per hand (newest first), each cell that player's +/− for the hand.
 */
export default function ScoreLog({ rule, seats, games, multiplier, onEdit }) {
  const isMahjong = rule === 'mahjong';
  const seatIds = seats.map(s => s.id);
  const hasOther = games.some(g => Object.keys(g.scores || {}).some(id => !seatIds.includes(id) && g.scores[id] !== 0));
  const rows = games.map((g, i) => ({ g, i })).reverse();
  const cols = `2.6rem repeat(${seats.length}, minmax(0, 1fr))${hasOther ? ' 3.2rem' : ''}`;

  return (
    <aside className="score-log" aria-label="Score board">
      <div className="log-head" style={{ gridTemplateColumns: cols }}>
        <span className="log-corner">#</span>
        {seats.map((p, i) => (
          <span key={p.id} className="log-player">
            <span className="log-name">{p.name}</span>
            {isMahjong && <span className="log-wind" aria-label="seat wind">{WINDS[i]}</span>}
            <span className={`log-total${p.score > 0 ? ' is-up' : p.score < 0 ? ' is-down' : ''}`}>{formatDelta(p.score)}</span>
          </span>
        ))}
        {hasOther && <span className="log-player"><span className="log-name">Other</span></span>}
      </div>

      <div className="log-body">
        {rows.length === 0 && <div className="log-empty">Hands will appear here.</div>}
        {rows.map(({ g, i }) => {
          const hand = isMahjong ? readHand(g, multiplier) : null;
          const other = Object.entries(g.scores || {})
            .filter(([id]) => !seatIds.includes(id))
            .reduce((sum, [, v]) => sum + Number(v || 0), 0);
          return (
            <button
              key={i}
              className={`log-row${i === games.length - 1 ? ' is-latest' : ''}`}
              style={{ gridTemplateColumns: cols }}
              onClick={() => onEdit(i)}
              title={`Edit hand #${g.number}`}
            >
              <span className="log-num">
                {g.number}
                {isMahjong && (g.draw || !hand?.winnerId) && <span className="log-tag log-tag--draw">draw</span>}
                {isMahjong && !g.draw && hand?.winnerId && !hand.discarderId && <span className="log-tag">self</span>}
              </span>
              {seats.map(p => {
                const played = g.scores && p.id in g.scores;
                const v = played ? Number(g.scores[p.id] || 0) : null;
                const isWinner = hand?.winnerId === p.id;
                const isFeeder = hand?.discarderId === p.id;
                return (
                  <span key={p.id} className="log-cell">
                    {v === null ? (
                      <span className="log-dash">·</span>
                    ) : (
                      <span className={[
                        'log-val',
                        v > 0 ? 'is-up' : v < 0 ? 'is-down' : 'is-zero',
                        isWinner ? 'is-winner' : '',
                        isFeeder ? 'is-feeder' : '',
                      ].join(' ')}>
                        {v === 0 ? '0' : formatDelta(v)}
                      </span>
                    )}
                  </span>
                );
              })}
              {hasOther && (
                <span className="log-cell">
                  <span className={`log-val ${other > 0 ? 'is-up' : other < 0 ? 'is-down' : 'is-zero'}`}>{other ? formatDelta(other) : '·'}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
