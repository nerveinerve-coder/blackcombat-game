import { useEffect, useRef } from 'react'

const COLORS = {
  bg: '#0a0a0a',
  cage: '#1a1a1a',
  floor: '#2a2a2a',
  floorLine: '#3a3a3a',
  playerHP: '#eab308',
  opponentHP: '#ef4444',
  hit: '#ef4444',
  counter: '#06b6d4',
  knockdown: '#f97316',
  ko: '#dc2626',
  guard: '#3b82f6',
  evade: '#8b5cf6',
}

const drawBackground = (ctx, w, h) => {
  // 배경
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, w, h)

  // 케이지 그리드
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 1
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  // 바닥
  const floorY = h * 0.78
  ctx.fillStyle = COLORS.floor
  ctx.fillRect(0, floorY, w, h - floorY)

  // 바닥 라인
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(w, floorY); ctx.stroke()

  // 중앙 라인
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  ctx.setLineDash([10, 10])
  ctx.beginPath(); ctx.moveTo(w / 2, floorY); ctx.lineTo(w / 2, h); ctx.stroke()
  ctx.setLineDash([])

  // 조명 효과
  const gradient = ctx.createRadialGradient(w / 2, h * 0.5, 0, w / 2, h * 0.5, w * 0.6)
  gradient.addColorStop(0, 'rgba(255,200,100,0.04)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
}

const drawFighter = (ctx, fighter, x, y, side, state, img, imgCache) => {
  const flipped = side === 'right'
  const w = 90
  const h = 130

  ctx.save()
  if (flipped) {
    ctx.scale(-1, 1)
    ctx.translate(-x * 2 - w, 0)
  }

  // 상태별 색상/효과
  let alpha = 1
  let offsetX = 0
  let offsetY = 0
  let tint = null

  if (state === 'hit') {
    alpha = 0.8
    offsetX = flipped ? -8 : 8
    tint = 'rgba(255,0,0,0.4)'
  } else if (state === 'attack') {
    offsetX = flipped ? -12 : 12
  } else if (state === 'guard') {
    tint = 'rgba(59,130,246,0.3)'
    alpha = 0.9
  } else if (state === 'evade') {
    offsetX = flipped ? 15 : -15
    alpha = 0.6
  } else if (state === 'groggy') {
    offsetX = Math.sin(Date.now() / 100) * 4
    alpha = 0.85
    tint = 'rgba(255,100,0,0.3)'
  } else if (state === 'ko') {
    offsetY = 30
    alpha = 0.4
    tint = 'rgba(0,0,0,0.5)'
  }

  ctx.globalAlpha = alpha

  // 선수 이미지 또는 실루엣
  const cacheKey = fighter.id
  if (imgCache[cacheKey] && imgCache[cacheKey].complete && imgCache[cacheKey].naturalWidth > 0) {
    // 이미지 그리기
    if (tint) {
      ctx.drawImage(imgCache[cacheKey], x + offsetX, y + offsetY, w, h)
      ctx.fillStyle = tint
      ctx.fillRect(x + offsetX, y + offsetY, w, h)
    } else {
      ctx.drawImage(imgCache[cacheKey], x + offsetX, y + offsetY, w, h)
    }
  } else {
    // 실루엣 폴백
    ctx.fillStyle = tint || (side === 'left' ? 'rgba(234,179,8,0.8)' : 'rgba(239,68,68,0.8)')
    ctx.beginPath()
    // 머리
    ctx.arc(x + offsetX + w/2, y + offsetY + 20, 18, 0, Math.PI * 2)
    ctx.fill()
    // 몸통
    ctx.fillRect(x + offsetX + w/2 - 18, y + offsetY + 35, 36, 50)
    // 다리
    ctx.fillRect(x + offsetX + w/2 - 18, y + offsetY + 82, 14, 45)
    ctx.fillRect(x + offsetX + w/2 + 4, y + offsetY + 82, 14, 45)
  }

  // 가드 이펙트
  if (state === 'guard') {
    ctx.strokeStyle = 'rgba(59,130,246,0.8)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(x + offsetX - 5, y + offsetY - 5, w + 10, h + 10, 10)
    ctx.stroke()
  }

  ctx.globalAlpha = 1
  ctx.restore()

  // 닉네임
  ctx.fillStyle = side === 'left' ? '#eab308' : '#ef4444'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(fighter.nickname, x + w / 2, y + h + 16)
}

const drawHitEffect = (ctx, x, y, type, progress) => {
  if (progress <= 0) return
  const alpha = progress

  ctx.save()
  ctx.globalAlpha = alpha

  if (type === 'hit') {
    // 충격선
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const len = 20 + (1 - progress) * 15
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(angle) * 10, y + Math.sin(angle) * 10)
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len)
      ctx.stroke()
    }
    // 중앙 원
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(x, y, 8 * progress, 0, Math.PI * 2)
    ctx.fill()

  } else if (type === 'counter') {
    ctx.strokeStyle = '#06b6d4'
    ctx.lineWidth = 3
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const len = 25 + (1 - progress) * 20
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8)
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len)
      ctx.stroke()
    }

  } else if (type === 'knockdown') {
    // 큰 폭발
    ctx.strokeStyle = '#f97316'
    ctx.lineWidth = 4
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2
      const len = 35 + (1 - progress) * 25
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(angle) * 12, y + Math.sin(angle) * 12)
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(249,115,22,0.3)'
    ctx.beginPath()
    ctx.arc(x, y, 40 * (1 - progress), 0, Math.PI * 2)
    ctx.fill()

  } else if (type === 'block') {
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(x, y, 20 * (1 - progress * 0.5), 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.globalAlpha = 1
  ctx.restore()
}

const drawActionBanner = (ctx, w, h, event, progress) => {
  if (!event || progress <= 0) return

  ctx.save()
  ctx.globalAlpha = Math.min(1, progress * 2)

  let text = ''
  let color = '#ffffff'
  let size = 28

  if (event.type === 'ko') {
    text = 'K.O.'; color = '#dc2626'; size = 52
  } else if (event.isKnockdown) {
    text = 'KNOCKDOWN!'; color = '#f97316'; size = 32
  } else if (event.isCounter) {
    text = 'COUNTER!'; color = '#06b6d4'; size = 30
  } else if (event.type === 'block') {
    text = 'BLOCK'; color = '#3b82f6'; size = 24
  } else if (event.action === 'highKick' && event.result === 'hit') {
    text = 'HIGH KICK!'; color = '#ef4444'; size = 28
  } else if (event.action === 'submission' && event.result === 'hit') {
    text = 'SUBMISSION!'; color = '#8b5cf6'; size = 28
  } else {
    return
  }

  const scale = 0.8 + progress * 0.2
  ctx.font = `bold ${size}px sans-serif`
  ctx.textAlign = 'center'

  // 그림자
  ctx.shadowColor = color
  ctx.shadowBlur = 20
  ctx.fillStyle = color
  ctx.save()
  ctx.translate(w / 2, h * 0.38)
  ctx.scale(scale, scale)
  ctx.fillText(text, 0, 0)
  ctx.restore()

  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
  ctx.restore()
}

export default function FightCanvas({
  player, opponent,
  playerState, opponentState,
  currentEvent, hitEffect,
  width = 400, height = 280,
}) {
  const canvasRef = useRef(null)
  const imgCacheRef = useRef({})
  const animFrameRef = useRef(null)
  const hitProgressRef = useRef(0)
  const bannerProgressRef = useRef(0)
  const lastEventRef = useRef(null)

  // 이미지 프리로드
  useEffect(() => {
    if (player?.img) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = player.img
      imgCacheRef.current[player.id] = img
    }
    if (opponent?.img) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = opponent.img
      imgCacheRef.current[opponent.id] = img
    }
  }, [player, opponent])

  // 히트 이펙트 트리거
  useEffect(() => {
    if (hitEffect?.trigger) {
      hitProgressRef.current = 1
    }
  }, [hitEffect?.trigger])

  // 배너 트리거
  useEffect(() => {
    if (currentEvent) {
      lastEventRef.current = currentEvent
      bannerProgressRef.current = 1
    }
  }, [currentEvent])

  // 렌더 루프
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    const floorY = h * 0.78
    const playerX = w * 0.08
    const opponentX = w * 0.52
    const fighterY = floorY - 145

    const render = () => {
      ctx.clearRect(0, 0, w, h)
      drawBackground(ctx, w, h)

      // 파이터 그리기
      drawFighter(ctx, player, playerX, fighterY, 'left', playerState, null, imgCacheRef.current)
      drawFighter(ctx, opponent, opponentX, fighterY, 'right', opponentState, null, imgCacheRef.current)

      // 히트 이펙트
      if (hitProgressRef.current > 0) {
        const side = hitEffect?.side
        const ex = side === 'left' ? playerX + 45 : opponentX + 45
        const ey = fighterY + 50
        drawHitEffect(ctx, ex, ey, hitEffect?.type || 'hit', hitProgressRef.current)
        hitProgressRef.current = Math.max(0, hitProgressRef.current - 0.06)
      }

      // 액션 배너
      if (bannerProgressRef.current > 0) {
        drawActionBanner(ctx, w, h, lastEventRef.current, bannerProgressRef.current)
        bannerProgressRef.current = Math.max(0, bannerProgressRef.current - 0.04)
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [player, opponent, playerState, opponentState, hitEffect, currentEvent])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}