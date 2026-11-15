import { useState } from 'react';
import { WindTile } from './TableView';
import { THEMES } from '../hooks/useGameStore';

export default function SettingsView({ store, rulesPdf, confirm, prompt }) {
  const { rule, seats, bench, players, multiplier, uiScale, games } = store;
  const [swapFrom, setSwapFrom] = useState(null);
  const isMahjong = rule === 'mahjong';
  const seatsFull = seats.length >= 4;

  const rename = p => prompt({
    title: 'Rename player',
    label: 'Name',
    initialValue: p.name,
    onSubmit: name => store.renamePlayer(p.id, name),
  });

  const sitIn = p => {
    if (!isMahjong && !seatsFull) store.sitDown(p.id);
    else setSwapFrom(swapFrom === p.id ? null : p.id);
  };

  return (
    <div className="page">
      <h2 className="page-title">Settings</h2>

      <section className="panel">
        <h3 className="panel-title">Game</h3>
        <div className="action-grid">
          <button className="btn btn--gold" onClick={() => confirm({
            title: 'Start a new game?',
            message: `This clears all ${games.length} ${isMahjong ? 'hands' : 'rounds'}. Player names are kept.`,
            confirmLabel: 'New game',
            danger: true,
            onConfirm: () => {
              store.newGame();
              if (isMahjong && seats.length === 4) {
                setTimeout(() => confirm({
                  title: 'Roll for seats?',
                  message: 'Shuffle who sits 東 南 西 北?',
                  confirmLabel: '🎲 Roll',
                  onConfirm: store.rollSeats,
                }), 0);
              }
            },
          })}>🀄 New game</button>
          {isMahjong && seats.length === 4 && (
            <button className="btn" onClick={() => confirm({
              title: 'Roll for seats?',
              message: 'Shuffle who sits 東 南 西 北?',
              confirmLabel: '🎲 Roll',
              onConfirm: store.rollSeats,
            })}>🎲 Roll seats 東南西北</button>
          )}
          <a className="btn" href={rulesPdf} target="_blank" rel="noopener noreferrer">📖 House rules</a>
          <button className="btn btn--ghost" onClick={() => {
            try { localStorage.setItem('ui_version', 'classic'); } catch { /* storage unavailable */ }
            window.location.href = `${import.meta.env.BASE_URL}classic/`;
          }}>↩ Switch to classic view</button>
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">At the table</h3>
        {swapFrom && <p className="hint">Tap the seat {players.find(p => p.id === swapFrom)?.name} should take.</p>}
        <ul className="player-list">
          {seats.map((p, i) => (
            <li key={p.id} className="player-row">
              {isMahjong ? <WindTile index={i} small /> : <span className="rank-chip">{i + 1}</span>}
              <button className="player-name-btn" onClick={() => rename(p)}>{p.name} <span className="muted">✎</span></button>
              <span className={`player-score${p.score > 0 ? ' is-up' : p.score < 0 ? ' is-down' : ''}`}>{p.score}</span>
              {swapFrom ? (
                <button className="chip-btn chip-btn--gold" onClick={() => { store.swapIntoSeat(i, swapFrom); setSwapFrom(null); }}>⇄ Swap</button>
              ) : (!isMahjong && seats.length > 2 && (
                <button className="chip-btn" onClick={() => store.standUp(p.id)}>Sit out</button>
              ))}
            </li>
          ))}
        </ul>

        <h3 className="panel-title panel-title--sub">Sitting out</h3>
        {bench.length === 0 && <p className="muted small">Nobody is sitting out.</p>}
        <ul className="player-list">
          {bench.map(p => {
            const canRemove = players.length > 4 && p.score === 0;
            return (
              <li key={p.id} className={`player-row${swapFrom === p.id ? ' is-selected' : ''}`}>
                <span className="rank-chip">–</span>
                <button className="player-name-btn" onClick={() => rename(p)}>{p.name} <span className="muted">✎</span></button>
                <span className={`player-score${p.score > 0 ? ' is-up' : p.score < 0 ? ' is-down' : ''}`}>{p.score}</span>
                <button className="chip-btn" onClick={() => sitIn(p)}>{swapFrom === p.id ? 'Cancel' : 'Sit in'}</button>
                <button
                  className="icon-btn"
                  disabled={!canRemove}
                  title={canRemove ? 'Remove player' : 'Only players with 0 points can be removed (minimum 4 players)'}
                  onClick={() => confirm({
                    title: `Remove ${p.name}?`,
                    message: 'They will be deleted from the player list.',
                    confirmLabel: 'Remove',
                    danger: true,
                    onConfirm: () => store.removePlayer(p.id),
                  })}
                >🗑</button>
              </li>
            );
          })}
        </ul>
        <button className="btn btn--ghost" onClick={() => prompt({
          title: 'Add player',
          label: 'Name',
          confirmLabel: 'Add',
          onSubmit: name => store.addPlayer(name),
        })}>＋ Add player</button>
      </section>

      <section className="panel">
        <h3 className="panel-title">Theme</h3>
        <div className="theme-row" role="radiogroup" aria-label="Colour theme">
          {THEMES.map(t => (
            <button
              key={t.id}
              role="radio"
              aria-checked={store.theme === t.id}
              className={`theme-swatch${store.theme === t.id ? ' is-on' : ''}`}
              onClick={() => store.setTheme(t.id)}
            >
              <span
                className="theme-chip"
                style={{ background: `linear-gradient(135deg, ${t.bg}, ${t.bar})`, '--chip-accent': t.accent }}
              />
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">Scoring</h3>
        <div className="field">
          <span className="field-label">Game type</span>
          <div className="segmented">
            <button className={isMahjong ? 'is-on' : ''} onClick={() => store.setRule('mahjong')}>🀄 Mahjong</button>
            <button className={!isMahjong ? 'is-on' : ''} onClick={() => store.setRule('scrabble')}>🔤 Scrabble</button>
          </div>
        </div>
        {isMahjong && (
          <div className="field">
            <span className="field-label">出冲 multiplier (discarder pays × this)</span>
            <div className="stepper">
              <button className="key key--fn" onClick={() => store.setMultiplier(m => Math.max(1, m - 0.5))}>−</button>
              <span className="stepper-value">×{multiplier}</span>
              <button className="key key--fn" onClick={() => store.setMultiplier(m => Math.min(3, m + 0.5))}>＋</button>
            </div>
          </div>
        )}
        <label className="field">
          <span className="field-label">Display size ({Math.round(uiScale * 100)}%)</span>
          <input className="range" type="range" min="0.8" max="1.6" step="0.05" value={uiScale}
            onChange={e => store.setUiScale(Number(e.target.value))} />
        </label>
      </section>
    </div>
  );
}
