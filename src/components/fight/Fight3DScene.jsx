import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
import { useEffect, useRef, Suspense, useMemo } from 'react'
import * as THREE from 'three'

const ANIMATION_MAP = {
  idle: 'idle',
  attack: 'jab',
  hook: 'hook',
  kick: 'kick',
  hit: 'hit_head',
  hit_body: 'hit_body',
  hit_leg: 'hit_leg',
  groggy: 'hit_head',
  ko: 'ko',
  victory: 'victory',
  guard: 'idle',
  evade: 'idle',
}

function Fighter({ side, currentState, position }) {
  const { scene, animations } = useGLTF('/fighter.glb')
  const mixerRef = useRef()
  const actionsRef = useRef({})
  const groupRef = useRef()
  const currentActionRef = useRef(null)

  // 각 파이터마다 독립적인 씬 클론
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    // 본(Bone) 복제를 위해 SkinnedMesh 바인딩 재설정
    const boneMap = {}
    clone.traverse(node => {
      if (node.isBone) boneMap[node.name] = node
    })
    clone.traverse(node => {
      if (node.isSkinnedMesh) {
        const bones = node.skeleton.bones.map(b => boneMap[b.name] || b)
        node.skeleton = new THREE.Skeleton(bones, node.skeleton.boneInverses)
        node.bind(node.skeleton)
      }
    })
    return clone
  }, [scene])

  // 믹서 초기화
  useEffect(() => {
    const mixer = new THREE.AnimationMixer(clonedScene)
    mixerRef.current = mixer

    // 액션 등록
    animations.forEach(clip => {
      const action = mixer.clipAction(clip, clonedScene)
      actionsRef.current[clip.name] = action
    })

    console.log('사용 가능한 애니메이션:', Object.keys(actionsRef.current))

    // 기본 idle 재생
    const idleAction = actionsRef.current['idle']
    if (idleAction) {
      idleAction.setLoop(THREE.LoopRepeat, Infinity)
      idleAction.play()
      currentActionRef.current = idleAction
    } else {
      // idle 없으면 첫번째 액션 재생
      const firstKey = Object.keys(actionsRef.current)[0]
      if (firstKey) {
        actionsRef.current[firstKey].play()
        currentActionRef.current = actionsRef.current[firstKey]
      }
    }

    return () => mixer.stopAllAction()
  }, [clonedScene, animations])

  // 상태 변화에 따라 애니메이션 전환
  useEffect(() => {
    const animName = ANIMATION_MAP[currentState] || 'idle'
    const actions = actionsRef.current
    const nextAction = actions[animName]

    if (!nextAction || nextAction === currentActionRef.current) return

    const current = currentActionRef.current
    if (current) current.fadeOut(0.15)

    nextAction.reset().fadeIn(0.15)

    if (['ko', 'hit_head', 'hit_body', 'hit_leg', 'victory'].includes(animName)) {
      nextAction.setLoop(THREE.LoopOnce, 1)
      nextAction.clampWhenFinished = true
    } else {
      nextAction.setLoop(THREE.LoopRepeat, Infinity)
    }

    nextAction.play()
    currentActionRef.current = nextAction
  }, [currentState])

  // 매 프레임 믹서 업데이트
  useFrame((_, delta) => {
    mixerRef.current?.update(delta)
  })

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, side === 'right' ? Math.PI : 0, 0]}
      scale={[0.018, 0.018, 0.018]}
    >
      <primitive object={clonedScene} />
    </group>
  )
}

function CageArena() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#1a1209" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.8, 2.0, 64]} />
        <meshStandardMaterial color="#ffffff" opacity={0.1} transparent />
      </mesh>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={10} blur={2} far={4} />
    </group>
  )
}

function Scene({ playerState, opponentState }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <spotLight position={[0, 10, 2]} intensity={3} angle={0.5} penumbra={0.6} castShadow />
      <pointLight position={[-4, 4, 3]} intensity={0.8} color="#ffaa44" />
      <pointLight position={[4, 4, 3]} intensity={0.8} color="#4488ff" />

      <CageArena />

      <Fighter side="left" currentState={playerState} position={[-1.2, 0, 0]} />
      <Fighter side="right" currentState={opponentState} position={[1.2, 0, 0]} />
    </>
  )
}

export default function Fight3DScene({ playerState, opponentState }) {
  return (
    <div style={{ width: '100%', height: '280px', background: '#0a0a0a' }}>
      <Canvas
        shadows
        camera={{ position: [0, 1, 3], fov: 75 }}
        gl={{
          antialias: true,
          powerPreference: 'default',
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: false,
        }}
        frameloop="always"
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Scene playerState={playerState} opponentState={opponentState} />
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload('/fighter.glb')