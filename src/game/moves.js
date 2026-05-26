export const MOVES = {
  jab: {
    id: 'jab', name: '잽', korean: '잽',
    type: 'strike', target: 'head',
    power: 12, speed: 95, stamina: 5,
    accuracy: 85, knockdownChance: 0.02,
    emoji: '🥊',
  },
  cross: {
    id: 'cross', name: '크로스', korean: '크로스',
    type: 'strike', target: 'head',
    power: 22, speed: 75, stamina: 10,
    accuracy: 78, knockdownChance: 0.06,
    emoji: '🥊',
  },
  hook: {
    id: 'hook', name: '훅', korean: '훅',
    type: 'strike', target: 'head',
    power: 28, speed: 65, stamina: 12,
    accuracy: 72, knockdownChance: 0.10,
    emoji: '🥊',
  },
  lowKick: {
    id: 'lowKick', name: '로우킥', korean: '로우킥',
    type: 'strike', target: 'leg',
    power: 20, speed: 70, stamina: 10,
    accuracy: 80, knockdownChance: 0.03,
    emoji: '🦵',
  },
  bodyKick: {
    id: 'bodyKick', name: '바디킥', korean: '바디킥',
    type: 'strike', target: 'body',
    power: 25, speed: 65, stamina: 12,
    accuracy: 75, knockdownChance: 0.04,
    emoji: '🦵',
  },
  highKick: {
    id: 'highKick', name: '하이킥', korean: '하이킥',
    type: 'strike', target: 'head',
    power: 35, speed: 55, stamina: 15,
    accuracy: 60, knockdownChance: 0.20,
    emoji: '🦵',
  },
  takedown: {
    id: 'takedown', name: '테이크다운', korean: '테이크다운',
    type: 'grapple', target: 'body',
    power: 18, speed: 70, stamina: 18,
    accuracy: 70, knockdownChance: 0.0,
    emoji: '🤼',
  },
  clinch: {
    id: 'clinch', name: '클린치', korean: '클린치',
    type: 'grapple', target: 'body',
    power: 12, speed: 75, stamina: 10,
    accuracy: 80, knockdownChance: 0.0,
    emoji: '🤼',
  },
  submission: {
    id: 'submission', name: '서브미션', korean: '서브미션 시도',
    type: 'grapple', target: 'body',
    power: 45, speed: 50, stamina: 22,
    accuracy: 55, knockdownChance: 0.0,
    emoji: '🤼',
  },
  guard: {
    id: 'guard', name: '가드', korean: '가드',
    type: 'defense', target: 'none',
    power: 0, speed: 90, stamina: 5,
    accuracy: 100, knockdownChance: 0.0,
    emoji: '🛡️',
  },
  evade: {
    id: 'evade', name: '회피', korean: '회피',
    type: 'defense', target: 'none',
    power: 0, speed: 85, stamina: 8,
    accuracy: 100, knockdownChance: 0.0,
    emoji: '💨',
  },
}

// 파이터 타입별 사용 가능한 기술
export const TYPE_MOVES = {
  스트라이커: ['jab', 'cross', 'hook', 'lowKick', 'bodyKick', 'highKick', 'guard', 'evade'],
  그래플러: ['jab', 'cross', 'takedown', 'clinch', 'submission', 'guard', 'evade'],
  웰라운더: ['jab', 'cross', 'hook', 'lowKick', 'takedown', 'clinch', 'guard', 'evade'],
}