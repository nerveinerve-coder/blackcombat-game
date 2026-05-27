import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

const ANIM_MAP = {
  // 기본 자세 (타입별)
  idle_G: 'idle_grappler',
  idle_S: 'idle_striker',
  idle_W: 'idle_wellounder',
  // 공격
  jab: 'jab',
  cross: 'straight',
  straight: 'straight',
  hook: 'hook',
  highKick: 'kick_high',
  bodyKick: 'kick_body',
  lowKick: 'kick_low',
  kneeKick: 'kick_knee',
  elbow: 'elbow',
  elbowUpper: 'elbow_upper',
  comboJabElbow: 'combo_jab_elbow',
  comboElbowUppercut: 'combo_elbow_uppercut',
  takedown: 'takedown_attack',
  takedownSpecial: 'takedown_attack_special',
  submission: 'takedown_attack',
  armbar: 'takedown_attack_special',
  rearNakedChoke: 'takedown_attack_special',
  clinch: 'takedown_attack',
  // 피격
  hit_head: 'hit_head',
  hit_body: 'hit_body',
  hit_leg: 'hit_leg',
  hit_takedown: 'hit_takedown',
  hit_takedown_special: 'hit_takedown_special',
  // 넉다운
  knockdown_forward: 'knockdown_forward',
  knockdown_backward: 'knockdown_backward',
  knockdown_liver: 'knockdown_liver',
  getting_up: 'getting_up',
  ko: 'ko',
  // 방어
  guard: 'idle_striker',
  evade: 'idle_striker',
  // 승패
  victory: 'victory',
  defeat: 'defeat',
}

// 공격 → 피격 부위 매핑
const HIT_REACTION = {
  jab: 'hit_head', cross: 'hit_head', straight: 'hit_head',
  hook: 'hit_head', highKick: 'hit_head', elbow: 'hit_head',
  elbowUpper: 'hit_head', comboJabElbow: 'hit_head', comboElbowUppercut: 'hit_head',
  bodyKick: 'hit_body', kneeKick: 'hit_body', clinch: 'hit_body',
  lowKick: 'hit_leg',
  takedown: 'hit_takedown',
  takedownSpecial: 'hit_takedown_special',
  submission: 'hit_takedown_special',
  armbar: 'hit_takedown_special',
  rearNakedChoke: 'hit_takedown_special',
}

const KNOCKDOWN_REACTION = {
  jab: 'knockdown_backward', cross: 'knockdown_backward', straight: 'knockdown_backward',
  hook: 'knockdown_forward', highKick: 'knockdown_backward', elbow: 'knockdown_backward',
  elbowUpper: 'knockdown_backward',
  bodyKick: 'knockdown_liver', kneeKick: 'knockdown_liver', clinch: 'knockdown_liver',
  lowKick: 'knockdown_forward',
  takedown: 'hit_takedown', takedownSpecial: 'hit_takedown',
}

const gltfCache = {}
const loadGLTF = (url) => {
  if (!gltfCache[url]) {
    gltfCache[url] = new Promise((resolve) => {
      new GLTFLoader().load(url, resolve)
    })
  }
  return gltfCache[url]
}

export default function Fight3DScene({ playerState, opponentState, playerType = 'W', opponentType = 'W', lastEvent, playerData, opponentData }) {
  const mountRef = useRef()
  const stateRef = useRef({ playerState, opponentState, playerType, opponentType, lastEvent, playerData, opponentData })
  const renderRef = useRef({ ready: false })
  const fightersRef = useRef({})

  useEffect(() => {
    stateRef.current = { playerState, opponentState, playerType, opponentType, lastEvent, playerData, opponentData }
  }, [playerState, opponentState, playerType, opponentType, lastEvent])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 1, 10000)
    camera.position.set(0, 100, 420)
    camera.lookAt(0, 60, 0)

    // 조명
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const spotlight = new THREE.SpotLight(0xffffff, 2)
    spotlight.position.set(0, 500, 200)
    spotlight.angle = 0.4
    spotlight.penumbra = 0.5
    scene.add(spotlight)

    // 왼쪽(플레이어) 노란 조명
    const leftLight = new THREE.PointLight(0xffcc00, 1.2, 600)
    leftLight.position.set(-200, 200, 150)
    scene.add(leftLight)

    // 오른쪽(상대) 빨간 조명
    const rightLight = new THREE.PointLight(0xff3300, 1.2, 600)
    rightLight.position.set(200, 200, 150)
    scene.add(rightLight)

    // 바닥
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(800, 500),
      new THREE.MeshStandardMaterial({ color: 0x1a1209, roughness: 0.9 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -120
    scene.add(floor)

    // 바닥 원
    const circle = new THREE.Mesh(
      new THREE.RingGeometry(80, 85, 64),
      new THREE.MeshStandardMaterial({ color: 0xffffff, opacity: 0.1, transparent: true })
    )
    circle.rotation.x = -Math.PI / 2
    circle.position.y = -119
    scene.add(circle)

    const setupFighter = (gltf, side) => {
      const cloned = SkeletonUtils.clone(gltf.scene)
      const mixer = new THREE.AnimationMixer(cloned)
      const actions = {}

      gltf.animations.forEach(clip => {
        actions[clip.name] = mixer.clipAction(clip.clone(), cloned)
      })

      const group = new THREE.Group()
      group.add(cloned)
      // 키에 따른 스케일 (170cm 기준)
      const fighterData = side === 'left' ? stateRef.current.playerData : stateRef.current.opponentData
      const height = fighterData?.height || 170
      const scale = 120 * (height / 170)
      group.scale.set(scale, scale, scale)
      group.position.x = side === 'left' ? -120 : 120
      group.position.y = -120
      // 서로 마주보게
      group.rotation.y = side === 'left' ? Math.PI / 2 + Math.PI / 12 : -(Math.PI / 2 + Math.PI / 12)
      scene.add(group)

      const type = side === 'left' ? stateRef.current.playerType : stateRef.current.opponentType
      const idleKey = `idle_${type}`
      const idleAnim = ANIM_MAP[idleKey] || 'idle_wellounder'
      const idle = actions[idleAnim] || actions['idle_striker'] || Object.values(actions)[0]

      if (idle) {
        idle.setLoop(THREE.LoopRepeat, Infinity)
        idle.play()
      }

      fightersRef.current[side] = {
        mixer, actions, currentAction: idle,
        group, idleAnim, isKnocked: false,
      }
    }

    const getModelUrl = (fighterData) => {
      return fighterData?.weightClass === '여성 아톰급' ? '/fighter.glb' : '/ybot.glb'
    }

    const leftUrl = getModelUrl(stateRef.current.playerData)
    const rightUrl = getModelUrl(stateRef.current.opponentData)

    Promise.all([loadGLTF(leftUrl), loadGLTF(rightUrl)]).then(([leftGltf, rightGltf]) => {
      setupFighter(leftGltf, 'left')
      setupFighter(rightGltf, 'right')
      renderRef.current.ready = true
    })

    const playAnim = (side, animName, loop = false) => {
      const f = fightersRef.current[side]
      if (!f) return
      const anim = f.actions[animName]
      if (!anim || anim === f.currentAction) return

      f.currentAction?.fadeOut(0.1)
      anim.reset().fadeIn(0.1)
      anim.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, 1)
      anim.clampWhenFinished = !loop
      anim.play()
      f.currentAction = anim

      // 비루프 애니메이션은 끝나면 idle로 복귀
      if (!loop) {
        const duration = anim.getClip().duration * 1000
        setTimeout(() => {
          const fighter = fightersRef.current[side]
          if (!fighter || fighter.currentAction !== anim) return
          const idleAnim = fighter.actions[fighter.idleAnim] || Object.values(fighter.actions)[0]
          if (idleAnim) {
            anim.fadeOut(0.2)
            idleAnim.reset().fadeIn(0.2).setLoop(THREE.LoopRepeat, Infinity).play()
            fighter.currentAction = idleAnim
          }
        }, duration - 100)
      }
    }

    const handleEvent = (event) => {
      if (!event || !renderRef.current.ready) return

      const attackSide = event.attacker === 'player' ? 'left' : 'right'
      const defendSide = event.attacker === 'player' ? 'right' : 'left'

      if (event.type === 'attack' || event.type === 'knockdown' || event.type === 'ko') {
        // 공격 애니메이션
        const attackAnim = ANIM_MAP[event.action] || 'jab'
        playAnim(attackSide, attackAnim)

        // 파이터 이동 (앞으로)
        const attackGroup = fightersRef.current[attackSide]?.group
        if (attackGroup) {
          const dir = attackSide === 'left' ? 1 : -1
          attackGroup.position.x += dir * 30
          setTimeout(() => { if (attackGroup) attackGroup.position.x -= dir * 30 }, 300)
        }

        // 피격/넉다운 애니메이션
        setTimeout(() => {
          if (event.result === 'hit') {
            const hitAnim = HIT_REACTION[event.action] || 'hit_head'
            playAnim(defendSide, hitAnim)

            // 맞는 파이터 뒤로 밀림
            const defendGroup = fightersRef.current[defendSide]?.group
            if (defendGroup) {
              const dir = defendSide === 'left' ? -1 : 1
              defendGroup.position.x += dir * 15
              setTimeout(() => { if (defendGroup) defendGroup.position.x -= dir * 15 }, 200)
            }
          } else if (event.result === 'knockdown') {
            const kdAnim = KNOCKDOWN_REACTION[event.action] || 'knockdown_backward'
            playAnim(defendSide, kdAnim)
            fightersRef.current[defendSide].isKnocked = true

            // 넉다운 후 일어나기 (KO 아니면)
            if (!event.isKO) {
              setTimeout(() => {
                playAnim(defendSide, 'getting_up')
                setTimeout(() => {
                  fightersRef.current[defendSide].isKnocked = false
                }, 1500)
              }, 2000)
            }
          }
        }, 250)

        // KO
        if (event.isKO) {
          setTimeout(() => {
            playAnim(attackSide, 'victory')
            playAnim(defendSide, event.action === 'takedown' || event.action === 'submission' ? 'hit_takedown' : 'ko')
          }, 500)
        }

      } else if (event.type === 'miss') {
        const attackAnim = ANIM_MAP[event.action] || 'jab'
        playAnim(attackSide, attackAnim)

        // 회피
        setTimeout(() => {
          playAnim(defendSide, 'idle_striker')
          const defendGroup = fightersRef.current[defendSide]?.group
          if (defendGroup) {
            const dir = defendSide === 'left' ? -1 : 1
            defendGroup.position.x += dir * 20
            setTimeout(() => { if (defendGroup) defendGroup.position.x -= dir * 20 }, 300)
          }
        }, 200)

      } else if (event.type === 'block') {
        const type = defendSide === 'left' ? stateRef.current.playerType : stateRef.current.opponentType
        playAnim(defendSide, `idle_${type}`)
      }
    }

    const clock = new THREE.Clock()
    let animId
    let prevEvent = null

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const delta = clock.getDelta()

      // 새 이벤트 감지
      const currentEvent = stateRef.current.lastEvent
      if (currentEvent && currentEvent !== prevEvent) {
        handleEvent(currentEvent)
        prevEvent = currentEvent
      }

      // 타입 변경시 idle 업데이트
      const lf = fightersRef.current.left
      const rf = fightersRef.current.right
      if (lf) {
        const newIdle = ANIM_MAP[`idle_${stateRef.current.playerType}`] || 'idle_wellounder'
        if (lf.idleAnim !== newIdle) lf.idleAnim = newIdle
      }
      if (rf) {
        const newIdle = ANIM_MAP[`idle_${stateRef.current.opponentType}`] || 'idle_wellounder'
        if (rf.idleAnim !== newIdle) rf.idleAnim = newIdle
      }

      lf?.mixer.update(delta)
      rf?.mixer.update(delta)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      fightersRef.current.left?.mixer.stopAllAction()
      fightersRef.current.right?.mixer.stopAllAction()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '280px', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(180deg, #050505 0%, #1a0505 60%, #2a1000 100%)'
    }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* 선수 사진 + 이름 */}
      <div style={{ position: 'absolute', bottom: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <img src={playerData?.img} alt={playerData?.nickname}
          style={{ width: '36px', height: '36px', objectFit: 'cover', objectPosition: 'top', borderRadius: '50%', border: '2px solid #eab308' }}
          onError={e => e.target.style.display = 'none'}
        />
        <span style={{ color: '#eab308', fontSize: '11px', fontWeight: 'bold', textShadow: '0 1px 3px #000' }}>
          {playerData?.nickname}
        </span>
      </div>

      <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexDirection: 'row-reverse' }}>
        <img src={opponentData?.img} alt={opponentData?.nickname}
          style={{ width: '36px', height: '36px', objectFit: 'cover', objectPosition: 'top', borderRadius: '50%', border: '2px solid #ef4444' }}
          onError={e => e.target.style.display = 'none'}
        />
        <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 'bold', textShadow: '0 1px 3px #000' }}>
          {opponentData?.nickname}
        </span>
      </div>
    </div>
  )
}