import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOVES, TYPE_MOVES } from '../game/moves.js'
import { processTurn, selectAIMove } from '../game/matchEngine.js'
import HitEffect from '../components/fight/HitEffect.jsx'
import KOOverlay from '../components/fight/KOOverlay.jsx'
import Fight3DScene from '../components/fight/Fight3DScene.jsx'

const ACTION_BUTTONS = {
  스트라이커: [
    { id: 'jab', label: '잽', sub: '빠름' },
    { id: 'cross', label: '크로스', sub: '강함' },
    { id: 'hook', label: '훅', sub: '묵직' },
    { id: 'lowKick', label: '로우킥', sub: '다리' },
    { id: 'highKick', label: '하이킥', sub: 'KO' },
    { id: 'guard', label: '가드', sub: '방어' },
    { id: 'evade', label: '회피', sub: '피하기' },
  ],
  그래플러: [
    { id: 'jab', label: '잽', sub: '견제' },
    { id: 'cross', label: '크로스', sub: '강함' },
    { id: 'takedown', label: '테이크다운', sub: '태클' },
    { id: 'clinch', label: '클린치', sub: '잡기' },
    { id: 'submission', label: '서브미션', sub: '관절기' },
    { id: 'guard', label: '가드', sub: '방어' },
    { id: 'evade', label: '회피', sub: '피하기' },
  ],
  웰라운더: [
    { id: 'jab', label: '잽', sub: '빠름' },
    { id: 'cross', label: '크로스', sub: '강함' },
    { id: 'hook', label: '훅', sub: '묵직' },
    { id: 'lowKick', label: '로우킥', sub: '다리' },
    { id: 'takedown', label: '테이크다운', sub: '태클' },
    { id: 'guard', label: '가드', sub: '방어' },
    { id: 'evade', label: '회피', sub: '피하기' },
  ],
}

const MomentumBar = ({ value, color }) => (
  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-500 ${color}`}
      style={{ width: `${value}%` }}
    />
  </div>
)

const HPBar = ({ hp, color }) => (
  <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-300 ${color}`}
      style={{ width: `${Math.max(0, hp)}%` }}
    />
  </div>
)

// 파이터 스프라이트 컴포넌트
const FighterSprite = ({ fighter, side, isHit, isAttacking, isGuarding, isEvading, isKO, isGroggy }) => {
  const getStateClass = () => {
    if (isKO) return 'opacity-30 translate-y-4'
    if (isGroggy) return 'animate-bounce opacity-70'
    if (isHit) return side === 'left' ? '-translate-x-2 opacity-80' : 'translate-x-2 opacity-80'
    if (isAttacking) return side === 'left' ? 'translate-x-3' : '-translate-x-3'
    if (isGuarding) return 'scale-95 opacity-90'
    if (isEvading) return side === 'left' ? '-translate-x-3 opacity-70' : 'translate-x-3 opacity-70'
    return ''
  }

  return (
    <div className={`relative flex flex-col items-center transition-all duration-150 ${getStateClass()}`}>
      {/* 선수 이미지 */}
      <div className={`w-24 h-32 md:w-32 md:h-44 overflow-hidden rounded-lg ${side === 'right' ? 'scale-x-[-1]' : ''}`}>
        <img
          src={fighter.img}
          alt={fighter.nickname}
          className="w-full h-full object-cover object-top"
          onError={e => {
            e.target.style.display = 'none'
            e.target.parentElement.classList.add('bg-gray-700')
          }}
        />
      </div>

      {/* 가드 이펙트 */}
      {isGuarding && (
        <div className="absolute inset-0 border-2 border-blue-400/60 rounded-lg bg-blue-400/10 flex items-center justify-center">
          <span className="text-blue-400 font-black text-xs">GUARD</span>
        </div>
      )}

      {/* 히트 이펙트 */}
      {isHit && !isGuarding && (
        <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center">
          <span className="text-red-400 font-black text-sm animate-ping">💥</span>
        </div>
      )}

      {/* KO 이펙트 */}
      {isKO && (
        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
          <span className="text-red-500 font-black text-lg">KO</span>
        </div>
      )}

      {/* 이름 */}
      <p className={`text-[10px] font-bold mt-1 ${side === 'left' ? 'text-yellow-400' : 'text-red-400'}`}>
        {fighter.nickname}
      </p>
    </div>
  )
}

// 액션 배너
const ActionBanner = ({ event }) => {
  if (!event) return null
  const isKO = event.type === 'ko'
  const isCounter = event.isCounter
  const isKnockdown = event.isKnockdown

  return (
    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none text-center transition-all duration-200 ${
      isKO ? 'scale-150' : isKnockdown ? 'scale-125' : 'scale-100'
    }`}>
      {isKO && <p className="text-red-500 font-black text-4xl drop-shadow-lg animate-pulse">KO!</p>}
      {isKnockdown && !isKO && <p className="text-orange-400 font-black text-2xl drop-shadow-lg">KNOCKDOWN!</p>}
      {isCounter && !isKO && !isKnockdown && <p className="text-cyan-400 font-black text-xl drop-shadow-lg">COUNTER!</p>}
    </div>
  )
}

export default function Fight() {
  const navigate = useNavigate()
  const player = JSON.parse(localStorage.getItem('player') || '{}')
  const opponent = JSON.parse(localStorage.getItem('opponent') || '{}')

  const [playerHP, setPlayerHP] = useState(100)
  const [opponentHP, setOpponentHP] = useState(100)
  const [playerStamina, setPlayerStamina] = useState(100)
  const [playerMomentum, setPlayerMomentum] = useState(50)
  const [opponentMomentum, setOpponentMomentum] = useState(50)
  const [round, setRound] = useState(1)
  const [turnCount, setTurnCount] = useState(0)
  const [log, setLog] = useState([{ text: '🔔 1라운드 시작!', id: 0 }])
  const [phase, setPhase] = useState('player_turn')
  const [winner, setWinner] = useState(null)
  const [currentEvent, setCurrentEvent] = useState(null)
  const [spriteState, setSpriteState] = useState({
    playerAttacking: false, playerHit: false, playerGuarding: false, playerEvading: false, playerKO: false, playerGroggy: false,
    opponentAttacking: false, opponentHit: false, opponentGuarding: false, opponentEvading: false, opponentKO: false, opponentGroggy: false,
  })
  const [screenShake, setScreenShake] = useState(false)
  const [hitEffect, setHitEffect] = useState({ trigger: false, type: 'hit', side: 'right' })
  const [showKOOverlay, setShowKOOverlay] = useState(false)
  const logRef = useRef(null)
  const logIdRef = useRef(1)

  const buttons = ACTION_BUTTONS[player.type] || ACTION_BUTTONS['웰라운더']

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight)
  }, [log])

  const addLogs = (events) => {
    const newLogs = events.map(e => ({ text: e.text, id: logIdRef.current++, type: e.type }))
    setLog(prev => [...prev, ...newLogs].slice(-30))
  }

  const triggerSprite = (states, duration = 300) => {
    setSpriteState(prev => ({ ...prev, ...states }))
    setTimeout(() => setSpriteState(prev => {
      const reset = {}
      Object.keys(states).forEach(k => reset[k] = false)
      return { ...prev, ...reset }
    }), duration)
  }

  const triggerShake = () => {
    setScreenShake(true)
    setTimeout(() => setScreenShake(false), 400)
  }

  const triggerHitEffect = (type, side) => {
    setHitEffect({ trigger: Date.now(), type, side })
  }

  const handleAction = (btnId) => {
    if (phase !== 'player_turn') return
    const move = MOVES[btnId]
    if (!move || playerStamina < move.stamina) return

    setPhase('processing')

    const result = processTurn({
      playerMove: move,
      player, opponent,
      playerHP, opponentHP,
      playerStamina,
      playerMomentum, opponentMomentum,
      round,
    })

    // 이벤트 순서대로 시각 처리
    let delay = 0
    result.events.forEach((event, i) => {
      setTimeout(() => {
        setCurrentEvent(event)

        if (event.attacker === 'player') {
          if (event.type === 'attack') {
            triggerSprite({ playerAttacking: true }, 200)
            setTimeout(() => {
              if (event.result === 'hit' || event.result === 'knockdown') {
                triggerSprite({ opponentHit: true, opponentGroggy: event.isKnockdown }, 300)
                if (event.damage > 25 || event.isKnockdown) triggerShake()
                triggerHitEffect(event.isKnockdown ? 'knockdown' : event.isCounter ? 'counter' : 'hit', 'right')
              }
            }, 150)
          } else if (event.type === 'defense') {
            if (btnId === 'guard') triggerSprite({ playerGuarding: true }, 300)
            if (btnId === 'evade') triggerSprite({ playerEvading: true }, 300)
          }
        } else if (event.attacker === 'opponent') {
          if (event.type === 'attack') {
            triggerSprite({ opponentAttacking: true }, 200)
            setTimeout(() => {
              if (event.result === 'hit' || event.result === 'knockdown') {
                triggerSprite({ playerHit: true, playerGroggy: event.isKnockdown }, 300)
                if (event.damage > 25 || event.isKnockdown) triggerShake()
                triggerHitEffect(event.isKnockdown ? 'knockdown' : event.isCounter ? 'counter' : 'hit', 'left')
              }
              if (event.type === 'block') {
                triggerHitEffect('block', 'left')
              }
              if (event.type === 'block') triggerSprite({ playerGuarding: true }, 200)
            }, 150)
          }
        }

        if (event.type === 'ko') {
          if (event.attacker === 'player') triggerSprite({ opponentKO: true }, 5000)
          else triggerSprite({ playerKO: true }, 5000)
          setTimeout(() => setShowKOOverlay(true), 800)
        }

        setTimeout(() => setCurrentEvent(null), 800)
      }, delay)
      delay += 600
    })

    // 결과 반영
    setTimeout(() => {
      addLogs(result.events)
      setPlayerHP(result.newPlayerHP)
      setOpponentHP(result.newOpponentHP)
      setPlayerStamina(result.newPlayerStamina)
      setPlayerMomentum(result.newPlayerMomentum)
      setOpponentMomentum(result.newOpponentMomentum)

      if (result.isKO) {
        const w = result.events.find(e => e.type === 'ko')?.attacker === 'player' ? 'player' : 'opponent'
        setWinner(w)
        setPhase('game_over')
        return
      }

      // 라운드 종료
      setTimeout(() => {
        const newTurnCount = turnCount + 1
        setTurnCount(newTurnCount)
        if (round >= 3 && newTurnCount >= 3) {
          const pWin = result.newPlayerHP > result.newOpponentHP
          setWinner(pWin ? 'player' : 'opponent')
          addLogs([{ text: `⏱ 3라운드 종료! ${pWin ? player.nickname : opponent.nickname} 판정승!`, type: 'round' }])
          setPhase('game_over')
        } else if (newTurnCount >= 3) {
          setRound(r => r + 1)
          setTurnCount(0)
          setPlayerStamina(prev => Math.min(100, prev + 35))
          addLogs([{ text: `🔔 ${round + 1}라운드 시작!`, type: 'round' }])
          setPhase('player_turn')
        } else {
          setPhase('player_turn')
        }
      }, result.events.length * 600 + 200)
    }, result.events.length * 600)
  }

  const handleRematch = () => {
    setPlayerHP(100); setOpponentHP(100)
    setPlayerStamina(100)
    setPlayerMomentum(50); setOpponentMomentum(50)
    setRound(1)
    setLog([{ text: '🔔 1라운드 시작!', id: 0 }])
    setPhase('player_turn')
    setWinner(null)
    setSpriteState({
      playerAttacking: false, playerHit: false, playerGuarding: false, playerEvading: false, playerKO: false, playerGroggy: false,
      opponentAttacking: false, opponentHit: false, opponentGuarding: false, opponentEvading: false, opponentKO: false, opponentGroggy: false,
    })
  }

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white flex flex-col max-w-lg mx-auto transition-all ${screenShake ? 'animate-bounce' : ''}`}>

      {/* HUD 상단 */}
      <div className="bg-[#111] border-b border-yellow-500/20 px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/')} className="text-gray-500 text-sm">← 뒤로</button>
          <div className="text-center">
            <p className="text-[9px] text-yellow-500 uppercase tracking-widest">Round</p>
            <p className="text-lg font-black">{round} / 3</p>
          </div>
          <div className="w-8" />
        </div>

        {/* HP 바 */}
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-yellow-400 font-bold">{player.nickname}</span>
              <span className="text-[10px] text-gray-500">{playerHP}</span>
            </div>
            <HPBar hp={playerHP} color="bg-yellow-500" />
            <MomentumBar value={playerMomentum} color="bg-yellow-400/50" />
          </div>
          <span className="text-yellow-500 font-black text-sm">VS</span>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-gray-500">{opponentHP}</span>
              <span className="text-[10px] text-red-400 font-bold">{opponent.nickname}</span>
            </div>
            <HPBar hp={opponentHP} color="bg-red-500" />
            <MomentumBar value={opponentMomentum} color="bg-red-400/50" />
          </div>
        </div>

        {/* 스태미나 */}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[9px] text-gray-600">스태미나</span>
          <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${playerStamina}%` }} />
          </div>
          <span className="text-[9px] text-gray-600">{playerStamina}</span>
        </div>
      </div>

      {/* 3D 전투 씬 */}
      <div className="relative border-b border-gray-800 overflow-hidden">
        <Fight3DScene
          player={player}
          opponent={opponent}
          playerState={
            spriteState.playerKO ? 'ko' :
            spriteState.playerGroggy ? 'groggy' :
            spriteState.playerHit ? 'hit' :
            spriteState.playerGuarding ? 'guard' :
            spriteState.playerEvading ? 'evade' :
            spriteState.playerAttacking ? 'attack' : 'idle'
          }
          opponentState={
            spriteState.opponentKO ? 'ko' :
            spriteState.opponentGroggy ? 'groggy' :
            spriteState.opponentHit ? 'hit' :
            spriteState.opponentGuarding ? 'guard' :
            spriteState.opponentEvading ? 'evade' :
            spriteState.opponentAttacking ? 'attack' : 'idle'
          }
        />

        {/* 히트 이펙트 */}
        <div className="absolute inset-0 pointer-events-none">
          <HitEffect trigger={hitEffect.trigger} type={hitEffect.type} side={hitEffect.side} />
          <ActionBanner event={currentEvent} />
        </div>
      </div>

      {/* 전투 로그 */}
      <div ref={logRef} className="overflow-y-auto px-3 py-2 flex flex-col gap-0.5 bg-[#0d0d0d]" style={{ maxHeight: '100px' }}>
        {log.slice(-8).map(l => (
          <p key={l.id} className={`text-[11px] leading-relaxed ${
            l.type === 'ko' ? 'text-yellow-400 font-bold' :
            l.type === 'round' ? 'text-yellow-500/70' :
            l.text?.includes('나에게') || l.text?.includes(opponent?.nickname) ? 'text-red-400' :
            'text-gray-400'
          }`}>{l.text}</p>
        ))}
      </div>

      {/* 액션 버튼 */}
      {phase !== 'game_over' && (
        <div className="px-3 py-3 border-t border-gray-800 bg-[#111]">
          <p className="text-[9px] text-gray-600 mb-2 text-center">
            {phase === 'player_turn' ? '기술 선택' : '처리 중...'}
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {buttons.map(btn => {
              const move = MOVES[btn.id]
              const notEnoughStamina = playerStamina < (move?.stamina || 0)
              return (
                <button
                  key={btn.id}
                  onClick={() => handleAction(btn.id)}
                  disabled={phase !== 'player_turn' || notEnoughStamina}
                  className={`py-2 px-1 rounded-lg border text-center transition-all disabled:opacity-30 ${
                    btn.id === 'guard' || btn.id === 'evade'
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                      : move?.type === 'grapple'
                      ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                      : 'border-gray-700 bg-[#1a1a1a] text-white'
                  }`}
                >
                  <p className="text-[11px] font-bold">{btn.label}</p>
                  <p className="text-[8px] text-gray-500">{btn.sub}</p>
                  <p className="text-[8px] text-gray-600">-{move?.stamina}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 게임 오버 */}
      {phase === 'game_over' && (
        <div className="px-4 py-6 border-t border-gray-800 text-center bg-[#111]">
          <p className="text-4xl mb-2">{winner === 'player' ? '🏆' : '💀'}</p>
          <p className="text-xl font-black mb-1">
            {winner === 'player' ? `${player.nickname} 승리!` : `${opponent.nickname} 승리`}
          </p>
          <p className="text-[12px] text-gray-500 mb-6">
            {winner === 'player' ? '완벽한 경기였어!' : '다음엔 이길 수 있어!'}
          </p>
          <div className="flex gap-3">
            <button onClick={handleRematch} className="flex-1 py-3 border border-gray-700 rounded-xl text-gray-300 font-bold text-sm">
              다시 대결
            </button>
            <button onClick={() => navigate('/')} className="flex-1 py-3 bg-yellow-500 text-black rounded-xl font-black text-sm">
              파이터 변경
            </button>
          </div>
        </div>
      )}
    {/* KO 오버레이 */}
      <KOOverlay
        isVisible={showKOOverlay}
        winner={winner === 'player' ? player : opponent}
        loser={winner === 'player' ? opponent : player}
        round={round}
        onClose={(action) => {
          setShowKOOverlay(false)
          if (action === 'rematch') handleRematch()
          else navigate('/')
        }}
      />

    </div>
  )
}