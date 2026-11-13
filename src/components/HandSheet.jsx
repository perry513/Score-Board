import { useCallback, useEffect, useRef, useState } from 'react';
import { Sheet } from './Overlay';
import { isTopOverlay } from '../lib/overlay';
import { mahjongDeltas, formatDelta, WINDS } from '../lib/scoring';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

/**
 * Mahjong hand entry: who won → how (自摸 or who discarded) → points.
 * `points` is plain points today; a fan (番) picker can feed the same value later.
 */
export default function HandSheet({ title, seats, initial, multiplier, recentPoints, onSubmit, onDelete, onClose }) {
  const [winnerId, setWinnerId] = useState(initial.winnerId ?? null);
  const [method, setMethod] = useState(
    initial.winnerId && initial.points ? (initial.discarderId ?? 'self') : null,
  );
  const [points, setPoints] = useState(initial.points ? String(initial.points) : '');
  // When points were filled in for you (editing, or a "recent" chip), the next digit replaces them.
  const [fresh, setFresh] = useState(!!initial.points);

  const pointsNum = Number(points) || 0;
  const discarderId = method && method !== 'self' ? method : null;
  const ready = winnerId && method && pointsNum > 0;
  const seatIds = seats.map(s => s.id);
  const preview = mahjongDeltas({ seatIds, winnerId, discarderId, points: pointsNum, multiplier });
  const winnerKey = seatIds.indexOf(winnerId) + 1;

  const pressKey = useCallback(key => {
    const replace = fresh && /\d/.test(key);
    setFresh(false);
    setPoints(prev => {
      if (key === 'C') return '';
      if (key === '⌫') return replace ? '' : prev.slice(0, -1);
      if (replace) return key;
      if (prev.length >= 6) return prev;
      return prev === '0' ? key : prev + key;
    });
  }, [fresh]);

  const submit = useCallback(() => {
    if (!ready) return;
    onSubmit({
      scores: preview,
      winner: winnerId,
      discarder: discarderId,
      points: pointsNum,
      mult: discarderId ? multiplier : 1,
      selfPick: !discarderId,
    });
  }, [ready, onSubmit, preview, winnerId, discarderId, pointsNum, multiplier]);

  /*
   * Keyboard: the same digit keys walk through the steps.
   *   step 1  1–4  winner (seat number)
   *   step 2  1–4  who discarded — the winner's own number means self-draw
   *   step 3  digits = points, Enter = confirm
   *   Backspace steps back once the points are empty.
   */
  const bodyRef = useRef(null);
  useEffect(() => {
    const seatAt = d => seats[Number(d) - 1];
    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || !isTopOverlay(bodyRef.current)) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        if (!winnerId) {
          const p = seatAt(e.key);
          if (p) setWinnerId(p.id);
        } else if (!method) {
          const p = seatAt(e.key);
          if (p) setMethod(p.id === winnerId ? 'self' : p.id);
        } else {
          pressKey(e.key);
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (points) pressKey('⌫');
        else if (method) setMethod(null);
        else if (winnerId) setWinnerId(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pressKey, submit, seats, winnerId, method, points]);

  const chooseWinner = id => {
    setWinnerId(id);
    if (method === id) setMethod(null);
  };

  return (
    <Sheet title={title} onClose={onClose}>
      <div ref={bodyRef} className="step">
        <div className="step-label"><span className="step-no">1</span> Who won? 胡</div>
        <div className="pick-row">
          {seats.map((p, i) => (
            <button
              key={p.id}
              className={`pick${winnerId === p.id ? ' is-win' : ''}`}
              onClick={() => chooseWinner(p.id)}
            >
              <kbd className="key-hint">{i + 1}</kbd>
              <span className="pick-name pick-name--big">{p.name}</span>
              <span className="pick-sub">{WINDS[i]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`step${winnerId ? '' : ' is-disabled'}`}>
        <div className="step-label"><span className="step-no">2</span> How?</div>
        <div className="pick-row">
          <button
            className={`pick pick--self${method === 'self' ? ' is-self' : ''}`}
            disabled={!winnerId}
            onClick={() => setMethod('self')}
          >
            {winnerKey > 0 && <kbd className="key-hint">{winnerKey}</kbd>}
            <span className="pick-big">自摸</span>
            <span className="pick-sub">Self-draw</span>
          </button>
          {seats.map((p, i) => (p.id === winnerId ? null : (
            <button
              key={p.id}
              className={`pick${method === p.id ? ' is-lose' : ''}`}
              disabled={!winnerId}
              onClick={() => setMethod(p.id)}
            >
              <kbd className="key-hint">{i + 1}</kbd>
              <span className="pick-name pick-name--big">{p.name}</span>
              <span className="pick-sub">discarded</span>
            </button>
          )))}
        </div>
      </div>

      <div className={`step${method ? '' : ' is-disabled'}`}>
        <div className="step-label"><span className="step-no">3</span> Points</div>
        <div className="points-display" aria-live="polite">{points || '0'}</div>
        {recentPoints.length > 0 && (
          <div className="quick-row">
            {recentPoints.map(v => (
              <button key={v} className="chip-btn" onClick={() => { setPoints(String(v)); setFresh(true); }}>{v}</button>
            ))}
          </div>
        )}
        <div className="keypad">
          {KEYS.map(k => (
            <button key={k} className={`key${/\d/.test(k) ? '' : ' key--fn'}`} onClick={() => pressKey(k)}>{k}</button>
          ))}
        </div>
      </div>

      <div className="preview">
        {seats.map(p => {
          const v = preview[p.id] || 0;
          return (
            <div key={p.id} className="preview-cell">
              <span className="preview-name">{p.name}</span>
              <span className={`preview-val${v > 0 ? ' is-up' : v < 0 ? ' is-down' : ''}`}>{v ? formatDelta(v) : '–'}</span>
            </div>
          );
        })}
      </div>
      {discarderId && multiplier !== 1 && (
        <div className="preview-note">出冲 pays ×{multiplier}</div>
      )}

      <div className="dialog-actions">
        {onDelete && <button className="btn btn--danger-ghost" onClick={onDelete}>Delete hand</button>}
        <button className="btn btn--gold btn--big" disabled={!ready} onClick={submit}>
          {ready ? 'Confirm 胡!' : 'Pick winner, how, points'}
        </button>
      </div>
    </Sheet>
  );
}
