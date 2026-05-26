import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
import { useEffect, useRef, Suspense, useMemo } from 'react'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

const ANIMATION_MAP = {
  idle: 'idle',
  attack: 'jab',
  hook: 'mixamo.com',
  kick: 'kick',
  hit: 'hit_head',
  hit_body: 'hit_body',
  hit_leg: 'hit_leg',
  groggy: 'hit_head',
  ko: 'hit_leg',
  victory: 'victory',
  guard: 'idle',
  evade: 'idle',
}

function Fighter({ side, currentState, position }) {
  const { scene, animations } = useGLTF('/fighter.glb')
  const mixerRef = useRef(null)
  const actionsRef = useRef({})
  const currentActionRef = useRef(null)
  const groupRef = useRef()

  const clonedScene = useMemo(() => {
    return SkeletonUtils.clone(scene)
  }, [scene])

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(clonedScene)
    mixerRef.current = mixer

    animations.forEach(clip => {
      actionsRef.current[clip.name] = mixer.clipAction(clip, clonedScene)
    })

    const idleAction = actionsRef.current['idle']
    if (idleAction) {
      idleAction.setLoop(THREE.LoopRepeat, Infinity)
      idleAction.play()
      currentActionRef.current = idleAction
    }

    return () => {
      mixer.stopAllAction()
      mixer.uncacheRoot(clonedScene)
    }
  }, [clonedScene, animations])

  useEffect(() => {
    const animName = ANIMATION_MAP[currentState] || 'idle'
    const next = actionsRef.current[animName]
    const current = currentActionRef.current

    if (!next || next === current) return

    if (current) current.fadeOut(0.2)
    next.reset().fadeIn(0.2)

    if (['hit_head', 'hit_body', 'hit_leg', 'victory'].includes(animName)) {
      next.setLoop(THREE.LoopOnce, 1)
      next.clampWhenFinished = true
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity)
    }

    next.play()
    currentActionRef.current = next
  }, [currentState])

  useFrame((_, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta)
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#1a1209" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.8, 2.0, 64]} />
        <meshStandardMaterial color="#ffffff" opacity={0.08} transparent />
      </mesh>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={10} blur={2} far={4} />
    </group>
  )
}

function Scene({ playerState, opponentState }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[0, 8, 2]} intensity={2} angle={0.5} penumbra={0.5} castShadow />
      <pointLight position={[-3, 3, 2]} intensity={0.6} color="#ffaa44" />
      <pointLight position={[3, 3, 2]} intensity={0.6} color="#4488ff" />
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
        camera={{ position: [0, 1.2, 3.5], fov: 65 }}
        gl={{
          antialias: true,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        }}
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