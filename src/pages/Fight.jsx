import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const ACTIONS = {
  striker: [
    { id: 'jab', name: '잽', type: 'strike', power: 15, speed: 95, stamina: 5 },
    { id: 'cross', name: '크로스', type: 'strike', power: 25, speed: 75, stamina: 10 },
    { id: 'hook', name: '훅', type: 'strike', power: 30, speed: 65, stamina: 12 },
    { id: 'kick', name: '하이킥', type: 'strike', power: 35, speed: 60, stamina: 15 },
    { id: 'special', name: '필살기', type: 'special', power: 50, speed: 50, stamina: 25 },
  ],
  grappler: [
    { id: 'takedown', name: '테이크다운', type: 'grapple', power: 20, speed: 70, stamina: 15 },
    { id: 'clinch', name: '클린치', type: 'grapple', power: 15, speed: 75, stamina: 10 },
    { id: 'submission', name: '서브미션 시도', type: 'grapple', power: 40, speed: 55, stamina: 20 },
    { id: 'slam', name: '슬램', type: 'grapple', power: 35, speed: 50, stamina: 18 },
    { id: 'special', name: '필살기', type: 'special', power: 55, speed: 45, stamina: 25 },
  ],
  wellarounder: [
    { id: 'jab', name: '잽', type: 'strike', power: 15, speed: 90, stamina: 5 },
    { id: 'cross', name: '크로스', type: 'strike', power: 25, speed: 72, stamina: 10 },
    { id: 'takedown', name: '테이크다운', type: 'grapple', power: 22, speed: 68, stamina: 15 },
    { id: 'knee', name: '무릎 차기', type: 'strike', power: 30, speed: 65, stamina: 12 },
    { id: 'special', name: '필살기', type: 'special', power: 48, speed: 52, stamina: 25 },
  ],
}

const getActions = (type) => {
  if (type === '스트라이커') return ACTIONS.striker
  if (type === '그래플러') return ACTIONS.grappler
  return ACTIONS.wellarounder
}

const calcDamage = (action, attacker, defender) => {
  const isStrike = action.type === 'strike' || action.type === 'special'
  const attackStat = isStrike ? attacker.stats.sPower : attacker.stats.gPower
  const defenseStat = isStrike ? defender.stats.sDefense : defender.stats.gDefense
  const speedBonus = attacker.stats.sSpeed > defender.stats.sSpeed ? 1.1 : 0.9
  const base = (action.power * attackStat) / 100
  const reduction = (defenseStat / 200)
  const damage = Math.max(5, Math.round(base * speedBonus * (1 - reduction) + Math.random() * 10 - 5))
  return damage
}

export default function Fight() {
  const navigate = useNavigate()
  const player = JSON.parse(localStorage.getItem('player') || '{}')
  const opponent = JSON.parse(localStorage.getItem('opponent') || '{}')

  const [playerHP, setPlayerHP] = useState(100)
  const [opponentHP, setOpponentHP] = useState(100)
  const [playerStamina, setPlayerStamina] = useState(100)
  const [round, setRound] = useState(1)
  const [log, setLog] = useState(['🔔 1라운드 시작!'])
  const [phase, setPhase] = useState('player_turn') // player_turn → enemy_turn → round_end → game_over
  const [winner, setWinner] = useState(null)
  const [selectedAction, setSelectedAction] = useState(null)
  const [shaking, setShaking] = useState(null)
  const logRef = useRef(null)

  const playerActions = getActions(player.type)

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight)
  }, [log])

  const addLog = (msg) => setLog(prev => [...prev, msg])

  const shake = (target) => {
    setShaking(target)
    setTimeout(() => setShaking(null), 400)
  }

  const handleAction = (action) => {
    if (phase !== 'player_turn' || playerStamina < action.stamina) return
    setSelectedAction(action.id)
    setPhase('processing')

    // 플레이어 공격
    const dmg = calcDamage(action, player, opponent)
    const newOppHP = Math.max(0, opponentHP - dmg)
    setOpponentHP(newOppHP)
    setPlayerStamina(prev => Math.max(0, prev - action.stamina))
    shake('opponent')

    const actionEmoji = action.type === 'grapple' ? '🤼' : action.type === 'special' ? '💥' : '🥊'
    addLog(`${actionEmoji} 내가 ${action.name} → ${opponent.nickname}에게 ${dmg} 데미지!`)

    // KO 체크
    if (newOppHP <= 0) {
      setTimeout(() => {
        addLog(`🏆 KO! ${player.nickname} 승리!`)
        setWinner('player')
        setPhase('game_over')
      }, 600)
      return
    }

    // AI 반격
    setTimeout(() => {
      const aiActions = getActions(opponent.type)
      const aiAction = aiActions[Math.floor(Math.random() * (aiActions.length - 1))]
      const aiDmg = calcDamage(aiAction, opponent, player)
      const newPlayerHP = Math.max(0, playerHP - aiDmg)
      setPlayerHP(newPlayerHP)
      shake('player')

      const aiEmoji = aiAction.type === 'grapple' ? '🤼' : '🥊'
      addLog(`${aiEmoji} ${opponent.nickname}의 ${aiAction.name} → 나에게 ${aiDmg} 데미지!`)

      if (newPlayerHP <= 0) {
        setTimeout(() => {
          addLog(`💀 KO... ${opponent.nickname} 승리`)
          setWinner('opponent')
          setPhase('game_over')
        }, 600)
        return
      }

      // 라운드 종료 체크 (3라운드)
      setTimeout(() => {
        if (round >= 3) {
          const pWin = playerHP > opponentHP
          addLog(`⏱ 3라운드 종료! ${pWin ? player.nickname : opponent.nickname} 판정승!`)
          setWinner(pWin ? 'player' : 'opponent')
          setPhase('game_over')
        } else {
          setRound(r => r + 1)
          setPlayerStamina(prev => Math.min(100, prev + 30))
          addLog(`🔔 ${round + 1}라운드 시작!`)
          setPhase('player_turn')
        }
        setSelectedAction(null)
      }, 800)
    }, 800)
  }

  const HPBar = ({ hp, color, shakeTarget, target }) => (
    <div className={`transition-all ${shaking === target ? 'translate-x-1' : ''}`}>
      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${hp}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-500 mt-0.5">{hp} / 100</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col max-w-lg mx-auto">

      {/* 헤더 */}
      <div className="bg-[#111] border-b border-yellow-500/20 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-gray-500 text-sm">← 뒤로</button>
        <div className="text-center">
          <p className="text-[10px] text-yellow-500 uppercase tracking-widest">Round</p>
          <p className="text-xl font-black">{round} / 3</p>
        </div>
        <div className="w-8" />
      </div>

      {/* HP 바 영역 */}
      <div className="px-4 py-4 bg-[#111] border-b border-gray-800">
        <div className="flex gap-4">
          {/* 플레이어 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <img src={player.img} className="w-8 h-8 rounded-full object-cover object-top bg-gray-800" onError={e => e.target.style.display='none'} />
              <div>
                <p className="text-[11px] font-black text-yellow-400">{player.nickname}</p>
                <p className="text-[9px] text-gray-500">{player.type}</p>
              </div>
            </div>
            <HPBar hp={playerHP} color="bg-yellow-500" shakeTarget={shaking} target="player" />
            <div className="mt-1">
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{width: `${playerStamina}%`}} />
              </div>
              <p className="text-[9px] text-gray-600">스태미나 {playerStamina}</p>
            </div>
          </div>

          <div className="text-yellow-500 font-black text-lg self-center">VS</div>

          {/* 상대 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 justify-end">
              <div className="text-right">
                <p className="text-[11px] font-black text-red-400">{opponent.nickname}</p>
                <p className="text-[9px] text-gray-500">{opponent.type}</p>
              </div>
              <img src={opponent.img} className="w-8 h-8 rounded-full object-cover object-top bg-gray-800" onError={e => e.target.style.display='none'} />
            </div>
            <HPBar hp={opponentHP} color="bg-red-500" shakeTarget={shaking} target="opponent" />
          </div>
        </div>
      </div>

      {/* 전투 로그 */}
      <div ref={logRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1 min-h-[180px] max-h-[220px]">
        {log.map((l, i) => (
          <p key={i} className={`text-[12px] ${l.includes('KO') || l.includes('승리') ? 'text-yellow-400 font-bold' : l.includes('나에게') ? 'text-red-400' : 'text-gray-300'}`}>
            {l}
          </p>
        ))}
      </div>

      {/* 액션 버튼 */}
      {phase !== 'game_over' && (
        <div className="px-4 pb-6 pt-2 border-t border-gray-800">
          <p className="text-[10px] text-gray-500 mb-2 text-center">
            {phase === 'player_turn' ? '기술을 선택해줘' : '상대가 반격 중...'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {playerActions.map(action => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                disabled={phase !== 'player_turn' || playerStamina < action.stamina}
                className={`py-3 px-2 rounded-xl border text-center transition-all ${
                  action.type === 'special'
                    ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                    : action.type === 'grapple'
                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                    : 'border-gray-700 bg-[#1a1a1a] text-white'
                } disabled:opacity-30`}
              >
                <p className="text-[12px] font-bold">{action.name}</p>
                <p className="text-[9px] text-gray-500 mt-0.5">파워 {action.power}</p>
                <p className="text-[9px] text-gray-600">스태 -{action.stamina}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 게임 오버 */}
      {phase === 'game_over' && (
        <div className="px-4 pb-8 pt-4 border-t border-gray-800 text-center">
          <p className="text-3xl mb-2">{winner === 'player' ? '🏆' : '💀'}</p>
          <p className="text-xl font-black mb-1">
            {winner === 'player' ? `${player.nickname} 승리!` : `${opponent.nickname} 승리`}
          </p>
          <p className="text-[12px] text-gray-500 mb-6">
            {winner === 'player' ? '완벽한 경기였어!' : '다음엔 이길 수 있어!'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setPlayerHP(100); setOpponentHP(100); setPlayerStamina(100); setRound(1); setLog(['🔔 1라운드 시작!']); setPhase('player_turn'); setWinner(null) }}
              className="flex-1 py-3 border border-gray-700 rounded-xl text-gray-300 font-bold text-sm"
            >
              다시 대결
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 bg-yellow-500 text-black rounded-xl font-black text-sm"
            >
              파이터 변경
            </button>
          </div>
        </div>
      )}
    </div>
  )
}