import { useEffect, useState } from 'react'

export default function KOOverlay({ winner, loser, round, isVisible, onClose }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => setShow(true), 300)
    } else {
      setShow(false)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-500 ${
      show ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* 어두운 배경 */}
      <div className="absolute inset-0 bg-black/85" />

      {/* 조명 효과 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-500/20 rounded-full blur-3xl" />

      {/* KO 텍스트 */}
      <div className="relative z-10 text-center px-6">
        <p className="text-[11px] tracking-[0.3em] text-gray-400 uppercase mb-2">Black Combat</p>

        <div className={`transition-all duration-700 ${show ? 'scale-100' : 'scale-50'}`}>
          <p className="text-7xl font-black text-red-500 mb-2 drop-shadow-2xl"
            style={{ textShadow: '0 0 40px rgba(239,68,68,0.8)' }}>
            K.O.
          </p>
        </div>

        <p className="text-2xl font-black text-white mb-1">{winner?.nickname}</p>
        <p className="text-sm text-yellow-400 mb-4">승리</p>

        <div className="border-t border-gray-700 pt-4 mt-4 mb-8">
          <p className="text-[11px] text-gray-500">Round {round}</p>
          {loser && <p className="text-[11px] text-gray-600">{loser.nickname} KO</p>}
        </div>

        {/* 버튼들 */}
        <div className="flex gap-3 w-full max-w-xs mx-auto">
          <button
            onClick={() => { setShow(false); onClose('rematch') }}
            className="flex-1 py-3 border border-gray-700 rounded-xl text-gray-300 font-bold text-sm"
          >
            다시 대결
          </button>
          <button
            onClick={() => { setShow(false); onClose('home') }}
            className="flex-1 py-3 bg-yellow-500 text-black rounded-xl font-black text-sm"
          >
            파이터 변경
          </button>
        </div>
      </div>

      {/* 하단 라인 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
    </div>
  )
}