import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Modal from 'react-modal';
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
  const [players, setPlayers] = useState(() => {
    const saved = localStorage.getItem('mj_players');
    return saved ? JSON.parse(saved) : defaultPlayers;
  });
  const [activePlayerIds, setActivePlayerIds] = useState(() => {
    const saved = localStorage.getItem('mj_activePlayerIds');
    return saved ? JSON.parse(saved) : ['p1', 'p2', 'p3', 'p4'];
  });
  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem('mj_games');
    return saved ? JSON.parse(saved) : defaultGames;
  });
  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('mj_players', JSON.stringify(players));
  }, [players]);
  useEffect(() => {
    localStorage.setItem('mj_activePlayerIds', JSON.stringify(activePlayerIds));
  }, [activePlayerIds]);
  useEffect(() => {
    localStorage.setItem('mj_games', JSON.stringify(games));
  }, [games]);
  const [modalOpen, setModalOpen] = useState(false);
  const [scoreInput, setScoreInput] = useState(0);
  const scoreInputRef = React.useRef(null);
  const [toggles, setToggles] = useState(['none', 'none', 'none', 'none']);
  const [selfPick, setSelfPick] = useState(false);
  // Edit game modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editGameIdx, setEditGameIdx] = useState(null);
  const [editScoreInput, setEditScoreInput] = useState(0);
  const [editToggles, setEditToggles] = useState(['none', 'none', 'none', 'none']);
  const [editSelfPick, setEditSelfPick] = useState(false);
  const editScoreInputRef = React.useRef(null);

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
  const closeModal = () => setModalOpen(false);

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
          return 'none';
        } else {
          // Cycle: none -> win -> lose -> none
          if (t === 'none') return 'win';
          if (t === 'win') return 'lose';
          if (t === 'lose') return 'none';
          return 'none';
        }
      });
      // If selfPick is enabled and a player is set to win, set all others to lose
      if (selfPick && newToggles.filter(t => t === 'win').length === 1) {
        newToggles = newToggles.map((t, i) => t === 'win' ? 'win' : 'lose');
      }
      return newToggles;
    });
  };
  // Edit modal toggle
  const handleEditToggle = (idx) => {
    setEditToggles(editToggles => {
      const hasWinner = editToggles.includes('win');
      let newToggles = editToggles.map((t, i) => {
        if (i !== idx) return t;
        if (hasWinner) {
          // Cycle: none -> lose -> win -> none
          if (t === 'none') return 'lose';
          if (t === 'lose') return 'win';
          if (t === 'win') return 'none';
          return 'none';
        } else {
          // Cycle: none -> win -> lose -> none
          if (t === 'none') return 'win';
          if (t === 'win') return 'lose';
          if (t === 'lose') return 'none';
          return 'none';
        }
      });
      // If editSelfPick is enabled and a player is set to win, set all others to lose
      if (editSelfPick && newToggles.filter(t => t === 'win').length === 1) {
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
          delta = winCount === 1 && loseCount === 3 ? scoreInput * 3 : scoreInput * 2;
        }
      } else if (toggles[idx] === 'lose') {
        if (selfPick) {
          delta = -scoreInput;
        } else {
          delta = winCount === 1 && loseCount === 3 ? -scoreInput : -scoreInput * 2;
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
        scoreVal = Math.abs(winnerVal / 2);
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
          delta = winCount === 1 && loseCount === 3 ? editScoreInput * 3 : editScoreInput * 2;
        }
      } else if (editToggles[idx] === 'lose') {
        if (editSelfPick) {
          delta = -editScoreInput;
        } else {
          delta = winCount === 1 && loseCount === 3 ? -editScoreInput : -editScoreInput * 2;
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
    <div className="mahjong-app">
  <h1>Mahjong Score Tracker</h1>
      <div className="add-player-container" style={{ gap: '1em', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0 }}>
          <button className="menu-btn" onClick={() => setMenuOpen(m => !m)} style={{ minWidth: '120px' }}>☰ Menu</button>
        </div>
        <button onClick={openModal} style={{ minWidth: '160px', margin: '0 40px' }}>Record Game Score</button>
        <button
          onClick={() => window.location.href = '/help.html'}
          style={{ position: 'absolute', right: 0, top: 0, color: '#1a5fc2', textDecoration: 'underline', fontWeight: 500, fontSize: '1.08em', background: 'none', border: 'none', padding: '0.5em 1em', cursor: 'pointer', zIndex: 1000 }}
        >Help</button>
        {menuOpen && (
          <div style={{
            position: 'absolute',
            top: '2.5em',
            left: 0,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            zIndex: 9999,
            minWidth: '180px',
            padding: '0.5em 0'
          }} className="menu-popup">
            {['Add Player', 'Clear Scores', 'Clear Players', 'Export CSV'].map((label, idx) => (
              <button
                key={label}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5em 1em',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#222',
                  fontSize: '1em',
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#f0f4fa')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
                onClick={() => {
                  setMenuOpen(false);
                  if (label === 'Add Player') addPlayer();
                  if (label === 'Clear Scores') {
                    if (window.confirm('Clear all scores?')) {
                      setPlayers(players.map(p => ({ ...p, score: 0 })));
                      setGames([]);
                    }
                  }
                  if (label === 'Clear Players') {
                    if (window.confirm('Clear all players and games?')) {
                      setPlayers([
                        { id: 'p1', name: 'Player 1', score: 0 },
                        { id: 'p2', name: 'Player 2', score: 0 },
                        { id: 'p3', name: 'Player 3', score: 0 },
                        { id: 'p4', name: 'Player 4', score: 0 }
                      ]);
                      setActivePlayerIds(['p1', 'p2', 'p3', 'p4']);
                      setGames([]);
                    }
                  }
                  if (label === 'Export CSV') {
                    let csv = 'Game #,' + players.map(p => p.name).join(',') + ',Other\n';
                    games.forEach(game => {
                      let row = [game.number];
                      players.forEach(p => {
                        row.push(game.active.includes(p.id) ? (game.scores[p.id] ?? '-') : '-');
                      });
                      row.push(getOtherScoreForGame(game));
                      csv += row.join(',') + '\n';
                    });
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'mahjong_scores.csv';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
                }}
              >
                {label}
              </button>
            ))}
            <button
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.5em 1em',
                background: '#ffd700',
                border: 'none',
                cursor: 'pointer',
                color: '#222',
                fontWeight: 600,
                fontSize: '1em',
                borderRadius: '0 0 8px 8px',
                marginTop: '0.5em'
              }}
              onClick={() => {
                setMenuOpen(false);
                addRandomGames();
              }}
            >Test: Add 10 Random Games</button>
          </div>
        )}
      </div>
      <div className="main-layout">
        <div className="game-grid">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Game #</th>
                {getActivePlayers().map(p => (
                  <th key={p.id}>
                    <span 
                      style={{ 
                        cursor: 'pointer', 
                        textDecoration: 'underline', 
                        fontWeight: 700, 
                        color: '#1a5fc2',
                        fontSize: '1.08em'
                      }} 
                      onClick={() => changePlayerName(p.id)}
                    >
                      {p.name}
                    </span>
                    <br />
                    <span style={{
                      fontWeight: 600,
                      color: p.score > 0 ? '#388e3c' : p.score < 0 ? '#d32f2f' : '#333',
                      background: p.score > 0 ? '#d4f8e8' : p.score < 0 ? '#ffe0e0' : 'transparent',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      display: 'inline-block',
                      minWidth: '32px'
                    }}>{p.score}</span>
                  </th>
                ))}
                <th style={{ width: '60px' }}>Other</th>
              </tr>
            </thead>
            <tbody>
              {[...games].reverse().map((game, idx) => (
                <tr key={idx}>
                  <td style={{ cursor: 'pointer', textDecoration: 'underline', color: '#2d7ff9' }} onClick={() => openEditModal(games.length - 1 - idx)}>{game.number}</td>
                  {getActivePlayers().map((p, i) => {
                    let scoreStyle = {};
                    if (game.active.includes(p.id)) {
                      const val = game.scores[p.id];
                      if (val > 0) scoreStyle = { fontWeight: 600, color: '#388e3c', background: '#d4f8e8', borderRadius: '6px', padding: '2px 8px', display: 'inline-block', minWidth: '32px' };
                      if (val < 0) scoreStyle = { fontWeight: 600, color: '#d32f2f', background: '#ffe0e0', borderRadius: '6px', padding: '2px 8px', display: 'inline-block', minWidth: '32px' };
                    }
                    return (
                      <td key={p.id}>
                        {game.active.includes(p.id) ? <span style={scoreStyle}>{game.scores[p.id]}</span> : '-'}
                      </td>
                    );
                  })}
                  <td>
                    {(() => {
                      const otherScore = getOtherScoreForGame(game);
                      let scoreStyle = {};
                      if (typeof otherScore === 'number') {
                        if (otherScore > 0) scoreStyle = { fontWeight: 600, color: '#388e3c', background: '#d4f8e8', borderRadius: '6px', padding: '2px 8px', display: 'inline-block', minWidth: '32px' };
                        if (otherScore < 0) scoreStyle = { fontWeight: 600, color: '#d32f2f', background: '#ffe0e0', borderRadius: '6px', padding: '2px 8px', display: 'inline-block', minWidth: '32px' };
                      }
                      return typeof otherScore === 'number' ? <span style={scoreStyle}>{otherScore}</span> : otherScore;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="sidebar">
          <h2>Inactive Players</h2>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="active-list" direction="horizontal">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="active-list" style={{ display: 'flex', gap: '8px', marginTop: '1em' }}>
                  {getActivePlayers().map((p, idx) => (
                    <Draggable key={p.id} draggableId={p.id} index={idx}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="active-player">
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
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="inactive-player"
                      style={{
                        background: snapshot.isDraggingOver ? '#ffe0e0' : undefined,
                        transition: 'background 0.2s',
                      }}
                    >
                      <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => changePlayerName(p.id)}>{p.name}</span> ({p.score})
                      <button style={{ marginLeft: '0.5em', padding: '2px 8px', fontSize: '0.85em', borderRadius: '4px', background: '#e0e0e0', color: '#333', border: '1px solid #ccc' }} onClick={() => removePlayer(p.id)}>✕</button>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </div>
      </div>
      <Modal isOpen={modalOpen} onRequestClose={closeModal} ariaHideApp={false}>
        <h2>Record Game Score</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1em', marginBottom: '1em' }}>
          <label>Score: <input
            type="number"
            value={scoreInput}
            ref={scoreInputRef}
            onChange={e => setScoreInput(Number(e.target.value))}
            onClick={e => e.target.select()}
            style={{ background: '#ffffcc' }}
          /></label>
          <button
            type="button"
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
          {getActivePlayers().map((p, idx) => {
            let label = '';
            if (toggles[idx] === 'win') {
              label = selfPick ? scoreInput * 3 : (toggles.filter(t => t === 'lose').length === 3 ? scoreInput * 3 : scoreInput * 2);
            } else if (toggles[idx] === 'lose') {
              label = selfPick ? -scoreInput : (toggles.filter(t => t === 'lose').length === 3 ? -scoreInput : -scoreInput * 2);
            }
            return (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '120px 90px 1fr', alignItems: 'center', gap: '0.5em', marginBottom: '0.5em' }}>
                <span style={{ cursor: 'pointer', textDecoration: 'underline', justifySelf: 'start', textAlign: 'left', fontWeight: 500 }} onClick={() => changePlayerName(p.id)}>{p.name}</span>
                <button 
                  onClick={() => handleToggle(idx)}
                  style={{
                    width: '90px',
                    background: toggles[idx] === 'win' ? '#4caf50' : toggles[idx] === 'lose' ? '#f44336' : undefined,
                    color: toggles[idx] === 'win' || toggles[idx] === 'lose' ? '#fff' : undefined,
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    padding: '0.3em 0',
                    textTransform: 'capitalize',
                    justifySelf: 'center'
                  }}
                >
                  {toggles[idx]}
                </button>
                <span style={{ justifySelf: 'start', minWidth: '40px', textAlign: 'left' }}>{label !== '' ? label : ''}</span>
              </div>
            );
          })}
        </div>
        <button onClick={handleScoreSubmit} style={{ marginTop: '1em' }}>Submit</button>
        <button onClick={closeModal} style={{ marginLeft: '1em' }}>Cancel</button>
        <div tabIndex={0} onKeyDown={handleModalKeyDown} style={{ outline: 'none' }} />
      </Modal>
        {/* Edit previous game modal */}
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
                label = editSelfPick ? editScoreInput * 3 : (editToggles.filter(t => t === 'lose').length === 3 ? editScoreInput * 3 : editScoreInput * 2);
              } else if (editToggles[idx] === 'lose') {
                label = editSelfPick ? -editScoreInput : (editToggles.filter(t => t === 'lose').length === 3 ? -editScoreInput : -editScoreInput * 2);
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
