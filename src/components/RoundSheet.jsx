import { useEffect, useRef, useState } from 'react';
import { Sheet } from './Overlay';

/** Scrabble-style round: every player gets their own score. Tab moves between players, Enter submits. */
export default function RoundSheet({ title, seats, initial = {}, onSubmit, onDelete, onClose }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(seats.map(p => [p.id, initial[p.id] !== undefined ? String(initial[p.id]) : ''])),
  );
  const firstRef = useRef(null);
  useEffect(() => { firstRef.current?.focus(); }, []);

  const complete = seats.every(p => values[p.id] !== '' && Number.isFinite(Number(values[p.id])));
  const submit = () => {
    if (!complete) return;
    onSubmit({ scores: Object.fromEntries(seats.map(p => [p.id, Number(values[p.id])])), rule: 'scrabble' });
  };

  return (
    <Sheet title={title} onClose={onClose}>
      <div className="round-grid">
        {seats.map((p, i) => (
          <label key={p.id} className="round-field">
            <span className="round-name">{p.name}</span>
            <input
              ref={i === 0 ? firstRef : undefined}
              className="round-input"
              type="number"
              inputMode="numeric"
              value={values[p.id]}
              placeholder="0"
              onFocus={e => e.target.select()}
              onChange={e => setValues(v => ({ ...v, [p.id]: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            />
          </label>
        ))}
      </div>
      <div className="dialog-actions">
        {onDelete && <button className="btn btn--danger-ghost" onClick={onDelete}>Delete round</button>}
        <button className="btn btn--gold btn--big" disabled={!complete} onClick={submit}>
          {complete ? 'Save round' : 'Enter every score'}
        </button>
      </div>
    </Sheet>
  );
}
