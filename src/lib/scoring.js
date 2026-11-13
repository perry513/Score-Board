// Pure scoring helpers. Kept separate from the UI so a fan (番) → points
// table can be added later without touching the screens.

export const WINDS = ['東', '南', '西', '北'];
export const WIND_NAMES = ['East', 'South', 'West', 'North'];

/** Running total per player id, derived from the hand history. */
export function computeTotals(games) {
  const totals = {};
  for (const game of games) {
    for (const [id, value] of Object.entries(game.scores || {})) {
      totals[id] = (totals[id] || 0) + Number(value || 0);
    }
  }
  return totals;
}

/**
 * Mahjong hand → score change per seat.
 * Self-draw (自摸): winner takes `points` from every other seat.
 * Discard (出冲): only the discarder pays, at `points × multiplier`.
 */
export function mahjongDeltas({ seatIds, winnerId, discarderId, points, multiplier }) {
  const scores = Object.fromEntries(seatIds.map(id => [id, 0]));
  if (!winnerId || !(points > 0)) return scores;
  if (!discarderId) {
    for (const id of seatIds) {
      scores[id] = id === winnerId ? points * (seatIds.length - 1) : -points;
    }
  } else {
    scores[winnerId] = points * multiplier;
    scores[discarderId] = -points * multiplier;
  }
  return scores;
}

/** Reads winner / discarder / points back out of a saved hand (works for old saves too). */
export function readHand(game, multiplier) {
  if (game.winner && game.points > 0) {
    // Trust the saved details only if they still match the scores — the classic
    // UI can edit a hand's scores without updating winner/discarder/points.
    const expected = mahjongDeltas({
      seatIds: game.active || Object.keys(game.scores || {}),
      winnerId: game.winner,
      discarderId: game.discarder ?? null,
      points: game.points,
      multiplier: game.mult ?? multiplier,
    });
    const matches = Object.entries(expected).every(([id, v]) => Number(game.scores?.[id] || 0) === v);
    if (matches) return { winnerId: game.winner, discarderId: game.discarder ?? null, points: game.points };
  }
  const entries = Object.entries(game.scores || {});
  const winners = entries.filter(([, v]) => v > 0);
  const losers = entries.filter(([, v]) => v < 0);
  if (winners.length !== 1) return { winnerId: null, discarderId: null, points: 0 };
  const [winnerId, winValue] = winners[0];
  if (game.selfPick || losers.length > 1) {
    return { winnerId, discarderId: null, points: Math.abs(winValue) / Math.max(1, losers.length) };
  }
  return { winnerId, discarderId: losers[0]?.[0] ?? null, points: Math.abs(winValue) / multiplier };
}

export function formatDelta(value) {
  if (value > 0) return `+${value}`;
  return String(value);
}
