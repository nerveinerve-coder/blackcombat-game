import { MOVES, TYPE_MOVES } from './moves.js'
import { WEIGHT_CLASS_ORDER, applyWeightBonus } from '../data/fighters.js'

// 체급 차이 계산
const getWeightDiff = (fighter1, fighter2) => {
  const idx1 = WEIGHT_CLASS_ORDER.indexOf(fighter1.weightClass)
  const idx2 = WEIGHT_CLASS_ORDER.indexOf(fighter2.weightClass)
  return idx1 - idx2 // 양수면 fighter1이 더 무거운 체급
}

// 데미지 계산 (능력치 기반)
const calcDamage = (move, attacker, defender) => {
  const isStrike = move.type === 'strike'
  const attackStat = isStrike ? attacker.stats.sPower : attacker.stats.gPower
  const defenseStat = isStrike ? defender.stats.sDefense : defender.stats.gDefense
  const chin = defender.stats.chin || 70
  const speedBonus = attacker.stats.sSpeed > defender.stats.sSpeed ? 1.12 : 0.92
  const randomFactor = 0.85 + Math.random() * 0.3
  const base = (move.power * attackStat) / 100
  const reduction = (defenseStat + chin) / 500
  return Math.max(3, Math.round(base * speedBonus * randomFactor * (1 - reduction)))
}

// 스태미나 소모 계산 (능력치 기반)
const calcStaminaCost = (move, fighter) => {
  const staminaStat = fighter.stats.stamina || 70
  const reduction = (staminaStat - 70) / 200 // 스태미나 높을수록 소모 감소
  return Math.max(1, Math.round(move.stamina * (1 - reduction)))
}

// 명중 여부
const isHit = (move, attacker, defender) => {
  const speedDiff = attacker.stats.sSpeed - defender.stats.sSpeed
  const hitChance = move.accuracy + speedDiff * 0.2
  return Math.random() * 100 < hitChance
}

// 카운터 여부
const isCounter = (attackerMove, defenderLastAction) => {
  if (!defenderLastAction) return false
  if (defenderLastAction === 'evade' && Math.random() < 0.35) return true
  return false
}

// 넉다운 여부 (맷집 반영 + 체급 차이 반영)
const checkKnockdown = (move, damage, defenderHP, defender, attacker) => {
  const chin = defender.stats.chin || 70
  const chinFactor = (100 - chin) / 100
  const weightDiff = getWeightDiff(attacker, defender) // 공격자가 더 무거우면 양수

  // 3체급 이상 차이면 넉다운 즉시 KO
  const instantKO = weightDiff >= 3

  if (defenderHP < 25 && Math.random() < 0.3 * (1 + chinFactor)) return { knockdown: true, instantKO }
  if (damage > 30 && Math.random() < move.knockdownChance * 2 * (1 + chinFactor)) return { knockdown: true, instantKO }
  if (Math.random() < move.knockdownChance * (1 + chinFactor)) return { knockdown: true, instantKO }
  return { knockdown: false, instantKO: false }
}

// 피격 부위 결정
const getHitZone = (moveId) => {
  const headMoves = ['jab', 'cross', 'hook', 'highKick', 'elbow', 'elbowUpper', 'straight']
  const bodyMoves = ['bodyKick', 'kneeKick', 'clinch']
  const legMoves = ['lowKick']
  const takedownMoves = ['takedown', 'submission']
  if (headMoves.includes(moveId)) return 'head'
  if (bodyMoves.includes(moveId)) return 'body'
  if (legMoves.includes(moveId)) return 'leg'
  if (takedownMoves.includes(moveId)) return 'takedown'
  return 'head'
}

// AI 기술 선택
export const selectAIMove = (fighter, opponentHP, round) => {
  const availableMoves = TYPE_MOVES[fighter.type] || TYPE_MOVES['웰라운더']
  const offensiveMoves = availableMoves.filter(m => !['guard', 'evade'].includes(m))
  const defensiveMoves = ['guard', 'evade']

  const defenseChance = opponentHP < 30 ? 0.1 : 0.2
  if (Math.random() < defenseChance) {
    return MOVES[defensiveMoves[Math.floor(Math.random() * defensiveMoves.length)]]
  }

  const typeMap = { 'G': '그래플러', 'S': '스트라이커', 'W': '웰라운더' }
  const fType = typeMap[fighter.type] || fighter.type

  if (fType === '그래플러' && Math.random() < 0.4) {
    const grappleMoves = offensiveMoves.filter(m => ['takedown', 'clinch', 'submission'].includes(m))
    if (grappleMoves.length > 0) return MOVES[grappleMoves[Math.floor(Math.random() * grappleMoves.length)]]
  }

  if (fType === '스트라이커' && Math.random() < 0.5) {
    const strikeMoves = offensiveMoves.filter(m => ['jab', 'cross', 'hook', 'highKick', 'lowKick'].includes(m))
    if (strikeMoves.length > 0) return MOVES[strikeMoves[Math.floor(Math.random() * strikeMoves.length)]]
  }

  return MOVES[offensiveMoves[Math.floor(Math.random() * offensiveMoves.length)]]
}

// 모멘텀 계산
export const calcMomentum = (prev, result, isCounterHit) => {
  let delta = 0
  if (result === 'hit') delta += isCounterHit ? 15 : 8
  if (result === 'miss') delta -= 5
  if (result === 'block') delta -= 3
  if (result === 'knockdown') delta += 25
  return Math.min(100, Math.max(0, prev + delta))
}

// 메인 전투 처리 함수
export const processTurn = ({
  playerMove,
  player,
  opponent,
  playerHP,
  opponentHP,
  playerStamina,
  playerMomentum,
  opponentMomentum,
  round,
  lastPlayerAction,
  playerKnockdowns = 0,
  opponentKnockdowns = 0,
}) => {
  const events = []

  // 체급 보정 적용
  const adjustedPlayer = applyWeightBonus(player, opponent)
  const adjustedOpponent = applyWeightBonus(opponent, player)

  let newPlayerHP = playerHP
  let newOpponentHP = opponentHP
  let newPlayerStamina = Math.max(0, playerStamina - calcStaminaCost(playerMove, adjustedPlayer))
  let newPlayerMomentum = playerMomentum
  let newOpponentMomentum = opponentMomentum
  let isKO = false
  let knockdown = false
  let newPlayerKnockdowns = playerKnockdowns
  let newOpponentKnockdowns = opponentKnockdowns

  // 플레이어 공격
  if (playerMove.type !== 'defense') {
    const hit = isHit(playerMove, adjustedPlayer, adjustedOpponent)
    if (hit) {
      const dmg = calcDamage(playerMove, adjustedPlayer, adjustedOpponent)
      const hitZone = getHitZone(playerMove.id)
      const { knockdown: kd, instantKO } = checkKnockdown(playerMove, dmg, newOpponentHP, adjustedOpponent, adjustedPlayer)
      newOpponentHP = Math.max(0, newOpponentHP - dmg)
      newPlayerMomentum = calcMomentum(newPlayerMomentum, kd ? 'knockdown' : 'hit', false)

      // 넉다운 처리
      let actualKO = false
      if (kd) {
        newOpponentKnockdowns++
        // 2번째 넉다운이거나 3체급 이상 차이면 즉시 KO
        if (newOpponentKnockdowns >= 2 || instantKO) {
          actualKO = true
          newOpponentHP = 0
        }
      }

      events.push({
        type: actualKO || newOpponentHP <= 0 ? 'ko' : kd ? 'knockdown' : 'attack',
        action: playerMove.id,
        attacker: 'player',
        result: kd ? 'knockdown' : 'hit',
        damage: dmg,
        hitZone,
        isKnockdown: kd,
        isKO: actualKO || newOpponentHP <= 0,
        instantKO,
        text: kd
          ? `💥 ${playerMove.emoji} ${player.nickname}의 ${playerMove.korean} — 넉다운!`
          : `${playerMove.emoji} ${player.nickname}의 ${playerMove.korean} → ${dmg} 데미지`,
      })

      if (actualKO || newOpponentHP <= 0) {
        isKO = true
        events.push({ type: 'ko', attacker: 'player', text: `🏆 KO! ${player.nickname} 승리!` })
        return { events, newPlayerHP, newOpponentHP, newPlayerStamina, newPlayerMomentum, newOpponentMomentum, isKO, newPlayerKnockdowns, newOpponentKnockdowns }
      }
      if (kd) knockdown = true
    } else {
      newPlayerMomentum = calcMomentum(newPlayerMomentum, 'miss', false)
      events.push({
        type: 'miss',
        action: playerMove.id,
        attacker: 'player',
        result: 'miss',
        text: `💨 ${player.nickname}의 ${playerMove.korean} — 빗나감`,
      })
    }
  } else {
    events.push({
      type: 'defense',
      action: playerMove.id,
      attacker: 'player',
      result: playerMove.id,
      text: `🛡️ ${player.nickname} ${playerMove.korean}`,
    })
  }

  // AI 반격
  if (!knockdown) {
    const aiMove = selectAIMove(adjustedOpponent, newPlayerHP, round)
    const counterHit = isCounter(aiMove, playerMove.id)

    if (aiMove.type !== 'defense') {
      const hit = isHit(aiMove, adjustedOpponent, adjustedPlayer)
      const blocked = playerMove.id === 'guard' && hit && Math.random() < 0.6

      if (hit && !blocked) {
        const dmg = calcDamage(aiMove, adjustedOpponent, adjustedPlayer)
        const hitZone = getHitZone(aiMove.id)
        const { knockdown: kd, instantKO } = checkKnockdown(aiMove, dmg, newPlayerHP, adjustedPlayer, adjustedOpponent)
        newPlayerHP = Math.max(0, newPlayerHP - dmg)
        newOpponentMomentum = calcMomentum(newOpponentMomentum, 'hit', counterHit)

        let actualKO = false
        if (kd) {
          newPlayerKnockdowns++
          if (newPlayerKnockdowns >= 2 || instantKO) {
            actualKO = true
            newPlayerHP = 0
          }
        }

        events.push({
          type: 'attack',
          action: aiMove.id,
          attacker: 'opponent',
          result: kd ? 'knockdown' : 'hit',
          damage: dmg,
          hitZone,
          isCounter: counterHit,
          isKnockdown: kd,
          isKO: actualKO || newPlayerHP <= 0,
          instantKO,
          text: counterHit
            ? `⚡ COUNTER! ${opponent.nickname}의 ${aiMove.korean} → ${dmg} 데미지`
            : kd
            ? `💥 ${aiMove.emoji} ${opponent.nickname}의 ${aiMove.korean} — 넉다운!`
            : `${aiMove.emoji} ${opponent.nickname}의 ${aiMove.korean} → ${dmg} 데미지`,
        })

        if (actualKO || newPlayerHP <= 0) {
          isKO = true
          events.push({ type: 'ko', attacker: 'opponent', text: `💀 KO... ${opponent.nickname} 승리` })
        }
      } else if (blocked) {
        newOpponentMomentum = calcMomentum(newOpponentMomentum, 'block', false)
        events.push({
          type: 'block',
          action: aiMove.id,
          attacker: 'opponent',
          result: 'block',
          text: `🛡️ ${player.nickname}이 ${aiMove.korean}을 가드로 막았다!`,
        })
      } else {
        events.push({
          type: 'miss',
          action: aiMove.id,
          attacker: 'opponent',
          result: 'miss',
          text: `💨 ${opponent.nickname}의 ${aiMove.korean} — 빗나감`,
        })
      }
    }
  }

  return {
    events,
    newPlayerHP,
    newOpponentHP,
    newPlayerStamina,
    newPlayerMomentum,
    newOpponentMomentum,
    isKO,
    newPlayerKnockdowns,
    newOpponentKnockdowns,
  }
}