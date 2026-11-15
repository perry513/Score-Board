import { useEffect, useRef, useState } from 'react';
import { isTopOverlay } from '../lib/overlay';

/** Bottom sheet on phones, centred card on wider screens. */
export function Sheet({ title, onClose, children, wide = false }) {
  const rootRef = useRef(null);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && isTopOverlay(rootRef.current)) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div ref={rootRef} className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`sheet${wide ? ' sheet--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <h2 className="sheet-title">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onClose }) {
  return (
    <Sheet title={title} onClose={onClose}>
      <p className="dialog-message">{message}</p>
      <div className="dialog-actions">
        <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button
          className={`btn ${danger ? 'btn--danger' : 'btn--gold'}`}
          autoFocus
          onClick={() => { onClose(); onConfirm(); }}
        >
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}

export function PromptDialog({ title, label, initialValue = '', confirmLabel = 'Save', onSubmit, onClose }) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.select(); }, []);
  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onClose();
    onSubmit(trimmed);
  };
  return (
    <Sheet title={title} onClose={onClose}>
      <label className="field">
        <span className="field-label">{label}</span>
        <input
          ref={inputRef}
          className="text-input"
          value={value}
          maxLength={20}
          autoFocus
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
        />
      </label>
      <div className="dialog-actions">
        <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn--gold" onClick={submit} disabled={!value.trim()}>{confirmLabel}</button>
      </div>
    </Sheet>
  );
}
