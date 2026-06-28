import React, { useState, useEffect, useMemo } from 'react';
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
      return Math.max(1, Math.min(4, saved));
    }
    return 4;
  });
  useEffect(() => {
    localStorage.setItem('table_font_size', String(tableFontSize));
  }, [tableFontSize]);
  // Payout modal state
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutRate, setPayoutRate] = useState(1);
  const [hoveredRound, setHoveredRound] = useState(null);
  const [hoveredChartX, setHoveredChartX] = useState(null);
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
  const [activeView, setActiveView] = useState('board');
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  // Add player
  const addPlayer = () => {
    const name = prompt('Enter new player name:');
    if (!name) return;
    const newId = 'p' + (players.length + 1);
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

  const summary = useMemo(() => {
    const colorPalette = ['#1f77b4', '#2ca02c', '#d62728', '#ff7f0e', '#17becf', '#8c564b', '#bcbd22', '#e377c2'];
    const summaryPlayers = players.filter(p => activePlayerIds.includes(p.id));
    const statsById = {};

    summaryPlayers.forEach((p, idx) => {
      statsById[p.id] = {
        id: p.id,
        name: p.name,
        wins: 0,
        losses: 0,
        selfPickWins: 0,
        selfPickLosses: 0,
        chuChongWins: 0,
        chuChongLosses: 0,
        best: Number.NEGATIVE_INFINITY,
        worst: Number.POSITIVE_INFINITY,
        playedRounds: 0,
        cumulative: 0,
        series: [],
        color: colorPalette[idx % colorPalette.length],
      };
    });

    let selfPickCount = 0;
    let chuChongCount = 0;

    games.forEach((game, roundIdx) => {
      if (scoreRule === 'mahjong') {
        if (game.selfPick) {
          selfPickCount += 1;
        } else {
          chuChongCount += 1;
        }
      }

      summaryPlayers.forEach(p => {
        const info = statsById[p.id];
        const played = game.active.includes(p.id);
        const delta = played ? Number(game.scores?.[p.id] || 0) : 0;

        if (game.active.includes(p.id)) {
          info.playedRounds += 1;
          if (delta > 0) info.wins += 1;
          if (delta < 0) info.losses += 1;
          if (scoreRule === 'mahjong') {
            if (game.selfPick) {
              if (delta > 0) info.selfPickWins += 1;
              if (delta < 0) info.selfPickLosses += 1;
            } else {
              if (delta > 0) info.chuChongWins += 1;
              if (delta < 0) info.chuChongLosses += 1;
            }
          }
          info.best = Math.max(info.best, delta);
          info.worst = Math.min(info.worst, delta);
        }

        info.cumulative += delta;
        info.series.push({ x: roundIdx + 1, y: info.cumulative, delta, played });
      });
    });

    const playerRows = summaryPlayers.map(p => {
      const info = statsById[p.id];
      const winRate = info.playedRounds > 0 ? (info.wins / info.playedRounds) * 100 : 0;
      return {
        ...info,
        winRate,
        best: info.best === Number.NEGATIVE_INFINITY ? 0 : info.best,
        worst: info.worst === Number.POSITIVE_INFINITY ? 0 : info.worst,
      };
    });

    return {
      totalRounds: games.length,
      selfPickCount,
      chuChongCount,
      playerRows,
    };
  }, [players, activePlayerIds, games, scoreRule]);

  const renderLinePath = (series, totalRounds, minY, maxY) => {
    if (!series.length) return '';
    const width = 900;
    const height = 280;
    const padX = 48;
    const padY = 24;
    const yRange = Math.max(1, maxY - minY);

    const toX = (round) => {
      if (totalRounds <= 1) return padX;
      return padX + ((round - 1) / (totalRounds - 1)) * (width - padX * 2);
    };
    const toY = (value) => padY + ((maxY - value) / yRange) * (height - padY * 2);

    return series.map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(point.x)} ${toY(point.y)}`).join(' ');
  };

  const getChartHoverData = (event, totalRounds) => {
    const width = 900;
    const padX = 48;
    const svg = event.currentTarget;
    if (!svg || totalRounds < 1) return null;

    const ctm = svg.getScreenCTM();
    if (!ctm) return null;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const svgPoint = point.matrixTransform(ctm.inverse());
    const clampedX = Math.max(padX, Math.min(width - padX, svgPoint.x));

    if (totalRounds <= 1) {
      return { round: 1, x: padX };
    }

    const round = Math.round(((clampedX - padX) / (width - padX * 2)) * (totalRounds - 1) + 1);
    return {
      round: Math.max(1, Math.min(totalRounds, round)),
      x: clampedX,
    };
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
      <div className="add-player-container" style={{ gap: '1em', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0 }}>
          <button className="menu-btn" onClick={() => setMenuOpen(m => !m)} style={{ minWidth: '120px' }}>☰ Menu</button>
        </div>
        <button
          onClick={() => {
            if (activeView === 'summary') {
              setActiveView('board');
              return;
            }
            openModal();
          }}
          style={{ minWidth: '180px', margin: '0 40px' }}
        >
          {activeView === 'summary' ? 'Back To Scoreboard' : 'Record Game Score'}
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute',
            top: '2.5em',
            left: 0,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            minWidth: '220px',
            padding: '1em',
            zIndex: 2000
          }} className="menu-popup">
            <button style={{ width: '100%', marginBottom: '0.5em' }} onClick={() => { setPlayers(defaultPlayers); setGames([]); setActivePlayerIds(['p1', 'p2', 'p3', 'p4']); setMenuOpen(false); }}>New Game</button>
            <button style={{ width: '100%', marginBottom: '0.5em' }} onClick={() => { const name = prompt('Enter new player name:'); if (name) setPlayers(players => [...players, { id: 'p' + (players.length + 1), name, score: 0 }]); setMenuOpen(false); }}>Add Player</button>
            <button style={{ width: '100%', marginBottom: '0.5em' }} onClick={() => { setPlayers(players => players.map(p => ({ ...p, score: 0 }))); setGames([]); setMenuOpen(false); }}>Clear Scores</button>
            <button
              style={{ width: '100%', marginBottom: '0.5em' }}
              onClick={() => {
                setActiveView('summary');
                setMenuOpen(false);
              }}
            >
              View Summary
            </button>
            <label htmlFor="menu-score-rule-select" style={{ width: '100%', display: 'block', marginBottom: '0.5em', fontWeight: 600, color: '#1976d2' }}>
              <span style={{ display: 'block', marginBottom: '0.2em' }}>Score Rule</span>
              <select
                id="menu-score-rule-select"
                value={scoreRule}
                onChange={e => setScoreRule(e.target.value)}
                style={{ width: '100%', fontWeight: 700, fontSize: '1em', padding: '0.3em 0.6em', borderRadius: '6px', border: '1px solid #1976d2', background: '#fff', color: '#1976d2' }}
              >
                <option value="mahjong">Mahjong</option>
                <option value="scrabble">Scrabble</option>
              </select>
            </label>
            <div style={{ width: '100%', marginBottom: '0.6em' }}>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: '0.3em', color: '#222', fontSize: '1em' }}>Chu-Chong Multiplier:</label>
              <input
                type="number"
                min={1}
                max={3}
                step={0.5}
                value={chuChongMultiplier}
                onChange={e => setChuChongMultiplier(Math.max(1, Math.min(3, Number(e.target.value))))}
                style={{ width: '80px', background: '#e3f2fd', fontWeight: 600 }}
              />
            </div>
            <div style={{ width: '100%', marginBottom: '0.7em' }}>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: '0.3em' }}>Font Size:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7em' }}>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={0.05}
                  value={tableFontSize}
                  onChange={e => setTableFontSize(Number(e.target.value))}
                  style={{ verticalAlign: 'middle', flex: 1 }}
                />
                <span style={{ fontWeight: 500, minWidth: '58px', textAlign: 'right' }}>{tableFontSize.toFixed(2)}em</span>
              </div>
            </div>
            <button
              style={{ width: '100%' }}
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
      <div className="main-layout" style={{ display: activeView === 'board' ? 'flex' : 'none', alignItems: 'stretch', flex: 1, minHeight: 0 }}>
        <div className="game-grid" style={{ flex: 1, minHeight: 0 }}>
          <table>
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
                                style={{
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  fontWeight: 700,
                                  color: '#1a5fc2',
                                  fontSize: `${tableFontSize}em`,
                                  lineHeight: '1.2',
                                  display: 'inline-block',
                                  marginBottom: '2px'
                                }}
                                onClick={() => changePlayerName(p.id)}
                              >
                                {p.name}
                              </span>
                              <br />
                              <span
                                className={`score-box${p.score < 0 ? ' negative' : ''}`}
                                style={{
                                  fontSize: `${tableFontSize * 1.15}em`,
                                  fontWeight: 900,
                                  background: p.score < 0 ? '#ffd6d6' : '#c6f7e2',
                                  boxShadow: '0 2px 8px rgba(44,130,201,0.08)',
                                  border: '2px solid #1a5fc2',
                                  padding: '4px 12px',
                                  marginTop: '2px',
                                  display: 'inline-block',
                                  borderRadius: '8px',
                                  cursor: 'pointer'
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
              {[...games].reverse().map((game, idx) => (
                <tr key={idx}>
                  <td style={{ cursor: 'pointer', textDecoration: 'underline', color: '#2d7ff9' }} onClick={() => openEditModal(games.length - 1 - idx)}>{game.number}</td>
                    {getActivePlayers().map((p, i) => {
                      if (game.active.includes(p.id)) {
                        const val = game.scores[p.id];
                        return (
                          <td key={p.id}>
                            <span className={`score-box${val < 0 ? ' negative' : ''}`}
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
                          return <span className={`score-box${otherScore < 0 ? ' negative' : ''}`}
                            style={{ fontSize: `${tableFontSize}em` }}
                          >{otherScore}</span>;
                        }
                        return otherScore;
                      })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ position: 'relative', width: sidebarCollapsed ? '36px' : '260px', height: '100%', flex: '0 0 auto', transition: 'width 0.2s ease' }}>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(v => !v)}
            title={sidebarCollapsed ? 'Expand right pane' : 'Collapse right pane'}
            style={{
              position: 'absolute',
              left: sidebarCollapsed ? '-10px' : '-24px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '2px solid #0d47a1',
              background: '#1976d2',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.1em',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 30,
              padding: 0,
              lineHeight: 1,
            }}
          >
            {sidebarCollapsed ? '◀' : '▶'}
          </button>
        {!sidebarCollapsed && (
        <div className="sidebar" style={{ width: '100%', background: '#f7faff', borderLeft: '1px solid #e0e0e0', height: '100%', minHeight: 0, position: 'relative', overflowY: 'auto', overflowX: 'hidden', padding: '20px 10px 10px 16px' }}>
          <h2>Players</h2>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="active-list" direction="horizontal">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="active-list" style={{ display: 'flex', gap: '8px', marginTop: '1em' }}>
                  {getActivePlayers().map((p, idx) => (
                    <Draggable key={p.id} draggableId={p.id} index={idx}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="active-player"
                          style={{
                            position: 'relative',
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
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              opacity: 0,
                              transform: 'translateX(40px)',
                              transition: 'opacity 0.2s, transform 0.25s cubic-bezier(0.4,0,0.2,1)',
                              cursor: 'pointer',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              background: '#f44336',
                              color: '#fff',
                              fontWeight: 900,
                              fontSize: '1.5em',
                              boxShadow: '0 1px 4px rgba(44,130,201,0.10)',
                              border: 'none',
                              zIndex: 2,
                            }}
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
                          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => changePlayerName(p.id)}>{p.name}</span>
                          <span style={{ marginLeft: '0.5em', color: '#555', fontSize: '0.95em' }}>({p.score})</span>
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
                <Droppable droppableId={`inactive-${idx}`} key={p.id}>
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
                          transition: 'background 0.2s',
                          minHeight: '44px',
                          fontSize: '1em',
                          padding: '0.45em 0.65em',
                          borderRadius: '10px',
                          boxShadow: '0 1px 6px rgba(44,130,201,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          border,
                          marginBottom: '0.5em',
                          position: 'relative',
                        }}
                      >
                        {/* Player info area (75%) */}
                        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                          <span style={{ fontWeight: 700, fontSize: '1.18em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                          <span style={{ fontWeight: 900, color: p.score < 0 ? '#d32f2f' : p.score > 0 ? '#388e3c' : '#222', fontSize: '1.18em' }}>{p.score}</span>
                        </div>
                        {/* Button area (25%) */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'space-between', height: '100%', minWidth: '36px', gap: '4px', marginLeft: '8px' }}>
                          <button
                            className="add-inactive-icon"
                            style={{
                              width: '100%',
                              height: '24px',
                              background: '#4caf50',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '1.1em',
                              cursor: 'pointer',
                              marginBottom: '2px',
                              boxShadow: '0 1px 4px rgba(44,130,201,0.10)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
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
                            style={{
                              width: '100%',
                              height: '24px',
                              background: '#f44336',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '1.1em',
                              cursor: 'pointer',
                              marginTop: '2px',
                              boxShadow: '0 1px 4px rgba(44,130,201,0.10)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
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
              <div style={{ textAlign: 'center', marginTop: '1.5em' }}>
                <button onClick={openPayoutModal} style={{ background: '#1976d2', color: '#fff', fontWeight: 600, fontSize: '1.02em', borderRadius: '8px', padding: '0.5em 1.1em', border: 'none', boxShadow: '0 2px 8px rgba(44,130,201,0.08)', marginBottom: '1em' }}>
                  Calculate Payout
                </button>
              </div>
            </div>
          </DragDropContext>
        </div>
        )}
        </div>
      </div>

      {activeView === 'summary' && (
        <div className="summary-view">
          <div className="summary-header">
            <h2>Game Summary</h2>
            <span className="summary-rule-badge">Rule: {scoreRule === 'mahjong' ? 'Mahjong' : 'Scrabble'}</span>
          </div>

          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-label">Total Rounds</div>
              <div className="summary-value">{summary.totalRounds}</div>
            </div>
            {scoreRule === 'mahjong' && (
              <>
                <div className="summary-card">
                  <div className="summary-label">Self-Pick Rounds</div>
                  <div className="summary-value">{summary.selfPickCount}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Chu-Chong Rounds</div>
                  <div className="summary-value">{summary.chuChongCount}</div>
                </div>
              </>
            )}
          </div>

          <div className="summary-table-wrap">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Win</th>
                  <th>Loss</th>
                  <th>Win Rate</th>
                  <th>Best Round</th>
                  <th>Worst Round</th>
                  <th>Current Score</th>
                </tr>
              </thead>
              <tbody>
                {summary.playerRows.map(row => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 700 }}>{row.name}</td>
                    <td>
                      <div>{row.wins}</div>
                      {scoreRule === 'mahjong' && (
                        <div className="summary-split-meta">SP {row.selfPickWins} | CC {row.chuChongWins}</div>
                      )}
                    </td>
                    <td>
                      <div>{row.losses}</div>
                      {scoreRule === 'mahjong' && (
                        <div className="summary-split-meta">SP {row.selfPickLosses} | CC {row.chuChongLosses}</div>
                      )}
                    </td>
                    <td>{row.winRate.toFixed(1)}%</td>
                    <td>
                      <span className={`score-box${row.best < 0 ? ' negative' : ''}`}>{row.best}</span>
                    </td>
                    <td>
                      <span className={`score-box${row.worst < 0 ? ' negative' : ''}`}>{row.worst}</span>
                    </td>
                    <td>
                      <span className={`score-box${row.cumulative < 0 ? ' negative' : ''}`}>{row.cumulative}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="summary-chart-wrap">
            <h3>Cumulative Score By Round</h3>
            {summary.totalRounds === 0 ? (
              <div className="summary-empty">No rounds recorded yet.</div>
            ) : (
              <>
                {(() => {
                  const selectedRound = hoveredRound ?? summary.totalRounds;
                  return (
                    <div className="summary-chart-layout">
                      <div className="summary-chart-main">
                        <div className="summary-chart-scroller">
                          {(() => {
                            const width = 900;
                            const height = 280;
                            const padX = 48;
                            const padY = 24;
                            const allValues = summary.playerRows.flatMap(row => row.series.map(point => point.y));
                            const minY = Math.min(0, ...allValues);
                            const maxY = Math.max(0, ...allValues);
                            const yRange = Math.max(1, maxY - minY);
                            const toX = (round) => {
                              if (summary.totalRounds <= 1) return padX;
                              return padX + ((round - 1) / (summary.totalRounds - 1)) * (width - padX * 2);
                            };
                            const toY = (value) => padY + ((maxY - value) / yRange) * (height - padY * 2);

                            return (
                              <svg
                                viewBox={`0 0 ${width} ${height}`}
                                className="summary-chart"
                                role="img"
                                aria-label="Cumulative score by round"
                                onMouseMove={(e) => {
                                  const hover = getChartHoverData(e, summary.totalRounds);
                                  setHoveredRound(hover?.round ?? null);
                                  setHoveredChartX(hover?.x ?? null);
                                }}
                                onMouseLeave={() => {
                                  setHoveredRound(null);
                                  setHoveredChartX(null);
                                }}
                              >
                                <line x1={padX} y1={toY(0)} x2={width - padX} y2={toY(0)} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 4" />
                                {selectedRound !== null && (
                                  <line
                                    x1={hoveredChartX ?? toX(selectedRound)}
                                    y1={padY}
                                    x2={hoveredChartX ?? toX(selectedRound)}
                                    y2={height - padY}
                                    stroke="#334155"
                                    strokeWidth="1.2"
                                    strokeDasharray="5 4"
                                  />
                                )}
                                {summary.playerRows.map(row => (
                                  <g key={row.id}>
                                    <path
                                      d={renderLinePath(row.series, summary.totalRounds, minY, maxY)}
                                      fill="none"
                                      stroke={row.color}
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    {row.series.map(point => (
                                      <circle
                                        key={`${row.id}-${point.x}`}
                                        className="summary-chart-point"
                                        cx={toX(point.x)}
                                        cy={toY(point.y)}
                                        r={selectedRound === point.x ? '7' : '5'}
                                        fill={row.color}
                                      >
                                        <title>
                                          {`${row.name} | Round ${point.x} | Round result: ${point.played ? point.delta : 'DNP'} | Total: ${point.y}`}
                                        </title>
                                      </circle>
                                    ))}
                                  </g>
                                ))}
                              </svg>
                            );
                          })()}
                        </div>
                        <div className="summary-legend">
                          {summary.playerRows.map(row => (
                            <div key={row.id} className="summary-legend-item">
                              <span className="summary-legend-dot" style={{ background: row.color }} />
                              <span>{row.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="summary-round-tooltip" role="status" aria-live="polite">
                        <div className="summary-round-tooltip-title">
                          Round {selectedRound} Results
                          {hoveredRound === null && <span className="summary-round-tooltip-help"> (hover chart to inspect other rounds)</span>}
                        </div>
                        <div className="summary-round-tooltip-grid">
                          {summary.playerRows.map(row => {
                            const point = row.series[selectedRound - 1];
                            const roundResult = point?.played ? point.delta : 'DNP';
                            return (
                              <div key={`round-${selectedRound}-${row.id}`} className="summary-round-tooltip-row">
                                <span className="summary-round-player">
                                  <span className="summary-legend-dot" style={{ background: row.color }} />
                                  {row.name}
                                </span>
                                <span className={`score-box${typeof roundResult === 'number' && roundResult < 0 ? ' negative' : ''}`}>
                                  {roundResult}
                                </span>
                                <span className={`score-box${(point?.y || 0) < 0 ? ' negative' : ''}`}>{point?.y ?? 0}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="summary-round-tooltip-help">Values: round result, cumulative total</div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}
        
  <Modal isOpen={modalOpen} onRequestClose={closeModal} ariaHideApp={false} style={{ content: { position: 'relative', minHeight: '380px' } }}>
  <h2>Record Game Score</h2>
  {/* Scrabble rule: per-player score entry, no Chu-Chong button */}
  {scoreRule === 'scrabble' && scrabblePopup ? (
    <div
      tabIndex={0}
      style={{ outline: 'none' }}
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
      <div style={{ marginTop: '1em', marginBottom: '1em', display: 'flex', flexWrap: 'wrap', gap: '1em', justifyContent: 'center' }}>
        {getActivePlayers().map((p, idx) => (
          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
            <span style={{ fontWeight: 700, marginBottom: '0.3em' }}>{p.name}</span>
            <input
              type="number"
              value={scrabbleRoundScores[p.id] !== undefined ? scrabbleRoundScores[p.id] : ''}
              onChange={e => {
                const val = e.target.value;
                setScrabbleRoundScores(scores => ({ ...scores, [p.id]: val === '' ? '' : Number(val) }));
              }}
              style={{ background: '#ffffcc', width: '80px', textAlign: 'center', fontWeight: 600, fontSize: '1.1em', borderRadius: '8px', border: '1px solid #bbb' }}
              placeholder="Score"
              tabIndex={idx}
              ref={el => scrabbleInputRefs.current[idx] = el}
              onFocus={e => e.target.select()}
            />
          </div>
        ))}
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2em', marginBottom: '0.5em' }}>
        <button
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
          style={{ fontSize: '1.4em', padding: '0.6em 2.5em', borderRadius: '10px', fontWeight: 700, background: '#1976d2', color: '#fff', marginBottom: '1em', boxShadow: '0 2px 8px rgba(44,130,201,0.10)' }}
        >Submit</button>
        <div style={{ display: 'flex', gap: '1em' }}>
          <button onClick={() => { setModalOpen(false); setScrabblePopup(false); setScrabbleRoundScores({}); }} style={{ fontSize: '1em', padding: '0.4em 1.5em', borderRadius: '8px', background: '#eee', color: '#333', fontWeight: 600 }}>Cancel</button>
          <button onClick={() => setScrabbleRoundScores({})} style={{ fontSize: '1em', padding: '0.4em 1.5em', borderRadius: '8px', background: '#eee', color: '#333', fontWeight: 600 }}>Clear</button>
        </div>
      </div>
    </div>
  ) : (
    // Mahjong rule: original popup
    <div onKeyDown={e => { if (e.key === 'Enter') handleScoreSubmit(); }} tabIndex={0} style={{ outline: 'none' }}>
      <div style={{ marginBottom: '1em', display: 'flex', alignItems: 'center', gap: '1em' }}>
        <label>Score: <input
          type="number"
          value={scoreInput}
          ref={scoreInputRef}
          onChange={e => setScoreInput(Number(e.target.value))}
          onClick={e => e.target.select()}
          style={{ background: '#ffffcc' }}
          tabIndex={0}
        /></label>
        <button
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
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '0.3em 1em',
            fontWeight: 500,
            cursor: 'pointer',
            minWidth: '90px'
          }}
        >
          {selfPick ? '自摸 (Self-pick)' : '出冲 (Chu-Chong)'}
        </button>
      </div>
      <div style={{ marginTop: '1em' }}>
        <div style={{ display: 'flex', gap: '1em', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1em' }}>
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
                key={p.id}
                type="button"
                tabIndex={2 + idx}
                onClick={() => handleToggle(idx)}
                style={{
                  minWidth: '120px',
                  minHeight: '56px',
                  background: bg,
                  color,
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(44,130,201,0.10)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.15em',
                  cursor: 'pointer',
                  border: '2px solid #bbb',
                  marginBottom: '0.5em',
                  padding: '0.5em 1em',
                }}
                title={`Toggle win/lose/none for ${p.name}`}
              >
                <span style={{ textDecoration: 'underline' }}>{p.name}</span>
                <span style={{ marginTop: '0.3em', fontWeight: 600, fontSize: '1em', textTransform: 'capitalize' }}>{toggles[idx]}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2em', marginBottom: '0.5em' }}>
        <button onClick={handleScoreSubmit} style={{ fontSize: '1.4em', padding: '0.6em 2.5em', borderRadius: '10px', fontWeight: 700, background: '#1976d2', color: '#fff', marginBottom: '1em', boxShadow: '0 2px 8px rgba(44,130,201,0.10)' }}>Submit</button>
        <div style={{ display: 'flex', gap: '1em' }}>
          <button onClick={closeModal} style={{ fontSize: '1em', padding: '0.4em 1.5em', borderRadius: '8px', background: '#eee', color: '#333', fontWeight: 600 }}>Cancel</button>
          <button onClick={() => {
            setScoreInput(0);
            setToggles(['none', 'none', 'none', 'none']);
            setSelfPick(false);
          }} style={{ fontSize: '1em', padding: '0.4em 1.5em', borderRadius: '8px', background: '#eee', color: '#333', fontWeight: 600 }}>Clear</button>
        </div>
      </div>
    </div>
  )}
      </Modal>
        {/* Edit previous game modal */}
      {/* Calculate payout modal */}
      <Modal isOpen={payoutModalOpen} onRequestClose={closePayoutModal} ariaHideApp={false} style={{ content: { minWidth: '340px', minHeight: '320px', maxWidth: '420px', margin: 'auto', borderRadius: '12px' } }}>
        <h2>Calculate Payout</h2>
        <div style={{ marginBottom: '1em' }}>
          <label>Rate: <input
            type="number"
            value={payoutRate}
            ref={payoutRateInputRef}
            min={0.01}
            step={0.01}
            onChange={e => {
              const val = Number(e.target.value);
              setPayoutRate(val > 0 ? val : 1);
            }}
            style={{ background: '#ffffcc', width: '80px', marginLeft: '0.5em' }}
          /></label>
          {payoutRate === 0 && (
            <div style={{ color: 'red', marginTop: '0.5em' }}>
              Payout rate cannot be zero.
            </div>
          )}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1em' }}>
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
        <div style={{ textAlign: 'center' }}>
          <button onClick={closePayoutModal} style={{ minWidth: '100px' }}>Close</button>
        </div>
      </Modal>
        <Modal isOpen={editModalOpen} onRequestClose={closeEditModal} ariaHideApp={false}>
          <h2>Edit Game #{editGameIdx !== null ? games[editGameIdx].number : ''}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1em', marginBottom: '1em' }}>
            <label>Score: <input
              type="number"
              value={editScoreInput}
              ref={editScoreInputRef}
              onChange={e => setEditScoreInput(Number(e.target.value))}
              onClick={e => e.target.select()}
              style={{ background: '#ffffcc' }}
            /></label>
            <button
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
                border: '1px solid #ccc',
                borderRadius: '6px',
                padding: '0.3em 1em',
                fontWeight: 500,
                cursor: 'pointer',
                minWidth: '90px'
              }}
            >
              {editSelfPick ? '自摸 (Self-pick)' : '出冲 (Chu-Chong)'}
            </button>
          </div>
          <div style={{ marginTop: '1em' }}>
            {editGameIdx !== null && games[editGameIdx] && players.filter(p => games[editGameIdx].active.includes(p.id)).map((p, idx) => {
              let label = '';
              if (editToggles[idx] === 'win') {
                label = editSelfPick ? editScoreInput * 3 : (editToggles.filter(t => t === 'lose').length === 3 ? editScoreInput * 3 : editScoreInput * chuChongMultiplier);
              } else if (editToggles[idx] === 'lose') {
                label = editSelfPick ? -editScoreInput : (editToggles.filter(t => t === 'lose').length === 3 ? -editScoreInput : -editScoreInput * chuChongMultiplier);
              }
              return (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '120px 90px 1fr', alignItems: 'center', gap: '0.5em', marginBottom: '0.5em' }}>
                  <span style={{ cursor: 'pointer', textDecoration: 'underline', justifySelf: 'start', textAlign: 'left', fontWeight: 500 }} onClick={() => changePlayerName(p.id)}>{p.name}</span>
                  <button 
                    onClick={() => handleEditToggle(idx)}
                    style={{
                      width: '90px',
                      background: editToggles[idx] === 'win' ? '#4caf50' : editToggles[idx] === 'lose' ? '#f44336' : undefined,
                      color: editToggles[idx] === 'win' || editToggles[idx] === 'lose' ? '#fff' : undefined,
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      padding: '0.3em 0',
                      textTransform: 'capitalize',
                      justifySelf: 'center'
                    }}
                  >
                    {editToggles[idx]}
                  </button>
                  <span style={{ justifySelf: 'start', minWidth: '40px', textAlign: 'left' }}>{label !== '' ? label : ''}</span>
                </div>
              );
            })}
          </div>
          <button onClick={handleEditScoreSubmit} style={{ marginTop: '1em' }}>Save</button>
          <button onClick={closeEditModal} style={{ marginLeft: '1em' }}>Cancel</button>
          <div tabIndex={0} onKeyDown={handleEditModalKeyDown} style={{ outline: 'none' }} />
        </Modal>
    </div>
  );
}

export default App;
