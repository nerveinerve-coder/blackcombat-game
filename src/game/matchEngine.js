import { MOVES, TYPE_MOVES } from './moves.js'

// 데미지 계산
const calcDamage = (move, attacker, defender) => {
  const isStrike = move.type === 'strike'
  const attackStat = isStrike ? attacker.stats.sPower : attacker.stats.gPower
  const defenseStat = isStrike ? defender.stats.sDefense : defender.stats.gDefense
  const speedBonus = attacker.stats.sSpeed > defender.stats.sSpeed ? 1.12 : 0.92
  const randomFactor = 0.85 + Math.random() * 0.3
  const base = (move.power * attackStat) / 100
  const reduction = defenseStat / 250
  return Math.max(3, Math.round(base * speedBonus * randomFactor * (1 - reduction)))
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

// 넉다운 여부
const isKnockdown = (move, damage, defenderHP) => {
  if (defenderHP < 25 && Math.random() < 0.3) return true
  if (damage > 30 && Math.random() < move.knockdownChance * 2) return true
  return Math.random() < move.knockdownChance
}

// AI 기술 선택
export const selectAIMove = (fighter, opponentHP, round) => {
  const availableMoves = TYPE_MOVES[fighter.type] || TYPE_MOVES['웰라운더']
  const offensiveMoves = availableMoves.filter(m => !['guard', 'evade'].includes(m))
  const defensiveMoves = ['guard', 'evade']

  // 체력 낮으면 방어 확률 증가
  const defenseChance = opponentHP < 30 ? 0.1 : 0.2

  if (Math.random() < defenseChance) {
    return MOVES[defensiveMoves[Math.floor(Math.random() * defensiveMoves.length)]]
  }

  // 파이터 타입별 선호 기술
  if (fighter.type === '그래플러' && Math.random() < 0.4) {
    const grappleMoves = offensiveMoves.filter(m => ['takedown', 'clinch', 'submission'].includes(m))
    if (grappleMoves.length > 0) {
      return MOVES[grappleMoves[Math.floor(Math.random() * grappleMoves.length)]]
    }
  }

  if (fighter.type === '스트라이커' && Math.random() < 0.5) {
    const strikeMoves = offensiveMoves.filter(m => ['jab', 'cross', 'hook', 'highKick', 'lowKick'].includes(m))
    if (strikeMoves.length > 0) {
      return MOVES[strikeMoves[Math.floor(Math.random() * strikeMoves.length)]]
    }
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
}) => {
  const events = []
  let newPlayerHP = playerHP
  let newOpponentHP = opponentHP
  let newPlayerStamina = Math.max(0, playerStamina - playerMove.stamina)
  let newPlayerMomentum = playerMomentum
  let newOpponentMomentum = opponentMomentum
  let isKO = false
  let knockdown = false

  // 플레이어 공격
  if (playerMove.type !== 'defense') {
    const hit = isHit(playerMove, player, opponent)
    if (hit) {
      const dmg = calcDamage(playerMove, player, opponent)
      const kd = isKnockdown(playerMove, dmg, newOpponentHP)
      newOpponentHP = Math.max(0, newOpponentHP - dmg)
      newPlayerMomentum = calcMomentum(newPlayerMomentum, 'hit', false)

      events.push({
        type: 'attack',
        action: playerMove.id,
        attacker: 'player',
        result: kd ? 'knockdown' : 'hit',
        damage: dmg,
        isKnockdown: kd,
        isKO: newOpponentHP <= 0,
        text: kd
          ? `💥 ${playerMove.emoji} ${player.nickname}의 ${playerMove.korean} — 넉다운!`
          : `${playerMove.emoji} ${player.nickname}의 ${playerMove.korean} → ${dmg} 데미지`,
      })

      if (newOpponentHP <= 0) {
        isKO = true
        events.push({ type: 'ko', attacker: 'player', text: `🏆 KO! ${player.nickname} 승리!` })
        return { events, newPlayerHP, newOpponentHP, newPlayerStamina, newPlayerMomentum, newOpponentMomentum, isKO }
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
    const aiMove = selectAIMove(opponent, newPlayerHP, round)
    const counterHit = isCounter(aiMove, playerMove.id)

    if (aiMove.type !== 'defense') {
      const hit = isHit(aiMove, opponent, player)
      const blocked = playerMove.id === 'guard' && hit && Math.random() < 0.6

      if (hit && !blocked) {
        const dmg = calcDamage(aiMove, opponent, player)
        const kd = isKnockdown(aiMove, dmg, newPlayerHP)
        newPlayerHP = Math.max(0, newPlayerHP - dmg)
        newOpponentMomentum = calcMomentum(newOpponentMomentum, counterHit ? 'hit' : 'hit', counterHit)

        events.push({
          type: 'attack',
          action: aiMove.id,
          attacker: 'opponent',
          result: kd ? 'knockdown' : 'hit',
          damage: dmg,
          isCounter: counterHit,
          isKnockdown: kd,
          isKO: newPlayerHP <= 0,
          text: counterHit
            ? `⚡ COUNTER! ${opponent.nickname}의 ${aiMove.korean} → ${dmg} 데미지`
            : kd
            ? `💥 ${aiMove.emoji} ${opponent.nickname}의 ${aiMove.korean} — 넉다운!`
            : `${aiMove.emoji} ${opponent.nickname}의 ${aiMove.korean} → ${dmg} 데미지`,
        })

        if (newPlayerHP <= 0) {
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
  }
}