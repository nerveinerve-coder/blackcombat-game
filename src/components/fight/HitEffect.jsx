import { useEffect, useState } from 'react'

export default function HitEffect({ trigger, type = 'hit', side = 'right' }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (trigger) {
      setVisible(true)
      setTimeout(() => setVisible(false), 400)
    }
  }, [trigger])

  if (!visible) return null

  const position = side === 'right' ? 'right-8' : 'left-8'

  const effects = {
    hit: {
      color: 'text-red-400',
      size: 'text-2xl',
      icon: '💥',
      ring: 'border-red-500',
    },
    block: {
      color: 'text-blue-400',
      size: 'text-xl',
      icon: '🛡️',
      ring: 'border-blue-500',
    },
    counter: {
      color: 'text-cyan-400',
      size: 'text-2xl',
      icon: '⚡',
      ring: 'border-cyan-500',
    },
    knockdown: {
      color: 'text-orange-400',
      size: 'text-3xl',
      icon: '💫',
      ring: 'border-orange-500',
    },
    ko: {
      color: 'text-red-600',
      size: 'text-4xl',
      icon: '💀',
      ring: 'border-red-600',
    },
  }

  const effect = effects[type] || effects.hit

  return (
    <div className={`absolute top-1/3 ${position} z-30 pointer-events-none`}>
      {/* 충격선 */}
      <div className={`absolute inset-0 border-2 ${effect.ring} rounded-full animate-ping opacity-60`}
        style={{ width: '60px', height: '60px', marginLeft: '-30px', marginTop: '-30px' }} />

      {/* 이펙트 아이콘 */}
      <div className={`${effect.size} ${effect.color} animate-bounce`}>
        {effect.icon}
      </div>

      {/* 방사형 충격선 */}
      {(type === 'knockdown' || type === 'ko') && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
            <div
              key={deg}
              className="absolute w-8 h-0.5 bg-red-500/60 rounded-full animate-pulse"
              style={{ transform: `rotate(${deg}deg)`, transformOrigin: 'left center' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}