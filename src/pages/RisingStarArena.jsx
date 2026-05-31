import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import { calculateRealtimeAttack, calcStaminaRecovery, checkKnockdown, checkFinish, checkSubmission, calcRoundRecovery, calcScore } from '../game/realtimeEngine.js'

const loadGLTF = (url) => new Promise(r => new GLTFLoader().load(url, r))

const FS = { IDLE:'idle', ATTACKING:'attacking', HIT:'hit', KNOCKDOWN:'knockdown', GETTING_UP:'getting_up', KO:'ko' }
const KNOCKDOWN_DIR = { knockdown_front:'front', knockdown_back:'back', hit_takedown:'back', hit_takedown_pounding:'back', counter_hit_takedown:'back', counter_hit_takedown_pounding:'back' }
const TD_COUNTER_MOVES = new Set(['uppercut_left_head','uppercut_right_head','kick_knee_head'])

const ATTACK_RANGE = 145
const TD_RANGE = 138

// ─── 발동 시간 & 우선순위 ─────────────────────────────────────────
const MOVE_ACTIVATION_MS = {
  jab_head:260, jab_body:280, straight_head:320, straight_body:340,
  hook_left_head:380, hook_right_head:400, hook_left_body:390, hook_right_body:410,
  uppercut_left_head:400, uppercut_right_head:420,
  kick_leg:420, kick_body:500, kick_high_head:560, kick_knee_head:430,
  kick_spinning_head:720, kick_spinning_wheel_head:850,
  smash_head:620, combo_elbow_uppercut_head:700,
  takedown:520, takedown_pounding:760,
}

// 기술별 개별 유효 사거리 (MIN_DIST=120 기준)
const MOVE_RANGE = {
  kick_spinning_wheel_head:192, kick_high_head:182, kick_spinning_head:178,
  kick_body:168, kick_leg:158,
  straight_head:148, straight_body:142,
  jab_head:138, jab_body:133,
  smash_head:132, combo_elbow_uppercut_head:128,
  takedown:138, takedown_pounding:138,
  kick_knee_head:128,
  hook_left_head:130, hook_right_head:130,
  hook_left_body:125, hook_right_body:125,
  uppercut_left_head:128, uppercut_right_head:128,
}

const getMoveEffectiveRange = (moveId) => MOVE_RANGE[moveId] || 138

// 높을수록 더 빠른(우선순위 높은) 기술
const calcAttackPriority = (moveId, fighter) => {
  const base = MOVE_ACTIVATION_MS[moveId] || 400
  const isKick = moveId.includes('kick')
  const isTD = moveId.includes('takedown')
  const speed = isTD ? (fighter.stats?.tdSpeed||80) : isKick ? (fighter.stats?.kickSpeed||80) : (fighter.stats?.punchSpeed||80)
  const heightBonus = ((fighter.height||170)-170)*0.3
  const speedBonus = (speed-80)*1.5
  return -(base - speedBonus - heightBonus)
}

const ANIM_MAP = {
  idle_G:'idle_grappler', idle_S:'idle_striker', idle_W:'idle_wellounder', idle_B:'idle_boxer',
  walk_forward:'walk_forward', walk_backward:'walk_backward', walk_left:'walk_left', walk_right:'walk_right',
  jab_head:'jab_head', jab_body:'jab_body', straight_head:'straight_head', straight_body:'straight_body',
  hook_left_head:'hook_left_head', hook_left_body:'hook_left_body',
  hook_right_head:'hook_right_head', hook_right_body:'hook_right_body',
  uppercut_left_head:'uppercut_left_head', uppercut_right_head:'uppercut_right_head',
  kick_high_head:'kick_high_head', kick_knee_head:'kick_knee_head',
  kick_spinning_head:'kick_spinning_head', kick_spinning_wheel_head:'kick_spinning_wheel_head',
  kick_body:'kick_body', kick_leg:'kick_leg',
  smash_head:'smash_head', combo_elbow_uppercut_head:'combo_elbow_uppercut_head',
  takedown:'takedown', takedown_pounding:'takedown_pounding',
  hit_light_head:'hit_light_head', hit_medium_head:'hit_medium_head', hit_big_head:'hit_big_head',
  hit_light_body:'hit_light_body', hit_medium_body:'hit_medium_body', hit_big_body:'hit_big_body',
  hit_light_leg:'hit_light_leg', hit_medium_leg:'hit_medium_leg', hit_big_leg:'hit_big_leg',
  hit_takedown:'hit_takedown', hit_takedown_pounding:'hit_takedown_pounding',
  no_hit_light_head:'no_hit_light_head', no_hit_big_head:'no_hit_big_head',
  no_hit_light_body:'no_hit_light_body', no_hit_big_body:'no_hit_big_body',
  no_hit_leg:'no_hit_leg', no_hit_takedown:'no_hit_takedown',
  block_head:'block_head', block_body:'block_body', block_leg:'block_leg', block_takedown:'block_takedown',
  knockdown_front:'knockdown_front', knockdown_back:'knockdown_back',
  getting_up_front:'getting_up_front', getting_up_back:'getting_up_back',
  counter_hit_takedown:'counter_hit_takedown', counter_hit_takedown_pounding:'counter_hit_takedown_pounding',
  ko:'ko', victory:'victory', defeat:'defeat',
}

const getHitAnim = (moveId, damage) => {
  const zone = MOVE_TARGET[moveId]
  if (zone==='head') return damage>=22?'hit_big_head':damage>=10?'hit_medium_head':'hit_light_head'
  if (zone==='body') return damage>=20?'hit_big_body':damage>=9?'hit_medium_body':'hit_light_body'
  if (zone==='leg')  return damage>=16?'hit_big_leg':damage>=8?'hit_medium_leg':'hit_light_leg'
  if (zone==='takedown') return 'hit_takedown'
  return 'hit_light_head'
}

const ATTACK_MAP = {
  one:    {neutral:'jab_head',up:'uppercut_left_head',left:'hook_left_head',right:'jab_body',down:'hook_left_body'},
  two:    {neutral:'straight_head',up:'uppercut_right_head',left:'hook_right_head',right:'straight_body',down:'hook_right_body'},
  kick:   {neutral:'kick_high_head',up:'kick_knee_head',left:'kick_spinning_head',right:'kick_body',down:'kick_leg'},
  grapple:{neutral:'takedown',up:'takedown',left:'takedown',right:'takedown',down:'takedown'},
}
const SPECIAL_MAP = {S:'kick_spinning_wheel_head',B:'smash_head',W:'combo_elbow_uppercut_head',G:'takedown_pounding'}
const MOVE_TARGET = {
  jab_head:'head',uppercut_left_head:'head',uppercut_right_head:'head',
  hook_left_head:'head',hook_right_head:'head',straight_head:'head',
  kick_high_head:'head',kick_knee_head:'head',kick_spinning_head:'head',
  kick_spinning_wheel_head:'head',smash_head:'head',combo_elbow_uppercut_head:'head',
  jab_body:'body',straight_body:'body',hook_left_body:'body',hook_right_body:'body',kick_body:'body',
  kick_leg:'leg',takedown:'takedown',takedown_pounding:'takedown',
}

const getJoyDir = ({x,y}) => {
  const mag=Math.sqrt(x*x+y*y); if(mag<0.3) return 'neutral'
  const a=Math.atan2(y,x)*180/Math.PI
  if(a>-45&&a<=45) return 'right'; if(a>45&&a<=135) return 'down'
  if(a>135||a<=-135) return 'left'; return 'up'
}

function Joystick({onMove,side,size=100}) {
  const stickRef=useRef(),activeRef=useRef(false),startRef=useRef({x:0,y:0})
  const maxDist=size*0.4
  const hs=e=>{activeRef.current=true;const t=e.touches?.[0]||e;startRef.current={x:t.clientX,y:t.clientY}}
  const hm=e=>{if(!activeRef.current)return;const t=e.touches?.[0]||e;const dx=t.clientX-startRef.current.x,dy=t.clientY-startRef.current.y;const dist=Math.min(Math.sqrt(dx*dx+dy*dy),maxDist);const ang=Math.atan2(dy,dx);const nx=Math.cos(ang)*dist,ny=Math.sin(ang)*dist;if(stickRef.current)stickRef.current.style.transform=`translate(${nx}px,${ny}px)`;onMove({x:nx/maxDist,y:ny/maxDist})}
  const he=()=>{activeRef.current=false;if(stickRef.current)stickRef.current.style.transform='translate(0px,0px)';onMove({x:0,y:0})}
  const sc={left:'rgba(59,130,246,0.15)',right:'rgba(255,255,255,0.1)'}
  const kc={left:'rgba(59,130,246,0.6)',right:'rgba(234,179,8,0.6)'}
  return (
    <div onTouchStart={hs} onTouchMove={hm} onTouchEnd={he} onMouseDown={hs} onMouseMove={hm} onMouseUp={he}
      style={{width:size,height:size,borderRadius:'50%',background:sc[side],border:`2px solid ${kc[side].replace('0.6','0.3')}`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',touchAction:'none',flexShrink:0}}>
      {side==='left'&&(<><span style={{position:'absolute',top:4,fontSize:8,color:'rgba(59,130,246,0.6)'}}>방어↑</span><span style={{position:'absolute',bottom:4,fontSize:8,color:'rgba(59,130,246,0.6)'}}>↓레그</span><span style={{position:'absolute',left:2,fontSize:8,color:'rgba(59,130,246,0.6)'}}>바디←</span><span style={{position:'absolute',right:2,fontSize:8,color:'rgba(59,130,246,0.6)'}}>→TD</span></>)}
      <div ref={stickRef} style={{width:size*0.44,height:size*0.44,borderRadius:'50%',background:kc[side],border:'2px solid rgba(255,255,255,0.4)',transition:'transform 0.05s',pointerEvents:'none',zIndex:1}}/>
    </div>
  )
}

function ActionButton({label,subLabel,color,onPress,onRelease,disabled}) {
  return (
    <button onTouchStart={onPress} onMouseDown={onPress} onTouchEnd={onRelease} onMouseUp={onRelease} disabled={disabled}
      style={{width:52,height:52,borderRadius:'50%',background:disabled?'rgba(100,100,100,0.3)':color,border:'2px solid rgba(255,255,255,0.3)',color:'white',fontWeight:'bold',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',touchAction:'none',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.4:1,flexShrink:0}}>
      <span style={{fontSize:14,lineHeight:1}}>{label}</span>
      {subLabel&&<span style={{fontSize:8,opacity:0.7,lineHeight:1.2}}>{subLabel}</span>}
    </button>
  )
}

const MIN_DIST=120,MOVE_SPEED_PLAYER=1.5,MOVE_SPEED_AI=0.6,CAGE_X=525,CAGE_Z=300,SPECIAL_HOLD_MS=600,ROUND_DURATION=120
const initHP=()=>({head:100,body:100,leg:100})
const initStamina=()=>({current:200,max:200})
const initEvents=()=>({headDamage:0,bodyDamage:0,legDamage:0,knockdowns:0,takedowns:0,specials:0,missCount:0})

export default function RisingStarArena() {
  const navigate=useNavigate()
  const mountRef=useRef(),rendererRef=useRef(),sceneRef=useRef(),cameraRef=useRef()
  const playerRef=useRef(),opponentRef=useRef()
  const clockRef=useRef(new THREE.Clock()),animIdRef=useRef()
  const leftJoyRef=useRef({x:0,y:0}),rightJoyRef=useRef({x:0,y:0})
  const defenseStateRef=useRef(null),buttonPressTimeRef=useRef({})
  const walkDirRef=useRef({dir:'walk_forward',count:0})
  const clashRef=useRef(null) // 동시 공격 충돌 판정 {playerWins:bool}

  const playerHPRef=useRef(initHP()),opponentHPRef=useRef(initHP())
  const playerStaminaRef=useRef(initStamina()),opponentStaminaRef=useRef(initStamina())
  const roundRef=useRef(1),roundTimeRef=useRef(ROUND_DURATION)
  const knockdownCountRef=useRef({player:0,opponent:0}),takedownCountRef=useRef({player:0,opponent:0})
  const roundEventsRef=useRef({player:initEvents(),opponent:initEvents()})
  const totalScoreRef=useRef({player:0,opponent:0})

  const [playerHP,setPlayerHP]=useState(initHP())
  const [opponentHP,setOpponentHP]=useState(initHP())
  const [playerStamina,setPlayerStamina]=useState(initStamina())
  const [opponentStamina,setOpponentStamina]=useState(initStamina())
  const [round,setRound]=useState(1),[roundTime,setRoundTime]=useState(ROUND_DURATION)
  const [gameState,setGameState]=useState('fighting')
  const [actionLog,setActionLog]=useState('')
  const [defenseDisplay,setDefenseDisplay]=useState(null)
  const [finishType,setFinishType]=useState(null),[winner,setWinner]=useState(null)

  const gameStateRef=useRef('fighting'),attackCooldownRef=useRef(false),aiCooldownRef=useRef(false)
  const player=JSON.parse(localStorage.getItem('rs_player')||'{}')
  const opponent=JSON.parse(localStorage.getItem('rs_opponent')||'{}')

  const getDist=()=>{
    if(!playerRef.current||!opponentRef.current) return 999
    const pp=playerRef.current.group.position,op=opponentRef.current.group.position
    return Math.sqrt((pp.x-op.x)**2+(pp.z-op.z)**2)
  }

  // ─── 애니메이션 함수들 ─────────────────────────────────────────

  const invalidateFighterAction = (fighterObj) => {
    if(!fighterObj) return
    fighterObj.actionToken=(fighterObj.actionToken||0)+1
    fighterObj.currentMoveId=null
    fighterObj.counterWindowActive=false
    fighterObj.queuedHitAnim=null
  }

  const playClip = (fighterObj,animName,{loop=false,state=FS.IDLE,fade=0.1,timeScale=1,onEnd,tokenGuard=false}={}) => {
    if(!fighterObj) return false
    const glbAnim=ANIM_MAP[animName]||animName
    const anim=fighterObj.actions[glbAnim]
    if(!anim) return false
    const token=fighterObj.actionToken||0
    const prev=fighterObj.currentAction
    anim.reset();anim.setEffectiveWeight(1);anim.setEffectiveTimeScale(timeScale)
    anim.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1)
    anim.clampWhenFinished=!loop;anim.play()
    if(prev&&prev!==anim) prev.fadeOut(fade)
    fighterObj.currentAction=anim
    fighterObj.currentWalkAnim=null
    fighterObj.state=state
    if(!loop&&onEnd){
      const dur=anim.getClip().duration*1000/Math.max(0.01,timeScale)
      setTimeout(()=>{
        if(tokenGuard&&fighterObj.actionToken!==token) return
        onEnd()
      },dur)
    }
    return true
  }

  // 공격: IDLE에서만 시작. actionToken으로 오래된 공격 판정을 무효화한다.
  const playAnim = (fighterObj,animName,loop=false,onEnd) => {
    if(!fighterObj) return false
    if(fighterObj.state!==FS.IDLE&&!loop) return false
    if(!loop){
      invalidateFighterAction(fighterObj)
      fighterObj.currentMoveId=animName
    }
    const token=fighterObj.actionToken||0
    return playClip(fighterObj,animName,{loop,state:loop?FS.IDLE:FS.ATTACKING,fade:0.15,tokenGuard:true,onEnd:()=>{
      if(fighterObj.actionToken!==token) return
      if(fighterObj.state===FS.ATTACKING){
        fighterObj.state=FS.IDLE
        fighterObj.currentMoveId=null
        const queued=fighterObj.queuedHitAnim
        fighterObj.queuedHitAnim=null
        if(queued) queued()
        else if(onEnd) onEnd()
      }
    }})
  }

  // 피격/방어 성공 리액션. 실제 피격은 force=true로 호출해 기존 공격 모션과 예약 판정을 즉시 끊는다.
  const playHit = (fighterObj,animName,onEnd,{force=false}={}) => {
    if(!fighterObj) return false
    if([FS.KNOCKDOWN,FS.GETTING_UP,FS.KO].includes(fighterObj.state)) return false
    if(fighterObj.state===FS.ATTACKING&&!force){
      fighterObj.queuedHitAnim=()=>playHit(fighterObj,animName,onEnd)
      return false
    }
    if(force) invalidateFighterAction(fighterObj)
    const token=fighterObj.actionToken||0
    return playClip(fighterObj,animName,{state:FS.HIT,fade:0.1,tokenGuard:true,onEnd:()=>{
      if(fighterObj.actionToken!==token) return
      if(fighterObj.state===FS.HIT){
        fighterObj.state=FS.IDLE
        if(onEnd) onEnd()
      }
    }})
  }

  // 넉다운/TD 피격: TD 계열은 상대 공격 모션과 예약된 공격 판정을 즉시 끊는 최고 우선순위 이벤트다.
  const playKnockdown = (fighterObj,animName,{force=false}={}) => {
    if(!fighterObj) return false
    if([FS.GETTING_UP,FS.KO].includes(fighterObj.state)) return false
    const isPriorityImpact=['hit_takedown','hit_takedown_pounding','counter_hit_takedown','counter_hit_takedown_pounding'].includes(animName)
    const shouldForce=force||isPriorityImpact
    if(fighterObj.state===FS.ATTACKING&&!shouldForce){
      fighterObj.queuedHitAnim=()=>playKnockdown(fighterObj,animName)
      return false
    }
    invalidateFighterAction(fighterObj)
    const dir=KNOCKDOWN_DIR[animName]||'back'
    const token=fighterObj.actionToken||0
    const played=playClip(fighterObj,animName,{state:FS.KNOCKDOWN,fade:0.08,tokenGuard:true,onEnd:()=>{
      if(fighterObj.actionToken!==token) return
      if(fighterObj.state===FS.KNOCKDOWN) fighterObj.canGetUp=true
    }})
    if(!played) return false
    fighterObj.knockdownDir=dir
    fighterObj.canGetUp=false
    fighterObj.getUpScheduled=false
    return true
  }

  const playForced = (fighterObj,animName,loop=false,onEnd) => {
    if(!fighterObj) return false
    invalidateFighterAction(fighterObj)
    return playClip(fighterObj,animName,{loop,state:FS.KO,fade:0.1,onEnd})
  }

  const returnToIdle = (fighterObj,type) => {
    if(!fighterObj||fighterObj.state!==FS.IDLE) return
    const idleAnimName=ANIM_MAP[`idle_${type}`]||'idle_striker'
    const anim=fighterObj.actions[idleAnimName]
    if(!anim||fighterObj.currentAction===anim) return
    const prev=fighterObj.currentAction
    anim.reset();anim.setEffectiveWeight(1);anim.setEffectiveTimeScale(1)
    anim.setLoop(THREE.LoopRepeat,Infinity);anim.play()
    if(prev&&prev!==anim) prev.fadeOut(0.3)
    fighterObj.currentAction=anim
  }

  const setupFighter = (gltf,side,fighterData) => {
    const cloned=SkeletonUtils.clone(gltf.scene)
    const mixer=new THREE.AnimationMixer(cloned)
    const actions={}
    gltf.animations.forEach(clip=>{actions[clip.name]=mixer.clipAction(clip.clone(),cloned)})
    const hips=cloned.getObjectByName('mixamorigHips')
    const baseHipsPosition=hips?hips.position.clone():null
    const group=new THREE.Group();group.add(cloned)
    const height=fighterData?.height||170
    const weightMap={'여성 아톰급':52,'플라이급':57,'밴텀급':61,'페더급':66,'라이트급':70,'웰터급':77,'미들급':84,'헤비급':120}
    const weight=weightMap[fighterData?.weightClass]||70
    const bmi=weight/((height/100)**2)
    const baseScale=120*(height/170),widthScale=baseScale*(0.85+(bmi-18)/80)
    group.scale.set(widthScale,baseScale,widthScale)
    group.position.x=side==='left'?-120:120;group.position.y=-120
    group.rotation.y=side==='left'?Math.PI/2+Math.PI/12:-(Math.PI/2+Math.PI/12)
    sceneRef.current.add(group)
    const type=fighterData?.type||'W'
    const idleAnimName=ANIM_MAP[`idle_${type}`]||'idle_striker'
    const idle=actions[idleAnimName]
    if(idle){idle.setLoop(THREE.LoopRepeat,Infinity);idle.play()}
    return {group,mixer,actions,currentAction:idle,type,
      state:FS.IDLE,knockdownDir:null,canGetUp:false,getUpScheduled:false,
      currentMoveId:null,counterWindowActive:false,actionToken:0,
      queuedHitAnim:null, // 공격 중 피격 큐
      currentWalkAnim:null,hips,baseHipsPosition}
  }

  const handleLeftJoyMove=(v)=>{
    leftJoyRef.current=v
    const dir=getJoyDir(v)
    const defMap={up:'block_head',left:'block_body',down:'block_leg',right:'block_takedown'}
    const nd=dir==='neutral'?null:defMap[dir]
    defenseStateRef.current=nd;setDefenseDisplay(nd)
  }

  const handleFinish=useCallback((winnerSide,type)=>{
    if(gameStateRef.current==='finished') return
    gameStateRef.current='finished';setGameState('finished');setFinishType(type);setWinner(winnerSide)
    if(winnerSide==='player'){playForced(playerRef.current,'victory',true);playForced(opponentRef.current,'ko')}
    else{playForced(opponentRef.current,'victory',true);playForced(playerRef.current,'ko')}
  },[])

  const handleRoundEnd=useCallback(()=>{
    if(gameStateRef.current!=='fighting') return
    const curRound=roundRef.current
    totalScoreRef.current.player+=calcScore(roundEventsRef.current.player)
    totalScoreRef.current.opponent+=calcScore(roundEventsRef.current.opponent)
    if(curRound>=3){
      gameStateRef.current='finished';setGameState('finished');setFinishType('판정')
      const w=totalScoreRef.current.player>=totalScoreRef.current.opponent?'player':'opponent'
      setWinner(w)
      if(w==='player'){playForced(playerRef.current,'victory',true);playForced(opponentRef.current,'defeat',true)}
      else{playForced(opponentRef.current,'victory',true);playForced(playerRef.current,'defeat',true)}
      return
    }
    gameStateRef.current='roundBreak';setGameState('roundBreak')
    setTimeout(()=>{
      const pRec=calcRoundRecovery({hp:playerHPRef.current,stamina:playerStaminaRef.current,knockedDown:knockdownCountRef.current.player>0,takedownsReceived:takedownCountRef.current.opponent,missCount:roundEventsRef.current.player.missCount})
      const oRec=calcRoundRecovery({hp:opponentHPRef.current,stamina:opponentStaminaRef.current,knockedDown:knockdownCountRef.current.opponent>0,takedownsReceived:takedownCountRef.current.player,missCount:roundEventsRef.current.opponent.missCount})
      playerHPRef.current=pRec.hp;playerStaminaRef.current=pRec.stamina
      opponentHPRef.current=oRec.hp;opponentStaminaRef.current=oRec.stamina
      setPlayerHP({...pRec.hp});setPlayerStamina({...pRec.stamina})
      setOpponentHP({...oRec.hp});setOpponentStamina({...oRec.stamina})
      knockdownCountRef.current={player:0,opponent:0};takedownCountRef.current={player:0,opponent:0}
      roundEventsRef.current={player:initEvents(),opponent:initEvents()}
      roundRef.current=curRound+1;setRound(curRound+1)
      roundTimeRef.current=ROUND_DURATION;setRoundTime(ROUND_DURATION)
      gameStateRef.current='fighting';setGameState('fighting')
    },5000)
  },[])

  // ─── 데미지 적용 헬퍼 ─────────────────────────────────────────
  const applyDamageToPlayer=(moveId,result)=>{
    const zone=result.hitZone,hk=zone==='head'?'head':zone==='body'?'body':zone==='leg'?'leg':null
    let newHP={...playerHPRef.current}; if(hk) newHP[hk]=Math.max(0,newHP[hk]-result.damage)
    playerHPRef.current=newHP;setPlayerHP({...newHP})
    if(zone==='takedown'){
      takedownCountRef.current.opponent+=1
      const pSt={current:Math.max(0,playerStaminaRef.current.current-38),max:Math.max(10,playerStaminaRef.current.max-8)}
      playerStaminaRef.current=pSt;setPlayerStamina({...pSt})
      if(checkSubmission({zone,defenderStamina:pSt,takedownCount:takedownCountRef.current.opponent})){handleFinish('opponent','Submission');return true}
      playKnockdown(playerRef.current,'hit_takedown',{force:true})
    } else if(checkKnockdown({damage:result.damage,zone,defenderStamina:playerStaminaRef.current,knockdownCount:knockdownCountRef.current.player})){
      knockdownCountRef.current.player+=1;roundEventsRef.current.opponent.knockdowns+=1
      setActionLog('💥 넉다운!')
      playKnockdown(playerRef.current,Math.random()>0.5?'knockdown_back':'knockdown_front',{force:true})
    } else {
      playHit(playerRef.current,getHitAnim(moveId,result.damage),null,{force:true})
    }
    if(hk) roundEventsRef.current.opponent[hk==='head'?'headDamage':hk==='body'?'bodyDamage':'legDamage']+=result.damage
    const finish=checkFinish({headHP:newHP.head,bodyHP:newHP.body,legHP:newHP.leg,knockdownCount:knockdownCountRef.current.player})
    if(finish){handleFinish('opponent',finish);return true}
    return false
  }

  const applyDamageToOpponent=(moveId,result)=>{
    const zone=result.hitZone,hk=zone==='head'?'head':zone==='body'?'body':zone==='leg'?'leg':null
    let newHP={...opponentHPRef.current}; if(hk) newHP[hk]=Math.max(0,newHP[hk]-result.damage)
    opponentHPRef.current=newHP;setOpponentHP({...newHP})
    if(zone==='takedown'){
      takedownCountRef.current.player+=1
      const oSt={current:Math.max(0,opponentStaminaRef.current.current-38),max:Math.max(10,opponentStaminaRef.current.max-8)}
      opponentStaminaRef.current=oSt;setOpponentStamina({...oSt})
      if(checkSubmission({zone,defenderStamina:oSt,takedownCount:takedownCountRef.current.player})){handleFinish('player','Submission');return true}
      playKnockdown(opponentRef.current,'hit_takedown',{force:true});roundEventsRef.current.player.takedowns+=1
    } else if(checkKnockdown({damage:result.damage,zone,defenderStamina:opponentStaminaRef.current,knockdownCount:knockdownCountRef.current.opponent})){
      knockdownCountRef.current.opponent+=1;roundEventsRef.current.player.knockdowns+=1
      setActionLog('💥 넉다운!')
      playKnockdown(opponentRef.current,Math.random()>0.5?'knockdown_back':'knockdown_front',{force:true})
    } else {
      playHit(opponentRef.current,getHitAnim(moveId,result.damage),null,{force:true})
    }
    if(hk) roundEventsRef.current.player[hk==='head'?'headDamage':hk==='body'?'bodyDamage':'legDamage']+=result.damage
    const finish=checkFinish({headHP:newHP.head,bodyHP:newHP.body,legHP:newHP.leg,knockdownCount:knockdownCountRef.current.opponent})
    if(finish){handleFinish('player',finish);return true}
    return false
  }

  // ─── Three.js 씬 ─────────────────────────────────────────────
  useEffect(()=>{
    const mount=mountRef.current;if(!mount)return
    const W=window.innerWidth,H=window.innerHeight
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true})
    renderer.setSize(W,H);renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5))
    mount.appendChild(renderer.domElement);rendererRef.current=renderer
    const scene=new THREE.Scene();sceneRef.current=scene
    const camera=new THREE.PerspectiveCamera(50,W/H,1,10000)
    camera.position.set(0,100,420);camera.lookAt(0,60,0);cameraRef.current=camera
    scene.add(new THREE.AmbientLight(0xffffff,0.6))
    const spot=new THREE.SpotLight(0xffffff,2);spot.position.set(0,500,200);spot.angle=0.4;spot.penumbra=0.5;scene.add(spot)
    const lL=new THREE.PointLight(0xffcc00,1.2,600);lL.position.set(-200,200,150);scene.add(lL)
    const rL=new THREE.PointLight(0xff3300,1.2,600);rL.position.set(200,200,150);scene.add(rL)
    const shape=new THREE.Shape()
    for(let i=0;i<8;i++){const a=Math.PI/8+i*(Math.PI/4);const x=CAGE_X*Math.cos(a),y=CAGE_Z*Math.sin(a);if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y)}
    shape.closePath()
    const floorGeo=new THREE.ShapeGeometry(shape)
    const floor=new THREE.Mesh(floorGeo,new THREE.MeshStandardMaterial({color:0x000000,roughness:0.9}))
    floor.rotation.x=-Math.PI/2;floor.position.y=-120;scene.add(floor)
    const edge=new THREE.LineSegments(new THREE.EdgesGeometry(floorGeo),new THREE.LineBasicMaterial({color:0xffffff,opacity:0.4,transparent:true}))
    edge.rotation.x=-Math.PI/2;edge.position.y=-119;scene.add(edge)
    const pUrl=player?.weightClass==='여성 아톰급'?'/fighter.glb':'/ybot.glb'
    const oUrl=opponent?.weightClass==='여성 아톰급'?'/fighter.glb':'/ybot.glb'
    Promise.all([loadGLTF(pUrl),loadGLTF(oUrl)]).then(([pG,oG])=>{
      playerRef.current=setupFighter(pG,'left',player)
      opponentRef.current=setupFighter(oG,'right',opponent)
    })
    const animate=()=>{
      animIdRef.current=requestAnimationFrame(animate)
      const delta=clockRef.current.getDelta()
      const joy=rightJoyRef.current,joyMag=Math.sqrt(joy.x*joy.x+joy.y*joy.y)
      if(playerRef.current?.state===FS.IDLE&&opponentRef.current&&joyMag>0.1){
        const pp=playerRef.current.group,op=opponentRef.current.group
        const nx=pp.position.x+joy.x*MOVE_SPEED_PLAYER,nz=pp.position.z+joy.y*MOVE_SPEED_PLAYER
        const dx=nx-op.position.x,dz=nz-op.position.z
        if(Math.sqrt(dx*dx+dz*dz)>=MIN_DIST){pp.position.x=nx;pp.position.z=nz}
        pp.position.x=Math.max(-CAGE_X,Math.min(CAGE_X,pp.position.x));pp.position.z=Math.max(-CAGE_Z,Math.min(CAGE_Z,pp.position.z))
        const dx2=op.position.x-pp.position.x,dz2=op.position.z-pp.position.z
        if(Math.abs(dx2)>0.01||Math.abs(dz2)>0.01) pp.rotation.y=Math.atan2(dx2,dz2)
      }
      // 플레이어 넉다운 → 오른쪽 조이스틱으로 일어나기
      if(playerRef.current?.state===FS.KNOCKDOWN&&playerRef.current?.canGetUp&&joyMag>0.3){
        const ga=playerRef.current.knockdownDir==='front'?'getting_up_front':'getting_up_back'
        const glb=ANIM_MAP[ga]||ga,anim=playerRef.current.actions[glb]
        if(anim){
          const prev=playerRef.current.currentAction
          anim.reset();anim.setEffectiveWeight(1);anim.setEffectiveTimeScale(1)
          anim.setLoop(THREE.LoopOnce,1);anim.clampWhenFinished=true;anim.play()
          if(prev&&prev!==anim)prev.fadeOut(0.1)
          playerRef.current.currentAction=anim;playerRef.current.currentWalkAnim=null
          playerRef.current.state=FS.GETTING_UP;playerRef.current.canGetUp=false;playerRef.current.knockdownDir=null
          const dur=anim.getClip().duration*1000
          setTimeout(()=>{ if(playerRef.current?.state===FS.GETTING_UP){playerRef.current.state=FS.IDLE;returnToIdle(playerRef.current,player?.type||'W')} },dur)
        }
      }
      // AI 이동
      if(opponentRef.current?.state===FS.IDLE&&playerRef.current&&gameStateRef.current==='fighting'){
        const op=opponentRef.current.group,pp=playerRef.current.group
        const dx=pp.position.x-op.position.x,dz=pp.position.z-op.position.z
        const dist=Math.sqrt(dx*dx+dz*dz)
        if(dist>ATTACK_RANGE){op.position.x+=(dx/dist)*MOVE_SPEED_AI;op.position.z+=(dz/dist)*MOVE_SPEED_AI}
        op.rotation.y=Math.atan2(pp.position.x-op.position.x,pp.position.z-op.position.z)
      }
      // AI 넉다운 → 자동 일어나기
      if(opponentRef.current?.state===FS.KNOCKDOWN&&opponentRef.current?.canGetUp&&!opponentRef.current?.getUpScheduled){
        opponentRef.current.getUpScheduled=true
        setTimeout(()=>{
          if(!opponentRef.current||opponentRef.current.state!==FS.KNOCKDOWN)return
          const ga=opponentRef.current.knockdownDir==='front'?'getting_up_front':'getting_up_back'
          const glb=ANIM_MAP[ga]||ga,anim=opponentRef.current.actions[glb]
          if(anim){
            const prev=opponentRef.current.currentAction
            anim.reset();anim.setEffectiveWeight(1);anim.setEffectiveTimeScale(1)
            anim.setLoop(THREE.LoopOnce,1);anim.clampWhenFinished=true;anim.play()
            if(prev&&prev!==anim)prev.fadeOut(0.1)
            opponentRef.current.currentAction=anim;opponentRef.current.currentWalkAnim=null
            opponentRef.current.state=FS.GETTING_UP;opponentRef.current.canGetUp=false;opponentRef.current.knockdownDir=null
            const dur=anim.getClip().duration*1000
            setTimeout(()=>{ if(opponentRef.current?.state===FS.GETTING_UP){opponentRef.current.state=FS.IDLE;opponentRef.current.getUpScheduled=false;returnToIdle(opponentRef.current,opponent?.type||'W')} },dur)
          }
        },700+Math.random()*600)
      }
      // 카메라
      if(playerRef.current&&opponentRef.current){
        const pp=playerRef.current.group.position,op=opponentRef.current.group.position
        const midX=(pp.x+op.x)/2,midZ=(pp.z+op.z)/2
        const dist=Math.sqrt((pp.x-op.x)**2+(pp.z-op.z)**2)
        const camZ=Math.max(450,dist*1.5+350)
        cameraRef.current.position.x+=(midX-cameraRef.current.position.x)*0.05
        cameraRef.current.position.z+=(midZ+camZ-cameraRef.current.position.z)*0.05
        cameraRef.current.lookAt(midX,60,midZ)
      }
      // 플레이어 walk
      if(playerRef.current?.state===FS.IDLE){
        if(opponentRef.current&&joyMag>0.1){
          const pp=playerRef.current.group,op=opponentRef.current.group
          const toOpX=op.position.x-pp.position.x,toOpZ=op.position.z-pp.position.z
          const len=Math.sqrt(toOpX*toOpX+toOpZ*toOpZ),fwdX=toOpX/len,fwdZ=toOpZ/len
          const dot=joy.x*fwdX+joy.y*fwdZ,cross=joy.x*fwdZ-joy.y*fwdX
          let cDir=Math.abs(dot)>=Math.abs(cross)?(dot>0?'walk_forward':'walk_backward'):(cross>0?'walk_left':'walk_right')
          if(cDir===walkDirRef.current.dir)walkDirRef.current.count=0
          else{walkDirRef.current.count+=1;if(walkDirRef.current.count>=10){walkDirRef.current.dir=cDir;walkDirRef.current.count=0}}
          const wan=walkDirRef.current.dir,anim=playerRef.current.actions[wan]
          if(anim){
            if(playerRef.current.currentWalkAnim!==wan){
              const prev=playerRef.current.currentAction
              if(prev&&prev!==anim)prev.fadeOut(0.15)
              anim.setEffectiveWeight(1);anim.setEffectiveTimeScale(joyMag*1.2)
              anim.reset();anim.setLoop(THREE.LoopRepeat,Infinity);anim.fadeIn(0.15);anim.play()
              playerRef.current.currentAction=anim;playerRef.current.currentWalkAnim=wan
            } else { anim.setEffectiveTimeScale(Math.max(0.3,joyMag*1.2)) }
          }
          const ns=calcStaminaRecovery({stamina:playerStaminaRef.current,isMoving:true,isGuarding:!!defenseStateRef.current,isAttacking:false,recovery:player?.stats?.recovery||80})
          playerStaminaRef.current=ns;setPlayerStamina({...ns})
        } else {
          if(playerRef.current.currentWalkAnim){playerRef.current.currentWalkAnim=null;returnToIdle(playerRef.current,player?.type||'W')}
          const ns=calcStaminaRecovery({stamina:playerStaminaRef.current,isMoving:false,isGuarding:!!defenseStateRef.current,isAttacking:false,recovery:player?.stats?.recovery||80})
          playerStaminaRef.current=ns;setPlayerStamina({...ns})
        }
      }
      // AI walk
      if(opponentRef.current?.state===FS.IDLE&&playerRef.current){
        const op=opponentRef.current.group,pp=playerRef.current.group
        const dist=Math.sqrt((pp.position.x-op.position.x)**2+(pp.position.z-op.position.z)**2)
        if(dist>ATTACK_RANGE){
          const wa=opponentRef.current.actions['walk_forward']
          if(wa&&opponentRef.current.currentWalkAnim!=='walk_forward'){
            const prev=opponentRef.current.currentAction
            wa.setEffectiveWeight(1);wa.setEffectiveTimeScale(1);wa.reset().play();wa.setLoop(THREE.LoopRepeat,Infinity)
            if(prev&&prev!==wa)prev.crossFadeTo(wa,0.3,false)
            opponentRef.current.currentAction=wa;opponentRef.current.currentWalkAnim='walk_forward'
          }
          const ns=calcStaminaRecovery({stamina:opponentStaminaRef.current,isMoving:true,isGuarding:false,isAttacking:false,recovery:opponent?.stats?.recovery||80})
          opponentStaminaRef.current=ns;setOpponentStamina({...ns})
        } else {
          if(opponentRef.current.currentWalkAnim){opponentRef.current.currentWalkAnim=null;returnToIdle(opponentRef.current,opponent?.type||'W')}
          const ns=calcStaminaRecovery({stamina:opponentStaminaRef.current,isMoving:false,isGuarding:false,isAttacking:false,recovery:opponent?.stats?.recovery||80})
          opponentStaminaRef.current=ns;setOpponentStamina({...ns})
        }
      }
      playerRef.current?.mixer.update(delta);opponentRef.current?.mixer.update(delta)
      // KNOCKDOWN/GETTING_UP 상태에서는 힙 위치 고정 해제 (바닥에 쓰러져야 함)
      if(playerRef.current?.hips&&playerRef.current?.baseHipsPosition&&
         playerRef.current.state!==FS.KNOCKDOWN&&playerRef.current.state!==FS.GETTING_UP)
        playerRef.current.hips.position.copy(playerRef.current.baseHipsPosition)
      if(opponentRef.current?.hips&&opponentRef.current?.baseHipsPosition&&
         opponentRef.current.state!==FS.KNOCKDOWN&&opponentRef.current.state!==FS.GETTING_UP)
        opponentRef.current.hips.position.copy(opponentRef.current.baseHipsPosition)
      renderer.render(scene,cameraRef.current)
    }
    animate()
    return ()=>{cancelAnimationFrame(animIdRef.current);renderer.dispose();if(mount.contains(renderer.domElement))mount.removeChild(renderer.domElement);playerRef.current=null;opponentRef.current=null}
  },[])

  useEffect(()=>{
    if(gameState!=='fighting')return
    const timer=setInterval(()=>{roundTimeRef.current-=1;setRoundTime(roundTimeRef.current);if(roundTimeRef.current<=0)handleRoundEnd()},1000)
    return ()=>clearInterval(timer)
  },[gameState,round])

  // ─── AI 자동 공격 ─────────────────────────────────────────────
  useEffect(()=>{
    const AI_MOVES={G:['jab_head','jab_body','kick_leg','takedown','takedown_pounding'],S:['jab_head','straight_head','kick_high_head','kick_leg','kick_body','kick_spinning_head'],B:['jab_head','straight_head','hook_left_head','hook_right_head','uppercut_left_head'],W:['jab_head','straight_head','hook_left_head','kick_body','kick_leg','takedown']}
    const aiLoop=setInterval(()=>{
      if(gameStateRef.current!=='fighting'||aiCooldownRef.current)return
      if(!opponentRef.current||opponentRef.current.state!==FS.IDLE)return
      const dist=getDist()
      const moves=(AI_MOVES[opponent?.type||'W']||AI_MOVES.W).filter(m=>dist<=getMoveEffectiveRange(m))
      if(!moves.length)return
      const moveId=moves[Math.floor(Math.random()*moves.length)]
      aiCooldownRef.current=true

      // TD 카운터 윈도우 (시작 시 300ms만 유효)
      if(moveId==='takedown'||moveId==='takedown_pounding'){
        opponentRef.current.counterWindowActive=true
        setTimeout(()=>{if(opponentRef.current)opponentRef.current.counterWindowActive=false},300)
      }

      const attackStarted=playAnim(opponentRef.current,moveId,false,()=>{
        returnToIdle(opponentRef.current,opponent?.type||'W')
      })
      if(!attackStarted){aiCooldownRef.current=false;return}
      const attackToken=opponentRef.current.actionToken
      // AI 기술별 접촉 타이밍
      const _aIsKick = moveId.includes('kick')
      const _aIsTD   = moveId.includes('takedown')
      const _aSpeed  = _aIsTD ? (opponent.stats?.tdSpeed||80) : _aIsKick ? (opponent.stats?.kickSpeed||80) : (opponent.stats?.punchSpeed||80)
      const aiHitDelay = Math.round((MOVE_ACTIVATION_MS[moveId]||280) * (80/_aSpeed))
      const result=calculateRealtimeAttack({moveId,attacker:opponent,defender:player,defenseState:defenseStateRef.current,attackerStamina:opponentStaminaRef.current})
      const ns={current:Math.max(0,opponentStaminaRef.current.current-result.staminaCost),max:Math.max(10,opponentStaminaRef.current.max-result.maxStaminaLoss)}
      opponentStaminaRef.current=ns;setOpponentStamina({...ns})

      setTimeout(()=>{
        if(!opponentRef.current||opponentRef.current.actionToken!==attackToken||opponentRef.current.state!==FS.ATTACKING){
          aiCooldownRef.current=false
          return
        }
        opponentRef.current.currentMoveId=null
        // 동시 공격: 플레이어가 우세했으면 AI 공격 무효화
        if(clashRef.current?.playerWins){
          clashRef.current=null;aiCooldownRef.current=false;return
        }
        clashRef.current=null

        if(result.blocked){
          setActionLog(`${player?.nickname} 방어 성공!`)
          const nhm={block_head:result.damage>=10?'no_hit_big_head':'no_hit_light_head',block_body:result.damage>=9?'no_hit_big_body':'no_hit_light_body',block_leg:'no_hit_leg',block_takedown:'no_hit_takedown'}
          const na=nhm[defenseStateRef.current];if(na)playHit(playerRef.current,na,null,{force:true})
          if(result.damage>0){const hk=result.hitZone==='head'?'head':result.hitZone==='body'?'body':'leg';const nh={...playerHPRef.current,[hk]:Math.max(0,playerHPRef.current[hk]-result.damage)};playerHPRef.current=nh;setPlayerHP({...nh})}
          const pSt={current:Math.max(0,playerStaminaRef.current.current-(result.defenseStaminaCost||6)),max:playerStaminaRef.current.max}
          playerStaminaRef.current=pSt;setPlayerStamina({...pSt})
        } else if(result.hit){
          setActionLog(`${opponent?.nickname} 공격! -${result.damage}`)
          applyDamageToPlayer(moveId,result)
        } else {
          setActionLog('상대 공격 빗나감!');roundEventsRef.current.opponent.missCount+=1
        }
        aiCooldownRef.current=false
      }, aiHitDelay)
    },2000+Math.random()*800)
    return ()=>clearInterval(aiLoop)
  },[])

  // ─── 플레이어 공격 ────────────────────────────────────────────
  const handleButtonPress=(buttonId)=>{buttonPressTimeRef.current[buttonId]=Date.now()}

  const handleButtonRelease=(buttonId)=>{
    if(gameStateRef.current!=='fighting')return
    if(!playerRef.current||playerRef.current.state!==FS.IDLE)return
    if(playerStaminaRef.current.current<15){setActionLog('스태미나 부족!');return}

    const holdMs=Date.now()-(buttonPressTimeRef.current[buttonId]||0)
    const leftDir=getJoyDir(leftJoyRef.current)
    const isTDMove=buttonId==='grapple'
    if(isTDMove&&getDist()>TD_RANGE){setActionLog('더 가까이!');return}

    let moveId=(holdMs>=SPECIAL_HOLD_MS&&leftDir==='left')
      ?(SPECIAL_MAP[player?.type||'W']||ATTACK_MAP[buttonId]?.[leftDir])
      :(ATTACK_MAP[buttonId]?.[leftDir]||ATTACK_MAP[buttonId]?.neutral)
    if(!moveId)return

    // ── 테이크다운 카운터 (윈도우 내 동시 사용)
    if(TD_COUNTER_MOVES.has(moveId)&&opponentRef.current?.counterWindowActive&&['takedown','takedown_pounding'].includes(opponentRef.current?.currentMoveId)){
      playAnim(playerRef.current,moveId)
      setTimeout(()=>{
        playKnockdown(opponentRef.current,'counter_hit_takedown',{force:true})
        setActionLog('💥 테이크다운 카운터!')
        aiCooldownRef.current=false
        setTimeout(()=>{if(playerRef.current?.state===FS.ATTACKING){playerRef.current.state=FS.IDLE;returnToIdle(playerRef.current,player?.type||'W');attackCooldownRef.current=false}},400)
      },200)
      return
    }

    // ── 동시 공격 우선순위 판정
    const aiIsAttacking=opponentRef.current?.state===FS.ATTACKING&&opponentRef.current?.currentMoveId
    if(aiIsAttacking){
      const playerPri=calcAttackPriority(moveId,player)
      const aiPri=calcAttackPriority(opponentRef.current.currentMoveId,opponent)
      if(playerPri>=aiPri){
        // 플레이어 우세: AI 공격 결과 무효화
        clashRef.current={playerWins:true}
        // 정상 진행 (플레이어 공격 처리)
      } else {
        // AI 우세: 플레이어 공격 모션만 재생, 데미지 없음
        clashRef.current={playerWins:false}
        playAnim(playerRef.current,moveId)
        attackCooldownRef.current=true
        // 공격 모션 완료 후 cooldown 해제 (AI 공격이 우선 처리됨)
        setTimeout(()=>{attackCooldownRef.current=false},Math.max(300,(MOVE_ACTIVATION_MS[moveId]||400)))
        return
      }
    }

    attackCooldownRef.current=true
    const result=calculateRealtimeAttack({moveId,attacker:player,defender:opponent,defenseState:null,attackerStamina:playerStaminaRef.current})
    const np={current:Math.max(0,playerStaminaRef.current.current-result.staminaCost),max:Math.max(10,playerStaminaRef.current.max-result.maxStaminaLoss)}
    playerStaminaRef.current=np;setPlayerStamina({...np})
    // 공격 모션 완전 종료 후 쿨다운 해제 (onEnd 콜백)
    const attackStarted=playAnim(playerRef.current,moveId,false,()=>{
      attackCooldownRef.current=false
      returnToIdle(playerRef.current,player?.type||'W')
    })
    if(!attackStarted){attackCooldownRef.current=false;return}
    const attackToken=playerRef.current.actionToken

    // 기술별 시각적 접촉 타이밍 계산 (스피드 능력치 반영)
    const _hIsKick = moveId.includes('kick')
    const _hIsTD   = moveId.includes('takedown')
    const _hSpeed  = _hIsTD ? (player.stats?.tdSpeed||80) : _hIsKick ? (player.stats?.kickSpeed||80) : (player.stats?.punchSpeed||80)
    const hitDelay = Math.round((MOVE_ACTIVATION_MS[moveId]||280) * (80/_hSpeed))

    setTimeout(()=>{
      if(!playerRef.current||playerRef.current.actionToken!==attackToken||playerRef.current.state!==FS.ATTACKING){
        attackCooldownRef.current=false
        return
      }
      playerRef.current.currentMoveId=null
      if(!isTDMove&&getDist()>getMoveEffectiveRange(moveId)){
        setActionLog('빗나감!');roundEventsRef.current.player.missCount+=1
        return
      }
      if(result.hit){
        setActionLog(`적중! -${result.damage}`)
        applyDamageToOpponent(moveId,result)
        const isSpecial=Object.values(SPECIAL_MAP).includes(moveId)
        if(isSpecial)roundEventsRef.current.player.specials+=1
      } else {
        setActionLog('빗나감!');roundEventsRef.current.player.missCount+=1
      }
    }, hitDelay)
  }

  const isDisabled=gameState!=='fighting'||!playerRef.current||playerStamina.current<15
  const defenseLabel={block_head:'🛡 머리 방어',block_body:'🛡 바디 방어',block_leg:'🛡 레그 방어',block_takedown:'🛡 TD 방어'}
  const fmtTime=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  return (
    <div style={{width:'100vw',height:'100vh',background:'#0a0a0a',position:'relative',overflow:'hidden'}}>
      <div ref={mountRef} style={{width:'100%',height:'100%'}}/>
      <div style={{position:'absolute',top:0,left:0,right:0,padding:'10px 14px 8px',background:'linear-gradient(180deg,rgba(0,0,0,0.85) 0%,transparent 100%)'}}>
        <div style={{textAlign:'center',marginBottom:6}}>
          <span style={{color:'#eab308',fontSize:12,fontWeight:900}}>R{round}/3</span>
          <span style={{color:'#fff',fontSize:14,fontWeight:900,marginLeft:8}}>{fmtTime(roundTime)}</span>
        </div>
        <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
          <div style={{flex:1}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{color:'#eab308',fontSize:11,fontWeight:'bold'}}>{player?.nickname}</span>
            </div>
            {[['머리',playerHP.head,'#ef4444'],['바디',playerHP.body,'#f97316'],['레그',playerHP.leg,'#22c55e']].map(([l,v,c])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}>
                <span style={{color:'rgba(255,255,255,0.4)',fontSize:8,width:20}}>{l}</span>
                <div style={{flex:1,height:4,background:'rgba(255,255,255,0.1)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${v}%`,background:c,borderRadius:2,transition:'width 0.3s'}}/>
                </div>
              </div>
            ))}
            <div style={{marginTop:3}}>
              <div style={{height:4,background:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden',position:'relative'}}>
                <div style={{position:'absolute',height:'100%',width:`${(playerStamina.max/200)*100}%`,background:'rgba(59,130,246,0.25)',borderRadius:2}}/>
                <div style={{position:'absolute',height:'100%',width:`${(playerStamina.current/200)*100}%`,background:'#3b82f6',borderRadius:2,transition:'width 0.3s'}}/>
              </div>
              <span style={{color:'rgba(255,255,255,0.35)',fontSize:7}}>{Math.round(playerStamina.current)}/{Math.round(playerStamina.max)}</span>
            </div>
          </div>
          <span style={{color:'#eab308',fontWeight:900,fontSize:12,paddingTop:2}}>VS</span>
          <div style={{flex:1}}>
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:3}}>
              <span style={{color:'#ef4444',fontSize:11,fontWeight:'bold'}}>{opponent?.nickname}</span>
            </div>
            {[['머리',opponentHP.head,'#ef4444'],['바디',opponentHP.body,'#f97316'],['레그',opponentHP.leg,'#22c55e']].map(([l,v,c])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}>
                <div style={{flex:1,height:4,background:'rgba(255,255,255,0.1)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${v}%`,background:c,borderRadius:2,transition:'width 0.3s'}}/>
                </div>
                <span style={{color:'rgba(255,255,255,0.4)',fontSize:8,width:20,textAlign:'right'}}>{l}</span>
              </div>
            ))}
            <div style={{marginTop:3}}>
              <div style={{height:4,background:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden',position:'relative'}}>
                <div style={{position:'absolute',height:'100%',width:`${(opponentStamina.max/200)*100}%`,background:'rgba(59,130,246,0.25)',borderRadius:2}}/>
                <div style={{position:'absolute',height:'100%',width:`${(opponentStamina.current/200)*100}%`,background:'#3b82f6',borderRadius:2,transition:'width 0.3s'}}/>
              </div>
              <span style={{color:'rgba(255,255,255,0.35)',fontSize:7,float:'right'}}>{Math.round(opponentStamina.current)}/{Math.round(opponentStamina.max)}</span>
            </div>
          </div>
        </div>
      </div>
      {defenseDisplay&&(<div style={{position:'absolute',top:'16%',left:'50%',transform:'translateX(-50%)',background:'rgba(59,130,246,0.8)',color:'#fff',padding:'4px 14px',borderRadius:20,fontSize:12,fontWeight:'bold'}}>{defenseLabel[defenseDisplay]}</div>)}
      {actionLog&&(<div style={{position:'absolute',top:'22%',left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.7)',color:'#fff',padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:'bold',whiteSpace:'nowrap'}}>{actionLog}</div>)}
      {gameState==='roundBreak'&&(<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}><p style={{fontSize:48}}>🔔</p><p style={{fontSize:24,fontWeight:900,color:'#eab308'}}>라운드 {round} 종료</p><p style={{fontSize:16,color:'#fff'}}>라운드 {round+1} 준비중...</p><p style={{color:'rgba(255,255,255,0.6)',fontSize:12}}>{player?.nickname}: {totalScoreRef.current.player.toFixed(0)}점 / {opponent?.nickname}: {totalScoreRef.current.opponent.toFixed(0)}점</p></div>)}
      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'8px 16px 24px',background:'linear-gradient(0deg,rgba(0,0,0,0.9) 0%,transparent 100%)'}}>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <span style={{color:'rgba(59,130,246,0.8)',fontSize:9,fontWeight:'bold'}}>타겟/방어</span>
            <Joystick onMove={handleLeftJoyMove} side="left" size={95}/>
          </div>
          <div style={{position:'relative',width:210,height:170,flexShrink:0}}>
            <div style={{position:'absolute',right:0,bottom:0,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
              <span style={{color:'rgba(234,179,8,0.8)',fontSize:9,fontWeight:'bold'}}>이동</span>
              <Joystick onMove={v=>{rightJoyRef.current=v}} side="right" size={95}/>
            </div>
            <div style={{position:'absolute',left:50,bottom:9}}><ActionButton label="1" subLabel="앞손" color="rgba(239,68,68,0.75)" onPress={()=>handleButtonPress('one')} onRelease={()=>handleButtonRelease('one')} disabled={isDisabled}/></div>
            <div style={{position:'absolute',left:64,bottom:62}}><ActionButton label="2" subLabel="뒷손" color="rgba(239,68,68,0.75)" onPress={()=>handleButtonPress('two')} onRelease={()=>handleButtonRelease('two')} disabled={isDisabled}/></div>
            <div style={{position:'absolute',left:102,bottom:100}}><ActionButton label="킥" subLabel="Kick" color="rgba(249,115,22,0.75)" onPress={()=>handleButtonPress('kick')} onRelease={()=>handleButtonRelease('kick')} disabled={isDisabled}/></div>
            <div style={{position:'absolute',left:155,bottom:114}}><ActionButton label="TD" subLabel="Grapple" color="rgba(139,92,246,0.75)" onPress={()=>handleButtonPress('grapple')} onRelease={()=>handleButtonRelease('grapple')} disabled={isDisabled}/></div>
          </div>
        </div>
      </div>
      {gameState==='finished'&&(<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14}}><p style={{fontSize:56}}>{winner==='player'?'🏆':'💀'}</p><p style={{fontSize:26,fontWeight:900,color:'#fff'}}>{winner==='player'?`${player?.nickname} 승리!`:`${opponent?.nickname} 승리`}</p><p style={{fontSize:16,color:'#eab308',fontWeight:'bold'}}>{finishType}</p>{finishType==='판정'&&(<p style={{color:'rgba(255,255,255,0.7)',fontSize:13}}>{player?.nickname} {totalScoreRef.current.player.toFixed(0)}점 / {opponent?.nickname} {totalScoreRef.current.opponent.toFixed(0)}점</p>)}<div style={{display:'flex',gap:12,marginTop:8}}><button onClick={()=>navigate('/rising-star/fight')} style={{padding:'12px 24px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:12,color:'#fff',fontWeight:'bold',cursor:'pointer'}}>다시 선택</button><button onClick={()=>navigate('/rising-star')} style={{padding:'12px 24px',background:'#eab308',borderRadius:12,color:'#000',fontWeight:900,cursor:'pointer',border:'none'}}>홈으로</button></div></div>)}
    </div>
  )
}