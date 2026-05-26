import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useEffect, useRef, Suspense, useMemo } from 'react'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

const ANIM_MAP = {
  idle: 'idle', attack: 'jab', hook: 'mixamo.com',
  kick: 'kick', hit: 'hit_head', hit_body: 'hit_body',
  hit_leg: 'hit_leg', groggy: 'hit_head', ko: 'hit_leg',
  victory: 'victory', guard: 'idle', evade: 'idle',
}

function Fighters({ playerState, opponentState }) {
  const { scene, animations } = useGLTF('/fighter.glb')

  const leftMixer = useRef()
  const rightMixer = useRef()
  const leftActions = useRef({})
  const rightActions = useRef({})
  const leftCurrent = useRef(null)
  const rightCurrent = useRef(null)

  const leftScene = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const rightScene = useMemo(() => SkeletonUtils.clone(scene), [scene])

  useEffect(() => {
    console.log('애니메이션 수:', animations.length)
    console.log('leftScene:', leftScene.type)

    leftMixer.current = new THREE.AnimationMixer(leftScene)
    rightMixer.current = new THREE.AnimationMixer(rightScene)

    animations.forEach(clip => {
      leftActions.current[clip.name] = leftMixer.current.clipAction(clip, leftScene)
      rightActions.current[clip.name] = rightMixer.current.clipAction(clip, rightScene)
    })

    const leftIdle = leftActions.current['idle']
    const rightIdle = rightActions.current['idle']

    if (leftIdle) { leftIdle.setLoop(THREE.LoopRepeat, Infinity); leftIdle.play(); leftCurrent.current = leftIdle }
    if (rightIdle) { rightIdle.setLoop(THREE.LoopRepeat, Infinity); rightIdle.play(); rightCurrent.current = rightIdle }

    return () => {
      leftMixer.current?.stopAllAction()
      rightMixer.current?.stopAllAction()
    }
  }, [leftScene, rightScene, animations])

  const switchAnim = (state, actions, current) => {
    const animName = ANIM_MAP[state] || 'idle'
    const next = actions.current[animName]
    if (!next || next === current.current) return
    current.current?.fadeOut(0.2)
    next.reset().fadeIn(0.2)
    if (['hit_head', 'hit_body', 'hit_leg', 'victory'].includes(animName)) {
      next.setLoop(THREE.LoopOnce, 1)
      next.clampWhenFinished = true
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity)
    }
    next.play()
    current.current = next
  }

  useEffect(() => { switchAnim(playerState, leftActions, leftCurrent) }, [playerState])
  useEffect(() => { switchAnim(opponentState, rightActions, rightCurrent) }, [opponentState])

  useFrame((_, delta) => {
    leftMixer.current?.update(delta)
    rightMixer.current?.update(delta)
  })

  return (
    <>
      <group position={[-1.2, 0, 0]} scale={[0.02, 0.02, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={leftScene} />
      </group>
      <group position={[1.2, 0, 0]} rotation={[-Math.PI / 2, 0, Math.PI]} scale={[0.02, 0.02, 0.02]}>
        <primitive object={rightScene} />
      </group>
    </>
  )
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[12, 8]} />
      <meshStandardMaterial color="#ff0000" roughness={1} metalness={0} />
    </mesh>
  )
}

function Scene({ playerState, opponentState }) {
  useEffect(() => {
    console.log('Scene 렌더링 완료')
  }, [])

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[0, 5, 3]} intensity={1.5} />
      <pointLight position={[-3, 3, 2]} intensity={0.5} color="#ffaa44" />
      <pointLight position={[3, 3, 2]} intensity={0.5} color="#4488ff" />
      <Floor />
      <Fighters playerState={playerState} opponentState={opponentState} />
    </>
  )
}

export default function Fight3DScene({ playerState, opponentState }) {
  return (
    <div style={{ width: '100%', height: '280px', background: '#0a0a0a' }}>
      <Canvas
        camera={{ position: [0, 2, 5], fov: 50 }}
        gl={{ antialias: true, powerPreference: 'default' }}
        dpr={[1, 1]}
      >
        <Suspense fallback={null}>
          <Scene playerState={playerState} opponentState={opponentState} />
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload('/fighter.glb')