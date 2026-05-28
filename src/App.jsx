import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Modal from 'react-modal';
import mjRulesPdf from './assets/mjRules.pdf';
import './App.css';

// Sample initial data
const defaultPlayers = [
  { id: 'p1', name: 'Player 1', score: 0 },
  { id: 'p2', name: 'Player 2', score: 0 },
  { id: 'p3', name: 'Player 3', score: 0 },
  { id: 'p4', name: 'Player 4', score: 0 },
  { id: 'p5', name: 'Player 5', score: 0 },
  { id: 'p6', name: 'Player 6', score: 0 },
];
const defaultGames = [];

function App() {
      // For Scrabble popup input refs
      const scrabbleInputRefs = React.useRef([]);
    // Rule selection: 'mahjong' or 'scrabble'
    const [scoreRule, setScoreRule] = useState(() => {
      const saved = localStorage.getItem('score_rule');
      return saved || 'mahjong';
    });
    useEffect(() => {
      localStorage.setItem('score_rule', scoreRule);
    }, [scoreRule]);
    // Scrabble round scores state
    const [scrabbleRoundScores, setScrabbleRoundScores] = useState({});
    // Track if popup was opened for Scrabble
    const [scrabblePopup, setScrabblePopup] = useState(false);
  // Font size state for table
  const [tableFontSize, setTableFontSize] = useState(() => {
    const saved = Number(localStorage.getItem('table_font_size'));
    if (Number.isFinite(saved)) {
      return Math.max(1, Math.min(7, saved));
    }
    return 4;
  });
  useEffect(() => {
    localStorage.setItem('table_font_size', String(tableFontSize));
  }, [tableFontSize]);
  // Payout modal state
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutRate, setPayoutRate] = useState(1);
  const payoutRateInputRef = React.useRef(null);

  const openPayoutModal = () => {
    setPayoutModalOpen(true);
    setTimeout(() => {
      if (payoutRateInputRef.current) {
        payoutRateInputRef.current.focus();
        payoutRateInputRef.current.select();
      }
    }, 100);
  };
  const closePayoutModal = () => setPayoutModalOpen(false);
  // State and effects
  // Add 10 random game scores for testing
  const addRandomGames = () => {
    let newPlayers = [...players];
    let newGames = [...games];
    for (let i = 0; i < 10; i++) {
      const active = [...activePlayerIds];
      // Random winner and losers
      const winnerIdx = Math.floor(Math.random() * active.length);
      const scoreVal = Math.floor(Math.random() * 100 + 10);
      let gameScores = {};
      active.forEach((id, idx) => {
        if (idx === winnerIdx) {
          gameScores[id] = scoreVal * 3;
          newPlayers = newPlayers.map(p => p.id === id ? { ...p, score: p.score + scoreVal * 3 } : p);
        } else {
          gameScores[id] = -scoreVal;
          newPlayers = newPlayers.map(p => p.id === id ? { ...p, score: p.score - scoreVal } : p);
        }
      });
      newGames.push({ number: newGames.length + 1, scores: gameScores, active: [...active] });
    }
    setPlayers(newPlayers);
    setGames(newGames);
  };
  
  const [menuOpen, setMenuOpen] = useState(false);
  // Click-away to close menu
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest('.menu-popup') && !e.target.closest('.menu-btn')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);
  // Load from localStorage or use defaults
  // Store all rule data in a single object
  const RULES = ['mahjong', 'scrabble'];
  const defaultState = {
    mahjong: {
      players: defaultPlayers,
      activePlayerIds: ['p1', 'p2', 'p3', 'p4'],
      games: defaultGames,
    },
    scrabble: {
      players: defaultPlayers,
      activePlayerIds: ['p1', 'p2', 'p3', 'p4'],
      games: defaultGames,
    },
  };
  function loadRuleState(rule) {
    const players = localStorage.getItem(`${rule}_players`);
    const activePlayerIds = localStorage.getItem(`${rule}_activePlayerIds`);
    const games = localStorage.getItem(`${rule}_games`);
    return {
      players: players ? JSON.parse(players) : defaultPlayers,
      activePlayerIds: activePlayerIds ? JSON.parse(activePlayerIds) : ['p1', 'p2', 'p3', 'p4'],
      games: games ? JSON.parse(games) : defaultGames,
    };
  }
  const [allRuleState, setAllRuleState] = useState(() => {
    const state = {};
    for (const rule of RULES) {
      state[rule] = loadRuleState(rule);
    }
    return state;
  });
  // Save to localStorage on change
  useEffect(() => {
    for (const rule of RULES) {
      localStorage.setItem(`${rule}_players`, JSON.stringify(allRuleState[rule].players));
      localStorage.setItem(`${rule}_activePlayerIds`, JSON.stringify(allRuleState[rule].activePlayerIds));
      localStorage.setItem(`${rule}_games`, JSON.stringify(allRuleState[rule].games));
    }
  }, [allRuleState]);

  // When rule changes, ensure state is loaded from storage
  useEffect(() => {
    setAllRuleState(prev => ({
      ...prev,
      [scoreRule]: loadRuleState(scoreRule),
    }));
  }, [scoreRule]);

  // Helper accessors for current rule
  const players = allRuleState[scoreRule]?.players || defaultPlayers;
  const activePlayerIds = allRuleState[scoreRule]?.activePlayerIds || ['p1', 'p2', 'p3', 'p4'];
  const games = allRuleState[scoreRule]?.games || defaultGames;

  // Helper setters for current rule
  const setPlayers = (newPlayers) => {
    setAllRuleState(prev => ({
      ...prev,
      [scoreRule]: {
        ...prev[scoreRule],
        players: typeof newPlayers === 'function' ? newPlayers(prev[scoreRule].players) : newPlayers,
      },
    }));
  };
  const setActivePlayerIds = (newIds) => {
    setAllRuleState(prev => ({
      ...prev,
      [scoreRule]: {
        ...prev[scoreRule],
        activePlayerIds: typeof newIds === 'function' ? newIds(prev[scoreRule].activePlayerIds) : newIds,
      },
    }));
  };
  const setGames = (newGames) => {
    setAllRuleState(prev => ({
      ...prev,
      [scoreRule]: {
        ...prev[scoreRule],
        games: typeof newGames === 'function' ? newGames(prev[scoreRule].games) : newGames,
      },
    }));
  };
  const [modalOpen, setModalOpen] = useState(false);
  const [scoreInput, setScoreInput] = useState(0);
  const scoreInputRef = React.useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', sidebarCollapsed ? 'true' : 'false');
  }, [sidebarCollapsed]);
  const [toggles, setToggles] = useState(['none', 'none', 'none', 'none']);
  const [selfPick, setSelfPick] = useState(false);
  // Edit game modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editGameIdx, setEditGameIdx] = useState(null);
  const [editScoreInput, setEditScoreInput] = useState(0);
  const [editToggles, setEditToggles] = useState(['none', 'none', 'none', 'none']);
  const [editSelfPick, setEditSelfPick] = useState(false);
  const editScoreInputRef = React.useRef(null);
  // Chu-Chong multiplier setting
  const [chuChongMultiplier, setChuChongMultiplier] = useState(() => {
    const saved = Number(localStorage.getItem('chu_chong_multiplier'));
    if (Number.isFinite(saved)) {
      return Math.max(1, Math.min(3, saved));
    }
    return 2;
  });

  useEffect(() => {
    localStorage.setItem('chu_chong_multiplier', String(chuChongMultiplier));
  }, [chuChongMultiplier]);

  // Helper functions
  const getActivePlayers = () => players.filter(p => activePlayerIds.includes(p.id));
  const getInactivePlayers = () => players.filter(p => !activePlayerIds.includes(p.id));
  const getNextPlayerId = (playerList) => {
    const maxId = playerList.reduce((max, player) => {
      const numeric = Number.parseInt(String(player.id || '').replace(/^p/, ''), 10);
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    return `p${maxId + 1}`;
  };

  // Add player
  const addPlayer = () => {
    const name = prompt('Enter new player name:');
    if (!name) return;
    const newId = getNextPlayerId(players);
    setPlayers([...players, { id: newId, name, score: 0 }]);
  };

  // Remove player (inactive only, min 4 required)
  const removePlayer = (id) => {
    if (players.length <= 4) {
      alert('Minimum 4 players required.');
      return;
    }
    if (activePlayerIds.includes(id)) {
      alert('Cannot remove active player.');
      return;
    }
    const player = players.find(p => p.id === id);
    if (player && player.score !== 0) {
      alert('Cannot remove player with non-zero score.');
      return;
    }
    setPlayers(players.filter(p => p.id !== id));
  };

  // Change player name
  const changePlayerName = (id) => {
    const name = prompt('Enter new name:');
    if (!name) return;
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  // Drag and drop handler
  const onDragEnd = (result) => {
    if (!result.destination) return;
    // Only allow exactly 4 active players
    if (activePlayerIds.length !== 4) {
      setActivePlayerIds(activePlayerIds.slice(0, 4));
      return;
    }
    // Drag from active to inactive player slot
    if (result.source.droppableId === 'active-list' && result.destination.droppableId.startsWith('inactive-')) {
      const active = getActivePlayers();
      const inactivePlayers = getInactivePlayers();
      const draggedPlayer = active[result.source.index];
      const idx = parseInt(result.destination.droppableId.split('-')[1], 10);
      if (isNaN(idx)) return;
      const targetInactiveId = inactivePlayers[idx].id;
      // Swap IDs in activePlayerIds
      const newActiveIds = [...activePlayerIds];
      newActiveIds[result.source.index] = targetInactiveId;
      // Swap IDs in players array
      const newPlayers = players.map(p => {
        if (p.id === targetInactiveId) return { ...draggedPlayer };
        if (p.id === draggedPlayer.id) return { ...inactivePlayers[idx] };
        return p;
      });
      setActivePlayerIds(newActiveIds);
      setPlayers(newPlayers);
    }
  };

  // Modal logic
  const openModal = () => {
    setModalOpen(true);
    setTimeout(() => {
      if (scoreInputRef.current) {
        scoreInputRef.current.focus();
        scoreInputRef.current.select();
      }
    }, 100);
  };
  const closeModal = () => {
    setModalOpen(false);
    setScoreInput(0);
    setToggles(['none', 'none', 'none', 'none']);
    setSelfPick(false);
  };

  // Handle Enter key in modal
  const handleModalKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleScoreSubmit();
    }
  };

  // Score calculation logic
  const handleToggle = (idx) => {
    setToggles(toggles => {
      const hasWinner = toggles.includes('win');
      let newToggles = toggles.map((t, i) => {
        if (i !== idx) return t;
        if (hasWinner) {
          // Cycle: none -> lose -> win -> none
          if (t === 'none') return 'lose';
          if (t === 'lose') return 'win';
          if (t === 'win') return 'none';
        }
        else {
          // Cycle: none -> win -> lose -> none
          if (t === 'none') return 'win';
          if (t === 'win') return 'lose';
          if (t === 'lose') return 'none';
        }
        return 'none';
      });
      // If self-pick is enabled and a player is set to win, set all others to lose
      if (selfPick && newToggles.filter(t => t === 'win').length === 1) {
        newToggles = newToggles.map((t, i) => t === 'win' ? 'win' : 'lose');
      }
      return newToggles;
    });
  }

  const handleScoreSubmit = () => {
    // Validate toggles
    const winCount = toggles.filter(t => t === 'win').length;
    const loseCount = toggles.filter(t => t === 'lose').length;
    if (!((winCount === 1 && loseCount === 3) || (winCount === 1 && loseCount === 1))) {
      alert('Only 1 winner and either 3 or 1 losers allowed.');
      return;
    }
    // Calculate scores
    const activePlayers = getActivePlayers();
    let newPlayers = [...players];
    let gameScores = {};
    activePlayers.forEach((p, idx) => {
      let delta = 0;
      if (toggles[idx] === 'win') {
        if (selfPick) {
          delta = scoreInput * 3;
        } else {
          delta = winCount === 1 && loseCount === 3 ? scoreInput * 3 : scoreInput * chuChongMultiplier;
        }
      } else if (toggles[idx] === 'lose') {
        if (selfPick) {
          delta = -scoreInput;
        } else {
          delta = winCount === 1 && loseCount === 3 ? -scoreInput : -scoreInput * chuChongMultiplier;
        }
      }
      gameScores[p.id] = delta;
      // Update player score
      newPlayers = newPlayers.map(pl => pl.id === p.id ? { ...pl, score: pl.score + delta } : pl);
    });
    setPlayers(newPlayers);
    setGames([...games, { number: games.length + 1, scores: gameScores, active: [...activePlayerIds], selfPick }]);
    setToggles(['none', 'none', 'none', 'none']);
    setScoreInput(0);
    setSelfPick(false);
    closeModal();
  };
  // Edit game score logic
  const openEditModal = (idx) => {
    const game = games[idx];
    if (!game) return;
    setEditGameIdx(idx);
    // Use the players who were active in this game
    const activePlayers = players.filter(p => game.active.includes(p.id));
    let togglesArr = [];
    let winnerIdx = -1;
    let winnerVal = 0;
    activePlayers.forEach((p, i) => {
      const val = game.scores[p.id];
      if (val > 0) {
        togglesArr[i] = 'win';
        winnerIdx = i;
        winnerVal = val;
      } else if (val < 0) {
        togglesArr[i] = 'lose';
      } else {
        togglesArr[i] = 'none';
      }
    });
    // Infer score from winner's value and toggle count
    let scoreVal = 0;
    let isSelfPick = false;
    if (winnerIdx !== -1) {
      const winCount = togglesArr.filter(t => t === 'win').length;
      const loseCount = togglesArr.filter(t => t === 'lose').length;
      if (game.selfPick) {
        scoreVal = Math.abs(winnerVal / 3);
        isSelfPick = true;
      } else if (winCount === 1 && loseCount === 3) {
        scoreVal = Math.abs(winnerVal / 3);
      } else if (winCount === 1 && loseCount === 1) {
        scoreVal = Math.abs(winnerVal / chuChongMultiplier);
      }
    }
    setEditScoreInput(scoreVal);
    setEditToggles(togglesArr);
    setEditSelfPick(isSelfPick);
    setEditModalOpen(true);
    setTimeout(() => {
      if (editScoreInputRef.current) {
        editScoreInputRef.current.focus();
        editScoreInputRef.current.select();
      }
    }, 100);
  };
  const closeEditModal = () => setEditModalOpen(false);
  const handleEditModalKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditScoreSubmit();
    }
  };
  const handleEditToggle = (idx) => {
    setEditToggles(prev => {
      const hasWinner = prev.includes('win');
      let next = prev.map((t, i) => {
        if (i !== idx) return t;
        if (hasWinner) {
          // Cycle: none -> lose -> win -> none
          if (t === 'none') return 'lose';
          if (t === 'lose') return 'win';
          if (t === 'win') return 'none';
        } else {
          // Cycle: none -> win -> lose -> none
          if (t === 'none') return 'win';
          if (t === 'win') return 'lose';
          if (t === 'lose') return 'none';
        }
        return 'none';
      });

      if (editSelfPick && next.filter(t => t === 'win').length === 1) {
        next = next.map(t => t === 'win' ? 'win' : 'lose');
      }
      return next;
    });
  };
  const handleEditScoreSubmit = () => {
    // Validate toggles
    const winCount = editToggles.filter(t => t === 'win').length;
    const loseCount = editToggles.filter(t => t === 'lose').length;
    if (!((winCount === 1 && loseCount === 3) || (winCount === 1 && loseCount === 1))) {
      alert('Only 1 winner and either 3 or 1 losers allowed.');
      return;
    }
    // Use the players who were active in this game
    const game = games[editGameIdx];
    const activePlayers = players.filter(p => game.active.includes(p.id));
    let newPlayers = [...players];
    let gameScores = {};
    activePlayers.forEach((p, idx) => {
      let delta = 0;
      if (editToggles[idx] === 'win') {
        if (editSelfPick) {
          delta = editScoreInput * 3;
        } else {
          delta = winCount === 1 && loseCount === 3 ? editScoreInput * 3 : editScoreInput * chuChongMultiplier;
        }
      } else if (editToggles[idx] === 'lose') {
        if (editSelfPick) {
          delta = -editScoreInput;
        } else {
          delta = winCount === 1 && loseCount === 3 ? -editScoreInput : -editScoreInput * chuChongMultiplier;
        }
      }
      gameScores[p.id] = delta;
    });
    // Adjust player scores: subtract old, add new
    const oldScores = game.scores;
    activePlayers.forEach((p, idx) => {
      const oldDelta = oldScores[p.id] || 0;
      const newDelta = gameScores[p.id];
      newPlayers = newPlayers.map(pl => pl.id === p.id ? { ...pl, score: pl.score - oldDelta + newDelta } : pl);
    });
    // Update games
    const newGames = [...games];
    newGames[editGameIdx] = { ...newGames[editGameIdx], scores: gameScores, selfPick: editSelfPick };
    setPlayers(newPlayers);
    setGames(newGames);
    setEditModalOpen(false);
  };

  // Calculate "other" score for a specific game
  const getOtherScoreForGame = (game) => {
    // Sum scores for players who played that game but are not currently active
    const notCurrentlyActive = game.active.filter(id => !activePlayerIds.includes(id));
    let sum = 0;
    notCurrentlyActive.forEach(id => {
      if (game.scores && typeof game.scores[id] === 'number') {
        sum += game.scores[id];
      }
    });
    return notCurrentlyActive.length > 0 ? sum : '-';
  };

  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        openModal();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  return (
    <div className="mahjong-app" style={{ position: 'relative', height: '100vh', boxSizing: 'border-box', paddingTop: '14px', display: 'flex', flexDirection: 'column' }}>
      <div className="add-player-container app-toolbar" style={{ gap: '1em', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="toolbar-left-anchor">
          <button className="menu-btn" onClick={() => setMenuOpen(m => !m)}>☰ Menu</button>
        </div>
        <button className="record-btn" onClick={openModal}>Record Game Score</button>
        {menuOpen && (
          <div className="menu-popup menu-popup--floating">
            <div className="menu-popup-header">
              <div className="menu-popup-title">Game Controls</div>
              <div className="menu-popup-subtitle">Quick actions and scoring settings</div>
            </div>
            <div className="menu-popup-actions">
              <button className="menu-popup-action" onClick={() => { setPlayers(defaultPlayers); setGames([]); setActivePlayerIds(['p1', 'p2', 'p3', 'p4']); setMenuOpen(false); }}>New Game</button>
              <button className="menu-popup-action" onClick={() => { addPlayer(); setMenuOpen(false); }}>Add Player</button>
              <button className="menu-popup-action menu-popup-action--warn" onClick={() => { setPlayers(players => players.map(p => ({ ...p, score: 0 }))); setGames([]); setMenuOpen(false); }}>Clear Scores</button>
            </div>
            <div className="menu-popup-divider" />
            <div className="menu-popup-settings">
              <label htmlFor="menu-score-rule-select" className="menu-popup-label">
                <span className="menu-popup-label-title">Score Rule</span>
                <select
                  className="menu-popup-select"
                  id="menu-score-rule-select"
                  value={scoreRule}
                  onChange={e => setScoreRule(e.target.value)}
                >
                  <option value="mahjong">Mahjong</option>
                  <option value="scrabble">Scrabble</option>
                </select>
              </label>
              <div className="menu-popup-group">
                <label className="menu-popup-group-label">Chu-Chong Multiplier:</label>
                <input
                  className="menu-popup-number"
                  type="number"
                  min={1}
                  max={3}
                  step={0.5}
                  value={chuChongMultiplier}
                  onChange={e => setChuChongMultiplier(Math.max(1, Math.min(3, Number(e.target.value))))}
                />
              </div>
              <div className="menu-popup-group">
                <label className="menu-popup-group-label">Font Size</label>
                <div className="menu-popup-range-row">
                  <input
                    className="menu-popup-range"
                    type="range"
                    min={1}
                    max={7}
                    step={0.05}
                    value={tableFontSize}
                    onChange={e => setTableFontSize(Number(e.target.value))}
                  />
                  <span className="menu-popup-range-value">{tableFontSize.toFixed(2)}em (1-7)</span>
                </div>
              </div>
            </div>
            <button
              className="menu-popup-action menu-popup-action--secondary"
              onClick={() => {
                window.open(mjRulesPdf, '_blank', 'noopener,noreferrer');
                setMenuOpen(false);
              }}
            >
              View Rules
            </button>
          </div>
        )}
      </div>
      <div className="main-layout" style={{ display: 'flex', alignItems: 'stretch', flex: 1, minHeight: 0 }}>
        <div className="game-grid" style={{ flex: 1, minHeight: 0 }}>
          <table className="score-table">
            <thead>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="header-list" direction="horizontal">
                  {(provided) => (
                    <tr ref={provided.innerRef} {...provided.droppableProps}>
                      <th style={{ width: '60px' }}>#</th>
                      {getActivePlayers().map((p, idx) => (
                        <Draggable key={p.id} draggableId={p.id} index={idx}>
                          {(provided) => (
                            <th
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <span
                                className="score-header-player-name"
                                style={{ fontSize: `${tableFontSize}em` }}
                                onClick={() => changePlayerName(p.id)}
                              >
                                {p.name}
                              </span>
                              <br />
                              <span
                                className={`score-box score-header-total${p.score < 0 ? ' negative' : ''}`}
                                style={{
                                  fontSize: `${tableFontSize * 1.15}em`,
                                  fontWeight: 900,
                                  background: p.score < 0 ? '#ffd6d6' : '#c6f7e2',
                                }}
                                title="Record score for this player"
                                onClick={() => {
                                  if (scoreRule === 'scrabble') {
                                    setScrabblePopup(true);
                                    setModalOpen(true);
                                  } else {
                                    setModalOpen(true);
                                    setToggles(getActivePlayers().map(pp => pp.id === p.id ? 'win' : 'none'));
                                    setTimeout(() => {
                                      if (scoreInputRef && scoreInputRef.current) {
                                        scoreInputRef.current.focus();
                                        scoreInputRef.current.select();
                                      }
                                    }, 100);
                                  }
                                }}
                              >
                                {p.score}
                              </span>
                            </th>
                          )}
                        </Draggable>
                      ))}
                      <th style={{ width: '60px' }}>Other</th>
                      {provided.placeholder}
                    </tr>
                  )}
                </Droppable>
                {/* Sidebar droppable for player removal (Scrabble only) */}
                {/* Removed drag-to-remove row from main table header. Player removal is now only by dragging from main table header to the inactive player area in the sidebar. */}
              </DragDropContext>
            </thead>
            <tbody>
              {[...games].reverse().map((game, idx, arr) => {
                return (
                  <tr key={idx}>
                    <td className="game-number-cell" onClick={() => openEditModal(games.length - 1 - idx)}>{game.number}</td>
                    {getActivePlayers().map((p, i) => {
                      if (game.active.includes(p.id)) {
                        const val = game.scores[p.id];
                        return (
                          <td key={p.id}>
                            <span className={`score-box score-box-history${val > 0 ? ' positive' : val < 0 ? ' negative' : ''}`}
                              style={{ fontSize: `${tableFontSize}em` }}
                            >{val}</span>
                          </td>
                        );
                      } else {
                        return <td key={p.id}>-</td>;
                      }
                    })}
                    <td>
                      {(() => {
                        const otherScore = getOtherScoreForGame(game);
                        if (typeof otherScore === 'number') {
                          return <span className={`score-box score-box-history${otherScore > 0 ? ' positive' : otherScore < 0 ? ' negative' : ''}`}
                            style={{ fontSize: `${tableFontSize}em` }}
                          >{otherScore}</span>;
                        }
                        return otherScore;
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="sidebar-shell" style={{ position: 'relative', width: sidebarCollapsed ? '36px' : '260px', height: '100%', flex: '0 0 auto', transition: 'width 0.2s ease' }}>
          <button
            className="sidebar-toggle-btn"
            type="button"
            onClick={() => setSidebarCollapsed(v => !v)}
            title={sidebarCollapsed ? 'Expand right pane' : 'Collapse right pane'}
            style={{
              left: sidebarCollapsed ? '-10px' : '-24px',
            }}
          >
            {sidebarCollapsed ? '◀' : '▶'}
          </button>
        {!sidebarCollapsed && (
        <div className="sidebar sidebar-panel">
          <h2>Players</h2>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="active-list" direction="horizontal">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="active-list active-list--spaced">
                  {getActivePlayers().map((p, idx) => (
                    <Draggable key={p.id} draggableId={p.id} index={idx}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="active-player active-player-tile"
                          style={{
                            ...provided.draggableProps.style,
                          }}
                          onMouseEnter={e => {
                            const icon = e.currentTarget.querySelector('.remove-active-icon');
                            if (icon) icon.style.transform = 'translateX(0)';
                            if (icon) icon.style.opacity = 1;
                          }}
                          onMouseLeave={e => {
                            const icon = e.currentTarget.querySelector('.remove-active-icon');
                            if (icon) icon.style.transform = 'translateX(40px)';
                            if (icon) icon.style.opacity = 0;
                          }}
                        >
                          {/* Remove icon, animated from left, on top of tile */}
                          <span
                            className="remove-active-icon"
                            title="Set player as inactive"
                            onClick={() => {
                              if (activePlayerIds.length <= 2) {
                                alert('Minimum 2 active players required.');
                                return;
                              }
                              setActivePlayerIds(activePlayerIds.filter(id => id !== p.id));
                            }}
                          >
                            &minus;
                          </span>
                          {/* Player tile content, unchanged style */}
                          <span className="active-player-name" onClick={() => changePlayerName(p.id)}>{p.name}</span>
                          <span className="active-player-score">({p.score})</span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            <div className="inactive-list">
              {getInactivePlayers().map((p, idx) => (
                <Droppable droppableId={`inactive-${idx}`} key={`${p.id}-${idx}`}>
                  {(provided, snapshot) => {
                    // Color and size based on score
                    let bg = '#f5f8ff';
                    let border = '2px solid #e0e0e0';
                    if (typeof p.score === 'number') {
                      if (p.score > 0) {
                        bg = '#d4f8e8';
                        border = '2px solid #4caf50';
                      } else if (p.score < 0) {
                        bg = '#ffe0e0';
                        border = '2px solid #f44336';
                      }
                    }
                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="inactive-player"
                        style={{
                          background: snapshot.isDraggingOver ? '#ffe0e0' : bg,
                          border,
                        }}
                      >
                        {/* Player info area (75%) */}
                        <div className="inactive-player-info">
                          <span className="inactive-player-name">{p.name}</span>
                          <span className={`inactive-player-score${p.score < 0 ? ' negative' : p.score > 0 ? ' positive' : ''}`}>{p.score}</span>
                        </div>
                        {/* Button area (25%) */}
                        <div className="inactive-player-actions">
                          <button
                            className="inactive-player-action-btn add-inactive-icon"
                            title="Add player back to game"
                            onClick={() => {
                              if (!activePlayerIds.includes(p.id)) {
                                setActivePlayerIds([...activePlayerIds, p.id]);
                              }
                            }}
                          >
                            +
                          </button>
                          <button
                            className="inactive-player-action-btn remove-inactive-icon"
                            title="Remove player"
                            onClick={() => removePlayer(p.id)}
                          >
                            -
                          </button>
                        </div>
                        {provided.placeholder}
                      </div>
                    );
                  }}
                </Droppable>
              ))}
              <div className="payout-wrap">
                <button className="payout-btn" onClick={openPayoutModal}>
                  Calculate Payout
                </button>
              </div>
            </div>
          </DragDropContext>
        </div>
        )}
        </div>
      </div>

      <div className="mobile-quickbar" aria-label="Quick actions">
        <button className="mobile-quickbar-btn" onClick={() => setMenuOpen(m => !m)}>Menu</button>
        <button className="mobile-quickbar-btn mobile-quickbar-btn--primary" onClick={openModal}>Record Score</button>
      </div>
        
  <Modal isOpen={modalOpen} onRequestClose={closeModal} ariaHideApp={false} className="modal-card modal-card--score" overlayClassName="modal-overlay" style={{ content: { position: 'relative', minHeight: '380px' } }}>
  <h2 className="modal-title">Record Game Score</h2>
  {/* Scrabble rule: per-player score entry, no Chu-Chong button */}
  {scoreRule === 'scrabble' && scrabblePopup ? (
    <div
      className="modal-panel modal-focus-capture"
      tabIndex={0}
      onKeyDown={e => {
        const active = getActivePlayers();
        // Find focused input index
        const idx = scrabbleInputRefs.current.findIndex(ref => ref && ref === document.activeElement);
        if (e.key === 'Tab') {
          e.preventDefault();
          let nextIdx;
          if (e.shiftKey) {
            nextIdx = idx > 0 ? idx - 1 : active.length - 1;
          } else {
            nextIdx = idx < active.length - 1 ? idx + 1 : 0;
          }
          if (scrabbleInputRefs.current[nextIdx]) {
            scrabbleInputRefs.current[nextIdx].focus();
            scrabbleInputRefs.current[nextIdx].select();
          }
        } else if (e.key === 'Enter') {
          // Submit if all have scores
          const allHaveScore = active.every(p => scrabbleRoundScores[p.id] !== undefined && scrabbleRoundScores[p.id] !== '');
          if (allHaveScore) {
            // Trigger submit button
            document.getElementById('scrabble-submit-btn')?.click();
          }
        }
      }}
      // Autofocus first input when popup opens
      ref={el => {
        if (el && scrabblePopup) {
          setTimeout(() => {
            if (scrabbleInputRefs.current[0]) {
              scrabbleInputRefs.current[0].focus();
              scrabbleInputRefs.current[0].select();
            }
          }, 100);
        }
      }}
    >
      <div className="scrabble-grid">
        {getActivePlayers().map((p, idx) => (
          <div key={p.id} className="scrabble-entry">
            <span className="scrabble-entry-name">{p.name}</span>
            <input
              className="scrabble-entry-input"
              type="number"
              value={scrabbleRoundScores[p.id] !== undefined ? scrabbleRoundScores[p.id] : ''}
              onChange={e => {
                const val = e.target.value;
                setScrabbleRoundScores(scores => ({ ...scores, [p.id]: val === '' ? '' : Number(val) }));
              }}
              placeholder="Score"
              tabIndex={idx}
              ref={el => scrabbleInputRefs.current[idx] = el}
              onFocus={e => e.target.select()}
            />
          </div>
        ))}
      </div>
      <div className="modal-actions modal-actions--stack">
        <button
          className="modal-submit-btn"
          id="scrabble-submit-btn"
          onClick={() => {
            // Validate all players have a score
            const active = getActivePlayers();
            const allHaveScore = active.every(p => scrabbleRoundScores[p.id] !== undefined && scrabbleRoundScores[p.id] !== '');
            if (!allHaveScore) {
              alert('All players must have a score.');
              return;
            }
            // Add round to history
            let newPlayers = [...players];
            let gameScores = {};
            active.forEach(p => {
              const delta = Number(scrabbleRoundScores[p.id]);
              gameScores[p.id] = delta;
              newPlayers = newPlayers.map(pl => pl.id === p.id ? { ...pl, score: pl.score + delta } : pl);
            });
            setPlayers(newPlayers);
            setGames([...games, { number: games.length + 1, scores: gameScores, active: [...activePlayerIds], rule: 'scrabble' }]);
            setScrabbleRoundScores({});
            setScrabblePopup(false);
            setModalOpen(false);
          }}
        >Submit</button>
        <div className="modal-actions-row">
          <button className="modal-neutral-btn" onClick={() => { setModalOpen(false); setScrabblePopup(false); setScrabbleRoundScores({}); }}>Cancel</button>
          <button className="modal-neutral-btn" onClick={() => setScrabbleRoundScores({})}>Clear</button>
        </div>
      </div>
    </div>
  ) : (
    // Mahjong rule: original popup
    <div className="modal-panel modal-focus-capture" onKeyDown={e => { if (e.key === 'Enter') handleScoreSubmit(); }} tabIndex={0}>
      <div className="modal-score-row modal-score-row-gap modal-score-emphasis">
        <label className="modal-score-label">Score Entry
          <input
          className="modal-score-input modal-score-input-hero"
          type="number"
          value={scoreInput}
          ref={scoreInputRef}
          onChange={e => setScoreInput(Number(e.target.value))}
          onClick={e => e.target.select()}
          tabIndex={0}
          />
        </label>
        <button
          className="modal-toggle-btn modal-mode-toggle"
          type="button"
          tabIndex={1}
          onClick={() => {
            setSelfPick(sp => {
              const next = !sp;
              setToggles(toggles => {
                if (toggles.filter(t => t === 'win').length === 1) {
                  if (next) {
                    // Self-pick: set all others to lose
                    return toggles.map(t => t === 'win' ? 'win' : 'lose');
                  } else {
                    // Chu-chong: set all others to none
                    return toggles.map(t => t === 'win' ? 'win' : 'none');
                  }
                }
                return toggles;
              });
              return next;
            });
          }}
          style={{
            marginLeft: '0.5em',
            background: selfPick ? '#1976d2' : '#e0e0e0',
            color: selfPick ? '#fff' : '#333',
            minWidth: '90px',
          }}
        >
          {selfPick ? '自摸 (Self-pick)' : '出冲 (Chu-Chong)'}
        </button>
      </div>
      <div className="modal-section-top-gap">
        <div className="modal-toggle-grid">
          {getActivePlayers().map((p, idx) => {
            let bg = '#e0e0e0';
            let color = '#333';
            if (toggles[idx] === 'win') {
              bg = '#4caf50';
              color = '#fff';
            } else if (toggles[idx] === 'lose') {
              bg = '#f44336';
              color = '#fff';
            }
            return (
              <button
                className="modal-toggle-player-btn"
                key={p.id}
                type="button"
                tabIndex={2 + idx}
                onClick={() => handleToggle(idx)}
                style={{
                  background: bg,
                  color,
                }}
                title={`Toggle win/lose/none for ${p.name}`}
              >
                <span className="modal-toggle-player-name">{p.name}</span>
                <span className="modal-toggle-player-state">{toggles[idx]}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="modal-actions modal-actions--stack">
        <button className="modal-submit-btn" onClick={handleScoreSubmit}>Submit</button>
        <div className="modal-actions-row">
          <button className="modal-neutral-btn" onClick={closeModal}>Cancel</button>
          <button onClick={() => {
            setScoreInput(0);
            setToggles(['none', 'none', 'none', 'none']);
            setSelfPick(false);
          }} className="modal-neutral-btn">Clear</button>
        </div>
      </div>
    </div>
  )}
      </Modal>
        {/* Edit previous game modal */}
      {/* Calculate payout modal */}
      <Modal isOpen={payoutModalOpen} onRequestClose={closePayoutModal} ariaHideApp={false} className="modal-card modal-card--payout" overlayClassName="modal-overlay" style={{ content: { minWidth: '340px', minHeight: '320px', maxWidth: '420px', margin: 'auto', borderRadius: '12px' } }}>
        <h2 className="modal-title">Calculate Payout</h2>
        <div className="payout-rate-row">
          <label>Rate: <input
            className="modal-score-input payout-rate-input"
            type="number"
            value={payoutRate}
            ref={payoutRateInputRef}
            min={0.01}
            step={0.01}
            onChange={e => {
              const val = Number(e.target.value);
              setPayoutRate(val > 0 ? val : 1);
            }}
          /></label>
          {payoutRate === 0 && (
            <div className="payout-rate-error">
              Payout rate cannot be zero.
            </div>
          )}
        </div>
        <table className="payout-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', fontWeight: 600, fontSize: '1.1em' }}>Player</th>
              <th style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.1em' }}>Score</th>
              <th style={{ textAlign: 'right', fontWeight: 600, fontSize: '1.1em' }}>Payout</th>
              <th style={{ textAlign: 'center', fontWeight: 600, fontSize: '1.1em' }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => {
              let payout = 0;
              if (payoutRate > 0) {
                payout = p.score / payoutRate;
              }
              return (
                <tr key={p.id}>
                  <td style={{ textAlign: 'left', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ textAlign: 'right' }}>{p.score}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: payout > 0 ? '#388e3c' : payout < 0 ? '#d32f2f' : '#333' }}>
                    {payoutRate > 0 ? payout.toFixed(2) : '--'}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {payoutRate > 0 ? (payout > 0 ? 'Win' : payout < 0 ? 'Lose' : '-') : '--'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="payout-close-wrap">
          <button className="payout-close-btn" onClick={closePayoutModal}>Close</button>
        </div>
      </Modal>
        <Modal isOpen={editModalOpen} onRequestClose={closeEditModal} ariaHideApp={false} className="modal-card modal-card--edit" overlayClassName="modal-overlay">
          <h2 className="modal-title">Edit Game #{editGameIdx !== null ? games[editGameIdx].number : ''}</h2>
          <div className="modal-score-row modal-score-row-gap">
            <label>Score: <input
              className="modal-score-input"
              type="number"
              value={editScoreInput}
              ref={editScoreInputRef}
              onChange={e => setEditScoreInput(Number(e.target.value))}
              onClick={e => e.target.select()}
            /></label>
            <button
              className="modal-toggle-btn"
              type="button"
              onClick={() => {
                setEditSelfPick(sp => {
                  const next = !sp;
                  setEditToggles(editToggles => {
                    if (editToggles.filter(t => t === 'win').length === 1) {
                      if (next) {
                        // Self-pick: set all others to lose
                        return editToggles.map(t => t === 'win' ? 'win' : 'lose');
                      } else {
                        // Chu-chong: set all others to none
                        return editToggles.map(t => t === 'win' ? 'win' : 'none');
                      }
                    }
                    return editToggles;
                  });
                  return next;
                });
              }}
              style={{
                marginLeft: '0.5em',
                background: editSelfPick ? '#1976d2' : '#e0e0e0',
                color: editSelfPick ? '#fff' : '#333',
                minWidth: '90px',
              }}
            >
              {editSelfPick ? '自摸 (Self-pick)' : '出冲 (Chu-Chong)'}
            </button>
          </div>
          <div className="modal-section-top-gap">
            {editGameIdx !== null && games[editGameIdx] && players.filter(p => games[editGameIdx].active.includes(p.id)).map((p, idx) => {
              let label = '';
              if (editToggles[idx] === 'win') {
                label = editSelfPick ? editScoreInput * 3 : (editToggles.filter(t => t === 'lose').length === 3 ? editScoreInput * 3 : editScoreInput * chuChongMultiplier);
              } else if (editToggles[idx] === 'lose') {
                label = editSelfPick ? -editScoreInput : (editToggles.filter(t => t === 'lose').length === 3 ? -editScoreInput : -editScoreInput * chuChongMultiplier);
              }
              return (
                <div key={p.id} className="edit-player-row">
                  <span className="edit-player-name" onClick={() => changePlayerName(p.id)}>{p.name}</span>
                  <button 
                    className="edit-toggle-btn"
                    onClick={() => handleEditToggle(idx)}
                    style={{
                      width: '90px',
                      background: editToggles[idx] === 'win' ? '#4caf50' : editToggles[idx] === 'lose' ? '#f44336' : undefined,
                      color: editToggles[idx] === 'win' || editToggles[idx] === 'lose' ? '#fff' : undefined,
                      justifySelf: 'center',
                    }}
                  >
                    {editToggles[idx]}
                  </button>
                  <span className="edit-player-label">{label !== '' ? label : ''}</span>
                </div>
              );
            })}
          </div>
          <div className="modal-actions-row modal-actions-row-top">
            <button onClick={handleEditScoreSubmit}>Save</button>
            <button className="modal-btn-shift" onClick={closeEditModal}>Cancel</button>
          </div>
          <div className="modal-focus-capture" tabIndex={0} onKeyDown={handleEditModalKeyDown} />
        </Modal>
    </div>
  );
}

export default App;
