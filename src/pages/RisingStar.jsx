import { useNavigate } from 'react-router-dom'

export default function RisingStar() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center relative overflow-hidden">

      {/* 배경 효과 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#1a0505] to-[#0a0a0a]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-yellow-500/5 blur-3xl" />
      </div>

      {/* 로고 */}
      <div className="relative z-10 text-center mb-16">
        <p className="text-yellow-500 text-xs tracking-[0.4em] uppercase mb-3">Black Combat</p>
        <h1 className="text-5xl font-black tracking-tight mb-2">BLACKCOMBAT</h1>
        <div className="flex items-center gap-3 justify-center">
          <div className="h-px w-12 bg-yellow-500/50" />
          <p className="text-yellow-400 text-sm tracking-[0.3em] uppercase">The Rising Star</p>
          <div className="h-px w-12 bg-yellow-500/50" />
        </div>
      </div>

      {/* 메뉴 */}
      <div className="relative z-10 flex flex-col gap-4 w-full max-w-sm px-6">

        {/* 1vs1 드림매치 */}
        <button
          onClick={() => navigate('/rising-star/fight')}
          className="group relative w-full py-5 px-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/15 hover:border-yellow-500/60 transition-all duration-300 text-left overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] text-yellow-500/70 uppercase tracking-widest mb-1">Mode 01</p>
          <p className="text-xl font-black mb-1">1vs1 드림매치</p>
          <p className="text-xs text-gray-500">블랙컴뱃 선수들로 꿈의 대결을 펼쳐라</p>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-yellow-500 text-2xl opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</div>
        </button>

        {/* 라이징 스타 만들기 - 잠금 */}
        <button
          disabled
          className="relative w-full py-5 px-6 rounded-2xl border border-gray-800 bg-gray-900/30 text-left overflow-hidden opacity-60 cursor-not-allowed"
        >
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
            <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full">
              <span className="text-lg">🔒</span>
              <span className="text-xs text-gray-400 font-bold">Coming Soon</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Mode 02</p>
          <p className="text-xl font-black mb-1 text-gray-600">라이징 스타 만들기</p>
          <p className="text-xs text-gray-700">나만의 파이터를 키워 챔피언에 도전하라</p>
        </button>

      </div>

      {/* 뒤로가기 */}
      <button
        onClick={() => navigate('/')}
        className="relative z-10 mt-12 text-gray-600 text-sm hover:text-gray-400 transition-colors"
      >
        ← 블랙컴뱃 게임으로
      </button>

    </div>
  )
}