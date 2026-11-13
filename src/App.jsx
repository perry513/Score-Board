import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mjRulesPdf from './assets/mjRules.pdf';
import { useGameStore } from './hooks/useGameStore';
import { readHand, formatDelta } from './lib/scoring';
import TableView from './components/TableView';
import HandSheet from './components/HandSheet';
import RoundSheet from './components/RoundSheet';
import HistoryView from './components/HistoryView';
import StatsView from './components/StatsView';
import SettingsView from './components/SettingsView';
import { ConfirmDialog, PromptDialog } from './components/Overlay';
import './App.css';

const TABS = [
  { id: 'table', icon: '🀄', label: 'Table' },
  { id: 'history', icon: '📜', label: 'History' },
  { id: 'stats', icon: '📊', label: 'Stats' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export default function App() {
  const store = useGameStore();
  const { rule, games, players, seats, multiplier, uiScale } = store;
  const isMahjong = rule === 'mahjong';

  const [tab, setTab] = useState('table');
  const [sheet, setSheet] = useState(null); // { index: number|null, winnerId?: string }
  const [confirmCfg, setConfirmCfg] = useState(null);
  const [promptCfg, setPromptCfg] = useState(null);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * uiScale}px`;
  }, [uiScale]);

  useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => setFlash(null), 2400);
    return () => clearTimeout(t);
  }, [flash]);

  // Ctrl+` opens score entry, as in the old version.
  useEffect(() => {
    const onKey = e => {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setTab('table');
        setSheet({ index: null });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const askDrawRef = useRef(null);

  // Table-screen keys: 1–4 = that seat won (opens the score sheet), 5 = draw.
  // The sheet takes over the keys once it is open.
  useEffect(() => {
    if (tab !== 'table' || sheet) return undefined;
    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || document.querySelector('.overlay')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= seats.length && (!isMahjong || seats.length === 4)) {
        e.preventDefault();
        setSheet({ index: null, winnerId: seats[n - 1].id });
      } else if (e.key === '5' && isMahjong && seats.length === 4) {
        e.preventDefault();
        askDrawRef.current?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tab, sheet, seats, isMahjong]);

  const nameOf = useCallback(id => players.find(p => p.id === id)?.name ?? '?', [players]);

  const describe = useCallback(game => {
    if (game.rule === 'scrabble' || rule === 'scrabble') {
      const top = Object.entries(game.scores || {}).sort((a, b) => b[1] - a[1])[0];
      return top ? `Top: ${nameOf(top[0])} ${formatDelta(top[1])}` : 'Round';
    }
    if (game.draw) return 'Draw — no winner';
    const h = readHand(game, multiplier);
    if (!h.winnerId) return 'Draw — no winner';
    return h.discarderId
      ? `${nameOf(h.winnerId)} won off ${nameOf(h.discarderId)} · ${h.points} pts`
      : `${nameOf(h.winnerId)} self-draw · ${h.points} pts`;
  }, [rule, multiplier, nameOf]);

  const recentPoints = useMemo(() => {
    const seen = [];
    for (let i = games.length - 1; i >= 0 && seen.length < 6; i -= 1) {
      const pts = readHand(games[i], multiplier).points;
      if (pts > 0 && !seen.includes(pts)) seen.push(pts);
    }
    return seen;
  }, [games, multiplier]);

  const editing = sheet && sheet.index !== null ? games[sheet.index] : null;
  const sheetSeats = editing
    ? editing.active.map(id => players.find(p => p.id === id)).filter(Boolean)
    : seats;

  const closeSheet = useCallback(() => setSheet(null), []);

  const saveHand = useCallback(({ scores, ...meta }) => {
    if (sheet?.index != null) {
      // Editing a draw into a real hand clears the draw flag.
      store.updateHand(sheet.index, scores, { ...meta, draw: false });
    } else {
      store.addHand(scores, meta);
      setFlash({
        key: Date.now(),
        scores,
        winnerId: meta.winner ?? null,
        banner: isMahjong ? (meta.selfPick ? '自摸!' : '胡!') : `Round ${games.length + 1}`,
      });
      setTab('table');
    }
    setSheet(null);
  }, [sheet, store, isMahjong, games.length]);

  const askDraw = () => setConfirmCfg({
    title: `Hand ${games.length + 1}: draw?`,
    message: '流局 — nobody won. The hand is recorded with no points changing.',
    confirmLabel: 'Record draw',
    onConfirm: () => {
      store.addHand(Object.fromEntries(seats.map(s => [s.id, 0])), { draw: true, selfPick: false });
      setFlash({ key: Date.now(), scores: {}, winnerId: null, banner: '流局' });
    },
  });

  askDrawRef.current = askDraw;

  const askDelete = index => setConfirmCfg({
    title: `Delete ${isMahjong ? 'hand' : 'round'} #${games[index].number}?`,
    message: 'Scores will be recalculated without it.',
    confirmLabel: 'Delete',
    danger: true,
    onConfirm: () => { store.deleteHand(index); setSheet(null); },
  });

  const lastHandLabel = games.length ? describe(games[games.length - 1]) : null;
  const sheetTitle = sheet?.index != null
    ? `Edit ${isMahjong ? 'hand' : 'round'} #${editing?.number}`
    : `${isMahjong ? 'Hand' : 'Round'} ${games.length + 1}`;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">雀</span> Score
          <span className="help">
            <button className="help-btn" aria-label="Keyboard shortcuts" aria-describedby="shortcut-tip">?</button>
            <span id="shortcut-tip" role="tooltip" className="help-tip">
              <b>Keyboard shortcuts</b>
              <span className="help-row"><kbd>1</kbd>–<kbd>4</kbd> Winner (seat number)</span>
              <span className="help-row"><kbd>1</kbd>–<kbd>4</kbd> Who discarded — winner's own number = self-draw</span>
              <span className="help-row"><kbd>0</kbd>–<kbd>9</kbd> Points, then <kbd>Enter</kbd></span>
              <span className="help-row"><kbd>5</kbd> Draw (流局), <kbd>Enter</kbd> to confirm</span>
              <span className="help-row"><kbd>Backspace</kbd> Step back · <kbd>Esc</kbd> Close</span>
              <span className="help-example">e.g. <kbd>1</kbd><kbd>1</kbd><kbd>2</kbd><kbd>0</kbd><kbd>Enter</kbd> = player 1 self-draw, 20 pts<br /><kbd>2</kbd><kbd>4</kbd><kbd>8</kbd><kbd>Enter</kbd> = player 2 wins off player 4, 8 pts</span>
            </span>
          </span>
        </div>
        <div className="topbar-pills">
          <span className="pill">{isMahjong ? '🀄 Mahjong' : '🔤 Scrabble'}</span>
          <span className="pill">{games.length} {isMahjong ? 'hands' : 'rounds'}</span>
        </div>
      </header>

      <main className={`main main--${tab}`}>
        {tab === 'table' && (
          <TableView
            rule={rule}
            seats={seats}
            games={games}
            multiplier={multiplier}
            onEdit={index => setSheet({ index })}
            onDraw={askDraw}
            flash={flash}
            lastHandLabel={lastHandLabel}
            onSeatTap={id => setSheet({ index: null, winnerId: id })}
            onUndo={() => askDelete(games.length - 1)}
            onRoll={() => setConfirmCfg({
              title: 'Roll for seats?',
              message: 'Shuffle who sits 東 南 西 北?',
              confirmLabel: '🎲 Roll',
              onConfirm: store.rollSeats,
            })}
          />
        )}
        {tab === 'history' && (
          <HistoryView rule={rule} games={games} players={players} seats={seats} multiplier={multiplier}
            onEdit={index => setSheet({ index })} />
        )}
        {tab === 'stats' && <StatsView rule={rule} games={games} players={players} seats={seats} />}
        {tab === 'settings' && (
          <SettingsView store={store} rulesPdf={mjRulesPdf} confirm={setConfirmCfg} prompt={setPromptCfg} />
        )}
      </main>

      <nav className="tabbar">
        {TABS.map(t => (
          <button key={t.id} className={`tab${tab === t.id ? ' is-on' : ''}`} onClick={() => setTab(t.id)}>
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {sheet && isMahjong && (
        <HandSheet
          key={sheet.index ?? 'new'}
          title={sheetTitle}
          seats={sheetSeats}
          initial={editing ? readHand(editing, multiplier) : { winnerId: sheet.winnerId ?? null }}
          multiplier={editing?.mult && editing.discarder ? editing.mult : multiplier}
          recentPoints={recentPoints}
          onSubmit={saveHand}
          onDelete={sheet.index != null ? () => askDelete(sheet.index) : undefined}
          onClose={closeSheet}
        />
      )}
      {sheet && !isMahjong && (
        <RoundSheet
          key={sheet.index ?? 'new'}
          title={sheetTitle}
          seats={sheetSeats}
          initial={editing?.scores}
          onSubmit={saveHand}
          onDelete={sheet.index != null ? () => askDelete(sheet.index) : undefined}
          onClose={closeSheet}
        />
      )}
      {confirmCfg && <ConfirmDialog {...confirmCfg} onClose={() => setConfirmCfg(null)} />}
      {promptCfg && <PromptDialog {...promptCfg} onClose={() => setPromptCfg(null)} />}
    </div>
  );
}
