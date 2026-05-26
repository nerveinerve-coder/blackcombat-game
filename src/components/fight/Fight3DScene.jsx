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

  const initFighter = (clonedScene, mixer, actions, current) => {
    animations.forEach(clip => {
      actions.current[clip.name] = mixer.current.clipAction(clip, clonedScene)
    })
    const idle = actions.current['idle']
    if (idle) {
      idle.setLoop(THREE.LoopRepeat, Infinity)
      idle.play()
      current.current = idle
    }
  }

  useEffect(() => {
    leftMixer.current = new THREE.AnimationMixer(leftScene)
    rightMixer.current = new THREE.AnimationMixer(rightScene)
    initFighter(leftScene, leftMixer, leftActions, leftCurrent)
    initFighter(rightScene, rightMixer, rightActions, rightCurrent)
    return () => {
      leftMixer.current?.stopAllAction()
      rightMixer.current?.stopAllAction()
    }
  }, [leftScene, rightScene])

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
      <group position={[-1.2, 0, 0]} scale={[0.018, 0.018, 0.018]}>
        <primitive object={leftScene} />
      </group>
      <group position={[1.2, 0, 0]} rotation={[0, Math.PI, 0]} scale={[0.018, 0.018, 0.018]}>
        <primitive object={rightScene} />
      </group>
    </>
  )
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[12, 8]} />
      <meshStandardMaterial color="#1a1209" roughness={1} metalness={0} />
    </mesh>
  )
}

function Scene({ playerState, opponentState }) {
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
        camera={{ position: [0, 1.2, 3.5], fov: 65 }}
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