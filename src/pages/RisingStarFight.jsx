import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FIGHTERS, WEIGHT_CLASSES } from '../data/fighters.js'

const TYPE_COLOR = {
  G: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  S: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  B: 'text-red-400 bg-red-400/10 border-red-400/30',
  W: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
}
const TYPE_LABEL = { G: '🤼 그래플러', S: '🦵 스트라이커', B: '🥊 복서', W: '⚡ 웰라운더' }

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))
const avg = (...values) => Math.round(values.reduce((sum, v) => sum + (Number(v) || 0), 0) / values.length)
const getFighterSummaryStats = (fighter) => {
  const st = fighter?.stats || {}
  return [
    { label: '펀치', value: avg(st.punchPower, st.punchSpeed), color: 'bg-red-500' },
    { label: '킥', value: avg(st.kickPower, st.kickSpeed), color: 'bg-orange-400' },
    { label: 'TD', value: avg(st.tdPower, st.tdSpeed), color: 'bg-blue-500' },
    { label: 'TD방어', value: Math.round(st.tdDefense || 0), color: 'bg-cyan-400' },
    { label: '카디오', value: avg(st.stamina, st.recovery), color: 'bg-emerald-400' },
    { label: '맷집', value: Math.round(st.chin || 0), color: 'bg-purple-400' },
  ]
}
const getStatBarWidth = (value) => `${clamp(((value - 50) / 50) * 88 + 12, 6, 100)}%`
const getStatTone = (value) => value >= 90 ? 'text-yellow-300' : value >= 80 ? 'text-white' : value >= 70 ? 'text-gray-300' : 'text-gray-500'

export default function RisingStarFight() {
  const navigate = useNavigate()
  const [selectedWeight, setSelectedWeight] = useState('플라이급')
  const [player, setPlayer] = useState(null)
  const [opponent, setOpponent] = useState(null)
  const [step, setStep] = useState('select_player')
  const [opponentWeight, setOpponentWeight] = useState('플라이급')

  const handleSelectPlayer = (f) => {
    setPlayer(f)
    setOpponent(null)
    setStep('select_opponent')
  }

  const handleSelectOpponent = (f) => {
    if (f.id === player.id) return
    setOpponent(f)
    setStep('ready')
  }

  const handleFight = () => {
    localStorage.setItem('rs_player', JSON.stringify(player))
    localStorage.setItem('rs_opponent', JSON.stringify(opponent))
    navigate('/rising-star/fight/arena')
  }

  const handleReset = () => {
    setPlayer(null)
    setOpponent(null)
    setStep('select_player')
  }

  const currentWeightFighters = FIGHTERS[step === 'select_opponent' ? opponentWeight : selectedWeight] || []

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">

      {/* 헤더 */}
      <div className="bg-[#111] border-b border-yellow-500/30 px-4 py-3 text-center sticky top-0 z-20">
        <p className="text-[10px] tracking-widest text-yellow-500 uppercase mb-0.5">Blackcombat: The Rising Star</p>
        <h1 className="text-lg font-black tracking-tight">⚔️ 1vs1 드림매치</h1>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {step === 'select_player' && '나의 파이터를 선택해줘'}
          {step === 'select_opponent' && `✅ ${player.nickname} 선택 완료 → 상대 선택`}
          {step === 'ready' && `${player.nickname} 🆚 ${opponent.nickname}`}
        </p>
      </div>

      {/* VS 배너 */}
      {step === 'ready' && (
        <div className="flex items-center justify-center gap-4 px-4 py-3 bg-yellow-500/10 border-b border-yellow-500/20">
          <div className="text-center">
            <p className="text-yellow-400 font-black">{player.nickname}</p>
            <p className="text-[10px] text-gray-500">{player.rank} · {TYPE_LABEL[player.type]}</p>
          </div>
          <p className="text-xl font-black text-yellow-500">VS</p>
          <div className="text-center">
            <p className="text-red-400 font-black">{opponent.nickname}</p>
            <p className="text-[10px] text-gray-500">{opponent.rank} · {TYPE_LABEL[opponent.type]}</p>
          </div>
        </div>
      )}

      {/* 단계 안내 */}
      {step !== 'ready' && (
        <div className="px-4 py-2 bg-[#111] border-b border-gray-800">
          <p className="text-[11px] text-center font-bold">
            {step === 'select_player' ? '① 내 파이터 선택 → ② 상대 선택 (체급 무관)' : '② 상대 파이터 선택 (체급 무관)'}
          </p>
        </div>
      )}

      {/* 체급 탭 */}
      <div className="flex overflow-x-auto gap-2 px-3 py-2 border-b border-gray-800 no-scrollbar">
        {WEIGHT_CLASSES.map(w => {
          const active = step === 'select_opponent' ? opponentWeight === w : selectedWeight === w
          return (
            <button
              key={w}
              onClick={() => step === 'select_opponent' ? setOpponentWeight(w) : setSelectedWeight(w)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                active ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-transparent text-gray-400 border-gray-700'
              }`}
            >
              {w}
            </button>
          )
        })}
      </div>

      {/* 파이터 그리드 */}
      <div className="p-3 grid grid-cols-2 gap-2 max-w-lg mx-auto">
        {currentWeightFighters.map(f => {
          const isPlayer = player?.id === f.id
          const isOpponent = opponent?.id === f.id
          const isDisabled = step === 'select_opponent' && f.id === player?.id

          return (
            <button
              key={f.id}
              onClick={() => step === 'select_player' ? handleSelectPlayer(f) : handleSelectOpponent(f)}
              disabled={isDisabled}
              className={`relative rounded-xl overflow-hidden text-left border transition-all ${
                isPlayer ? 'border-yellow-400 bg-yellow-500/10' :
                isOpponent ? 'border-red-400 bg-red-500/10' :
                isDisabled ? 'border-gray-800 opacity-30' :
                'border-gray-800 bg-[#111] hover:border-gray-600 active:scale-95'
              }`}
            >
              <div className="w-full h-28 bg-[#1a1a1a] overflow-hidden">
                <img src={f.img} alt={f.nickname}
                  className="w-full h-full object-cover object-top"
                  onError={e => { e.target.style.display = 'none' }}
                />
              </div>
              <div className="absolute top-1.5 right-1.5 flex flex-col gap-0.5 items-end">
                {f.rank === 'CHAMP' && <span className="text-[8px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black">👑 CHAMP</span>}
                {f.rank !== 'CHAMP' && <span className="text-[8px] bg-gray-700/80 text-gray-300 px-1.5 py-0.5 rounded">{f.rank}</span>}
              </div>
              {isPlayer && <span className="absolute top-1.5 left-1.5 text-[8px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black">나</span>}
              {isOpponent && <span className="absolute top-1.5 left-1.5 text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black">상대</span>}
              <div className="p-2">
                <p className="text-[12px] font-black mb-0.5 truncate">{f.nickname}</p>
                <p className="text-[9px] text-gray-500 mb-1.5">{f.record}</p>
                <span className={`inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full border font-bold ${TYPE_COLOR[f.type] || TYPE_COLOR.W}`}>
                  {TYPE_LABEL[f.type] || TYPE_LABEL.W}
                </span>
                <div className="mt-2 grid grid-cols-2 gap-x-1.5 gap-y-1">
                  {getFighterSummaryStats(f).map(s => (
                    <div key={s.label} className="min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[7px] text-gray-500 leading-none">{s.label}</span>
                        <span className={`text-[7px] font-black leading-none tabular-nums ${getStatTone(s.value)}`}>{s.value}</span>
                      </div>
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: getStatBarWidth(s.value) }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-[#0a0a0a] border-t border-gray-800">
        <div className="max-w-lg mx-auto flex gap-2">
          {step !== 'select_player' && (
            <button onClick={handleReset} className="px-4 py-3 border border-gray-700 rounded-xl text-gray-400 text-sm font-bold">
              초기화
            </button>
          )}
          <button
            onClick={step === 'ready' ? handleFight : undefined}
            disabled={step !== 'ready'}
            className="flex-1 py-3 bg-yellow-500 text-black font-black text-base rounded-xl disabled:opacity-30 disabled:bg-gray-700 disabled:text-gray-500 transition-all"
          >
            {step === 'select_player' && '파이터를 선택해줘'}
            {step === 'select_opponent' && '상대를 선택해줘 (체급 무관)'}
            {step === 'ready' && '🥊 FIGHT!'}
          </button>
        </div>
      </div>

      {/* 뒤로가기 */}
      <button onClick={() => navigate('/rising-star')} className="fixed top-3 left-3 text-gray-600 text-sm z-30">
        ← 뒤로
      </button>
    </div>
  )
}