import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

const loadGLTF = (url) => new Promise(r => {
  new GLTFLoader().load(url, (g) => { r(g) })
})

function Joystick({ onMove, side }) {
  const stickRef = useRef()
  const activeRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0 })

  const handleStart = (e) => {
    activeRef.current = true
    const touch = e.touches ? e.touches[0] : e
    startRef.current = { x: touch.clientX, y: touch.clientY }
  }
  const handleMove = (e) => {
    if (!activeRef.current) return
    const touch = e.touches ? e.touches[0] : e
    const dx = touch.clientX - startRef.current.x
    const dy = touch.clientY - startRef.current.y
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 40)
    const angle = Math.atan2(dy, dx)
    const nx = Math.cos(angle) * dist
    const ny = Math.sin(angle) * dist
    if (stickRef.current) stickRef.current.style.transform = `translate(${nx}px, ${ny}px)`
    onMove({ x: nx / 40, y: ny / 40 })
  }
  const handleEnd = () => {
    activeRef.current = false
    if (stickRef.current) stickRef.current.style.transform = 'translate(0px, 0px)'
    onMove({ x: 0, y: 0 })
  }

  return (
    <div
      onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
      onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd}
      style={{
        width: 100, height: 100, borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', touchAction: 'none',
      }}
    >
      <div ref={stickRef} style={{
        width: 44, height: 44, borderRadius: '50%',
        background: side === 'left' ? 'rgba(234,179,8,0.6)' : 'rgba(239,68,68,0.6)',
        border: '2px solid rgba(255,255,255,0.4)',
        transition: 'transform 0.05s', pointerEvents: 'none',
      }} />
    </div>
  )
}

function ActionButton({ label, color, onPress, disabled }) {
  return (
    <button
      onTouchStart={onPress} onMouseDown={onPress} disabled={disabled}
      style={{
        width: 56, height: 56, borderRadius: '50%',
        background: disabled ? 'rgba(100,100,100,0.3)' : color,
        border: '2px solid rgba(255,255,255,0.3)',
        color: 'white', fontSize: 10, fontWeight: 'bold',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', lineHeight: 1.2,
        touchAction: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  )
}

const WEIGHT_CLASS_ORDER = ['여성 아톰급', '플라이급', '밴텀급', '페더급', '라이트급', '웰터급', '미들급', '헤비급']
const MIN_DIST = 120
const ATTACK_RANGE = 200
const MOVE_SPEED_PLAYER = 1.5
const MOVE_SPEED_AI = 0.6
const CAGE_X = 525
const CAGE_Z = 300

export default function RisingStarArena() {
  const navigate = useNavigate()
  const mountRef = useRef()
  const rendererRef = useRef()
  const sceneRef = useRef()
  const cameraRef = useRef()
  const playerRef = useRef()
  const opponentRef = useRef()
  const clockRef = useRef(new THREE.Clock())
  const animIdRef = useRef()
  const joystickRef = useRef({ x: 0, y: 0 })
  const walkDirRef = useRef({ dir: 'walk_forward', count: 0 })

  const [playerHP, setPlayerHP] = useState(100)
  const [opponentHP, setOpponentHP] = useState(100)
  const [playerStamina, setPlayerStamina] = useState(100)
  const [gameState, setGameState] = useState('fighting')
  const [actionLog, setActionLog] = useState('')

  const player = JSON.parse(localStorage.getItem('rs_player') || '{}')
  const opponent = JSON.parse(localStorage.getItem('rs_opponent') || '{}')

  const playerHPRef = useRef(100)
  const opponentHPRef = useRef(100)
  const playerStaminaRef = useRef(100)
  const gameStateRef = useRef('fighting')
  const attackCooldownRef = useRef(false)
  const aiCooldownRef = useRef(false)

  const ANIM_MAP = {
    idle_G: 'idle_grappler', idle_S: 'idle_striker', idle_W: 'idle_wellounder',
    jab: 'jab', cross: 'straight', hook: 'hook',
    highKick: 'kick_high', lowKick: 'kick_low', bodyKick: 'kick_body',
    takedown: 'takedown_attack',
    hit_head: 'hit_head', hit_body: 'hit_body', hit_leg: 'hit_leg',
    knockdown: 'knockdown_backward', ko: 'ko',
    victory: 'victory', defeat: 'defeat',
  }

  const getDist = () => {
    if (!playerRef.current || !opponentRef.current) return 999
    const pp = playerRef.current.group.position
    const op = opponentRef.current.group.position
    return Math.sqrt((pp.x - op.x) ** 2 + (pp.z - op.z) ** 2)
  }

  const playAnim = (fighterObj, animName, loop = false, onEnd) => {
    if (!fighterObj) return
    const { actions } = fighterObj
    const anim = actions[animName]
    if (!anim) return
    const prev = fighterObj.currentAction
    anim.reset().play()
    anim.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, 1)
    anim.clampWhenFinished = !loop
    if (prev && prev !== anim) {
      prev.crossFadeTo(anim, 0.15, false)
    }
    fighterObj.currentAction = anim
    fighterObj.currentWalkAnim = null
    if (!loop) {
      fighterObj.isAttacking = true
      const duration = anim.getClip().duration * 1000
      setTimeout(() => {
        fighterObj.isAttacking = false
        if (onEnd) onEnd()
      }, duration)
    }
  }

  const returnToIdle = (fighterObj, type) => {
    if (!fighterObj) return
    if (fighterObj.isAttacking) return
    if (fighterObj.currentWalkAnim) return
    const idleAnimName = fighterObj.idleAnim || ANIM_MAP[`idle_${type}`] || 'idle_striker'
    const anim = fighterObj.actions[idleAnimName]
    if (!anim) return
    if (fighterObj.currentAction === anim) return
    const prev = fighterObj.currentAction
    if (prev) {
      anim.reset().play()
      prev.crossFadeTo(anim, 0.3, false)
    } else {
      anim.reset().fadeIn(0.3).setLoop(THREE.LoopRepeat, Infinity).play()
    }
    anim.setLoop(THREE.LoopRepeat, Infinity)
    fighterObj.currentAction = anim
  }

  const setupFighter = (gltf, side, fighterData) => {
    const cloned = SkeletonUtils.clone(gltf.scene)
    const mixer = new THREE.AnimationMixer(cloned)
    const actions = {}
    gltf.animations.forEach(clip => {
      actions[clip.name] = mixer.clipAction(clip.clone(), cloned)
    })

    const group = new THREE.Group()
    group.add(cloned)

    const height = fighterData?.height || 170
    const weightClass = fighterData?.weightClass || '라이트급'
    const weightMap = {
      '여성 아톰급': 52, '플라이급': 57, '밴텀급': 61,
      '페더급': 66, '라이트급': 70, '웰터급': 77,
      '미들급': 84, '헤비급': 120,
    }
    const weight = weightMap[weightClass] || 70
    const bmi = weight / ((height / 100) ** 2)
    const baseScale = 120 * (height / 170)
    const widthScale = baseScale * (0.85 + (bmi - 18) / 80)
    group.scale.set(widthScale, baseScale, widthScale)
    group.position.x = side === 'left' ? -120 : 120
    group.position.y = -120
    group.rotation.y = side === 'left' ? Math.PI / 2 + Math.PI / 12 : -(Math.PI / 2 + Math.PI / 12)

    sceneRef.current.add(group)

    const type = fighterData?.type || 'W'
    const idleAnimName = ANIM_MAP[`idle_${type}`] || 'idle_striker'
    const idle = actions[idleAnimName]
    if (idle) { idle.setLoop(THREE.LoopRepeat, Infinity); idle.play() }

    return { group, mixer, actions, currentAction: idle, type, idleAnim: idleAnimName }
  }

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const W = window.innerWidth
    const H = window.innerHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, W / H, 1, 10000)
    camera.position.set(0, 100, 420)
    camera.lookAt(0, 60, 0)
    cameraRef.current = camera

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const spotlight = new THREE.SpotLight(0xffffff, 2)
    spotlight.position.set(0, 500, 200)
    spotlight.angle = 0.4
    spotlight.penumbra = 0.5
    scene.add(spotlight)
    const leftLight = new THREE.PointLight(0xffcc00, 1.2, 600)
    leftLight.position.set(-200, 200, 150)
    scene.add(leftLight)
    const rightLight = new THREE.PointLight(0xff3300, 1.2, 600)
    rightLight.position.set(200, 200, 150)
    scene.add(rightLight)

    const octagonShape = new THREE.Shape()
      const R = 520
      for (let i = 0; i < 8; i++) {
        const angle = Math.PI / 8 + i * (Math.PI / 4)
        const x = R * Math.cos(angle)
        const y = R * Math.sin(angle)
        if (i === 0) octagonShape.moveTo(x, y)
        else octagonShape.lineTo(x, y)
      }
      octagonShape.closePath()

      const floorGeo = new THREE.ShapeGeometry(octagonShape)
      const floor = new THREE.Mesh(
        floorGeo,
        new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 })
      )
      floor.rotation.x = -Math.PI / 2
      floor.position.y = -120
      scene.add(floor)

      const edgeGeo = new THREE.EdgesGeometry(floorGeo)
      const edge = new THREE.LineSegments(
        edgeGeo,
        new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true })
      )
      edge.rotation.x = -Math.PI / 2
      edge.position.y = -119
      scene.add(edge)

    const playerUrl = player?.weightClass === '여성 아톰급' ? '/fighter.glb' : '/ybot.glb'
    const opponentUrl = opponent?.weightClass === '여성 아톰급' ? '/fighter.glb' : '/ybot.glb'

    Promise.all([loadGLTF(playerUrl), loadGLTF(opponentUrl)]).then(([playerGltf, opponentGltf]) => {
      playerRef.current = setupFighter(playerGltf, 'left', player)
      opponentRef.current = setupFighter(opponentGltf, 'right', opponent)
    })

    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate)
      const delta = clockRef.current.getDelta()
      const cam = cameraRef.current

      const joy = joystickRef.current
      if (playerRef.current && opponentRef.current && (Math.abs(joy.x) > 0.1 || Math.abs(joy.y) > 0.1)) {
        const speed = MOVE_SPEED_PLAYER
        const pp = playerRef.current.group
        const op = opponentRef.current.group
        const newX = pp.position.x + joy.x * speed
        const newZ = pp.position.z + joy.y * speed
        const dx = newX - op.position.x
        const dz = newZ - op.position.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist >= MIN_DIST) {
          pp.position.x = newX
          pp.position.z = newZ
        } else {
          const angle = Math.atan2(dz, dx)
          pp.position.x = op.position.x + Math.cos(angle) * MIN_DIST
          pp.position.z = op.position.z + Math.sin(angle) * MIN_DIST
        }
        pp.position.x = Math.max(-CAGE_X, Math.min(CAGE_X, pp.position.x))
        pp.position.z = Math.max(-CAGE_Z, Math.min(CAGE_Z, pp.position.z))
        const dx2 = op.position.x - pp.position.x
        const dz2 = op.position.z - pp.position.z
        if (Math.abs(dx2) > 0.01 || Math.abs(dz2) > 0.01) {
          pp.rotation.y = Math.atan2(dx2, dz2)
        }
      }

      if (opponentRef.current && playerRef.current && gameStateRef.current === 'fighting') {
        const op = opponentRef.current.group
        const pp = playerRef.current.group
        const dx = pp.position.x - op.position.x
        const dz = pp.position.z - op.position.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist > ATTACK_RANGE) {
          op.position.x += (dx / dist) * MOVE_SPEED_AI
          op.position.z += (dz / dist) * MOVE_SPEED_AI
        }
        const lookAngle = Math.atan2(pp.position.x - op.position.x, pp.position.z - op.position.z)
        op.rotation.y = lookAngle
      }

      if (playerRef.current && opponentRef.current) {
        const pp = playerRef.current.group.position
        const op = opponentRef.current.group.position
        const midX = (pp.x + op.x) / 2
        const midZ = (pp.z + op.z) / 2
        const dist = Math.sqrt((pp.x - op.x) ** 2 + (pp.z - op.z) ** 2)
        const camZ = Math.max(450, dist * 1.5 + 350)
        cam.position.x += (midX - cam.position.x) * 0.05
        cam.position.z += (midZ + camZ - cam.position.z) * 0.05
        cam.lookAt(midX, 60, midZ)
      }

      if (playerRef.current && !playerRef.current.isAttacking) {
          const joy = joystickRef.current
          const moving = Math.abs(joy.x) > 0.1 || Math.abs(joy.y) > 0.1
          if (moving) {
          let walkAnimName = 'walk_forward'
          const pp = playerRef.current.group
          const op = opponentRef.current.group
          const toOpX = op.position.x - pp.position.x
          const toOpZ = op.position.z - pp.position.z
          const len = Math.sqrt(toOpX * toOpX + toOpZ * toOpZ)
          const fwdX = toOpX / len
          const fwdZ = toOpZ / len
          const dot = joy.x * fwdX + joy.y * fwdZ
          const cross = joy.x * fwdZ - joy.y * fwdX
let candidateDir
if (Math.abs(dot) >= Math.abs(cross)) {
  candidateDir = dot > 0 ? 'walk_forward' : 'walk_backward'
} else {
  candidateDir = cross > 0 ? 'walk_left' : 'walk_right'
}
if (candidateDir === walkDirRef.current.dir) {
  walkDirRef.current.count = 0
} else {
  walkDirRef.current.count += 1
  if (walkDirRef.current.count >= 10) {
    walkDirRef.current.dir = candidateDir
    walkDirRef.current.count = 0
  }
}
walkAnimName = walkDirRef.current.dir
          const anim = playerRef.current.actions[walkAnimName]
          if (anim && playerRef.current.currentWalkAnim !== walkAnimName) {
            const prev = playerRef.current.currentAction
            anim.reset().play()
            anim.setLoop(THREE.LoopRepeat, Infinity)
            if (prev && prev !== anim) {
              prev.crossFadeTo(anim, 0.3, false)
            }
            playerRef.current.currentAction = anim
            playerRef.current.currentWalkAnim = walkAnimName
          }
        } else {
          playerRef.current.currentWalkAnim = null
          returnToIdle(playerRef.current, playerRef.current.type)
        }
      }
      if (opponentRef.current && playerRef.current && !opponentRef.current.isAttacking) {
          const op = opponentRef.current.group
          const pp = playerRef.current.group
          const dx = pp.position.x - op.position.x
          const dz = pp.position.z - op.position.z
          const dist = Math.sqrt(dx * dx + dz * dz)
  if (dist > ATTACK_RANGE) {
          const walkAnim = opponentRef.current.actions['walk_forward']
          if (walkAnim && opponentRef.current.currentAction !== walkAnim) {
            opponentRef.current.currentAction?.fadeOut(0.2)
            walkAnim.reset().fadeIn(0.2).setLoop(THREE.LoopRepeat, Infinity).play()
            opponentRef.current.currentAction = walkAnim
          }
        } else {
          returnToIdle(opponentRef.current, opponentRef.current.type)
        }
      }

      playerRef.current?.mixer.update(delta)
      opponentRef.current?.mixer.update(delta)
      renderer.render(scene, cam)
    }
    animate()

    return () => {
      cancelAnimationFrame(animIdRef.current)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      playerRef.current = null
      opponentRef.current = null
      sceneRef.current = null
      cameraRef.current = null
    }
  }, [])

  useEffect(() => {
    const aiLoop = setInterval(() => {
      if (gameStateRef.current !== 'fighting') return
      if (aiCooldownRef.current) return
      const dist = getDist()
      if (dist > ATTACK_RANGE) return
      const aiMoves = ['jab', 'cross', 'hook', 'highKick', 'lowKick']
      const move = aiMoves[Math.floor(Math.random() * aiMoves.length)]
      const damage = Math.floor(Math.random() * 12) + 5
      aiCooldownRef.current = true
      playAnim(opponentRef.current, ANIM_MAP[move])
      setTimeout(() => {
        const currentDist = getDist()
        if (currentDist > ATTACK_RANGE) {
          setActionLog('상대 공격 빗나감!')
          returnToIdle(opponentRef.current, opponent?.type || 'W')
          aiCooldownRef.current = false
          return
        }
        const hitAnims = { jab: 'hit_head', cross: 'hit_head', hook: 'hit_head', highKick: 'hit_head', lowKick: 'hit_leg' }
        playAnim(playerRef.current, hitAnims[move] || 'hit_head')
        playerHPRef.current = Math.max(0, playerHPRef.current - damage)
        setPlayerHP(playerHPRef.current)
        setActionLog(`${opponent?.nickname} 공격! -${damage}`)
        if (playerHPRef.current <= 0) {
          gameStateRef.current = 'ko'
          setGameState('ko')
          playAnim(playerRef.current, 'ko')
          playAnim(opponentRef.current, 'victory', true)
        }
        setTimeout(() => {
          returnToIdle(opponentRef.current, opponent?.type || 'W')
          returnToIdle(playerRef.current, player?.type || 'W')
          aiCooldownRef.current = false
        }, 1000)
      }, 400)
    }, 2500)
    return () => clearInterval(aiLoop)
  }, [])

  const handleAttack = (moveId) => {
    if (gameStateRef.current !== 'fighting') return
    if (attackCooldownRef.current) return
    if (playerStaminaRef.current < 10) return
    const dist = getDist()
    if (dist > ATTACK_RANGE) { setActionLog('거리가 너무 멀어!'); return }
    attackCooldownRef.current = true
    playerStaminaRef.current = Math.max(0, playerStaminaRef.current - 10)
    setPlayerStamina(playerStaminaRef.current)
    const hit = Math.random() > 0.25
    const damage = Math.floor(Math.random() * 15) + 8
    playAnim(playerRef.current, ANIM_MAP[moveId] || 'jab')
    setTimeout(() => {
      if (hit) {
        const hitMap = {
          jab: 'hit_head', cross: 'hit_head', hook: 'hit_head',
          highKick: 'hit_head', lowKick: 'hit_leg', bodyKick: 'hit_body',
          takedown: 'hit_takedown',
        }
        playAnim(opponentRef.current, hitMap[moveId] || 'hit_head')
        opponentHPRef.current = Math.max(0, opponentHPRef.current - damage)
        setOpponentHP(opponentHPRef.current)
        setActionLog(`${player?.nickname} 공격 적중! -${damage}`)
        if (opponentHPRef.current <= 0) {
          gameStateRef.current = 'win'
          setGameState('win')
          playAnim(opponentRef.current, 'ko')
          playAnim(playerRef.current, 'victory', true)
        }
      } else {
        setActionLog('빗나감!')
      }
      setTimeout(() => {
        returnToIdle(playerRef.current, player?.type || 'W')
        returnToIdle(opponentRef.current, opponent?.type || 'W')
        playerStaminaRef.current = Math.min(100, playerStaminaRef.current + 5)
        setPlayerStamina(playerStaminaRef.current)
        attackCooldownRef.current = false
      }, 800)
    }, 300)
  }

  const typeMap = { 'G': '그래플러', 'S': '스트라이커', 'W': '웰라운더' }
  const playerTypeName = typeMap[player?.type] || '웰라운더'

  const attackButtons = {
    스트라이커: [
      { id: 'jab', label: '잽', color: 'rgba(239,68,68,0.7)' },
      { id: 'cross', label: '크로스', color: 'rgba(239,68,68,0.7)' },
      { id: 'hook', label: '훅', color: 'rgba(239,68,68,0.7)' },
      { id: 'highKick', label: '하이킥', color: 'rgba(249,115,22,0.7)' },
      { id: 'lowKick', label: '로우킥', color: 'rgba(249,115,22,0.7)' },
    ],
    그래플러: [
      { id: 'jab', label: '잽', color: 'rgba(239,68,68,0.7)' },
      { id: 'takedown', label: '테이크다운', color: 'rgba(139,92,246,0.7)' },
      { id: 'hook', label: '훅', color: 'rgba(239,68,68,0.7)' },
      { id: 'lowKick', label: '로우킥', color: 'rgba(249,115,22,0.7)' },
    ],
    웰라운더: [
      { id: 'jab', label: '잽', color: 'rgba(239,68,68,0.7)' },
      { id: 'cross', label: '크로스', color: 'rgba(239,68,68,0.7)' },
      { id: 'hook', label: '훅', color: 'rgba(239,68,68,0.7)' },
      { id: 'lowKick', label: '로우킥', color: 'rgba(249,115,22,0.7)' },
      { id: 'takedown', label: '테이크다운', color: 'rgba(139,92,246,0.7)' },
    ],
  }

  const buttons = attackButtons[playerTypeName] || attackButtons['웰라운더']

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 16px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#eab308', fontSize: 11, fontWeight: 'bold' }}>{player?.nickname}</span>
              <span style={{ color: '#9ca3af', fontSize: 10 }}>{playerHP}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${playerHP}%`, background: '#eab308', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginTop: 2 }}>
              <div style={{ height: '100%', width: `${playerStamina}%`, background: '#22c55e', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          </div>
          <span style={{ color: '#eab308', fontWeight: 900, fontSize: 14 }}>VS</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#9ca3af', fontSize: 10 }}>{opponentHP}</span>
              <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 'bold' }}>{opponent?.nickname}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${opponentHP}%`, background: '#ef4444', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
      </div>

      {actionLog && (
        <div style={{
          position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 16px',
          borderRadius: 20, fontSize: 12, fontWeight: 'bold', whiteSpace: 'nowrap',
        }}>
          {actionLog}
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '16px 24px 32px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <Joystick onMove={(v) => { joystickRef.current = v }} side="left" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {buttons.slice(0, 2).map(btn => (
              <ActionButton key={btn.id} label={btn.label} color={btn.color}
                onPress={() => handleAttack(btn.id)}
                disabled={gameState !== 'fighting' || playerStamina < 10}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {buttons.slice(2).map(btn => (
              <ActionButton key={btn.id} label={btn.label} color={btn.color}
                onPress={() => handleAttack(btn.id)}
                disabled={gameState !== 'fighting' || playerStamina < 10}
              />
            ))}
          </div>
        </div>
      </div>

      {(gameState === 'ko' || gameState === 'win') && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <p style={{ fontSize: 64 }}>{gameState === 'win' ? '🏆' : '💀'}</p>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>
            {gameState === 'win' ? `${player?.nickname} 승리!` : `${opponent?.nickname} 승리`}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={() => navigate('/rising-star/fight')}
              style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              다시 선택
            </button>
            <button onClick={() => navigate('/rising-star')}
              style={{ padding: '12px 24px', background: '#eab308', borderRadius: 12, color: '#000', fontWeight: 900, cursor: 'pointer', border: 'none' }}>
              홈으로
            </button>
          </div>
        </div>
      )}
    </div>
  )
}