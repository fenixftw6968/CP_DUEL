import { useEffect, useState, useContext, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axiosInstance from '../../utils/axiosInstance'
import { API_PATHS } from '../../utils/apiPaths'
import { AuthContext } from '../../context/AuthContext'
import Navbar from '../../components/Navbar'

const WS_BASE = import.meta.env.VITE_WS_URL || 'http://localhost:8080'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Bebas+Neue&display=swap');

  :root {
    --bg: #060606; --surface: #0f0f0f; --border: #252525; --border2: #363636;
    --accent: #c8ff00; --accent-dim: rgba(200,255,0,0.09);
    --text: #f0f0e8; --muted: #606060; --muted2: #909090;
    --err: #ff4d4d; --radius: 2px;
  }

  .tb { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'IBM Plex Mono', monospace; display: flex; flex-direction: column; overflow-x: hidden; }
  .tb-main { flex: 1; display: flex; flex-direction: column; padding: 40px 40px 64px; }
  
  .tb-top { margin-bottom: 32px; }
  .tb-back { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted2); background: none; border: none; cursor: pointer; padding: 0; margin-bottom: 24px; transition: color 0.15s; }
  .tb-back:hover { color: var(--text); }
  .tb-back svg { width: 12px; height: 12px; }

  .tb-header { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 24px; }
  .tb-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(48px, 6vw, 64px); letter-spacing: 0.04em; line-height: 0.9; margin-bottom: 8px; }
  .tb-meta { display: flex; gap: 16px; font-size: 11px; color: var(--muted2); letter-spacing: 0.1em; text-transform: uppercase; }
  
  .tb-status-badge { font-size: 10px; font-weight: 600; letter-spacing: 0.14em; padding: 6px 14px; border-radius: var(--radius); border: 1px solid; }
  .tb-status-badge.reg { color: var(--accent); border-color: rgba(200,255,0,0.2); background: var(--accent-dim); }
  .tb-status-badge.ongoing { color: #ff8800; border-color: rgba(255,136,0,0.2); background: rgba(255,136,0,0.08); }
  .tb-status-badge.finished { color: var(--muted2); border-color: var(--border2); background: var(--surface); }

  /* Referee Panel Styles */
  .tb-referee-panel { background: #0f120a; border: 1px solid rgba(200,255,0,0.25); border-radius: var(--radius); padding: 24px; margin-bottom: 36px; box-shadow: 0 0 24px rgba(200,255,0,0.05); }
  .tb-ref-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(200,255,0,0.15); padding-bottom: 14px; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; }
  .tb-ref-title { font-size: 13px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); display: flex; align-items: center; gap: 8px; }
  .tb-ref-badge { font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; padding: 4px 8px; background: rgba(200,255,0,0.15); color: var(--accent); border-radius: 2px; }
  .tb-ref-roster { font-size: 11px; color: var(--muted2); letter-spacing: 0.1em; }
  .tb-ref-roster span { color: var(--text); font-weight: 600; }

  .tb-req-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
  .tb-req-item { display: flex; justify-content: space-between; align-items: center; background: #161811; border: 1px solid #282e1d; padding: 10px 16px; border-radius: 2px; }
  .tb-req-player { font-size: 12px; font-weight: 500; color: #f0f0e8; letter-spacing: 0.06em; }
  .tb-req-actions { display: flex; gap: 8px; }
  .tb-btn-accept { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #060606; background: var(--accent); border: none; padding: 6px 12px; border-radius: 2px; cursor: pointer; transition: opacity 0.15s; }
  .tb-btn-accept:hover { opacity: 0.85; }
  .tb-btn-decline { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #ff8888; background: rgba(255,80,80,0.1); border: 1px solid rgba(255,80,80,0.25); padding: 6px 12px; border-radius: 2px; cursor: pointer; transition: all 0.15s; }
  .tb-btn-decline:hover { background: rgba(255,80,80,0.2); }

  .tb-ref-controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .tb-btn-start-tourney { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #060606; background: var(--accent); border: none; padding: 12px 24px; border-radius: 2px; cursor: pointer; transition: opacity 0.15s; box-shadow: 0 0 16px rgba(200,255,0,0.3); }
  .tb-btn-start-tourney:hover { opacity: 0.85; }
  .tb-btn-start-tourney:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }

  .tb-bracket-container { flex: 1; display: flex; gap: 64px; overflow-x: auto; padding-bottom: 40px; scrollbar-width: thin; scrollbar-color: var(--border2) var(--bg); }
  .tb-bracket-container::-webkit-scrollbar { height: 8px; }
  .tb-bracket-container::-webkit-scrollbar-track { background: var(--bg); }
  .tb-bracket-container::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }

  .tb-round { display: flex; flex-direction: column; gap: 24px; min-width: 240px; }
  .tb-round-title { font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted2); margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px; text-align: center; }

  .tb-match { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; display: flex; flex-direction: column; position: relative; }
  .tb-match.is-mine { border-color: var(--accent); box-shadow: 0 0 12px rgba(200,255,0,0.1); }
  .tb-match.finished { opacity: 0.7; }
  
  .tb-player { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); font-size: 13px; font-weight: 500; }
  .tb-player:last-child { border-bottom: none; }
  .tb-player.winner { color: var(--accent); }
  .tb-player.loser { color: var(--muted); text-decoration: line-through; }
  .tb-player.bye { color: var(--muted2); font-style: italic; }
  .tb-score { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.05em; }

  .tb-match-footer { padding: 10px 16px; background: #0a0a0a; border-top: 1px solid var(--border); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
  .tb-match-status.live { color: #ff8800; display: flex; align-items: center; gap: 6px; }
  .tb-match-status.live::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #ff8800; animation: pulseLive 1.5s infinite; }
  @keyframes pulseLive { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

  .tb-match-status.sched { color: var(--muted2); }
  .tb-match-status.done { color: var(--muted2); }

  .tb-play-btn { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.14em; color: #000; background: var(--accent); border: none; padding: 6px 12px; border-radius: 2px; cursor: pointer; text-transform: uppercase; transition: all 0.15s; animation: pulseBtn 2s infinite; }
  .tb-play-btn:hover { opacity: 0.8; }
  @keyframes pulseBtn { 0%,100%{box-shadow: 0 0 8px rgba(200,255,0,0.3);} 50%{box-shadow: 0 0 16px rgba(200,255,0,0.6);} }

  .tb-monitor-btn { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; color: var(--muted2); background: transparent; border: 1px solid var(--border2); padding: 5px 10px; border-radius: 2px; cursor: pointer; text-transform: uppercase; transition: all 0.15s; }
  .tb-monitor-btn:hover { color: var(--text); border-color: var(--accent); }

  .tb-empty { text-align: center; color: var(--muted2); padding: 40px; font-size: 13px; letter-spacing: 0.1em; }

  .tb-btn-start-round { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #000; background: var(--accent); border: none; padding: 6px 14px; border-radius: 2px; cursor: pointer; transition: all 0.15s; margin-left: 12px; font-weight: 600; }
  .tb-btn-start-round:hover { opacity: 0.8; }
  .tb-btn-start-round:disabled { opacity: 0.5; cursor: not-allowed; }

  .tb-toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); font-size: 11px; letter-spacing: 0.06em; padding: 10px 20px; border-radius: 2px; border-left: 2px solid #c8ff00; background: #0f120a; color: #c8ff00; white-space: nowrap; z-index: 200; animation: toastIn .2s ease; }
  .tb-toast.error { border-color: #ff4444; background: #120a0a; color: #ff6666; }
  @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)} }

  @media (max-width: 768px) {
    .tb-main { padding: 24px 20px; }
    .tb-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  }
`

export default function TournamentBracket() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { userToken } = useContext(AuthContext)

  const [tData, setTData] = useState(null)
  const [rounds, setRounds] = useState({})
  const [loading, setLoading] = useState(true)
  const [myHandle, setMyHandle] = useState('')
  const [startingRound, setStartingRound] = useState(false)
  const [startingTournament, setStartingTournament] = useState(false)
  const [toast, setToast] = useState(null)

  const wsRef = useRef(null)

  const showToast = (text, type = 'ok') => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }

  const startRound = async (round) => {
    setStartingRound(true)
    try {
      await axiosInstance.post(`/api/tournament/${id}/start-round/${round}`)
      showToast(`Round ${round} started!`)
      fetchBracket()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to start round', 'error')
    } finally {
      setStartingRound(false)
    }
  }

  const [advancing, setAdvancing] = useState(false)
  
  const advanceRound = async () => {
    setAdvancing(true)
    try {
      await axiosInstance.post(`/api/tournament/${id}/advance-round`)
      showToast('Advanced to next round!')
      fetchBracket()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to advance round', 'error')
    } finally {
      setAdvancing(false)
    }
  }

  const startTournament = async () => {
    setStartingTournament(true)
    try {
      await axiosInstance.post(`${API_PATHS.TOURNAMENT.START}/${id}/start`)
      showToast('Tournament started!')
      fetchBracket()
    } catch (err) {
      showToast(err?.response?.data?.message || err?.response?.data || 'Failed to start tournament', 'error')
    } finally {
      setStartingTournament(false)
    }
  }

  const handleAcceptRequest = async (playerHandle) => {
    try {
      await axiosInstance.post(API_PATHS.TOURNAMENT.ACCEPT_REQUEST(id, playerHandle))
      showToast(`Accepted ${playerHandle}!`)
      fetchBracket()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to accept request', 'error')
    }
  }

  const handleDeclineRequest = async (playerHandle) => {
    try {
      await axiosInstance.post(API_PATHS.TOURNAMENT.DECLINE_REQUEST(id, playerHandle))
      showToast(`Declined ${playerHandle}.`)
      fetchBracket()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to decline request', 'error')
    }
  }

  useEffect(() => {
    if (!userToken) return
    axiosInstance.get(API_PATHS.USER.ME)
      .then(res => { if (res.data?.cfHandle) setMyHandle(res.data.cfHandle) })
      .catch(() => {})
  }, [userToken])

  const fetchBracket = () => {
    axiosInstance.get(`${API_PATHS.TOURNAMENT.BRACKET}/${id}/bracket`)
      .then(res => {
        setTData(res.data.tournament)
        setRounds(res.data.rounds || {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchBracket()
    
    // Set up Stomp websocket connection to get live updates when matches finish or tournament starts
    if (window.SockJS && window.Stomp) {
      const sock = new window.SockJS(`${WS_BASE}/ws`)
      const client = window.Stomp.over(sock)
      client.debug = null
      client.connect({}, () => {
        client.subscribe(`/topic/tournament/${id}`, () => {
          fetchBracket()
        })
      })
      wsRef.current = client
    }
    
    return () => {
      if (wsRef.current) wsRef.current.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="tb" style={{ alignItems: 'center', justifyContent: 'center' }}>
        Loading bracket...
      </div>
    )
  }

  if (!tData) {
    return (
      <div className="tb" style={{ alignItems: 'center', justifyContent: 'center' }}>
        Tournament not found.
      </div>
    )
  }

  const isReferee = myHandle && tData.creatorId && myHandle.toLowerCase() === tData.creatorId.toLowerCase()
  const isMyMatch = (m) => myHandle && (m.player1 === myHandle || m.player2 === myHandle)

  const getRoundName = (roundNum) => {
    const total = tData.totalRounds || 1
    const remain = total - roundNum
    if (remain === 0) return 'Final'
    if (remain === 1) return 'Semifinals'
    if (remain === 2) return 'Quarterfinals'
    return `Round of ${Math.pow(2, total - roundNum + 1)}`
  }

  return (
    <>
      <style>{css}</style>
      <div className="tb">
        <Navbar />

        <main className="tb-main">
          
          <div className="tb-top">
            <button className="tb-back" onClick={() => navigate('/tournaments')}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2L4 6l4 4"/>
              </svg>
              Back to Tournaments
            </button>
            <div className="tb-header">
              <div>
                <h1 className="tb-title">{tData.name}</h1>
                <div className="tb-meta">
                  <span>Referee: {tData.creatorId || 'Host'}</span>
                  <span>{tData.registeredPlayers?.length || 0}/{tData.maxPlayers} Players</span>
                  <span>{tData.difficulty}</span>
                  {tData.winnerId && <span>🏆 {tData.winnerId} won!</span>}
                </div>
              </div>
              
              <div className={`tb-status-badge ${tData.status === 'REGISTRATION' ? 'reg' : tData.status === 'ONGOING' ? 'ongoing' : 'finished'}`}>
                {tData.status}
              </div>
            </div>
          </div>

          {/* DEDICATED REFEREE MANAGEMENT PANEL */}
          {isReferee && (
            <div className="tb-referee-panel">
              <div className="tb-ref-head">
                <div className="tb-ref-title">
                  ⚖ Dedicated Referee Panel
                  <span className="tb-ref-badge">Host Only</span>
                </div>
                <div className="tb-ref-roster">
                  Accepted Players: <span>{tData.registeredPlayers?.length || 0} / {tData.maxPlayers}</span>
                  {tData.registeredPlayers?.length > 0 && (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#888' }}>
                      Roster: {tData.registeredPlayers.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Join Requests */}
              {tData.status === 'REGISTRATION' && (
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffaa44', marginBottom: '10px', fontWeight: 600 }}>
                    Player Join Requests ({tData.joinRequests?.length || 0})
                  </div>
                  {(!tData.joinRequests || tData.joinRequests.length === 0) ? (
                    <div style={{ fontSize: '12px', color: '#707070', marginBottom: '16px' }}>
                      No pending requests right now. Players can send join requests from the tournaments list.
                    </div>
                  ) : (
                    <div className="tb-req-grid">
                      {tData.joinRequests.map((player) => (
                        <div className="tb-req-item" key={player}>
                          <div className="tb-req-player">
                            <span>🎮 {player}</span>
                          </div>
                          <div className="tb-req-actions">
                            <button
                              className="tb-btn-accept"
                              onClick={() => handleAcceptRequest(player)}
                              disabled={(tData.registeredPlayers?.length || 0) >= tData.maxPlayers}
                            >
                              ✓ Accept
                            </button>
                            <button
                              className="tb-btn-decline"
                              onClick={() => handleDeclineRequest(player)}
                            >
                              ✕ Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tournament Management Controls */}
              <div className="tb-ref-controls">
                {tData.status === 'REGISTRATION' && (
                  <button
                    className="tb-btn-start-tourney"
                    onClick={startTournament}
                    disabled={startingTournament || (tData.registeredPlayers?.length || 0) < 2}
                  >
                    {startingTournament ? 'Starting…' : (tData.registeredPlayers?.length || 0) < 2 ? 'Need ≥ 2 Players to Start' : '⚔ Start Tournament'}
                  </button>
                )}

                {tData.status === 'ONGOING' && (
                  <button 
                    className="tb-btn-start-tourney"
                    onClick={advanceRound}
                    disabled={advancing}
                  >
                    {advancing ? 'Advancing…' : '⏩ Advance to Next Round'}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="tb-bracket-container">
            {Object.keys(rounds).length === 0 ? (
              <div className="tb-empty">Bracket will be generated when tournament starts.</div>
            ) : (
              Object.keys(rounds).sort((a,b) => Number(a) - Number(b)).map((roundNum) => {
                const matches = rounds[roundNum]
                const canStartRound = isReferee && tData.currentRound === Number(roundNum) && tData.status === 'ONGOING' && matches.some(m => m.status === 'READY' && m.status !== 'BYE')

                return (
                  <div className="tb-round" key={roundNum}>
                    <div className="tb-round-title">
                      {getRoundName(Number(roundNum))}
                      {canStartRound && (
                        <button 
                          className="tb-btn-start-round" 
                          onClick={() => startRound(roundNum)} 
                          disabled={startingRound}
                        >
                          {startingRound ? 'Starting...' : `Start`}
                        </button>
                      )}
                    </div>
                    
                    {matches.map((m, idx) => {
                      const mine = isMyMatch(m)
                      const p1Winner = m.winnerId && m.winnerId === m.player1
                      const p2Winner = m.winnerId && m.winnerId === m.player2
                      const isBye = m.status === 'BYE'

                      return (
                        <div className={`tb-match ${mine ? 'is-mine' : ''} ${m.status === 'FINISHED' ? 'finished' : ''}`} key={idx}>
                          <div className={`tb-player ${p1Winner ? 'winner' : ''} ${m.winnerId && p2Winner ? 'loser' : ''} ${m.player1 === 'BYE' ? 'bye' : ''}`}>
                            <span>{m.player1}</span>
                            {!isBye && m.status !== 'SCHEDULED' && m.status !== 'READY' && <span className="tb-score">{m.score1 || 0}</span>}
                          </div>
                          
                          <div className={`tb-player ${p2Winner ? 'winner' : ''} ${m.winnerId && p1Winner ? 'loser' : ''} ${m.player2 === 'BYE' ? 'bye' : ''}`}>
                            <span>{m.player2}</span>
                            {!isBye && m.status !== 'SCHEDULED' && m.status !== 'READY' && <span className="tb-score">{m.score2 || 0}</span>}
                          </div>

                          <div className="tb-match-footer">
                            {isBye ? (
                              <span className="tb-match-status done">BYE (Auto-advance)</span>
                            ) : m.status === 'FINISHED' ? (
                              <span className="tb-match-status done">
                                {m.winnerId && m.winnerId !== 'DRAW' ? `Winner: ${m.winnerId}` : 'Finished'}
                              </span>
                            ) : m.status === 'ONGOING' ? (
                              <span className="tb-match-status live">Live</span>
                            ) : m.status === 'READY' ? (
                              <span className="tb-match-status sched">Waiting for Admin to Start</span>
                            ) : (
                              <span className="tb-match-status sched">Scheduled</span>
                            )}

                            {/* PLAY BUTTON FOR PARTICIPANT */}
                            {mine && m.status === 'ONGOING' && !isBye && (
                              <button 
                                className="tb-play-btn"
                                onClick={() => navigate(`/match/${m.inviteCode}`)}
                              >
                                ▶ Play Match
                              </button>
                            )}

                            {/* REFEREE / SPECTATOR MONITOR BUTTON */}
                            {!isBye && m.inviteCode && (m.status === 'ONGOING' || m.status === 'FINISHED') && (!mine || isReferee) && (
                              <button 
                                className="tb-monitor-btn"
                                onClick={() => navigate(`/match/${m.inviteCode}`)}
                                title="Monitor live scores and results"
                              >
                                {isReferee ? '👁 Referee Monitor' : '👁 Spectate'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>
        </main>
      </div>
    </>
  )
}
