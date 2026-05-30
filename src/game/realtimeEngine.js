import { applyWeightBonus } from '../data/fighters.js'

// ─── 기술 데이터 (기획안 v2 기준) ──────────────────────────────────
const MOVES_DATA = {
  jab_head:                  { type:'punch',   baseDmg:6,  accuracy:85, staminaCost:6,  maxStaminaLoss:0.2, zone:'head' },
  jab_body:                  { type:'punch',   baseDmg:5,  accuracy:80, staminaCost:7,  maxStaminaLoss:0.4, zone:'body' },
  straight_head:             { type:'punch',   baseDmg:10, accuracy:78, staminaCost:9,  maxStaminaLoss:0.4, zone:'head' },
  straight_body:             { type:'punch',   baseDmg:8,  accuracy:75, staminaCost:10, maxStaminaLoss:0.7, zone:'body' },
  hook_left_head:            { type:'punch',   baseDmg:14, accuracy:72, staminaCost:12, maxStaminaLoss:0.8, zone:'head' },
  hook_right_head:           { type:'punch',   baseDmg:16, accuracy:70, staminaCost:13, maxStaminaLoss:0.9, zone:'head' },
  hook_left_body:            { type:'punch',   baseDmg:12, accuracy:72, staminaCost:12, maxStaminaLoss:1.1, zone:'body' },
  hook_right_body:           { type:'punch',   baseDmg:14, accuracy:70, staminaCost:13, maxStaminaLoss:1.2, zone:'body' },
  uppercut_left_head:        { type:'punch',   baseDmg:15, accuracy:70, staminaCost:14, maxStaminaLoss:1.0, zone:'head' },
  uppercut_right_head:       { type:'punch',   baseDmg:17, accuracy:68, staminaCost:15, maxStaminaLoss:1.1, zone:'head' },
  kick_high_head:            { type:'kick',    baseDmg:22, accuracy:60, staminaCost:20, maxStaminaLoss:1.8, zone:'head' },
  kick_body:                 { type:'kick',    baseDmg:18, accuracy:75, staminaCost:17, maxStaminaLoss:1.6, zone:'body' },
  kick_leg:                  { type:'kick',    baseDmg:13, accuracy:80, staminaCost:12, maxStaminaLoss:0.9, zone:'leg'  },
  kick_knee_head:            { type:'kick',    baseDmg:20, accuracy:78, staminaCost:16, maxStaminaLoss:1.2, zone:'head' },
  kick_spinning_head:        { type:'kick',    baseDmg:26, accuracy:60, staminaCost:24, maxStaminaLoss:2.5, zone:'head' },
  kick_spinning_wheel_head:  { type:'kick',    baseDmg:34, accuracy:50, staminaCost:32, maxStaminaLoss:4.0, zone:'head' },
  smash_head:                { type:'punch',   baseDmg:32, accuracy:65, staminaCost:28, maxStaminaLoss:3.5, zone:'head' },
  combo_elbow_uppercut_head: { type:'punch',   baseDmg:30, accuracy:68, staminaCost:30, maxStaminaLoss:3.8, zone:'head' },
  takedown:                  { type:'grapple', baseDmg:6,  accuracy:70, staminaCost:26, maxStaminaLoss:2.5, zone:'takedown' },
  takedown_pounding:         { type:'grapple', baseDmg:16, accuracy:65, staminaCost:38, maxStaminaLoss:5.0, zone:'takedown' },
}

// 방어 시 스태미나 소모
const DEFENSE_COST = {
  block_head: [4, 8], block_body: [4, 8], block_leg: [4, 7], block_takedown: [10, 18],
}

// 방어해도 관통되는 데미지
const PENETRATION = {
  hook_left_head:1, hook_right_head:2,
  kick_high_head:3, kick_body:3,
  kick_spinning_head:5, kick_spinning_wheel_head:8,
  smash_head:6, combo_elbow_uppercut_head:6,
  takedown:0, takedown_pounding:4,
}

// ─── 메인 공격 계산 ────────────────────────────────────────────────
export const calculateRealtimeAttack = ({
  moveId, attacker, defender,
  defenseState = null,
  attackerStamina = { current: 200, max: 200 },
}) => {
  const move = MOVES_DATA[moveId]
  if (!move) return { hit: false, blocked: false, damage: 0, headDmg: 0, bodyDmg: 0, legDmg: 0, staminaCost: 0, maxStaminaLoss: 0, hitZone: 'head', resultType: 'miss' }

  const atk = applyWeightBonus(attacker, defender)
  const def = applyWeightBonus(defender, attacker)
  const atkStats = atk.stats || {}
  const defStats = def.stats || {}

  // 스피드 기반 명중률
  let atkSpeed, defSpeed
  if (move.type === 'punch') { atkSpeed = atkStats.punchSpeed||80; defSpeed = defStats.punchSpeed||80 }
  else if (move.type === 'kick') { atkSpeed = atkStats.kickSpeed||80; defSpeed = defStats.kickSpeed||80 }
  else { atkSpeed = atkStats.tdSpeed||80; defSpeed = defStats.tdDefense||80 }

  // 스태미나 낮을수록 명중률 패널티
  const cur = attackerStamina.current
  const stamPenalty = cur < 40 ? -15 : cur < 60 ? -10 : cur < 80 ? -5 : 0

  const finalAccuracy = Math.min(95, Math.max(15, move.accuracy + (atkSpeed - defSpeed) * 0.2 + stamPenalty))
  const hit = Math.random() * 100 < finalAccuracy

  // 빗나감
  if (!hit) return {
    hit: false, blocked: false, damage: 0, headDmg: 0, bodyDmg: 0, legDmg: 0,
    staminaCost: Math.round(move.staminaCost * 1.7),
    maxStaminaLoss: move.maxStaminaLoss * 1.8,
    hitZone: move.zone, resultType: 'miss',
  }

  // 방어 체크
  const blocked = defenseState && (
    (defenseState === 'block_head'     && move.zone === 'head') ||
    (defenseState === 'block_body'     && move.zone === 'body') ||
    (defenseState === 'block_leg'      && move.zone === 'leg')  ||
    (defenseState === 'block_takedown' && move.zone === 'takedown')
  )

  if (blocked) {
    const [min, max] = DEFENSE_COST[defenseState] || [4, 8]
    const pen = PENETRATION[moveId] || 0
    return {
      hit: true, blocked: true, damage: pen,
      headDmg: move.zone === 'head' ? pen : 0,
      bodyDmg: move.zone === 'body' ? pen : 0,
      legDmg:  move.zone === 'leg'  ? pen : 0,
      staminaCost: Math.round(move.staminaCost * 1.15),
      maxStaminaLoss: move.maxStaminaLoss * 1.2,
      defenseStaminaCost: Math.floor(Math.random() * (max - min + 1)) + min,
      hitZone: move.zone, resultType: 'blocked',
    }
  }

  // 클린 히트 - 파워/맷집/체력 반영
  let atkPower
  if (move.type === 'punch') atkPower = atkStats.punchPower||80
  else if (move.type === 'kick') atkPower = atkStats.kickPower||80
  else atkPower = atkStats.tdPower||80

  const chin = defStats.chin || 80
  const stamEndurance = atkStats.stamina || 80
  const isLowStam = cur <= 40

  const powerMod = atkPower / 80
  const chinMod = chin / 80
  const damage = Math.max(1, Math.round(move.baseDmg * powerMod / chinMod))

  const staminaMod = (80 / stamEndurance) * (isLowStam ? 1.3 : 1.0)
  const maxStamMod = isLowStam ? 1.5 : 1.0

  return {
    hit: true, blocked: false, damage,
    headDmg: move.zone === 'head' ? damage : 0,
    bodyDmg: move.zone === 'body' ? damage : 0,
    legDmg:  move.zone === 'leg'  ? damage : 0,
    staminaCost: Math.round(move.staminaCost * staminaMod),
    maxStaminaLoss: move.maxStaminaLoss * maxStamMod,
    hitZone: move.zone, resultType: 'cleanHit',
  }
}

// ─── 스태미나 회복 (초당) ────────────────────────────────────────────
export const calcStaminaRecovery = ({ stamina, isMoving, isGuarding, isAttacking, recovery }) => {
  if (isAttacking || stamina.current >= stamina.max) return stamina
  const recovMod = (recovery || 80) / 80
  let basePerSec
  if (isGuarding) basePerSec = 4
  else if (isMoving) basePerSec = 8
  else basePerSec = 18
  const perFrame = (basePerSec * recovMod) / 60
  return { ...stamina, current: Math.min(stamina.max, stamina.current + perFrame) }
}

// ─── 넉다운 조건 ────────────────────────────────────────────────────
export const checkKnockdown = ({ damage, zone, defenderStamina, knockdownCount }) => {
  if (zone === 'leg' || zone === 'takedown') return false
  if (damage >= 30) return true
  if (defenderStamina.current < 40 && damage >= 24) return true
  if (knockdownCount >= 1 && damage >= 25) return true
  return false
}

// ─── KO/TKO 조건 ────────────────────────────────────────────────────
export const checkFinish = ({ headHP, bodyHP, legHP, knockdownCount }) => {
  if (headHP <= 0 || bodyHP <= 0) return 'KO'
  if (knockdownCount >= 2) return 'KO'
  if (legHP <= 0) return 'TKO'
  return null
}

// ─── Submission 조건 ────────────────────────────────────────────────
export const checkSubmission = ({ zone, defenderStamina, takedownCount }) => {
  if (zone !== 'takedown') return false
  if (defenderStamina.current <= 10) return true
  if (defenderStamina.current <= 25 && defenderStamina.max <= 80) return true
  if (takedownCount >= 3 && defenderStamina.current <= 30) return true
  return false
}

// ─── 라운드 종료 후 회복 ────────────────────────────────────────────
export const calcRoundRecovery = ({ hp, stamina, knockedDown, takedownsReceived, missCount }) => {
  // 스태미나 회복량
  let maxStamRecovery = 22
  if (hp.body <= 70) maxStamRecovery -= 4
  if (hp.body <= 50) maxStamRecovery -= 8
  if (hp.body <= 30) maxStamRecovery -= 14
  if (knockedDown) maxStamRecovery -= 6
  if (takedownsReceived >= 2) maxStamRecovery -= 6
  if (missCount >= 15) maxStamRecovery -= 5

  const newMax = Math.min(200, stamina.max + maxStamRecovery)
  const newCurrent = newMax // 최대치까지 회복

  // HP 회복
  const headRecovery = knockedDown ? 8 : 15
  const bodyRecovery = knockedDown ? 5 : 10

  return {
    hp: {
      head: Math.min(100, hp.head + headRecovery),
      body: Math.min(100, hp.body + bodyRecovery),
      leg: Math.min(100, hp.leg + 5),
    },
    stamina: { current: newCurrent, max: newMax },
  }
}

// ─── 판정 점수 ────────────────────────────────────────────────────
export const calcScore = (events) => Math.round(
  (events.headDamage || 0) * 1.2 +
  (events.bodyDamage || 0) * 1.1 +
  (events.legDamage  || 0) * 0.9 +
  (events.knockdowns || 0) * 25  +
  (events.takedowns  || 0) * 12  +
  (events.specials   || 0) * 15
)