import { useEffect, useState } from 'react';
import { WINDS, formatDelta } from '../lib/scoring';
import ScoreLog from './ScoreLog';

const AREAS = {
  2: ['bottom', 'top'],
  3: ['bottom', 'right', 'top'],
  4: ['bottom', 'right', 'top', 'left'],
};

function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = n => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function WindTile({ index, small = false }) {
  if (index == null || index >= WINDS.length) return null;
  return <span className={`wind-tile${small ? ' wind-tile--sm' : ''}`} aria-label={`${['East', 'South', 'West', 'North'][index]} seat`}>{WINDS[index]}</span>;
}

export default function TableView({ rule, seats, games, multiplier, flash, lastHandLabel, onSeatTap, onUndo, onRoll, onEdit, onDraw }) {
  const now = useClock();
  const areas = AREAS[seats.length] || AREAS[4];
  const sorted = [...seats].sort((a, b) => b.score - a.score);
  const leaderId = sorted.length > 1 && sorted[0].score > 0 && sorted[0].score > sorted[1].score ? sorted[0].id : null;
  const rankOf = id => sorted.findIndex(p => p.id === id) + 1;
  const startedAt = games.find(g => g.ts)?.ts;
  const isMahjong = rule === 'mahjong';
  const canPlay = !isMahjong || seats.length === 4;
  const canDraw = isMahjong && canPlay && typeof onDraw === 'function';

  return (
    <div className="table-layout">
    <div className={`table table--${seats.length}`}>
      {seats.map((p, i) => {
        const delta = flash?.scores?.[p.id];
        const isWinner = flash && flash.winnerId === p.id;
        return (
          <button
            key={p.id}
            className={[
              'seat',
              `seat--${areas[i]}`,
              p.score > 0 ? 'seat--plus' : p.score < 0 ? 'seat--minus' : '',
              isWinner ? 'is-winner' : '',
            ].join(' ')}
            onClick={() => onSeatTap(p.id)}
            disabled={!canPlay}
            title={isMahjong ? `${p.name} won this hand` : `Enter round scores`}
          >
            <span className="seat-corner">
              {isMahjong ? <WindTile index={i} small /> : <span className="rank-chip">#{rankOf(p.id)}</span>}
              <kbd className="seat-key" title={`Press ${i + 1}`}>{i + 1}</kbd>
            </span>
            {leaderId === p.id && <span className="crown" aria-label="Leader">👑</span>}
            <div className="seat-name">{p.name}</div>
            <div className="seat-score">{p.score > 0 ? `+${p.score}` : p.score}</div>
            {isMahjong && <div className="seat-rank">Rank {rankOf(p.id)}</div>}
            {typeof delta === 'number' && delta !== 0 && (
              <span key={flash.key} className={`delta-pop ${delta > 0 ? 'is-up' : 'is-down'}`}>{formatDelta(delta)}</span>
            )}
          </button>
        );
      })}

      <div
        className={`table-center${canDraw ? ' is-tappable' : ''}`}
        {...(canDraw ? {
          role: 'button',
          tabIndex: 0,
          'aria-label': 'Record a draw (流局)',
          onClick: onDraw,
          onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDraw(); } },
        } : {})}
      >
        {flash?.banner && <div key={flash.key} className="banner-pop">{flash.banner}</div>}
        <div className="hand-no">
          <span className="hand-no-label">{isMahjong ? '第' : 'Round'}</span>
          <span className="hand-no-value">{games.length + 1}</span>
          <span className="hand-no-label">{isMahjong ? '局' : ''}</span>
        </div>
        <div className="center-hint">
          {canPlay
            ? (isMahjong ? 'Tap the winner · tap here for a draw' : 'Tap any player to enter scores')
            : 'Mahjong needs exactly 4 seated players. Set seats in Settings.'}
        </div>
        <div className="center-clock">
          <span>🕒 {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {startedAt && <span>⏱ {formatElapsed(now - startedAt)}</span>}
        </div>
        {lastHandLabel && <div className="last-hand">Last: {lastHandLabel}</div>}
        <div className="center-actions" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
          {games.length > 0 && <button className="chip-btn" onClick={onUndo}>↶ Undo</button>}
          {isMahjong && seats.length === 4 && <button className="chip-btn" onClick={onRoll}>🎲 Seats</button>}
        </div>
      </div>
    </div>
    <ScoreLog rule={rule} seats={seats} games={games} multiplier={multiplier} onEdit={onEdit} />
    </div>
  );
}
