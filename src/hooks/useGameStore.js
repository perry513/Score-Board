import { useEffect, useMemo, useState } from 'react';
import { computeTotals } from '../lib/scoring';

// localStorage keys are unchanged from the original app so existing saves load.
export const RULES = ['mahjong', 'scrabble'];

// Colour themes (see App.css). `bg` / `accent` are only for the picker swatches.
export const THEMES = [
  { id: 'jade', name: 'Jade', bg: '#1d6b4b', accent: '#f2c45a', bar: '#0b2a1f' },
  { id: 'midnight', name: 'Midnight', bg: '#24466e', accent: '#f2c45a', bar: '#0b1a2e' },
  { id: 'charcoal', name: 'Charcoal', bg: '#3b3e44', accent: '#f0b54f', bar: '#16171a' },
  { id: 'ivory', name: 'Ivory', bg: '#fbf7ee', accent: '#a5671a', bar: '#e6dbc4' },
  { id: 'mist', name: 'Mist', bg: '#f7f9fc', accent: '#2b5c99', bar: '#dce4ed' },
];
export const readTheme = () => {
  try {
    const saved = localStorage.getItem('ui_theme');
    return THEMES.some(t => t.id === saved) ? saved : 'jade';
  } catch {
    return 'jade';
  }
};
const DEFAULT_PLAYERS = [1, 2, 3, 4, 5, 6].map(n => ({ id: `p${n}`, name: `Player ${n}`, score: 0 }));
const DEFAULT_SEATS = ['p1', 'p2', 'p3', 'p4'];

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readNumber(key, fallback, min, max) {
  try {
    const raw = localStorage.getItem(key);
    const value = Number(raw);
    if (raw !== null && Number.isFinite(value)) return Math.max(min, Math.min(max, value));
  } catch { /* storage unavailable */ }
  return fallback;
}

function loadRule(rule) {
  return {
    players: readJSON(`${rule}_players`, DEFAULT_PLAYERS),
    activePlayerIds: readJSON(`${rule}_activePlayerIds`, DEFAULT_SEATS),
    games: readJSON(`${rule}_games`, []),
  };
}

const renumber = games => games.map((g, i) => ({ ...g, number: i + 1 }));

export function useGameStore() {
  const [rule, setRule] = useState(() => {
    const saved = localStorage.getItem('score_rule');
    return RULES.includes(saved) ? saved : 'mahjong';
  });
  const [byRule, setByRule] = useState(() => Object.fromEntries(RULES.map(r => [r, loadRule(r)])));
  const [multiplier, setMultiplier] = useState(() => readNumber('chu_chong_multiplier', 2, 1, 3));
  const [uiScale, setUiScale] = useState(() => readNumber('ui_scale', 1, 0.8, 1.6));
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    try { localStorage.setItem('ui_theme', theme); } catch { /* storage unavailable */ }
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    const t = THEMES.find(x => x.id === theme);
    if (meta && t) meta.setAttribute('content', t.bar);
  }, [theme]);

  const current = byRule[rule];
  const totals = useMemo(() => computeTotals(current.games), [current.games]);
  const players = useMemo(
    () => current.players.map(p => ({ ...p, score: totals[p.id] || 0 })),
    [current.players, totals],
  );
  const seats = useMemo(
    () => current.activePlayerIds.map(id => players.find(p => p.id === id)).filter(Boolean),
    [current.activePlayerIds, players],
  );
  const bench = useMemo(
    () => players.filter(p => !current.activePlayerIds.includes(p.id)),
    [current.activePlayerIds, players],
  );

  useEffect(() => { localStorage.setItem('score_rule', rule); }, [rule]);
  useEffect(() => { localStorage.setItem('chu_chong_multiplier', String(multiplier)); }, [multiplier]);
  useEffect(() => { localStorage.setItem('ui_scale', String(uiScale)); }, [uiScale]);
  useEffect(() => {
    for (const r of RULES) {
      const s = byRule[r];
      const t = computeTotals(s.games);
      // `score` is still written so an older build of the app reads correct totals.
      localStorage.setItem(`${r}_players`, JSON.stringify(s.players.map(p => ({ ...p, score: t[p.id] || 0 }))));
      localStorage.setItem(`${r}_activePlayerIds`, JSON.stringify(s.activePlayerIds));
      localStorage.setItem(`${r}_games`, JSON.stringify(s.games));
    }
  }, [byRule]);

  const update = fn => setByRule(prev => ({ ...prev, [rule]: { ...prev[rule], ...fn(prev[rule]) } }));

  const actions = {
    addHand(scores, meta = {}) {
      update(s => ({
        games: [...s.games, {
          number: s.games.length + 1,
          scores,
          active: [...s.activePlayerIds],
          ts: Date.now(),
          ...meta,
        }],
      }));
    },
    updateHand(index, scores, meta = {}) {
      update(s => ({ games: s.games.map((g, i) => (i === index ? { ...g, scores, ...meta } : g)) }));
    },
    deleteHand(index) {
      update(s => ({ games: renumber(s.games.filter((_, i) => i !== index)) }));
    },
    newGame() {
      update(() => ({ games: [] }));
    },
    rollSeats() {
      update(s => {
        const shuffled = [...s.activePlayerIds];
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return { activePlayerIds: shuffled };
      });
    },
    renamePlayer(id, name) {
      update(s => ({ players: s.players.map(p => (p.id === id ? { ...p, name } : p)) }));
    },
    addPlayer(name) {
      update(s => {
        const max = s.players.reduce((m, p) => Math.max(m, Number.parseInt(String(p.id).replace(/^p/, ''), 10) || 0), 0);
        return { players: [...s.players, { id: `p${max + 1}`, name, score: 0 }] };
      });
    },
    removePlayer(id) {
      update(s => ({ players: s.players.filter(p => p.id !== id) }));
    },
    /** Put a bench player into seat `seatIndex` (the seated player goes to the bench). */
    swapIntoSeat(seatIndex, benchId) {
      update(s => ({ activePlayerIds: s.activePlayerIds.map((id, i) => (i === seatIndex ? benchId : id)) }));
    },
    sitDown(benchId) {
      update(s => ({ activePlayerIds: [...s.activePlayerIds, benchId] }));
    },
    standUp(id) {
      update(s => ({ activePlayerIds: s.activePlayerIds.filter(x => x !== id) }));
    },
  };

  return {
    rule, setRule,
    multiplier, setMultiplier,
    uiScale, setUiScale,
    theme, setTheme,
    players, seats, bench,
    games: current.games,
    ...actions,
  };
}
